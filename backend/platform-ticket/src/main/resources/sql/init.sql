-- =================================================================================
-- 贵州省数字服务平台 - 市民诉求智能分拨引擎 数据库初始化脚本
-- Database: ticket_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `ticket_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ticket_db`;

-- =================================================================================
-- 1. 工单主表
-- =================================================================================
DROP TABLE IF EXISTS `ticket`;
CREATE TABLE `ticket` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `ticket_no` VARCHAR(64) NOT NULL COMMENT '工单编号',
    `title` VARCHAR(255) NOT NULL COMMENT '工单标题',
    `content` TEXT NOT NULL COMMENT '工单内容',
    `category` TINYINT NOT NULL DEFAULT 0 COMMENT '工单分类 0咨询 1投诉 2建议 3求助 4举报',
    `priority` TINYINT NOT NULL DEFAULT 1 COMMENT '优先级 0低 1中 2高 3紧急',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '工单状态 0待受理 1已分派 2处理中 3待确认 4已完成 5已关闭',
    `source` TINYINT NOT NULL DEFAULT 0 COMMENT '来源 0APP 1小程序 2网站 312345热线',
    `citizen_name` VARCHAR(64) NOT NULL COMMENT '市民姓名',
    `citizen_phone` VARCHAR(16) NOT NULL COMMENT '市民电话',
    `citizen_id_card` VARCHAR(32) DEFAULT NULL COMMENT '市民身份证号',
    `region_code` VARCHAR(16) DEFAULT NULL COMMENT '区域编码',
    `region_name` VARCHAR(128) DEFAULT NULL COMMENT '区域名称',
    `address` VARCHAR(500) DEFAULT NULL COMMENT '详细地址',
    `department_id` BIGINT DEFAULT NULL COMMENT '处理部门ID',
    `department_name` VARCHAR(128) DEFAULT NULL COMMENT '处理部门名称',
    `handler_id` BIGINT DEFAULT NULL COMMENT '处理人ID',
    `handler_name` VARCHAR(64) DEFAULT NULL COMMENT '处理人姓名',
    `assign_time` DATETIME DEFAULT NULL COMMENT '分派时间',
    `deadline` DATETIME DEFAULT NULL COMMENT '截止时间',
    `complete_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `close_time` DATETIME DEFAULT NULL COMMENT '关闭时间',
    `satisfaction` TINYINT DEFAULT NULL COMMENT '满意度评分 1-5',
    `satisfaction_content` VARCHAR(500) DEFAULT NULL COMMENT '满意度评价内容',
    `nlp_category` VARCHAR(64) DEFAULT NULL COMMENT 'NLP识别分类',
    `nlp_keywords` VARCHAR(500) DEFAULT NULL COMMENT 'NLP提取关键词',
    `nlp_confidence` DOUBLE DEFAULT NULL COMMENT 'NLP置信度',
    `dispatch_type` TINYINT DEFAULT NULL COMMENT '分拨类型 0自动 1人工 2需人工',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ticket_no` (`ticket_no`),
    KEY `idx_status` (`status`),
    KEY `idx_category` (`category`),
    KEY `idx_priority` (`priority`),
    KEY `idx_source` (`source`),
    KEY `idx_department_id` (`department_id`),
    KEY `idx_region_code` (`region_code`),
    KEY `idx_citizen_phone` (`citizen_phone`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单主表';

-- =================================================================================
-- 2. 分拨记录表
-- =================================================================================
DROP TABLE IF EXISTS `ticket_dispatch`;
CREATE TABLE `ticket_dispatch` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `ticket_id` BIGINT NOT NULL COMMENT '工单ID',
    `ticket_no` VARCHAR(64) NOT NULL COMMENT '工单编号',
    `from_department_id` BIGINT DEFAULT NULL COMMENT '原部门ID',
    `from_department_name` VARCHAR(128) DEFAULT NULL COMMENT '原部门名称',
    `to_department_id` BIGINT NOT NULL COMMENT '目标部门ID',
    `to_department_name` VARCHAR(128) NOT NULL COMMENT '目标部门名称',
    `to_handler_id` BIGINT DEFAULT NULL COMMENT '目标处理人ID',
    `to_handler_name` VARCHAR(64) DEFAULT NULL COMMENT '目标处理人姓名',
    `dispatch_type` TINYINT NOT NULL COMMENT '分拨类型 0自动 1人工 2退回重派',
    `dispatch_reason` VARCHAR(500) DEFAULT NULL COMMENT '分拨原因',
    `match_score` DOUBLE DEFAULT NULL COMMENT '匹配分数',
    `nlp_category` VARCHAR(64) DEFAULT NULL COMMENT 'NLP分类',
    `nlp_keywords` VARCHAR(500) DEFAULT NULL COMMENT 'NLP关键词',
    `nlp_confidence` DOUBLE DEFAULT NULL COMMENT 'NLP置信度',
    `dispatch_status` TINYINT NOT NULL DEFAULT 0 COMMENT '分拨状态 0待接受 1已接受 2已拒绝',
    `dispatch_time` DATETIME NOT NULL COMMENT '分拨时间',
    `accept_time` DATETIME DEFAULT NULL COMMENT '接受时间',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_ticket_id` (`ticket_id`),
    KEY `idx_to_department_id` (`to_department_id`),
    KEY `idx_dispatch_type` (`dispatch_type`),
    KEY `idx_dispatch_status` (`dispatch_status`),
    KEY `idx_nlp_category` (`nlp_category`),
    KEY `idx_dispatch_time` (`dispatch_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分拨记录表';

-- =================================================================================
-- 3. 处理记录表
-- =================================================================================
DROP TABLE IF EXISTS `ticket_process`;
CREATE TABLE `ticket_process` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `ticket_id` BIGINT NOT NULL COMMENT '工单ID',
    `ticket_no` VARCHAR(64) NOT NULL COMMENT '工单编号',
    `process_type` TINYINT NOT NULL COMMENT '处理类型 1分派 2处理反馈 3市民确认 4关闭 5转派',
    `process_content` TEXT NOT NULL COMMENT '处理内容',
    `operator_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
    `operator_name` VARCHAR(64) DEFAULT NULL COMMENT '操作人姓名',
    `operator_dept` VARCHAR(128) DEFAULT NULL COMMENT '操作人部门',
    `process_time` DATETIME NOT NULL COMMENT '处理时间',
    `attachment` VARCHAR(500) DEFAULT NULL COMMENT '附件',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_ticket_id` (`ticket_id`),
    KEY `idx_process_type` (`process_type`),
    KEY `idx_process_time` (`process_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='处理记录表';

-- =================================================================================
-- 4. 热线消息表
-- =================================================================================
DROP TABLE IF EXISTS `hotline_message`;
CREATE TABLE `hotline_message` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `message_id` VARCHAR(64) NOT NULL COMMENT '消息ID',
    `call_id` VARCHAR(64) DEFAULT NULL COMMENT '通话ID',
    `caller_number` VARCHAR(16) NOT NULL COMMENT '来电号码',
    `callee_number` VARCHAR(16) DEFAULT NULL COMMENT '被叫号码',
    `call_time` DATETIME NOT NULL COMMENT '通话时间',
    `call_duration` INT DEFAULT NULL COMMENT '通话时长(秒)',
    `caller_name` VARCHAR(64) DEFAULT NULL COMMENT '来电人姓名',
    `caller_id_card` VARCHAR(32) DEFAULT NULL COMMENT '来电人身份证号',
    `call_content` TEXT COMMENT '通话内容',
    `message_type` TINYINT NOT NULL DEFAULT 0 COMMENT '消息类型 0来电 1来信 2来访',
    `process_status` TINYINT NOT NULL DEFAULT 0 COMMENT '处理状态 0待处理 1已处理 2已忽略',
    `ticket_id` BIGINT DEFAULT NULL COMMENT '关联工单ID',
    `ticket_no` VARCHAR(64) DEFAULT NULL COMMENT '关联工单编号',
    `region_code` VARCHAR(16) DEFAULT NULL COMMENT '区域编码',
    `region_name` VARCHAR(128) DEFAULT NULL COMMENT '区域名称',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_message_id` (`message_id`),
    KEY `idx_call_time` (`call_time`),
    KEY `idx_process_status` (`process_status`),
    KEY `idx_caller_number` (`caller_number`),
    KEY `idx_ticket_no` (`ticket_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热线消息表';

-- =================================================================================
-- 5. 知识库文章表
-- =================================================================================
DROP TABLE IF EXISTS `knowledge_article`;
CREATE TABLE `knowledge_article` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `article_no` VARCHAR(64) NOT NULL COMMENT '文章编号',
    `title` VARCHAR(255) NOT NULL COMMENT '标题',
    `content` TEXT NOT NULL COMMENT '内容',
    `summary` VARCHAR(500) DEFAULT NULL COMMENT '摘要',
    `category` VARCHAR(64) DEFAULT NULL COMMENT '分类',
    `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签',
    `keywords` VARCHAR(500) DEFAULT NULL COMMENT '关键词',
    `department_id` BIGINT DEFAULT NULL COMMENT '所属部门ID',
    `department_name` VARCHAR(128) DEFAULT NULL COMMENT '所属部门名称',
    `article_status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 0草稿 1已发布 2已下架',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
    `helpful_count` INT NOT NULL DEFAULT 0 COMMENT '有用次数',
    `attachment` VARCHAR(500) DEFAULT NULL COMMENT '附件',
    `es_id` VARCHAR(64) DEFAULT NULL COMMENT 'ES文档ID',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_article_no` (`article_no`),
    KEY `idx_category` (`category`),
    KEY `idx_department_id` (`department_id`),
    KEY `idx_article_status` (`article_status`),
    KEY `idx_view_count` (`view_count`),
    FULLTEXT KEY `ft_title_content` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文章表';

-- =================================================================================
-- 6. 部门信息表
-- =================================================================================
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `dept_code` VARCHAR(64) NOT NULL COMMENT '部门编码',
    `dept_name` VARCHAR(128) NOT NULL COMMENT '部门名称',
    `dept_short_name` VARCHAR(64) DEFAULT NULL COMMENT '部门简称',
    `parent_id` BIGINT DEFAULT NULL COMMENT '上级部门ID',
    `parent_code` VARCHAR(64) DEFAULT NULL COMMENT '上级部门编码',
    `dept_level` TINYINT NOT NULL DEFAULT 1 COMMENT '部门层级',
    `region_code` VARCHAR(16) DEFAULT NULL COMMENT '区域编码',
    `region_name` VARCHAR(128) DEFAULT NULL COMMENT '区域名称',
    `responsibility` TEXT COMMENT '职责描述',
    `category_keywords` VARCHAR(500) DEFAULT NULL COMMENT '职责关键词(逗号分隔)',
    `dept_status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 0停用 1启用',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `leader_name` VARCHAR(64) DEFAULT NULL COMMENT '负责人姓名',
    `leader_phone` VARCHAR(16) DEFAULT NULL COMMENT '负责人电话',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_dept_code` (`dept_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_region_code` (`region_code`),
    KEY `idx_dept_status` (`dept_status`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门信息表';

-- =================================================================================
-- 7. 工单分类表
-- =================================================================================
DROP TABLE IF EXISTS `ticket_category`;
CREATE TABLE `ticket_category` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `category_code` VARCHAR(64) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(128) NOT NULL COMMENT '分类名称',
    `parent_id` BIGINT DEFAULT NULL COMMENT '上级分类ID',
    `parent_code` VARCHAR(64) DEFAULT NULL COMMENT '上级分类编码',
    `category_level` TINYINT NOT NULL DEFAULT 1 COMMENT '分类层级',
    `keywords` VARCHAR(500) DEFAULT NULL COMMENT '关键词(逗号分隔)',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
    `default_dept_id` BIGINT DEFAULT NULL COMMENT '默认处理部门ID',
    `default_dept_name` VARCHAR(128) DEFAULT NULL COMMENT '默认处理部门名称',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `category_status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 0停用 1启用',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`category_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_category_status` (`category_status`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单分类表';

-- =================================================================================
-- 初始化数据 - 部门信息
-- =================================================================================
INSERT INTO `department` (`id`, `dept_code`, `dept_name`, `dept_short_name`, `dept_level`, `category_keywords`, `dept_status`, `sort_order`, `leader_name`, `leader_phone`) VALUES
(1, 'DEPT_HOUSING', '住房和城乡建设局', '住建局', 2, '住房,物业,房屋,拆迁,维修,违建,施工', 1, 1, '张局长', '0851-85000001'),
(2, 'DEPT_TRANSPORT', '交通运输局', '交通局', 2, '交通,道路,公交,出租,地铁,停车,路政', 1, 2, '李局长', '0851-85000002'),
(3, 'DEPT_EDUCATION', '教育局', '教育局', 2, '教育,学校,入学,考试,培训,学费,教师', 1, 3, '王局长', '0851-85000003'),
(4, 'DEPT_HEALTH', '卫生健康委员会', '卫健委', 2, '医疗,卫生,医院,防疫,疫苗,就医,健康', 1, 4, '赵局长', '0851-85000004'),
(5, 'DEPT_ENVIRONMENT', '生态环境局', '生态局', 2, '环保,污染,噪音,油烟,废水,废气,排放', 1, 5, '钱局长', '0851-85000005'),
(6, 'DEPT_MARKET', '市场监督管理局', '市监局', 2, '消费,食品,药品,价格,质量,假冒,投诉', 1, 6, '孙局长', '0851-85000006'),
(7, 'DEPT_URBAN', '城市管理局', '城管局', 2, '城管,占道,摊贩,市容,绿化,垃圾,违停', 1, 7, '周局长', '0851-85000007'),
(8, 'DEPT_CIVIL', '民政局', '民政局', 2, '民政,低保,养老,救助,婚姻,殡葬,残疾', 1, 8, '吴局长', '0851-85000008'),
(9, 'DEPT_HR', '人力资源和社会保障局', '人社局', 2, '社保,就业,工资,劳动,医保,养老,公积金', 1, 9, '郑局长', '0851-85000009'),
(10, 'DEPT_PUBLIC', '公安局', '公安局', 2, '治安,犯罪,报警,户籍,交通,消防,安全', 1, 10, '冯局长', '0851-85000010');

-- =================================================================================
-- 初始化数据 - 工单分类
-- =================================================================================
INSERT INTO `ticket_category` (`id`, `category_code`, `category_name`, `category_level`, `keywords`, `description`, `default_dept_id`, `default_dept_name`, `sort_order`, `category_status`) VALUES
(1, 'CAT_CONSULT', '咨询', 1, '咨询,查询,了解,请问,如何,怎么', '市民咨询类诉求', NULL, NULL, 1, 1),
(2, 'CAT_COMPLAINT', '投诉', 1, '投诉,不满,差评,反映,问题,违规,不合理', '市民投诉类诉求', NULL, NULL, 2, 1),
(3, 'CAT_SUGGESTION', '建议', 1, '建议,希望,提议,改善,优化,提升', '市民建议类诉求', NULL, NULL, 3, 1),
(4, 'CAT_HELP', '求助', 1, '求助,困难,帮忙,紧急,急需,无法', '市民求助类诉求', NULL, NULL, 4, 1),
(5, 'CAT_REPORT', '举报', 1, '举报,违法,腐败,违规操作,弄虚作假', '市民举报类诉求', 10, '公安局', 5, 1),
(6, 'CAT_HOUSING', '住房保障', 2, '住房,物业,房屋,拆迁,维修,公租房', '住房保障类诉求', 1, '住房和城乡建设局', 6, 1),
(7, 'CAT_TRANSPORT', '交通出行', 2, '交通,道路,公交,出租,地铁,停车', '交通出行类诉求', 2, '交通运输局', 7, 1),
(8, 'CAT_EDUCATION', '教育入学', 2, '教育,学校,入学,考试,培训', '教育入学类诉求', 3, '教育局', 8, 1),
(9, 'CAT_MEDICAL', '医疗卫生', 2, '医疗,医院,防疫,就医,健康', '医疗卫生类诉求', 4, '卫生健康委员会', 9, 1),
(10, 'CAT_ENVIRONMENT', '环境保护', 2, '环保,污染,噪音,油烟,废水', '环境保护类诉求', 5, '生态环境局', 10, 1),
(11, 'CAT_CONSUMER', '消费维权', 2, '消费,食品,药品,价格,质量,假冒', '消费维权类诉求', 6, '市场监督管理局', 11, 1),
(12, 'CAT_URBAN', '城市管理', 2, '城管,占道,摊贩,市容,绿化,垃圾', '城市管理类诉求', 7, '城市管理局', 12, 1);

-- =================================================================================
-- 初始化数据 - 知识库文章
-- =================================================================================
INSERT INTO `knowledge_article` (`id`, `article_no`, `title`, `content`, `summary`, `category`, `keywords`, `department_id`, `department_name`, `article_status`, `view_count`) VALUES
(1, 'KA001', '贵阳市公租房申请流程', '一、申请条件\n1. 申请人具有贵阳市户籍\n2. 家庭人均收入低于上年度城镇居民人均可支配收入\n3. 无房或人均住房面积低于15平方米\n\n二、申请材料\n1. 申请表\n2. 身份证\n3. 户口簿\n4. 收入证明\n5. 住房情况证明', '公租房申请条件和流程说明', '住房保障', '公租房,住房,申请,保障房', 1, '住房和城乡建设局', 1, 256),
(2, 'KA002', '城镇居民医保缴费指南', '一、缴费时间\n每年9月1日至12月31日\n\n二、缴费标准\n普通居民: 350元/人/年\n低保对象: 87.5元/人/年\n\n三、缴费方式\n1. 线上缴费: 微信/支付宝搜索"贵州税务"\n2. 线下缴费: 前往社区服务中心', '城镇居民医保缴费时间和方式说明', '医疗卫生', '医保,缴费,社保,居民医保', 9, '人力资源和社会保障局', 1, 512),
(3, 'KA003', '噪音扰民投诉处理流程', '一、投诉渠道\n1. 拨打12345热线\n2. 通过"贵阳市民云"APP提交\n3. 向属地社区反映\n\n二、处理流程\n1. 受理投诉\n2. 现场核实\n3. 责令整改\n4. 跟踪反馈\n\n三、处理时限\n一般7个工作日内反馈处理结果', '噪音扰民投诉渠道和处理流程说明', '环境保护', '噪音,扰民,投诉,环保', 5, '生态环境局', 1, 389);

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
-- 7. 全文检索索引（知识库文章表）
