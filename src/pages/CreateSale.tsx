import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Grid2X2, 
  Trash2,
  Check,
  User,
  Pencil,
  X,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useProducts, 
  useCustomers, 
  useCategories,
  useCreateCustomer,
  useCreateSalesInvoice,
  formatCurrency,
  Product,
  Customer
} from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface SaleItem {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  sale_price: number;
  discount: number;
  total_price: number;
  cost_price: number;
  profit: number;
  max_qty: number;
  note: string;
}

interface InvoiceTab {
  id: string;
  name: string;
  customer: Customer | null;
  items: SaleItem[];
  discount: number;
  discountType: 'amount' | 'percent';
  extraFee: number;
  vatEnabled: boolean;
  vatAmount: number;
  paymentMethod: string;
  customerPayment: number;
  note: string;
}

function createEmptyTab(index: number): InvoiceTab {
  return {
    id: crypto.randomUUID(),
    name: `Hóa đơn ${index}`,
    customer: null,
    items: [],
    discount: 0,
    discountType: 'amount',
    extraFee: 0,
    vatEnabled: false,
    vatAmount: 0,
    paymentMethod: 'cash',
    customerPayment: 0,
    note: '',
  };
}

export default function CreateSale() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const { data: categories = [] } = useCategories();
  const createCustomer = useCreateCustomer();
  const createSalesInvoice = useCreateSalesInvoice();

  // Multi-tab state
  const [tabs, setTabs] = useState<InvoiceTab[]>([createEmptyTab(1)]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  // Get active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Dialogs
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [gridSelectorOpen, setGridSelectorOpen] = useState(false);
  const [quickCreateCustomerOpen, setQuickCreateCustomerOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [extraFeeDialogOpen, setExtraFeeDialogOpen] = useState(false);

  // Search state
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick create customer
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setProductSearchOpen(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setCustomerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => (p.stock_qty || 0) > 0);
    if (productSearch) {
      const search = productSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search)
      );
    }
    return result.slice(0, 20);
  }, [products, productSearch]);

  // Grid products
  const gridProducts = useMemo(() => {
    let result = products.filter((p) => (p.stock_qty || 0) > 0);
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category_id === selectedCategory);
    }
    return result;
  }, [products, selectedCategory]);

  // Update active tab
  const updateActiveTab = (updates: Partial<InvoiceTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t))
    );
  };

  // Add product
  const addProduct = (product: Product) => {
    if ((product.stock_qty || 0) <= 0) {
      toast({ title: 'Hết hàng', description: 'Sản phẩm đã hết hàng', variant: 'destructive' });
      return;
    }

    const items = [...activeTab.items];
    const existingIndex = items.findIndex((item) => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      if (items[existingIndex].quantity < (product.stock_qty || 0)) {
        items[existingIndex].quantity += 1;
        const item = items[existingIndex];
        item.total_price = item.quantity * item.sale_price - item.discount;
        item.profit = (item.sale_price - item.cost_price) * item.quantity - item.discount;
      } else {
        toast({ title: 'Cảnh báo', description: 'Vượt quá tồn kho', variant: 'destructive' });
        return;
      }
    } else {
      const costPrice = product.average_cost || product.sale_price_default * 0.7;
      items.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        sale_price: product.sale_price_default,
        discount: 0,
        total_price: product.sale_price_default,
        cost_price: costPrice,
        profit: product.sale_price_default - costPrice,
        max_qty: product.stock_qty || 0,
        note: '',
      });
    }

    updateActiveTab({ items });
    setProductSearch('');
    setProductSearchOpen(false);
    setGridSelectorOpen(false);
  };

  // Update item
  const updateItem = (index: number, field: keyof SaleItem, value: number | string) => {
    const items = [...activeTab.items];
    const item = items[index];
    
    if (field === 'quantity') {
      const qty = Math.min(Math.max(1, value as number), item.max_qty);
      item.quantity = qty;
    } else if (field === 'sale_price') {
      item.sale_price = Math.max(0, value as number);
    } else if (field === 'discount') {
      item.discount = Math.max(0, value as number);
    } else if (field === 'note') {
      item.note = value as string;
    }
    
    item.total_price = Math.max(0, item.quantity * item.sale_price - item.discount);
    item.profit = (item.sale_price - item.cost_price) * item.quantity - item.discount;
    
    updateActiveTab({ items });
  };

  // Remove item
  const removeItem = (index: number) => {
    const items = activeTab.items.filter((_, i) => i !== index);
    updateActiveTab({ items });
  };

  // Add new tab
  const addNewTab = () => {
    const newTab = createEmptyTab(tabs.length + 1);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Close tab
  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // Create customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên khách hàng', variant: 'destructive' });
      return;
    }
    try {
      const result = await createCustomer.mutateAsync({
        name: newCustomer.name,
        phone: newCustomer.phone || null,
        status: 'active',
      });
      updateActiveTab({ customer: result as Customer });
      setNewCustomer({ name: '', phone: '' });
      setQuickCreateCustomerOpen(false);
      toast({ title: 'Thành công', description: 'Đã tạo khách hàng' });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo khách hàng', variant: 'destructive' });
    }
  };

  // Totals
  const subtotal = activeTab.items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = activeTab.discountType === 'percent' 
    ? subtotal * activeTab.discount / 100 
    : activeTab.discount;
  const totalVat = activeTab.vatEnabled ? activeTab.vatAmount : 0;
  const finalAmount = Math.max(0, subtotal - discountAmount + activeTab.extraFee + totalVat);
  const change = activeTab.customerPayment - finalAmount;

  // Quick amounts
  const quickAmounts = [
    finalAmount,
    Math.ceil(finalAmount / 50000) * 50000,
    Math.ceil(finalAmount / 100000) * 100000,
    Math.ceil(finalAmount / 100000) * 100000 + 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= finalAmount).slice(0, 4);

  // Handle payment
  const handlePayment = async () => {
    if (activeTab.items.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm sản phẩm', variant: 'destructive' });
      return;
    }
    if (activeTab.customerPayment < finalAmount) {
      toast({ title: 'Lỗi', description: 'Số tiền thanh toán không đủ', variant: 'destructive' });
      return;
    }

    try {
      await createSalesInvoice.mutateAsync({
        customer_id: activeTab.customer?.id || null,
        discount_type: activeTab.discountType,
        discount_value: activeTab.discount,
        extra_fee: activeTab.extraFee,
        vat_enabled: activeTab.vatEnabled,
        vat_amount: activeTab.vatAmount,
        note: activeTab.note,
        items: activeTab.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          discount: item.discount,
          total_price: item.total_price,
          cost_price: item.cost_price,
          profit: item.profit,
        })),
        payments: [{ method: activeTab.paymentMethod, amount: finalAmount }],
      });

      toast({
        title: 'Thanh toán thành công',
        description: `Tiền thối: ${formatCurrency(Math.max(0, change))}`,
      });

      // Reset tab or navigate
      if (tabs.length > 1) {
        closeTab(activeTabId);
      } else {
        updateActiveTab({
          customer: null,
          items: [],
          discount: 0,
          extraFee: 0,
          vatEnabled: false,
          vatAmount: 0,
          customerPayment: 0,
          note: '',
        });
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const currentDateTime = new Date().toLocaleString('vi-VN');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Bán hàng</h1>
        
        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm hàng hóa (F3)"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Tìm theo mã, tên hoặc barcode..." 
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
                      </div>
                      <div className="text-right text-sm">
                        <Badge variant="outline">Tồn: {product.stock_qty}</Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={() => setGridSelectorOpen(true)}>
          <Grid2X2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Invoice Tabs */}
      <div className="border-b bg-muted/30 px-4">
        <div className="flex items-center gap-1 py-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b-2 cursor-pointer transition-colors",
                tab.id === activeTabId
                  ? "bg-card border-primary text-primary"
                  : "border-transparent hover:bg-muted"
              )}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="text-sm font-medium">{tab.name}</span>
              {tab.items.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {tab.items.length}
                </Badge>
              )}
              {tabs.length > 1 && (
                <X
                  className="w-3 h-3 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                />
              )}
            </div>
          ))}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addNewTab}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto bg-muted/30">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur border-b">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-28">Mã hàng</TableHead>
                  <TableHead>Tên hàng</TableHead>
                  <TableHead className="w-20 text-center">SL</TableHead>
                  <TableHead className="w-28 text-right">Đơn giá</TableHead>
                  <TableHead className="w-28 text-right">Thành tiền</TableHead>
                  <TableHead className="w-32">Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">Chưa có sản phẩm</p>
                        <p className="text-sm">Nhấn F3 để tìm sản phẩm</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeTab.items.map((item, index) => (
                    <TableRow key={item.product_id} className="bg-card hover:bg-accent/50">
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.product_code}
                      </TableCell>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={1}
                          max={item.max_qty}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className="w-16 text-center mx-auto h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          value={item.sale_price}
                          onChange={(e) => updateItem(index, 'sale_price', Number(e.target.value))}
                          className="w-24 text-right h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.note}
                          onChange={(e) => updateItem(index, 'note', e.target.value)}
                          className="h-8"
                          placeholder="Ghi chú"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Pencil className="w-4 h-4" />
              <Input 
                placeholder="Ghi chú đơn hàng" 
                value={activeTab.note} 
                onChange={(e) => updateActiveTab({ note: e.target.value })} 
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-8" 
              />
            </div>
          </div>
        </div>

        {/* Right - Payment */}
        <div className="w-80 border-l bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between text-sm">
              <User className="w-4 h-4" />
              <span className="text-muted-foreground">{currentDateTime}</span>
            </div>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {activeTab.customer ? activeTab.customer.name : "Tìm khách hàng (F4)"}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0">
                <Command>
                  <CommandInput 
                    placeholder="Tìm khách hàng..." 
                    value={customerSearch} 
                    onValueChange={setCustomerSearch} 
                  />
                  <CommandList>
                    <CommandEmpty>
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => { 
                          setCustomerOpen(false); 
                          setQuickCreateCustomerOpen(true); 
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />Thêm khách mới
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { 
                        updateActiveTab({ customer: null }); 
                        setCustomerOpen(false); 
                      }}>
                        <Check className={cn("mr-2 h-4 w-4", !activeTab.customer ? "opacity-100" : "opacity-0")} />
                        Khách lẻ
                      </CommandItem>
                      {customers
                        .filter((c) => 
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone?.includes(customerSearch)
                        )
                        .map((customer) => (
                          <CommandItem 
                            key={customer.id} 
                            onSelect={() => { 
                              updateActiveTab({ customer }); 
                              setCustomerOpen(false); 
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", activeTab.customer?.id === customer.id ? "opacity-100" : "opacity-0")} />
                            <div>
                              <div>{customer.name}</div>
                              <div className="text-xs text-muted-foreground">{customer.phone}</div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng tiền hàng:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Giảm giá:</span>
              <Input 
                type="number" 
                min={0}
                value={activeTab.discount} 
                onChange={(e) => updateActiveTab({ discount: Math.max(0, Number(e.target.value)) })} 
                className="w-24 h-7 text-right" 
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Thu khác:</span>
              <Input 
                type="number" 
                min={0}
                value={activeTab.extraFee} 
                onChange={(e) => updateActiveTab({ extraFee: Math.max(0, Number(e.target.value)) })} 
                className="w-24 h-7 text-right" 
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">VAT (8%):</span>
              <Switch 
                checked={activeTab.vatEnabled} 
                onCheckedChange={(v) => updateActiveTab({ 
                  vatEnabled: v, 
                  vatAmount: v ? Math.round((subtotal - discountAmount) * 0.08) : 0 
                })} 
              />
            </div>
            {activeTab.vatEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiền VAT:</span>
                <span>{formatCurrency(activeTab.vatAmount)}</span>
              </div>
            )}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Khách cần trả:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(finalAmount)}</span>
              </div>
              <RadioGroup 
                value={activeTab.paymentMethod} 
                onValueChange={(v) => updateActiveTab({ paymentMethod: v })} 
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'cash', label: 'Tiền mặt' },
                  { value: 'transfer', label: 'Chuyển khoản' },
                  { value: 'card', label: 'Thẻ' },
                  { value: 'ewallet', label: 'Ví điện tử' },
                ].map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.value} id={method.value} />
                    <Label htmlFor={method.value} className="text-sm">{method.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tiền khách đưa:</Label>
              <Input 
                type="number" 
                min={0}
                value={activeTab.customerPayment} 
                onChange={(e) => updateActiveTab({ customerPayment: Math.max(0, Number(e.target.value)) })} 
                className="text-right text-lg font-semibold" 
              />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button 
                    key={amount} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateActiveTab({ customerPayment: amount })}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
            {activeTab.customerPayment > 0 && (
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-medium">Tiền thối:</span>
                <span className={cn(
                  "text-lg font-bold",
                  change >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 border-t space-y-2">
            <Button variant="outline" className="w-full" disabled>
              <Printer className="w-4 h-4 mr-2" />
              IN TẠM
            </Button>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePayment}
              disabled={createSalesInvoice.isPending || activeTab.items.length === 0}
            >
              THANH TOÁN
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid Dialog */}
      <Dialog open={gridSelectorOpen} onOpenChange={setGridSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm</DialogTitle>
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
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      (product.stock_qty || 0) > 0 
                        ? "hover:bg-accent" 
                        : "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => (product.stock_qty || 0) > 0 && addProduct(product)}
                  >
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.code}</p>
                    <p className="text-sm text-primary mt-1">
                      {formatCurrency(product.sale_price_default)}
                    </p>
                    <Badge variant={(product.stock_qty || 0) > 0 ? "outline" : "destructive"} className="mt-1">
                      Tồn: {product.stock_qty || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Create Customer Dialog */}
      <Dialog open={quickCreateCustomerOpen} onOpenChange={setQuickCreateCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khách hàng</DialogTitle>
            <DialogDescription>Tạo khách hàng mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên khách hàng *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))}
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))}
                placeholder="Nhập SĐT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCreateCustomerOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCustomer} disabled={createCustomer.isPending}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
