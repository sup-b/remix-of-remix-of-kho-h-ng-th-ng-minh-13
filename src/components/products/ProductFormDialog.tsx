import { forwardRef, useEffect, useState } from 'react';
import { Product, ProductGroup, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, RefreshCw } from 'lucide-react';
import { generateSKU } from '@/lib/storage';

interface ProductFormData {
  sku: string;
  name: string;
  groupId: string;
  config: Record<string, string>;
  costPrice: number;
  salePrice: number;
  stockQty: number;
  unit: string;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  notes: string;
  serialNumber?: string;
  supplierId?: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  groups: ProductGroup[];
  suppliers: Supplier[];
  isEditing: boolean;
  onFormChange: (data: Partial<ProductFormData>) => void;
  onSave: () => void;
  onGroupChange: (groupId: string) => void;
  onConfigChange: (key: string, value: string) => void;
  onAddConfigKey: () => void;
  onRemoveConfigKey: (key: string) => void;
}

export const ProductFormDialog = forwardRef<HTMLDivElement, ProductFormDialogProps>(
  (
    {
      open,
      onOpenChange,
      formData,
      groups,
      suppliers,
      isEditing,
      onFormChange,
      onSave,
      onGroupChange,
      onConfigChange,
      onAddConfigKey,
      onRemoveConfigKey,
    },
    ref
  ) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Chỉnh sửa hàng hóa' : 'Tạo hàng hóa mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho hàng hóa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="sku">Mã SKU</Label>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tự động</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onFormChange({ sku: generateSKU() })}
                        title="Tạo mã mới"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => onFormChange({ sku: e.target.value })}
                  placeholder={isEditing ? '' : 'Nhập hoặc để trống để tự động'}
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label htmlFor="name">Tên hàng hóa *</Label>
                <Input
                  id="name"
                  placeholder="VD: PC Gaming Core i5 RTX 4060"
                  value={formData.name}
                  onChange={(e) => onFormChange({ name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="group">Nhóm hàng hóa</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={onGroupChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplier">Nhà cung cấp</Label>
                <Select
                  value={formData.supplierId || ''}
                  onValueChange={(value) => onFormChange({ supplierId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn NCC" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="costPrice">Giá nhập</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) =>
                    onFormChange({ costPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Giá bán</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={formData.salePrice || ''}
                  onChange={(e) =>
                    onFormChange({ salePrice: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="stockQty">Số lượng tồn</Label>
                <Input
                  id="stockQty"
                  type="number"
                  value={formData.stockQty || ''}
                  onChange={(e) =>
                    onFormChange({ stockQty: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="unit">Đơn vị</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => onFormChange({ unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cái">Cái</SelectItem>
                    <SelectItem value="bộ">Bộ</SelectItem>
                    <SelectItem value="chiếc">Chiếc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serialNumber">Số seri</Label>
                <Input
                  id="serialNumber"
                  placeholder="Số seri (nếu có)"
                  value={formData.serialNumber || ''}
                  onChange={(e) =>
                    onFormChange({ serialNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: 'in_stock' | 'out_of_stock' | 'discontinued'
                  ) => onFormChange({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">Còn hàng</SelectItem>
                    <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                    <SelectItem value="discontinued">Ngừng bán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm..."
                  value={formData.notes}
                  onChange={(e) => onFormChange({ notes: e.target.value })}
                />
              </div>
            </div>

            {/* Config section */}
            {Object.keys(formData.config).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Cấu hình chi tiết</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddConfigKey}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  {Object.entries(formData.config).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        value={key}
                        disabled
                        className="w-32 bg-background"
                      />
                      <Input
                        placeholder={`Giá trị ${key}`}
                        value={value}
                        onChange={(e) => onConfigChange(key, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveConfigKey(key)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={onSave}>
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ProductFormDialog.displayName = 'ProductFormDialog';
