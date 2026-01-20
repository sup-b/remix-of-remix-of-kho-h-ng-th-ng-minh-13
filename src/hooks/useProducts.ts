import { useState, useEffect, useCallback } from 'react';
import { Product, ProductGroup, Supplier, Import, Invoice } from '@/types';
import {
  getProducts,
  saveProducts,
  getProductGroups,
  getSuppliers,
  getImports,
  getInvoices,
  generateId,
  generateSKU,
} from '@/lib/storage';
import { initSeedData } from '@/lib/seedData';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imports, setImports] = useState<Import[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      initSeedData();
      const allProducts = getProducts().filter((p) => !p.isDeleted);
      setProducts(allProducts);
      setGroups(getProductGroups());
      setSuppliers(getSuppliers());
      setImports(getImports());
      setInvoices(getInvoices());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: generateId(),
      ...productData,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    const allProducts = getProducts();
    const updatedProducts = [...allProducts, newProduct];
    saveProducts(updatedProducts);
    setProducts(updatedProducts.filter(p => !p.isDeleted));
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, productData: Partial<Product>) => {
    const now = new Date().toISOString();
    const allProducts = getProducts();
    const updatedProducts = allProducts.map((p) =>
      p.id === id ? { ...p, ...productData, updatedAt: now } : p
    );
    saveProducts(updatedProducts);
    setProducts(updatedProducts.filter(p => !p.isDeleted));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    const now = new Date().toISOString();
    const allProducts = getProducts();
    const updatedProducts = allProducts.map((p) =>
      p.id === id ? { ...p, isDeleted: true, updatedAt: now } : p
    );
    saveProducts(updatedProducts);
    setProducts(updatedProducts.filter(p => !p.isDeleted));
  }, []);

  return {
    products,
    groups,
    suppliers,
    imports,
    invoices,
    isLoading,
    loadData,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}

export function useProductForm(initialProduct?: Product | null) {
  const [formData, setFormData] = useState({
    sku: generateSKU(),
    name: '',
    groupId: '',
    config: {} as Record<string, string>,
    costPrice: 0,
    salePrice: 0,
    stockQty: 0,
    unit: 'cái',
    status: 'in_stock' as 'in_stock' | 'out_of_stock' | 'discontinued',
    notes: '',
  });

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        sku: initialProduct.sku,
        name: initialProduct.name,
        groupId: initialProduct.groupId || '',
        config: { ...initialProduct.config },
        costPrice: initialProduct.costPrice,
        salePrice: initialProduct.salePrice,
        stockQty: initialProduct.stockQty,
        unit: initialProduct.unit,
        status: initialProduct.status,
        notes: initialProduct.notes,
      });
    }
  }, [initialProduct]);

  const resetForm = useCallback(() => {
    setFormData({
      sku: generateSKU(),
      name: '',
      groupId: '',
      config: {},
      costPrice: 0,
      salePrice: 0,
      stockQty: 0,
      unit: 'cái',
      status: 'in_stock',
      notes: '',
    });
  }, []);

  const updateField = useCallback(<K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    formData,
    setFormData,
    resetForm,
    updateField,
  };
}
