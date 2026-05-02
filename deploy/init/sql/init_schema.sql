-- ============================================================
-- 连锁门店总部管理系统 - 数据库初始化脚本
-- 数据库版本: MySQL 8.0+
-- 创建时间: 2024
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS retail_saas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE retail_saas;

-- ============================================================
-- 系统管理模块 - 组织架构表
-- ============================================================
DROP TABLE IF EXISTS sys_org;
CREATE TABLE sys_org (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父组织ID',
    org_name VARCHAR(100) NOT NULL COMMENT '组织名称',
    org_code VARCHAR(50) NOT NULL COMMENT '组织编码',
    org_type VARCHAR(20) NOT NULL COMMENT '组织类型: HEADQUARTERS=总部, REGION=区域, STORE=门店',
    path VARCHAR(500) DEFAULT '' COMMENT '组织路径',
    manager_id BIGINT DEFAULT NULL COMMENT '负责人ID',
    province VARCHAR(50) DEFAULT '' COMMENT '省份',
    city VARCHAR(50) DEFAULT '' COMMENT '城市',
    district VARCHAR(50) DEFAULT '' COMMENT '区县',
    address VARCHAR(200) DEFAULT '' COMMENT '详细地址',
    contact VARCHAR(50) DEFAULT '' COMMENT '联系人',
    phone VARCHAR(20) DEFAULT '' COMMENT '联系电话',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_org_code (org_code),
    KEY idx_parent_id (parent_id),
    KEY idx_org_type (org_type),
    KEY idx_path (path(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织架构表';

-- ============================================================
-- 系统管理模块 - 用户表
-- ============================================================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    avatar VARCHAR(500) DEFAULT '' COMMENT '头像URL',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    email VARCHAR(100) DEFAULT '' COMMENT '邮箱',
    org_id BIGINT NOT NULL COMMENT '所属组织ID',
    data_scope VARCHAR(20) DEFAULT 'THIS_LEVEL' COMMENT '数据权限范围: ALL=全部, CUSTOM=自定义, THIS_LEVEL=本级, THIS_LEVEL_CHILDREN=本级及下级, SELF=仅自己',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用, 2=锁定',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT '' COMMENT '最后登录IP',
    login_fail_count INT DEFAULT 0 COMMENT '登录失败次数',
    lock_time DATETIME DEFAULT NULL COMMENT '锁定时间',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_username (username),
    KEY idx_org_id (org_id),
    KEY idx_phone (phone),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 系统管理模块 - 角色表
-- ============================================================
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码',
    role_type VARCHAR(20) DEFAULT 'CUSTOM' COMMENT '角色类型: SYSTEM=系统角色, CUSTOM=自定义角色',
    org_id BIGINT DEFAULT 0 COMMENT '所属组织ID(0表示全局)',
    data_scope VARCHAR(20) DEFAULT 'THIS_LEVEL' COMMENT '数据权限范围',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    description VARCHAR(200) DEFAULT '' COMMENT '角色描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_role_code (role_code),
    KEY idx_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ============================================================
-- 系统管理模块 - 菜单/权限表
-- ============================================================
DROP TABLE IF EXISTS sys_menu;
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父菜单ID',
    menu_name VARCHAR(50) NOT NULL COMMENT '菜单名称',
    menu_type VARCHAR(20) NOT NULL COMMENT '菜单类型: DIRECTORY=目录, MENU=菜单, BUTTON=按钮',
    path VARCHAR(200) DEFAULT '' COMMENT '路由路径',
    component VARCHAR(200) DEFAULT '' COMMENT '组件路径',
    permission VARCHAR(200) DEFAULT '' COMMENT '权限标识',
    icon VARCHAR(100) DEFAULT '' COMMENT '图标',
    redirect VARCHAR(200) DEFAULT '' COMMENT '重定向路径',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    visible TINYINT DEFAULT 1 COMMENT '是否可见: 0=隐藏, 1=显示',
    keep_alive TINYINT DEFAULT 1 COMMENT '是否缓存: 0=否, 1=是',
    query VARCHAR(200) DEFAULT '' COMMENT '路由参数',
    is_cache TINYINT DEFAULT 0 COMMENT '是否缓存: 0=否, 1=是',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    KEY idx_parent_id (parent_id),
    KEY idx_menu_type (menu_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单/权限表';

-- ============================================================
-- 系统管理模块 - 用户角色关联表
-- ============================================================
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_role (user_id, role_id),
    KEY idx_user_id (user_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ============================================================
-- 系统管理模块 - 角色菜单关联表
-- ============================================================
DROP TABLE IF EXISTS sys_role_menu;
CREATE TABLE sys_role_menu (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    menu_id BIGINT NOT NULL COMMENT '菜单ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_menu (role_id, menu_id),
    KEY idx_role_id (role_id),
    KEY idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- ============================================================
-- 系统管理模块 - 角色数据权限范围表
-- ============================================================
DROP TABLE IF EXISTS sys_role_data_scope;
CREATE TABLE sys_role_data_scope (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    org_id BIGINT NOT NULL COMMENT '组织ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_org (role_id, org_id),
    KEY idx_role_id (role_id),
    KEY idx_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色数据权限范围表';

-- ============================================================
-- 商品管理模块 - 商品分类表
-- ============================================================
DROP TABLE IF EXISTS prod_category;
CREATE TABLE prod_category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父分类ID',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) NOT NULL COMMENT '分类编码',
    level INT DEFAULT 1 COMMENT '分类层级',
    path VARCHAR(500) DEFAULT '' COMMENT '分类路径',
    icon VARCHAR(100) DEFAULT '' COMMENT '图标',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_category_code (category_code),
    KEY idx_parent_id (parent_id),
    KEY idx_path (path(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- ============================================================
-- 商品管理模块 - 商品主表
-- ============================================================
DROP TABLE IF EXISTS prod_product;
CREATE TABLE prod_product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    sku_code VARCHAR(50) NOT NULL COMMENT 'SKU编码',
    sku_name VARCHAR(200) NOT NULL COMMENT 'SKU名称',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    brand_id BIGINT DEFAULT NULL COMMENT '品牌ID',
    unit VARCHAR(20) DEFAULT '' COMMENT '单位',
    spec VARCHAR(200) DEFAULT '' COMMENT '规格',
    barcode VARCHAR(50) DEFAULT '' COMMENT '条形码',
    cost_price DECIMAL(12, 2) DEFAULT 0.00 COMMENT '成本价',
    is_manage_stock TINYINT DEFAULT 1 COMMENT '是否管理库存: 0=否, 1=是',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_sku_code (sku_code),
    KEY idx_category_id (category_id),
    KEY idx_brand_id (brand_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品主表';

-- ============================================================
-- 价格管理模块 - 价格体系表
-- ============================================================
DROP TABLE IF EXISTS price_system;
CREATE TABLE price_system (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    system_name VARCHAR(50) NOT NULL COMMENT '价格体系名称',
    system_code VARCHAR(50) NOT NULL COMMENT '价格体系编码: BASE=基准价, MEMBER=会员价, PROMOTION=促销价, WHOLESALE=批发价',
    priority INT DEFAULT 0 COMMENT '优先级(数字越大优先级越高)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    description VARCHAR(200) DEFAULT '' COMMENT '描述',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_system_code (system_code),
    KEY idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格体系表';

-- ============================================================
-- 价格管理模块 - 价格版本表
-- ============================================================
DROP TABLE IF EXISTS price_version;
CREATE TABLE price_version (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    price_system_id BIGINT NOT NULL COMMENT '价格体系ID',
    price DECIMAL(12, 2) NOT NULL COMMENT '价格',
    original_price DECIMAL(12, 2) DEFAULT 0.00 COMMENT '原价',
    effective_time DATETIME NOT NULL COMMENT '生效时间',
    expire_time DATETIME DEFAULT NULL COMMENT '失效时间(NULL表示永久有效)',
    version_no VARCHAR(50) NOT NULL COMMENT '版本号',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT=草稿, ACTIVE=生效中, EXPIRED=已失效',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    audit_by BIGINT DEFAULT NULL COMMENT '审核人',
    audit_time DATETIME DEFAULT NULL COMMENT '审核时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    KEY idx_product_id (product_id),
    KEY idx_price_system_id (price_system_id),
    KEY idx_status (status),
    KEY idx_effective_time (effective_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格版本表';

-- ============================================================
-- 价格管理模块 - 毛利率配置表
-- ============================================================
DROP TABLE IF EXISTS margin_config;
CREATE TABLE margin_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    scope_type VARCHAR(20) NOT NULL COMMENT '范围类型: CATEGORY=分类, PRODUCT=商品',
    scope_id BIGINT NOT NULL COMMENT '范围ID(分类ID或商品ID)',
    min_margin DECIMAL(5, 2) DEFAULT 0.00 COMMENT '最小毛利率(%)',
    max_margin DECIMAL(5, 2) DEFAULT 100.00 COMMENT '最大毛利率(%)',
    is_force TINYINT DEFAULT 1 COMMENT '是否强制校验: 0=否, 1=是',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_scope (scope_type, scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='毛利率配置表';

-- ============================================================
-- 价格管理模块 - 价格变更日志表
-- ============================================================
DROP TABLE IF EXISTS price_change_log;
CREATE TABLE price_change_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    price_system_id BIGINT NOT NULL COMMENT '价格体系ID',
    version_id BIGINT DEFAULT NULL COMMENT '价格版本ID',
    old_price DECIMAL(12, 2) DEFAULT 0.00 COMMENT '原价格',
    new_price DECIMAL(12, 2) NOT NULL COMMENT '新价格',
    change_reason VARCHAR(500) DEFAULT '' COMMENT '变更原因',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_product_id (product_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格变更日志表';

-- ============================================================
-- 库存管理模块 - 库存表
-- ============================================================
DROP TABLE IF EXISTS inv_stock;
CREATE TABLE inv_stock (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity DECIMAL(12, 2) DEFAULT 0.00 COMMENT '可用库存数量',
    locked_quantity DECIMAL(12, 2) DEFAULT 0.00 COMMENT '锁定库存数量',
    safety_stock DECIMAL(12, 2) DEFAULT 0.00 COMMENT '安全库存',
    last_sync_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后同步时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_org_product (org_id, product_id),
    KEY idx_org_id (org_id),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- ============================================================
-- 库存管理模块 - 库存流水表
-- ============================================================
DROP TABLE IF EXISTS inv_stock_journal;
CREATE TABLE inv_stock_journal (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    journal_type VARCHAR(20) NOT NULL COMMENT '流水类型: IN=入库, OUT=出库, TRANSFER=调拨, ADJUST=调整',
    ref_type VARCHAR(50) DEFAULT '' COMMENT '关联业务类型',
    ref_id BIGINT DEFAULT NULL COMMENT '关联业务单据ID',
    before_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '变动前数量',
    change_qty DECIMAL(12, 2) NOT NULL COMMENT '变动数量(正数增加,负数减少)',
    after_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '变动后数量',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_org_product (org_id, product_id),
    KEY idx_journal_type (journal_type),
    KEY idx_create_time (create_time),
    KEY idx_ref (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存流水表';

-- ============================================================
-- 库存管理模块 - 库存快照表
-- ============================================================
DROP TABLE IF EXISTS inv_stock_snapshot;
CREATE TABLE inv_stock_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    snapshot_date DATE NOT NULL COMMENT '快照日期',
    begin_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '期初数量',
    in_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '入库数量',
    out_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '出库数量',
    end_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '期末数量',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_snapshot (org_id, product_id, snapshot_date),
    KEY idx_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存快照表';

-- ============================================================
-- 调拨管理模块 - 调拨申请表
-- ============================================================
DROP TABLE IF EXISTS allo_requisition;
CREATE TABLE allo_requisition (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    req_no VARCHAR(50) NOT NULL COMMENT '申请单号',
    req_org_id BIGINT NOT NULL COMMENT '申请调入组织ID',
    from_org_id BIGINT DEFAULT NULL COMMENT '建议调出门店ID(可为空)',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT=草稿, PENDING=待审核, AUDIT_PASS=审核通过, AUDIT_REJECT=审核驳回, OUTBOUND=已出库, INBOUND=已入库, COMPLETED=已完成, CANCELLED=已取消',
    req_reason VARCHAR(500) DEFAULT '' COMMENT '申请原因',
    audit_comment VARCHAR(500) DEFAULT '' COMMENT '审核意见',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    audit_by BIGINT DEFAULT NULL COMMENT '审核人',
    audit_time DATETIME DEFAULT NULL COMMENT '审核时间',
    complete_time DATETIME DEFAULT NULL COMMENT '完成时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0=未删除, 1=已删除',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_req_no (req_no),
    KEY idx_req_org_id (req_org_id),
    KEY idx_from_org_id (from_org_id),
    KEY idx_status (status),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调拨申请表';

-- ============================================================
-- 调拨管理模块 - 调拨申请明细表
-- ============================================================
DROP TABLE IF EXISTS allo_requisition_item;
CREATE TABLE allo_requisition_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    requisition_id BIGINT NOT NULL COMMENT '调拨申请单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    req_qty DECIMAL(12, 2) NOT NULL COMMENT '申请数量',
    actual_out_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '实际出库数量',
    actual_in_qty DECIMAL(12, 2) DEFAULT 0.00 COMMENT '实际入库数量',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_requisition_id (requisition_id),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调拨申请明细表';

-- ============================================================
-- 同步管理模块 - 同步队列表
-- ============================================================
DROP TABLE IF EXISTS sync_queue;
CREATE TABLE sync_queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    sync_direction VARCHAR(10) NOT NULL COMMENT '同步方向: UP=上报(门店->总部), DOWN=下发(总部->门店)',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    data_type VARCHAR(50) NOT NULL COMMENT '数据类型: ORDER, STOCK, PRODUCT, PRICE, PROMOTION等',
    data_key VARCHAR(100) NOT NULL COMMENT '业务数据主键',
    data_version INT DEFAULT 1 COMMENT '数据版本号',
    data_content TEXT COMMENT 'JSON格式数据内容',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态: PENDING=待处理, SUCCESS=成功, FAILED=失败, RETRYING=重试中',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    max_retry INT DEFAULT 3 COMMENT '最大重试次数',
    error_msg TEXT COMMENT '错误信息',
    next_retry_time DATETIME DEFAULT NULL COMMENT '下次重试时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_org_type (org_id, data_type),
    KEY idx_status (status),
    KEY idx_create_time (create_time),
    KEY idx_next_retry (next_retry_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同步队列表';

-- ============================================================
-- 同步管理模块 - 同步记录表
-- ============================================================
DROP TABLE IF EXISTS sync_record;
CREATE TABLE sync_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    sync_type VARCHAR(10) NOT NULL COMMENT '同步类型: UP=上报, DOWN=下发',
    data_type VARCHAR(50) NOT NULL COMMENT '数据类型',
    data_key VARCHAR(100) NOT NULL COMMENT '业务数据主键',
    sync_status VARCHAR(20) DEFAULT 'SUCCESS' COMMENT '同步状态',
    sync_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间',
    source_queue_id BIGINT DEFAULT NULL COMMENT '来源队列ID',
    KEY idx_org_type (org_id, data_type),
    KEY idx_sync_time (sync_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同步记录表';

-- ============================================================
-- 同步管理模块 - 同步冲突表
-- ============================================================
DROP TABLE IF EXISTS sync_conflict;
CREATE TABLE sync_conflict (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    org_id BIGINT NOT NULL COMMENT '组织ID(门店ID)',
    data_type VARCHAR(50) NOT NULL COMMENT '数据类型',
    data_key VARCHAR(100) NOT NULL COMMENT '业务数据主键',
    local_data TEXT COMMENT '本地数据快照',
    remote_data TEXT COMMENT '远程数据快照',
    conflict_type VARCHAR(50) DEFAULT 'UPDATE_CONFLICT' COMMENT '冲突类型: UPDATE_CONFLICT=更新冲突, DELETE_CONFLICT=删除冲突',
    resolve_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '解决状态: PENDING=待处理, AUTO_RESOLVED=自动解决, MANUAL_RESOLVED=人工解决',
    resolve_strategy VARCHAR(50) DEFAULT NULL COMMENT '解决策略',
    resolve_time DATETIME DEFAULT NULL COMMENT '解决时间',
    resolve_by BIGINT DEFAULT NULL COMMENT '解决人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_org_type (org_id, data_type),
    KEY idx_resolve_status (resolve_status),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同步冲突表';

-- ============================================================
-- 系统管理模块 - 字典类型表
-- ============================================================
DROP TABLE IF EXISTS sys_dict_type;
CREATE TABLE sys_dict_type (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    dict_name VARCHAR(100) NOT NULL COMMENT '字典名称',
    dict_type VARCHAR(100) NOT NULL COMMENT '字典类型',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    version INT DEFAULT 0 COMMENT '乐观锁',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    UNIQUE KEY uk_dict_type (dict_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典类型表';

-- ============================================================
-- 系统管理模块 - 字典数据表
-- ============================================================
DROP TABLE IF EXISTS sys_dict_data;
CREATE TABLE sys_dict_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    dict_type VARCHAR(100) NOT NULL COMMENT '字典类型',
    dict_label VARCHAR(100) NOT NULL COMMENT '字典标签',
    dict_value VARCHAR(100) NOT NULL COMMENT '字典值',
    css_class VARCHAR(100) DEFAULT '' COMMENT '样式属性',
    list_class VARCHAR(100) DEFAULT '' COMMENT '表格回显样式',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认: 0=否, 1=是',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
    create_by BIGINT DEFAULT NULL COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT DEFAULT NULL COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    version INT DEFAULT 0 COMMENT '乐观锁',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    KEY idx_dict_type (dict_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典数据表';

-- ============================================================
-- 系统管理模块 - 操作日志表
-- ============================================================
DROP TABLE IF EXISTS sys_oper_log;
CREATE TABLE sys_oper_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(50) DEFAULT '' COMMENT '模块标题',
    business_type INT DEFAULT 0 COMMENT '业务类型',
    method VARCHAR(200) DEFAULT '' COMMENT '方法名称',
    request_method VARCHAR(10) DEFAULT '' COMMENT '请求方式',
    operator_type INT DEFAULT 0 COMMENT '操作类别',
    oper_name VARCHAR(50) DEFAULT '' COMMENT '操作人员',
    org_name VARCHAR(100) DEFAULT '' COMMENT '组织名称',
    oper_url VARCHAR(500) DEFAULT '' COMMENT '请求URL',
    oper_ip VARCHAR(128) DEFAULT '' COMMENT '主机地址',
    oper_location VARCHAR(255) DEFAULT '' COMMENT '操作地点',
    oper_param TEXT COMMENT '请求参数',
    json_result TEXT COMMENT '返回参数',
    status INT DEFAULT 0 COMMENT '操作状态: 0=正常, 1=异常',
    error_msg TEXT COMMENT '错误消息',
    oper_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    cost_time BIGINT DEFAULT 0 COMMENT '消耗时间(毫秒)',
    KEY idx_oper_name (oper_name),
    KEY idx_oper_time (oper_time),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ============================================================
-- 系统管理模块 - 登录日志表
-- ============================================================
DROP TABLE IF EXISTS sys_login_log;
CREATE TABLE sys_login_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_name VARCHAR(50) DEFAULT '' COMMENT '用户账号',
    ip_addr VARCHAR(128) DEFAULT '' COMMENT '登录IP地址',
    login_location VARCHAR(255) DEFAULT '' COMMENT '登录地点',
    browser VARCHAR(50) DEFAULT '' COMMENT '浏览器',
    os VARCHAR(50) DEFAULT '' COMMENT '操作系统',
    status TINYINT DEFAULT 0 COMMENT '登录状态: 0=成功, 1=失败',
    msg VARCHAR(255) DEFAULT '' COMMENT '提示消息',
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    KEY idx_user_name (user_name),
    KEY idx_login_time (login_time),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';
