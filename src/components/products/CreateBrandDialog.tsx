import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Brand } from '@/types';
import { generateId, getBrands, saveBrands } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (brand: Brand) => void;
}

export function CreateBrandDialog({ open, onOpenChange, onCreated }: CreateBrandDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên thương hiệu',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const newBrand: Brand = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const brands = getBrands();
    saveBrands([...brands, newBrand]);
    
    toast({ title: 'Thành công', description: 'Đã tạo thương hiệu mới' });
    onCreated(newBrand);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo thương hiệu mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="brand-name">Tên thương hiệu <span className="text-destructive">*</span></Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên thương hiệu"
              className="mt-1"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="brand-description">Mô tả</Label>
            <Textarea
              id="brand-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả thương hiệu"
              className="mt-1"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            Tạo thương hiệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
