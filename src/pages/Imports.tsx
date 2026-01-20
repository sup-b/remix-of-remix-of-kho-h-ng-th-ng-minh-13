import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Eye, Filter, Search, Printer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportFilterPanel, ImportFilters } from '@/components/imports/ImportFilterPanel';
import { Import, ImportItem, Product, Supplier } from '@/types';
import {
  getImports,
  saveImports,
  getProducts,
  saveProducts,
  getSuppliers,
  getSupplierById,
  getProductById,
  generateId,
  formatCurrency,
  formatDateTime,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';

interface ImportItemWithSerial extends ImportItem {
  serialNumber?: string;
}

interface ImportWithSerial extends Omit<Import, 'items'> {
  items: ImportItemWithSerial[];
}

export default function Imports() {
  const navigate = useNavigate();
  const [imports, setImports] = useState<ImportWithSerial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportWithSerial | null>(null);
  const { toast } = useToast();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ImportFilters | null>(null);
  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
    items: [] as ImportItemWithSerial[],
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemSerial, setItemSerial] = useState('');

  useEffect(() => {
    initSeedData();
    loadData();
  }, []);

  const loadData = () => {
    setImports(getImports() as ImportWithSerial[]);
    setProducts(getProducts().filter((p) => !p.isDeleted));
    setSuppliers(getSuppliers());
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      notes: '',
      items: [],
    });
    setSelectedProductId('');
    setItemQuantity(1);
    setItemPrice(0);
    setItemSerial('');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addItem = () => {
    if (!selectedProductId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn hàng hóa',
        variant: 'destructive',
      });
      return;
    }

    const product = getProductById(selectedProductId);
    if (!product) return;

    // Check if product already in list
    const existingIndex = formData.items.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingIndex >= 0) {
      const updatedItems = [...formData.items];
      updatedItems[existingIndex].quantity += itemQuantity;
      updatedItems[existingIndex].total =
        updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      const price = itemPrice || product.costPrice;
      const newItem: ImportItemWithSerial = {
        productId: selectedProductId,
        quantity: itemQuantity,
        unitPrice: price,
        total: itemQuantity * price,
        serialNumber: itemSerial,
      };
      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }

    setSelectedProductId('');
    setItemQuantity(1);
    setItemPrice(0);
    setItemSerial('');
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSave = () => {
    if (!formData.supplierId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn nhà cung cấp',
        variant: 'destructive',
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất một hàng hóa',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

    const newImport: ImportWithSerial = {
      id: generateId(),
      supplierId: formData.supplierId,
      date: now,
      items: formData.items,
      totalAmount,
      notes: formData.notes,
      createdAt: now,
    };

    // Update stock quantities
    const allProducts = getProducts();
    const updatedProducts = allProducts.map((p) => {
      const importItem = formData.items.find((item) => item.productId === p.id);
      if (importItem) {
        const newStock = p.stockQty + importItem.quantity;
        return {
          ...p,
          stockQty: newStock,
          status: newStock > 0 ? 'in_stock' : p.status,
          updatedAt: now,
        } as Product;
      }
      return p;
    });

    // Save
    const allImports = getImports();
    saveImports([...allImports, newImport]);
    saveProducts(updatedProducts);

    loadData();
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: 'Thành công',
      description: 'Đã tạo phiếu nhập hàng và cập nhật tồn kho',
    });
  };

  const viewDetail = (importRecord: ImportWithSerial) => {
    setSelectedImport(importRecord);
    setIsDetailDialogOpen(true);
  };

  // Print import receipt
  const handlePrintImport = (importRecord: ImportWithSerial) => {
    const supplier = getSupplierById(importRecord.supplierId);
    
    const printContent = `
      <html>
        <head>
          <title>Phiếu nhập hàng - ${importRecord.id.slice(-8).toUpperCase()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PHIẾU NHẬP HÀNG</h1>
            <p>Mã phiếu: #${importRecord.id.slice(-8).toUpperCase()}</p>
          </div>
          <div class="info">
            <div>
              <p><strong>Nhà cung cấp:</strong> ${supplier?.name || 'N/A'}</p>
              <p><strong>Địa chỉ:</strong> ${supplier?.address || 'N/A'}</p>
              <p><strong>SĐT:</strong> ${supplier?.phone || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Ngày nhập:</strong> ${formatDateTime(importRecord.date)}</p>
              <p><strong>Ghi chú:</strong> ${importRecord.notes || 'Không có'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${importRecord.items.map((item, index) => {
                const product = getProductById(item.productId);
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${product?.sku || 'N/A'}</td>
                    <td>${product?.name || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Tổng tiền: ${formatCurrency(importRecord.totalAmount)}</p>
          </div>
          <div class="footer">
            <div class="signature">
              <p><strong>Người giao hàng</strong></p>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature">
              <p><strong>Người nhận hàng</strong></p>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Filter imports
  const filteredImports = imports.filter((imp) => {
    // If active filters from panel
    if (activeFilters) {
      // Filter by import code
      if (activeFilters.importCode && !imp.id.toLowerCase().includes(activeFilters.importCode.toLowerCase())) {
        return false;
      }
      // Filter by supplier search (name)
      if (activeFilters.supplierSearch) {
        const supplier = getSupplierById(imp.supplierId);
        if (!supplier?.name.toLowerCase().includes(activeFilters.supplierSearch.toLowerCase())) {
          return false;
        }
      }
      // Filter by supplier ID
      if (activeFilters.supplierId !== 'all' && imp.supplierId !== activeFilters.supplierId) {
        return false;
      }
      // Filter by product search
      if (activeFilters.productSearch) {
        const hasMatchingProduct = imp.items.some((item) => {
          const product = getProductById(item.productId);
          return (
            product?.name.toLowerCase().includes(activeFilters.productSearch.toLowerCase()) ||
            product?.sku.toLowerCase().includes(activeFilters.productSearch.toLowerCase())
          );
        });
        if (!hasMatchingProduct) return false;
      }
      // Filter by date range
      if (activeFilters.dateFrom) {
        const fromDate = new Date(activeFilters.dateFrom);
        const impDate = new Date(imp.date);
        if (impDate < fromDate) return false;
      }
      if (activeFilters.dateTo) {
        const toDate = new Date(activeFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        const impDate = new Date(imp.date);
        if (impDate > toDate) return false;
      }
      return true;
    }

    // Fallback to simple search
    if (searchTerm && !imp.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterSupplier !== 'all' && imp.supplierId !== filterSupplier) {
      return false;
    }
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      const impDate = new Date(imp.date);
      if (impDate < fromDate) return false;
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      const impDate = new Date(imp.date);
      if (impDate > toDate) return false;
    }
    return true;
  });

  const columns: Column<ImportWithSerial>[] = [
    {
      key: 'id',
      header: 'Mã phiếu',
      render: (record) => (
        <span className="font-mono text-xs">#{record.id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'supplierId',
      header: 'Nhà cung cấp',
      render: (record) => {
        const supplier = getSupplierById(record.supplierId);
        return <span>{supplier?.name || 'N/A'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Ngày nhập',
      render: (record) => <span>{formatDateTime(record.date)}</span>,
    },
    {
      key: 'items',
      header: 'Số hàng hóa',
      render: (record) => (
        <Badge variant="secondary">{record.items.length} SP</Badge>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Tổng tiền',
      render: (record) => (
        <span className="font-medium text-primary">
          {formatCurrency(record.totalAmount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (record) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => viewDetail(record)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handlePrintImport(record)}>
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Nhập hàng">
      <div className="animate-fade-in">
        <PageHeader
          title="Nhập hàng"
          description="Quản lý phiếu nhập hàng từ nhà cung cấp"
          actions={
            <Button onClick={() => navigate('/imports/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo phiếu nhập
            </Button>
          }
        />

        {/* Import Filter Panel */}
        <ImportFilterPanel
          suppliers={suppliers}
          onFilter={(filters) => setActiveFilters(filters)}
          onReset={() => {
            setActiveFilters(null);
            setSearchTerm('');
            setFilterSupplier('all');
            setFilterDateFrom('');
            setFilterDateTo('');
          }}
        />

        <DataTable
          data={filteredImports.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )}
          columns={columns}
          emptyMessage="Chưa có phiếu nhập nào"
        />
      </div>

      {/* Create Import Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo phiếu nhập hàng</DialogTitle>
            <DialogDescription>
              Chọn nhà cung cấp và thêm hàng hóa vào phiếu nhập
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Supplier & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">Nhà cung cấp *</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, supplierId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  placeholder="Ghi chú phiếu nhập..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Add Product */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label>Thêm hàng hóa</Label>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1 min-w-[200px]">
                    <SelectValue placeholder="Chọn hàng hóa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="SL"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Đơn giá"
                  value={itemPrice || ''}
                  onChange={(e) => setItemPrice(Number(e.target.value))}
                  className="w-32"
                />
                <Input
                  placeholder="Số seri"
                  value={itemSerial}
                  onChange={(e) => setItemSerial(e.target.value)}
                  className="w-40"
                />
                <Button type="button" onClick={addItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hàng hóa</TableHead>
                      <TableHead className="w-24 text-right">Số lượng</TableHead>
                      <TableHead className="w-32 text-right">Đơn giá</TableHead>
                      <TableHead className="w-28">Số seri</TableHead>
                      <TableHead className="w-32 text-right">Thành tiền</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => {
                      const product = getProductById(item.productId);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{product?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.serialNumber || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="font-medium">
                        Tổng cộng
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(
                          formData.items.reduce((sum, item) => sum + item.total, 0)
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu phiếu nhập</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
            <DialogDescription>
              Mã phiếu: #{selectedImport?.id.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nhà cung cấp:</span>
                  <p className="font-medium">
                    {getSupplierById(selectedImport.supplierId)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày nhập:</span>
                  <p className="font-medium">
                    {formatDateTime(selectedImport.date)}
                  </p>
                </div>
                {selectedImport.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Ghi chú:</span>
                    <p>{selectedImport.notes}</p>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hàng hóa</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead>Số seri</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedImport.items.map((item, idx) => {
                    const product = getProductById(item.productId);
                    return (
                      <TableRow key={idx}>
                        <TableCell>{product?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.serialNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="font-medium">
                      Tổng cộng
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(selectedImport.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
