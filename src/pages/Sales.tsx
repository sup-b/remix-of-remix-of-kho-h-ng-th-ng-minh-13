import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Eye, Filter, Search, ChevronLeft, ChevronRight, CreditCard, Wallet } from 'lucide-react';
import { useSalesOrders, SalesOrder } from '@/hooks/useSalesOrders';
import { useCustomers, formatCurrency, formatDateTime } from '@/hooks/useSupabaseData';

const PAGE_SIZE = 50;

export default function Sales() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: salesData, isLoading } = useSalesOrders(page, PAGE_SIZE);
  const { data: customers = [] } = useCustomers();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');

  const orders = salesData?.data || [];
  const pagination = salesData?.pagination;

  // Client-side filtering (for current page)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search by code
      if (searchTerm && !order.code.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filter by payment status
      if (filterPaymentStatus !== 'all' && order.payment_status !== filterPaymentStatus) {
        return false;
      }
      // Filter by status
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false;
      }
      // Filter by customer
      if (filterCustomer !== 'all') {
        if (filterCustomer === 'guest' && order.customer_id) return false;
        if (filterCustomer !== 'guest' && order.customer_id !== filterCustomer) return false;
      }
      return true;
    });
  }, [orders, searchTerm, filterPaymentStatus, filterStatus, filterCustomer]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="badge-success">Đã thanh toán</Badge>;
      case 'partial':
        return <Badge className="badge-warning">Thanh toán 1 phần</Badge>;
      case 'unpaid':
        return <Badge className="badge-danger">Chưa thanh toán</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="badge-success">Hoàn thành</Badge>;
      case 'draft':
        return <Badge variant="outline">Nháp</Badge>;
      case 'cancelled':
        return <Badge className="badge-danger">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPaymentStatus('all');
    setFilterStatus('all');
    setFilterCustomer('all');
  };

  const hasActiveFilters = searchTerm || filterPaymentStatus !== 'all' || filterStatus !== 'all' || filterCustomer !== 'all';

  return (
    <AppLayout title="Bán hàng">
      <div className="animate-fade-in">
        <PageHeader
          title="Đơn bán hàng"
          description="Quản lý đơn hàng và hóa đơn bán"
          actions={
            <Button onClick={() => navigate('/sales/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn hàng
            </Button>
          }
        />

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Thanh toán
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Trạng thái TT</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <DropdownMenuRadioItem value="all">Tất cả</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="paid">Đã thanh toán</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="partial">Thanh toán 1 phần</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unpaid">Chưa thanh toán</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả TT</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>

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

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Mã đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="w-44">Ngày bán</TableHead>
                <TableHead className="w-28 text-right">Tổng tiền</TableHead>
                <TableHead className="w-28 text-right">Đã thanh toán</TableHead>
                <TableHead className="w-32 text-center">Thanh toán</TableHead>
                <TableHead className="w-28 text-center">Trạng thái</TableHead>
                <TableHead className="w-20 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-medium">
                      {order.code}
                    </TableCell>
                    <TableCell>
                      {order.customer?.name || 'Khách lẻ'}
                      {order.customer?.phone && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {order.customer.phone}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(order.sale_date)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(order.final_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.paid_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPaymentStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/sales/${order.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, pagination.total)} / {pagination.total} đơn hàng
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Trang {page} / {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
