-- ============================================
-- 餐饮点餐收银系统 - 数据库初始化脚本
-- Database: restaurant_pos
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS restaurant_pos 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE restaurant_pos;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'manager', 'cashier', 'waiter', 'chef', 'customer') NOT NULL DEFAULT 'waiter',
    phone VARCHAR(20) NULL,
    avatar TEXT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    preferences JSON NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建桌台表
CREATE TABLE IF NOT EXISTS tables (
    id CHAR(36) NOT NULL PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 4,
    status ENUM('vacant', 'occupied', 'cleaning', 'reserved') NOT NULL DEFAULT 'vacant',
    zone ENUM('main', 'vip', 'outdoor', 'private') NOT NULL DEFAULT 'main',
    qr_code_url VARCHAR(100) NULL,
    position JSON NULL,
    remarks TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    current_order_id CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_table_number (table_number),
    INDEX idx_status (status),
    INDEX idx_zone (zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建菜单分类表
CREATE TABLE IF NOT EXISTS menu_categories (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT NULL,
    icon_url TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建菜单项表
CREATE TABLE IF NOT EXISTS menu_items (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NULL,
    image_url TEXT NULL,
    status ENUM('available', 'sold_out', 'discontinued') NOT NULL DEFAULT 'available',
    spice_level ENUM('none', 'mild', 'medium', 'spicy') NULL,
    attributes JSON NULL,
    specifications JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    sales_count INT NOT NULL DEFAULT 0,
    preparation_time INT NOT NULL DEFAULT 0,
    category_id CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    order_type ENUM('dine_in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine_in',
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    source ENUM('scan', 'waiter', 'online', 'pos') NOT NULL DEFAULT 'scan',
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payable_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    guest_count INT NOT NULL DEFAULT 0,
    customer_remarks TEXT NULL,
    internal_remarks TEXT NULL,
    table_id CHAR(36) NULL,
    created_by CHAR(36) NULL,
    assigned_to CHAR(36) NULL,
    member_id CHAR(36) NULL,
    customer_info JSON NULL,
    confirmed_at DATETIME NULL,
    preparing_at DATETIME NULL,
    ready_at DATETIME NULL,
    served_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_table_id (table_id),
    INDEX idx_created_at (created_at),
    INDEX idx_member_id (member_id),
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单项表
CREATE TABLE IF NOT EXISTS order_items (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    menu_item_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    specifications TEXT NULL,
    customer_remarks TEXT NULL,
    status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    sort_order INT NOT NULL DEFAULT 0,
    print_id CHAR(36) NULL,
    printed_at DATETIME NULL,
    preparing_at DATETIME NULL,
    ready_at DATETIME NULL,
    served_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_menu_item_id (menu_item_id),
    INDEX idx_status (status),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单日志表
CREATE TABLE IF NOT EXISTS order_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    action ENUM('created', 'status_changed', 'item_added', 'item_removed', 'item_status_changed', 'payment_received', 'remarks_updated', 'discount_applied', 'printed') NOT NULL,
    description TEXT NOT NULL,
    details JSON NULL,
    operator_id CHAR(36) NULL,
    operator_name VARCHAR(50) NULL,
    operator_role VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建支付记录表
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    order_id CHAR(36) NOT NULL,
    method ENUM('cash', 'wechat', 'alipay', 'card', 'member', 'combined') NOT NULL,
    status ENUM('pending', 'paid', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    amount DECIMAL(12,2) NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    transaction_id VARCHAR(100) NULL,
    third_party_transaction_id VARCHAR(100) NULL,
    payment_details JSON NULL,
    remarks TEXT NULL,
    operator_id CHAR(36) NULL,
    paid_at DATETIME NULL,
    refunded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_number (payment_number),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_method (method),
    INDEX idx_paid_at (paid_at),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建会员表
CREATE TABLE IF NOT EXISTS members (
    id CHAR(36) NOT NULL PRIMARY KEY,
    member_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    avatar TEXT NULL,
    level ENUM('regular', 'silver', 'gold', 'platinum', 'diamond') NOT NULL DEFAULT 'regular',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    order_count INT NOT NULL DEFAULT 0,
    birthday DATE NULL,
    address TEXT NULL,
    preferences JSON NULL,
    remarks TEXT NULL,
    last_visit_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_number (member_number),
    INDEX idx_phone (phone),
    INDEX idx_level (level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建评价表
CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    member_id CHAR(36) NULL,
    overall_rating INT NOT NULL DEFAULT 5,
    food_rating INT NULL,
    service_rating INT NULL,
    environment_rating INT NULL,
    content TEXT NULL,
    images JSON NULL,
    reply TEXT NULL,
    replied_by CHAR(36) NULL,
    replied_at DATETIME NULL,
    is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_member_id (member_id),
    INDEX idx_overall_rating (overall_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 初始化默认数据
-- ============================================

-- 插入默认菜单分类
INSERT INTO menu_categories (id, name, sort_order, is_active) VALUES
(UUID(), '热菜', 1, 1),
(UUID(), '凉菜', 2, 1),
(UUID(), '主食', 3, 1),
(UUID(), '饮品', 4, 1),
(UUID(), '甜点', 5, 1);

-- 插入默认桌台数据
INSERT INTO tables (id, table_number, capacity, status, zone, sort_order, is_active) VALUES
(UUID(), 'A01', 4, 'vacant', 'main', 1, 1),
(UUID(), 'A02', 4, 'vacant', 'main', 2, 1),
(UUID(), 'A03', 4, 'vacant', 'main', 3, 1),
(UUID(), 'A04', 2, 'vacant', 'main', 4, 1),
(UUID(), 'A05', 6, 'vacant', 'main', 5, 1),
(UUID(), 'B01', 8, 'vacant', 'vip', 1, 1),
(UUID(), 'B02', 10, 'vacant', 'vip', 2, 1),
(UUID(), 'C01', 4, 'vacant', 'outdoor', 1, 1),
(UUID(), 'C02', 4, 'vacant', 'outdoor', 2, 1);

-- 提示信息
SELECT '数据库初始化完成' AS message;
SELECT '请记得修改默认用户密码' AS warning;
