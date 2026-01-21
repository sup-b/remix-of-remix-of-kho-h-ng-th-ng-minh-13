import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { ArrowLeft, Printer, User, Calendar, FileText, Package, CreditCard } from 'lucide-react';
import { useSalesOrder } from '@/hooks/useSalesOrders';
import { formatCurrency, formatDateTime } from '@/hooks/useSupabaseData';

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useSalesOrder(id || '');

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

  if (isLoading) {
    return (
      <AppLayout title="Chi tiết đơn hàng">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (error || !order) {
    return (
      <AppLayout title="Lỗi">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Không tìm thấy đơn hàng</p>
          <Button variant="outline" onClick={() => navigate('/sales')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </AppLayout>
    );
  }

  const items = order.items || [];
  const totalProfit = items.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <AppLayout title={`Đơn hàng ${order.code}`}>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{order.code}</h1>
              <p className="text-muted-foreground text-sm">
                Tạo lúc: {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.payment_status)}
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              In hóa đơn
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tên:</span>
                <span className="font-medium">{order.customer?.name || 'Khách lẻ'}</span>
              </div>
              {order.customer?.code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã KH:</span>
                  <span className="font-mono">{order.customer.code}</span>
                </div>
              )}
              {order.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SĐT:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày bán:</span>
                <span>{formatDateTime(order.sale_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số mặt hàng:</span>
                <span>{order.total_items}</span>
              </div>
              {order.note && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ghi chú:</span>
                  <span className="text-right max-w-[60%]">{order.note}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền hàng:</span>
                <span>{formatCurrency(order.after_discount + (order.discount_value || 0))}</span>
              </div>
              {(order.discount_value || 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Giảm giá ({order.discount_type === 'percent' ? `${order.discount_value}%` : 'VNĐ'}):</span>
                  <span>-{formatCurrency(order.after_discount - order.final_amount + (order.vat_amount || 0) + (order.other_fee || 0))}</span>
                </div>
              )}
              {(order.other_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thu khác:</span>
                  <span>+{formatCurrency(order.other_fee || 0)}</span>
                </div>
              )}
              {(order.vat_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({order.vat_rate}%):</span>
                  <span>+{formatCurrency(order.vat_amount || 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatCurrency(order.final_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã thanh toán:</span>
                <span className="text-green-600">{formatCurrency(order.paid_amount)}</span>
              </div>
              {order.final_amount - order.paid_amount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Còn nợ:</span>
                  <span>{formatCurrency(order.final_amount - order.paid_amount)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Chi tiết sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead className="w-28">Mã SP</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="w-20 text-center">SL</TableHead>
                  <TableHead className="w-24 text-right">Đơn giá</TableHead>
                  <TableHead className="w-24 text-right">Giảm giá</TableHead>
                  <TableHead className="w-28 text-right">Thành tiền</TableHead>
                  <TableHead className="w-28 text-right">Lợi nhuận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.product?.code || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product?.name || 'Sản phẩm đã xóa'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity} {item.product?.unit || ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {(item.discount || 0) > 0 ? formatCurrency(item.discount) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.total_amount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.profit || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    Tổng cộng:
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(order.after_discount)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(totalProfit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
