import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface CreateSalesOrderRequest {
  action: 'create';
  customer_id?: string;
  items: SalesOrderItem[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number;
  other_fee?: number;
  paid_amount: number;
  note?: string;
  sale_date?: string;
}

interface GetSalesOrderRequest {
  action: 'get' | 'list';
  order_id?: string;
  page?: number;
  limit?: number;
}

type SalesOrderRequest = CreateSalesOrderRequest | GetSalesOrderRequest;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request = await req.json() as SalesOrderRequest;
    console.log(`[SalesOrder] Action: ${request.action}`);

    switch (request.action) {
      case 'list': {
        const page = request.page || 1;
        const limit = request.limit || 50;
        const offset = (page - 1) * limit;

        const { data: orders, error: ordersError, count } = await supabase
          .from('sales_orders')
          .select(`
            *,
            customer:customers(id, code, name, phone)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (ordersError) throw ordersError;

        return new Response(
          JSON.stringify({
            success: true,
            data: orders,
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
          .from('sales_orders')
          .select(`
            *,
            customer:customers(id, code, name, phone, address)
          `)
          .eq('id', request.order_id)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!order) throw new Error('Sales order not found');

        const { data: items, error: itemsError } = await supabase
          .from('sales_order_items')
          .select(`
            *,
            product:products(id, code, name, unit)
          `)
          .eq('sales_order_id', request.order_id);

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
        const createReq = request as CreateSalesOrderRequest;

        if (!createReq.items || createReq.items.length === 0) {
          throw new Error('items array is required');
        }

        // Validate stock availability first
        for (const item of createReq.items) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, code, name, stock, cost_price, sale_price_default')
            .eq('id', item.product_id)
            .maybeSingle();

          if (productError) throw productError;
          if (!product) throw new Error(`Product not found: ${item.product_id}`);

          if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.code} (${product.name}). ` +
              `Available: ${product.stock}, Requested: ${item.quantity}`
            );
          }
        }

        // Generate code
        const { data: code, error: codeError } = await supabase.rpc('generate_sales_order_code');
        if (codeError) throw codeError;

        console.log(`[SalesOrder] Generated code: ${code}`);

        // Get product details and calculate items
        const itemDetails = await Promise.all(
          createReq.items.map(async (item) => {
            const { data: product } = await supabase
              .from('products')
              .select('cost_price')
              .eq('id', item.product_id)
              .single();

            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unit_price);
            const discount = Number(item.discount || 0);
            const costPrice = Number(product?.cost_price || 0);

            if (quantity <= 0) throw new Error('Quantity must be greater than 0');
            if (unitPrice < 0) throw new Error('Unit price cannot be negative');

            const total_amount = (unitPrice * quantity) - discount;
            const profit = total_amount - (costPrice * quantity);

            return {
              product_id: item.product_id,
              quantity,
              unit_price: unitPrice,
              discount,
              total_amount,
              cost_price: costPrice,
              profit,
            };
          })
        );

        // Calculate order totals
        const total_items = itemDetails.reduce((sum, item) => sum + item.total_amount, 0);
        const discountType = createReq.discount_type || 'amount';
        const discountValue = Number(createReq.discount_value || 0);

        let after_discount: number;
        if (discountType === 'percent') {
          after_discount = total_items * (1 - discountValue / 100);
        } else {
          after_discount = total_items - discountValue;
        }

        const vatRate = Number(createReq.vat_rate || 0);
        const vat_amount = after_discount * (vatRate / 100);
        const other_fee = Number(createReq.other_fee || 0);
        const final_amount = after_discount + vat_amount + other_fee;
        const paid_amount = Number(createReq.paid_amount);

        // Validate amounts
        if (final_amount < 0) {
          throw new Error('Final amount cannot be negative');
        }
        if (paid_amount < 0) {
          throw new Error('Paid amount cannot be negative');
        }
        if (paid_amount < final_amount) {
          throw new Error(`Paid amount (${paid_amount}) must be >= final amount (${final_amount})`);
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .insert({
            code,
            customer_id: createReq.customer_id || null,
            total_items,
            discount_type: discountType,
            discount_value: discountValue,
            after_discount,
            vat_rate: vatRate,
            vat_amount,
            other_fee,
            final_amount,
            paid_amount,
            status: 'completed',
            payment_status: 'paid',
            note: createReq.note || null,
            sale_date: createReq.sale_date || new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create items
        const itemsToInsert = itemDetails.map((item) => ({
          ...item,
          sales_order_id: order.id,
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // Process stock movements
        for (const item of itemDetails) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, code, stock')
            .eq('id', item.product_id)
            .single();

          if (productError) throw productError;

          const stock_before = Number(product.stock);
          const stock_after = stock_before - item.quantity;

          // Insert stock card
          const { error: cardError } = await supabase
            .from('stock_cards')
            .insert({
              product_id: item.product_id,
              ref_code: code,
              ref_type: 'HD',
              transaction_type: 'OUT',
              quantity: -item.quantity,
              unit_cost: item.cost_price,
              stock_before,
              stock_after,
              note: `Bán hàng từ hóa đơn ${code}`,
            });

          if (cardError) throw cardError;

          // Update product stock
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock: stock_after })
            .eq('id', item.product_id);

          if (updateError) throw updateError;

          console.log(`[SalesOrder] Updated stock for ${product.code}: ${stock_before} -> ${stock_after}`);
        }

        console.log(`[SalesOrder] Created order ${code} with ${itemDetails.length} items`);

        // Calculate total profit
        const total_profit = itemDetails.reduce((sum, item) => sum + item.profit, 0);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              ...order,
              items: itemDetails,
              total_profit,
              change: paid_amount - final_amount,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${(request as any).action}`);
    }

  } catch (error) {
    console.error('[SalesOrder] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
