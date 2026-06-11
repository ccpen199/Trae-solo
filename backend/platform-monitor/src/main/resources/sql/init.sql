-- =================================================================================
-- 贵州省数字服务平台 - 服务可用性SLA监控服务 数据库初始化脚本
-- Database: monitor_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `monitor_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `monitor_db`;

-- =================================================================================
-- 1. 服务实例表
-- =================================================================================
DROP TABLE IF EXISTS `service_instance`;
CREATE TABLE `service_instance` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `service_code` VARCHAR(64) NOT NULL COMMENT '服务编码',
    `service_name` VARCHAR(128) NOT NULL COMMENT '服务名称',
    `service_group` VARCHAR(64) DEFAULT NULL COMMENT '服务分组',
    `health_url` VARCHAR(500) NOT NULL COMMENT '健康检查URL',
    `instance_host` VARCHAR(128) DEFAULT NULL COMMENT '实例主机',
    `instance_port` INT DEFAULT NULL COMMENT '实例端口',
    `instance_uri` VARCHAR(255) DEFAULT NULL COMMENT '实例URI',
    `status` VARCHAR(32) NOT NULL DEFAULT 'UP' COMMENT '服务状态 UP/DOWN/DEGRADED',
    `last_probe_time` DATETIME DEFAULT NULL COMMENT '最后拨测时间',
    `last_response_time` BIGINT DEFAULT NULL COMMENT '最后响应时间(ms)',
    `consecutive_failures` INT NOT NULL DEFAULT 0 COMMENT '连续失败次数',
    `metadata` TEXT COMMENT '元数据JSON',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_service_code` (`service_code`),
    KEY `idx_status` (`status`),
    KEY `idx_service_group` (`service_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务实例表';

-- =================================================================================
-- 2. 拨测记录表
-- =================================================================================
DROP TABLE IF EXISTS `probe_record`;
CREATE TABLE `probe_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `service_id` BIGINT NOT NULL COMMENT '服务ID',
    `service_code` VARCHAR(64) NOT NULL COMMENT '服务编码',
    `probe_type` VARCHAR(32) NOT NULL DEFAULT 'HTTP' COMMENT '拨测类型',
    `probe_url` VARCHAR(500) NOT NULL COMMENT '拨测URL',
    `status_code` INT DEFAULT NULL COMMENT 'HTTP状态码',
    `response_time` BIGINT DEFAULT NULL COMMENT '响应时间(ms)',
    `success` TINYINT NOT NULL DEFAULT 1 COMMENT '是否成功 0否 1是',
    `error_message` VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    `probe_time` DATETIME NOT NULL COMMENT '拨测时间',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_service_id` (`service_id`),
    KEY `idx_service_code` (`service_code`),
    KEY `idx_probe_time` (`probe_time`),
    KEY `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='拨测记录表';

-- =================================================================================
-- 3. SLA协议表
-- =================================================================================
DROP TABLE IF EXISTS `sla_agreement`;
CREATE TABLE `sla_agreement` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `agreement_code` VARCHAR(64) NOT NULL COMMENT '协议编号',
    `service_id` BIGINT DEFAULT NULL COMMENT '服务ID',
    `service_code` VARCHAR(64) NOT NULL COMMENT '服务编码',
    `service_name` VARCHAR(128) NOT NULL COMMENT '服务名称',
    `availability_target` DECIMAL(8,4) NOT NULL DEFAULT 99.9500 COMMENT '可用性目标(%)',
    `response_time_target` DECIMAL(10,2) NOT NULL DEFAULT 200.00 COMMENT '响应时间目标(ms)',
    `error_rate_target` DECIMAL(8,4) NOT NULL DEFAULT 1.0000 COMMENT '错误率目标(%)',
    `penalty_clause` DECIMAL(18,2) DEFAULT NULL COMMENT '违约罚金',
    `effective_date` DATETIME NOT NULL COMMENT '生效日期',
    `expiry_date` DATETIME NOT NULL COMMENT '到期日期',
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '协议状态 ACTIVE/SUSPENDED/EXPIRED',
    `description` TEXT COMMENT '协议描述',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_agreement_code` (`agreement_code`),
    KEY `idx_service_code` (`service_code`),
    KEY `idx_status` (`status`),
    KEY `idx_effective_date` (`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SLA协议表';

-- =================================================================================
-- 4. SLA考核记录表
-- =================================================================================
DROP TABLE IF EXISTS `sla_record`;
CREATE TABLE `sla_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `agreement_id` BIGINT NOT NULL COMMENT '协议ID',
    `agreement_code` VARCHAR(64) NOT NULL COMMENT '协议编号',
    `service_id` BIGINT DEFAULT NULL COMMENT '服务ID',
    `service_code` VARCHAR(64) NOT NULL COMMENT '服务编码',
    `service_name` VARCHAR(128) NOT NULL COMMENT '服务名称',
    `check_month` DATE NOT NULL COMMENT '考核月份',
    `total_minutes` DECIMAL(12,2) NOT NULL COMMENT '总时间(分钟)',
    `downtime_minutes` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '宕机时间(分钟)',
    `actual_availability` DECIMAL(8,4) NOT NULL COMMENT '实际可用性(%)',
    `availability_target` DECIMAL(8,4) NOT NULL COMMENT '可用性目标(%)',
    `avg_response_time` DECIMAL(10,2) NOT NULL COMMENT '平均响应时间(ms)',
    `response_time_target` DECIMAL(10,2) NOT NULL COMMENT '响应时间目标(ms)',
    `error_rate` DECIMAL(8,4) NOT NULL COMMENT '实际错误率(%)',
    `error_rate_target` DECIMAL(8,4) NOT NULL COMMENT '错误率目标(%)',
    `total_requests` BIGINT NOT NULL DEFAULT 0 COMMENT '总请求数',
    `failed_requests` BIGINT NOT NULL DEFAULT 0 COMMENT '失败请求数',
    `check_status` VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '考核状态 PENDING/QUALIFIED/UNQUALIFIED/EXEMPTED',
    `check_result` VARCHAR(500) DEFAULT NULL COMMENT '考核结果描述',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_agreement_id` (`agreement_id`),
    KEY `idx_service_code` (`service_code`),
    KEY `idx_check_month` (`check_month`),
    KEY `idx_check_status` (`check_status`),
    UNIQUE KEY `uk_agreement_month` (`agreement_id`, `check_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SLA考核记录表';

-- =================================================================================
-- 5. 告警规则表
-- =================================================================================
DROP TABLE IF EXISTS `alert_rule`;
CREATE TABLE `alert_rule` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `rule_code` VARCHAR(64) NOT NULL COMMENT '规则编码',
    `rule_name` VARCHAR(128) NOT NULL COMMENT '规则名称',
    `rule_type` VARCHAR(64) NOT NULL COMMENT '规则类型 THRESHOLD/ANOMALY/COMPOSITE',
    `alert_level` VARCHAR(32) NOT NULL COMMENT '告警级别 INFO/WARNING/CRITICAL/FATAL',
    `metric_name` VARCHAR(64) NOT NULL COMMENT '监控指标名称',
    `operator` VARCHAR(16) NOT NULL COMMENT '比较运算符 >/>=/</<=/==/!=',
    `threshold` DECIMAL(18,4) NOT NULL COMMENT '阈值',
    `duration_seconds` INT DEFAULT NULL COMMENT '持续时间(秒)',
    `consecutive_count` INT DEFAULT NULL COMMENT '连续触发次数',
    `enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0否 1是',
    `notify_channels` VARCHAR(255) DEFAULT 'SMS,EMAIL' COMMENT '通知渠道 SMS/EMAIL/DINGTALK/WEBHOOK',
    `description` TEXT COMMENT '规则描述',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_rule_code` (`rule_code`),
    KEY `idx_rule_type` (`rule_type`),
    KEY `idx_enabled` (`enabled`),
    KEY `idx_metric_name` (`metric_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则表';

-- =================================================================================
-- 6. 告警记录表
-- =================================================================================
DROP TABLE IF EXISTS `alert_record`;
CREATE TABLE `alert_record` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `alert_no` VARCHAR(64) NOT NULL COMMENT '告警编号',
    `rule_id` BIGINT NOT NULL COMMENT '规则ID',
    `rule_code` VARCHAR(64) NOT NULL COMMENT '规则编码',
    `rule_name` VARCHAR(128) NOT NULL COMMENT '规则名称',
    `service_id` BIGINT DEFAULT NULL COMMENT '服务ID',
    `service_code` VARCHAR(64) NOT NULL COMMENT '服务编码',
    `service_name` VARCHAR(128) NOT NULL COMMENT '服务名称',
    `alert_level` VARCHAR(32) NOT NULL COMMENT '告警级别',
    `alert_type` VARCHAR(64) NOT NULL COMMENT '告警类型',
    `metric_name` VARCHAR(64) NOT NULL COMMENT '指标名称',
    `current_value` VARCHAR(64) NOT NULL COMMENT '当前值',
    `threshold_value` VARCHAR(64) NOT NULL COMMENT '阈值',
    `alert_message` VARCHAR(500) NOT NULL COMMENT '告警消息',
    `alert_time` DATETIME NOT NULL COMMENT '告警时间',
    `alert_status` VARCHAR(32) NOT NULL DEFAULT 'FIRING' COMMENT '告警状态 FIRING/RESOLVED/SUPPRESSED',
    `handler_id` VARCHAR(64) DEFAULT NULL COMMENT '处理人ID',
    `handler_name` VARCHAR(64) DEFAULT NULL COMMENT '处理人姓名',
    `handle_time` DATETIME DEFAULT NULL COMMENT '处理时间',
    `handle_opinion` TEXT COMMENT '处理意见',
    `notify_channels` VARCHAR(255) DEFAULT NULL COMMENT '通知渠道',
    `notify_result` VARCHAR(500) DEFAULT NULL COMMENT '通知结果',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_alert_no` (`alert_no`),
    KEY `idx_rule_id` (`rule_id`),
    KEY `idx_service_code` (`service_code`),
    KEY `idx_alert_level` (`alert_level`),
    KEY `idx_alert_status` (`alert_status`),
    KEY `idx_alert_time` (`alert_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警记录表';

-- =================================================================================
-- 初始化数据 - 平台服务实例
-- =================================================================================
INSERT INTO `service_instance` (`id`, `service_code`, `service_name`, `service_group`, `health_url`, `instance_host`, `instance_port`, `status`) VALUES
(1, 'platform-gateway', 'API网关服务', 'INFRA', 'http://127.0.0.1:8080/gateway/actuator/health', '127.0.0.1', 8080, 'UP'),
(2, 'platform-auth', '统一认证服务', 'INFRA', 'http://127.0.0.1:8081/auth/actuator/health', '127.0.0.1', 8081, 'UP'),
(3, 'platform-data-share', '数据共享交换服务', 'DATA', 'http://127.0.0.1:8083/datashare/actuator/health', '127.0.0.1', 8083, 'UP'),
(4, 'platform-certificate', '电子证照服务', 'GOV', 'http://127.0.0.1:8084/certificate/actuator/health', '127.0.0.1', 8084, 'UP'),
(5, 'platform-subsidy', '补贴资金监管服务', 'GOV', 'http://127.0.0.1:8085/subsidy/actuator/health', '127.0.0.1', 8085, 'UP'),
(6, 'platform-monitor', '监控服务', 'INFRA', 'http://127.0.0.1:8086/monitor/actuator/health', '127.0.0.1', 8086, 'UP');

-- =================================================================================
-- 初始化数据 - SLA协议
-- =================================================================================
INSERT INTO `sla_agreement` (`id`, `agreement_code`, `service_code`, `service_name`, `availability_target`, `response_time_target`, `error_rate_target`, `effective_date`, `expiry_date`, `status`) VALUES
(1, 'SLA-GW-2024', 'platform-gateway', 'API网关服务', 99.9900, 100.00, 0.1000, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 'ACTIVE'),
(2, 'SLA-AUTH-2024', 'platform-auth', '统一认证服务', 99.9500, 200.00, 0.5000, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 'ACTIVE'),
(3, 'SLA-DATA-2024', 'platform-data-share', '数据共享交换服务', 99.9000, 300.00, 1.0000, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 'ACTIVE'),
(4, 'SLA-CERT-2024', 'platform-certificate', '电子证照服务', 99.9000, 500.00, 1.0000, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 'ACTIVE'),
(5, 'SLA-SUB-2024', 'platform-subsidy', '补贴资金监管服务', 99.9500, 200.00, 0.5000, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 'ACTIVE');

-- =================================================================================
-- 初始化数据 - 告警规则
-- =================================================================================
INSERT INTO `alert_rule` (`id`, `rule_code`, `rule_name`, `rule_type`, `alert_level`, `metric_name`, `operator`, `threshold`, `duration_seconds`, `consecutive_count`, `enabled`, `notify_channels`, `description`) VALUES
(1, 'RULE_RESPONSE_TIME_HIGH', '响应时间过高', 'THRESHOLD', 'WARNING', 'response_time', '>', 200.0000, 60, 3, 1, 'SMS,EMAIL,DINGTALK', '服务平均响应时间超过200ms'),
(2, 'RULE_ERROR_RATE_HIGH', '错误率过高', 'THRESHOLD', 'CRITICAL', 'error_rate', '>', 1.0000, 60, 2, 1, 'SMS,EMAIL,DINGTALK,WEBHOOK', '服务错误率超过1%'),
(3, 'RULE_AVAILABILITY_LOW', '可用性低于目标', 'THRESHOLD', 'CRITICAL', 'availability', '<', 99.9500, 300, 1, 1, 'SMS,EMAIL,DINGTALK,WEBHOOK', '服务可用性低于99.95%'),
(4, 'RULE_SERVICE_DOWN', '服务不可用', 'THRESHOLD', 'FATAL', 'availability', '==', 0.0000, NULL, 3, 1, 'SMS,EMAIL,DINGTALK,WEBHOOK', '服务连续3次拨测失败，判定为不可用'),
(5, 'RULE_RESPONSE_TIME_CRITICAL', '响应时间严重超标', 'THRESHOLD', 'FATAL', 'response_time', '>', 1000.0000, NULL, 1, 1, 'SMS,EMAIL,DINGTALK,WEBHOOK', '服务响应时间超过1000ms');

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
