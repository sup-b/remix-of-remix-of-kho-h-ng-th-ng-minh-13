import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Grid2X2, Package } from 'lucide-react';
import { useProducts, useCategories, formatCurrency, Product, Category } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface ProductGridSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductGridSelector({ open, onOpenChange, onSelectProduct }: ProductGridSelectorProps) {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Grid2X2 className="w-5 h-5" />
            Chọn hàng hóa
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories sidebar */}
          <div className="w-48 border-r bg-muted/30 flex flex-col">
            <div className="p-2 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase">Nhóm hàng</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <Button
                  variant={selectedCategory === null ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm h-9"
                  onClick={() => setSelectedCategory(null)}
                >
                  Tất cả
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm h-9"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Products grid */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc mã hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4 grid grid-cols-3 gap-3">
                {productsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
                  ))
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mb-4 opacity-50" />
                    <p>Không tìm thấy sản phẩm</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all hover:border-primary hover:shadow-md",
                        "bg-card hover:bg-accent/50",
                        (product.stock_qty || 0) <= 0 && "opacity-50"
                      )}
                      disabled={(product.stock_qty || 0) <= 0}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {product.code}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            (product.stock_qty || 0) <= 0 ? "badge-danger" : 
                            (product.stock_qty || 0) <= 5 ? "badge-warning" : "badge-success"
                          )}
                        >
                          {product.stock_qty || 0}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm truncate mb-1">{product.name}</p>
                      <p className="text-primary font-semibold text-sm">
                        {formatCurrency(product.sale_price_default)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
