import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Printer, Package, CheckCircle } from 'lucide-react';
import { usePurchaseOrderWithItems, useCompletePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { formatCurrency, formatDateTime } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

export default function ImportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: order, isLoading, refetch } = usePurchaseOrderWithItems(id || '');
  const completeMutation = useCompletePurchaseOrder();

  const handlePrint = () => {
    window.print();
  };

  const handleComplete = async () => {
    if (!order) return;
    
    try {
      await completeMutation.mutateAsync(order.id);
      toast({
        title: 'Thành công',
        description: 'Đã hoàn thành phiếu nhập và cập nhật tồn kho',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể hoàn thành phiếu nhập',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Hoàn thành
          </Badge>
        );
      case 'draft':
        return <Badge variant="secondary">Nháp</Badge>;
      case 'cancelled':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Chi tiết phiếu nhập">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout title="Chi tiết phiếu nhập">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Package className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">Không tìm thấy phiếu nhập</p>
          <Button onClick={() => navigate('/imports')}>Quay lại</Button>
        </div>
      </AppLayout>
    );
  }

  // Calculate items total
  const itemsTotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  return (
    <AppLayout title={order.code}>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/imports')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{order.code}</h1>
              <p className="text-sm text-muted-foreground">Chi tiết phiếu nhập hàng</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'draft' && (
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeMutation.isPending ? 'Đang xử lý...' : 'Hoàn thành'}
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              In
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Mã phiếu</p>
            <p className="font-mono font-semibold text-lg">{order.code}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
            <p className="font-semibold text-lg">
              {(order.supplier as any)?.name || 'Khách lẻ'}
            </p>
            {(order.supplier as any)?.code && (
              <p className="text-sm text-muted-foreground font-mono">
                {(order.supplier as any).code}
              </p>
            )}
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Thời gian nhập</p>
            <p className="font-semibold text-lg">{formatDateTime(order.received_at)}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Tổng tiền hàng</p>
            <p className="font-semibold text-lg text-primary">
              {formatCurrency(itemsTotal)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-card rounded-lg border mb-6">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Danh sách hàng hóa</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã hàng</TableHead>
                <TableHead>Tên hàng</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Giảm giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.items || []).map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {(item.product as any)?.code || '-'}
                  </TableCell>
                  <TableCell>{(item.product as any)?.name || '-'}</TableCell>
                  <TableCell>{(item.product as any)?.unit || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.discount || 0)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg border p-4">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng tiền hàng</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giảm giá</span>
              <span>
                {order.discount_type === 'percent'
                  ? `${order.discount_value}%`
                  : formatCurrency(order.discount_value || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT nhập hàng</span>
              <span>{formatCurrency(order.vat_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chi phí khác</span>
              <span>{formatCurrency(order.other_fee || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-lg">
              <span>Cần trả NCC</span>
              <span className="text-primary">{formatCurrency(order.final_amount)}</span>
            </div>
          </div>
          {order.note && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Ghi chú:</p>
              <p>{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
