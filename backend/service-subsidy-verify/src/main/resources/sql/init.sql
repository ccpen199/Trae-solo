-- =================================================================================
-- 贵州省数字服务平台 - 消费补贴核销服务 数据库初始化脚本
-- Database: subsidy_verify_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `subsidy_verify_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `subsidy_verify_db`;

-- =================================================================================
-- 1. 商户分类表
-- =================================================================================
DROP TABLE IF EXISTS `merchant_category`;
CREATE TABLE `merchant_category` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `category_code` VARCHAR(32) NOT NULL COMMENT '分类编码 CATERING/RETAIL/HOME_APPLIANCE/TOURISM/GAS_STATION',
    `category_name` VARCHAR(64) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0否 1是',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`category_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户分类表';

-- =================================================================================
-- 2. 商户信息表
-- =================================================================================
DROP TABLE IF EXISTS `merchant`;
CREATE TABLE `merchant` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `merchant_code` VARCHAR(64) NOT NULL COMMENT '商户编码',
    `merchant_name` VARCHAR(128) NOT NULL COMMENT '商户名称',
    `category_code` VARCHAR(32) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(64) NOT NULL COMMENT '分类名称',
    `legal_person` VARCHAR(64) NOT NULL COMMENT '法人姓名',
    `id_card` VARCHAR(32) NOT NULL COMMENT '身份证号',
    `phone` VARCHAR(16) NOT NULL COMMENT '联系电话',
    `business_license` VARCHAR(500) DEFAULT NULL COMMENT '营业执照图片',
    `business_license_no` VARCHAR(64) NOT NULL COMMENT '营业执照号',
    `address` VARCHAR(255) NOT NULL COMMENT '经营地址',
    `province` VARCHAR(32) DEFAULT NULL COMMENT '省',
    `city` VARCHAR(32) DEFAULT NULL COMMENT '市',
    `district` VARCHAR(32) DEFAULT NULL COMMENT '区/县',
    `longitude` DOUBLE DEFAULT NULL COMMENT '经度',
    `latitude` DOUBLE DEFAULT NULL COMMENT '纬度',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0待审核 1已通过 2已驳回 3已禁用 4已拉黑',
    `contact_name` VARCHAR(64) DEFAULT NULL COMMENT '联系人',
    `contact_phone` VARCHAR(16) DEFAULT NULL COMMENT '联系电话',
    `bank_account` VARCHAR(64) DEFAULT NULL COMMENT '银行账号',
    `bank_name` VARCHAR(128) DEFAULT NULL COMMENT '开户行',
    `bank_code` VARCHAR(32) DEFAULT NULL COMMENT '银行编码',
    `qualification` VARCHAR(500) DEFAULT NULL COMMENT '资质证明',
    `qualification_no` VARCHAR(64) DEFAULT NULL COMMENT '资质编号',
    `qualified_time` DATETIME DEFAULT NULL COMMENT '资质通过时间',
    `verify_count` INT NOT NULL DEFAULT 0 COMMENT '核销次数',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_merchant_code` (`merchant_code`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_status` (`status`),
    KEY `idx_business_license_no` (`business_license_no`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户信息表';

-- =================================================================================
-- 3. 补贴凭证表
-- =================================================================================
DROP TABLE IF EXISTS `subsidy_voucher`;
CREATE TABLE `subsidy_voucher` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `voucher_no` VARCHAR(64) NOT NULL COMMENT '凭证编号',
    `policy_id` BIGINT NOT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) NOT NULL COMMENT '政策编号',
    `policy_name` VARCHAR(255) NOT NULL COMMENT '政策名称',
    `beneficiary_id` BIGINT NOT NULL COMMENT '受益人ID',
    `beneficiary_name` VARCHAR(128) NOT NULL COMMENT '受益人姓名',
    `id_card` VARCHAR(32) NOT NULL COMMENT '身份证号',
    `total_amount` DECIMAL(18,2) NOT NULL COMMENT '凭证总额',
    `used_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '已使用金额',
    `remaining_amount` DECIMAL(18,2) NOT NULL COMMENT '剩余金额',
    `voucher_status` TINYINT NOT NULL DEFAULT 0 COMMENT '凭证状态 0未使用 1部分使用 2已使用 3已过期 4已作废',
    `effective_time` DATETIME DEFAULT NULL COMMENT '生效时间',
    `expiry_time` DATETIME DEFAULT NULL COMMENT '过期时间',
    `issue_batch_no` VARCHAR(64) DEFAULT NULL COMMENT '发放批次号',
    `issue_reason` VARCHAR(255) DEFAULT NULL COMMENT '发放原因',
    `used_time` DATETIME DEFAULT NULL COMMENT '使用时间',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_voucher_no` (`voucher_no`),
    KEY `idx_policy_id` (`policy_id`),
    KEY `idx_beneficiary_id` (`beneficiary_id`),
    KEY `idx_voucher_status` (`voucher_status`),
    KEY `idx_expiry_time` (`expiry_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补贴凭证表';

-- =================================================================================
-- 4. 核销记录表
-- =================================================================================
DROP TABLE IF EXISTS `verify_record`;
CREATE TABLE `verify_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `verify_no` VARCHAR(64) NOT NULL COMMENT '核销编号',
    `voucher_id` BIGINT NOT NULL COMMENT '凭证ID',
    `voucher_no` VARCHAR(64) NOT NULL COMMENT '凭证编号',
    `policy_id` BIGINT NOT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) NOT NULL COMMENT '政策编号',
    `policy_name` VARCHAR(255) NOT NULL COMMENT '政策名称',
    `beneficiary_id` BIGINT NOT NULL COMMENT '受益人ID',
    `beneficiary_name` VARCHAR(128) NOT NULL COMMENT '受益人姓名',
    `id_card` VARCHAR(32) DEFAULT NULL COMMENT '身份证号',
    `phone` VARCHAR(16) DEFAULT NULL COMMENT '手机号',
    `merchant_id` BIGINT NOT NULL COMMENT '商户ID',
    `merchant_name` VARCHAR(128) NOT NULL COMMENT '商户名称',
    `merchant_code` VARCHAR(64) DEFAULT NULL COMMENT '商户编码',
    `merchant_category` VARCHAR(32) DEFAULT NULL COMMENT '商户分类',
    `original_amount` DECIMAL(18,2) NOT NULL COMMENT '原始金额',
    `subsidy_amount` DECIMAL(18,2) NOT NULL COMMENT '补贴金额',
    `self_pay_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '自付金额',
    `verify_type` TINYINT NOT NULL COMMENT '核销方式 1扫码 2手动',
    `verify_status` TINYINT NOT NULL DEFAULT 0 COMMENT '核销状态 0待核销 1核销中 2核销成功 3核销失败 4已撤销 5已退款',
    `verify_time` DATETIME DEFAULT NULL COMMENT '核销时间',
    `verify_place` VARCHAR(255) DEFAULT NULL COMMENT '核销地点',
    `verify_device` VARCHAR(128) DEFAULT NULL COMMENT '核销设备',
    `verify_items` TEXT COMMENT '核销项目',
    `certificate_no` VARCHAR(128) DEFAULT NULL COMMENT '凭证编号',
    `transaction_no` VARCHAR(128) DEFAULT NULL COMMENT '交易流水号',
    `payment_voucher` VARCHAR(500) DEFAULT NULL COMMENT '支付凭证',
    `auditor_id` VARCHAR(64) DEFAULT NULL COMMENT '审核人ID',
    `auditor_name` VARCHAR(64) DEFAULT NULL COMMENT '审核人姓名',
    `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `audit_opinion` TEXT COMMENT '审核意见',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `subsidy_service_tx_id` VARCHAR(128) DEFAULT NULL COMMENT '补贴监管服务事务ID',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_verify_no` (`verify_no`),
    KEY `idx_voucher_id` (`voucher_id`),
    KEY `idx_policy_id` (`policy_id`),
    KEY `idx_beneficiary_id` (`beneficiary_id`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_verify_status` (`verify_status`),
    KEY `idx_verify_time` (`verify_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核销记录表';

-- =================================================================================
-- 5. 核销统计快照表
-- =================================================================================
DROP TABLE IF EXISTS `verify_statistics`;
CREATE TABLE `verify_statistics` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `stat_date` VARCHAR(10) NOT NULL COMMENT '统计日期 yyyy-MM-dd',
    `merchant_id` BIGINT DEFAULT NULL COMMENT '商户ID',
    `merchant_name` VARCHAR(128) DEFAULT NULL COMMENT '商户名称',
    `merchant_category` VARCHAR(32) DEFAULT NULL COMMENT '商户分类',
    `policy_id` BIGINT DEFAULT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) DEFAULT NULL COMMENT '政策编号',
    `policy_name` VARCHAR(255) DEFAULT NULL COMMENT '政策名称',
    `verify_count` INT NOT NULL DEFAULT 0 COMMENT '核销笔数',
    `total_original_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '原始金额合计',
    `total_subsidy_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '补贴金额合计',
    `total_self_pay_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '自付金额合计',
    `success_count` INT NOT NULL DEFAULT 0 COMMENT '成功笔数',
    `fail_count` INT NOT NULL DEFAULT 0 COMMENT '失败笔数',
    `success_rate` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '成功率',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_stat_date_merchant_policy` (`stat_date`, `merchant_id`, `policy_id`),
    KEY `idx_stat_date` (`stat_date`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_policy_id` (`policy_id`),
    KEY `idx_merchant_category` (`merchant_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核销统计快照表';

-- =================================================================================
-- 初始化数据 - 商户分类
-- =================================================================================
INSERT INTO `merchant_category` (`id`, `category_code`, `category_name`, `description`, `sort_order`, `enabled`) VALUES
(1, 'CATERING', '餐饮', '餐饮行业商户（含餐饮、小吃、饮品等）', 1, 1),
(2, 'RETAIL', '零售', '零售行业商户（含超市、便利店、百货等）', 2, 1),
(3, 'HOME_APPLIANCE', '家电', '家电行业商户（含家电销售、维修等）', 3, 1),
(4, 'TOURISM', '文旅', '文旅行业商户（含景区、酒店、旅行社等）', 4, 1),
(5, 'GAS_STATION', '加油', '加油站商户（含中石油、中石化等加油站）', 5, 1);

-- =================================================================================
-- 创建索引说明
-- =================================================================================
-- 所有表均已建立必要索引，包括：
-- 1. 主键索引（唯一）
-- 2. 业务编号唯一索引
-- 3. 外键关联索引（政策ID、受益人ID、商户ID、凭证ID）
-- 4. 状态查询索引
-- 5. 时间范围查询索引
-- 6. 分类查询索引
