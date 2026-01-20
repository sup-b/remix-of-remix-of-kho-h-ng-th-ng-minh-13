# Hệ Thống Quản Lý Bán Hàng

Hệ thống quản lý bán hàng được xây dựng với React, TypeScript và MySQL.

## Công nghệ sử dụng

- **Frontend:** React + TypeScript + Vite
- **UI Framework:** shadcn-ui + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL

## Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

1. **Node.js** (v18 trở lên) - [Download Node.js](https://nodejs.org/)
2. **MySQL Server** (v8.0 trở lên) - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
3. **npm** hoặc **yarn** (đi kèm với Node.js)

## Hướng dẫn Setup Database MySQL Local - Step by Step

### Bước 1: Cài đặt và khởi động MySQL Server

#### Windows:
1. Tải và cài đặt MySQL từ [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Trong quá trình cài đặt, ghi nhớ mật khẩu root mà bạn đặt
3. Khởi động MySQL Service:
   ```powershell
   # Mở PowerShell với quyền Administrator
   net start MySQL80
   ```
   Hoặc sử dụng Services (services.msc) và tìm "MySQL80" để Start

#### macOS:
```bash
# Sử dụng Homebrew
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Bước 2: Kiểm tra MySQL đã chạy

Mở terminal/command prompt và chạy:

```bash
mysql -u root -p
```

Nhập mật khẩu root của bạn. Nếu kết nối thành công, bạn sẽ thấy prompt `mysql>`. Gõ `exit;` để thoát.

### Bước 3: Clone và cài đặt project

```bash
# Clone repository (nếu chưa có)
git clone <YOUR_GIT_URL>
cd quanlybanhang

# Cài đặt dependencies cho frontend
npm install
```

### Bước 4: Setup Backend Server

```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt dependencies cho backend
npm install
```

### Bước 5: Cấu hình Database

1. Tạo file `.env` trong thư mục `server/`:

```bash
cd server
copy .env.example .env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

2. Mở file `server/.env` và chỉnh sửa thông tin kết nối MySQL:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=quanlybanhang

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (thay đổi trong production)
JWT_SECRET=your-secret-key-change-this-in-production

# Admin Account (sẽ được tạo tự động)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com
```

**Lưu ý quan trọng:**
- Thay `your_mysql_password_here` bằng mật khẩu MySQL root của bạn
- Nếu MySQL root không có mật khẩu, để trống: `DB_PASSWORD=`

### Bước 6: Chạy Setup Database

Script này sẽ tự động:
- ✅ Tạo database `quanlybanhang`
- ✅ Tạo tất cả các bảng cần thiết
- ✅ Tạo tài khoản admin mặc định

```bash
# Đảm bảo đang ở trong thư mục server/
cd server
npm run setup-db
```

**Kết quả mong đợi:**
```
🚀 Starting database setup...

✅ Connected to MySQL server
📄 Executing schema...
✅ Database and tables created successfully!

✅ Admin user created successfully!
   Username: admin
   Password: admin123
   Email: admin@example.com

🎉 Database setup completed successfully!
```

### Bước 7: Khởi động Backend Server

Mở terminal mới và chạy:

```bash
cd server
npm run dev
```

Backend server sẽ chạy tại: **http://localhost:3001**

Bạn sẽ thấy thông báo:
```
✅ Database connected successfully!
🚀 Server is running on http://localhost:3001
📡 API endpoints available at http://localhost:3001/api
```

### Bước 8: Khởi động Frontend

Mở terminal mới (giữ backend server đang chạy) và chạy:

```bash
# Quay về thư mục gốc của project
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173** (hoặc port khác nếu 5173 đã được sử dụng)

## Đăng nhập hệ thống

Sau khi setup xong, bạn có thể đăng nhập với tài khoản admin:

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Lưu ý bảo mật:** Hãy đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên!

## Cấu trúc Database

Database `quanlybanhang` bao gồm các bảng:

- `users` - Quản lý người dùng (admin/staff)
- `product_groups` - Nhóm sản phẩm
- `brands` - Thương hiệu
- `products` - Sản phẩm
- `customers` - Khách hàng
- `suppliers` - Nhà cung cấp
- `imports` - Phiếu nhập hàng
- `import_items` - Chi tiết phiếu nhập
- `invoices` - Hóa đơn bán hàng
- `invoice_items` - Chi tiết hóa đơn

## API Endpoints

Backend API chạy tại `http://localhost:3001/api`:

- `POST /api/auth/login` - Đăng nhập
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/customers` - Danh sách khách hàng
- `GET /api/suppliers` - Danh sách nhà cung cấp
- `GET /api/imports` - Danh sách phiếu nhập
- `GET /api/invoices` - Danh sách hóa đơn
- `GET /api/dashboard/stats` - Thống kê dashboard

Xem chi tiết đầy đủ trong `server/README.md`

## Troubleshooting

### Lỗi: "ECONNREFUSED" hoặc "Cannot connect to MySQL"

**Giải pháp:**
1. Kiểm tra MySQL service đang chạy:
   ```bash
   # Windows
   net start MySQL80
   
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. Kiểm tra thông tin trong file `server/.env`:
   - `DB_HOST=localhost`
   - `DB_PORT=3306` (hoặc port MySQL của bạn)
   - `DB_USER=root`
   - `DB_PASSWORD=` (đúng mật khẩu MySQL)

3. Test kết nối MySQL thủ công:
   ```bash
   mysql -u root -p
   ```

### Lỗi: "Access denied for user"

**Giải pháp:**
- Kiểm tra username và password trong file `.env`
- Đảm bảo user MySQL có quyền tạo database

### Lỗi: "Database already exists"

**Giải pháp:**
- Không sao, script sẽ bỏ qua và tiếp tục tạo các bảng
- Nếu muốn reset hoàn toàn:
  ```sql
  DROP DATABASE quanlybanhang;
  ```
  Sau đó chạy lại `npm run setup-db`

### Lỗi: "Port 3001 already in use"

**Giải pháp:**
- Đổi PORT trong file `server/.env` sang port khác (ví dụ: 3002)
- Hoặc tắt process đang sử dụng port 3001

## Scripts có sẵn

### Frontend:
```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview build
```

### Backend (trong thư mục server/):
```bash
npm run dev        # Chạy server với auto-reload
npm start          # Chạy server production
npm run setup-db   # Setup database và tạo admin
```

## Tài liệu tham khảo

- Chi tiết về Backend: xem `server/README.md`
- Hướng dẫn setup chi tiết: xem `SETUP.md`

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. MySQL server đang chạy
2. Thông tin trong file `server/.env` đúng
3. Port 3001 và 5173 không bị chiếm dụng
4. Node.js version >= 18
