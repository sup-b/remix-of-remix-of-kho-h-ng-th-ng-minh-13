import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Eye, Printer, CreditCard, Wallet, Filter, Search } from 'lucide-react';
import { Invoice, InvoiceItem, Product, Customer } from '@/types';
import {
  getInvoices,
  saveInvoices,
  getProducts,
  saveProducts,
  getCustomers,
  getCustomerById,
  getProductById,
  generateId,
  formatCurrency,
  formatDateTime,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';
import { useRole } from '@/contexts/RoleContext';

export default function Sales() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useRole();
  const printRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    paymentMethod: 'cash' as 'cash' | 'transfer',
    discountType: 'percent' as 'percent' | 'amount',
    discountValue: 0,
    amountPaid: 0,
    notes: '',
    items: [] as InvoiceItem[],
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    initSeedData();
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(getInvoices());
    setProducts(getProducts().filter((p) => !p.isDeleted && p.stockQty > 0));
    setCustomers(getCustomers());
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      paymentMethod: 'cash',
      discountType: 'percent',
      discountValue: 0,
      amountPaid: 0,
      notes: '',
      items: [],
    });
    setSelectedProductId('');
    setItemQuantity(1);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount =
      formData.discountType === 'percent'
        ? (subtotal * formData.discountValue) / 100
        : formData.discountValue;
    const totalAmount = subtotal - discountAmount;
    const change =
      formData.paymentMethod === 'cash'
        ? Math.max(0, formData.amountPaid - totalAmount)
        : 0;

    return { subtotal, discountAmount, totalAmount, change };
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

    // Check stock
    const existingItem = formData.items.find(
      (item) => item.productId === selectedProductId
    );
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentQty + itemQuantity;

    if (newTotalQty > product.stockQty) {
      if (!isAdmin) {
        toast({
          title: 'Lỗi',
          description: `Không đủ tồn kho. Còn lại: ${product.stockQty} ${product.unit}`,
          variant: 'destructive',
        });
        return;
      } else {
        toast({
          title: 'Cảnh báo',
          description: `Số lượng vượt tồn kho (${product.stockQty}). Cho phép vì bạn là Admin.`,
        });
      }
    }

    if (existingItem) {
      const updatedItems = formData.items.map((item) =>
        item.productId === selectedProductId
          ? {
              ...item,
              quantity: newTotalQty,
              total: newTotalQty * item.unitPrice,
            }
          : item
      );
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      const newItem: InvoiceItem = {
        productId: selectedProductId,
        quantity: itemQuantity,
        unitPrice: product.salePrice,
        total: itemQuantity * product.salePrice,
      };
      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }

    setSelectedProductId('');
    setItemQuantity(1);
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSave = () => {
    if (formData.items.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất một hàng hóa',
        variant: 'destructive',
      });
      return;
    }

    const { subtotal, discountAmount, totalAmount, change } = calculateTotals();

    if (formData.paymentMethod === 'cash' && formData.amountPaid < totalAmount) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền khách đưa không đủ',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      id: generateId(),
      customerId: formData.customerId || null,
      date: now,
      items: formData.items,
      subtotal,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      discountAmount,
      totalAmount,
      paymentMethod: formData.paymentMethod,
      amountPaid: formData.paymentMethod === 'cash' ? formData.amountPaid : totalAmount,
      change,
      notes: formData.notes,
      createdAt: now,
    };

    // Update stock quantities
    const allProducts = getProducts();
    const updatedProducts = allProducts.map((p) => {
      const invoiceItem = formData.items.find((item) => item.productId === p.id);
      if (invoiceItem) {
        const newStock = Math.max(0, p.stockQty - invoiceItem.quantity);
        return {
          ...p,
          stockQty: newStock,
          status: newStock === 0 ? 'out_of_stock' : p.status,
          updatedAt: now,
        } as Product;
      }
      return p;
    });

    // Save
    const allInvoices = getInvoices();
    saveInvoices([...allInvoices, newInvoice]);
    saveProducts(updatedProducts);

    loadData();
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: 'Thành công',
      description: 'Đã tạo hóa đơn và cập nhật tồn kho',
    });

    // Show invoice detail
    setSelectedInvoice(newInvoice);
    setIsDetailDialogOpen(true);
  };

  const viewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Hóa đơn</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
                .header { text-align: center; margin-bottom: 20px; }
                .total { font-weight: bold; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    // Search by invoice ID
    if (searchTerm && !inv.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filter by payment method
    if (filterPayment !== 'all' && inv.paymentMethod !== filterPayment) {
      return false;
    }
    // Filter by customer
    if (filterCustomer !== 'all') {
      if (filterCustomer === 'guest' && inv.customerId) return false;
      if (filterCustomer !== 'guest' && inv.customerId !== filterCustomer) return false;
    }
    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      const invDate = new Date(inv.date);
      if (invDate < fromDate) return false;
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      const invDate = new Date(inv.date);
      if (invDate > toDate) return false;
    }
    return true;
  });

  const { subtotal, discountAmount, totalAmount, change } = calculateTotals();

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      header: 'Mã HĐ',
      render: (record) => (
        <span className="font-mono text-xs">
          #{record.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'customerId',
      header: 'Khách hàng',
      render: (record) => {
        const customer = record.customerId
          ? getCustomerById(record.customerId)
          : null;
        return <span>{customer?.name || 'Khách lẻ'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Ngày bán',
      render: (record) => <span>{formatDateTime(record.date)}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Thanh toán',
      render: (record) => (
        <Badge variant="outline">
          {record.paymentMethod === 'cash' ? (
            <>
              <Wallet className="w-3 h-3 mr-1" />
              Tiền mặt
            </>
          ) : (
            <>
              <CreditCard className="w-3 h-3 mr-1" />
              Chuyển khoản
            </>
          )}
        </Badge>
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
        <Button variant="ghost" size="icon" onClick={() => viewDetail(record)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppLayout title="Bán hàng">
      <div className="animate-fade-in">
        <PageHeader
          title="Bán hàng"
          description="Tạo hóa đơn và quản lý giao dịch bán hàng"
          actions={
            <Button onClick={() => navigate('/sales/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo hóa đơn
            </Button>
          }
        />

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Lọc
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Phương thức TT</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filterPayment}
                onValueChange={setFilterPayment}
              >
                <DropdownMenuRadioItem value="all">
                  Tất cả
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cash">
                  Tiền mặt
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="transfer">
                  Chuyển khoản
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Khách hàng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả KH</SelectItem>
              <SelectItem value="guest">Khách lẻ</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Từ ngày"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="Đến ngày"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-40"
          />
          {(searchTerm || filterPayment !== 'all' || filterCustomer !== 'all' || filterDateFrom || filterDateTo) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setFilterPayment('all');
                setFilterCustomer('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        <DataTable
          data={filteredInvoices.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )}
          columns={columns}
          emptyMessage="Chưa có hóa đơn nào"
        />
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn bán hàng</DialogTitle>
            <DialogDescription>
              Chọn khách hàng và thêm hàng hóa vào hóa đơn
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-4">
            {/* Left: Product Selection */}
            <div className="col-span-2 space-y-4">
              {/* Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Khách hàng</Label>
                  <Select
                    value={formData.customerId || 'guest'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerId: v === 'guest' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khách hàng..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Khách lẻ</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    placeholder="Ghi chú hóa đơn..."
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
                <div className="flex gap-2">
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn hàng hóa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.salePrice)} (Tồn:{' '}
                          {p.stockQty})
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
                    min={1}
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
                        <TableHead className="w-24 text-right">SL</TableHead>
                        <TableHead className="w-32 text-right">Đơn giá</TableHead>
                        <TableHead className="w-32 text-right">
                          Thành tiền
                        </TableHead>
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
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Right: Payment Summary */}
            <Card className="p-4 space-y-4 h-fit">
              <h3 className="font-semibold">Thanh toán</h3>

              <div>
                <Label>Phương thức</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={
                      formData.paymentMethod === 'cash' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, paymentMethod: 'cash' }))
                    }
                    className="flex-1"
                  >
                    <Wallet className="w-4 h-4 mr-1" />
                    Tiền mặt
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formData.paymentMethod === 'transfer' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: 'transfer',
                      }))
                    }
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    CK
                  </Button>
                </div>
              </div>

              <div>
                <Label>Chiết khấu</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={formData.discountType}
                    onValueChange={(v: 'percent' | 'amount') =>
                      setFormData((prev) => ({ ...prev, discountType: v }))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="amount">VNĐ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={formData.discountValue || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountValue: Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.paymentMethod === 'cash' && (
                <div>
                  <Label>Tiền khách đưa</Label>
                  <Input
                    type="number"
                    value={formData.amountPaid || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amountPaid: Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Chiết khấu:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                {formData.paymentMethod === 'cash' && change > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Tiền thối:</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                disabled={formData.items.length === 0}
              >
                Thanh toán
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail/Print Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>
              Mã HĐ: #{selectedInvoice?.id.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div ref={printRef} className="space-y-4">
              <div className="header text-center border-b pb-4">
                <h2 className="text-xl font-bold">HÓA ĐƠN BÁN HÀNG</h2>
                <p className="text-sm text-muted-foreground">
                  Sales & Inventory Manager
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <p className="font-medium">
                    {selectedInvoice.customerId
                      ? getCustomerById(selectedInvoice.customerId)?.name
                      : 'Khách lẻ'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày:</span>
                  <p className="font-medium">
                    {formatDateTime(selectedInvoice.date)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thanh toán:</span>
                  <p className="font-medium">
                    {selectedInvoice.paymentMethod === 'cash'
                      ? 'Tiền mặt'
                      : 'Chuyển khoản'}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hàng hóa</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, idx) => {
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
                        <TableCell className="text-right">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Chiết khấu:</span>
                    <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
                {selectedInvoice.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Tiền khách đưa:</span>
                      <span>{formatCurrency(selectedInvoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền thối:</span>
                      <span>{formatCurrency(selectedInvoice.change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              In hóa đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
