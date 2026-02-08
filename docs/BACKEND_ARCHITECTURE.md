# Tài liệu Kiến trúc Backend & Database

## Mục lục
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Cấu trúc Database](#2-cấu-trúc-database)
3. [Edge Functions (Backend Logic)](#3-edge-functions-backend-logic)
4. [Quy tắc nghiệp vụ](#4-quy-tắc-nghiệp-vụ)
5. [Luồng dữ liệu](#5-luồng-dữ-liệu)
6. [API Reference](#6-api-reference)

---

## 1. Tổng quan hệ thống

### 1.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   POS    │  │  Nhập    │  │ Sản phẩm │  │ Khách/NCC/Báo cáo│ │
│  │ Bán hàng │  │  hàng    │  │          │  │                  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ sales-order  │  │purchase-order│  │   code-generator     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                     │               │
│         ▼                 ▼                     │               │
│  ┌──────────────┐  ┌──────────────┐             │               │
│  │stock-service │  │price-calculator│           │               │
│  └──────┬───────┘  └──────────────┘             │               │
└─────────┼───────────────────────────────────────┼───────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ products │ │suppliers │ │ customers  │ │   stock_cards    │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘  │
│  ┌──────────────────┐  ┌────────────────────┐                   │
│  │  purchase_orders │  │    sales_orders    │                   │
│  │  + items         │  │    + items         │                   │
│  └──────────────────┘  └────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Database**: PostgreSQL (Supabase)
- **State Management**: TanStack Query (React Query)

---

## 2. Cấu trúc Database

### 2.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  suppliers  │       │ purchase_orders │       │  products   │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ supplier_id(FK) │       │ id (PK)     │
│ code        │       │ id (PK)         │       │ code        │
│ name        │       │ code            │       │ name        │
│ phone       │       │ status          │       │ cost_price  │
│ email       │       │ total_amount    │       │ sale_price  │
│ address     │       │ final_amount    │       │ stock       │
│ status      │       │ vat_amount      │       │ category_id │
└─────────────┘       │ discount_type   │       │ status      │
                      │ discount_value  │       └──────┬──────┘
                      └────────┬────────┘              │
                               │                       │
                               ▼                       │
                      ┌────────────────────┐           │
                      │purchase_order_items│           │
                      ├────────────────────┤           │
                      │ id (PK)            │           │
                      │ purchase_order_id  │◄──────────┤
                      │ product_id (FK)    │───────────┘
                      │ quantity           │
                      │ unit_price         │
                      │ import_price       │
                      │ discount           │
                      │ total_amount       │
                      └────────────────────┘

┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  customers  │       │  sales_orders   │       │ stock_cards │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ customer_id(FK) │       │ id (PK)     │
│ code        │       │ id (PK)         │       │ product_id  │
│ name        │       │ code            │       │ ref_code    │
│ phone       │       │ status          │       │ ref_type    │
│ email       │       │ payment_status  │       │ trans_type  │
│ address     │       │ total_items     │       │ quantity    │
│ status      │       │ after_discount  │       │ unit_cost   │
└─────────────┘       │ vat_amount      │       │ stock_before│
                      │ final_amount    │       │ stock_after │
                      │ paid_amount     │       └─────────────┘
                      └────────┬────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │ sales_order_items  │
                      ├────────────────────┤
                      │ id (PK)            │
                      │ sales_order_id     │
                      │ product_id (FK)    │
                      │ quantity           │
                      │ unit_price         │
                      │ cost_price         │
                      │ discount           │
                      │ total_amount       │
                      │ profit             │
                      └────────────────────┘
```

### 2.2 Chi tiết các bảng

#### 2.2.1 `products` - Sản phẩm
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| code | text | No | - | Mã SP (SP000001...) |
| name | text | No | - | Tên sản phẩm |
| barcode | text | Yes | - | Mã vạch |
| category_id | uuid | Yes | - | FK → categories |
| cost_price | numeric | No | 0 | Giá vốn (tự động cập nhật khi nhập hàng) |
| sale_price_default | numeric | No | 0 | Giá bán mặc định |
| vat_sale | numeric | No | 0 | % VAT bán hàng |
| stock | numeric | No | 0 | Tồn kho hiện tại |
| track_inventory | boolean | No | true | Theo dõi tồn kho |
| unit | text | No | 'cái' | Đơn vị tính |
| image_url | text | Yes | - | URL hình ảnh |
| notes | text | Yes | - | Ghi chú |
| status | text | No | 'active' | Trạng thái |
| created_at | timestamptz | No | now() | Ngày tạo |
| updated_at | timestamptz | No | now() | Ngày cập nhật |

#### 2.2.2 `suppliers` - Nhà cung cấp
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| code | text | Yes | - | Mã NCC (NCC00001...) |
| name | text | No | - | Tên nhà cung cấp |
| phone | text | Yes | - | Số điện thoại |
| email | text | Yes | - | Email |
| address | text | Yes | - | Địa chỉ |
| notes | text | Yes | - | Ghi chú |
| status | text | No | 'active' | Trạng thái |
| created_at | timestamptz | No | now() | Ngày tạo |
| updated_at | timestamptz | No | now() | Ngày cập nhật |

#### 2.2.3 `customers` - Khách hàng
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| code | text | Yes | - | Mã khách hàng |
| name | text | No | - | Tên khách hàng |
| phone | text | Yes | - | Số điện thoại |
| email | text | Yes | - | Email |
| address | text | Yes | - | Địa chỉ |
| notes | text | Yes | - | Ghi chú |
| status | text | No | 'active' | Trạng thái |
| created_at | timestamptz | No | now() | Ngày tạo |
| updated_at | timestamptz | No | now() | Ngày cập nhật |

#### 2.2.4 `purchase_orders` - Phiếu đặt hàng nhập
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| code | text | No | - | Mã phiếu (PNmmdd000) |
| supplier_id | uuid | Yes | - | FK → suppliers |
| status | text | No | 'draft' | draft/completed/cancelled |
| total_amount | numeric | No | 0 | Tổng tiền hàng |
| discount_type | text | Yes | 'amount' | percent/amount |
| discount_value | numeric | Yes | 0 | Giá trị giảm giá |
| vat_amount | numeric | Yes | 0 | Tiền VAT |
| other_fee | numeric | Yes | 0 | Phí khác |
| final_amount | numeric | No | 0 | Tổng thanh toán |
| note | text | Yes | - | Ghi chú |
| received_at | timestamptz | No | now() | Ngày nhận hàng |
| created_by | uuid | Yes | - | Người tạo |
| created_at | timestamptz | No | now() | Ngày tạo |
| updated_at | timestamptz | No | now() | Ngày cập nhật |

#### 2.2.5 `purchase_order_items` - Chi tiết phiếu nhập
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| purchase_order_id | uuid | No | - | FK → purchase_orders |
| product_id | uuid | No | - | FK → products |
| quantity | numeric | No | - | Số lượng |
| unit_price | numeric | No | - | Đơn giá |
| import_price | numeric | No | 0 | Giá nhập (sau chiết khấu) |
| discount | numeric | Yes | 0 | Chiết khấu (%) |
| total_amount | numeric | No | - | Thành tiền |
| created_at | timestamptz | No | now() | Ngày tạo |

#### 2.2.6 `sales_orders` - Đơn bán hàng
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| code | text | No | - | Mã đơn (HDyyMMdd000) |
| customer_id | uuid | Yes | - | FK → customers |
| status | text | No | 'draft' | draft/completed/cancelled |
| payment_status | text | No | 'unpaid' | unpaid/partial/paid |
| total_items | numeric | No | 0 | Tổng tiền hàng |
| discount_type | text | Yes | 'amount' | percent/amount |
| discount_value | numeric | Yes | 0 | Giá trị giảm giá |
| after_discount | numeric | No | 0 | Sau giảm giá |
| vat_rate | numeric | Yes | 0 | % VAT |
| vat_amount | numeric | Yes | 0 | Tiền VAT |
| other_fee | numeric | Yes | 0 | Phí khác |
| final_amount | numeric | No | 0 | Tổng thanh toán |
| paid_amount | numeric | No | 0 | Đã thanh toán |
| note | text | Yes | - | Ghi chú |
| sale_date | timestamptz | No | now() | Ngày bán |
| created_by | uuid | Yes | - | Người tạo |
| created_at | timestamptz | No | now() | Ngày tạo |
| updated_at | timestamptz | No | now() | Ngày cập nhật |

#### 2.2.7 `sales_order_items` - Chi tiết đơn bán
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| sales_order_id | uuid | No | - | FK → sales_orders |
| product_id | uuid | No | - | FK → products |
| quantity | numeric | No | - | Số lượng |
| unit_price | numeric | No | - | Đơn giá bán |
| cost_price | numeric | No | 0 | Giá vốn tại thời điểm bán |
| discount | numeric | Yes | 0 | Chiết khấu (%) |
| total_amount | numeric | No | - | Thành tiền |
| profit | numeric | No | 0 | Lợi nhuận |
| created_at | timestamptz | No | now() | Ngày tạo |

#### 2.2.8 `stock_cards` - Thẻ kho (Lịch sử biến động)
| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | Primary Key |
| product_id | uuid | No | - | FK → products |
| ref_code | text | No | - | Mã chứng từ (PN.../HD...) |
| ref_type | text | No | - | Loại chứng từ (PN/HD) |
| transaction_type | text | No | - | IN (nhập) / OUT (xuất) |
| quantity | numeric | No | - | Số lượng (+/-) |
| unit_cost | numeric | Yes | 0 | Đơn giá |
| stock_before | numeric | No | 0 | Tồn trước |
| stock_after | numeric | No | 0 | Tồn sau |
| note | text | Yes | - | Ghi chú |
| created_by | uuid | Yes | - | Người tạo |
| created_at | timestamptz | No | now() | Ngày tạo |

### 2.3 Database Functions

#### `generate_product_code()`
```sql
-- Sinh mã sản phẩm: SP000001, SP000002, ...
-- Tăng dần liên tục, không reset
```

#### `generate_supplier_code()`
```sql
-- Sinh mã NCC: NCC00001, NCC00002, ...
-- Tăng dần liên tục, không reset
```

#### `generate_purchase_order_code()`
```sql
-- Sinh mã phiếu nhập: PNmmdd000
-- VD: PN0208001 (ngày 02/08, số thứ tự 001)
-- Reset theo ngày
```

#### `generate_sales_order_code()`
```sql
-- Sinh mã đơn bán: HDyyMMdd000
-- VD: HD260208001 (năm 26, ngày 02/08, số thứ tự 001)
-- Reset theo ngày
```

---

## 3. Edge Functions (Backend Logic)

### 3.1 Cấu trúc thư mục

```
supabase/functions/
├── code-generator/
│   └── index.ts          # Sinh mã tự động
├── stock-service/
│   └── index.ts          # Quản lý tồn kho
├── price-calculator/
│   └── index.ts          # Tính toán giá
├── purchase-order/
│   └── index.ts          # Module nhập hàng
└── sales-order/
    └── index.ts          # Module bán hàng
```

### 3.2 Chi tiết từng Edge Function

#### 3.2.1 `code-generator` - Sinh mã tự động

**Endpoint**: `POST /functions/v1/code-generator`

**Request Body**:
```typescript
{
  type: 'product' | 'supplier' | 'purchase_order' | 'sales_order'
}
```

**Response**:
```typescript
{
  success: true,
  code: "SP000001" // hoặc NCC00001, PN0208001, HD260208001
}
```

**Logic**:
- Gọi database function tương ứng
- Đảm bảo mã không trùng lặp

---

#### 3.2.2 `stock-service` - Quản lý tồn kho

**Endpoint**: `POST /functions/v1/stock-service`

**Actions**:

##### `get_stock` - Lấy tồn kho sản phẩm
```typescript
// Request
{ action: 'get_stock', product_id: 'uuid' }

// Response
{
  success: true,
  data: { id, code, name, stock, cost_price }
}
```

##### `validate_availability` - Kiểm tra đủ hàng
```typescript
// Request
{ action: 'validate_availability', product_id: 'uuid', quantity: 10 }

// Response
{
  success: true,
  available: true,
  current_stock: 50,
  requested: 10
}
```

##### `move` - Cập nhật tồn kho
```typescript
// Request
{
  action: 'move',
  movements: [
    {
      product_id: 'uuid',
      quantity: 10,
      unit_cost: 100000,        // Chỉ cần cho nhập hàng
      ref_code: 'PN0208001',
      ref_type: 'PN',           // PN = Phiếu nhập, HD = Hóa đơn
      transaction_type: 'IN',   // IN = Nhập, OUT = Xuất
      note: 'Nhập hàng từ NCC',
      created_by: 'user-uuid'
    }
  ]
}

// Response
{
  success: true,
  data: [
    {
      product_id: 'uuid',
      product_code: 'SP000001',
      stock_before: 40,
      stock_after: 50,
      quantity_moved: 10,
      transaction_type: 'IN'
    }
  ]
}
```

**Logic xử lý**:
1. **Nhập hàng (IN)**:
   - Cộng số lượng vào tồn kho
   - Tính giá vốn trung bình có trọng số:
     ```
     new_cost = (stock_before * old_cost + quantity * new_cost) / stock_after
     ```
   - Ghi stock_card với quantity dương

2. **Xuất hàng (OUT)**:
   - Kiểm tra tồn kho >= số lượng yêu cầu
   - Nếu không đủ: throw Error (không cho phép tồn âm)
   - Trừ số lượng khỏi tồn kho
   - Ghi stock_card với quantity âm

---

#### 3.2.3 `price-calculator` - Tính toán giá

**Endpoint**: `POST /functions/v1/price-calculator`

**Actions**:

##### `calculate_item` - Tính tiền 1 dòng
```typescript
// Request
{
  action: 'calculate_item',
  quantity: 5,
  unit_price: 100000,
  discount_percent: 10
}

// Response
{
  success: true,
  data: {
    quantity: 5,
    unit_price: 100000,
    discount_percent: 10,
    discount_amount: 50000,
    total_before_discount: 500000,
    total_after_discount: 450000
  }
}
```

##### `calculate_order` - Tính tổng đơn hàng
```typescript
// Request
{
  action: 'calculate_order',
  items_total: 1000000,      // Tổng tiền hàng
  discount_type: 'percent',  // 'percent' | 'amount'
  discount_value: 5,         // 5% hoặc 50000đ
  vat_rate: 10,              // 10%
  other_fee: 20000           // Phí khác
}

// Response
{
  success: true,
  data: {
    items_total: 1000000,
    discount_type: 'percent',
    discount_value: 5,
    discount_amount: 50000,
    after_discount: 950000,
    vat_rate: 10,
    vat_amount: 95000,
    other_fee: 20000,
    final_amount: 1065000
  }
}
```

##### `calculate_profit` - Tính lợi nhuận
```typescript
// Request
{
  action: 'calculate_profit',
  items: [
    { quantity: 2, sale_price: 150000, cost_price: 100000, discount: 0 },
    { quantity: 1, sale_price: 200000, cost_price: 120000, discount: 5 }
  ]
}

// Response
{
  success: true,
  data: {
    items: [
      { total_revenue: 300000, total_cost: 200000, profit: 100000 },
      { total_revenue: 190000, total_cost: 120000, profit: 70000 }
    ],
    summary: {
      total_revenue: 490000,
      total_cost: 320000,
      total_profit: 170000,
      profit_margin: 34.69
    }
  }
}
```

---

#### 3.2.4 `purchase-order` - Module nhập hàng

**Endpoint**: `POST /functions/v1/purchase-order`

**Actions**:

##### `create` - Tạo phiếu nhập
```typescript
// Request
{
  action: 'create',
  data: {
    supplier_id: 'uuid',
    items: [
      { product_id: 'uuid', quantity: 10, unit_price: 100000, discount: 0 }
    ],
    discount_type: 'amount',
    discount_value: 0,
    vat_rate: 10,
    other_fee: 0,
    note: 'Ghi chú'
  }
}

// Response
{
  success: true,
  data: {
    id: 'uuid',
    code: 'PN0208001',
    status: 'draft',
    // ... full order data
  }
}
```

##### `complete` - Hoàn thành phiếu nhập
```typescript
// Request
{ action: 'complete', order_id: 'uuid' }

// Response
{
  success: true,
  data: {
    order: { ... },
    stock_updates: [
      { product_id, stock_before, stock_after, quantity_moved }
    ]
  }
}
```

**Logic `complete`**:
1. Validate: phiếu phải ở trạng thái `draft`
2. Lấy danh sách items
3. Gọi `stock-service.move()` với `transaction_type: 'IN'`
4. Cập nhật status → `completed`

##### `get` - Lấy chi tiết phiếu
```typescript
{ action: 'get', order_id: 'uuid' }
```

##### `list` - Danh sách phiếu
```typescript
{
  action: 'list',
  page: 1,
  limit: 50,
  status: 'completed',  // optional
  supplier_id: 'uuid'   // optional
}
```

---

#### 3.2.5 `sales-order` - Module bán hàng

**Endpoint**: `POST /functions/v1/sales-order`

**Actions**:

##### `create` - Tạo đơn bán hàng
```typescript
// Request
{
  action: 'create',
  data: {
    customer_id: 'uuid',       // optional
    items: [
      { product_id: 'uuid', quantity: 2, unit_price: 150000, discount: 0 }
    ],
    discount_type: 'amount',
    discount_value: 0,
    vat_rate: 10,
    other_fee: 0,
    paid_amount: 330000,
    note: 'Ghi chú'
  }
}
```

**Logic `create`**:
1. **Validate tồn kho**: Kiểm tra từng sản phẩm đủ hàng
2. **Sinh mã**: Gọi `generate_sales_order_code()`
3. **Tính toán backend**:
   - Lấy `cost_price` hiện tại của từng sản phẩm
   - Tính `total_amount` từng dòng
   - Tính `profit = (unit_price - cost_price) * quantity * (1 - discount/100)`
   - Tính tổng đơn: `total_items`, `after_discount`, `vat_amount`, `final_amount`
4. **Xác định payment_status**:
   - `paid_amount >= final_amount` → `paid`
   - `paid_amount > 0` → `partial`
   - `paid_amount = 0` → `unpaid`
5. **Insert order + items**
6. **Trừ kho**: Gọi `stock-service.move()` với `transaction_type: 'OUT'`
7. **Return**: Order + items đã tạo

##### `get` - Lấy chi tiết đơn
```typescript
{ action: 'get', order_id: 'uuid' }
```

##### `list` - Danh sách đơn
```typescript
{
  action: 'list',
  page: 1,
  limit: 50,
  status: 'completed',        // optional
  payment_status: 'paid',     // optional
  customer_id: 'uuid'         // optional
}
```

---

## 4. Quy tắc nghiệp vụ

### 4.1 Quy tắc sinh mã

| Loại | Format | Ví dụ | Reset |
|------|--------|-------|-------|
| Sản phẩm | SP + 6 số | SP000001 | Không |
| Nhà cung cấp | NCC + 5 số | NCC00001 | Không |
| Phiếu nhập | PN + mmdd + 3 số | PN0208001 | Theo ngày |
| Đơn bán | HD + yyMMdd + 3 số | HD260208001 | Theo ngày |

### 4.2 Quy tắc tồn kho

1. **Chỉ biến động qua chứng từ**: 
   - Phiếu nhập (PN) → tăng tồn
   - Hóa đơn (HD) → giảm tồn

2. **Không cho phép tồn âm**: 
   - Trước khi bán phải validate `stock >= quantity`
   - Nếu không đủ → reject transaction

3. **Ghi vết mọi biến động**: 
   - Mọi thay đổi tồn kho đều ghi vào `stock_cards`
   - Lưu `stock_before`, `stock_after` để audit

4. **Giá vốn trung bình có trọng số**:
   ```
   new_cost_price = (old_stock * old_cost + new_qty * new_cost) / new_stock
   ```

### 4.3 Quy tắc tài chính

1. **Backend chịu trách nhiệm tính toán**: 
   - Không tin tưởng số liệu từ frontend
   - Tính lại toàn bộ: item total, discount, VAT, final amount

2. **Không cho phép giá trị âm**:
   - quantity, unit_price, discount_value, paid_amount >= 0
   - Validate ở backend trước khi lưu

3. **Công thức tính đơn hàng**:
   ```
   items_total = Σ(quantity * unit_price * (1 - discount%/100))
   after_discount = items_total - order_discount
   vat_amount = after_discount * vat_rate / 100
   final_amount = after_discount + vat_amount + other_fee
   ```

4. **Tính lợi nhuận**:
   ```
   item_profit = (sale_price - cost_price) * quantity * (1 - discount%/100)
   ```

### 4.4 Quy tắc trạng thái

#### Purchase Order Status
| Status | Mô tả | Cho phép |
|--------|-------|----------|
| draft | Phiếu nháp | Sửa, Xóa, Hoàn thành |
| completed | Đã nhập kho | Chỉ xem |
| cancelled | Đã hủy | Chỉ xem |

#### Sales Order Status
| Status | Mô tả | Cho phép |
|--------|-------|----------|
| draft | Đơn nháp | Sửa, Xóa, Hoàn thành |
| completed | Đã hoàn thành | Chỉ xem |
| cancelled | Đã hủy | Chỉ xem |

#### Payment Status
| Status | Điều kiện |
|--------|-----------|
| unpaid | paid_amount = 0 |
| partial | 0 < paid_amount < final_amount |
| paid | paid_amount >= final_amount |

---

## 5. Luồng dữ liệu

### 5.1 Luồng nhập hàng

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
│  1. Chọn NCC, thêm sản phẩm, nhập số lượng/giá                   │
│  2. Click "Hoàn thành"                                           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    purchase-order Edge Function                   │
│  3. action: 'create' → Tạo phiếu draft                           │
│     - Sinh mã: generate_purchase_order_code()                    │
│     - Tính toán: price-calculator                                │
│     - Insert: purchase_orders + purchase_order_items             │
│                                                                   │
│  4. action: 'complete' → Hoàn thành phiếu                        │
│     - Validate status = 'draft'                                  │
│     - Gọi stock-service.move(transaction_type: 'IN')             │
│     - Update status = 'completed'                                │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    stock-service Edge Function                    │
│  5. Với mỗi sản phẩm:                                            │
│     - Lấy stock hiện tại                                         │
│     - stock_after = stock_before + quantity                      │
│     - Tính cost_price mới (weighted average)                     │
│     - Insert stock_card                                          │
│     - Update products.stock, products.cost_price                 │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Database                                  │
│  - purchase_orders.status = 'completed'                          │
│  - products.stock += quantity                                    │
│  - products.cost_price = new weighted average                    │
│  - stock_cards: new record with IN transaction                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Luồng bán hàng

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (POS)                            │
│  1. Tìm/chọn sản phẩm (F3 hoặc click)                            │
│  2. Chọn khách hàng (optional)                                   │
│  3. Nhập giảm giá, VAT, phí khác                                 │
│  4. Nhập số tiền thanh toán                                      │
│  5. Click "Thanh toán"                                           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    sales-order Edge Function                      │
│  6. action: 'create'                                             │
│     a. Validate tồn kho từng sản phẩm                            │
│        - Nếu không đủ → throw Error                              │
│     b. Sinh mã: generate_sales_order_code()                      │
│     c. Lấy cost_price hiện tại từng sản phẩm                     │
│     d. Tính toán:                                                │
│        - total_amount từng item                                  │
│        - profit từng item                                        │
│        - total_items, after_discount, vat_amount, final_amount   │
│     e. Xác định payment_status                                   │
│     f. Insert: sales_orders + sales_order_items                  │
│     g. Gọi stock-service.move(transaction_type: 'OUT')           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    stock-service Edge Function                    │
│  7. Với mỗi sản phẩm:                                            │
│     - Lấy stock hiện tại                                         │
│     - Validate: stock >= quantity (double-check)                 │
│     - stock_after = stock_before - quantity                      │
│     - Insert stock_card (quantity âm)                            │
│     - Update products.stock                                      │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Database                                  │
│  - sales_orders: new record with calculated amounts              │
│  - sales_order_items: items with cost_price & profit             │
│  - products.stock -= quantity                                    │
│  - stock_cards: new records with OUT transactions                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. API Reference

### 6.1 Endpoint Summary

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/functions/v1/code-generator` | POST | Sinh mã tự động |
| `/functions/v1/stock-service` | POST | Quản lý tồn kho |
| `/functions/v1/price-calculator` | POST | Tính toán giá |
| `/functions/v1/purchase-order` | POST | Module nhập hàng |
| `/functions/v1/sales-order` | POST | Module bán hàng |

### 6.2 Error Handling

Tất cả Edge Functions trả về format thống nhất:

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Errors**:
| Error | HTTP Status | Mô tả |
|-------|-------------|-------|
| `Invalid action` | 400 | Action không hợp lệ |
| `Missing required fields` | 400 | Thiếu trường bắt buộc |
| `Product not found` | 400 | Sản phẩm không tồn tại |
| `Insufficient stock` | 400 | Không đủ tồn kho |
| `Order not found` | 400 | Đơn hàng không tồn tại |
| `Cannot complete order` | 400 | Không thể hoàn thành (sai trạng thái) |

### 6.3 Authentication

Tất cả Edge Functions yêu cầu:
- Header: `Authorization: Bearer <anon_key>`
- Header: `apikey: <anon_key>`

```typescript
// Frontend call example
const response = await fetch(`${SUPABASE_URL}/functions/v1/sales-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    action: 'create',
    data: { ... }
  })
});
```

---

## Phụ lục

### A. Cấu trúc thư mục Frontend

```
src/
├── components/
│   ├── layout/           # AppLayout, Sidebar, Header
│   ├── pos/              # POS components
│   ├── products/         # Product management
│   ├── imports/          # Import order components
│   └── ui/               # shadcn/ui components
├── hooks/
│   ├── usePurchaseOrders.ts
│   ├── useSalesOrders.ts
│   └── useProducts.ts
├── pages/
│   ├── imports/
│   │   ├── ImportList.tsx
│   │   ├── ImportCreate.tsx
│   │   └── ImportDetail.tsx
│   ├── sales/
│   │   └── SalesOrderDetail.tsx
│   ├── CreateSale.tsx    # POS page
│   ├── Sales.tsx         # Sales list
│   └── Products.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts     # Auto-generated
│       └── types.ts      # Auto-generated
└── types/
    └── index.ts          # TypeScript interfaces
```

### B. Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
VITE_SUPABASE_PROJECT_ID=xxx
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-08*
