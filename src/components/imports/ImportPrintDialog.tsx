import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FileSpreadsheet, Printer, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  widthInch?: string;
  heightInch?: string;
  labelsPerRow: number;
  type: 'roll' | 'sheet' | 'jewelry';
}

const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: 'roll-3-104x22',
    name: 'Mẫu giấy cuộn 3 nhãn',
    width: 104,
    height: 22,
    widthInch: '4.2',
    heightInch: '0.9',
    labelsPerRow: 3,
    type: 'roll',
  },
  {
    id: 'roll-2-72x22',
    name: 'Mẫu giấy cuộn 2 nhãn',
    width: 72,
    height: 22,
    labelsPerRow: 2,
    type: 'roll',
  },
  {
    id: 'roll-2-74x22',
    name: 'Mẫu giấy cuộn 2 nhãn',
    width: 74,
    height: 22,
    labelsPerRow: 2,
    type: 'roll',
  },
  {
    id: 'roll-1-50x30',
    name: 'Mẫu giấy cuộn 1 nhãn',
    width: 50,
    height: 30,
    widthInch: '1.97',
    heightInch: '1.18',
    labelsPerRow: 1,
    type: 'roll',
  },
  {
    id: 'jewelry-75x10',
    name: 'Mẫu tem hàng trang sức',
    width: 75,
    height: 10,
    widthInch: '2.75',
    heightInch: '0.4',
    labelsPerRow: 1,
    type: 'jewelry',
  },
];

interface LabelSettings {
  labelType: 'sku' | 'barcode' | 'qrcode';
  printPrice: boolean;
  currencyWithVND: boolean;
  showUnit: boolean;
  showStoreName: boolean;
  storeName: string;
}

interface ImportPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PrintItem[];
  printQuantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onPrint: () => void;
}

export function ImportPrintDialog({
  open,
  onOpenChange,
  items,
  printQuantities,
  onQuantityChange,
  onRemoveItem,
  onPrint,
}: ImportPrintDialogProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('roll-3-104x22');
  const [settings, setSettings] = useState<LabelSettings>({
    labelType: 'sku',
    printPrice: false,
    currencyWithVND: false,
    showUnit: false,
    showStoreName: false,
    storeName: '',
  });

  const totalLabels = Object.values(printQuantities).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const handleExportExcel = () => {
    // Export logic here
    console.log('Exporting to Excel:', items);
    alert('Đã xuất file Excel');
  };

  const selectedTemplateData = LABEL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            In tem mã
          </DialogTitle>
          <DialogDescription>
            Chọn loại giấy và cấu hình nội dung tem mã cần in
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'settings')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Danh sách sản phẩm</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Cấu hình tem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[350px] border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-32">Mã hàng</TableHead>
                    <TableHead>Tên hàng</TableHead>
                    <TableHead className="w-28 text-right">Số lượng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Không có sản phẩm nào để in tem
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onRemoveItem(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">
                          {item.productSku}
                        </TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={printQuantities[item.productId] || 1}
                            onChange={(e) =>
                              onQuantityChange(item.productId, Number(e.target.value))
                            }
                            className="w-20 text-center ml-auto"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 min-h-0 mt-4">
            <div className="grid grid-cols-2 gap-6 h-[350px]">
              {/* Left: Label Content Options */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Tùy chọn nội dung tem
                </h3>

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  {/* Label Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Loại tem</Label>
                    <Select
                      value={settings.labelType}
                      onValueChange={(v) => setSettings({ ...settings, labelType: v as LabelSettings['labelType'] })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="sku">Mã hàng</SelectItem>
                        <SelectItem value="barcode">Mã vạch (Barcode)</SelectItem>
                        <SelectItem value="qrcode">Mã QR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Print Price */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">In giá</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="printPrice"
                        checked={settings.printPrice}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, printPrice: checked as boolean })
                        }
                      />
                      <label htmlFor="printPrice" className="text-sm text-muted-foreground">
                        {settings.printPrice ? 'Có in giá' : 'Không in giá'}
                      </label>
                    </div>
                  </div>

                  {/* Currency with VND */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Đơn vị tiền tệ</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="currencyVND"
                        checked={settings.currencyWithVND}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, currencyWithVND: checked as boolean })
                        }
                        disabled={!settings.printPrice}
                      />
                      <label htmlFor="currencyVND" className="text-sm text-muted-foreground">
                        {settings.currencyWithVND ? 'Có kèm VND' : 'Không kèm VND'}
                      </label>
                    </div>
                  </div>

                  {/* Show Unit */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Đơn vị tính</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showUnit"
                        checked={settings.showUnit}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, showUnit: checked as boolean })
                        }
                        disabled={!settings.printPrice}
                      />
                      <label htmlFor="showUnit" className="text-sm text-muted-foreground">
                        {settings.showUnit ? 'Có kèm đơn vị' : 'Không kèm đơn vị'}
                      </label>
                    </div>
                  </div>

                  {/* Store Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Tên cửa hàng</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showStoreName"
                          checked={settings.showStoreName}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, showStoreName: checked as boolean })
                          }
                        />
                        <label htmlFor="showStoreName" className="text-sm text-muted-foreground">
                          {settings.showStoreName ? 'Có in' : 'Không in'}
                        </label>
                      </div>
                    </div>
                    {settings.showStoreName && (
                      <Input
                        placeholder="Nhập tên cửa hàng..."
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                        className="bg-background"
                      />
                    )}
                  </div>

                  {/* Export Excel */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleExportExcel}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Xuất file Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Paper Templates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Mẫu giấy / tem mã có sẵn
                </h3>

                <ScrollArea className="h-[310px]">
                  <RadioGroup
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                    className="space-y-2"
                  >
                    {LABEL_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <RadioGroupItem value={template.id} id={template.id} />
                        <div className="flex-1">
                          <label
                            htmlFor={template.id}
                            className="text-sm font-medium cursor-pointer block"
                          >
                            {template.name}
                          </label>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-mono">
                              Khổ nhãn: {template.width} × {template.height} mm
                            </span>
                            {template.widthInch && template.heightInch && (
                              <span className="ml-2 text-muted-foreground/70">
                                ({template.widthInch} × {template.heightInch} inch)
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Label Preview */}
                        <div
                          className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center bg-white"
                          style={{
                            width: Math.min(template.width * 0.8, 80),
                            height: Math.min(template.height * 1.2, 40),
                          }}
                        >
                          <span className="text-[8px] text-muted-foreground">
                            {template.labelsPerRow}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Tổng: <span className="font-semibold text-foreground">{totalLabels}</span> tem
            </span>
            {selectedTemplateData && (
              <span className="text-sm text-muted-foreground">
                Mẫu: <span className="font-medium text-foreground">{selectedTemplateData.name}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Bỏ qua
            </Button>
            <Button
              onClick={onPrint}
              className="bg-primary hover:bg-primary/90 gap-2"
              disabled={items.length === 0}
            >
              <Printer className="w-4 h-4" />
              In tem mã
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
