import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, TrendingUp, DollarSign, Package } from 'lucide-react';
import {
  getInvoices,
  getProducts,
  getProductGroups,
  getProductById,
  getProductGroupById,
  formatCurrency,
  formatDate,
} from '@/lib/storage';
import { Invoice, Product, ProductGroup } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { initSeedData } from '@/lib/seedData';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [filterGroup, setFilterGroup] = useState<string>('all');

  useEffect(() => {
    initSeedData();
    setInvoices(getInvoices());
    setProducts(getProducts().filter((p) => !p.isDeleted));
    setGroups(getProductGroups());
  }, []);

  // Filter invoices by date range
  const filteredInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.date).toISOString().split('T')[0];
    return invDate >= dateRange.start && invDate <= dateRange.end;
  });

  // Filter by product group if selected
  const groupFilteredInvoices =
    filterGroup === 'all'
      ? filteredInvoices
      : filteredInvoices.filter((inv) =>
          inv.items.some((item) => {
            const product = getProductById(item.productId);
            return product?.groupId === filterGroup;
          })
        );

  // Calculate totals
  const totalRevenue = groupFilteredInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const totalOrders = groupFilteredInvoices.length;
  const totalItemsSold = groupFilteredInvoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  // Calculate profit (estimated)
  const totalProfit = groupFilteredInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((itemSum, item) => {
        const product = getProductById(item.productId);
        if (product) {
          return itemSum + (item.unitPrice - product.costPrice) * item.quantity;
        }
        return itemSum;
      }, 0)
    );
  }, 0);

  // Daily revenue chart data
  const dailyRevenueData = (() => {
    const dataMap = new Map<string, number>();
    groupFilteredInvoices.forEach((inv) => {
      const date = formatDate(inv.date);
      dataMap.set(date, (dataMap.get(date) || 0) + inv.totalAmount);
    });
    return Array.from(dataMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Revenue by group
  const revenueByGroup = (() => {
    const dataMap = new Map<string, number>();
    groupFilteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const product = getProductById(item.productId);
        const groupName = product?.groupId
          ? getProductGroupById(product.groupId)?.name || 'Khác'
          : 'Không thuộc nhóm';
        dataMap.set(groupName, (dataMap.get(groupName) || 0) + item.total);
      });
    });
    return Array.from(dataMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  })();

  // Top selling products
  const topSellingProducts = (() => {
    const productSales = new Map<string, { qty: number; revenue: number }>();
    groupFilteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const current = productSales.get(item.productId) || {
          qty: 0,
          revenue: 0,
        };
        productSales.set(item.productId, {
          qty: current.qty + item.quantity,
          revenue: current.revenue + item.total,
        });
      });
    });
    return Array.from(productSales.entries())
      .map(([productId, data]) => ({
        product: getProductById(productId),
        ...data,
      }))
      .filter((item) => item.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  })();

  const exportCSV = () => {
    const headers = ['Ngày', 'Mã HĐ', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Tổng tiền'];
    const rows = groupFilteredInvoices.flatMap((inv) =>
      inv.items.map((item) => {
        const product = getProductById(item.productId);
        return [
          formatDate(inv.date),
          inv.id.slice(-8).toUpperCase(),
          product?.name || 'N/A',
          item.quantity,
          item.unitPrice,
          item.total,
        ].join(',');
      })
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
  };

  return (
    <AppLayout title="Báo cáo">
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Báo cáo"
          description="Thống kê doanh thu và phân tích kinh doanh"
          actions={
            <Button onClick={exportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </Button>
          }
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-40"
              />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-40"
              />
            </div>
            <div>
              <Label>Nhóm sản phẩm</Label>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lợi nhuận ước tính</p>
                <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số đơn hàng</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sản phẩm bán ra</p>
                <p className="text-2xl font-bold">{totalItemsSold}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 p-6">
                <h3 className="font-semibold mb-4">Doanh thu theo ngày</h3>
                <div className="h-72">
                  {dailyRevenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Không có dữ liệu trong khoảng thời gian này
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Doanh thu theo nhóm</h3>
                <div className="h-72">
                  {revenueByGroup.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByGroup}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name }) => name}
                        >
                          {revenueByGroup.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Top sản phẩm bán chạy</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Nhóm</TableHead>
                    <TableHead className="text-right">Số lượng bán</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSellingProducts.map((item, idx) => (
                      <TableRow key={item.product?.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell>
                          {item.product?.groupId
                            ? getProductGroupById(item.product.groupId)?.name
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Lịch sử giao dịch</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Mã HĐ</TableHead>
                    <TableHead>Số SP</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupFilteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupFilteredInvoices
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .slice(0, 20)
                      .map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{formatDate(inv.date)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            #{inv.id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>{inv.items.length}</TableCell>
                          <TableCell>
                            {inv.paymentMethod === 'cash'
                              ? 'Tiền mặt'
                              : 'Chuyển khoản'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(inv.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
