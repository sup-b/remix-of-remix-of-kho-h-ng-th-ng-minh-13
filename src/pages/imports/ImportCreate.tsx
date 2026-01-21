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
  formatCurrency,
  Product,
} from '@/hooks/useSupabaseData';
import { useCreatePurchaseOrder } from '@/hooks/usePurchaseOrders';

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
  const createPurchaseOrder = useCreatePurchaseOrder();

  // Form state
  const [items, setItems] = useState<ImportItem[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [importDate, setImportDate] = useState(new Date().toISOString().slice(0, 16));
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [importVat, setImportVat] = useState(false);
  const [vatRate, setVatRate] = useState(10);
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

  const afterDiscount = useMemo(
    () => Math.max(0, totalItemsAmount - discountAmount),
    [totalItemsAmount, discountAmount]
  );

  const vatAmountCalc = useMemo(
    () => (importVat ? afterDiscount * (vatRate / 100) : 0),
    [importVat, afterDiscount, vatRate]
  );

  const totalPayable = useMemo(
    () => Math.max(0, afterDiscount + vatAmountCalc + otherCost),
    [afterDiscount, vatAmountCalc, otherCost]
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
        unit_price: product.cost_price || 0,
        discount: 0,
        amount: product.cost_price || 0,
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

  // Prepare order data for API
  const prepareOrderData = () => ({
    supplier_id: supplierId || null,
    items: items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
    })),
    discount_type: discountType,
    discount_value: discountValue,
    vat_rate: importVat ? vatRate : 0,
    other_fee: otherCost,
    note,
    received_at: new Date(importDate).toISOString(),
  });

  // Save draft
  const handleSaveDraft = async () => {
    if (items.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm hàng hóa', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await createPurchaseOrder.mutateAsync(prepareOrderData());
      toast({ title: 'Thành công', description: 'Đã lưu phiếu tạm (chưa cập nhật kho)' });
      navigate('/imports');
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo phiếu nhập', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Complete import (create + complete immediately)
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
      // Create order first
      const order = await createPurchaseOrder.mutateAsync(prepareOrderData());
      
      // Complete immediately
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('purchase-order', {
        body: { action: 'complete', order_id: order.id },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Không thể hoàn thành phiếu nhập');
      }

      toast({ title: 'Thành công', description: 'Đã hoàn thành phiếu nhập và cập nhật kho' });
      navigate('/imports');
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo phiếu nhập', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

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
                                Tồn: {product.stock || 0} | Giá vốn: {formatCurrency(product.cost_price || 0)}
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
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Notes */}
            <div className="bg-card rounded-lg border p-4">
              <Label className="text-sm font-medium">Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú cho phiếu nhập..."
                className="mt-2"
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Supplier Selection */}
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Nhà cung cấp</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-mono text-xs mr-2">{s.code}</span>
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
                {selectedSupplier && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    <p className="font-mono text-primary">{selectedSupplier.code}</p>
                    <p>{selectedSupplier.name}</p>
                    {selectedSupplier.phone && <p className="text-muted-foreground">{selectedSupplier.phone}</p>}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Mã phiếu nhập</Label>
                <Input
                  value="(Tự động sinh)"
                  disabled
                  className="mt-2 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mã sẽ được tạo khi lưu phiếu (format: PNmmdd000)
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Thời gian nhập</Label>
                <Input
                  type="datetime-local"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Calculation Panel */}
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền hàng</span>
                <span className="font-medium">{formatCurrency(totalItemsAmount)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Giảm giá</Label>
                <div className="flex gap-2">
                  <Select
                    value={discountType}
                    onValueChange={(v: 'amount' | 'percent') => setDiscountType(v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">VNĐ</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    min={0}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">VAT nhập hàng</Label>
                <Switch checked={importVat} onCheckedChange={setImportVat} />
              </div>

              {importVat && (
                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">Thuế suất:</Label>
                  <Input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    min={0}
                    max={100}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Chi phí khác</Label>
                <Input
                  type="number"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0}
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {vatAmountCalc > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                    <span>{formatCurrency(vatAmountCalc)}</span>
                  </div>
                )}
                {otherCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chi phí khác</span>
                    <span>{formatCurrency(otherCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Cần trả NCC</span>
                  <span className="text-primary">{formatCurrency(totalPayable)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn hàng hóa</DialogTitle>
            <DialogDescription>Chọn từ danh sách hàng hóa</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả nhóm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhóm</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-4 gap-3">
              {gridProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => addProduct(product)}
                >
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>Tồn: {product.stock || 0}</span>
                    <span className="text-primary">{formatCurrency(product.cost_price || 0)}</span>
                  </div>
                </div>
              ))}
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
          <div className="space-y-4">
            <div>
              <Label>Mã hàng</Label>
              <Input
                value={newProduct.code}
                onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
                placeholder="Để trống để tự động sinh"
              />
            </div>
            <div>
              <Label>Tên hàng *</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nhập tên hàng hóa"
              />
            </div>
            <div>
              <Label>Nhóm hàng</Label>
              <Select
                value={newProduct.category_id}
                onValueChange={(v) => setNewProduct((p) => ({ ...p, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm hàng" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Đơn vị tính</Label>
                <Input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))}
                />
              </div>
              <div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickCreateProductOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateProduct} disabled={createProduct.isPending}>
              Tạo và thêm vào phiếu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Supplier Dialog */}
      <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
            <DialogDescription>Tạo nhanh nhà cung cấp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên NCC *</Label>
              <Input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))}
                placeholder="Nhập tên nhà cung cấp"
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
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
              Tạo NCC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
