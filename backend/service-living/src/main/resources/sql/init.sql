-- =================================================================================
-- 贵州省数字服务平台 - 生活服务模块 数据库初始化脚本
-- Database: living_db
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `living_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `living_db`;

-- =================================================================================
-- 1. 生活服务分类表
-- =================================================================================
DROP TABLE IF EXISTS `living_category`;
CREATE TABLE `living_category` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `category_code` VARCHAR(64) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(128) NOT NULL COMMENT '分类名称',
    `category_icon` VARCHAR(500) DEFAULT NULL COMMENT '分类图标',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID 0为顶级',
    `sort_num` INT NOT NULL DEFAULT 0 COMMENT '排序号',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
    `enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0否 1是',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`category_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活服务分类表';

-- =================================================================================
-- 2. 服务商表
-- =================================================================================
DROP TABLE IF EXISTS `service_provider`;
CREATE TABLE `service_provider` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `provider_code` VARCHAR(64) NOT NULL COMMENT '服务商编码',
    `provider_name` VARCHAR(255) NOT NULL COMMENT '服务商名称',
    `category_code` VARCHAR(64) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(128) NOT NULL COMMENT '分类名称',
    `provider_status` TINYINT NOT NULL DEFAULT 0 COMMENT '服务商状态 0待审核 1审核通过 2审核驳回 3营业中 4已暂停 5已拉黑',
    `contact_name` VARCHAR(64) NOT NULL COMMENT '联系人',
    `contact_phone` VARCHAR(16) NOT NULL COMMENT '联系电话',
    `business_license` VARCHAR(128) NOT NULL COMMENT '营业执照号',
    `legal_person` VARCHAR(64) NOT NULL COMMENT '法人',
    `legal_id_card` VARCHAR(32) NOT NULL COMMENT '法人身份证',
    `province` VARCHAR(32) DEFAULT NULL COMMENT '省',
    `city` VARCHAR(32) DEFAULT NULL COMMENT '市',
    `district` VARCHAR(32) DEFAULT NULL COMMENT '区/县',
    `address` VARCHAR(500) DEFAULT NULL COMMENT '详细地址',
    `min_price` DECIMAL(10,2) DEFAULT NULL COMMENT '最低价格',
    `max_price` DECIMAL(10,2) DEFAULT NULL COMMENT '最高价格',
    `service_area` VARCHAR(500) DEFAULT NULL COMMENT '服务区域',
    `description` TEXT COMMENT '服务商简介',
    `qualifications` VARCHAR(1000) DEFAULT NULL COMMENT '资质证书(多个逗号分隔)',
    `cover_image` VARCHAR(500) DEFAULT NULL COMMENT '封面图片',
    `avg_score` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '平均评分',
    `total_orders` INT NOT NULL DEFAULT 0 COMMENT '总订单数',
    `total_evaluates` INT NOT NULL DEFAULT 0 COMMENT '总评价数',
    `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_provider_code` (`provider_code`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_provider_status` (`provider_status`),
    KEY `idx_business_license` (`business_license`),
    KEY `idx_avg_score` (`avg_score`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务商表';

-- =================================================================================
-- 3. 服务人员表
-- =================================================================================
DROP TABLE IF EXISTS `service_provider_staff`;
CREATE TABLE `service_provider_staff` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `provider_id` BIGINT NOT NULL COMMENT '服务商ID',
    `staff_name` VARCHAR(64) NOT NULL COMMENT '姓名',
    `staff_phone` VARCHAR(16) NOT NULL COMMENT '手机号',
    `id_card` VARCHAR(32) NOT NULL COMMENT '身份证号',
    `category_code` VARCHAR(64) DEFAULT NULL COMMENT '技能分类编码',
    `category_name` VARCHAR(128) DEFAULT NULL COMMENT '技能分类名称',
    `skill_cert` VARCHAR(500) DEFAULT NULL COMMENT '技能证书',
    `health_cert` VARCHAR(500) DEFAULT NULL COMMENT '健康证',
    `work_years` INT DEFAULT 0 COMMENT '从业年限',
    `skill_tags` VARCHAR(500) DEFAULT NULL COMMENT '技能标签(多个逗号分隔)',
    `avg_score` DECIMAL(3,1) NOT NULL DEFAULT 0.0 COMMENT '平均评分',
    `total_orders` INT NOT NULL DEFAULT 0 COMMENT '总订单数',
    `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像',
    `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `staff_status` TINYINT NOT NULL DEFAULT 1 COMMENT '人员状态 0离职 1在岗 2休假',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_provider_id` (`provider_id`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_staff_status` (`staff_status`),
    KEY `idx_avg_score` (`avg_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务人员表';

-- =================================================================================
-- 4. 预约订单表
-- =================================================================================
DROP TABLE IF EXISTS `service_booking`;
CREATE TABLE `service_booking` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `booking_no` VARCHAR(64) NOT NULL COMMENT '预约编号',
    `provider_id` BIGINT NOT NULL COMMENT '服务商ID',
    `provider_name` VARCHAR(255) DEFAULT NULL COMMENT '服务商名称',
    `staff_id` BIGINT DEFAULT NULL COMMENT '服务人员ID',
    `staff_name` VARCHAR(64) DEFAULT NULL COMMENT '服务人员姓名',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `user_name` VARCHAR(64) DEFAULT NULL COMMENT '用户姓名',
    `user_phone` VARCHAR(16) DEFAULT NULL COMMENT '用户手机号',
    `category_code` VARCHAR(64) NOT NULL COMMENT '分类编码',
    `category_name` VARCHAR(128) DEFAULT NULL COMMENT '分类名称',
    `service_name` VARCHAR(255) NOT NULL COMMENT '服务名称',
    `service_price` DECIMAL(10,2) NOT NULL COMMENT '服务价格',
    `booking_status` TINYINT NOT NULL DEFAULT 0 COMMENT '预约状态 0待派单 1已派单 2服务确认中 3服务中 4已完成 5已取消 6已退款 7争议中',
    `appointment_time` DATETIME NOT NULL COMMENT '预约时间',
    `appointment_address` VARCHAR(500) NOT NULL COMMENT '预约地址',
    `service_duration` VARCHAR(32) DEFAULT NULL COMMENT '服务时长',
    `requirement` TEXT COMMENT '用户需求',
    `assign_by` BIGINT DEFAULT NULL COMMENT '派单人ID',
    `assign_by_name` VARCHAR(64) DEFAULT NULL COMMENT '派单人姓名',
    `assign_time` DATETIME DEFAULT NULL COMMENT '派单时间',
    `confirm_time` DATETIME DEFAULT NULL COMMENT '确认时间',
    `start_time` DATETIME DEFAULT NULL COMMENT '开始服务时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '结束服务时间',
    `actual_price` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '实际价格',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '取消原因',
    `cancel_time` DATETIME DEFAULT NULL COMMENT '取消时间',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_booking_no` (`booking_no`),
    KEY `idx_provider_id` (`provider_id`),
    KEY `idx_staff_id` (`staff_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_category_code` (`category_code`),
    KEY `idx_booking_status` (`booking_status`),
    KEY `idx_appointment_time` (`appointment_time`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约订单表';

-- =================================================================================
-- 5. 服务评价表
-- =================================================================================
DROP TABLE IF EXISTS `service_evaluate`;
CREATE TABLE `service_evaluate` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `booking_id` BIGINT NOT NULL COMMENT '预约ID',
    `booking_no` VARCHAR(64) DEFAULT NULL COMMENT '预约编号',
    `provider_id` BIGINT NOT NULL COMMENT '服务商ID',
    `staff_id` BIGINT DEFAULT NULL COMMENT '服务人员ID',
    `staff_name` VARCHAR(64) DEFAULT NULL COMMENT '服务人员姓名',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `user_name` VARCHAR(64) DEFAULT NULL COMMENT '用户姓名',
    `score` DECIMAL(3,1) NOT NULL COMMENT '综合评分',
    `attitude_score` INT NOT NULL COMMENT '态度评分',
    `quality_score` INT NOT NULL COMMENT '质量评分',
    `timeliness_score` INT NOT NULL COMMENT '时效评分',
    `content` TEXT COMMENT '评价内容',
    `images` VARCHAR(1000) DEFAULT NULL COMMENT '评价图片(多个逗号分隔)',
    `anonymous` TINYINT NOT NULL DEFAULT 0 COMMENT '是否匿名 0否 1是',
    `reply_content` TEXT COMMENT '回复内容',
    `reply_by` BIGINT DEFAULT NULL COMMENT '回复人ID',
    `reply_by_name` VARCHAR(64) DEFAULT NULL COMMENT '回复人姓名',
    `reply_time` DATETIME DEFAULT NULL COMMENT '回复时间',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志 0未删除 1已删除',
    PRIMARY KEY (`id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_provider_id` (`provider_id`),
    KEY `idx_staff_id` (`staff_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_score` (`score`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务评价表';

-- =================================================================================
-- 初始化数据 - 生活服务分类
-- =================================================================================
INSERT INTO `living_category` (`id`, `category_code`, `category_name`, `category_icon`, `parent_id`, `sort_num`, `description`, `enabled`) VALUES
(1, 'HOUSEKEEPING', '家政', 'icon-housekeeping', 0, 1, '家政服务：保姆、月嫂、钟点工等', 1),
(2, 'CLEANING', '保洁', 'icon-cleaning', 0, 2, '保洁服务：日常保洁、深度保洁、开荒保洁等', 1),
(3, 'REPAIR', '维修', 'icon-repair', 0, 3, '维修服务：水电维修、门窗维修等', 1),
(4, 'DECORATION', '装修', 'icon-decoration', 0, 4, '装修服务：家装、工装、软装等', 1),
(5, 'MOVING', '搬家', 'icon-moving', 0, 5, '搬家服务：居民搬家、公司搬迁等', 1),
(6, 'TRANSPORT', '出行', 'icon-transport', 0, 6, '出行服务：代驾、接送机、包车等', 1),
(7, 'EXPRESS', '快递', 'icon-express', 0, 7, '快递服务：同城配送、跑腿代办等', 1),
(8, 'PIPELINE', '管道疏通', 'icon-pipeline', 3, 8, '管道疏通服务：下水道、马桶疏通等', 1),
(9, 'APPLIANCE', '家电维修', 'icon-appliance', 3, 9, '家电维修服务：空调、冰箱、洗衣机等', 1);

-- =================================================================================
-- 初始化数据 - 示例服务商
-- =================================================================================
INSERT INTO `service_provider` (`id`, `provider_code`, `provider_name`, `category_code`, `category_name`, `provider_status`, `contact_name`, `contact_phone`, `business_license`, `legal_person`, `legal_id_card`, `province`, `city`, `district`, `address`, `min_price`, `max_price`, `service_area`, `description`, `avg_score`, `total_orders`, `total_evaluates`, `remark`) VALUES
(1, 'P20240001', '黔城家政服务中心', 'HOUSEKEEPING', '家政', 3, '王经理', '13985001234', '91520100MA6XXXXX1', '王某某', '520102199001011234', '贵州省', '贵阳市', '南明区', '贵阳市南明区花果园大街1号', 80.00, 300.00, '贵阳市全域', '贵阳市知名家政服务公司，提供保姆、月嫂、钟点工等一站式家政服务', 4.5, 256, 180, NULL),
(2, 'P20240002', '爽洁净保洁有限公司', 'CLEANING', '保洁', 3, '李经理', '13985005678', '91520100MA6XXXXX2', '李某某', '520102198505052345', '贵州省', '贵阳市', '观山湖区', '贵阳市观山湖区金融城MAX写字楼', 50.00, 200.00, '贵阳市全域', '专业保洁团队，承接日常保洁、深度保洁、开荒保洁等业务', 4.8, 520, 380, NULL),
(3, 'P20240003', '修得快家装维修', 'REPAIR', '维修', 3, '张师傅', '13985009876', '91520100MA6XXXXX3', '张某某', '520102199203033456', '贵州省', '贵阳市', '云岩区', '贵阳市云岩区北京路168号', 30.00, 500.00, '贵阳市全域', '水电维修、门窗维修、防水补漏等专业维修服务', 4.3, 189, 120, NULL),
(4, 'P20240004', '黔匠装饰工程有限公司', 'DECORATION', '装修', 3, '赵总', '13985003456', '91520100MA6XXXXX4', '赵某某', '520102198808084567', '贵州省', '贵阳市', '观山湖区', '贵阳市观山湖区世纪城写字楼B座', 50000.00, 500000.00, '贵州省全域', '贵州本土装饰企业，承接家装、工装、软装设计施工', 4.6, 98, 72, NULL),
(5, 'P20240005', '蚂蚁搬家贵阳分公司', 'MOVING', '搬家', 3, '陈经理', '13985007890', '91520100MA6XXXXX5', '陈某某', '520102199506065678', '贵州省', '贵阳市', '南明区', '贵阳市南明区遵义路105号', 200.00, 2000.00, '贵阳市全域', '全国连锁搬家品牌贵阳分公司，居民搬家、公司搬迁、长途搬家', 4.4, 312, 220, NULL);

-- =================================================================================
-- 初始化数据 - 示例服务人员
-- =================================================================================
INSERT INTO `service_provider_staff` (`id`, `provider_id`, `staff_name`, `staff_phone`, `id_card`, `category_code`, `category_name`, `skill_cert`, `health_cert`, `work_years`, `skill_tags`, `avg_score`, `total_orders`, `staff_status`) VALUES
(1, 1, '刘阿姨', '15985001111', '520102198001011111', 'HOUSEKEEPING', '家政', '高级育婴师证', 'HC20240001', 8, '月嫂,育婴,保姆', 4.8, 56, 1),
(2, 1, '杨姐', '15985002222', '520102198505052222', 'HOUSEKEEPING', '家政', '家政服务员证', 'HC20240002', 5, '钟点工,保洁,做饭', 4.5, 38, 1),
(3, 2, '小周', '15985003333', '520102199203033333', 'CLEANING', '保洁', '保洁员证', 'HC20240003', 3, '日常保洁,深度保洁', 4.9, 85, 1),
(4, 3, '王师傅', '15985004444', '520102197808084444', 'REPAIR', '维修', '电工证,水暖工证', 'HC20240004', 12, '水电维修,灯具安装', 4.6, 42, 1),
(5, 4, '吴设计师', '15985005555', '520102199010105555', 'DECORATION', '装修', '室内设计师证', NULL, 7, '家装设计,软装搭配', 4.7, 28, 1);

-- =================================================================================
-- 创建索引说明
-- =================================================================================
-- 所有表均已建立必要索引，包括：
-- 1. 主键索引（唯一）
-- 2. 业务编号唯一索引
-- 3. 外键关联索引
-- 4. 状态查询索引
-- 5. 评分排序索引
-- 6. 时间范围查询索引
