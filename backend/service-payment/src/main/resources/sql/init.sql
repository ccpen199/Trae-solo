-- =================================================================================
-- 贵州省数字服务平台 - 便民缴费服务 数据库初始化脚本
-- Database: payment_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `payment_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `payment_db`;

-- =================================================================================
-- 1. 缴费订单表
-- =================================================================================
DROP TABLE IF EXISTS `payment_order`;
CREATE TABLE `payment_order` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `order_no` VARCHAR(64) NOT NULL COMMENT '订单编号',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `user_name` VARCHAR(128) DEFAULT NULL COMMENT '用户姓名',
    `bill_type` TINYINT NOT NULL COMMENT '账单类型 1水费 2电费 3燃气费 4暖气费 5物业费',
    `bill_type_name` VARCHAR(32) DEFAULT NULL COMMENT '账单类型名称',
    `account_no` VARCHAR(64) NOT NULL COMMENT '户号',
    `account_name` VARCHAR(128) DEFAULT NULL COMMENT '户名',
    `account_addr` VARCHAR(255) DEFAULT NULL COMMENT '户址',
    `pay_amount` DECIMAL(18,2) NOT NULL COMMENT '缴费金额',
    `penalty_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '违约金',
    `total_amount` DECIMAL(18,2) NOT NULL COMMENT '总金额',
    `payment_channel` TINYINT DEFAULT NULL COMMENT '缴费渠道 1微信 2支付宝 3银联 4云闪付',
    `channel_order_no` VARCHAR(128) DEFAULT NULL COMMENT '渠道订单号',
    `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态 0待支付 1支付中 2支付成功 3支付失败 4退款中 5退款成功 6退款失败 7已关闭 8已过期',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `expire_time` DATETIME DEFAULT NULL COMMENT '过期时间',
    `bill_period` VARCHAR(32) DEFAULT NULL COMMENT '账单周期',
    `bill_no` VARCHAR(64) DEFAULT NULL COMMENT '账单编号',
    `company_code` VARCHAR(64) DEFAULT NULL COMMENT '公用事业公司编码',
    `company_name` VARCHAR(128) DEFAULT NULL COMMENT '公用事业公司名称',
    `callback_data` TEXT COMMENT '回调数据',
    `notify_count` INT NOT NULL DEFAULT 0 COMMENT '通知次数',
    `last_notify_time` DATETIME DEFAULT NULL COMMENT '最后通知时间',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_bill_type` (`bill_type`),
    KEY `idx_account_no` (`account_no`),
    KEY `idx_payment_status` (`payment_status`),
    KEY `idx_pay_time` (`pay_time`),
    KEY `idx_expire_time` (`expire_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缴费订单表';

-- =================================================================================
-- 2. 账单信息表
-- =================================================================================
DROP TABLE IF EXISTS `bill_info`;
CREATE TABLE `bill_info` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `bill_no` VARCHAR(64) NOT NULL COMMENT '账单编号',
    `bill_type` TINYINT NOT NULL COMMENT '账单类型 1水费 2电费 3燃气费 4暖气费 5物业费',
    `bill_type_name` VARCHAR(32) DEFAULT NULL COMMENT '账单类型名称',
    `account_no` VARCHAR(64) NOT NULL COMMENT '户号',
    `account_name` VARCHAR(128) DEFAULT NULL COMMENT '户名',
    `account_addr` VARCHAR(255) DEFAULT NULL COMMENT '户址',
    `company_code` VARCHAR(64) NOT NULL COMMENT '公用事业公司编码',
    `company_name` VARCHAR(128) NOT NULL COMMENT '公用事业公司名称',
    `bill_amount` DECIMAL(18,2) NOT NULL COMMENT '账单金额',
    `penalty_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '违约金',
    `total_amount` DECIMAL(18,2) NOT NULL COMMENT '总金额',
    `bill_period_start` DATE DEFAULT NULL COMMENT '计费周期起始',
    `bill_period_end` DATE DEFAULT NULL COMMENT '计费周期截止',
    `due_date` DATE DEFAULT NULL COMMENT '到期日',
    `bill_status` TINYINT NOT NULL DEFAULT 0 COMMENT '账单状态 0未缴 1已缴 2逾期',
    `bill_month` VARCHAR(16) DEFAULT NULL COMMENT '账单月份(yyyy-MM)',
    `last_reading` DECIMAL(18,2) DEFAULT NULL COMMENT '上期读数',
    `current_reading` DECIMAL(18,2) DEFAULT NULL COMMENT '本期读数',
    `usage_amount` DECIMAL(18,2) DEFAULT NULL COMMENT '用量',
    `unit` VARCHAR(16) DEFAULT NULL COMMENT '单位',
    `unit_price` DECIMAL(18,2) DEFAULT NULL COMMENT '单价',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_bill_no` (`bill_no`),
    KEY `idx_account_no` (`account_no`),
    KEY `idx_bill_type` (`bill_type`),
    KEY `idx_company_code` (`company_code`),
    KEY `idx_bill_status` (`bill_status`),
    KEY `idx_bill_month` (`bill_month`),
    KEY `idx_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单信息表';

-- =================================================================================
-- 3. 缴费渠道配置表
-- =================================================================================
DROP TABLE IF EXISTS `payment_channel`;
CREATE TABLE `payment_channel` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `channel_code` VARCHAR(64) NOT NULL COMMENT '渠道编码',
    `channel_name` VARCHAR(128) NOT NULL COMMENT '渠道名称',
    `channel_type` TINYINT NOT NULL COMMENT '渠道类型 1微信 2支付宝 3银联 4云闪付',
    `app_id` VARCHAR(128) DEFAULT NULL COMMENT '应用ID',
    `mch_id` VARCHAR(128) DEFAULT NULL COMMENT '商户ID',
    `api_key` VARCHAR(255) DEFAULT NULL COMMENT 'API密钥',
    `cert_path` VARCHAR(255) DEFAULT NULL COMMENT '证书路径',
    `notify_url` VARCHAR(255) DEFAULT NULL COMMENT '回调地址',
    `fee_rate` DECIMAL(8,4) NOT NULL DEFAULT 0 COMMENT '费率',
    `enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0否 1是',
    `supported_bill_types` INT NOT NULL DEFAULT 31 COMMENT '支持的账单类型位掩码',
    `priority` INT NOT NULL DEFAULT 0 COMMENT '优先级',
    `single_limit` DECIMAL(18,2) DEFAULT 50000 COMMENT '单笔限额',
    `daily_limit` DECIMAL(18,2) DEFAULT 1000000 COMMENT '日限额',
    `daily_used` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '当日已用额度',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_channel_code` (`channel_code`),
    KEY `idx_channel_type` (`channel_type`),
    KEY `idx_enabled` (`enabled`),
    KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缴费渠道配置表';

-- =================================================================================
-- 4. 缴费记录表
-- =================================================================================
DROP TABLE IF EXISTS `payment_record`;
CREATE TABLE `payment_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `order_no` VARCHAR(64) NOT NULL COMMENT '订单编号',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `user_name` VARCHAR(128) DEFAULT NULL COMMENT '用户姓名',
    `bill_type` TINYINT NOT NULL COMMENT '账单类型 1水费 2电费 3燃气费 4暖气费 5物业费',
    `bill_type_name` VARCHAR(32) DEFAULT NULL COMMENT '账单类型名称',
    `account_no` VARCHAR(64) NOT NULL COMMENT '户号',
    `account_name` VARCHAR(128) DEFAULT NULL COMMENT '户名',
    `pay_amount` DECIMAL(18,2) NOT NULL COMMENT '缴费金额',
    `payment_channel` TINYINT NOT NULL COMMENT '缴费渠道 1微信 2支付宝 3银联 4云闪付',
    `channel_name` VARCHAR(64) DEFAULT NULL COMMENT '渠道名称',
    `channel_order_no` VARCHAR(128) DEFAULT NULL COMMENT '渠道订单号',
    `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态 0待支付 1支付中 2支付成功 3支付失败 4退款中 5退款成功 6退款失败',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `refund_amount` DECIMAL(18,2) DEFAULT NULL COMMENT '退款金额',
    `refund_time` DATETIME DEFAULT NULL COMMENT '退款时间',
    `refund_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款原因',
    `company_code` VARCHAR(64) DEFAULT NULL COMMENT '公用事业公司编码',
    `company_name` VARCHAR(128) DEFAULT NULL COMMENT '公用事业公司名称',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_bill_type` (`bill_type`),
    KEY `idx_account_no` (`account_no`),
    KEY `idx_payment_status` (`payment_status`),
    KEY `idx_pay_time` (`pay_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缴费记录表';

-- =================================================================================
-- 5. 用户绑定户号表
-- =================================================================================
DROP TABLE IF EXISTS `user_bind_account`;
CREATE TABLE `user_bind_account` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `account_no` VARCHAR(64) NOT NULL COMMENT '户号',
    `account_name` VARCHAR(128) DEFAULT NULL COMMENT '户名',
    `bill_type` TINYINT NOT NULL COMMENT '账单类型 1水费 2电费 3燃气费 4暖气费 5物业费',
    `bill_type_name` VARCHAR(32) DEFAULT NULL COMMENT '账单类型名称',
    `company_code` VARCHAR(64) DEFAULT NULL COMMENT '公用事业公司编码',
    `company_name` VARCHAR(128) DEFAULT NULL COMMENT '公用事业公司名称',
    `account_addr` VARCHAR(255) DEFAULT NULL COMMENT '户址',
    `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认 0否 1是',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_bill_type` (`bill_type`),
    KEY `idx_account_no` (`account_no`),
    UNIQUE KEY `uk_user_account_type` (`user_id`, `account_no`, `bill_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户绑定户号表';

-- =================================================================================
-- 初始化数据 - 缴费渠道配置
-- =================================================================================
INSERT INTO `payment_channel` (`id`, `channel_code`, `channel_name`, `channel_type`, `app_id`, `mch_id`, `fee_rate`, `enabled`, `supported_bill_types`, `priority`, `single_limit`, `daily_limit`, `remark`) VALUES
(1, 'WECHAT_PAY', '微信支付', 1, 'wx_placeholder', 'mch_placeholder', 0.0060, 1, 31, 1, 50000.00, 1000000.00, '微信支付渠道'),
(2, 'ALIPAY', '支付宝', 2, 'ali_placeholder', NULL, 0.0060, 1, 31, 2, 50000.00, 1000000.00, '支付宝渠道'),
(3, 'UNIONPAY', '银联支付', 3, NULL, 'union_placeholder', 0.0055, 1, 31, 3, 100000.00, 5000000.00, '银联支付渠道'),
(4, 'CLOUD_QUICK_PASS', '云闪付', 4, NULL, NULL, 0.0050, 1, 31, 4, 50000.00, 2000000.00, '云闪付渠道');

-- =================================================================================
-- 初始化数据 - 贵州省公用事业公司
-- =================================================================================
INSERT INTO `bill_info` (`id`, `bill_no`, `bill_type`, `bill_type_name`, `account_no`, `account_name`, `account_addr`, `company_code`, `company_name`, `bill_amount`, `penalty_amount`, `total_amount`, `bill_period_start`, `bill_period_end`, `due_date`, `bill_status`, `bill_month`, `last_reading`, `current_reading`, `usage_amount`, `unit`, `unit_price`) VALUES
(1, 'WATER-202401-00001', 1, '水费', 'GZ-W-000001', '张三', '贵阳市南明区花果园大街1号', 'GZ_WATER', '贵州水务集团', 45.60, 0, 45.60, '2024-01-01', '2024-01-31', '2024-02-15', 0, '2024-01', 120.00, 132.00, 12.00, '吨', 3.80),
(2, 'ELEC-202401-00001', 2, '电费', 'GZ-E-000001', '张三', '贵阳市南明区花果园大街1号', 'GZ_ELECTRIC', '贵州电网公司', 186.40, 0, 186.40, '2024-01-01', '2024-01-31', '2024-02-20', 0, '2024-01', 580.00, 720.00, 140.00, 'kWh', 1.33),
(3, 'GAS-202401-00001', 3, '燃气费', 'GZ-G-000001', '张三', '贵阳市南明区花果园大街1号', 'GZ_GAS', '贵州燃气集团', 78.00, 0, 78.00, '2024-01-01', '2024-01-31', '2024-02-15', 0, '2024-01', 85.00, 110.00, 25.00, 'm³', 3.12),
(4, 'HEAT-202401-00001', 4, '暖气费', 'GZ-H-000001', '李四', '贵阳市观山湖区世纪城路8号', 'GZ_HEATING', '贵阳热力公司', 320.00, 0, 320.00, '2024-01-01', '2024-03-31', '2024-04-15', 0, '2024-01', NULL, NULL, NULL, NULL, NULL),
(5, 'PROPERTY-202401-00001', 5, '物业费', 'GZ-P-000001', '李四', '贵阳市观山湖区世纪城路8号', 'GZ_PROPERTY', '贵州物业服务有限公司', 250.00, 0, 250.00, '2024-01-01', '2024-01-31', '2024-02-28', 0, '2024-01', NULL, NULL, NULL, NULL, NULL);

-- =================================================================================
-- 创建索引说明
-- =================================================================================
-- 所有表均已建立必要索引，包括：
-- 1. 主键索引（唯一）
-- 2. 业务编号唯一索引
-- 3. 外键关联索引
-- 4. 状态查询索引
-- 5. 时间范围查询索引
-- 6. 常用查询组合索引
