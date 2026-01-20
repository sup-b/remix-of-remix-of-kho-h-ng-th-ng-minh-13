-- Create Database
CREATE DATABASE IF NOT EXISTS quanlybanhang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quanlybanhang;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Groups Table
CREATE TABLE IF NOT EXISTS product_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  minPrice DECIMAL(15, 2) DEFAULT 0,
  maxPrice DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  configTemplate JSON,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('product', 'service') DEFAULT 'product',
  groupId VARCHAR(36),
  brandId VARCHAR(36),
  config JSON,
  costPrice DECIMAL(15, 2) DEFAULT 0,
  salePriceBeforeTax DECIMAL(15, 2) DEFAULT 0,
  salePrice DECIMAL(15, 2) DEFAULT 0,
  vatImport DECIMAL(5, 2) DEFAULT 0,
  vatSale DECIMAL(5, 2) DEFAULT 0,
  stockQty INT DEFAULT 0,
  minStock INT DEFAULT 0,
  maxStock INT DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'cái',
  status ENUM('in_stock', 'out_of_stock', 'discontinued') DEFAULT 'in_stock',
  imageUrl VARCHAR(500),
  images JSON,
  notes TEXT,
  description TEXT,
  warranty VARCHAR(255),
  directSale BOOLEAN DEFAULT FALSE,
  loyaltyPoints BOOLEAN DEFAULT FALSE,
  isDeleted BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (groupId) REFERENCES product_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (brandId) REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_sku (sku),
  INDEX idx_status (status),
  INDEX idx_isDeleted (isDeleted),
  INDEX idx_groupId (groupId),
  INDEX idx_brandId (brandId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imports Table
CREATE TABLE IF NOT EXISTS imports (
  id VARCHAR(36) PRIMARY KEY,
  supplierId VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  totalAmount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE RESTRICT,
  INDEX idx_date (date),
  INDEX idx_supplierId (supplierId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Import Items Table
CREATE TABLE IF NOT EXISTS import_items (
  id VARCHAR(36) PRIMARY KEY,
  importId VARCHAR(36) NOT NULL,
  productId VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  FOREIGN KEY (importId) REFERENCES imports(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_importId (importId),
  INDEX idx_productId (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  customerId VARCHAR(36),
  date DATE NOT NULL,
  subtotal DECIMAL(15, 2) DEFAULT 0,
  discountType ENUM('percent', 'amount') DEFAULT 'amount',
  discountValue DECIMAL(15, 2) DEFAULT 0,
  discountAmount DECIMAL(15, 2) DEFAULT 0,
  totalAmount DECIMAL(15, 2) DEFAULT 0,
  paymentMethod ENUM('cash', 'transfer') DEFAULT 'cash',
  amountPaid DECIMAL(15, 2) DEFAULT 0,
  change DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_date (date),
  INDEX idx_customerId (customerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(36) PRIMARY KEY,
  invoiceId VARCHAR(36) NOT NULL,
  productId VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_invoiceId (invoiceId),
  INDEX idx_productId (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

