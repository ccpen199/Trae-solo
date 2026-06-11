-- =================================================================================
-- 贵州省数字服务平台 - 补贴资金穿透式监管服务 数据库初始化脚本
-- Database: subsidy_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `subsidy_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `subsidy_db`;

-- =================================================================================
-- 1. 补贴政策表
-- =================================================================================
DROP TABLE IF EXISTS `subsidy_policy`;
CREATE TABLE `subsidy_policy` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `policy_code` VARCHAR(64) NOT NULL COMMENT '政策编号',
    `policy_name` VARCHAR(255) NOT NULL COMMENT '政策名称',
    `policy_type` VARCHAR(64) NOT NULL COMMENT '政策类型',
    `policy_status` TINYINT NOT NULL DEFAULT 0 COMMENT '政策状态 0草稿 1已发布 2执行中 3已暂停 4已过期 5已取消',
    `department` VARCHAR(128) NOT NULL COMMENT '主管部门',
    `department_code` VARCHAR(64) NOT NULL COMMENT '部门编码',
    `total_budget` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '总预算',
    `granted_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '已发放金额',
    `remaining_budget` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '剩余预算',
    `subsidy_standard` DECIMAL(18,2) NOT NULL COMMENT '补贴标准',
    `subsidy_unit` VARCHAR(32) DEFAULT NULL COMMENT '补贴单位',
    `grant_cycle` INT DEFAULT NULL COMMENT '发放周期',
    `grant_cycle_unit` VARCHAR(16) DEFAULT NULL COMMENT '周期单位',
    `eligibility_criteria` TEXT COMMENT '申领条件',
    `application_materials` TEXT COMMENT '申请材料',
    `effective_date` DATE NOT NULL COMMENT '生效日期',
    `expiry_date` DATE NOT NULL COMMENT '到期日期',
    `review_process` TEXT COMMENT '审核流程',
    `review_level` INT DEFAULT 1 COMMENT '审核级别',
    `description` TEXT COMMENT '政策描述',
    `attachment` VARCHAR(500) DEFAULT NULL COMMENT '附件',
    `publish_time` DATETIME DEFAULT NULL COMMENT '发布时间',
    `publish_by` BIGINT DEFAULT NULL COMMENT '发布人',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_policy_code` (`policy_code`),
    KEY `idx_policy_status` (`policy_status`),
    KEY `idx_department` (`department_code`),
    KEY `idx_effective_date` (`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补贴政策表';

-- =================================================================================
-- 2. 补贴发放记录表
-- =================================================================================
DROP TABLE IF EXISTS `subsidy_grant`;
CREATE TABLE `subsidy_grant` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `grant_no` VARCHAR(64) NOT NULL COMMENT '发放编号',
    `policy_id` BIGINT NOT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) NOT NULL COMMENT '政策编号',
    `policy_name` VARCHAR(255) NOT NULL COMMENT '政策名称',
    `beneficiary_type` VARCHAR(32) NOT NULL COMMENT '受益对象类型',
    `beneficiary_id` VARCHAR(64) NOT NULL COMMENT '受益对象ID',
    `beneficiary_name` VARCHAR(128) NOT NULL COMMENT '受益对象姓名',
    `id_card` VARCHAR(32) NOT NULL COMMENT '身份证号',
    `phone` VARCHAR(16) NOT NULL COMMENT '手机号',
    `bank_account` VARCHAR(64) NOT NULL COMMENT '银行账号',
    `bank_name` VARCHAR(128) NOT NULL COMMENT '开户行名称',
    `bank_code` VARCHAR(32) DEFAULT NULL COMMENT '银行编码',
    `apply_amount` DECIMAL(18,2) NOT NULL COMMENT '申请金额',
    `approved_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '审核金额',
    `granted_amount` DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '实际发放金额',
    `grant_status` TINYINT NOT NULL DEFAULT 0 COMMENT '发放状态 0待提交 1待审核 2审核驳回 3待审批 4审批驳回 5待发放 6发放中 7已发放 8发放失败 9已核销 10已撤销 11已冻结',
    `apply_reason` TEXT COMMENT '申请理由',
    `apply_materials` TEXT COMMENT '申请材料',
    `review_opinion` TEXT COMMENT '审核意见',
    `approve_opinion` TEXT COMMENT '审批意见',
    `reviewer_id` BIGINT DEFAULT NULL COMMENT '审核人ID',
    `reviewer_name` VARCHAR(64) DEFAULT NULL COMMENT '审核人姓名',
    `review_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `approver_id` BIGINT DEFAULT NULL COMMENT '审批人ID',
    `approver_name` VARCHAR(64) DEFAULT NULL COMMENT '审批人姓名',
    `approve_time` DATETIME DEFAULT NULL COMMENT '审批时间',
    `grant_time` DATETIME DEFAULT NULL COMMENT '发放时间',
    `transaction_no` VARCHAR(128) DEFAULT NULL COMMENT '交易流水号',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `blockchain_tx_hash` VARCHAR(128) DEFAULT NULL COMMENT '区块链交易哈希',
    `risk_flag` TINYINT NOT NULL DEFAULT 0 COMMENT '风险标志 0无 1有',
    `risk_level` VARCHAR(32) DEFAULT NULL COMMENT '风险等级',
    `risk_desc` VARCHAR(500) DEFAULT NULL COMMENT '风险描述',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_grant_no` (`grant_no`),
    KEY `idx_policy_id` (`policy_id`),
    KEY `idx_beneficiary_id` (`beneficiary_id`),
    KEY `idx_id_card` (`id_card`),
    KEY `idx_grant_status` (`grant_status`),
    KEY `idx_risk_flag` (`risk_flag`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补贴发放记录表';

-- =================================================================================
-- 3. 资金流转记录表
-- =================================================================================
DROP TABLE IF EXISTS `fund_flow`;
CREATE TABLE `fund_flow` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `flow_no` VARCHAR(64) NOT NULL COMMENT '流水编号',
    `grant_id` BIGINT DEFAULT NULL COMMENT '发放ID',
    `grant_no` VARCHAR(64) DEFAULT NULL COMMENT '发放编号',
    `policy_id` BIGINT DEFAULT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) DEFAULT NULL COMMENT '政策编号',
    `flow_type` TINYINT NOT NULL COMMENT '资金流向类型 1预算下达 2银行划转 3补贴发放 4补贴核销 5商户结算 6资金退回 7冻结 8解冻',
    `from_account` VARCHAR(64) NOT NULL COMMENT '转出账号',
    `from_account_name` VARCHAR(128) NOT NULL COMMENT '转出账户名',
    `from_type` VARCHAR(32) NOT NULL COMMENT '转出方类型',
    `to_account` VARCHAR(64) NOT NULL COMMENT '转入账号',
    `to_account_name` VARCHAR(128) NOT NULL COMMENT '转入账户名',
    `to_type` VARCHAR(32) NOT NULL COMMENT '转入方类型',
    `amount` DECIMAL(18,2) NOT NULL COMMENT '交易金额',
    `currency` VARCHAR(16) NOT NULL DEFAULT 'CNY' COMMENT '币种',
    `occur_time` DATETIME NOT NULL COMMENT '发生时间',
    `transaction_no` VARCHAR(128) DEFAULT NULL COMMENT '交易流水号',
    `bank_order_no` VARCHAR(128) DEFAULT NULL COMMENT '银行订单号',
    `trace_id` VARCHAR(64) NOT NULL COMMENT '追踪ID',
    `parent_flow_no` VARCHAR(64) DEFAULT NULL COMMENT '父流水号',
    `trace_depth` INT NOT NULL DEFAULT 0 COMMENT '追踪深度',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `blockchain_tx_hash` VARCHAR(128) DEFAULT NULL COMMENT '区块链交易哈希',
    `on_chain` TINYINT NOT NULL DEFAULT 0 COMMENT '是否上链 0否 1是',
    `on_chain_time` DATETIME DEFAULT NULL COMMENT '上链时间',
    `on_chain_operator` VARCHAR(64) DEFAULT NULL COMMENT '上链操作人',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_flow_no` (`flow_no`),
    KEY `idx_trace_id` (`trace_id`),
    KEY `idx_grant_id` (`grant_id`),
    KEY `idx_policy_id` (`policy_id`),
    KEY `idx_flow_type` (`flow_type`),
    KEY `idx_from_account` (`from_account`),
    KEY `idx_to_account` (`to_account`),
    KEY `idx_occur_time` (`occur_time`),
    KEY `idx_on_chain` (`on_chain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金流转记录表';

-- =================================================================================
-- 4. 风险预警表
-- =================================================================================
DROP TABLE IF EXISTS `risk_warning`;
CREATE TABLE `risk_warning` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `warning_no` VARCHAR(64) NOT NULL COMMENT '预警编号',
    `grant_id` BIGINT DEFAULT NULL COMMENT '发放ID',
    `grant_no` VARCHAR(64) DEFAULT NULL COMMENT '发放编号',
    `policy_id` BIGINT DEFAULT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) DEFAULT NULL COMMENT '政策编号',
    `beneficiary_id` VARCHAR(64) DEFAULT NULL COMMENT '受益人ID',
    `beneficiary_name` VARCHAR(128) DEFAULT NULL COMMENT '受益人姓名',
    `risk_level` TINYINT NOT NULL COMMENT '风险等级 1低 2中 3高 4严重',
    `risk_type` VARCHAR(64) NOT NULL COMMENT '风险类型',
    `risk_rule_code` VARCHAR(64) DEFAULT NULL COMMENT '风控规则编码',
    `risk_rule_name` VARCHAR(128) DEFAULT NULL COMMENT '风控规则名称',
    `risk_score` INT NOT NULL COMMENT '风险分值',
    `risk_desc` VARCHAR(500) DEFAULT NULL COMMENT '风险描述',
    `risk_evidence` TEXT COMMENT '风险证据',
    `warning_status` TINYINT NOT NULL DEFAULT 0 COMMENT '预警状态 0待处理 1已处理',
    `handler_id` VARCHAR(64) DEFAULT NULL COMMENT '处理人ID',
    `handler_name` VARCHAR(64) DEFAULT NULL COMMENT '处理人姓名',
    `handle_time` DATETIME DEFAULT NULL COMMENT '处理时间',
    `handle_opinion` TEXT COMMENT '处理意见',
    `handle_result` VARCHAR(128) DEFAULT NULL COMMENT '处理结果',
    `auto_freeze` TINYINT NOT NULL DEFAULT 0 COMMENT '是否自动冻结 0否 1是',
    `freeze_time` DATETIME DEFAULT NULL COMMENT '冻结时间',
    `freeze_reason` VARCHAR(500) DEFAULT NULL COMMENT '冻结原因',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_warning_no` (`warning_no`),
    KEY `idx_grant_id` (`grant_id`),
    KEY `idx_beneficiary_id` (`beneficiary_id`),
    KEY `idx_risk_level` (`risk_level`),
    KEY `idx_warning_status` (`warning_status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风险预警表';

-- =================================================================================
-- 5. 风控规则表
-- =================================================================================
DROP TABLE IF EXISTS `risk_rule`;
CREATE TABLE `risk_rule` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `rule_code` VARCHAR(64) NOT NULL COMMENT '规则编码',
    `rule_name` VARCHAR(128) NOT NULL COMMENT '规则名称',
    `rule_type` VARCHAR(64) NOT NULL COMMENT '规则类型',
    `risk_level` TINYINT NOT NULL COMMENT '风险等级 1低 2中 3高 4严重',
    `risk_score` INT NOT NULL COMMENT '风险分值',
    `rule_expression` TEXT NOT NULL COMMENT '规则表达式',
    `rule_description` TEXT COMMENT '规则描述',
    `threshold_value` DECIMAL(18,2) DEFAULT NULL COMMENT '阈值',
    `threshold_unit` VARCHAR(32) DEFAULT NULL COMMENT '阈值单位',
    `time_window` INT DEFAULT NULL COMMENT '时间窗口',
    `time_window_unit` VARCHAR(16) DEFAULT NULL COMMENT '时间单位',
    `enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0否 1是',
    `auto_freeze` TINYINT NOT NULL DEFAULT 0 COMMENT '是否自动冻结 0否 1是',
    `warning_template` VARCHAR(500) DEFAULT NULL COMMENT '预警模板',
    `priority` INT NOT NULL DEFAULT 0 COMMENT '优先级',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_rule_code` (`rule_code`),
    KEY `idx_rule_type` (`rule_type`),
    KEY `idx_enabled` (`enabled`),
    KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风控规则表';

-- =================================================================================
-- 6. 补贴核销记录表
-- =================================================================================
DROP TABLE IF EXISTS `subsidy_verify_record`;
CREATE TABLE `subsidy_verify_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `verify_no` VARCHAR(64) NOT NULL COMMENT '核销编号',
    `grant_id` BIGINT NOT NULL COMMENT '发放ID',
    `grant_no` VARCHAR(64) NOT NULL COMMENT '发放编号',
    `policy_id` BIGINT NOT NULL COMMENT '政策ID',
    `policy_code` VARCHAR(64) NOT NULL COMMENT '政策编号',
    `beneficiary_id` VARCHAR(64) NOT NULL COMMENT '受益人ID',
    `beneficiary_name` VARCHAR(128) NOT NULL COMMENT '受益人姓名',
    `merchant_id` VARCHAR(64) NOT NULL COMMENT '商户ID',
    `merchant_name` VARCHAR(128) NOT NULL COMMENT '商户名称',
    `verify_amount` DECIMAL(18,2) NOT NULL COMMENT '核销金额',
    `original_amount` DECIMAL(18,2) NOT NULL COMMENT '原始金额',
    `subsidy_amount` DECIMAL(18,2) NOT NULL COMMENT '补贴金额',
    `self_pay_amount` DECIMAL(18,2) NOT NULL COMMENT '自付金额',
    `verify_time` DATETIME NOT NULL COMMENT '核销时间',
    `verify_place` VARCHAR(255) DEFAULT NULL COMMENT '核销地点',
    `verify_items` TEXT COMMENT '核销项目',
    `certificate_no` VARCHAR(128) DEFAULT NULL COMMENT '凭证编号',
    `transaction_no` VARCHAR(128) DEFAULT NULL COMMENT '交易流水号',
    `payment_voucher` VARCHAR(500) DEFAULT NULL COMMENT '支付凭证',
    `verify_status` TINYINT NOT NULL DEFAULT 0 COMMENT '核销状态 0待审核 1已通过 2已驳回',
    `auditor_id` VARCHAR(64) DEFAULT NULL COMMENT '审核人ID',
    `auditor_name` VARCHAR(64) DEFAULT NULL COMMENT '审核人姓名',
    `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `audit_opinion` TEXT COMMENT '审核意见',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `blockchain_tx_hash` VARCHAR(128) DEFAULT NULL COMMENT '区块链交易哈希',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_verify_no` (`verify_no`),
    KEY `idx_grant_id` (`grant_id`),
    KEY `idx_beneficiary_id` (`beneficiary_id`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_verify_time` (`verify_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补贴核销记录表';

-- =================================================================================
-- 7. 审计日志表
-- =================================================================================
DROP TABLE IF EXISTS `subsidy_audit_log`;
CREATE TABLE `subsidy_audit_log` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `log_no` VARCHAR(64) NOT NULL COMMENT '日志编号',
    `business_type` VARCHAR(64) NOT NULL COMMENT '业务类型',
    `business_id` BIGINT DEFAULT NULL COMMENT '业务ID',
    `business_no` VARCHAR(64) DEFAULT NULL COMMENT '业务编号',
    `operation_type` TINYINT NOT NULL COMMENT '操作类型',
    `operation_name` VARCHAR(128) NOT NULL COMMENT '操作名称',
    `operator_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
    `operator_name` VARCHAR(64) DEFAULT NULL COMMENT '操作人姓名',
    `operator_dept` VARCHAR(128) DEFAULT NULL COMMENT '操作人部门',
    `operation_time` DATETIME NOT NULL COMMENT '操作时间',
    `before_data` TEXT COMMENT '操作前数据',
    `after_data` TEXT COMMENT '操作后数据',
    `change_content` TEXT COMMENT '变更内容',
    `operation_ip` VARCHAR(64) DEFAULT NULL COMMENT '操作IP',
    `operation_device` VARCHAR(255) DEFAULT NULL COMMENT '操作设备',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `blockchain_tx_hash` VARCHAR(128) DEFAULT NULL COMMENT '区块链交易哈希',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_log_no` (`log_no`),
    KEY `idx_business` (`business_type`, `business_id`),
    KEY `idx_operator` (`operator_id`),
    KEY `idx_operation_time` (`operation_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- =================================================================================
-- 初始化数据 - 风控规则
-- =================================================================================
INSERT INTO `risk_rule` (`id`, `rule_code`, `rule_name`, `rule_type`, `risk_level`, `risk_score`, `rule_expression`, `rule_description`, `threshold_value`, `time_window`, `enabled`, `auto_freeze`, `priority`, `remark`) VALUES
(1, 'RULE_DUPLICATE_GRANT', '重复申领检测', 'DUPLICATE', 3, 40, 'duplicate_grant_check', '同一受益人在同一政策下重复申领', NULL, 30, 1, 0, 100, '检测重复申领风险'),
(2, 'RULE_ABNORMAL_AMOUNT', '异常金额检测', 'AMOUNT', 3, 35, 'abnormal_amount_check', '申请金额超过阈值', 100000.00, NULL, 1, 0, 90, '检测大额补贴申请'),
(3, 'RULE_SUSPICIOUS_ACCOUNT', '可疑账号检测', 'ACCOUNT', 4, 50, 'suspicious_account_check', '银行账号存在异常规律', NULL, NULL, 1, 1, 95, '检测连号等可疑账号'),
(4, 'RULE_INVALID_IDCARD', '无效身份证检测', 'IDENTITY', 2, 25, 'invalid_idcard_check', '身份证格式无效', NULL, NULL, 1, 0, 80, '检测无效身份证号'),
(5, 'RULE_INVALID_PHONE', '无效手机号检测', 'IDENTITY', 2, 20, 'invalid_phone_check', '手机号格式无效', NULL, NULL, 1, 0, 70, '检测无效手机号'),
(6, 'RULE_HIGH_FREQUENCY', '高频申请检测', 'FREQUENCY', 3, 30, 'frequency_check', '短时间内多次申请', 5, 24, 1, 0, 85, '检测24小时内超过5次申请'),
(7, 'RULE_AMOUNT_EXCEED', '超标准发放', 'POLICY', 4, 45, 'amount_exceed_check', '发放金额超过政策标准', NULL, NULL, 1, 1, 100, '检测超标准发放');

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
