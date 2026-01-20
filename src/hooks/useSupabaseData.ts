import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

// Types
export type Product = Tables<'products'> & {
  stock_qty?: number;
  average_cost?: number;
  category?: Tables<'categories'> | null;
};

export type Category = Tables<'categories'>;
export type Supplier = Tables<'suppliers'>;
export type Customer = Tables<'customers'>;
export type PurchaseReceipt = Tables<'purchase_receipts'> & {
  items?: PurchaseReceiptItem[];
  supplier?: Tables<'suppliers'> | null;
};
export type PurchaseReceiptItem = Tables<'purchase_receipt_items'> & {
  product?: Tables<'products'> | null;
};
export type SalesInvoice = Tables<'sales_invoices'> & {
  items?: SalesInvoiceItem[];
  customer?: Tables<'customers'> | null;
};
export type SalesInvoiceItem = Tables<'sales_invoice_items'> & {
  product?: Tables<'products'> | null;
};
export type InventoryTransaction = Tables<'inventory_transactions'>;
export type Payment = Tables<'payments'>;

// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN');
};

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: TablesInsert<'categories'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Products with stock calculation
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name');
      if (error) throw error;

      // Get stock for each product
      const productsWithStock = await Promise.all(
        (data || []).map(async (product) => {
          const { data: stockData } = await supabase.rpc('get_product_stock', {
            p_product_id: product.id,
          });
          const { data: costData } = await supabase.rpc('get_average_cost', {
            p_product_id: product.id,
          });
          return {
            ...product,
            stock_qty: Number(stockData) || 0,
            average_cost: Number(costData) || 0,
          };
        })
      );

      return productsWithStock as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: stockData } = await supabase.rpc('get_product_stock', {
        p_product_id: id,
      });
      const { data: costData } = await supabase.rpc('get_average_cost', {
        p_product_id: id,
      });

      return {
        ...data,
        stock_qty: Number(stockData) || 0,
        average_cost: Number(costData) || 0,
      } as Product;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: TablesInsert<'products'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<'products'>>) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: TablesInsert<'suppliers'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Customers
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: TablesInsert<'customers'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Purchase Receipts
export function usePurchaseReceipts() {
  return useQuery({
    queryKey: ['purchase_receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_receipts')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseReceipt[];
    },
  });
}

export function usePurchaseReceiptWithItems(id: string) {
  return useQuery({
    queryKey: ['purchase_receipt', id],
    queryFn: async () => {
      const { data: receipt, error: receiptError } = await supabase
        .from('purchase_receipts')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (receiptError) throw receiptError;
      if (!receipt) return null;

      const { data: items, error: itemsError } = await supabase
        .from('purchase_receipt_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('purchase_receipt_id', id);
      if (itemsError) throw itemsError;

      return { ...receipt, items } as PurchaseReceipt;
    },
    enabled: !!id,
  });
}

interface CreatePurchaseReceiptData {
  supplier_id?: string | null;
  receipt_date?: string;
  discount_type?: string;
  discount_value?: number;
  note?: string;
  status?: 'draft' | 'completed';
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    total_price: number;
  }[];
}

export function useCreatePurchaseReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePurchaseReceiptData) => {
      // Generate code
      const { data: code } = await supabase.rpc('generate_purchase_code');
      
      // Calculate totals - BACKEND MUST RECALCULATE
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = data.discount_type === 'percent' 
        ? totalAmount * (data.discount_value || 0) / 100 
        : (data.discount_value || 0);
      const finalAmount = Math.max(0, totalAmount - discountAmount);

      const isDraft = data.status === 'draft';

      // Create receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('purchase_receipts')
        .insert({
          code: code || `PN${Date.now()}`,
          supplier_id: data.supplier_id,
          receipt_date: data.receipt_date || new Date().toISOString(),
          total_amount: totalAmount,
          discount_type: data.discount_type || 'amount',
          discount_value: data.discount_value || 0,
          final_amount: finalAmount,
          note: data.note,
          status: isDraft ? 'draft' : 'completed',
        })
        .select()
        .single();
      if (receiptError) throw receiptError;

      // Create items
      for (const item of data.items) {
        // Validate: quantity must be > 0, price must be >= 0
        if (item.quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        if (item.unit_price < 0) throw new Error('Đơn giá không được âm');

        const { error: itemError } = await supabase
          .from('purchase_receipt_items')
          .insert({
            purchase_receipt_id: receipt.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            total_price: item.total_price,
          });
        if (itemError) throw itemError;

        // Only create inventory transaction if NOT draft
        if (!isDraft) {
          const { error: txError } = await supabase
            .from('inventory_transactions')
            .insert({
              product_id: item.product_id,
              transaction_type: 'IN',
              reference_type: 'PURCHASE',
              reference_id: receipt.id,
              quantity: item.quantity,
              unit_cost: item.unit_price,
            });
          if (txError) throw txError;
        }
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
    },
  });
}

export function useCompletePurchaseReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Get receipt with items
      const { data: receipt, error: receiptError } = await supabase
        .from('purchase_receipts')
        .select('*, items:purchase_receipt_items(*)')
        .eq('id', id)
        .single();
      
      if (receiptError) throw receiptError;
      if (receipt.status === 'completed') {
        throw new Error('Phiếu nhập đã hoàn thành, không thể xử lý lại');
      }

      // Update status to completed
      const { error: updateError } = await supabase
        .from('purchase_receipts')
        .update({ status: 'completed' })
        .eq('id', id);
      if (updateError) throw updateError;

      // Create inventory transactions for each item
      for (const item of (receipt as any).items || []) {
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.product_id,
            transaction_type: 'IN',
            reference_type: 'PURCHASE',
            reference_id: id,
            quantity: item.quantity,
            unit_cost: item.unit_price,
          });
        if (txError) throw txError;
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
    },
  });
}

// Sales Invoices
export function useSalesInvoices() {
  return useQuery({
    queryKey: ['sales_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SalesInvoice[];
    },
  });
}

export function useSalesInvoiceWithItems(id: string) {
  return useQuery({
    queryKey: ['sales_invoice', id],
    queryFn: async () => {
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (invoiceError) throw invoiceError;
      if (!invoice) return null;

      const { data: items, error: itemsError } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('sales_invoice_id', id);
      if (itemsError) throw itemsError;

      return { ...invoice, items } as SalesInvoice;
    },
    enabled: !!id,
  });
}

interface CreateSalesInvoiceData {
  customer_id?: string | null;
  sale_date?: string;
  discount_type?: string;
  discount_value?: number;
  extra_fee?: number;
  vat_enabled?: boolean;
  vat_amount?: number;
  note?: string;
  items: {
    product_id: string;
    quantity: number;
    sale_price: number;
    discount?: number;
    total_price: number;
    cost_price: number;
    profit: number;
  }[];
  payments?: {
    method: string;
    amount: number;
  }[];
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSalesInvoiceData) => {
      // Validate: must have items
      if (!data.items || data.items.length === 0) {
        throw new Error('Vui lòng thêm sản phẩm vào hóa đơn');
      }

      // Check stock availability for each item
      for (const item of data.items) {
        if (item.quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        
        const { data: stockData } = await supabase.rpc('get_product_stock', {
          p_product_id: item.product_id,
        });
        const currentStock = Number(stockData) || 0;
        if (item.quantity > currentStock) {
          throw new Error(`Sản phẩm không đủ tồn kho (Tồn: ${currentStock})`);
        }
      }

      // Generate code
      const { data: code } = await supabase.rpc('generate_sales_code');
      
      // BACKEND MUST RECALCULATE all amounts
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = data.discount_type === 'percent' 
        ? totalAmount * (data.discount_value || 0) / 100 
        : (data.discount_value || 0);
      const vatAmount = data.vat_enabled ? (data.vat_amount || 0) : 0;
      const finalAmount = Math.max(0, totalAmount - discountAmount + (data.extra_fee || 0) + vatAmount);

      // Validate payment
      const paidAmount = data.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      if (paidAmount < finalAmount) {
        throw new Error(`Số tiền thanh toán không đủ (Cần: ${formatCurrency(finalAmount)})`);
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert({
          code: code || `HD${Date.now()}`,
          customer_id: data.customer_id,
          sale_date: data.sale_date || new Date().toISOString(),
          total_amount: totalAmount,
          discount_type: data.discount_type || 'amount',
          discount_value: data.discount_value || 0,
          extra_fee: data.extra_fee || 0,
          vat_enabled: data.vat_enabled || false,
          vat_amount: vatAmount,
          final_amount: finalAmount,
          note: data.note,
          status: 'completed',
          payment_status: 'paid',
        })
        .select()
        .single();
      if (invoiceError) throw invoiceError;

      // Create items and inventory transactions
      for (const item of data.items) {
        // Insert invoice item
        const { error: itemError } = await supabase
          .from('sales_invoice_items')
          .insert({
            sales_invoice_id: invoice.id,
            product_id: item.product_id,
            quantity: item.quantity,
            sale_price: item.sale_price,
            discount: item.discount || 0,
            total_price: item.total_price,
            cost_price: item.cost_price,
            profit: item.profit,
          });
        if (itemError) throw itemError;

        // Insert inventory transaction (OUT - negative quantity)
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.product_id,
            transaction_type: 'OUT',
            reference_type: 'SALE',
            reference_id: invoice.id,
            quantity: -item.quantity, // Negative for OUT
            unit_cost: item.cost_price,
          });
        if (txError) throw txError;
      }

      // Create payments
      for (const payment of data.payments || []) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            reference_type: 'SALE',
            reference_id: invoice.id,
            method: payment.method,
            amount: payment.amount,
          });
        if (paymentError) throw paymentError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// Inventory Transactions (Stock Ledger)
export function useInventoryTransactions(productId?: string) {
  return useQuery({
    queryKey: ['inventory_transactions', productId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryTransaction[];
    },
  });
}

// Dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Today's sales
      const { data: todaySales } = await supabase
        .from('sales_invoices')
        .select('final_amount')
        .gte('sale_date', todayISO)
        .eq('status', 'completed');

      const todayRevenue = (todaySales || []).reduce((sum, s) => sum + (s.final_amount || 0), 0);

      // Today's profit from items
      const { data: todayInvoices } = await supabase
        .from('sales_invoices')
        .select('id')
        .gte('sale_date', todayISO)
        .eq('status', 'completed');

      let todayProfit = 0;
      if (todayInvoices && todayInvoices.length > 0) {
        const invoiceIds = todayInvoices.map(i => i.id);
        const { data: items } = await supabase
          .from('sales_invoice_items')
          .select('profit')
          .in('sales_invoice_id', invoiceIds);
        todayProfit = (items || []).reduce((sum, i) => sum + (i.profit || 0), 0);
      }

      // Low stock products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, code')
        .eq('status', 'active');

      const lowStockProducts: Array<{ id: string; name: string; code: string; stock: number }> = [];
      for (const product of products || []) {
        const { data: stockData } = await supabase.rpc('get_product_stock', {
          p_product_id: product.id,
        });
        const stock = Number(stockData) || 0;
        if (stock <= 10) {
          lowStockProducts.push({ ...product, stock });
        }
      }

      // Total orders today
      const totalOrders = (todaySales || []).length;

      return {
        todayRevenue,
        todayProfit,
        totalOrders,
        lowStockProducts: lowStockProducts.slice(0, 10),
      };
    },
  });
}
