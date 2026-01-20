-- =============================================
-- PHASE 1: DATABASE SCHEMA MIGRATION
-- =============================================

-- 1. Update products table - add missing fields
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_sale numeric NOT NULL DEFAULT 0;

-- 2. Create function to generate product code (SP000001, SP000002...)
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  max_num INT;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INT)), 0) + 1 INTO max_num
  FROM public.products
  WHERE code ~ '^SP[0-9]{6}$';
  
  new_code := 'SP' || LPAD(max_num::TEXT, 6, '0');
  RETURN new_code;
END;
$function$;

-- 3. Create function to generate supplier code (NCC00001, NCC00002...)
CREATE OR REPLACE FUNCTION public.generate_supplier_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  max_num INT;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INT)), 0) + 1 INTO max_num
  FROM public.suppliers
  WHERE code ~ '^NCC[0-9]{5}$';
  
  new_code := 'NCC' || LPAD(max_num::TEXT, 5, '0');
  RETURN new_code;
END;
$function$;

-- 4. Create function to generate purchase order code (PNmmdd000 - reset daily)
CREATE OR REPLACE FUNCTION public.generate_purchase_order_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  today_str := to_char(now(), 'MMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 7) AS INT)), 0) + 1 INTO seq_num
  FROM public.purchase_orders
  WHERE code LIKE 'PN' || today_str || '%';
  new_code := 'PN' || today_str || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_code;
END;
$function$;

-- 5. Create function to generate sales order code (HDyyMMdd000 - reset daily)
CREATE OR REPLACE FUNCTION public.generate_sales_order_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  today_str := to_char(now(), 'YYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 9) AS INT)), 0) + 1 INTO seq_num
  FROM public.sales_orders
  WHERE code LIKE 'HD' || today_str || '%';
  new_code := 'HD' || today_str || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_code;
END;
$function$;

-- 6. Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id),
  total_amount numeric NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'amount',
  discount_value numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  other_fee numeric DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  note text,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  import_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 8. Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id),
  total_items numeric NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'amount',
  discount_value numeric DEFAULT 0,
  after_discount numeric NOT NULL DEFAULT 0,
  vat_rate numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  other_fee numeric DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  payment_status text NOT NULL DEFAULT 'unpaid',
  note text,
  sale_date timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 9. Create sales_order_items table
CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 10. Create stock_cards table
CREATE TABLE IF NOT EXISTS public.stock_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id),
  ref_code text NOT NULL,
  ref_type text NOT NULL,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  unit_cost numeric DEFAULT 0,
  stock_before numeric NOT NULL DEFAULT 0,
  stock_after numeric NOT NULL DEFAULT 0,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 11. Enable RLS on new tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_cards ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for new tables (allow all for now, can restrict later)
CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales_orders" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales_order_items" ON public.sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to stock_cards" ON public.stock_cards FOR ALL USING (true) WITH CHECK (true);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_code ON public.purchase_orders(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON public.purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_code ON public.sales_orders(code);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON public.sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON public.sales_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_cards_product ON public.stock_cards(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_cards_ref ON public.stock_cards(ref_code, ref_type);
CREATE INDEX IF NOT EXISTS idx_stock_cards_type ON public.stock_cards(transaction_type);

CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);

-- 14. Create trigger to update updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();