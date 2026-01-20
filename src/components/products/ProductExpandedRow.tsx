import { forwardRef } from 'react';
import { Product, Import, Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime, getSupplierById } from '@/lib/storage';

interface ProductTransaction {
  id: string;
  date: string;
  type: 'import' | 'sale';
  partner: string;
  transactionPrice: number;
  costPrice: number;
  quantity: number;
  stock: number;
}

interface ProductExpandedRowProps {
  product: Product;
  imports: Import[];
  invoices: Invoice[];
}

export function getProductTransactions(
  productId: string,
  imports: Import[],
  invoices: Invoice[]
): ProductTransaction[] {
  const transactions: ProductTransaction[] = [];
  let runningStock = 0;

  // Get imports for this product
  imports.forEach((imp) => {
    const item = imp.items.find((i) => i.productId === productId);
    if (item) {
      runningStock += item.quantity;
      const supplier = getSupplierById(imp.supplierId);
      transactions.push({
        id: imp.id,
        date: imp.date,
        type: 'import',
        partner: supplier?.name || 'N/A',
        transactionPrice: item.unitPrice,
        costPrice: item.unitPrice,
        quantity: item.quantity,
        stock: runningStock,
      });
    }
  });

  // Get sales for this product
  invoices.forEach((inv) => {
    const item = inv.items.find((i) => i.productId === productId);
    if (item) {
      runningStock -= item.quantity;
      transactions.push({
        id: inv.id,
        date: inv.date,
        type: 'sale',
        partner: 'Khách hàng',
        transactionPrice: item.unitPrice,
        costPrice: item.unitPrice,
        quantity: item.quantity,
        stock: runningStock,
      });
    }
  });

  // Sort by date descending
  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const ProductExpandedRow = forwardRef<HTMLDivElement, ProductExpandedRowProps>(
  ({ product, imports, invoices }, ref) => {
    const transactions = getProductTransactions(product.id, imports, invoices);
    const supplier = (product as any).supplierId
      ? getSupplierById((product as any).supplierId)
      : null;

    return (
      <div ref={ref} className="bg-muted/30 border-t">
        <Tabs defaultValue="inventory" className="w-full">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Mô tả, ghi chú
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Thẻ kho
              </TabsTrigger>
              <TabsTrigger
                value="stock"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Tồn kho
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info" className="p-4 m-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Mã SKU:</span>
                <span className="ml-2 font-medium">{product.sku}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Đơn vị:</span>
                <span className="ml-2 font-medium">{product.unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Giá nhập:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(product.costPrice)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Giá bán:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatCurrency(product.salePrice)}
                </span>
              </div>
              {supplier && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Nhà cung cấp:</span>
                  <span className="ml-2 font-medium">{supplier.name}</span>
                </div>
              )}
              {(product as any).serialNumber && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Số seri:</span>
                  <span className="ml-2 font-medium">
                    {(product as any).serialNumber}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="p-4 m-0">
            <p className="text-sm text-muted-foreground">
              {product.notes || 'Chưa có ghi chú'}
            </p>
          </TabsContent>

          <TabsContent value="inventory" className="m-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Chứng từ</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại giao dịch</TableHead>
                  <TableHead>Đối tác</TableHead>
                  <TableHead className="text-right">Giá GD</TableHead>
                  <TableHead className="text-right">Giá vốn</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Tồn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id + tx.date}>
                      <TableCell>
                        <span className="text-primary font-medium cursor-pointer hover:underline">
                          {tx.type === 'import' ? 'PN' : 'HD'}
                          {tx.id.slice(-6).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(tx.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.type === 'import' ? 'secondary' : 'outline'}
                        >
                          {tx.type === 'import' ? 'Nhập hàng' : 'Bán hàng'}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.partner}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(tx.transactionPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(tx.costPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {tx.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {tx.stock}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="stock" className="p-4 m-0">
            <div className="text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Tồn kho hiện tại:</span>
                <Badge
                  variant="outline"
                  className={product.stockQty > 0 ? 'badge-success' : 'badge-danger'}
                >
                  {product.stockQty} {product.unit}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge
                  variant="outline"
                  className={
                    product.status === 'in_stock'
                      ? 'badge-success'
                      : product.status === 'out_of_stock'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }
                >
                  {product.status === 'in_stock'
                    ? 'Còn hàng'
                    : product.status === 'out_of_stock'
                    ? 'Hết hàng'
                    : 'Ngừng bán'}
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

ProductExpandedRow.displayName = 'ProductExpandedRow';
