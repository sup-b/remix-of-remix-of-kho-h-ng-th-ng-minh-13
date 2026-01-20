# Quan Ly Ban Hang - Backend Server

Backend server cho hệ thống quản lý bán hàng sử dụng Node.js, Express và MySQL.

## Yêu cầu

- Node.js (v18 trở lên)
- MySQL (v8.0 trở lên)

## Cài đặt

1. Cài đặt dependencies:
```bash
cd server
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình thông tin database trong file `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=quanlybanhang
```

4. Chạy script setup database (sẽ tự động tạo database, tables và tài khoản admin):
```bash
npm run setup-db
```

Tài khoản admin mặc định:
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`

Bạn có thể thay đổi thông tin này trong file `.env`.

## Chạy Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (admin only)
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy thông tin sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm (soft delete)

### Product Groups
- `GET /api/product-groups` - Lấy danh sách nhóm sản phẩm
- `GET /api/product-groups/:id` - Lấy thông tin nhóm
- `POST /api/product-groups` - Tạo nhóm mới
- `PUT /api/product-groups/:id` - Cập nhật nhóm
- `DELETE /api/product-groups/:id` - Xóa nhóm

### Brands
- `GET /api/brands` - Lấy danh sách thương hiệu
- `GET /api/brands/:id` - Lấy thông tin thương hiệu
- `POST /api/brands` - Tạo thương hiệu mới
- `PUT /api/brands/:id` - Cập nhật thương hiệu
- `DELETE /api/brands/:id` - Xóa thương hiệu

### Customers
- `GET /api/customers` - Lấy danh sách khách hàng
- `GET /api/customers/:id` - Lấy thông tin khách hàng
- `POST /api/customers` - Tạo khách hàng mới
- `PUT /api/customers/:id` - Cập nhật khách hàng
- `DELETE /api/customers/:id` - Xóa khách hàng

### Suppliers
- `GET /api/suppliers` - Lấy danh sách nhà cung cấp
- `GET /api/suppliers/:id` - Lấy thông tin nhà cung cấp
- `POST /api/suppliers` - Tạo nhà cung cấp mới
- `PUT /api/suppliers/:id` - Cập nhật nhà cung cấp
- `DELETE /api/suppliers/:id` - Xóa nhà cung cấp

### Imports
- `GET /api/imports` - Lấy danh sách phiếu nhập
- `GET /api/imports/:id` - Lấy thông tin phiếu nhập
- `POST /api/imports` - Tạo phiếu nhập mới

### Invoices
- `GET /api/invoices` - Lấy danh sách hóa đơn
- `GET /api/invoices/:id` - Lấy thông tin hóa đơn
- `POST /api/invoices` - Tạo hóa đơn mới

### Dashboard
- `GET /api/dashboard/stats` - Lấy thống kê dashboard

## Database Schema

Database sẽ tự động được tạo khi chạy `npm run setup-db`. Schema bao gồm các bảng:
- `users` - Người dùng
- `product_groups` - Nhóm sản phẩm
- `brands` - Thương hiệu
- `products` - Sản phẩm
- `customers` - Khách hàng
- `suppliers` - Nhà cung cấp
- `imports` - Phiếu nhập
- `import_items` - Chi tiết phiếu nhập
- `invoices` - Hóa đơn
- `invoice_items` - Chi tiết hóa đơn

