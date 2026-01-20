import { useState } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Supplier } from '@/types';

interface ImportFilterPanelProps {
  suppliers: Supplier[];
  onFilter: (filters: ImportFilters) => void;
  onReset: () => void;
}

export interface ImportFilters {
  importCode: string;
  orderCode: string;
  productSearch: string;
  supplierSearch: string;
  supplierId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

const initialFilters: ImportFilters = {
  importCode: '',
  orderCode: '',
  productSearch: '',
  supplierSearch: '',
  supplierId: 'all',
  dateFrom: '',
  dateTo: '',
  status: 'all',
};

export function ImportFilterPanel({ suppliers, onFilter, onReset }: ImportFilterPanelProps) {
  const [filters, setFilters] = useState<ImportFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof ImportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onReset();
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'supplierId' || key === 'status') return value !== 'all';
    return value !== '';
  });

  return (
    <div className="mb-4">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Theo mã phiếu nhập"
            value={filters.importCode}
            onChange={(e) => handleFilterChange('importCode', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={isOpen ? 'bg-accent' : ''}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-3 p-4 border rounded-lg bg-background shadow-sm">
          <div className="space-y-3">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Theo mã phiếu nhập"
                  value={filters.importCode}
                  onChange={(e) => handleFilterChange('importCode', e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Theo mã phiếu đặt hàng nhập"
                  value={filters.orderCode}
                  onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Theo mã, tên hàng"
                  value={filters.productSearch}
                  onChange={(e) => handleFilterChange('productSearch', e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Theo mã, tên NCC"
                  value={filters.supplierSearch}
                  onChange={(e) => handleFilterChange('supplierSearch', e.target.value)}
                />
              </div>
            </div>

            {/* Expandable Section */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="space-y-3 pt-3">
                {/* Row 3 - Supplier & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Nhà cung cấp</Label>
                    <Select
                      value={filters.supplierId}
                      onValueChange={(value) => handleFilterChange('supplierId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn NCC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả NCC</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Trạng thái</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4 - Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Từ ngày</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Đến ngày</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
              </CollapsibleContent>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Mở rộng
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button onClick={handleSearch} className="bg-primary">
                  Tìm kiếm
                </Button>
              </div>
            </Collapsible>
          </div>
        </div>
      )}
    </div>
  );
}
