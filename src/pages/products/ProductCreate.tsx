import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useProducts,
  useCategories,
  useCreateCategory,
  useCreateProduct,
} from '@/hooks/useSupabaseData';

interface ProductFormData {
  code: string;
  name: string;
  category_id: string;
  brand: string;
  cost_price: number;
  vat_import: number;
  sale_price_before_tax: number;
  vat_sale: number;
  sale_price_after_tax: number;
  initial_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  notes: string;
}

function generateProductCode(): string {
  const num = Math.floor(Math.random() * 1000000);
  return `SP${num.toString().padStart(6, '0')}`;
}

export default function ProductCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const createProduct = useCreateProduct();

  const [formData, setFormData] = useState<ProductFormData>({
    code: generateProductCode(),
    name: '',
    category_id: '',
    brand: '',
    cost_price: 0,
    vat_import: 0,
    sale_price_before_tax: 0,
    vat_sale: 10,
    sale_price_after_tax: 0,
    initial_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit: 'cái',
    notes: '',
  });

  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateBrandOpen, setIsCreateBrandOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate sale price after tax
  useEffect(() => {
    const afterTax = formData.sale_price_before_tax * (1 + formData.vat_sale / 100);
    setFormData((prev) => ({ ...prev, sale_price_after_tax: Math.round(afterTax) }));
  }, [formData.sale_price_before_tax, formData.vat_sale]);

  // Validate product code
  const validateCode = useCallback(
    (code: string) => {
      const exists = products.some((p) => p.code.toLowerCase() === code.toLowerCase());
      setCodeError(exists ? 'Mã hàng hóa đã tồn tại' : '');
      return !exists;
    },
    [products]
  );

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'code') {
      validateCode(value as string);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên nhóm hàng', variant: 'destructive' });
      return;
    }
    try {
      const result = await createCategory.mutateAsync({ name: newCategoryName });
      setFormData((prev) => ({ ...prev, category_id: result.id }));
      setNewCategoryName('');
      setIsCreateCategoryOpen(false);
      toast({ title: 'Thành công', description: 'Đã tạo nhóm hàng mới' });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo nhóm hàng', variant: 'destructive' });
    }
  };

  const handleSave = async (createNew = false) => {
    // Validation
    if (!formData.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên hàng hóa', variant: 'destructive' });
      return;
    }
    if (!formData.category_id) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn nhóm hàng', variant: 'destructive' });
      return;
    }
    if (!validateCode(formData.code)) {
      toast({ title: 'Lỗi', description: 'Mã hàng hóa đã tồn tại', variant: 'destructive' });
      return;
    }
    if (formData.initial_stock < 0) {
      toast({ title: 'Lỗi', description: 'Tồn kho không được âm', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await createProduct.mutateAsync({
        code: formData.code,
        name: formData.name,
        category_id: formData.category_id || null,
        sale_price_default: formData.sale_price_after_tax,
        unit: formData.unit,
        notes: formData.notes || null,
        status: 'active',
        track_inventory: true,
      });

      toast({ title: 'Thành công', description: 'Đã tạo hàng hóa mới' });

      if (createNew) {
        setFormData({
          code: generateProductCode(),
          name: '',
          category_id: '',
          brand: '',
          cost_price: 0,
          vat_import: 0,
          sale_price_before_tax: 0,
          vat_sale: 10,
          sale_price_after_tax: 0,
          initial_stock: 0,
          min_stock: 0,
          max_stock: 0,
          unit: 'cái',
          notes: '',
        });
      } else {
        navigate('/products');
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo hàng hóa', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout title="Thêm hàng hóa">
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Thêm hàng hóa</h1>
              <p className="text-sm text-muted-foreground">Tạo sản phẩm mới trong kho</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/products')}>
              Hủy
            </Button>
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Lưu & Thêm mới
            </Button>
            <Button onClick={() => handleSave(false)} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Lưu
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Mã hàng hóa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    placeholder="SP000000"
                  />
                  {codeError && <p className="text-sm text-destructive">{codeError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Mặc định tự sinh hoặc nhập tay
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Tên hàng hóa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nhập tên hàng hóa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Nhóm hàng <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category_id}
                      onValueChange={(v) => handleChange('category_id', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn nhóm hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateCategoryOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Thương hiệu</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="Nhập thương hiệu"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateBrandOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Đơn vị tính</Label>
                <Select value={formData.unit} onValueChange={(v) => handleChange('unit', v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cái">Cái</SelectItem>
                    <SelectItem value="chiếc">Chiếc</SelectItem>
                    <SelectItem value="hộp">Hộp</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="lít">Lít</SelectItem>
                    <SelectItem value="bộ">Bộ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Giá cả</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Giá vốn</Label>
                  <Input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT nhập (%)</Label>
                  <Input
                    type="number"
                    value={formData.vat_import}
                    onChange={(e) => handleChange('vat_import', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Giá bán (trước thuế)</Label>
                  <Input
                    type="number"
                    value={formData.sale_price_before_tax}
                    onChange={(e) =>
                      handleChange('sale_price_before_tax', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT bán (%)</Label>
                  <Input
                    type="number"
                    value={formData.vat_sale}
                    onChange={(e) => handleChange('vat_sale', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá bán (sau thuế)</Label>
                  <Input
                    type="number"
                    value={formData.sale_price_after_tax}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    = Giá trước thuế × (1 + VAT%)
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Tồn kho</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tồn kho đầu</Label>
                  <Input
                    type="number"
                    value={formData.initial_stock}
                    onChange={(e) =>
                      handleChange('initial_stock', parseInt(e.target.value) || 0)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tồn kho tối thiểu</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Cảnh báo khi dưới mức này</p>
                </div>
                <div className="space-y-2">
                  <Label>Tồn kho tối đa</Label>
                  <Input
                    type="number"
                    value={formData.max_stock}
                    onChange={(e) => handleChange('max_stock', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning">
                  ⚠️ Không cho phép bán khi tồn kho âm
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Ghi chú</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Nhập ghi chú về sản phẩm..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhóm hàng mới</DialogTitle>
            <DialogDescription>Thêm nhóm hàng để phân loại sản phẩm</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên nhóm hàng</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nhập tên nhóm hàng"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Brand Dialog */}
      <Dialog open={isCreateBrandOpen} onOpenChange={setIsCreateBrandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thương hiệu mới</DialogTitle>
            <DialogDescription>Thêm thương hiệu cho sản phẩm</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên thương hiệu</Label>
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nhập tên thương hiệu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBrandOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => {
              setFormData(prev => ({ ...prev, brand: newBrandName }));
              setNewBrandName('');
              setIsCreateBrandOpen(false);
              toast({ title: 'Thành công', description: 'Đã thêm thương hiệu' });
            }}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
