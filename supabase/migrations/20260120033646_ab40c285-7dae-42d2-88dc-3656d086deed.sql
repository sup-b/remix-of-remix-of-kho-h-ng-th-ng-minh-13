-- Drop existing restrictive RLS policies and create public access policies
-- Since no authentication is required, all operations should be allowed

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Allow all access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Suppliers
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Allow all access to suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Purchase Receipts
DROP POLICY IF EXISTS "Admins can manage purchase_receipts" ON public.purchase_receipts;
DROP POLICY IF EXISTS "Authenticated users can view purchase_receipts" ON public.purchase_receipts;
CREATE POLICY "Allow all access to purchase_receipts" ON public.purchase_receipts FOR ALL USING (true) WITH CHECK (true);

-- Purchase Receipt Items
DROP POLICY IF EXISTS "Admins can manage purchase_receipt_items" ON public.purchase_receipt_items;
DROP POLICY IF EXISTS "Authenticated users can view purchase_receipt_items" ON public.purchase_receipt_items;
CREATE POLICY "Allow all access to purchase_receipt_items" ON public.purchase_receipt_items FOR ALL USING (true) WITH CHECK (true);

-- Sales Invoices
DROP POLICY IF EXISTS "Admins can manage sales_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admins can delete sales_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Authenticated users can view sales_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Authenticated users can insert sales_invoices" ON public.sales_invoices;
CREATE POLICY "Allow all access to sales_invoices" ON public.sales_invoices FOR ALL USING (true) WITH CHECK (true);

-- Sales Invoice Items
DROP POLICY IF EXISTS "Admins can manage sales_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Admins can delete sales_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can view sales_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can insert sales_invoice_items" ON public.sales_invoice_items;
CREATE POLICY "Allow all access to sales_invoice_items" ON public.sales_invoice_items FOR ALL USING (true) WITH CHECK (true);

-- Inventory Transactions
DROP POLICY IF EXISTS "Admins can manage inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admins can delete inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can view inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow all access to inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);