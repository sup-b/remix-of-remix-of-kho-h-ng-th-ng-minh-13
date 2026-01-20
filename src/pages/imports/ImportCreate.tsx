import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Grid3X3,
  Search,
  Save,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useProducts,
  useSuppliers,
  useCategories,
  useCreateSupplier,
  useCreateProduct,
  useCreatePurchaseReceipt,
  formatCurrency,
  Product,
} from '@/hooks/useSupabaseData';

interface ImportItem {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  amount: number;
}

export default function ImportCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useCategories();
  const createSupplier = useCreateSupplier();
  const createProduct = useCreateProduct();
  const createPurchaseReceipt = useCreatePurchaseReceipt();

  // Form state
  const [items, setItems] = useState<ImportItem[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [importDate, setImportDate] = useState(new Date().toISOString().slice(0, 16));
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [importVat, setImportVat] = useState(false);
  const [vatAmount, setVatAmount] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  
  // Category grid
  const [isProductGridOpen, setIsProductGridOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick create dialogs
  const [isQuickCreateProductOpen, setIsQuickCreateProductOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);

  // Quick create product form
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    category_id: '',
    unit: 'cái',
    sale_price: 0,
  });

  // Quick create supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Keyboard shortcut F3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setProductSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculations
  const totalItemsAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items]
  );

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (totalItemsAmount * discountValue) / 100;
    }
    return discountValue;
  }, [totalItemsAmount, discountType, discountValue]);

  const vatAmountCalc = useMemo(() => (importVat ? vatAmount : 0), [importVat, vatAmount]);

  const supplierPayable = useMemo(
    () => Math.max(0, totalItemsAmount - discountAmount + vatAmountCalc),
    [totalItemsAmount, discountAmount, vatAmountCalc]
  );

  const totalPayable = useMemo(
    () => Math.max(0, supplierPayable + otherCost),
    [supplierPayable, otherCost]
  );

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20);
    const search = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.code.toLowerCase().includes(search) || 
        p.name.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [products, productSearch]);

  // Filter products for grid
  const gridProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  // Add product to items
  const addProduct = useCallback((product: Product) => {
    const existingIndex = items.findIndex((item) => item.product_id === product.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                amount: (item.quantity + 1) * item.unit_price - item.discount,
              }
            : item
        )
      );
    } else {
      const newItem: ImportItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit: product.unit,
        quantity: 1,
        unit_price: product.average_cost || 0,
        discount: 0,
        amount: product.average_cost || 0,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setProductSearch('');
    setProductSearchOpen(false);
    setIsProductGridOpen(false);
  }, [items]);

  // Update item
  const updateItem = useCallback(
    (id: string, field: keyof ImportItem, value: number) => {
      if (field === 'quantity' && value <= 0) value = 1;
      if (field === 'unit_price' && value < 0) value = 0;
      if (field === 'discount' && value < 0) value = 0;
      
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          updated.amount = Math.max(0, updated.quantity * updated.unit_price - updated.discount);
          return updated;
        })
      );
    },
    []
  );

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Create quick product
  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên hàng hóa', variant: 'destructive' });
      return;
    }
    try {
      const code = newProduct.code || `SP${Date.now().toString().slice(-6)}`;
      const result = await createProduct.mutateAsync({
        code,
        name: newProduct.name,
        category_id: newProduct.category_id || null,
        unit: newProduct.unit,
        sale_price_default: newProduct.sale_price,
        status: 'active',
        track_inventory: true,
      });

      // Add to items
      const newItem: ImportItem = {
        id: crypto.randomUUID(),
        product_id: result.id,
        product_code: code,
        product_name: newProduct.name,
        unit: newProduct.unit,
        quantity: 1,
        unit_price: 0,
        discount: 0,
        amount: 0,
      };
      setItems((prev) => [...prev, newItem]);

      setNewProduct({ code: '', name: '', category_id: '', unit: 'cái', sale_price: 0 });
      setIsQuickCreateProductOpen(false);
      toast({ title: 'Thành công', description: 'Đã tạo hàng hóa và thêm vào phiếu' });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo hàng hóa', variant: 'destructive' });
    }
  };

  // Create supplier
  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên NCC', variant: 'destructive' });
      return;
    }
    try {
      const result = await createSupplier.mutateAsync({
        name: newSupplier.name,
        phone: newSupplier.phone || null,
        address: newSupplier.address || null,
        status: 'active',
      });
      setSupplierId(result.id);
      setNewSupplier({ name: '', phone: '', address: '' });
      setIsCreateSupplierOpen(false);
      toast({ title: 'Thành công', description: 'Đã tạo nhà cung cấp' });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo NCC', variant: 'destructive' });
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (items.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm hàng hóa', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await createPurchaseReceipt.mutateAsync({
        supplier_id: supplierId || null,
        receipt_date: new Date(importDate).toISOString(),
        discount_type: discountType,
        discount_value: discountValue,
        note,
        status: 'draft',
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total_price: item.amount,
        })),
      });

      toast({ title: 'Thành công', description: 'Đã lưu phiếu tạm (chưa cập nhật kho)' });
      navigate('/imports');
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo phiếu nhập', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Complete import
  const handleComplete = async () => {
    if (items.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm hàng hóa', variant: 'destructive' });
      return;
    }

    // Validate items
    for (const item of items) {
      if (item.quantity <= 0) {
        toast({ title: 'Lỗi', description: `Số lượng phải > 0: ${item.product_name}`, variant: 'destructive' });
        return;
      }
      if (item.unit_price < 0) {
        toast({ title: 'Lỗi', description: `Đơn giá không được âm: ${item.product_name}`, variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);
    try {
      await createPurchaseReceipt.mutateAsync({
        supplier_id: supplierId || null,
        receipt_date: new Date(importDate).toISOString(),
        discount_type: discountType,
        discount_value: discountValue,
        note,
        status: 'completed',
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total_price: item.amount,
        })),
      });

      toast({ title: 'Thành công', description: 'Đã hoàn thành phiếu nhập và cập nhật kho' });
      navigate('/imports');
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo phiếu nhập', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout title="Tạo phiếu nhập">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/imports')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nhập hàng</h1>
              <p className="text-sm text-muted-foreground">Tạo phiếu nhập hàng mới</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Items Table */}
          <div className="col-span-2 space-y-4">
            {/* Product Search Header */}
            <div className="flex items-center gap-3 bg-card rounded-lg border p-4">
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                      className="pl-9"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Tìm theo mã hoặc tên..." 
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy sản phẩm</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => addProduct(product)}
                            className="flex justify-between cursor-pointer"
                          >
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <div className="text-xs text-muted-foreground">
                                Mã: {product.code} | Giá: {formatCurrency(product.sale_price_default)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Tồn: {product.stock_qty || 0} | Giá vốn: {formatCurrency(product.average_cost || 0)}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={() => setIsProductGridOpen(true)}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsQuickCreateProductOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Items Table */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>Mã hàng</TableHead>
                    <TableHead>Tên hàng</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead className="text-right w-24">Số lượng</TableHead>
                    <TableHead className="text-right w-32">Đơn giá</TableHead>
                    <TableHead className="text-right w-28">Giảm giá</TableHead>
                    <TableHead className="text-right w-32">Thành tiền</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Grid3X3 className="w-12 h-12 text-muted-foreground/30" />
                          <p>Chưa có hàng hóa</p>
                          <p className="text-sm">Tìm hoặc thêm hàng hóa vào phiếu nhập</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            min={1}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(item.id, 'unit_price', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            min={0}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(item.id, 'discount', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            min={0}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right: Import Info */}
          <div className="space-y-4">
            {/* Supplier */}
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <Label>Nhà cung cấp</Label>
              <div className="flex gap-2">
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn NCC hoặc để trống" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateSupplierOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {!supplierId && (
                <p className="text-xs text-muted-foreground">
                  Để trống sẽ mặc định "Khách lẻ"
                </p>
              )}
            </div>

            {/* Import Info */}
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Mã phiếu nhập</Label>
                <Badge variant="secondary">Tự sinh</Badge>
              </div>
              <Input value="PN..." disabled className="bg-muted" />
              
              <div className="space-y-2">
                <Label>Ngày nhập</Label>
                <Input
                  type="datetime-local"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Badge variant="outline">Phiếu mới</Badge>
              </div>
            </div>

            {/* Cost Calculation */}
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Tính tiền</h4>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng tiền hàng:</span>
                <span className="font-medium">{formatCurrency(totalItemsAmount)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-1">Giảm giá:</span>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as 'amount' | 'percent')}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">VND</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0}
                  className="w-24 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">VAT nhập hàng:</span>
                <Switch checked={importVat} onCheckedChange={setImportVat} />
              </div>

              {importVat && (
                <Input
                  type="number"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0}
                  placeholder="Số tiền VAT"
                />
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chi phí trả NCC:</span>
                <span className="font-medium">{formatCurrency(supplierPayable)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Chi phí khác:</Label>
                <Input
                  type="number"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0}
                />
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Cần trả NCC:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalPayable)}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="bg-card rounded-lg border p-4 space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú phiếu nhập..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu tạm
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={isSaving}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Hoàn thành
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid Dialog */}
      <Dialog open={isProductGridOpen} onOpenChange={setIsProductGridOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chọn hàng hóa</DialogTitle>
            <DialogDescription>Chọn nhóm hàng và sản phẩm để thêm vào phiếu nhập</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4">
            <div className="w-48 space-y-2">
              <Label>Nhóm hàng</Label>
              <div className="space-y-1 max-h-96 overflow-auto">
                <Button
                  variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  Tất cả
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-auto">
                {gridProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addProduct(product)}
                  >
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.code}</p>
                    <p className="text-sm text-primary mt-1">
                      {formatCurrency(product.sale_price_default)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tồn: {product.stock_qty || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Create Product Dialog */}
      <Dialog open={isQuickCreateProductOpen} onOpenChange={setIsQuickCreateProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm hàng hóa mới</DialogTitle>
            <DialogDescription>Tạo nhanh hàng hóa và thêm vào phiếu nhập</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã hàng</Label>
                <Input
                  value={newProduct.code}
                  onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
                  placeholder="Tự sinh nếu để trống"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên hàng *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nhập tên hàng"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nhóm hàng</Label>
                <Select
                  value={newProduct.category_id}
                  onValueChange={(v) => setNewProduct((p) => ({ ...p, category_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Đơn vị</Label>
                <Select
                  value={newProduct.unit}
                  onValueChange={(v) => setNewProduct((p) => ({ ...p, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cái">Cái</SelectItem>
                    <SelectItem value="chiếc">Chiếc</SelectItem>
                    <SelectItem value="hộp">Hộp</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Giá bán</Label>
              <Input
                type="number"
                value={newProduct.sale_price}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, sale_price: parseFloat(e.target.value) || 0 }))
                }
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickCreateProductOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateProduct} disabled={createProduct.isPending}>
              Tạo & Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhà cung cấp</DialogTitle>
            <DialogDescription>Tạo nhà cung cấp mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên NCC *</Label>
              <Input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))}
                placeholder="Nhập tên NCC"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Nhập SĐT"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={newSupplier.address}
                onChange={(e) => setNewSupplier((s) => ({ ...s, address: e.target.value }))}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSupplierOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSupplier} disabled={createSupplier.isPending}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
