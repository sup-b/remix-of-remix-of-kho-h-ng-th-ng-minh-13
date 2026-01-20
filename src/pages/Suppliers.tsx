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
import { Supplier } from '@/types';
import {
  getSuppliers,
  saveSuppliers,
  generateId,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
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
    setSuppliers(getSuppliers());
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setEditingSupplier(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên nhà cung cấp',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    let updatedSuppliers: Supplier[];

    if (editingSupplier) {
      updatedSuppliers = suppliers.map((s) =>
        s.id === editingSupplier.id
          ? { ...s, ...formData, updatedAt: now }
          : s
      );
      toast({ title: 'Thành công', description: 'Đã cập nhật nhà cung cấp' });
    } else {
      const newSupplier: Supplier = {
        id: generateId(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      updatedSuppliers = [...suppliers, newSupplier];
      toast({ title: 'Thành công', description: 'Đã thêm nhà cung cấp mới' });
    }

    saveSuppliers(updatedSuppliers);
    setSuppliers(updatedSuppliers);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deletingSupplier) return;
    const updatedSuppliers = suppliers.filter((s) => s.id !== deletingSupplier.id);
    saveSuppliers(updatedSuppliers);
    setSuppliers(updatedSuppliers);
    setIsDeleteDialogOpen(false);
    setDeletingSupplier(null);
    toast({ title: 'Thành công', description: 'Đã xóa nhà cung cấp' });
  };

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Tên nhà cung cấp' },
    { key: 'phone', header: 'Số điện thoại' },
    { key: 'address', header: 'Địa chỉ' },
    {
      key: 'notes',
      header: 'Ghi chú',
      render: (s) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {s.notes || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (supplier) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(supplier)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeletingSupplier(supplier);
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
    <AppLayout title="Nhà cung cấp">
      <div className="animate-fade-in">
        <PageHeader
          title="Nhà cung cấp"
          description="Quản lý thông tin nhà cung cấp"
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm NCC
            </Button>
          }
        />

        <DataTable
          data={suppliers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Tìm theo tên nhà cung cấp..."
          emptyMessage="Chưa có nhà cung cấp nào"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết nhà cung cấp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Tên nhà cung cấp *</Label>
              <Input
                id="name"
                placeholder="VD: Công ty ABC"
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
                placeholder="VD: 0281234567"
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
                placeholder="VD: 123 Đường XYZ, Quận 1, TP.HCM"
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
              {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa nhà cung cấp "${deletingSupplier?.name}"?`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
