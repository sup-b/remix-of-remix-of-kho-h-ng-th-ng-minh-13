import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Grid2X2, 
  Trash2,
  Check,
  CalendarIcon,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useProducts, 
  useSuppliers, 
  useCreatePurchaseReceipt,
  formatCurrency,
  Product,
  Supplier
} from '@/hooks/useSupabaseData';
import { ProductGridSelector } from '@/components/pos/ProductGridSelector';
import { QuickCreateProductDialog } from '@/components/pos/QuickCreateProductDialog';
import { QuickCreateSupplierDialog } from '@/components/pos/QuickCreateSupplierDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';

interface PurchaseItem {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  unit: string;
}

export default function CreateImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const createPurchaseReceipt = useCreatePurchaseReceipt();

  // Dialogs
  const [gridSelectorOpen, setGridSelectorOpen] = useState(false);
  const [quickCreateProductOpen, setQuickCreateProductOpen] = useState(false);
  const [quickCreateSupplierOpen, setQuickCreateSupplierOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [receiptCode, setReceiptCode] = useState('');
  const [receiptDate, setReceiptDate] = useState<Date>(new Date());
  const [receiptTime, setReceiptTime] = useState(format(new Date(), 'HH:mm'));
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [note, setNote] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Generate receipt code on mount
  useEffect(() => {
    const today = format(new Date(), 'yyMMdd');
    setReceiptCode(`PN${today}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  }, []);

  // Filtered products for search
  const filteredProducts = products.filter((p) =>
    productSearch === '' ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Add product to list
  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex((item) => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].total_price = 
        updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price - 
        updatedItems[existingIndex].discount;
      setItems(updatedItems);
    } else {
      const newItem: PurchaseItem = {
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        unit_price: product.average_cost || product.sale_price_default * 0.7,
        discount: 0,
        total_price: product.average_cost || product.sale_price_default * 0.7,
        unit: product.unit,
      };
      setItems([...items, newItem]);
    }
    setProductSearch('');
  };

  // Update item
  const updateItem = (index: number, field: keyof PurchaseItem, value: number | string) => {
    const updatedItems = [...items];
    (updatedItems[index] as any)[field] = value;
    
    // Recalculate total
    const item = updatedItems[index];
    item.total_price = item.quantity * item.unit_price - item.discount;
    
    setItems(updatedItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = discountType === 'percent' ? subtotal * discount / 100 : discount;
  const finalAmount = subtotal - discountAmount;

  // Handle save
  const handleSave = async () => {
    if (items.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất một sản phẩm',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPurchaseReceipt.mutateAsync({
        supplier_id: selectedSupplier?.id || null,
        receipt_date: receiptDate.toISOString(),
        discount_type: discountType,
        discount_value: discount,
        note,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total_price: item.total_price,
        })),
      });

      toast({
        title: 'Thành công',
        description: 'Đã tạo phiếu nhập và cập nhật tồn kho',
      });

      navigate('/imports');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo phiếu nhập',
        variant: 'destructive',
      });
    }
  };

  // Handle product created
  const handleProductCreated = (product: Product) => {
    addProduct(product);
  };

  // Handle supplier created
  const handleSupplierCreated = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/imports')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Nhập hàng</h1>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9"
          />
          {productSearch && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
              {filteredProducts.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                  onClick={() => addProduct(product)}
                >
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground ml-2">({product.code})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Tồn: {product.stock_qty || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setGridSelectorOpen(true)}
            title="Chọn từ danh sách"
          >
            <Grid2X2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setQuickCreateProductOpen(true)}
            title="Tạo hàng hóa mới"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Product Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Supplier Row */}
          {selectedSupplier && (
            <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tên NCC:</span>
              <span className="text-sm font-medium text-primary">{selectedSupplier.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 ml-auto"
                onClick={() => setSelectedSupplier(null)}
              >
                Xóa
              </Button>
            </div>
          )}
          
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead className="w-28">Mã hàng</TableHead>
                  <TableHead>Tên hàng</TableHead>
                  <TableHead className="w-24 text-center">Số lượng</TableHead>
                  <TableHead className="w-28 text-right">Đơn giá</TableHead>
                  <TableHead className="w-28 text-right">Giảm giá</TableHead>
                  <TableHead className="w-32 text-right">Thành tiền</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48">
                      <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg font-medium mb-2">Chưa có sản phẩm</p>
                        <p className="text-sm">Tìm kiếm hoặc chọn sản phẩm từ danh sách</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.product_id} className="hover:bg-muted/30">
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.product_code}
                      </TableCell>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className="w-20 text-center mx-auto h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                          className="w-28 text-right h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                          className="w-24 text-right h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(index)}
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
          <div className="border-t bg-card p-3">
            <Textarea
              placeholder="Ghi chú phiếu nhập..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l bg-card flex flex-col overflow-hidden">
          {/* Receipt Info */}
          <div className="p-4 border-b space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Mã phiếu nhập</Label>
              <Input
                value={receiptCode}
                onChange={(e) => setReceiptCode(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Ngày nhập</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mt-1 h-9">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(receiptDate, 'dd/MM/yyyy', { locale: vi })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={receiptDate}
                      onSelect={(date) => {
                        if (date) setReceiptDate(date);
                        setDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Giờ nhập</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={receiptTime}
                    onChange={(e) => setReceiptTime(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <Label className="text-xs text-muted-foreground">Nhà cung cấp</Label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between mt-1 h-9"
                  >
                    {selectedSupplier ? selectedSupplier.name : "Chọn NCC..."}
                    <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Tìm nhà cung cấp..." 
                      value={supplierSearch}
                      onValueChange={setSupplierSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => {
                            setSupplierOpen(false);
                            setQuickCreateSupplierOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm NCC mới
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          onSelect={() => {
                            setSelectedSupplier(null);
                            setSupplierOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !selectedSupplier ? "opacity-100" : "opacity-0")} />
                          Khách lẻ
                        </CommandItem>
                        {suppliers
                          .filter((s) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                          .map((supplier) => (
                            <CommandItem
                              key={supplier.id}
                              onSelect={() => {
                                setSelectedSupplier(supplier);
                                setSupplierOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedSupplier?.id === supplier.id ? "opacity-100" : "opacity-0")} />
                              {supplier.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số lượng:</span>
              <span className="font-medium">{totalQuantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng tiền hàng:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Giảm giá:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 h-7 text-right"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
                  className="h-7 rounded border px-2 text-sm"
                >
                  <option value="amount">VNĐ</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Cần trả NCC:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSave}
              disabled={createPurchaseReceipt.isPending || items.length === 0}
            >
              {createPurchaseReceipt.isPending ? 'Đang xử lý...' : 'Hoàn thành nhập hàng'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/imports')}
            >
              Hủy
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProductGridSelector
        open={gridSelectorOpen}
        onOpenChange={setGridSelectorOpen}
        onSelectProduct={addProduct}
      />
      <QuickCreateProductDialog
        open={quickCreateProductOpen}
        onOpenChange={setQuickCreateProductOpen}
        onProductCreated={handleProductCreated}
      />
      <QuickCreateSupplierDialog
        open={quickCreateSupplierOpen}
        onOpenChange={setQuickCreateSupplierOpen}
        onSupplierCreated={handleSupplierCreated}
      />
    </div>
  );
}
