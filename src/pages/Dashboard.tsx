import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useDashboardStats, formatCurrency } from '@/hooks/useSupabaseData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  // Revenue chart data (mock for demo)
  const chartData = [
    { name: 'T2', revenue: 15000000 },
    { name: 'T3', revenue: 22000000 },
    { name: 'T4', revenue: 18000000 },
    { name: 'T5', revenue: 25000000 },
    { name: 'T6', revenue: 32000000 },
    { name: 'T7', revenue: 28000000 },
    { name: 'CN', revenue: stats?.todayRevenue || 12000000 },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(stats?.todayRevenue || 0)}
            subtitle={`${stats?.totalOrders || 0} đơn hàng`}
            icon={DollarSign}
            iconClassName="bg-primary/10"
          />
          <StatCard
            title="Lợi nhuận hôm nay"
            value={formatCurrency(stats?.todayProfit || 0)}
            subtitle="Sau giảm giá"
            icon={TrendingUp}
            iconClassName="bg-success/10"
          />
          <StatCard
            title="Đơn hàng hôm nay"
            value={stats?.totalOrders || 0}
            subtitle="Hóa đơn bán"
            icon={ShoppingCart}
            iconClassName="bg-warning/10"
          />
          <StatCard
            title="Sản phẩm tồn thấp"
            value={stats?.lowStockProducts?.length || 0}
            subtitle="Cần nhập thêm"
            icon={AlertTriangle}
            iconClassName="bg-destructive/10"
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="font-semibold text-lg mb-4">Doanh thu tuần qua</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Low Stock Alert */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-lg">Cảnh báo tồn kho thấp</h3>
            </div>
            <div className="space-y-3 max-h-72 overflow-auto">
              {!stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Không có sản phẩm nào sắp hết hàng
                </p>
              ) : (
                stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.code}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        product.stock <= 2
                          ? 'text-destructive border-destructive'
                          : 'text-warning border-warning'
                      }
                    >
                      Còn {product.stock}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
