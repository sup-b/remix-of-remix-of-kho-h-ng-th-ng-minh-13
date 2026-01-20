import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { Shield, UserCircle, Trash2, Database, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { role, setRole, isAdmin } = useRole();
  const { toast } = useToast();

  const clearData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.')) {
      localStorage.clear();
      toast({
        title: 'Thành công',
        description: 'Đã xóa toàn bộ dữ liệu. Trang sẽ được tải lại.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const resetData = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục dữ liệu mẫu? Dữ liệu hiện tại sẽ bị xóa.')) {
      localStorage.clear();
      toast({
        title: 'Thành công',
        description: 'Đã khôi phục dữ liệu mẫu. Trang sẽ được tải lại.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <AppLayout title="Cài đặt">
      <div className="animate-fade-in space-y-6 max-w-2xl">
        <PageHeader
          title="Cài đặt"
          description="Cấu hình ứng dụng và quản lý dữ liệu"
        />

        {/* Role Simulation */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Giả lập vai trò
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Chọn vai trò để test các chức năng phân quyền trong ứng dụng.
          </p>
          <div className="flex gap-4">
            <Card
              className={`flex-1 p-4 cursor-pointer transition-all ${
                isAdmin
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground'
              }`}
              onClick={() => setRole('admin')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">
                    Quyền quản trị đầy đủ
                  </p>
                </div>
                {isAdmin && (
                  <Badge className="ml-auto">Đang chọn</Badge>
                )}
              </div>
            </Card>
            <Card
              className={`flex-1 p-4 cursor-pointer transition-all ${
                !isAdmin
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground'
              }`}
              onClick={() => setRole('staff')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Nhân viên</p>
                  <p className="text-xs text-muted-foreground">
                    Quyền giới hạn
                  </p>
                </div>
                {!isAdmin && (
                  <Badge className="ml-auto">Đang chọn</Badge>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Khác biệt giữa các vai trò:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Admin:</strong> Có thể bán hàng vượt tồn kho (với cảnh báo)</li>
              <li>• <strong>Nhân viên:</strong> Không thể bán vượt số lượng tồn kho</li>
            </ul>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Quản lý dữ liệu
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dữ liệu được lưu trữ trong localStorage của trình duyệt.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={resetData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Khôi phục dữ liệu mẫu
            </Button>
            <Button variant="destructive" onClick={clearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Thông tin ứng dụng</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tên ứng dụng:</span>
              <span>Sales & Inventory Manager</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phiên bản:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Công nghệ:</span>
              <span>React + TypeScript + Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lưu trữ:</span>
              <span>LocalStorage (có thể nâng cấp lên DB)</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
