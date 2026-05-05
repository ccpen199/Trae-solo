-- 库存管理系统数据库初始化脚本

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- admin: 系统管理员, user: 普通仓库管理员
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active: 启用, inactive: 禁用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(50),
    phone VARCHAR(20),
    address VARCHAR(255),
    email VARCHAR(100),
    remark TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 商品类型表
CREATE TABLE IF NOT EXISTS product_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 商品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    type_id INTEGER NOT NULL REFERENCES product_types(id),
    unit VARCHAR(20), -- 单位，如：件、个、箱、kg等
    specification VARCHAR(100), -- 规格
    purchase_price DECIMAL(10,2) DEFAULT 0, -- 采购价
    sale_price DECIMAL(10,2) DEFAULT 0, -- 销售价
    min_stock INTEGER DEFAULT 0, -- 最低库存预警
    max_stock INTEGER DEFAULT 10000, -- 最高库存预警
    remark TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 入库表
CREATE TABLE IF NOT EXISTS stock_in (
    id SERIAL PRIMARY KEY,
    in_no VARCHAR(50) UNIQUE NOT NULL, -- 入库单号
    supplier_id INTEGER REFERENCES suppliers(id),
    warehouse_keeper_id INTEGER NOT NULL REFERENCES users(id),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft: 草稿, completed: 已完成, cancelled: 已取消
    remark TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 入库明细表
CREATE TABLE IF NOT EXISTS stock_in_items (
    id SERIAL PRIMARY KEY,
    stock_in_id INTEGER NOT NULL REFERENCES stock_in(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 出库表
CREATE TABLE IF NOT EXISTS stock_out (
    id SERIAL PRIMARY KEY,
    out_no VARCHAR(50) UNIQUE NOT NULL, -- 出库单号
    receiver VARCHAR(100), -- 收货人
    phone VARCHAR(20), -- 联系电话
    address VARCHAR(255), -- 收货地址
    warehouse_keeper_id INTEGER NOT NULL REFERENCES users(id),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft: 草稿, completed: 已完成, cancelled: 已取消
    remark TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 出库明细表
CREATE TABLE IF NOT EXISTS stock_out_items (
    id SERIAL PRIMARY KEY,
    stock_out_id INTEGER NOT NULL REFERENCES stock_out(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0, -- 当前库存数量
    total_in INTEGER NOT NULL DEFAULT 0, -- 累计入库数量
    total_out INTEGER NOT NULL DEFAULT 0, -- 累计出库数量
    last_in_time TIMESTAMP, -- 最后入库时间
    last_out_time TIMESTAMP, -- 最后出库时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- 操作类型：如 login, logout, create_user, delete_supplier, stock_in, stock_out 等
    module VARCHAR(50) NOT NULL, -- 操作模块：如 system, user, supplier, product, stock, inventory, log 等
    target_id INTEGER, -- 操作对象ID
    target_name VARCHAR(255), -- 操作对象名称
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_data TEXT, -- 请求数据JSON
    response_data TEXT, -- 响应数据JSON
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, failed
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_no ON stock_in(in_no);
CREATE INDEX IF NOT EXISTS idx_stock_in_status ON stock_in(status);
CREATE INDEX IF NOT EXISTS idx_stock_out_no ON stock_out(out_no);
CREATE INDEX IF NOT EXISTS idx_stock_out_status ON stock_out(status);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_time ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_module ON operation_logs(module);

-- 插入默认系统管理员账号 (密码: admin123，实际应用中需要修改)
INSERT INTO users (username, password, real_name, email, phone, role, status)
VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '系统管理员', 'admin@example.com', '13800138000', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- 插入默认商品类型
INSERT INTO product_types (type_name, description, created_by)
VALUES 
('电子产品', '各类电子产品', 1),
('办公用品', '日常办公用品', 1),
('生活用品', '日常生活用品', 1)
ON CONFLICT DO NOTHING;

-- 插入默认供应商
INSERT INTO suppliers (supplier_name, contact_person, phone, address, email, created_by)
VALUES 
('科技有限公司', '张三', '13800138001', '北京市朝阳区科技路100号', 'tech@example.com', 1),
('办公设备公司', '李四', '13800138002', '上海市浦东新区办公街50号', 'office@example.com', 1)
ON CONFLICT DO NOTHING;