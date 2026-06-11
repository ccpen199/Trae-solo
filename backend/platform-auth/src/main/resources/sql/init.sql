-- ============================================================
-- 贵州省数字服务平台 - 统一身份认证服务 初始化脚本
-- ============================================================

CREATE DATABASE IF NOT EXISTS `guizhou_platform_auth` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `guizhou_platform_auth`;

-- -----------------------------------------------------------
-- 用户表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id`              BIGINT       NOT NULL COMMENT '用户ID',
    `username`        VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`        VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    `nickname`        VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    `real_name`       VARCHAR(50)  DEFAULT NULL COMMENT '真实姓名',
    `id_card`         VARCHAR(18)  DEFAULT NULL COMMENT '身份证号',
    `phone`           VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
    `email`           VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `avatar`          VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender`          INT          DEFAULT 0  COMMENT '性别: 0-未知 1-男 2-女',
    `birthday`        DATE         DEFAULT NULL COMMENT '生日',
    `address`         VARCHAR(255) DEFAULT NULL COMMENT '地址',
    `status`          INT          DEFAULT 1  COMMENT '状态: 0-禁用 1-启用',
    `openid`          VARCHAR(100) DEFAULT NULL COMMENT '微信openid',
    `alipay_id`       VARCHAR(100) DEFAULT NULL COMMENT '支付宝用户ID',
    `face_feature`    TEXT         DEFAULT NULL COMMENT '人脸特征值',
    `login_fail_count` INT         DEFAULT 0  COMMENT '登录失败次数',
    `lock_time`       DATETIME     DEFAULT NULL COMMENT '账号锁定时间',
    `last_login_time` DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip`   VARCHAR(50)  DEFAULT NULL COMMENT '最后登录IP',
    `remark`          VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `create_by`       BIGINT       DEFAULT NULL COMMENT '创建人',
    `create_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`       BIGINT       DEFAULT NULL COMMENT '更新人',
    `update_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         TINYINT(1)   DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`, `deleted`),
    KEY `idx_phone` (`phone`),
    KEY `idx_openid` (`openid`),
    KEY `idx_alipay_id` (`alipay_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- -----------------------------------------------------------
-- 角色表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id`          BIGINT       NOT NULL COMMENT '角色ID',
    `role_code`   VARCHAR(50)  NOT NULL COMMENT '角色编码',
    `role_name`   VARCHAR(50)  NOT NULL COMMENT '角色名称',
    `role_desc`   VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    `status`      INT          DEFAULT 1  COMMENT '状态: 0-禁用 1-启用',
    `sort`        INT          DEFAULT 0  COMMENT '排序',
    `data_scope`  VARCHAR(20)  DEFAULT 'self' COMMENT '数据权限范围: all-全部 dept-本部门 dept_and_child-本部门及下级 self-仅本人',
    `remark`      VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `create_by`   BIGINT       DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`   BIGINT       DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT(1)   DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_code` (`role_code`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色表';

-- -----------------------------------------------------------
-- 权限表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_permission` (
    `id`              BIGINT       NOT NULL COMMENT '权限ID',
    `parent_id`       BIGINT       DEFAULT 0  COMMENT '父级ID',
    `permission_code` VARCHAR(100) NOT NULL COMMENT '权限编码',
    `permission_name` VARCHAR(50)  NOT NULL COMMENT '权限名称',
    `permission_type` VARCHAR(20)  NOT NULL COMMENT '权限类型: menu-菜单 button-按钮 api-接口',
    `path`            VARCHAR(255) DEFAULT NULL COMMENT '路由路径',
    `component`       VARCHAR(255) DEFAULT NULL COMMENT '组件路径',
    `icon`            VARCHAR(100) DEFAULT NULL COMMENT '图标',
    `sort`            INT          DEFAULT 0  COMMENT '排序',
    `perms`           VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
    `status`          INT          DEFAULT 1  COMMENT '状态: 0-禁用 1-启用',
    `remark`          VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `create_by`       BIGINT       DEFAULT NULL COMMENT '创建人',
    `create_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`       BIGINT       DEFAULT NULL COMMENT '更新人',
    `update_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         TINYINT(1)   DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_permission_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统权限表';

-- -----------------------------------------------------------
-- 用户角色关联表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id`          BIGINT     NOT NULL COMMENT '主键',
    `user_id`     BIGINT     NOT NULL COMMENT '用户ID',
    `role_id`     BIGINT     NOT NULL COMMENT '角色ID',
    `create_by`   BIGINT     DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME   DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`   BIGINT     DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT(1) DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- -----------------------------------------------------------
-- 角色权限关联表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_role_permission` (
    `id`            BIGINT     NOT NULL COMMENT '主键',
    `role_id`       BIGINT     NOT NULL COMMENT '角色ID',
    `permission_id` BIGINT     NOT NULL COMMENT '权限ID',
    `create_by`     BIGINT     DEFAULT NULL COMMENT '创建人',
    `create_time`   DATETIME   DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`     BIGINT     DEFAULT NULL COMMENT '更新人',
    `update_time`   DATETIME   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`       TINYINT(1) DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- -----------------------------------------------------------
-- 认证审计日志表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auth_audit_log` (
    `id`          BIGINT       NOT NULL COMMENT '主键',
    `user_id`     BIGINT       DEFAULT NULL COMMENT '用户ID',
    `username`    VARCHAR(50)  DEFAULT NULL COMMENT '用户名',
    `login_type`  VARCHAR(20)  NOT NULL COMMENT '登录类型: password/sms/face/wechat/alipay/keycloak',
    `client_id`   VARCHAR(50)  DEFAULT NULL COMMENT '客户端ID',
    `ip_address`  VARCHAR(50)  DEFAULT NULL COMMENT 'IP地址',
    `user_agent`  VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
    `device_info` VARCHAR(255) DEFAULT NULL COMMENT '设备信息',
    `location`    VARCHAR(100) DEFAULT NULL COMMENT '登录地点',
    `success`     TINYINT(1)   NOT NULL COMMENT '是否成功: 0-失败 1-成功',
    `fail_reason` VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
    `operate_time` DATETIME    NOT NULL COMMENT '操作时间',
    `trace_id`    VARCHAR(64)  DEFAULT NULL COMMENT '链路追踪ID',
    `extra_info`  TEXT         DEFAULT NULL COMMENT '扩展信息',
    `create_by`   BIGINT       DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`   BIGINT       DEFAULT NULL COMMENT '更新人',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT(1)   DEFAULT 0  COMMENT '逻辑删除: 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_login_type` (`login_type`),
    KEY `idx_operate_time` (`operate_time`),
    KEY `idx_trace_id` (`trace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证审计日志表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 超级管理员（密码: admin123, BCrypt加密）
INSERT INTO `sys_user` (`id`, `username`, `password`, `nickname`, `real_name`, `phone`, `status`, `login_fail_count`, `remark`) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '超级管理员', '系统管理员', '13800000000', 1, 0, '系统初始管理员');

-- 平台操作员
INSERT INTO `sys_user` (`id`, `username`, `password`, `nickname`, `real_name`, `phone`, `status`, `login_fail_count`, `remark`) VALUES
(2, 'operator', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '平台操作员', '张三', '13800000001', 1, 0, '普通操作员');

-- 角色数据
INSERT INTO `sys_role` (`id`, `role_code`, `role_name`, `role_desc`, `status`, `sort`, `data_scope`, `remark`) VALUES
(1, 'SUPER_ADMIN', '超级管理员', '拥有系统所有权限', 1, 1, 'all', '系统内置角色'),
(2, 'ADMIN', '管理员', '拥有大部分管理权限', 1, 2, 'all', '管理角色'),
(3, 'OPERATOR', '操作员', '日常业务操作权限', 1, 3, 'dept', '普通操作角色'),
(4, 'VIEWER', '查看者', '只读查看权限', 1, 4, 'self', '只读角色');

-- 用户角色关联
INSERT INTO `sys_user_role` (`id`, `user_id`, `role_id`) VALUES
(1, 1, 1),
(2, 2, 3);

-- 一级菜单权限
INSERT INTO `sys_permission` (`id`, `parent_id`, `permission_code`, `permission_name`, `permission_type`, `path`, `component`, `icon`, `sort`, `perms`, `status`) VALUES
(1,  0, 'system',        '系统管理',   'menu',   '/system',       NULL,               'setting',   1,  NULL,                   1),
(2,  1, 'user',          '用户管理',   'menu',   '/system/user',  'system/user/index', 'user',      1,  'system:user:list',     1),
(3,  1, 'role',          '角色管理',   'menu',   '/system/role',  'system/role/index', 'peoples',   2,  'system:role:list',     1),
(4,  1, 'permission',    '权限管理',   'menu',   '/system/perm',  'system/perm/index', 'lock',      3,  'system:perm:list',     1),
(5,  1, 'audit',         '审计日志',   'menu',   '/system/audit', 'system/audit/index','log',       4,  'system:audit:list',    1),
(10, 0, 'subsidy',       '补贴管理',   'menu',   '/subsidy',      NULL,               'money',     2,  NULL,                   1),
(11, 10, 'subsidy-policy','补贴政策',  'menu',   '/subsidy/policy','subsidy/policy/index','document',1, 'subsidy:policy:list', 1),
(12, 10, 'subsidy-grant', '补贴发放',  'menu',   '/subsidy/grant', 'subsidy/grant/index','money',   2,  'subsidy:grant:list',  1),
(20, 0, 'certificate',   '证照管理',   'menu',   '/certificate',  NULL,               'id-card',   3,  NULL,                   1),
(30, 0, 'ticket',        '工单中心',   'menu',   '/ticket',       NULL,               'ticket',    4,  NULL,                   1);

-- 用户管理按钮权限
INSERT INTO `sys_permission` (`id`, `parent_id`, `permission_code`, `permission_name`, `permission_type`, `path`, `component`, `icon`, `sort`, `perms`, `status`) VALUES
(100, 2, 'user:create',    '用户新增', 'button', NULL, NULL, NULL, 1, 'system:user:create',    1),
(101, 2, 'user:update',    '用户编辑', 'button', NULL, NULL, NULL, 2, 'system:user:update',    1),
(102, 2, 'user:delete',    '用户删除', 'button', NULL, NULL, NULL, 3, 'system:user:delete',    1),
(103, 2, 'user:reset-pwd', '密码重置', 'button', NULL, NULL, NULL, 4, 'system:user:reset-pwd', 1),
(104, 2, 'user:assign',    '角色分配', 'button', NULL, NULL, NULL, 5, 'system:user:assign',    1);

-- 角色管理按钮权限
INSERT INTO `sys_permission` (`id`, `parent_id`, `permission_code`, `permission_name`, `permission_type`, `path`, `component`, `icon`, `sort`, `perms`, `status`) VALUES
(110, 3, 'role:create',  '角色新增', 'button', NULL, NULL, NULL, 1, 'system:role:create',  1),
(111, 3, 'role:update',  '角色编辑', 'button', NULL, NULL, NULL, 2, 'system:role:update',  1),
(112, 3, 'role:delete',  '角色删除', 'button', NULL, NULL, NULL, 3, 'system:role:delete',  1),
(113, 3, 'role:assign',  '权限分配', 'button', NULL, NULL, NULL, 4, 'system:role:assign',  1);

-- 超级管理员拥有所有权限
INSERT INTO `sys_role_permission` (`id`, `role_id`, `permission_id`)
SELECT NULL, 1, `id` FROM `sys_permission` WHERE `deleted` = 0;

-- 操作员拥有部分权限
INSERT INTO `sys_role_permission` (`id`, `role_id`, `permission_id`) VALUES
(200, 3, 2),
(201, 3, 100),
(202, 3, 101),
(203, 3, 10),
(204, 3, 11),
(205, 3, 12),
(206, 3, 20),
(207, 3, 30);
