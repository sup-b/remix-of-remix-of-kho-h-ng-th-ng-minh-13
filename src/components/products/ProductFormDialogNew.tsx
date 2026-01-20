import { forwardRef, useState } from 'react';
import { ProductGroup, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react';
import { generateSKU } from '@/lib/storage';

export interface ProductFormData {
  sku: string;
  name: string;
  type: 'product' | 'service';
  groupId: string;
  brandId: string;
  costPrice: number;
  vatImport: number;
  salePriceBeforeTax: number;
  vatSale: number;
  salePrice: number;
  stockQty: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
  notes: string;
  description: string;
  warranty: string;
  directSale: boolean;
  loyaltyPoints: boolean;
  images: string[];
  config: Record<string, string>;
  serialNumber?: string;
  supplierId?: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductFormDialogNewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  groups: ProductGroup[];
  suppliers: Supplier[];
  brands: Brand[];
  isEditing: boolean;
  onFormChange: (data: Partial<ProductFormData>) => void;
  onSave: () => void;
  onSaveAndCreate: () => void;
  onGroupChange: (groupId: string) => void;
  onCreateGroup?: () => void;
  onCreateBrand?: () => void;
}

const VAT_OPTIONS = ['0%', '5%', '8%', '10%'];

export const ProductFormDialogNew = forwardRef<HTMLDivElement, ProductFormDialogNewProps>(
  (
    {
      open,
      onOpenChange,
      formData,
      groups,
      suppliers,
      brands,
      isEditing,
      onFormChange,
      onSave,
      onSaveAndCreate,
      onGroupChange,
      onCreateGroup,
      onCreateBrand,
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState('info');
    const [isPriceOpen, setIsPriceOpen] = useState(true);
    const [isStockOpen, setIsStockOpen] = useState(true);

    const isService = formData.type === 'service';
    const title = isEditing
      ? isService
        ? 'Chỉnh sửa dịch vụ'
        : 'Chỉnh sửa hàng hóa'
      : isService
        ? 'Tạo dịch vụ'
        : 'Tạo hàng hóa';

    // Calculate sale price after tax
    const calculateSalePriceAfterTax = (priceBeforeTax: number, vatPercent: number) => {
      return Math.round(priceBeforeTax * (1 + vatPercent / 100));
    };

    const handleVatSaleChange = (value: string) => {
      const vatPercent = parseInt(value.replace('%', ''));
      onFormChange({
        vatSale: vatPercent,
        salePrice: calculateSalePriceAfterTax(formData.salePriceBeforeTax, vatPercent),
      });
    };

    const handleSalePriceBeforeTaxChange = (value: number) => {
      onFormChange({
        salePriceBeforeTax: value,
        salePrice: calculateSalePriceAfterTax(value, formData.vatSale),
      });
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 w-fit bg-transparent border-b rounded-none h-auto p-0">
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-muted-foreground data-[state=active]:text-primary"
              >
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-muted-foreground data-[state=active]:text-primary"
              >
                Mô tả
              </TabsTrigger>
              <TabsTrigger
                value="warranty"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-muted-foreground data-[state=active]:text-primary"
              >
                Bảo hành, bảo trì
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="info" className="mt-0 space-y-6">
                <div className="flex gap-6">
                  {/* Left side - Form fields */}
                  <div className="flex-1 space-y-4">
                    {/* Mã hàng */}
                    <div>
                      <Label htmlFor="sku">Mã hàng</Label>
                      <div className="relative mt-1">
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => onFormChange({ sku: e.target.value })}
                          placeholder="Tự động"
                          disabled={isEditing}
                          className="border-primary focus:ring-primary"
                        />
                        {!isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => onFormChange({ sku: generateSKU() })}
                            title="Tạo mã mới"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tên hàng */}
                    <div>
                      <Label htmlFor="name">Tên hàng</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => onFormChange({ name: e.target.value })}
                        placeholder="Bắt buộc"
                        className="mt-1"
                      />
                    </div>

                    {/* Nhóm hàng & Thương hiệu */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Nhóm hàng</Label>
                          {onCreateGroup && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0 text-xs"
                              onClick={onCreateGroup}
                            >
                              Tạo mới
                            </Button>
                          )}
                        </div>
                        <Select value={formData.groupId} onValueChange={onGroupChange}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Chọn nhóm hàng (Bắt buộc)" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Thương hiệu</Label>
                          {onCreateBrand && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0 text-xs"
                              onClick={onCreateBrand}
                            >
                              Tạo mới
                            </Button>
                          )}
                        </div>
                        <Select
                          value={formData.brandId}
                          onValueChange={(value) => onFormChange({ brandId: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Chọn thương hiệu" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Image upload */}
                  <div className="w-64 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ImagePlus className="w-4 h-4" />
                          Thêm ảnh
                        </Button>
                        <span className="text-xs text-muted-foreground">Mỗi ảnh không quá 2 MB</span>
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
                        >
                          <ImagePlus className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Giá vốn, giá bán Section */}
                <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50">
                      <span className="font-medium">Giá vốn, giá bán</span>
                      {isPriceOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Giá vốn</Label>
                            <Input
                              type="number"
                              value={formData.costPrice || ''}
                              onChange={(e) => onFormChange({ costPrice: Number(e.target.value) })}
                              className="mt-1"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>VAT hàng nhập (%)</Label>
                            <Select
                              value={`${formData.vatImport}%`}
                              onValueChange={(v) => onFormChange({ vatImport: parseInt(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VAT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label>Giá bán trước thuế</Label>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="text-primary h-auto p-0 text-xs gap-1"
                              >
                                <span className="inline-block w-3 h-3 rounded bg-primary/20 text-primary text-[10px] flex items-center justify-center">%</span>
                                Thiết lập giá
                              </Button>
                            </div>
                            <Input
                              type="number"
                              value={formData.salePriceBeforeTax || ''}
                              onChange={(e) => handleSalePriceBeforeTaxChange(Number(e.target.value))}
                              className="mt-1"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>VAT hàng bán (%)</Label>
                            <Select value={`${formData.vatSale}%`} onValueChange={handleVatSaleChange}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VAT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Giá bán sau thuế</Label>
                            <Input
                              type="number"
                              value={formData.salePrice || 0}
                              disabled
                              className="mt-1 bg-muted"
                            />
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Tồn kho Section - Only for products */}
                {!isService && (
                  <Collapsible open={isStockOpen} onOpenChange={setIsStockOpen}>
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50">
                        <div>
                          <span className="font-medium">Tồn kho</span>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Quản lý số lượng tồn kho và định mức tồn. Khi tồn kho chạm đến định mức, bạn sẽ nhận được cảnh báo.
                          </p>
                        </div>
                        {isStockOpen ? (
                          <ChevronUp className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>Tồn kho hiện tại</Label>
                              <Input
                                type="number"
                                value={formData.stockQty || ''}
                                onChange={(e) => onFormChange({ stockQty: Number(e.target.value) })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Định mức tồn tối thiểu</Label>
                              <Input
                                type="number"
                                value={formData.minStock || ''}
                                onChange={(e) => onFormChange({ minStock: Number(e.target.value) })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Định mức tồn tối đa</Label>
                              <Input
                                type="number"
                                value={formData.maxStock || ''}
                                onChange={(e) => onFormChange({ maxStock: Number(e.target.value) })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Tích điểm - Only for services */}
                {isService && (
                  <div className="border rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="font-medium">Tích điểm</span>
                    <Switch
                      checked={formData.loyaltyPoints}
                      onCheckedChange={(checked) => onFormChange({ loyaltyPoints: checked })}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="description" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <Label>Mô tả sản phẩm</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => onFormChange({ description: e.target.value })}
                      placeholder="Nhập mô tả chi tiết..."
                      className="mt-1 min-h-[200px]"
                    />
                  </div>
                  <div>
                    <Label>Ghi chú nội bộ</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => onFormChange({ notes: e.target.value })}
                      placeholder="Ghi chú thêm..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="warranty" className="mt-0">
                <div>
                  <Label>Thông tin bảo hành, bảo trì</Label>
                  <Textarea
                    value={formData.warranty}
                    onChange={(e) => onFormChange({ warranty: e.target.value })}
                    placeholder="Nhập thông tin bảo hành..."
                    className="mt-1 min-h-[200px]"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t flex items-center justify-between bg-background">
            <div className="flex items-center gap-2">
              <Checkbox
                id="directSale"
                checked={formData.directSale}
                onCheckedChange={(checked) => onFormChange({ directSale: checked === true })}
              />
              <Label htmlFor="directSale" className="text-sm font-normal cursor-pointer">
                Bán trực tiếp
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Bỏ qua
              </Button>
              <Button variant="outline" onClick={onSaveAndCreate}>
                Lưu & Tạo thêm hàng
              </Button>
              <Button onClick={onSave}>Lưu</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ProductFormDialogNew.displayName = 'ProductFormDialogNew';
