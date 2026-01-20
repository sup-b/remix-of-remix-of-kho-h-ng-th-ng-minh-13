import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Filter, Search, X, Printer, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Product, ProductGroup, Brand, Supplier, Import, Invoice } from '@/types';
import {
  getProducts,
  saveProducts,
  getProductGroups,
  getProductGroupById,
  getBrands,
  getSuppliers,
  getImports,
  getInvoices,
  generateId,
  generateSKU,
  formatCurrency,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ProductTable, ProductFormDialog, PrintDialog } from '@/components/products';
import { ProductFormDialogNew, ProductFormData as NewProductFormData } from '@/components/products/ProductFormDialogNew';
import { CreateGroupDialog } from '@/components/products/CreateGroupDialog';
import { CreateBrandDialog } from '@/components/products/CreateBrandDialog';
import { Package, Wrench } from 'lucide-react';

interface ProductFormData {
  sku: string;
  name: string;
  type: 'product' | 'service';
  groupId: string;
  brandId: string;
  config: Record<string, string>;
  costPrice: number;
  vatImport: number;
  salePriceBeforeTax: number;
  vatSale: number;
  salePrice: number;
  stockQty: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  notes: string;
  description: string;
  warranty: string;
  directSale: boolean;
  loyaltyPoints: boolean;
  serialNumber?: string;
  supplierId?: string;
}

export default function Products() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imports, setImports] = useState<Import[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<'product' | 'service'>('product');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateBrandOpen, setIsCreateBrandOpen] = useState(false);

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter & search state
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [printQuantities, setPrintQuantities] = useState<Record<string, number>>({});

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    type: 'product',
    groupId: '',
    brandId: '',
    config: {},
    costPrice: 0,
    vatImport: 8,
    salePriceBeforeTax: 0,
    vatSale: 8,
    salePrice: 0,
    stockQty: 0,
    minStock: 5,
    maxStock: 100,
    unit: 'cái',
    status: 'in_stock',
    notes: '',
    description: '',
    warranty: '',
    directSale: true,
    loyaltyPoints: false,
    serialNumber: '',
    supplierId: '',
  });

  const { toast } = useToast();

  // Load data
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      initSeedData();
      setProducts(getProducts().filter((p) => !p.isDeleted));
      setGroups(getProductGroups());
      setBrands(getBrands());
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

  // Reset form
  const resetForm = useCallback((type: 'product' | 'service' = 'product') => {
    setFormData({
      sku: generateSKU(),
      name: '',
      type,
      groupId: '',
      brandId: '',
      config: {},
      costPrice: 0,
      vatImport: 8,
      salePriceBeforeTax: 0,
      vatSale: 8,
      salePrice: 0,
      stockQty: 0,
      minStock: 5,
      maxStock: 100,
      unit: 'cái',
      status: 'in_stock',
      notes: '',
      description: '',
      warranty: '',
      directSale: true,
      loyaltyPoints: false,
      serialNumber: '',
      supplierId: '',
    });
    setEditingProduct(null);
  }, []);

  // New form data for ProductFormDialogNew
  const [newFormData, setNewFormData] = useState<NewProductFormData>({
    sku: generateSKU(),
    name: '',
    type: 'product',
    groupId: '',
    brandId: '',
    costPrice: 0,
    vatImport: 8,
    salePriceBeforeTax: 0,
    vatSale: 8,
    salePrice: 0,
    stockQty: 0,
    minStock: 5,
    maxStock: 100,
    unit: 'cái',
    status: 'in_stock',
    notes: '',
    description: '',
    warranty: '',
    directSale: true,
    loyaltyPoints: false,
    images: [],
    config: {},
  });

  // Handlers
  const openCreateDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const openNewCreateDialog = useCallback((type: 'product' | 'service') => {
    setCreateType(type);
    setNewFormData({
      sku: generateSKU(),
      name: '',
      type,
      groupId: '',
      brandId: '',
      costPrice: 0,
      vatImport: 8,
      salePriceBeforeTax: 0,
      vatSale: 8,
      salePrice: 0,
      stockQty: type === 'product' ? 0 : 0,
      minStock: 5,
      maxStock: 100,
      unit: type === 'product' ? 'cái' : 'lần',
      status: 'in_stock',
      notes: '',
      description: '',
      warranty: '',
      directSale: true,
      loyaltyPoints: type === 'service',
      images: [],
      config: {},
    });
    setEditingProduct(null);
    setIsNewDialogOpen(true);
  }, []);

  const handleNewFormChange = useCallback((data: Partial<NewProductFormData>) => {
    setNewFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleNewGroupChange = useCallback((groupId: string) => {
    setNewFormData((prev) => ({ ...prev, groupId }));
    if (groupId) {
      const group = getProductGroupById(groupId);
      if (group) {
        setNewFormData((prev) => ({
          ...prev,
          config: { ...group.configTemplate },
        }));
      }
    }
  }, []);

  const handleNewSave = useCallback(() => {
    if (!newFormData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên sản phẩm',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const allProducts = getProducts();
    const status =
      newFormData.stockQty === 0 && newFormData.status !== 'discontinued' && newFormData.type === 'product'
        ? 'out_of_stock'
        : newFormData.status;

    const newProduct: Product = {
      id: generateId(),
      sku: newFormData.sku,
      name: newFormData.name,
      type: newFormData.type,
      groupId: newFormData.groupId || null,
      brandId: newFormData.brandId || null,
      config: newFormData.config,
      costPrice: newFormData.costPrice,
      salePriceBeforeTax: newFormData.salePriceBeforeTax,
      salePrice: newFormData.salePrice,
      vatImport: newFormData.vatImport,
      vatSale: newFormData.vatSale,
      stockQty: newFormData.stockQty,
      minStock: newFormData.minStock,
      maxStock: newFormData.maxStock,
      unit: newFormData.unit,
      status,
      notes: newFormData.notes,
      description: newFormData.description,
      warranty: newFormData.warranty,
      directSale: newFormData.directSale,
      loyaltyPoints: newFormData.loyaltyPoints,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    saveProducts([...allProducts, newProduct]);
    loadData();
    setIsNewDialogOpen(false);
    toast({ title: 'Thành công', description: newFormData.type === 'product' ? 'Đã tạo hàng hóa mới' : 'Đã tạo dịch vụ mới' });
  }, [newFormData, loadData, toast]);

  const handleNewSaveAndCreate = useCallback(() => {
    handleNewSave();
    setTimeout(() => {
      openNewCreateDialog(createType);
    }, 100);
  }, [handleNewSave, openNewCreateDialog, createType]);

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      type: product.type || 'product',
      groupId: product.groupId || '',
      brandId: product.brandId || '',
      config: { ...product.config },
      costPrice: product.costPrice,
      vatImport: product.vatImport || 8,
      salePriceBeforeTax: product.salePriceBeforeTax || product.salePrice,
      vatSale: product.vatSale || 8,
      salePrice: product.salePrice,
      stockQty: product.stockQty,
      minStock: product.minStock || 5,
      maxStock: product.maxStock || 100,
      unit: product.unit,
      status: product.status,
      notes: product.notes,
      description: product.description || '',
      warranty: product.warranty || '',
      directSale: product.directSale ?? true,
      loyaltyPoints: product.loyaltyPoints ?? false,
      serialNumber: (product as any).serialNumber || '',
      supplierId: (product as any).supplierId || '',
    });
    setIsDialogOpen(true);
  }, []);

  const handleGroupChange = useCallback((groupId: string) => {
    setFormData((prev) => ({ ...prev, groupId }));
    if (groupId && !editingProduct) {
      const group = getProductGroupById(groupId);
      if (group) {
        setFormData((prev) => ({
          ...prev,
          config: { ...group.configTemplate },
        }));
      }
    }
  }, [editingProduct]);

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên sản phẩm',
        variant: 'destructive',
      });
      return;
    }

    if (formData.costPrice < 0 || formData.salePrice < 0) {
      toast({
        title: 'Lỗi',
        description: 'Giá không được âm',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const allProducts = getProducts();
    const status =
      formData.stockQty === 0 && formData.status !== 'discontinued'
        ? 'out_of_stock'
        : formData.status;

    let updatedProducts: Product[];

    if (editingProduct) {
      updatedProducts = allProducts.map((p) =>
        p.id === editingProduct.id
          ? { ...p, ...formData, status, updatedAt: now }
          : p
      );
      toast({ title: 'Thành công', description: 'Đã cập nhật sản phẩm' });
    } else {
      const newProduct: Product = {
        id: generateId(),
        sku: formData.sku,
        name: formData.name,
        type: formData.type,
        groupId: formData.groupId || null,
        brandId: formData.brandId || null,
        config: formData.config,
        costPrice: formData.costPrice,
        salePriceBeforeTax: formData.salePriceBeforeTax,
        salePrice: formData.salePrice,
        vatImport: formData.vatImport,
        vatSale: formData.vatSale,
        stockQty: formData.stockQty,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        unit: formData.unit,
        status,
        notes: formData.notes,
        description: formData.description,
        warranty: formData.warranty,
        directSale: formData.directSale,
        loyaltyPoints: formData.loyaltyPoints,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      updatedProducts = [...allProducts, newProduct];
      toast({ title: 'Thành công', description: 'Đã tạo sản phẩm mới' });
    }

    saveProducts(updatedProducts);
    loadData();
    setIsDialogOpen(false);
    resetForm();
  }, [formData, editingProduct, loadData, resetForm, toast]);

  const handleDelete = useCallback(() => {
    if (!deletingProduct) return;
    const allProducts = getProducts();
    const updatedProducts = allProducts.map((p) =>
      p.id === deletingProduct.id
        ? { ...p, isDeleted: true, updatedAt: new Date().toISOString() }
        : p
    );
    saveProducts(updatedProducts);
    loadData();
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
    toast({ title: 'Thành công', description: 'Đã xóa sản phẩm' });
  }, [deletingProduct, loadData, toast]);

  // Config handlers
  const updateConfig = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  }, []);

  const addConfigKey = useCallback(() => {
    const newKey = `Thuộc tính ${Object.keys(formData.config).length + 1}`;
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [newKey]: '' },
    }));
  }, [formData.config]);

  const removeConfigKey = useCallback((key: string) => {
    setFormData((prev) => {
      const { [key]: removed, ...rest } = prev.config;
      return { ...prev, config: rest };
    });
  }, []);

  // Selection handlers
  const toggleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedProducts((prev) => {
      if (prev.size === paginatedProducts.length) {
        return new Set();
      }
      return new Set(paginatedProducts.map((p) => p.id));
    });
  }, []);

  // Print handlers
  const openPrintDialog = useCallback(() => {
    const quantities: Record<string, number> = {};
    selectedProducts.forEach((id) => {
      quantities[id] = 1;
    });
    setPrintQuantities(quantities);
    setIsPrintDialogOpen(true);
  }, [selectedProducts]);

  const handlePrint = useCallback(() => {
    const selectedProductsList = products.filter((p) =>
      selectedProducts.has(p.id)
    );

    const printContent = `
      <html>
        <head>
          <title>In tem mã</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label { border: 1px solid #ddd; padding: 10px; margin: 5px; display: inline-block; width: 200px; }
            .label-sku { font-weight: bold; font-size: 14px; }
            .label-name { font-size: 12px; margin-top: 5px; }
            .label-price { font-size: 14px; font-weight: bold; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${selectedProductsList
            .map((p) => {
              const qty = printQuantities[p.id] || 1;
              return Array(qty)
                .fill(
                  `<div class="label">
                    <div class="label-sku">${p.sku}</div>
                    <div class="label-name">${p.name}</div>
                    <div class="label-price">${formatCurrency(p.salePrice)}</div>
                  </div>`
                )
                .join('');
            })
            .join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    setIsPrintDialogOpen(false);
    setSelectedProducts(new Set());
    toast({ title: 'Thành công', description: 'Đã mở cửa sổ in tem mã' });
  }, [products, selectedProducts, printQuantities, toast]);

  const removePrintItem = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setPrintQuantities((prev) => {
      const { [productId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filterGroup !== 'all' && p.groupId !== filterGroup) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterSupplier !== 'all' && (p as any).supplierId !== filterSupplier) return false;
    if (
      searchTerm &&
      !p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AppLayout title="Hàng hóa">
      <div className="animate-fade-in">
        <PageHeader
          title="Hàng hóa"
          description="Quản lý danh sách hàng hóa và tồn kho"
          actions={
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Lọc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Nhóm hàng hóa</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={filterGroup}
                    onValueChange={setFilterGroup}
                  >
                    <DropdownMenuRadioItem value="all">
                      Tất cả nhóm
                    </DropdownMenuRadioItem>
                    {groups.map((g) => (
                      <DropdownMenuRadioItem key={g.id} value={g.id}>
                        {g.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Nhà cung cấp</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={filterSupplier}
                    onValueChange={setFilterSupplier}
                  >
                    <DropdownMenuRadioItem value="all">
                      Tất cả NCC
                    </DropdownMenuRadioItem>
                    {suppliers.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id}>
                        {s.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Trạng thái</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <DropdownMenuRadioItem value="all">Tất cả</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="in_stock">
                      Còn hàng
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="out_of_stock">
                      Hết hàng
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="discontinued">
                      Ngừng bán
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo mới
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openNewCreateDialog('product')}>
                    <Package className="w-4 h-4 mr-2" />
                    Hàng hóa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openNewCreateDialog('service')}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Dịch vụ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        {/* Search and Selection Actions */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedProducts.size}{' '}
                <X
                  className="w-3 h-3 inline cursor-pointer"
                  onClick={() => setSelectedProducts(new Set())}
                />
              </span>
              <Button variant="outline" onClick={openPrintDialog}>
                <Printer className="w-4 h-4 mr-2" />
                In tem mã
              </Button>
            </div>
          )}
        </div>

        {/* Product Table */}
        <ProductTable
          products={paginatedProducts}
          selectedIds={selectedProducts}
          expandedProductId={expandedProductId}
          imports={imports}
          invoices={invoices}
          onSelectProduct={toggleSelectProduct}
          onSelectAll={toggleSelectAll}
          onToggleExpand={(id) =>
            setExpandedProductId(expandedProductId === id ? null : id)
          }
          onEdit={openEditDialog}
          onDelete={(product) => {
            setDeletingProduct(product);
            setIsDeleteDialogOpen(true);
          }}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredProducts.length)} trong số{' '}
              {filteredProducts.length} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        groups={groups}
        suppliers={suppliers}
        isEditing={!!editingProduct}
        onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        onSave={handleSave}
        onGroupChange={handleGroupChange}
        onConfigChange={updateConfig}
        onAddConfigKey={addConfigKey}
        onRemoveConfigKey={removeConfigKey}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct?.name}"?`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Print Dialog */}
      <PrintDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        selectedProducts={products.filter((p) => selectedProducts.has(p.id))}
        printQuantities={printQuantities}
        onQuantityChange={(id, qty) =>
          setPrintQuantities((prev) => ({ ...prev, [id]: qty }))
        }
        onRemoveItem={removePrintItem}
        onPrint={handlePrint}
      />

      {/* New Product/Service Form Dialog */}
      <ProductFormDialogNew
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        formData={newFormData}
        groups={groups}
        suppliers={suppliers}
        brands={brands}
        isEditing={!!editingProduct}
        onFormChange={handleNewFormChange}
        onSave={handleNewSave}
        onSaveAndCreate={handleNewSaveAndCreate}
        onGroupChange={handleNewGroupChange}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onCreateBrand={() => setIsCreateBrandOpen(true)}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onCreated={(newGroup) => {
          setGroups((prev) => [...prev, newGroup]);
          setNewFormData((prev) => ({ ...prev, groupId: newGroup.id }));
        }}
      />

      {/* Create Brand Dialog */}
      <CreateBrandDialog
        open={isCreateBrandOpen}
        onOpenChange={setIsCreateBrandOpen}
        onCreated={(newBrand) => {
          setBrands((prev) => [...prev, newBrand]);
          setNewFormData((prev) => ({ ...prev, brandId: newBrand.id }));
        }}
      />
    </AppLayout>
  );
}
