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
import { ProductGroup } from '@/types';
import { generateId, getProductGroups, saveProductGroups } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: ProductGroup) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên nhóm hàng',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const newGroup: ProductGroup = {
      id: generateId(),
      name: name.trim(),
      minPrice: 0,
      maxPrice: 0,
      description: description.trim(),
      configTemplate: {},
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const groups = getProductGroups();
    saveProductGroups([...groups, newGroup]);
    
    toast({ title: 'Thành công', description: 'Đã tạo nhóm hàng mới' });
    onCreated(newGroup);
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
          <DialogTitle>Tạo nhóm hàng mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="group-name">Tên nhóm hàng <span className="text-destructive">*</span></Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm hàng"
              className="mt-1"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="group-description">Mô tả</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả nhóm hàng"
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
            Tạo nhóm hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
