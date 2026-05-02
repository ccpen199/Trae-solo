CREATE TABLE IF NOT EXISTS store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(20) UNIQUE NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    store_id BIGINT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT,
    product_id BIGINT,
    quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

CREATE TABLE IF NOT EXISTS member_price (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT,
    member_level VARCHAR(20),
    member_price DECIMAL(12,2) NOT NULL,
    UNIQUE(product_id, member_level)
);

CREATE TABLE IF NOT EXISTS transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    store_id BIGINT,
    cashier_id BIGINT,
    member_id BIGINT,
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

CREATE TABLE IF NOT EXISTS transaction_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT,
    product_id BIGINT,
    product_name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2),
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refund_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_transaction_id BIGINT,
    refund_no VARCHAR(50) UNIQUE NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason VARCHAR(255),
    refund_method VARCHAR(20) NOT NULL,
    operator_id BIGINT,
    refund_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS member_coupon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT,
    coupon_id BIGINT,
    status VARCHAR(20) DEFAULT 'UNUSED',
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    used_transaction_id BIGINT
);

CREATE TABLE IF NOT EXISTS promotion_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL,
    condition_config VARCHAR(1000) NOT NULL,
    action_config VARCHAR(1000) NOT NULL,
    priority INT DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_settlement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT,
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
    operator_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    detail VARCHAR(2000),
    ip_address VARCHAR(50),
    operation_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
