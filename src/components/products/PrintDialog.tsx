import { forwardRef } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/storage';

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  printQuantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onPrint: () => void;
}

export const PrintDialog = forwardRef<HTMLDivElement, PrintDialogProps>(
  (
    {
      open,
      onOpenChange,
      selectedProducts,
      printQuantities,
      onQuantityChange,
      onRemoveItem,
      onPrint,
    },
    ref
  ) => {
    const totalLabels = Object.values(printQuantities).reduce(
      (sum, qty) => sum + qty,
      0
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>In tem mã</DialogTitle>
            <DialogDescription>
              Chọn số lượng tem cần in cho mỗi sản phẩm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-64 overflow-auto py-4">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sku} - {formatCurrency(product.salePrice)}
                  </p>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={printQuantities[product.id] || 1}
                  onChange={(e) =>
                    onQuantityChange(product.id, Number(e.target.value))
                  }
                  className="w-20 text-center"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(product.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Tổng: {totalLabels} tem
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={onPrint}>In tem</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

PrintDialog.displayName = 'PrintDialog';
