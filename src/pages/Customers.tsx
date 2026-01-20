import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Customer } from '@/types';
import {
  getCustomers,
  saveCustomers,
  generateId,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    initSeedData();
    loadData();
  }, []);

  const loadData = () => {
    setCustomers(getCustomers());
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setEditingCustomer(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên khách hàng',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    let updatedCustomers: Customer[];

    if (editingCustomer) {
      updatedCustomers = customers.map((c) =>
        c.id === editingCustomer.id
          ? { ...c, ...formData, updatedAt: now }
          : c
      );
      toast({ title: 'Thành công', description: 'Đã cập nhật khách hàng' });
    } else {
      const newCustomer: Customer = {
        id: generateId(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      updatedCustomers = [...customers, newCustomer];
      toast({ title: 'Thành công', description: 'Đã thêm khách hàng mới' });
    }

    saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deletingCustomer) return;
    const updatedCustomers = customers.filter((c) => c.id !== deletingCustomer.id);
    saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setIsDeleteDialogOpen(false);
    setDeletingCustomer(null);
    toast({ title: 'Thành công', description: 'Đã xóa khách hàng' });
  };

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Tên khách hàng' },
    { key: 'phone', header: 'Số điện thoại' },
    { key: 'address', header: 'Địa chỉ' },
    {
      key: 'notes',
      header: 'Ghi chú',
      render: (c) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {c.notes || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (customer) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeletingCustomer(customer);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Khách hàng">
      <div className="animate-fade-in">
        <PageHeader
          title="Khách hàng"
          description="Quản lý thông tin khách hàng"
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khách hàng
            </Button>
          }
        />

        <DataTable
          data={customers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Tìm theo tên hoặc SĐT..."
          emptyMessage="Chưa có khách hàng nào"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Tên khách hàng *</Label>
              <Input
                id="name"
                placeholder="VD: Nguyễn Văn A"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="VD: 0901234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa khách hàng "${deletingCustomer?.name}"?`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
