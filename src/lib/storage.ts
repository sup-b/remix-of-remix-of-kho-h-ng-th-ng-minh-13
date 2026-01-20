import { Product, ProductGroup, Brand, Customer, Supplier, Import, Invoice } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'sim_products',
  PRODUCT_GROUPS: 'sim_product_groups',
  BRANDS: 'sim_brands',
  CUSTOMERS: 'sim_customers',
  SUPPLIERS: 'sim_suppliers',
  IMPORTS: 'sim_imports',
  INVOICES: 'sim_invoices',
  CURRENT_ROLE: 'sim_current_role',
};

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate SKU for products (SP + 6 digits)
export function generateSKU(prefix: string = 'SP'): string {
  const products = getProducts();
  const existingSkus = products.map(p => p.sku);
  let counter = products.length + 1;
  let sku = `${prefix}${String(counter).padStart(6, '0')}`;
  
  while (existingSkus.includes(sku)) {
    counter++;
    sku = `${prefix}${String(counter).padStart(6, '0')}`;
  }
  
  return sku;
}

// Generate Import Code (PN + datetime)
export function generateImportCode(): string {
  const now = new Date();
  return `PN${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

// Generate Invoice Code (HD + datetime)
export function generateInvoiceCode(): string {
  const now = new Date();
  return `HD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

// Product Groups
export function getProductGroups(): ProductGroup[] {
  return getFromStorage<ProductGroup[]>(STORAGE_KEYS.PRODUCT_GROUPS, []);
}

export function saveProductGroups(groups: ProductGroup[]): void {
  saveToStorage(STORAGE_KEYS.PRODUCT_GROUPS, groups);
}

export function getProductGroupById(id: string): ProductGroup | undefined {
  return getProductGroups().find(g => g.id === id);
}

// Brands
export function getBrands(): Brand[] {
  return getFromStorage<Brand[]>(STORAGE_KEYS.BRANDS, []);
}

export function saveBrands(brands: Brand[]): void {
  saveToStorage(STORAGE_KEYS.BRANDS, brands);
}

export function getBrandById(id: string): Brand | undefined {
  return getBrands().find(b => b.id === id);
}

// Products
export function getProducts(): Product[] {
  return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export function saveProducts(products: Product[]): void {
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find(p => p.id === id);
}

export function getActiveProducts(): Product[] {
  return getProducts().filter(p => !p.isDeleted);
}

// Customers
export function getCustomers(): Customer[] {
  return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
}

export function saveCustomers(customers: Customer[]): void {
  saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

// Suppliers
export function getSuppliers(): Supplier[] {
  return getFromStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
}

export function saveSuppliers(suppliers: Supplier[]): void {
  saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
}

export function getSupplierById(id: string): Supplier | undefined {
  return getSuppliers().find(s => s.id === id);
}

// Imports
export function getImports(): Import[] {
  return getFromStorage<Import[]>(STORAGE_KEYS.IMPORTS, []);
}

export function saveImports(imports: Import[]): void {
  saveToStorage(STORAGE_KEYS.IMPORTS, imports);
}

// Invoices
export function getInvoices(): Invoice[] {
  return getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
}

export function saveInvoices(invoices: Invoice[]): void {
  saveToStorage(STORAGE_KEYS.INVOICES, invoices);
}

// User Role
export function getCurrentRole(): 'admin' | 'staff' {
  return getFromStorage<'admin' | 'staff'>(STORAGE_KEYS.CURRENT_ROLE, 'admin');
}

export function setCurrentRole(role: 'admin' | 'staff'): void {
  saveToStorage(STORAGE_KEYS.CURRENT_ROLE, role);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
