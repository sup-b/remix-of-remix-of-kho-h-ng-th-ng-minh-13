import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockMovement {
  product_id: string;
  quantity: number;
  unit_cost?: number;
  ref_code: string;
  ref_type: 'PN' | 'HD'; // PN = Purchase Order, HD = Sales Order
  transaction_type: 'IN' | 'OUT';
  note?: string;
  created_by?: string;
}

interface StockServiceRequest {
  action: 'move' | 'check' | 'get_stock' | 'validate_availability';
  movements?: StockMovement[];
  product_id?: string;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request = await req.json() as StockServiceRequest;
    console.log(`[StockService] Action: ${request.action}`);

    switch (request.action) {
      case 'get_stock': {
        if (!request.product_id) {
          throw new Error('product_id is required');
        }

        const { data: product, error } = await supabase
          .from('products')
          .select('id, code, name, stock, cost_price')
          .eq('id', request.product_id)
          .maybeSingle();

        if (error) throw error;
        if (!product) throw new Error('Product not found');

        return new Response(
          JSON.stringify({ success: true, data: product }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'validate_availability': {
        if (!request.product_id || request.quantity === undefined) {
          throw new Error('product_id and quantity are required');
        }

        const { data: product, error } = await supabase
          .from('products')
          .select('id, stock')
          .eq('id', request.product_id)
          .maybeSingle();

        if (error) throw error;
        if (!product) throw new Error('Product not found');

        const available = product.stock >= request.quantity;

        return new Response(
          JSON.stringify({ 
            success: true, 
            available,
            current_stock: product.stock,
            requested: request.quantity
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'move': {
        if (!request.movements || request.movements.length === 0) {
          throw new Error('movements array is required');
        }

        const results = [];

        for (const movement of request.movements) {
          console.log(`[StockService] Processing movement for product: ${movement.product_id}`);

          // Get current stock
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, code, name, stock, cost_price')
            .eq('id', movement.product_id)
            .maybeSingle();

          if (productError) throw productError;
          if (!product) throw new Error(`Product not found: ${movement.product_id}`);

          const stock_before = Number(product.stock) || 0;
          const quantity = Number(movement.quantity);

          // Calculate new stock
          let stock_after: number;
          let new_cost_price = product.cost_price;

          if (movement.transaction_type === 'IN') {
            // Nhập hàng: cộng tồn
            stock_after = stock_before + quantity;
            
            // Update cost price if provided (weighted average)
            if (movement.unit_cost !== undefined && movement.unit_cost > 0) {
              if (stock_before > 0) {
                // Weighted average cost
                new_cost_price = (
                  (stock_before * Number(product.cost_price)) + 
                  (quantity * movement.unit_cost)
                ) / stock_after;
              } else {
                new_cost_price = movement.unit_cost;
              }
            }
          } else {
            // Xuất hàng: trừ tồn
            stock_after = stock_before - quantity;

            // Validate: không cho tồn kho âm
            if (stock_after < 0) {
              throw new Error(
                `Insufficient stock for product ${product.code} (${product.name}). ` +
                `Available: ${stock_before}, Requested: ${quantity}`
              );
            }
          }

          console.log(`[StockService] Stock change: ${stock_before} -> ${stock_after}`);

          // Insert stock card
          const { error: cardError } = await supabase
            .from('stock_cards')
            .insert({
              product_id: movement.product_id,
              ref_code: movement.ref_code,
              ref_type: movement.ref_type,
              transaction_type: movement.transaction_type,
              quantity: movement.transaction_type === 'IN' ? quantity : -quantity,
              unit_cost: movement.unit_cost || 0,
              stock_before,
              stock_after,
              note: movement.note,
              created_by: movement.created_by,
            });

          if (cardError) {
            console.error('[StockService] Error inserting stock card:', cardError);
            throw cardError;
          }

          // Update product stock and cost_price
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              stock: stock_after,
              cost_price: new_cost_price,
            })
            .eq('id', movement.product_id);

          if (updateError) {
            console.error('[StockService] Error updating product stock:', updateError);
            throw updateError;
          }

          results.push({
            product_id: movement.product_id,
            product_code: product.code,
            stock_before,
            stock_after,
            quantity_moved: quantity,
            transaction_type: movement.transaction_type,
          });
        }

        console.log(`[StockService] Processed ${results.length} movements successfully`);

        return new Response(
          JSON.stringify({ success: true, data: results }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

  } catch (error) {
    console.error('[StockService] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
