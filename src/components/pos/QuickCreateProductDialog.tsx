import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { useCategories, useCreateProduct, Product } from '@/hooks/useSupabaseData';

interface QuickCreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: Product) => void;
}

export function QuickCreateProductDialog({
  open,
  onOpenChange,
  onProductCreated,
}: QuickCreateProductDialogProps) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();

  const [formData, setFormData] = useState({
    code: `SP${Date.now().toString().slice(-6)}`,
    name: '',
    category_id: '',
    unit: 'cái',
    sale_price_default: 0,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên sản phẩm',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createProduct.mutateAsync({
        code: formData.code,
        name: formData.name,
        category_id: formData.category_id || null,
        unit: formData.unit,
        sale_price_default: formData.sale_price_default,
        status: 'active',
        track_inventory: true,
      });

      toast({
        title: 'Thành công',
        description: 'Đã tạo sản phẩm mới',
      });

      // Reset form
      setFormData({
        code: `SP${Date.now().toString().slice(-6)}`,
        name: '',
        category_id: '',
        unit: 'cái',
        sale_price_default: 0,
      });

      onProductCreated(result as Product);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo sản phẩm',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo nhanh hàng hóa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Mã hàng</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="unit">Đơn vị</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, unit: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cái">Cái</SelectItem>
                  <SelectItem value="chiếc">Chiếc</SelectItem>
                  <SelectItem value="bộ">Bộ</SelectItem>
                  <SelectItem value="hộp">Hộp</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="lít">Lít</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Tên hàng hóa *</Label>
            <Input
              id="name"
              placeholder="Nhập tên sản phẩm..."
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="category">Nhóm hàng</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhóm hàng..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Giá bán</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.sale_price_default}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sale_price_default: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={createProduct.isPending}>
            {createProduct.isPending ? 'Đang tạo...' : 'Tạo hàng hóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
