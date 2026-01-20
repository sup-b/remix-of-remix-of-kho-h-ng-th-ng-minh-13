import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCodeRequest {
  type: 'product' | 'supplier' | 'purchase_order' | 'sales_order';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type } = await req.json() as GenerateCodeRequest;

    console.log(`[CodeGenerator] Generating code for type: ${type}`);

    let functionName: string;
    switch (type) {
      case 'product':
        functionName = 'generate_product_code';
        break;
      case 'supplier':
        functionName = 'generate_supplier_code';
        break;
      case 'purchase_order':
        functionName = 'generate_purchase_order_code';
        break;
      case 'sales_order':
        functionName = 'generate_sales_order_code';
        break;
      default:
        throw new Error(`Invalid code type: ${type}`);
    }

    const { data, error } = await supabase.rpc(functionName);

    if (error) {
      console.error(`[CodeGenerator] Error generating code:`, error);
      throw error;
    }

    console.log(`[CodeGenerator] Generated code: ${data}`);

    return new Response(
      JSON.stringify({ success: true, code: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CodeGenerator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
