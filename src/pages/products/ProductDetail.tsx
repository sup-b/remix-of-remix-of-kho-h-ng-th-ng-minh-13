import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDateTime } from '@/hooks/useSupabaseData';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch product
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;

      // Get stock
      const { data: stockData } = await supabase.rpc('get_product_stock', {
        p_product_id: id,
      });
      const { data: costData } = await supabase.rpc('get_average_cost', {
        p_product_id: id,
      });

      return {
        ...data,
        stock_qty: stockData || 0,
        average_cost: costData || 0,
      };
    },
    enabled: !!id,
  });

  // Fetch stock ledger (inventory transactions)
  const { data: stockLedger = [], isLoading: isLoadingLedger } = useQuery({
    queryKey: ['stock_ledger', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get partner names for each transaction
      const ledgerWithPartners = await Promise.all(
        (data || []).map(async (tx) => {
          let partnerName = '-';
          let documentCode = tx.reference_id?.slice(0, 8).toUpperCase() || '-';

          if (tx.reference_type === 'PURCHASE') {
            const { data: receipt } = await supabase
              .from('purchase_receipts')
              .select('code, supplier:suppliers(name)')
              .eq('id', tx.reference_id)
              .maybeSingle();
            if (receipt) {
              documentCode = receipt.code;
              partnerName = (receipt.supplier as any)?.name || 'Khách lẻ';
            }
          } else if (tx.reference_type === 'SALE') {
            const { data: invoice } = await supabase
              .from('sales_invoices')
              .select('code, customer:customers(name)')
              .eq('id', tx.reference_id)
              .maybeSingle();
            if (invoice) {
              documentCode = invoice.code;
              partnerName = (invoice.customer as any)?.name || 'Khách lẻ';
            }
          }

          return {
            ...tx,
            documentCode,
            partnerName,
          };
        })
      );

      // Calculate running balance
      let runningBalance = 0;
      const ledgerWithBalance = ledgerWithPartners.reverse().map((tx) => {
        runningBalance += tx.quantity;
        return { ...tx, endingStock: runningBalance };
      });

      return ledgerWithBalance.reverse();
    },
    enabled: !!id,
  });

  if (isLoadingProduct) {
    return (
      <AppLayout title="Chi tiết hàng hóa">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout title="Chi tiết hàng hóa">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Package className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate('/products')}>Quay lại</Button>
        </div>
      </AppLayout>
    );
  }

  const getTransactionType = (type: string) => {
    switch (type) {
      case 'IN':
        return { label: 'Nhập kho', color: 'bg-success/10 text-success' };
      case 'OUT':
        return { label: 'Xuất kho', color: 'bg-destructive/10 text-destructive' };
      case 'ADJUST':
        return { label: 'Điều chỉnh', color: 'bg-warning/10 text-warning' };
      case 'RETURN':
        return { label: 'Trả hàng', color: 'bg-primary/10 text-primary' };
      default:
        return { label: type, color: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <AppLayout title={product.name}>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{product.code}</p>
            </div>
            <Badge
              variant={product.status === 'active' ? 'default' : 'secondary'}
              className={
                product.status === 'active'
                  ? 'bg-success/10 text-success border-success/20'
                  : ''
              }
            >
              {product.status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
            </Badge>
          </div>
          <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Sửa
          </Button>
        </div>

        {/* General Info */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Mã hàng</p>
            <p className="font-mono font-semibold text-lg">{product.code}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Nhóm hàng</p>
            <p className="font-semibold text-lg">{(product.category as any)?.name || '-'}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Giá bán</p>
            <p className="font-semibold text-lg text-primary">
              {formatCurrency(product.sale_price_default)}
            </p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Tồn kho</p>
            <p className="font-semibold text-lg">{product.stock_qty || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Giá vốn bình quân</p>
            <p className="font-semibold text-lg">{formatCurrency(product.average_cost || 0)}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Đơn vị tính</p>
            <p className="font-semibold text-lg">{product.unit}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Theo dõi tồn kho</p>
            <p className="font-semibold text-lg">
              {product.track_inventory ? 'Có' : 'Không'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ledger" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ledger">Sổ kho</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chứng từ</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại giao dịch</TableHead>
                    <TableHead>Đối tác</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Tồn cuối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLedger ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : stockLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Chưa có giao dịch nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockLedger.map((tx: any) => {
                      const txType = getTransactionType(tx.transaction_type);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm">
                            {tx.documentCode}
                          </TableCell>
                          <TableCell>{formatDateTime(tx.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={txType.color}>
                              {txType.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{tx.partnerName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(tx.unit_cost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                tx.quantity > 0 ? 'text-success' : 'text-destructive'
                              }
                            >
                              {tx.quantity > 0 ? '+' : ''}
                              {tx.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {tx.endingStock}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
