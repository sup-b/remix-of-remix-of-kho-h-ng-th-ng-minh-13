import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  quantity: number;
  unit_price: number;
  discount?: number; // Discount per item
}

interface PurchaseOrderCalculation {
  type: 'purchase_order';
  items: OrderItem[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number; // e.g., 10 for 10%
  other_fee?: number;
}

interface SalesOrderCalculation {
  type: 'sales_order';
  items: (OrderItem & { cost_price?: number })[];
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  vat_rate?: number;
  other_fee?: number;
}

type CalculationRequest = PurchaseOrderCalculation | SalesOrderCalculation;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request = await req.json() as CalculationRequest;
    console.log(`[PriceCalculator] Calculating for type: ${request.type}`);

    // Validate items
    if (!request.items || request.items.length === 0) {
      throw new Error('items array is required and cannot be empty');
    }

    // Calculate each item's total
    const itemDetails = request.items.map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const discount = Number(item.discount || 0);

      // Validate
      if (quantity <= 0) {
        throw new Error(`Invalid quantity at item ${index + 1}: must be greater than 0`);
      }
      if (unitPrice < 0) {
        throw new Error(`Invalid unit_price at item ${index + 1}: cannot be negative`);
      }
      if (discount < 0) {
        throw new Error(`Invalid discount at item ${index + 1}: cannot be negative`);
      }

      // Thành tiền = (Đơn giá × Số lượng) − Giảm giá
      const total_amount = (unitPrice * quantity) - discount;

      if (total_amount < 0) {
        throw new Error(`Invalid total at item ${index + 1}: total cannot be negative after discount`);
      }

      // Giá nhập = Thành tiền / Số lượng
      const import_price = quantity > 0 ? total_amount / quantity : 0;

      const result: any = {
        quantity,
        unit_price: unitPrice,
        discount,
        total_amount,
        import_price,
      };

      // For sales orders, calculate profit
      if (request.type === 'sales_order' && 'cost_price' in item) {
        const costPrice = Number(item.cost_price || 0);
        result.cost_price = costPrice;
        result.profit = total_amount - (costPrice * quantity);
      }

      return result;
    });

    // Sum all items
    const total_items = itemDetails.reduce((sum, item) => sum + item.total_amount, 0);
    console.log(`[PriceCalculator] Total items: ${total_items}`);

    // Apply order-level discount
    const discountType = request.discount_type || 'amount';
    const discountValue = Number(request.discount_value || 0);

    let after_discount: number;
    let discount_amount: number;

    if (discountType === 'percent') {
      discount_amount = total_items * (discountValue / 100);
      after_discount = total_items - discount_amount;
    } else {
      discount_amount = discountValue;
      after_discount = total_items - discountValue;
    }

    if (after_discount < 0) {
      throw new Error('After discount amount cannot be negative');
    }

    // Calculate VAT
    const vatRate = Number(request.vat_rate || 0);
    const vat_amount = after_discount * (vatRate / 100);

    // Other fees
    const other_fee = Number(request.other_fee || 0);
    if (other_fee < 0) {
      throw new Error('Other fee cannot be negative');
    }

    // Final amount
    const final_amount = after_discount + vat_amount + other_fee;

    if (final_amount < 0) {
      throw new Error('Final amount cannot be negative');
    }

    console.log(`[PriceCalculator] Final amount: ${final_amount}`);

    // Build response
    const response: any = {
      success: true,
      data: {
        items: itemDetails,
        summary: {
          total_items,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount,
          after_discount,
          vat_rate: vatRate,
          vat_amount,
          other_fee,
          final_amount,
        },
      },
    };

    // For sales orders, calculate total profit
    if (request.type === 'sales_order') {
      response.data.summary.total_profit = itemDetails.reduce(
        (sum, item) => sum + (item.profit || 0), 
        0
      );
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PriceCalculator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
