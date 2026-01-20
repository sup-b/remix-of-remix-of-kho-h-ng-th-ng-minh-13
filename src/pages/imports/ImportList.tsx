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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Filter,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  usePurchaseReceipts,
  useSuppliers,
  formatCurrency,
  formatDateTime,
} from '@/hooks/useSupabaseData';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 50;

interface AdvancedFilters {
  importCode: string;
  purchaseOrderCode: string;
  productCode: string;
  productName: string;
  supplierCode: string;
  supplierName: string;
  note: string;
}

export default function ImportList() {
  const navigate = useNavigate();
  const { data: receipts = [], isLoading } = usePurchaseReceipts();
  const { data: suppliers = [] } = useSuppliers();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    importCode: '',
    purchaseOrderCode: '',
    productCode: '',
    productName: '',
    supplierCode: '',
    supplierName: '',
    note: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let result = receipts;

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
  }, [receipts, debouncedSearch, appliedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / PAGE_SIZE);
  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReceipts.slice(start, start + PAGE_SIZE);
  }, [filteredReceipts, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, appliedFilters]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedImports.size === paginatedReceipts.length) {
      setSelectedImports(new Set());
    } else {
      setSelectedImports(new Set(paginatedReceipts.map((r) => r.id)));
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
      purchaseOrderCode: '',
      productCode: '',
      productName: '',
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
        return (
          <Badge variant="secondary">Nháp</Badge>
        );
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
            <PopoverContent className="w-96" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Bộ lọc nâng cao</h4>
                <div className="grid grid-cols-2 gap-3">
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
                    <Label>Mã đặt hàng</Label>
                    <Input
                      value={advancedFilters.purchaseOrderCode}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          purchaseOrderCode: e.target.value,
                        }))
                      }
                      placeholder="PO..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mã hàng hóa</Label>
                    <Input
                      value={advancedFilters.productCode}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          productCode: e.target.value,
                        }))
                      }
                      placeholder="SP..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên hàng hóa</Label>
                    <Input
                      value={advancedFilters.productName}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          productName: e.target.value,
                        }))
                      }
                      placeholder="Nhập tên..."
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
                      paginatedReceipts.length > 0 &&
                      selectedImports.size === paginatedReceipts.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Mã phiếu nhập</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Mã NCC</TableHead>
                <TableHead>Tên NCC</TableHead>
                <TableHead className="text-right">Tiền VAT nhập</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : paginatedReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceipts.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/imports/${receipt.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedImports.has(receipt.id)}
                        onCheckedChange={() => toggleSelect(receipt.id)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Star className="w-4 h-4 text-muted-foreground/30 hover:text-warning cursor-pointer" />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-primary hover:underline">
                        {receipt.code}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(receipt.receipt_date)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {(receipt.supplier as any)?.code || '-'}
                    </TableCell>
                    <TableCell>{(receipt.supplier as any)?.name || 'Khách lẻ'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(0)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {receipt.note || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
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
                {Math.min(currentPage * PAGE_SIZE, filteredReceipts.length)} trong{' '}
                {filteredReceipts.length} phiếu
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
