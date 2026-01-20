// Product Group
export interface ProductGroup {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  description: string;
  configTemplate: Record<string, string>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Brand
export interface Brand {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Product
export interface Product {
  id: string;
  sku: string;
  name: string;
  type: 'product' | 'service';
  groupId: string | null;
  brandId?: string | null;
  config: Record<string, string>;
  costPrice: number;
  salePriceBeforeTax: number;
  salePrice: number;
  vatImport: number;
  vatSale: number;
  stockQty: number;
  minStock?: number;
  maxStock?: number;
  unit: string;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  imageUrl?: string;
  images?: string[];
  notes: string;
  description?: string;
  warranty?: string;
  directSale: boolean;
  loyaltyPoints: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Import/Purchase
export interface ImportItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Import {
  id: string;
  supplierId: string;
  date: string;
  items: ImportItem[];
  totalAmount: number;
  notes: string;
  createdAt: string;
}

// Sale/Invoice
export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: string | null;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer';
  amountPaid: number;
  change: number;
  notes: string;
  createdAt: string;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayOrders: number;
  lowStockProducts: Product[];
  topSellingProducts: { product: Product; quantity: number }[];
}

// User Role
export type UserRole = 'admin' | 'staff';
