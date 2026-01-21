import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency, formatDateTime } from '@/hooks/useSupabaseData';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 50;

interface AdvancedFilters {
  importCode: string;
  supplierCode: string;
  supplierName: string;
  note: string;
}

export default function ImportList() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = usePurchaseOrders(currentPage, PAGE_SIZE);
  
  const orders = response?.data || [];
  const pagination = response?.pagination;

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    importCode: '',
    supplierCode: '',
    supplierName: '',
    note: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);

  // Selection
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter orders (client-side for search term)
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Main search (import code)
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter((r) => r.code.toLowerCase().includes(search));
    }

    // Advanced filters
    if (appliedFilters) {
      if (appliedFilters.importCode) {
        result = result.filter((r) =>
          r.code.toLowerCase().includes(appliedFilters.importCode.toLowerCase())
        );
      }
      if (appliedFilters.supplierName) {
        result = result.filter((r) =>
          (r.supplier as any)?.name
            ?.toLowerCase()
            .includes(appliedFilters.supplierName.toLowerCase())
        );
      }
      if (appliedFilters.supplierCode) {
        result = result.filter((r) =>
          (r.supplier as any)?.code
            ?.toLowerCase()
            .includes(appliedFilters.supplierCode.toLowerCase())
        );
      }
      if (appliedFilters.note) {
        result = result.filter((r) =>
          (r.note || '').toLowerCase().includes(appliedFilters.note.toLowerCase())
        );
      }
    }

    return result;
  }, [orders, debouncedSearch, appliedFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, appliedFilters]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedImports.size === filteredOrders.length) {
      setSelectedImports(new Set());
    } else {
      setSelectedImports(new Set(filteredOrders.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedImports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Apply advanced filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...advancedFilters });
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({
      importCode: '',
      supplierCode: '',
      supplierName: '',
      note: '',
    });
    setAppliedFilters(null);
    setSearchTerm('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Hoàn thành
          </Badge>
        );
      case 'draft':
        return <Badge variant="secondary">Nháp</Badge>;
      case 'cancelled':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = pagination?.total_pages || 1;

  return (
    <AppLayout title="Nhập hàng">
      <div className="animate-fade-in">
        <PageHeader
          title="Nhập hàng"
          description="Quản lý phiếu nhập hàng từ nhà cung cấp"
          actions={
            <Button onClick={() => navigate('/imports/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Nhập hàng
            </Button>
          }
        />

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã phiếu nhập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <div className="space-y-2">
                    <Label>Mã phiếu nhập</Label>
                    <Input
                      value={advancedFilters.importCode}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          importCode: e.target.value,
                        }))
                      }
                      placeholder="PN..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mã NCC</Label>
                    <Input
                      value={advancedFilters.supplierCode}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          supplierCode: e.target.value,
                        }))
                      }
                      placeholder="NCC..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên NCC</Label>
                    <Input
                      value={advancedFilters.supplierName}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          supplierName: e.target.value,
                        }))
                      }
                      placeholder="Nhập tên..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Input
                      value={advancedFilters.note}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
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

        {/* Imports Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredOrders.length > 0 &&
                      selectedImports.size === filteredOrders.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Mã phiếu nhập</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Mã NCC</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className="text-right">Tổng tiền hàng</TableHead>
                <TableHead className="text-right">VAT nhập hàng</TableHead>
                <TableHead>Ghi chú</TableHead>
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
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/imports/${order.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedImports.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Star className="w-4 h-4 text-muted-foreground/30 hover:text-warning cursor-pointer" />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-primary hover:underline">
                        {order.code}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(order.received_at)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {(order.supplier as any)?.code || '-'}
                    </TableCell>
                    <TableCell>{(order.supplier as any)?.name || 'Khách lẻ'}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(order.items_total || order.total_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.vat_amount || 0)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.note || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages} ({pagination?.total || 0} phiếu)
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
