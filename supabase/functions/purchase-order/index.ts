import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface CreatePurchaseOrderRequest {
  action: 'create';
  supplier_id?: string;
  items: PurchaseOrderItem[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number;
  other_fee?: number;
  note?: string;
  received_at?: string;
}

interface CompletePurchaseOrderRequest {
  action: 'complete';
  order_id: string;
}

interface GetPurchaseOrderRequest {
  action: 'get' | 'list';
  order_id?: string;
  page?: number;
  limit?: number;
}

type PurchaseOrderRequest = CreatePurchaseOrderRequest | CompletePurchaseOrderRequest | GetPurchaseOrderRequest;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request = await req.json() as PurchaseOrderRequest;
    console.log(`[PurchaseOrder] Action: ${request.action}`);

    switch (request.action) {
      case 'list': {
        const page = request.page || 1;
        const limit = request.limit || 50;
        const offset = (page - 1) * limit;

        // Get orders with supplier info
        const { data: orders, error: ordersError, count } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            supplier:suppliers(id, code, name)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (ordersError) throw ordersError;

        // Get items for each order to calculate total
        const ordersWithTotal = await Promise.all(
          (orders || []).map(async (order) => {
            const { data: items } = await supabase
              .from('purchase_order_items')
              .select('total_amount')
              .eq('purchase_order_id', order.id);

            const items_total = (items || []).reduce(
              (sum, item) => sum + Number(item.total_amount || 0),
              0
            );

            return { ...order, items_total };
          })
        );

        return new Response(
          JSON.stringify({
            success: true,
            data: ordersWithTotal,
            pagination: {
              page,
              limit,
              total: count || 0,
              total_pages: Math.ceil((count || 0) / limit),
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get': {
        if (!request.order_id) {
          throw new Error('order_id is required');
        }

        const { data: order, error: orderError } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            supplier:suppliers(id, code, name, phone, address)
          `)
          .eq('id', request.order_id)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!order) throw new Error('Purchase order not found');

        const { data: items, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select(`
            *,
            product:products(id, code, name, unit, stock, cost_price, sale_price_default)
          `)
          .eq('purchase_order_id', request.order_id);

        if (itemsError) throw itemsError;

        return new Response(
          JSON.stringify({
            success: true,
            data: { ...order, items: items || [] },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        const createReq = request as CreatePurchaseOrderRequest;

        if (!createReq.items || createReq.items.length === 0) {
          throw new Error('items array is required');
        }

        // Generate code
        const { data: code, error: codeError } = await supabase.rpc('generate_purchase_order_code');
        if (codeError) throw codeError;

        console.log(`[PurchaseOrder] Generated code: ${code}`);

        // Calculate items
        const itemDetails = createReq.items.map((item) => {
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unit_price);
          const discount = Number(item.discount || 0);

          if (quantity <= 0) throw new Error('Quantity must be greater than 0');
          if (unitPrice < 0) throw new Error('Unit price cannot be negative');

          const total_amount = (unitPrice * quantity) - discount;
          const import_price = total_amount / quantity;

          return {
            product_id: item.product_id,
            quantity,
            unit_price: unitPrice,
            discount,
            total_amount,
            import_price,
          };
        });

        // Calculate order totals
        const total_amount = itemDetails.reduce((sum, item) => sum + item.total_amount, 0);
        const discountType = createReq.discount_type || 'amount';
        const discountValue = Number(createReq.discount_value || 0);

        let after_discount: number;
        if (discountType === 'percent') {
          after_discount = total_amount * (1 - discountValue / 100);
        } else {
          after_discount = total_amount - discountValue;
        }

        const vatRate = Number(createReq.vat_rate || 0);
        const vat_amount = after_discount * (vatRate / 100);
        const other_fee = Number(createReq.other_fee || 0);
        const final_amount = after_discount + vat_amount + other_fee;

        if (final_amount < 0) {
          throw new Error('Final amount cannot be negative');
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('purchase_orders')
          .insert({
            code,
            supplier_id: createReq.supplier_id || null,
            total_amount,
            discount_type: discountType,
            discount_value: discountValue,
            vat_amount,
            other_fee,
            final_amount,
            status: 'draft',
            note: createReq.note || null,
            received_at: createReq.received_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create items
        const itemsToInsert = itemDetails.map((item) => ({
          ...item,
          purchase_order_id: order.id,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        console.log(`[PurchaseOrder] Created order ${code} with ${itemDetails.length} items`);

        return new Response(
          JSON.stringify({
            success: true,
            data: { ...order, items: itemDetails },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete': {
        const completeReq = request as CompletePurchaseOrderRequest;

        if (!completeReq.order_id) {
          throw new Error('order_id is required');
        }

        // Get order
        const { data: order, error: orderError } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('id', completeReq.order_id)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!order) throw new Error('Purchase order not found');

        // Validate status
        if (order.status === 'completed') {
          throw new Error('Cannot complete an already completed order');
        }

        // Get items
        const { data: items, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select('*')
          .eq('purchase_order_id', completeReq.order_id);

        if (itemsError) throw itemsError;
        if (!items || items.length === 0) {
          throw new Error('No items found in this order');
        }

        console.log(`[PurchaseOrder] Completing order ${order.code} with ${items.length} items`);

        // Process stock movements for each item
        for (const item of items) {
          // Get current product stock
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, code, name, stock, cost_price')
            .eq('id', item.product_id)
            .maybeSingle();

          if (productError) throw productError;
          if (!product) throw new Error(`Product not found: ${item.product_id}`);

          const stock_before = Number(product.stock) || 0;
          const quantity = Number(item.quantity);
          const stock_after = stock_before + quantity;

          // Calculate new weighted average cost
          const oldCost = Number(product.cost_price) || 0;
          const importPrice = Number(item.import_price) || Number(item.unit_price);
          let new_cost_price: number;

          if (stock_before > 0) {
            new_cost_price = ((stock_before * oldCost) + (quantity * importPrice)) / stock_after;
          } else {
            new_cost_price = importPrice;
          }

          // Insert stock card
          const { error: cardError } = await supabase
            .from('stock_cards')
            .insert({
              product_id: item.product_id,
              ref_code: order.code,
              ref_type: 'PN',
              transaction_type: 'IN',
              quantity,
              unit_cost: importPrice,
              stock_before,
              stock_after,
              note: `Nhập hàng từ phiếu ${order.code}`,
            });

          if (cardError) throw cardError;

          // Update product stock and cost
          const { error: updateError } = await supabase
            .from('products')
            .update({
              stock: stock_after,
              cost_price: new_cost_price,
            })
            .eq('id', item.product_id);

          if (updateError) throw updateError;

          console.log(`[PurchaseOrder] Updated stock for ${product.code}: ${stock_before} -> ${stock_after}`);
        }

        // Update order status
        const { error: statusError } = await supabase
          .from('purchase_orders')
          .update({ status: 'completed' })
          .eq('id', completeReq.order_id);

        if (statusError) throw statusError;

        console.log(`[PurchaseOrder] Order ${order.code} completed successfully`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Purchase order ${order.code} completed successfully`,
            data: { order_id: order.id, code: order.code, status: 'completed' },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${(request as any).action}`);
    }

  } catch (error) {
    console.error('[PurchaseOrder] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
