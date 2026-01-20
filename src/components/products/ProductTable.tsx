import { forwardRef, Fragment } from 'react';
import { Product, ProductGroup, Supplier, Import, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
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
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency, getProductGroupById, getSupplierById } from '@/lib/storage';
import { ProductExpandedRow } from './ProductExpandedRow';

interface ProductTableProps {
  products: Product[];
  selectedIds: Set<string>;
  expandedProductId: string | null;
  imports: Import[];
  invoices: Invoice[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onToggleExpand: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const STATUS_MAP = {
  in_stock: { label: 'Còn hàng', class: 'badge-success' },
  out_of_stock: { label: 'Hết hàng', class: 'badge-warning' },
  discontinued: { label: 'Ngừng bán', class: 'badge-danger' },
} as const;

export const ProductTable = forwardRef<HTMLDivElement, ProductTableProps>(
  (
    {
      products,
      selectedIds,
      expandedProductId,
      imports,
      invoices,
      onSelectProduct,
      onSelectAll,
      onToggleExpand,
      onEdit,
      onDelete,
    },
    ref
  ) => {
    const allSelected = products.length > 0 && selectedIds.size === products.length;

    return (
      <div ref={ref} className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Tên hàng hóa</TableHead>
              <TableHead>Giá nhập</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  Chưa có sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isExpanded = expandedProductId === product.id;
                const isSelected = selectedIds.has(product.id);
                const group = product.groupId
                  ? getProductGroupById(product.groupId)
                  : null;
                const supplier = (product as any).supplierId
                  ? getSupplierById((product as any).supplierId)
                  : null;
                const status = STATUS_MAP[product.status];

                return (
                  <Fragment key={product.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/50 ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => onToggleExpand(product.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {group && (
                              <Badge variant="secondary" className="text-xs">
                                {group.name}
                              </Badge>
                            )}
                            {supplier && (
                              <Badge variant="outline" className="text-xs">
                                NCC: {supplier.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatCurrency(product.costPrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-primary">
                          {formatCurrency(product.salePrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.stockQty === 0
                              ? 'badge-danger'
                              : product.stockQty < 5
                              ? 'badge-warning'
                              : 'badge-success'
                          }
                        >
                          {product.stockQty} {product.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.class}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(product);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(product);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <ProductExpandedRow
                            product={product}
                            imports={imports}
                            invoices={invoices}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
);

ProductTable.displayName = 'ProductTable';
