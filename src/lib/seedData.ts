import { ProductGroup, Product, Customer, Supplier } from '@/types';
import { generateId, generateSKU, getProductGroups, getProducts, getCustomers, getSuppliers, saveProductGroups, saveProducts, saveCustomers, saveSuppliers } from './storage';

const sampleProductGroups: Omit<ProductGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'PC 10 triệu',
    minPrice: 8000000,
    maxPrice: 12000000,
    description: 'Máy tính để bàn phân khúc phổ thông, phù hợp văn phòng và học tập',
    configTemplate: {
      CPU: 'Intel Core i5-12400',
      RAM: '16GB DDR4 3200MHz',
      SSD: '512GB NVMe',
      VGA: 'Intel UHD 730',
      Main: 'B660M',
      PSU: '550W 80+ Bronze',
      Case: 'Mid Tower',
    },
    status: 'active',
  },
  {
    name: 'PC 20 triệu',
    minPrice: 18000000,
    maxPrice: 25000000,
    description: 'Máy tính để bàn hiệu năng cao, phù hợp đồ họa và gaming nhẹ',
    configTemplate: {
      CPU: 'Intel Core i7-13700',
      RAM: '32GB DDR4 3600MHz',
      SSD: '1TB NVMe Gen4',
      VGA: 'RTX 3060 12GB',
      Main: 'B760M',
      PSU: '650W 80+ Gold',
      Case: 'Mid Tower RGB',
    },
    status: 'active',
  },
  {
    name: 'PC Gaming 30 triệu',
    minPrice: 28000000,
    maxPrice: 35000000,
    description: 'Máy tính gaming cao cấp, chơi mượt mọi tựa game AAA',
    configTemplate: {
      CPU: 'Intel Core i7-14700K',
      RAM: '32GB DDR5 5600MHz',
      SSD: '2TB NVMe Gen4',
      VGA: 'RTX 4070 Super 12GB',
      Main: 'Z790',
      PSU: '850W 80+ Gold',
      Case: 'Full Tower RGB',
      Tản: 'AIO 240mm RGB',
    },
    status: 'active',
  },
  {
    name: 'Laptop văn phòng',
    minPrice: 10000000,
    maxPrice: 18000000,
    description: 'Laptop mỏng nhẹ, phù hợp làm việc văn phòng và di chuyển',
    configTemplate: {
      CPU: 'Intel Core i5-1235U',
      RAM: '8GB DDR4',
      SSD: '256GB NVMe',
      'Màn hình': '14 inch FHD IPS',
      Pin: '45Wh',
      'Trọng lượng': '1.5kg',
    },
    status: 'active',
  },
  {
    name: 'Màn hình 24 inch',
    minPrice: 3000000,
    maxPrice: 6000000,
    description: 'Màn hình 24 inch Full HD, phù hợp làm việc và giải trí',
    configTemplate: {
      'Kích thước': '24 inch',
      'Độ phân giải': '1920x1080 (FHD)',
      'Tấm nền': 'IPS',
      'Tần số quét': '75Hz',
      'Thời gian đáp ứng': '5ms',
      'Cổng kết nối': 'HDMI, VGA, DP',
    },
    status: 'active',
  },
  {
    name: 'Phụ kiện',
    minPrice: 100000,
    maxPrice: 2000000,
    description: 'Chuột, bàn phím, tai nghe và các phụ kiện khác',
    configTemplate: {
      'Loại': 'Phụ kiện',
      'Kết nối': 'USB/Wireless',
    },
    status: 'active',
  },
];

const sampleCustomers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Nguyễn Văn An', phone: '0901234567', address: '123 Lê Lợi, Q.1, TP.HCM', notes: 'Khách VIP' },
  { name: 'Trần Thị Bình', phone: '0912345678', address: '456 Nguyễn Huệ, Q.1, TP.HCM', notes: '' },
  { name: 'Lê Văn Cường', phone: '0923456789', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', notes: 'Mua số lượng lớn' },
  { name: 'Phạm Thị Dung', phone: '0934567890', address: '321 Hai Bà Trưng, Q.3, TP.HCM', notes: '' },
  { name: 'Hoàng Văn Em', phone: '0945678901', address: '654 Võ Văn Tần, Q.3, TP.HCM', notes: 'Công ty ABC' },
];

const sampleSuppliers: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Công ty TNHH Intel Việt Nam', phone: '0281234567', address: 'KCN Sài Gòn Hi-Tech, Q.9, TP.HCM', notes: 'Nhà cung cấp CPU chính' },
  { name: 'Phong Vũ Computer', phone: '0282345678', address: '118 Hoàng Hoa Thám, Q.Tân Bình, TP.HCM', notes: 'Đại lý linh kiện' },
  { name: 'An Phát Computer', phone: '0283456789', address: '68 Bùi Thị Xuân, Q.1, TP.HCM', notes: 'Nhập laptop' },
  { name: 'Hanoicomputer', phone: '0284567890', address: '131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội', notes: 'Đại lý toàn quốc' },
];

export function initSeedData(): void {
  // Only seed if no data exists
  if (getProductGroups().length === 0) {
    const now = new Date().toISOString();
    const groups: ProductGroup[] = sampleProductGroups.map(g => ({
      ...g,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    saveProductGroups(groups);

    // Create sample products based on groups
    const products: Product[] = [];

    // Helper to create product with new required fields
    const createProduct = (data: {
      sku: string;
      name: string;
      groupId: string;
      config: Record<string, string>;
      costPrice: number;
      salePrice: number;
      stockQty: number;
      unit: string;
      notes: string;
    }): Product => ({
      id: generateId(),
      sku: data.sku,
      name: data.name,
      type: 'product',
      groupId: data.groupId,
      brandId: null,
      config: data.config,
      costPrice: data.costPrice,
      salePriceBeforeTax: Math.round(data.salePrice / 1.08),
      salePrice: data.salePrice,
      vatImport: 8,
      vatSale: 8,
      stockQty: data.stockQty,
      minStock: 5,
      maxStock: 100,
      unit: data.unit,
      status: 'in_stock',
      notes: data.notes,
      description: '',
      warranty: '',
      directSale: true,
      loyaltyPoints: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
    
    // PC 10 triệu group
    const pc10Group = groups.find(g => g.name === 'PC 10 triệu');
    if (pc10Group) {
      products.push(createProduct({
        sku: generateSKU('PC'),
        name: 'PC Văn phòng i5 Basic',
        groupId: pc10Group.id,
        config: { ...pc10Group.configTemplate },
        costPrice: 8500000,
        salePrice: 10500000,
        stockQty: 15,
        unit: 'bộ',
        notes: 'Phù hợp văn phòng cơ bản',
      }));
      products.push(createProduct({
        sku: generateSKU('PC'),
        name: 'PC Học sinh i5 SSD 256',
        groupId: pc10Group.id,
        config: { ...pc10Group.configTemplate, SSD: '256GB NVMe' },
        costPrice: 7500000,
        salePrice: 9500000,
        stockQty: 8,
        unit: 'bộ',
        notes: 'Tiết kiệm cho học sinh',
      }));
    }

    // PC 20 triệu group
    const pc20Group = groups.find(g => g.name === 'PC 20 triệu');
    if (pc20Group) {
      products.push(createProduct({
        sku: generateSKU('PC'),
        name: 'PC Đồ họa i7 RTX3060',
        groupId: pc20Group.id,
        config: { ...pc20Group.configTemplate },
        costPrice: 18000000,
        salePrice: 22000000,
        stockQty: 5,
        unit: 'bộ',
        notes: 'Render 3D, chỉnh sửa video',
      }));
      products.push(createProduct({
        sku: generateSKU('PC'),
        name: 'PC Workstation i7 32GB',
        groupId: pc20Group.id,
        config: { ...pc20Group.configTemplate, RAM: '64GB DDR4 3600MHz' },
        costPrice: 22000000,
        salePrice: 26000000,
        stockQty: 3,
        unit: 'bộ',
        notes: 'Máy trạm chuyên nghiệp',
      }));
    }

    // PC Gaming group
    const gamingGroup = groups.find(g => g.name === 'PC Gaming 30 triệu');
    if (gamingGroup) {
      products.push(createProduct({
        sku: generateSKU('GM'),
        name: 'PC Gaming RTX4070 Super',
        groupId: gamingGroup.id,
        config: { ...gamingGroup.configTemplate },
        costPrice: 28000000,
        salePrice: 33000000,
        stockQty: 2,
        unit: 'bộ',
        notes: 'Gaming 4K High Settings',
      }));
    }

    // Laptop group
    const laptopGroup = groups.find(g => g.name === 'Laptop văn phòng');
    if (laptopGroup) {
      products.push(createProduct({
        sku: generateSKU('LT'),
        name: 'Laptop ASUS VivoBook 14',
        groupId: laptopGroup.id,
        config: { ...laptopGroup.configTemplate, Hãng: 'ASUS' },
        costPrice: 11000000,
        salePrice: 13500000,
        stockQty: 10,
        unit: 'chiếc',
        notes: 'Mỏng nhẹ, pin trâu',
      }));
      products.push(createProduct({
        sku: generateSKU('LT'),
        name: 'Laptop HP 15 i5-1235U',
        groupId: laptopGroup.id,
        config: { ...laptopGroup.configTemplate, Hãng: 'HP', RAM: '16GB DDR4' },
        costPrice: 13000000,
        salePrice: 16000000,
        stockQty: 6,
        unit: 'chiếc',
        notes: 'Bàn phím số, RAM 16GB',
      }));
      products.push(createProduct({
        sku: generateSKU('LT'),
        name: 'Laptop Dell Inspiron 14',
        groupId: laptopGroup.id,
        config: { ...laptopGroup.configTemplate, Hãng: 'Dell' },
        costPrice: 12000000,
        salePrice: 14500000,
        stockQty: 4,
        unit: 'chiếc',
        notes: '',
      }));
    }

    // Monitor group
    const monitorGroup = groups.find(g => g.name === 'Màn hình 24 inch');
    if (monitorGroup) {
      products.push(createProduct({
        sku: generateSKU('MN'),
        name: 'Màn hình Dell SE2422H 24"',
        groupId: monitorGroup.id,
        config: { ...monitorGroup.configTemplate, Hãng: 'Dell' },
        costPrice: 2800000,
        salePrice: 3500000,
        stockQty: 20,
        unit: 'chiếc',
        notes: 'Bảo hành 3 năm',
      }));
      products.push(createProduct({
        sku: generateSKU('MN'),
        name: 'Màn hình Samsung 24" FHD',
        groupId: monitorGroup.id,
        config: { ...monitorGroup.configTemplate, Hãng: 'Samsung' },
        costPrice: 3200000,
        salePrice: 4000000,
        stockQty: 12,
        unit: 'chiếc',
        notes: '',
      }));
    }

    // Accessories group
    const accessoryGroup = groups.find(g => g.name === 'Phụ kiện');
    if (accessoryGroup) {
      products.push(createProduct({
        sku: generateSKU('PK'),
        name: 'Chuột Logitech G102',
        groupId: accessoryGroup.id,
        config: { 'Loại': 'Chuột gaming', 'Kết nối': 'USB có dây', 'DPI': '8000' },
        costPrice: 350000,
        salePrice: 450000,
        stockQty: 50,
        unit: 'cái',
        notes: 'Gaming phổ thông',
      }));
      products.push(createProduct({
        sku: generateSKU('PK'),
        name: 'Bàn phím cơ E-Dra EK387',
        groupId: accessoryGroup.id,
        config: { 'Loại': 'Bàn phím cơ', 'Kết nối': 'USB-C', 'Switch': 'Huano' },
        costPrice: 650000,
        salePrice: 850000,
        stockQty: 25,
        unit: 'cái',
        notes: 'RGB, hot-swap',
      }));
      products.push(createProduct({
        sku: generateSKU('PK'),
        name: 'Tai nghe HyperX Cloud Stinger',
        groupId: accessoryGroup.id,
        config: { 'Loại': 'Tai nghe gaming', 'Kết nối': 'Jack 3.5mm' },
        costPrice: 800000,
        salePrice: 1050000,
        stockQty: 1,
        unit: 'cái',
        notes: 'Tồn kho thấp',
      }));
      products.push(createProduct({
        sku: generateSKU('PK'),
        name: 'Webcam Logitech C270',
        groupId: accessoryGroup.id,
        config: { 'Loại': 'Webcam', 'Kết nối': 'USB', 'Độ phân giải': '720p' },
        costPrice: 400000,
        salePrice: 550000,
        stockQty: 30,
        unit: 'cái',
        notes: 'Học online, họp video',
      }));
    }

    saveProducts(products);
  }

  // Seed customers
  if (getCustomers().length === 0) {
    const now = new Date().toISOString();
    const customers: Customer[] = sampleCustomers.map(c => ({
      ...c,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    saveCustomers(customers);
  }

  // Seed suppliers
  if (getSuppliers().length === 0) {
    const now = new Date().toISOString();
    const suppliers: Supplier[] = sampleSuppliers.map(s => ({
      ...s,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    saveSuppliers(suppliers);
  }
}
