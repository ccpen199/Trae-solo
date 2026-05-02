-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 门店表
CREATE TABLE IF NOT EXISTS store (
    id BIGSERIAL PRIMARY KEY,
    store_code VARCHAR(20) UNIQUE NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    store_id BIGINT REFERENCES store(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会员表
CREATE TABLE IF NOT EXISTS member (
    id BIGSERIAL PRIMARY KEY,
    member_code VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    gender VARCHAR(10),
    birthday DATE,
    points_balance INT DEFAULT 0,
    stored_balance DECIMAL(12,2) DEFAULT 0,
    level VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE IF NOT EXISTS product (
    id BIGSERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id BIGINT,
    standard_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES store(id),
    product_id BIGINT REFERENCES product(id),
    quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

-- 会员价格表
CREATE TABLE IF NOT EXISTS member_price (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES product(id),
    member_level VARCHAR(20),
    member_price DECIMAL(12,2) NOT NULL,
    UNIQUE(product_id, member_level)
);

-- 交易主表
CREATE TABLE IF NOT EXISTS transaction (
    id BIGSERIAL PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    store_id BIGINT REFERENCES store(id),
    cashier_id BIGINT REFERENCES users(id),
    member_id BIGINT REFERENCES member(id),
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    actual_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    points_used INT DEFAULT 0,
    points_discount DECIMAL(12,2) DEFAULT 0,
    coupon_id BIGINT,
    coupon_discount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    transaction_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交易明细表
CREATE TABLE IF NOT EXISTS transaction_item (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES transaction(id),
    product_id BIGINT REFERENCES product(id),
    product_name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2),
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 退款记录表
CREATE TABLE IF NOT EXISTS refund_record (
    id BIGSERIAL PRIMARY KEY,
    original_transaction_id BIGINT REFERENCES transaction(id),
    refund_no VARCHAR(50) UNIQUE NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason VARCHAR(255),
    refund_method VARCHAR(20) NOT NULL,
    operator_id BIGINT REFERENCES users(id),
    refund_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupon (
    id BIGSERIAL PRIMARY KEY,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    coupon_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    min_consumption DECIMAL(12,2) DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    total_quantity INT NOT NULL,
    remain_quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会员优惠券表
CREATE TABLE IF NOT EXISTS member_coupon (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES member(id),
    coupon_id BIGINT REFERENCES coupon(id),
    status VARCHAR(20) DEFAULT 'UNUSED',
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    used_transaction_id BIGINT
);

-- 促销规则表
CREATE TABLE IF NOT EXISTS promotion_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL,
    condition_config JSONB NOT NULL,
    action_config JSONB NOT NULL,
    priority INT DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日结报表表
CREATE TABLE IF NOT EXISTS daily_settlement (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES store(id),
    settlement_date DATE NOT NULL,
    total_sales DECIMAL(12,2) NOT NULL,
    total_refund DECIMAL(12,2) DEFAULT 0,
    total_discount DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    wechat_sales DECIMAL(12,2) DEFAULT 0,
    alipay_sales DECIMAL(12,2) DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    coupons_used INT DEFAULT 0,
    transaction_count INT DEFAULT 0,
    refund_count INT DEFAULT 0,
    operator_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    detail JSONB,
    ip_address VARCHAR(50),
    operation_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化数据
-- 门店数据
INSERT INTO store (store_code, store_name, address, contact_phone) VALUES
('ST001', '测试门店', '北京市朝阳区测试路123号', '13800138000')
ON CONFLICT (store_code) DO NOTHING;

-- 用户数据
INSERT INTO users (username, password_hash, real_name, role, store_id) VALUES
('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '管理员', 'MANAGER', 1),
('clerk', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '收银员', 'CLERK', 1),
('finance', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '财务', 'FINANCE', 1)
ON CONFLICT (username) DO NOTHING;

-- 会员数据
INSERT INTO member (member_code, phone, name, level, points_balance, stored_balance) VALUES
('M001', '13800138001', '张三', 'NORMAL', 1000, 500.00),
('M002', '13800138002', '李四', 'SILVER', 2000, 1000.00),
('M003', '13800138003', '王五', 'GOLD', 5000, 2000.00)
ON CONFLICT (phone) DO NOTHING;

-- 商品数据
INSERT INTO product (barcode, product_name, standard_price, unit) VALUES
('6901234567891', '可口可乐', 3.50, '瓶'),
('6901234567892', '康师傅冰红茶', 3.00, '瓶'),
('6901234567893', '脉动', 4.00, '瓶'),
('6901234567894', '农夫山泉', 2.00, '瓶'),
('6901234567895', '百事可乐', 3.50, '瓶'),
('6901234567896', '营养快线', 4.50, '瓶')
ON CONFLICT (barcode) DO NOTHING;

-- 库存数据
INSERT INTO inventory (store_id, product_id, quantity) VALUES
(1, 1, 100),
(1, 2, 80),
(1, 3, 50),
(1, 4, 200),
(1, 5, 90),
(1, 6, 60)
ON CONFLICT (store_id, product_id) DO NOTHING;

-- 会员价格数据
INSERT INTO member_price (product_id, member_level, member_price) VALUES
(1, 'SILVER', 3.20),
(1, 'GOLD', 3.00),
(2, 'SILVER', 2.80),
(2, 'GOLD', 2.60),
(3, 'SILVER', 3.80),
(3, 'GOLD', 3.50)
ON CONFLICT (product_id, member_level) DO NOTHING;

-- 促销规则数据
INSERT INTO promotion_rule (rule_code, rule_name, rule_type, condition_config, action_config, valid_from, valid_until) VALUES
('RULE001', '满100减10', 'FULL_CUT', '{"minAmount": 100}', '{"discountAmount": 10}', NOW(), NOW() + INTERVAL '30 days'),
('RULE002', '全场9折', 'DISCOUNT', '{}', '{"discountRate": 0.9}', NOW(), NOW() + INTERVAL '30 days'),
('RULE003', '饮料限时8折', 'FLASH', '{"productIds": [1, 2, 3, 4, 5, 6]}', '{"discountRate": 0.8}', NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT (rule_code) DO NOTHING;

-- 优惠券数据
INSERT INTO coupon (coupon_code, coupon_name, coupon_type, discount_value, min_consumption, valid_from, valid_until, total_quantity, remain_quantity) VALUES
('COUPON001', '新人专享券', 'CASH', 20.00, 100.00, NOW(), NOW() + INTERVAL '30 days', 100, 100),
('COUPON002', '满减券', 'CASH', 50.00, 200.00, NOW(), NOW() + INTERVAL '30 days', 50, 50),
('COUPON003', '无门槛券', 'CASH', 10.00, 0.00, NOW(), NOW() + INTERVAL '30 days', 200, 200)
ON CONFLICT (coupon_code) DO NOTHING;

-- 会员优惠券数据
INSERT INTO member_coupon (member_id, coupon_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 1),
(3, 2),
(3, 3)
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transaction_store_id ON transaction(store_id);
CREATE INDEX IF NOT EXISTS idx_transaction_transaction_time ON transaction(transaction_time);
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_member_phone ON member(phone);
CREATE INDEX IF NOT EXISTS idx_product_barcode ON product(barcode);

-- 创建函数和触发器
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_store_modtime
BEFORE UPDATE ON store
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_member_modtime
BEFORE UPDATE ON member
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_product_modtime
BEFORE UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_inventory_modtime
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_transaction_modtime
BEFORE UPDATE ON transaction
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 权限设置
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO posuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO posuser;