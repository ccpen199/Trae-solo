-- =============================================
-- 贵州省数字服务平台 - 电子证照全生命周期管理服务
-- 数据库初始化脚本
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS guizhou_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE guizhou_platform;

-- =============================================
-- 1. 电子证照主表
-- =============================================
DROP TABLE IF EXISTS `certificate`;
CREATE TABLE `certificate` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `certificate_no` varchar(64) NOT NULL COMMENT '证照编号',
  `certificate_type` int NOT NULL COMMENT '证照类型：1-身份证 2-驾驶证 3-行驶证 4-营业执照等',
  `certificate_name` varchar(128) NOT NULL COMMENT '证照名称',
  `user_id` bigint NOT NULL COMMENT '持证人用户ID',
  `user_name` varchar(64) NOT NULL COMMENT '持证人姓名',
  `id_card_no` varchar(32) NOT NULL COMMENT '身份证号',
  `issue_date` datetime NOT NULL COMMENT '签发日期',
  `expire_date` datetime NOT NULL COMMENT '过期日期',
  `issuing_authority` varchar(128) NOT NULL COMMENT '签发机关',
  `issuing_department` varchar(128) DEFAULT NULL COMMENT '签发部门',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0-待签发 1-有效 2-已过期 3-已吊销 4-已归档',
  `ipfs_hash` varchar(128) DEFAULT NULL COMMENT 'IPFS存储哈希',
  `blockchain_tx_hash` varchar(128) DEFAULT NULL COMMENT '区块链交易哈希',
  `data_hash` varchar(128) DEFAULT NULL COMMENT '证照数据哈希',
  `template_id` varchar(64) DEFAULT NULL COMMENT '模板ID',
  `metadata` text COMMENT '元数据(JSON格式)',
  `extend_info` text COMMENT '扩展信息(JSON格式)',
  `remark` varchar(512) DEFAULT NULL COMMENT '备注',
  `create_by` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_no` (`certificate_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_certificate_type` (`certificate_type`),
  KEY `idx_status` (`status`),
  KEY `idx_expire_date` (`expire_date`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电子证照主表';

-- =============================================
-- 2. 证照模板表
-- =============================================
DROP TABLE IF EXISTS `certificate_template`;
CREATE TABLE `certificate_template` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `template_code` varchar(64) NOT NULL COMMENT '模板编码',
  `template_name` varchar(128) NOT NULL COMMENT '模板名称',
  `certificate_type` int NOT NULL COMMENT '证照类型',
  `template_content` text COMMENT '模板内容(HTML格式)',
  `style_config` text COMMENT '样式配置(JSON格式)',
  `field_config` text COMMENT '字段配置(JSON格式)',
  `sign_config` text COMMENT '签名配置(JSON格式)',
  `seal_config` text COMMENT '印章配置(JSON格式)',
  `version` int DEFAULT '1' COMMENT '版本号',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `remark` varchar(512) DEFAULT NULL COMMENT '备注',
  `create_by` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_certificate_type` (`certificate_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='证照模板表';

-- =============================================
-- 3. 核验日志表
-- =============================================
DROP TABLE IF EXISTS `certificate_verify_log`;
CREATE TABLE `certificate_verify_log` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `certificate_id` bigint DEFAULT NULL COMMENT '证照ID',
  `certificate_no` varchar(64) DEFAULT NULL COMMENT '证照编号',
  `verify_type` int NOT NULL COMMENT '核验方式：1-二维码 2-OCR 3-授权码 4-人脸识别',
  `verify_content` varchar(512) DEFAULT NULL COMMENT '核验内容',
  `verifier_id` varchar(64) DEFAULT NULL COMMENT '核验人ID',
  `verifier_name` varchar(64) DEFAULT NULL COMMENT '核验人姓名',
  `verifier_org` varchar(128) DEFAULT NULL COMMENT '核验机构',
  `verify_time` datetime NOT NULL COMMENT '核验时间',
  `verify_result` tinyint NOT NULL COMMENT '核验结果：0-不通过 1-通过',
  `verify_detail` text COMMENT '核验详情(JSON格式)',
  `ip_address` varchar(64) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(512) DEFAULT NULL COMMENT '用户代理',
  `extend_info` text COMMENT '扩展信息(JSON格式)',
  `create_by` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  PRIMARY KEY (`id`),
  KEY `idx_certificate_id` (`certificate_id`),
  KEY `idx_certificate_no` (`certificate_no`),
  KEY `idx_verify_type` (`verify_type`),
  KEY `idx_verify_time` (`verify_time`),
  KEY `idx_verify_result` (`verify_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核验日志表';

-- =============================================
-- 4. 操作日志表
-- =============================================
DROP TABLE IF EXISTS `certificate_operation_log`;
CREATE TABLE `certificate_operation_log` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `certificate_id` bigint DEFAULT NULL COMMENT '证照ID',
  `certificate_no` varchar(64) DEFAULT NULL COMMENT '证照编号',
  `operation_type` varchar(32) NOT NULL COMMENT '操作类型：ISSUE-签发 REVOKE-吊销 ARCHIVE-归档等',
  `operation_content` varchar(512) NOT NULL COMMENT '操作内容',
  `operator_id` bigint DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(64) DEFAULT NULL COMMENT '操作人姓名',
  `operation_time` datetime NOT NULL COMMENT '操作时间',
  `ip_address` varchar(64) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(512) DEFAULT NULL COMMENT '用户代理',
  `extend_info` text COMMENT '扩展信息(JSON格式)',
  `create_by` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  PRIMARY KEY (`id`),
  KEY `idx_certificate_id` (`certificate_id`),
  KEY `idx_certificate_no` (`certificate_no`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_operation_time` (`operation_time`),
  KEY `idx_operator_id` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =============================================
-- 初始化数据
-- =============================================

-- 插入证照模板示例数据
INSERT INTO `certificate_template` (`id`, `template_code`, `template_name`, `certificate_type`, `template_content`, `style_config`, `field_config`, `sign_config`, `seal_config`, `version`, `status`, `remark`, `create_by`, `create_time`, `update_by`, `update_time`, `deleted`) VALUES
(1, 'TEMPLATE_ID_CARD_001', '居民身份证模板', 1, '<html><body><div class="id-card"><div class="header">中华人民共和国居民身份证</div><div class="photo">{{photo}}</div><div class="info"><p>姓名：{{userName}}</p><p>性别：{{gender}}</p><p>民族：{{nation}}</p><p>出生：{{birthDate}}</p><p>住址：{{address}}</p><p>公民身份号码：{{idCardNo}}</p></div></div></body></html>', '{\"pageSize\":\"A5\",\"margin\":\"10px\",\"fontFamily\":\"SimSun\"}', '{\"fields\":[{\"name\":\"userName\",\"label\":\"姓名\",\"type\":\"string\",\"required\":true},{\"name\":\"gender\",\"label\":\"性别\",\"type\":\"string\",\"required\":true},{\"name\":\"nation\",\"label\":\"民族\",\"type\":\"string\",\"required\":true},{\"name\":\"birthDate\",\"label\":\"出生日期\",\"type\":\"date\",\"required\":true},{\"name\":\"address\",\"label\":\"住址\",\"type\":\"string\",\"required\":true},{\"name\":\"idCardNo\",\"label\":\"身份证号\",\"type\":\"string\",\"required\":true},{\"name\":\"photo\",\"label\":\"照片\",\"type\":\"image\",\"required\":true}]}', '{\"enabled\":true,\"position\":\"bottomRight\",\"width\":\"100px\",\"height\":\"100px\"}', '{\"enabled\":true,\"position\":\"bottomLeft\",\"sealName\":\"贵州省公安厅\"}', 1, 1, '居民身份证标准模板', 1, NOW(), 1, NOW(), 0),
(2, 'TEMPLATE_DRIVING_LICENSE_001', '机动车驾驶证模板', 2, '<html><body><div class="driving-license"><div class="header">中华人民共和国机动车驾驶证</div><div class="photo">{{photo}}</div><div class="info"><p>姓名：{{userName}}</p><p>性别：{{gender}}</p><p>国籍：{{nationality}}</p><p>住址：{{address}}</p><p>出生日期：{{birthDate}}</p><p>初次领证日期：{{firstIssueDate}}</p><p>准驾车型：{{vehicleClass}}</p><p>有效期限：{{validPeriod}}</p><p>证号：{{licenseNo}}</p></div></div></body></html>', '{\"pageSize\":\"A5\",\"margin\":\"10px\",\"fontFamily\":\"SimSun\"}', '{\"fields\":[{\"name\":\"userName\",\"label\":\"姓名\",\"type\":\"string\",\"required\":true},{\"name\":\"gender\",\"label\":\"性别\",\"type\":\"string\",\"required\":true},{\"name\":\"nationality\",\"label\":\"国籍\",\"type\":\"string\",\"required\":true},{\"name\":\"address\",\"label\":\"住址\",\"type\":\"string\",\"required\":true},{\"name\":\"birthDate\",\"label\":\"出生日期\",\"type\":\"date\",\"required\":true},{\"name\":\"firstIssueDate\",\"label\":\"初次领证日期\",\"type\":\"date\",\"required\":true},{\"name\":\"vehicleClass\",\"label\":\"准驾车型\",\"type\":\"string\",\"required\":true},{\"name\":\"validPeriod\",\"label\":\"有效期限\",\"type\":\"string\",\"required\":true},{\"name\":\"licenseNo\",\"label\":\"证号\",\"type\":\"string\",\"required\":true},{\"name\":\"photo\",\"label\":\"照片\",\"type\":\"image\",\"required\":true}]}', '{\"enabled\":true,\"position\":\"bottomRight\",\"width\":\"80px\",\"height\":\"80px\"}', '{\"enabled\":true,\"position\":\"bottomLeft\",\"sealName\":\"贵州省交通运输厅\"}', 1, 1, '机动车驾驶证标准模板', 1, NOW(), 1, NOW(), 0),
(3, 'TEMPLATE_BUSINESS_LICENSE_001', '营业执照模板', 4, '<html><body><div class="business-license"><div class="header">营业执照</div><div class=\"info\"><p>统一社会信用代码：{{creditCode}}</p><p>名称：{{companyName}}</p><p>类型：{{companyType}}</p><p>法定代表人：{{legalRepresentative}}</p><p>注册资本：{{registeredCapital}}</p><p>成立日期：{{establishDate}}</p><p>营业期限：{{businessTerm}}</p><p>住所：{{address}}</p><p>经营范围：{{businessScope}}</p></div></div></body></html>', '{\"pageSize\":\"A4\",\"margin\":\"15px\",\"fontFamily\":\"SimSun\"}', '{\"fields\":[{\"name\":\"creditCode\",\"label\":\"统一社会信用代码\",\"type\":\"string\",\"required\":true},{\"name\":\"companyName\",\"label\":\"名称\",\"type\":\"string\",\"required\":true},{\"name\":\"companyType\",\"label\":\"类型\",\"type\":\"string\",\"required\":true},{\"name\":\"legalRepresentative\",\"label\":\"法定代表人\",\"type\":\"string\",\"required\":true},{\"name\":\"registeredCapital\",\"label\":\"注册资本\",\"type\":\"string\",\"required\":true},{\"name\":\"establishDate\",\"label\":\"成立日期\",\"type\":\"date\",\"required\":true},{\"name\":\"businessTerm\",\"label\":\"营业期限\",\"type\":\"string\",\"required\":true},{\"name\":\"address\",\"label\":\"住所\",\"type\":\"string\",\"required\":true},{\"name\":\"businessScope\",\"label\":\"经营范围\",\"type\":\"text\",\"required\":true}]}', '{\"enabled\":true,\"position\":\"bottomRight\",\"width\":\"120px\",\"height\":\"120px\"}', '{\"enabled\":true,\"position\":\"bottomLeft\",\"sealName\":\"贵州省市场监督管理局\"}', 1, 1, '营业执照标准模板', 1, NOW(), 1, NOW(), 0);

-- =============================================
-- RocketMQ Topic 创建说明
-- =============================================
-- 需要在RocketMQ控制台或通过命令创建以下Topic：
-- certificate-issue-topic          证照签发事件
-- certificate-revoke-topic         证照吊销事件
-- certificate-expire-reminder-topic 证照过期提醒
-- certificate-verify-topic         证照核验事件

-- =============================================
-- MongoDB 集合说明
-- =============================================
-- certificate_data_{certificateId}  存储证照原始数据的MongoDB集合
-- 每个证照一个独立集合，确保数据安全和快速检索
