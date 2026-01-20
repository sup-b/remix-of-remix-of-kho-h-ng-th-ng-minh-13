
-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table (NO stock_qty column - calculated from transactions)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  barcode TEXT,
  unit TEXT NOT NULL DEFAULT 'cái',
  sale_price_default NUMERIC(15,2) NOT NULL DEFAULT 0,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase receipts (Phiếu nhập kho)
CREATE TABLE public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  receipt_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('percent', 'amount')),
  discount_value NUMERIC(15,2) DEFAULT 0,
  final_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase receipt items
CREATE TABLE public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  total_price NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales invoices (Hóa đơn bán hàng)
CREATE TABLE public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('percent', 'amount')),
  discount_value NUMERIC(15,2) DEFAULT 0,
  extra_fee NUMERIC(15,2) DEFAULT 0,
  vat_enabled BOOLEAN DEFAULT false,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  final_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales invoice items (with cost_price locked at sale time)
CREATE TABLE public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(15,3) NOT NULL,
  sale_price NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  total_price NUMERIC(15,2) NOT NULL,
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory transactions (core for stock tracking)
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUST', 'RETURN')),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('PURCHASE', 'SALE', 'ADJUST', 'RETURN')),
  reference_id UUID NOT NULL,
  quantity NUMERIC(15,3) NOT NULL,
  unit_cost NUMERIC(15,2) DEFAULT 0,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('PURCHASE', 'SALE')),
  reference_id UUID NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'transfer', 'card', 'ewallet')),
  amount NUMERIC(15,2) NOT NULL,
  note TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
-- Categories
CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Products
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Purchase receipts
CREATE POLICY "Authenticated users can view purchase_receipts" ON public.purchase_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage purchase_receipts" ON public.purchase_receipts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Purchase receipt items
CREATE POLICY "Authenticated users can view purchase_receipt_items" ON public.purchase_receipt_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage purchase_receipt_items" ON public.purchase_receipt_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Sales invoices (staff can create sales)
CREATE POLICY "Authenticated users can view sales_invoices" ON public.sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales_invoices" ON public.sales_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage sales_invoices" ON public.sales_invoices FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sales_invoices" ON public.sales_invoices FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Sales invoice items
CREATE POLICY "Authenticated users can view sales_invoice_items" ON public.sales_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales_invoice_items" ON public.sales_invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage sales_invoice_items" ON public.sales_invoice_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sales_invoice_items" ON public.sales_invoice_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Inventory transactions
CREATE POLICY "Authenticated users can view inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory_transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage inventory_transactions" ON public.inventory_transactions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete inventory_transactions" ON public.inventory_transactions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Payments
CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage payments" ON public.payments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Function to calculate stock from transactions
CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM public.inventory_transactions
  WHERE product_id = p_product_id
$$;

-- Function to calculate average cost
CREATE OR REPLACE FUNCTION public.get_average_cost(p_product_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    SUM(quantity * unit_cost) / NULLIF(SUM(quantity), 0),
    0
  )
  FROM public.inventory_transactions
  WHERE product_id = p_product_id
    AND transaction_type = 'IN'
    AND quantity > 0
$$;

-- Function to generate purchase receipt code
CREATE OR REPLACE FUNCTION public.generate_purchase_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  today_str := to_char(now(), 'YYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 9) AS INT)), 0) + 1 INTO seq_num
  FROM public.purchase_receipts
  WHERE code LIKE 'PN' || today_str || '%';
  new_code := 'PN' || today_str || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_code;
END;
$$;

-- Function to generate sales invoice code
CREATE OR REPLACE FUNCTION public.generate_sales_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  today_str := to_char(now(), 'YYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 9) AS INT)), 0) + 1 INTO seq_num
  FROM public.sales_invoices
  WHERE code LIKE 'HD' || today_str || '%';
  new_code := 'HD' || today_str || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_code;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_receipts_updated_at BEFORE UPDATE ON public.purchase_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.categories (name, description) VALUES
  ('Điện thoại', 'Điện thoại di động các loại'),
  ('Phụ kiện', 'Phụ kiện điện thoại'),
  ('Đồng hồ', 'Đồng hồ thông minh');

INSERT INTO public.suppliers (name, code, phone) VALUES
  ('Khách lẻ', 'NCC000', NULL),
  ('Công ty ABC', 'NCC001', '0901234567'),
  ('Đại lý XYZ', 'NCC002', '0909876543');

INSERT INTO public.products (name, code, barcode, unit, sale_price_default, category_id) VALUES
  ('iPhone 15 Pro Max 256GB', 'SP001', '8901234567890', 'cái', 34990000, (SELECT id FROM public.categories WHERE name = 'Điện thoại')),
  ('Samsung Galaxy S24 Ultra', 'SP002', '8901234567891', 'cái', 31990000, (SELECT id FROM public.categories WHERE name = 'Điện thoại')),
  ('Ốp lưng iPhone 15', 'SP003', '8901234567892', 'cái', 250000, (SELECT id FROM public.categories WHERE name = 'Phụ kiện')),
  ('Sạc nhanh 65W', 'SP004', '8901234567893', 'cái', 450000, (SELECT id FROM public.categories WHERE name = 'Phụ kiện')),
  ('Apple Watch Series 9', 'SP005', '8901234567894', 'cái', 11990000, (SELECT id FROM public.categories WHERE name = 'Đồng hồ'));
