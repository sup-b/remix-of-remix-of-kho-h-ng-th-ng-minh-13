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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateCustomer, Customer } from '@/hooks/useSupabaseData';

interface QuickCreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
  initialPhone?: string;
}

export function QuickCreateCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
  initialPhone = '',
}: QuickCreateCustomerDialogProps) {
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  const [formData, setFormData] = useState({
    name: '',
    phone: initialPhone,
    email: '',
    address: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên khách hàng',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createCustomer.mutateAsync({
        code: `KH${Date.now().toString().slice(-6)}`,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
        status: 'active',
      });

      toast({
        title: 'Thành công',
        description: 'Đã tạo khách hàng mới',
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });

      onCustomerCreated(result);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo khách hàng',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng mới</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="VD: khach@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              placeholder="VD: 123 Đường ABC, Quận 1"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={createCustomer.isPending}>
            {createCustomer.isPending ? 'Đang tạo...' : 'Thêm khách'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
