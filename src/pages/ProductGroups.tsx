import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Pencil, Trash2, Copy, X } from 'lucide-react';
import { ProductGroup } from '@/types';
import {
  getProductGroups,
  saveProductGroups,
  generateId,
  formatCurrency,
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { initSeedData } from '@/lib/seedData';

const defaultConfigTemplate: Record<string, string> = {
  CPU: '',
  RAM: '',
  SSD: '',
  VGA: '',
  Main: '',
  PSU: '',
  Case: '',
};

export default function ProductGroups() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ProductGroup | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    minPrice: number;
    maxPrice: number;
    description: string;
    status: 'active' | 'inactive';
    configTemplate: Record<string, string>;
  }>({
    name: '',
    minPrice: 0,
    maxPrice: 0,
    description: '',
    status: 'active',
    configTemplate: { ...defaultConfigTemplate },
  });

  useEffect(() => {
    initSeedData();
    loadGroups();
  }, []);

  const loadGroups = () => {
    setGroups(getProductGroups());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minPrice: 0,
      maxPrice: 0,
      description: '',
      status: 'active',
      configTemplate: { ...defaultConfigTemplate },
    });
    setEditingGroup(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (group: ProductGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      minPrice: group.minPrice,
      maxPrice: group.maxPrice,
      description: group.description,
      status: group.status,
      configTemplate: { ...group.configTemplate },
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (group: ProductGroup) => {
    const now = new Date().toISOString();
    const newGroup: ProductGroup = {
      ...group,
      id: generateId(),
      name: `${group.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const updatedGroups = [...groups, newGroup];
    saveProductGroups(updatedGroups);
    setGroups(updatedGroups);
    toast({
      title: 'Thành công',
      description: 'Đã nhân bản nhóm sản phẩm',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên nhóm',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    let updatedGroups: ProductGroup[];

    if (editingGroup) {
      updatedGroups = groups.map((g) =>
        g.id === editingGroup.id
          ? {
              ...g,
              ...formData,
              updatedAt: now,
            }
          : g
      );
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật nhóm sản phẩm',
      });
    } else {
      const newGroup: ProductGroup = {
        id: generateId(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      updatedGroups = [...groups, newGroup];
      toast({
        title: 'Thành công',
        description: 'Đã tạo nhóm sản phẩm mới',
      });
    }

    saveProductGroups(updatedGroups);
    setGroups(updatedGroups);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deletingGroup) return;
    const updatedGroups = groups.filter((g) => g.id !== deletingGroup.id);
    saveProductGroups(updatedGroups);
    setGroups(updatedGroups);
    setIsDeleteDialogOpen(false);
    setDeletingGroup(null);
    toast({
      title: 'Thành công',
      description: 'Đã xóa nhóm sản phẩm',
    });
  };

  const updateConfigTemplate = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      configTemplate: {
        ...prev.configTemplate,
        [key]: value,
      },
    }));
  };

  const addConfigKey = () => {
    const newKey = `Thuộc tính ${Object.keys(formData.configTemplate).length + 1}`;
    setFormData((prev) => ({
      ...prev,
      configTemplate: {
        ...prev.configTemplate,
        [newKey]: '',
      },
    }));
  };

  const removeConfigKey = (key: string) => {
    const { [key]: removed, ...rest } = formData.configTemplate;
    setFormData((prev) => ({
      ...prev,
      configTemplate: rest,
    }));
  };

  const columns: Column<ProductGroup>[] = [
    {
      key: 'name',
      header: 'Tên nhóm',
      render: (group) => (
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {group.description}
          </p>
        </div>
      ),
    },
    {
      key: 'priceRange',
      header: 'Phân khúc giá',
      render: (group) => (
        <span className="text-sm">
          {formatCurrency(group.minPrice)} - {formatCurrency(group.maxPrice)}
        </span>
      ),
    },
    {
      key: 'configCount',
      header: 'Cấu hình mẫu',
      render: (group) => (
        <span className="text-sm">
          {Object.keys(group.configTemplate).length} thuộc tính
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (group) => (
        <Badge
          variant="outline"
          className={
            group.status === 'active' ? 'badge-success' : 'badge-warning'
          }
        >
          {group.status === 'active' ? 'Hoạt động' : 'Tạm ngừng'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (group) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(group);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(group);
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingGroup(group);
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
    <AppLayout title="Nhóm sản phẩm">
      <div className="animate-fade-in">
        <PageHeader
          title="Nhóm sản phẩm"
          description="Quản lý các nhóm cấu hình sản phẩm theo phân khúc giá"
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo mới
            </Button>
          }
        />

        <DataTable
          data={groups}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Tìm theo tên nhóm..."
          emptyMessage="Chưa có nhóm sản phẩm nào"
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Chỉnh sửa nhóm sản phẩm' : 'Tạo nhóm sản phẩm mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho nhóm sản phẩm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Tên nhóm *</Label>
                <Input
                  id="name"
                  placeholder="VD: PC 10 triệu"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="minPrice">Giá tối thiểu</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="8000000"
                  value={formData.minPrice || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Giá tối đa</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="12000000"
                  value={formData.maxPrice || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả ngắn về nhóm sản phẩm..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm ngừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Config Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Cấu hình mẫu</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addConfigKey}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm thuộc tính
                </Button>
              </div>
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                {Object.entries(formData.configTemplate).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      value={key}
                      disabled
                      className="w-32 bg-background"
                    />
                    <Input
                      placeholder={`Giá trị ${key}`}
                      value={value}
                      onChange={(e) => updateConfigTemplate(key, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConfigKey(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingGroup ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa nhóm "${deletingGroup?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
