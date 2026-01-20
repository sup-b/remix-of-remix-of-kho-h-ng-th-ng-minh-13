# Hướng dẫn Setup Database MySQL

## Yêu cầu

1. **MySQL Server** đã được cài đặt và đang chạy
2. **Node.js** (v18 trở lên)

## Các bước setup

### 1. Cài đặt Backend Server

```bash
cd server
npm install
```

### 2. Cấu hình Database

Tạo file `.env` trong thư mục `server/`:

```bash
cd server
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin MySQL của bạn:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=quanlybanhang

PORT=3001
NODE_ENV=development

JWT_SECRET=your-secret-key-change-this-in-production

# Tài khoản admin mặc định (có thể thay đổi)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com
```

### 3. Chạy Setup Database

Script này sẽ tự động:
- Tạo database `quanlybanhang`
- Tạo tất cả các bảng cần thiết
- Tạo tài khoản admin mặc định

```bash
cd server
npm run setup-db
```

**Lưu ý:** Đảm bảo MySQL server đang chạy trước khi chạy lệnh này.

### 4. Khởi động Backend Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

### 5. Khởi động Frontend

Mở terminal mới:

```bash
npm install  # Nếu chưa cài
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

## Tài khoản Admin mặc định

Sau khi chạy `npm run setup-db`, bạn có thể đăng nhập với:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Lưu ý:** Hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

## Cấu trúc Database

Database sẽ tự động tạo các bảng sau:

- `users` - Quản lý người dùng
- `product_groups` - Nhóm sản phẩm
- `brands` - Thương hiệu
- `products` - Sản phẩm
- `customers` - Khách hàng
- `suppliers` - Nhà cung cấp
- `imports` - Phiếu nhập hàng
- `import_items` - Chi tiết phiếu nhập
- `invoices` - Hóa đơn bán hàng
- `invoice_items` - Chi tiết hóa đơn

## Troubleshooting

### Lỗi kết nối database

1. Kiểm tra MySQL server đang chạy:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Kiểm tra thông tin đăng nhập trong file `.env`

3. Thử kết nối MySQL bằng command line:
   ```bash
   mysql -u root -p
   ```

### Lỗi "Database already exists"

Nếu database đã tồn tại, script sẽ bỏ qua việc tạo database nhưng vẫn tạo các bảng và tài khoản admin (nếu chưa có).

### Reset Database

Nếu muốn xóa và tạo lại database:

```sql
DROP DATABASE quanlybanhang;
```

Sau đó chạy lại:
```bash
npm run setup-db
```

## API Endpoints

Backend server cung cấp các API endpoints tại `http://localhost:3001/api`:

- `/api/auth/*` - Authentication
- `/api/products/*` - Quản lý sản phẩm
- `/api/product-groups/*` - Quản lý nhóm sản phẩm
- `/api/brands/*` - Quản lý thương hiệu
- `/api/customers/*` - Quản lý khách hàng
- `/api/suppliers/*` - Quản lý nhà cung cấp
- `/api/imports/*` - Quản lý phiếu nhập
- `/api/invoices/*` - Quản lý hóa đơn
- `/api/dashboard/*` - Thống kê dashboard

Xem chi tiết trong `server/README.md`

