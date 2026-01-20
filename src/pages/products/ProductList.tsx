import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Plus, 
  Filter, 
  Search, 
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useProducts, useCategories, formatCurrency, Product } from '@/hooks/useSupabaseData';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 50;

export default function ProductList() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({
    code: '',
    name: '',
    notes: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<typeof advancedFilters | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Main search (code or name)
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search)
      );
    }

    // Advanced filters
    if (appliedFilters) {
      if (appliedFilters.code) {
        result = result.filter((p) =>
          p.code.toLowerCase().includes(appliedFilters.code.toLowerCase())
        );
      }
      if (appliedFilters.name) {
        result = result.filter((p) =>
          p.name.toLowerCase().includes(appliedFilters.name.toLowerCase())
        );
      }
      if (appliedFilters.notes) {
        result = result.filter((p) =>
          (p.notes || '').toLowerCase().includes(appliedFilters.notes.toLowerCase())
        );
      }
    }

    return result;
  }, [products, debouncedSearch, appliedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, appliedFilters]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map((p) => p.id)));
    }
  }, [paginatedProducts, selectedProducts.size]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Apply advanced filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...advancedFilters });
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({ code: '', name: '', notes: '' });
    setAppliedFilters(null);
    setSearchTerm('');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Search is already applied via debounce
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '-';
  };

  return (
    <AppLayout title="Hàng hóa">
      <div className="animate-fade-in">
        <PageHeader
          title="Hàng hóa"
          description="Quản lý danh sách hàng hóa"
          actions={
            <Button onClick={() => navigate('/products/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm mới
            </Button>
          }
        />

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã hoặc tên hàng hóa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9"
            />
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Bộ lọc nâng cao</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Mã hàng hóa</Label>
                    <Input
                      value={advancedFilters.code}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, code: e.target.value }))
                      }
                      placeholder="Nhập mã hàng..."
                    />
                  </div>
                  <div>
                    <Label>Tên hàng hóa</Label>
                    <Input
                      value={advancedFilters.name}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Nhập tên hàng..."
                    />
                  </div>
                  <div>
                    <Label>Ghi chú / Mô tả</Label>
                    <Input
                      value={advancedFilters.notes}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Nhập ghi chú..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                  <Button className="flex-1" onClick={handleApplyFilters}>
                    Áp dụng
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {appliedFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Products Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Mã hàng</TableHead>
                <TableHead>Tên hàng hóa</TableHead>
                <TableHead>Nhóm hàng</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-right">VAT %</TableHead>
                <TableHead className="text-right">Giá vốn</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Star className="w-4 h-4 text-muted-foreground/30 hover:text-warning cursor-pointer" />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-primary hover:underline">
                        {product.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product.category_id)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.sale_price_default)}
                    </TableCell>
                    <TableCell className="text-right">10%</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.average_cost || 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.stock_qty || 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className={
                          product.status === 'active'
                            ? 'bg-success/10 text-success border-success/20'
                            : ''
                        }
                      >
                        {product.status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} trong{' '}
                {filteredProducts.length} hàng hóa
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
