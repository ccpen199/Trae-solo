-- =================================================================================
-- 贵州省数字服务平台 - 政务服务模块 数据库初始化脚本
-- Database: government_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `government_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `government_db`;

-- =================================================================================
-- 1. 服务分类表
-- =================================================================================
DROP TABLE IF EXISTS `service_category`;
CREATE TABLE `service_category` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `category_code` VARCHAR(64) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(128) NOT NULL COMMENT '分类名称',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID，0为顶级',
    `level` TINYINT NOT NULL DEFAULT 1 COMMENT '层级 1一级 2二级 3三级',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标',
    `sort_num` INT NOT NULL DEFAULT 0 COMMENT '排序号',
    `item_count` INT NOT NULL DEFAULT 0 COMMENT '事项数量',
    `is_visible` TINYINT NOT NULL DEFAULT 1 COMMENT '是否可见 0否 1是',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`category_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_level` (`level`),
    KEY `idx_sort_num` (`sort_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务分类表';

-- =================================================================================
-- 2. 服务事项表
-- =================================================================================
DROP TABLE IF EXISTS `service_item`;
CREATE TABLE `service_item` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `item_code` VARCHAR(64) NOT NULL COMMENT '事项编码',
    `item_name` VARCHAR(255) NOT NULL COMMENT '事项名称',
    `category_id` BIGINT NOT NULL COMMENT '所属分类ID',
    `category_code` VARCHAR(64) NOT NULL COMMENT '所属分类编码',
    `department` VARCHAR(128) NOT NULL COMMENT '实施部门',
    `department_code` VARCHAR(64) NOT NULL COMMENT '部门编码',
    `service_status` TINYINT NOT NULL DEFAULT 0 COMMENT '服务状态 0草稿 1已发布 2在办 3暂停 4已下架 5已取消',
    `service_type` VARCHAR(64) DEFAULT NULL COMMENT '服务类型 行政许可/行政确认/行政给付/行政征收/公共服务等',
    `service_object` VARCHAR(128) DEFAULT NULL COMMENT '服务对象 自然人/法人/其他组织',
    `service_scene` VARCHAR(255) DEFAULT NULL COMMENT '服务场景',
    `legal_basis` TEXT COMMENT '法律依据',
    `apply_condition` TEXT COMMENT '申请条件',
    `materials_desc` TEXT COMMENT '申报材料描述',
    `process_desc` TEXT COMMENT '办理流程描述',
    `process_days` INT DEFAULT NULL COMMENT '法定办结时限（工作日）',
    `charge_standard` VARCHAR(255) DEFAULT NULL COMMENT '收费标准',
    `result_sample` VARCHAR(255) DEFAULT NULL COMMENT '结果样本',
    `online_url` VARCHAR(500) DEFAULT NULL COMMENT '网办地址',
    `window_address` VARCHAR(255) DEFAULT NULL COMMENT '窗口地址',
    `consult_phone` VARCHAR(32) DEFAULT NULL COMMENT '咨询电话',
    `supervision_phone` VARCHAR(32) DEFAULT NULL COMMENT '监督电话',
    `is_online` TINYINT NOT NULL DEFAULT 0 COMMENT '是否支持网办 0否 1是',
    `is_reservation` TINYINT NOT NULL DEFAULT 0 COMMENT '是否支持预约 0否 1是',
    `effective_date` DATE DEFAULT NULL COMMENT '生效日期',
    `expiry_date` DATE DEFAULT NULL COMMENT '失效日期',
    `sort_num` INT NOT NULL DEFAULT 0 COMMENT '排序号',
    `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签，逗号分隔',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_item_code` (`item_code`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_department_code` (`department_code`),
    KEY `idx_service_status` (`service_status`),
    KEY `idx_is_online` (`is_online`),
    KEY `idx_effective_date` (`effective_date`),
    FULLTEXT KEY `ft_item_name` (`item_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务事项表';

-- =================================================================================
-- 3. 申办记录表
-- =================================================================================
DROP TABLE IF EXISTS `service_apply`;
CREATE TABLE `service_apply` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `apply_no` VARCHAR(64) NOT NULL COMMENT '申办编号',
    `item_id` BIGINT NOT NULL COMMENT '服务事项ID',
    `item_code` VARCHAR(64) NOT NULL COMMENT '事项编码',
    `item_name` VARCHAR(255) NOT NULL COMMENT '事项名称',
    `category_id` BIGINT DEFAULT NULL COMMENT '分类ID',
    `category_code` VARCHAR(64) DEFAULT NULL COMMENT '分类编码',
    `applicant_type` VARCHAR(32) NOT NULL DEFAULT 'PERSONAL' COMMENT '申请类型 PERSONAL个人/LEGAL法人',
    `applicant_name` VARCHAR(128) NOT NULL COMMENT '申请人姓名',
    `applicant_id_card` VARCHAR(32) NOT NULL COMMENT '申请人身份证号',
    `applicant_phone` VARCHAR(16) NOT NULL COMMENT '申请人手机号',
    `applicant_address` VARCHAR(255) DEFAULT NULL COMMENT '申请人地址',
    `legal_person_name` VARCHAR(128) DEFAULT NULL COMMENT '法人姓名',
    `unified_social_code` VARCHAR(32) DEFAULT NULL COMMENT '统一社会信用代码',
    `apply_status` TINYINT NOT NULL DEFAULT 0 COMMENT '申办状态 0待提交 1审核中 2补正 3受理 4办理中 5办结 6不予受理 7已撤回',
    `apply_reason` TEXT COMMENT '申请理由',
    `apply_time` DATETIME DEFAULT NULL COMMENT '申请时间',
    `accept_time` DATETIME DEFAULT NULL COMMENT '受理时间',
    `complete_time` DATETIME DEFAULT NULL COMMENT '办结时间',
    `handler_name` VARCHAR(64) DEFAULT NULL COMMENT '经办人姓名',
    `handler_phone` VARCHAR(16) DEFAULT NULL COMMENT '经办人电话',
    `department` VARCHAR(128) DEFAULT NULL COMMENT '办理部门',
    `department_code` VARCHAR(64) DEFAULT NULL COMMENT '部门编码',
    `review_opinion` TEXT COMMENT '审核意见',
    `complete_result` VARCHAR(255) DEFAULT NULL COMMENT '办理结果',
    `result_document_no` VARCHAR(128) DEFAULT NULL COMMENT '结果文书号',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_apply_no` (`apply_no`),
    KEY `idx_item_id` (`item_id`),
    KEY `idx_applicant_id_card` (`applicant_id_card`),
    KEY `idx_apply_status` (`apply_status`),
    KEY `idx_apply_time` (`apply_time`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_department_code` (`department_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='申办记录表';

-- =================================================================================
-- 4. 办理进度表
-- =================================================================================
DROP TABLE IF EXISTS `service_progress`;
CREATE TABLE `service_progress` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `apply_id` BIGINT NOT NULL COMMENT '申办ID',
    `apply_no` VARCHAR(64) NOT NULL COMMENT '申办编号',
    `node_order` INT NOT NULL COMMENT '节点顺序',
    `node_name` VARCHAR(128) NOT NULL COMMENT '节点名称',
    `node_desc` VARCHAR(500) DEFAULT NULL COMMENT '节点描述',
    `node_status` TINYINT NOT NULL DEFAULT 0 COMMENT '节点状态 0待处理 1处理中 2已完成 3已跳过',
    `operator_name` VARCHAR(64) DEFAULT NULL COMMENT '操作人姓名',
    `operator_dept` VARCHAR(128) DEFAULT NULL COMMENT '操作人部门',
    `arrive_time` DATETIME DEFAULT NULL COMMENT '到达时间',
    `finish_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `duration_minutes` INT DEFAULT NULL COMMENT '耗时（分钟）',
    `opinion` TEXT COMMENT '处理意见',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_apply_id` (`apply_id`),
    KEY `idx_apply_no` (`apply_no`),
    KEY `idx_node_order` (`apply_id`, `node_order`),
    KEY `idx_node_status` (`node_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='办理进度表';

-- =================================================================================
-- 5. 申报材料表
-- =================================================================================
DROP TABLE IF EXISTS `apply_material`;
CREATE TABLE `apply_material` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `apply_id` BIGINT NOT NULL COMMENT '申办ID',
    `apply_no` VARCHAR(64) NOT NULL COMMENT '申办编号',
    `item_id` BIGINT DEFAULT NULL COMMENT '事项ID',
    `material_name` VARCHAR(255) NOT NULL COMMENT '材料名称',
    `material_code` VARCHAR(64) DEFAULT NULL COMMENT '材料编码',
    `material_type` TINYINT NOT NULL DEFAULT 0 COMMENT '材料类型 0原件 1复印件 2电子件',
    `source_type` VARCHAR(32) NOT NULL DEFAULT 'UPLOAD' COMMENT '来源类型 UPLOAD上传/CERTIFICATE电子证照/SHARED数据共享/AUTO自动填充',
    `certificate_no` VARCHAR(128) DEFAULT NULL COMMENT '证照编号',
    `certificate_type` VARCHAR(64) DEFAULT NULL COMMENT '证照类型',
    `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
    `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
    `file_size` BIGINT DEFAULT NULL COMMENT '文件大小（字节）',
    `file_md5` VARCHAR(64) DEFAULT NULL COMMENT '文件MD5',
    `is_required` TINYINT NOT NULL DEFAULT 1 COMMENT '是否必须 0否 1是',
    `is_auto_filled` TINYINT NOT NULL DEFAULT 0 COMMENT '是否自动填充 0否 1是',
    `data_source` VARCHAR(128) DEFAULT NULL COMMENT '数据来源系统标识',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_apply_id` (`apply_id`),
    KEY `idx_apply_no` (`apply_no`),
    KEY `idx_item_id` (`item_id`),
    KEY `idx_source_type` (`source_type`),
    KEY `idx_certificate_no` (`certificate_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='申报材料表';

-- =================================================================================
-- 初始化数据 - 服务分类（一级）
-- =================================================================================
INSERT INTO `service_category` (`id`, `category_code`, `category_name`, `parent_id`, `level`, `sort_num`, `item_count`, `description`) VALUES
(1, 'SOCIAL_SECURITY', '社会保障', 0, 1, 1, 380, '养老保险、失业保险、工伤保险等社会保障服务'),
(2, 'MEDICAL_INSURANCE', '医疗保险', 0, 1, 2, 260, '基本医疗保险、大病保险、医疗救助等'),
(3, 'REAL_ESTATE', '不动产', 0, 1, 3, 210, '不动产登记、房产交易、产权变更等'),
(4, 'HOUSEHOLD', '户籍', 0, 1, 4, 180, '户籍登记、迁移、变更、注销等'),
(5, 'HOUSING_FUND', '公积金', 0, 1, 5, 150, '住房公积金缴存、提取、贷款等'),
(6, 'TAXATION', '税务', 0, 1, 6, 320, '税务登记、纳税申报、发票管理等'),
(7, 'EDUCATION', '教育', 0, 1, 7, 290, '入学报名、学籍管理、教师资格等'),
(8, 'CIVIL_AFFAIRS', '民政', 0, 1, 8, 240, '婚姻登记、低保救助、殡葬服务等'),
(9, 'EMPLOYMENT', '就业创业', 0, 1, 9, 200, '就业登记、创业扶持、职业培训等'),
(10, 'TRANSPORT', '交通出行', 0, 1, 10, 160, '驾驶证、车辆登记、交通违法处理等'),
(11, 'HEALTH', '医疗卫生', 0, 1, 11, 190, '医疗机构执业许可、医师注册等'),
(12, 'CONSTRUCTION', '住房建设', 0, 1, 12, 170, '建筑施工许可、房产管理、物业管理等'),
(13, 'ENVIRONMENT', '生态环境', 0, 1, 13, 120, '环评审批、排污许可、生态保护等'),
(14, 'CULTURE', '文化旅游', 0, 1, 14, 100, '文化经营许可、旅游服务、文物保护等'),
(15, 'JUSTICE', '司法公证', 0, 1, 15, 130, '公证办理、法律援助、司法鉴定等'),
(16, 'BUSINESS', '商事登记', 0, 1, 16, 280, '企业注册、变更注销、行政许可等');

-- =================================================================================
-- 初始化数据 - 服务分类（二级 - 部分示例）
-- =================================================================================
INSERT INTO `service_category` (`id`, `category_code`, `category_name`, `parent_id`, `level`, `sort_num`, `item_count`, `description`) VALUES
(101, 'SOCIAL_SECURITY_PENSION', '养老保险', 1, 2, 1, 85, '城镇职工/城乡居民养老保险'),
(102, 'SOCIAL_SECURITY_UNEMPLOYMENT', '失业保险', 1, 2, 2, 60, '失业保险金申领、登记等'),
(103, 'SOCIAL_SECURITY_WORK_INJURY', '工伤保险', 1, 2, 3, 55, '工伤认定、劳动能力鉴定等'),
(104, 'SOCIAL_SECURITY_BENEFIT', '社保待遇', 1, 2, 4, 90, '社保待遇申领、资格认证等'),
(201, 'MEDICAL_BASIC', '基本医保', 2, 2, 1, 80, '参保登记、医保报销等'),
(202, 'MEDICAL_SERIOUS_ILLNESS', '大病保险', 2, 2, 2, 50, '大病保险报销、异地就医等'),
(203, 'MEDICAL_ASSISTANCE', '医疗救助', 2, 2, 3, 45, '医疗救助申请、费用减免等'),
(301, 'REAL_ESTATE_REGISTER', '不动产登记', 3, 2, 1, 70, '首次登记、转移登记、变更登记等'),
(302, 'REAL_ESTATE_QUERY', '房产查询', 3, 2, 2, 40, '产权查询、档案查询等'),
(401, 'HOUSEHOLD_REGISTER', '户籍登记', 4, 2, 1, 60, '出生登记、迁入迁出等'),
(402, 'HOUSEHOLD_CHANGE', '户籍变更', 4, 2, 2, 45, '信息变更、更正等'),
(501, 'FUND_DEPOSIT', '公积金缴存', 5, 2, 1, 40, '开户、缴存、封存等'),
(502, 'FUND_EXTRACT', '公积金提取', 5, 2, 2, 50, '购房提取、租房提取等'),
(503, 'FUND_LOAN', '公积金贷款', 5, 2, 3, 55, '贷款申请、还款等');

-- =================================================================================
-- 初始化数据 - 服务事项（示例数据）
-- =================================================================================
INSERT INTO `service_item` (`id`, `item_code`, `item_name`, `category_id`, `category_code`, `department`, `department_code`, `service_status`, `service_type`, `service_object`, `is_online`, `process_days`, `sort_num`, `tags`) VALUES
(1, 'GZ-SB-001', '城镇职工基本养老保险参保登记', 101, 'SOCIAL_SECURITY_PENSION', '贵州省人力资源和社会保障厅', 'DEPT-HRSS', 1, '行政确认', '自然人', 1, 15, 1, '养老保险,参保,职工'),
(2, 'GZ-SB-002', '城乡居民基本养老保险参保登记', 101, 'SOCIAL_SECURITY_PENSION', '贵州省人力资源和社会保障厅', 'DEPT-HRSS', 1, '行政确认', '自然人', 1, 10, 2, '养老保险,参保,居民'),
(3, 'GZ-SB-003', '失业保险金申领', 102, 'SOCIAL_SECURITY_UNEMPLOYMENT', '贵州省人力资源和社会保障厅', 'DEPT-HRSS', 1, '行政给付', '自然人', 1, 5, 1, '失业保险,申领'),
(4, 'GZ-SB-004', '工伤保险认定', 103, 'SOCIAL_SECURITY_WORK_INJURY', '贵州省人力资源和社会保障厅', 'DEPT-HRSS', 1, '行政确认', '自然人', 1, 60, 1, '工伤,认定'),
(5, 'GZ-YB-001', '基本医疗保险参保登记', 201, 'MEDICAL_BASIC', '贵州省医疗保障局', 'DEPT-HSA', 1, '行政确认', '自然人', 1, 10, 1, '医保,参保'),
(6, 'GZ-YB-002', '异地就医备案', 202, 'MEDICAL_SERIOUS_ILLNESS', '贵州省医疗保障局', 'DEPT-HSA', 1, '公共服务', '自然人', 1, 3, 1, '异地就医,备案'),
(7, 'GZ-YB-003', '医疗救助申请', 203, 'MEDICAL_ASSISTANCE', '贵州省医疗保障局', 'DEPT-HSA', 1, '行政给付', '自然人', 1, 20, 1, '医疗救助,申请'),
(8, 'GZ-DC-001', '不动产首次登记', 301, 'REAL_ESTATE_REGISTER', '贵州省自然资源厅', 'DEPT-NR', 1, '行政确认', '自然人,法人', 1, 30, 1, '不动产,首次登记'),
(9, 'GZ-DC-002', '不动产转移登记', 301, 'REAL_ESTATE_REGISTER', '贵州省自然资源厅', 'DEPT-NR', 1, '行政确认', '自然人,法人', 1, 15, 2, '不动产,转移登记'),
(10, 'GZ-HJ-001', '出生登记', 401, 'HOUSEHOLD_REGISTER', '贵州省公安厅', 'DEPT-PS', 1, '行政确认', '自然人', 1, 1, 1, '户籍,出生登记'),
(11, 'GZ-HJ-002', '户口迁入', 401, 'HOUSEHOLD_REGISTER', '贵州省公安厅', 'DEPT-PS', 1, '行政确认', '自然人', 1, 15, 2, '户籍,迁入'),
(12, 'GZ-GJJ-001', '住房公积金提取-购房', 502, 'FUND_EXTRACT', '贵州省住房和城乡建设厅', 'DEPT-HURD', 1, '行政确认', '自然人', 1, 5, 1, '公积金,提取,购房'),
(13, 'GZ-GJJ-002', '住房公积金贷款申请', 503, 'FUND_LOAN', '贵州省住房和城乡建设厅', 'DEPT-HURD', 1, '行政确认', '自然人', 1, 15, 1, '公积金,贷款'),
(14, 'GZ-SW-001', '增值税一般纳税人登记', 6, 'TAXATION', '国家税务总局贵州省税务局', 'DEPT-TAX', 1, '行政确认', '法人', 1, 5, 1, '税务,增值税,登记'),
(15, 'GZ-JY-001', '义务教育入学报名', 7, 'EDUCATION', '贵州省教育厅', 'DEPT-EDU', 1, '公共服务', '自然人', 1, 10, 1, '教育,入学,报名'),
(16, 'GZ-MZ-001', '婚姻登记', 8, 'CIVIL_AFFAIRS', '贵州省民政厅', 'DEPT-CA', 1, '行政确认', '自然人', 1, 1, 1, '婚姻,登记'),
(17, 'GZ-JT-001', '机动车驾驶证申领', 10, 'TRANSPORT', '贵州省公安厅交通管理局', 'DEPT-TM', 1, '行政许可', '自然人', 0, 30, 1, '驾驶证,申领'),
(18, 'GZ-JM-001', '低收入家庭认定', 8, 'CIVIL_AFFAIRS', '贵州省民政厅', 'DEPT-CA', 1, '行政确认', '自然人', 1, 20, 2, '低保,认定'),
(19, 'GZ-SY-001', '个体工商户注册登记', 16, 'BUSINESS', '贵州省市场监督管理局', 'DEPT-SAMR', 1, '行政许可', '自然人', 1, 3, 1, '商事,个体,注册'),
(20, 'GZ-SY-002', '企业设立登记', 16, 'BUSINESS', '贵州省市场监督管理局', 'DEPT-SAMR', 1, '行政许可', '法人', 1, 5, 2, '商事,企业,设立');

-- =================================================================================
-- 创建索引说明
-- =================================================================================
-- 所有表均已建立必要索引，包括：
-- 1. 主键索引（唯一）
-- 2. 业务编号唯一索引
-- 3. 外键关联索引
-- 4. 状态查询索引
-- 5. 时间范围查询索引
-- 6. 全文检索索引（service_item.item_name）
-- 7. 分类及部门筛选索引
