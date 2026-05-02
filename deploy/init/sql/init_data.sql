-- ============================================================
-- 连锁门店总部管理系统 - 初始化数据脚本
-- 创建时间: 2024
-- ============================================================

USE retail_saas;

-- ============================================================
-- 初始化组织数据
-- ============================================================

-- 总部
INSERT INTO sys_org (id, parent_id, org_name, org_code, org_type, path, province, city, district, address, contact, phone, status, sort_order) VALUES
(1, 0, '连锁零售总部', 'HQ001', 'HEADQUARTERS', ',1,', '北京', '北京', '朝阳区', '建国路88号', '张总', '010-88888888', 1, 1);

-- 区域
INSERT INTO sys_org (id, parent_id, org_name, org_code, org_type, path, province, city, district, address, contact, phone, status, sort_order) VALUES
(2, 1, '华北区域', 'REG001', 'REGION', ',1,2,', '北京', '北京', '朝阳区', '建国路88号', '王经理', '010-88888801', 1, 1),
(3, 1, '华东区域', 'REG002', 'REGION', ',1,3,', '上海', '上海', '浦东新区', '陆家嘴金融中心', '李经理', '021-88888802', 1, 2),
(4, 1, '华南区域', 'REG003', 'REGION', ',1,4,', '广东', '广州', '天河区', '天河路385号', '陈经理', '020-88888803', 1, 3);

-- 门店
INSERT INTO sys_org (id, parent_id, org_name, org_code, org_type, path, province, city, district, address, contact, phone, status, sort_order) VALUES
(5, 2, '北京朝阳店', 'ST001', 'STORE', ',1,2,5,', '北京', '北京', '朝阳区', '建国路88号', '赵店长', '010-88880001', 1, 1),
(6, 2, '北京海淀店', 'ST002', 'STORE', ',1,2,6,', '北京', '北京', '海淀区', '中关村大街1号', '钱店长', '010-88880002', 1, 2),
(7, 3, '上海浦东店', 'ST003', 'STORE', ',1,3,7,', '上海', '上海', '浦东新区', '陆家嘴环路1000号', '孙店长', '021-88880003', 1, 1),
(8, 3, '上海静安店', 'ST004', 'STORE', ',1,3,8,', '上海', '上海', '静安区', '南京西路1266号', '周店长', '021-88880004', 1, 2),
(9, 4, '广州天河店', 'ST005', 'STORE', ',1,4,9,', '广东', '广州', '天河区', '天河路385号', '吴店长', '020-88880005', 1, 1),
(10, 4, '深圳南山店', 'ST006', 'STORE', ',1,4,10,', '广东', '深圳', '南山区', '科技园南路', '郑店长', '0755-88880006', 1, 2);

-- ============================================================
-- 初始化角色数据
-- ============================================================

INSERT INTO sys_role (id, role_name, role_code, role_type, org_id, data_scope, status, description, sort_order) VALUES
(1, '超级管理员', 'SUPER_ADMIN', 'SYSTEM', 0, 'ALL', 1, '系统超级管理员，拥有所有权限', 1),
(2, '总部运营', 'HQ_OPERATOR', 'SYSTEM', 1, 'THIS_LEVEL_CHILDREN', 1, '总部运营人员', 2),
(3, '区域经理', 'REGION_MANAGER', 'SYSTEM', 0, 'THIS_LEVEL_CHILDREN', 1, '区域经理，管理本区域门店', 3),
(4, '店长', 'STORE_MANAGER', 'SYSTEM', 0, 'THIS_LEVEL', 1, '门店店长', 4),
(5, '财务', 'FINANCE', 'SYSTEM', 0, 'ALL', 1, '财务人员，负责对账结算', 5);

-- ============================================================
-- 初始化菜单数据
-- ============================================================

-- 一级菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, redirect, sort, status, visible, keep_alive) VALUES
(1, 0, '工作台', 'MENU', '/dashboard', 'dashboard/index', '', 'HomeFilled', '', 1, 1, 1, 1),
(2, 0, '组织管理', 'DIRECTORY', '/org', '', '', 'OfficeBuilding', '/org/org-manage', 2, 1, 1, 1),
(3, 0, '商品管理', 'DIRECTORY', '/product', '', '', 'Goods', '/product/list', 3, 1, 1, 1),
(4, 0, '价格管理', 'DIRECTORY', '/price', '', '', 'Money', '/price/system', 4, 1, 1, 1),
(5, 0, '库存管理', 'DIRECTORY', '/inventory', '', '', 'Box', '/inventory/query', 5, 1, 1, 1),
(6, 0, '调拨管理', 'DIRECTORY', '/allocation', '', '', 'Transfer', '/allocation/req', 6, 1, 1, 1),
(7, 0, '促销管理', 'DIRECTORY', '/promotion', '', '', 'Present', '/promotion/list', 7, 1, 1, 1),
(8, 0, '订单管理', 'DIRECTORY', '/order', '', '', 'Tickets', '/order/list', 8, 1, 1, 1),
(9, 0, '财务管理', 'DIRECTORY', '/finance', '', '', 'Wallet', '/finance/reconciliation', 9, 1, 1, 1),
(10, 0, '报表分析', 'DIRECTORY', '/report', '', '', 'DataLine', '/report/sales', 10, 1, 1, 1),
(11, 0, '系统管理', 'DIRECTORY', '/system', '', '', 'Setting', '/system/dict', 11, 1, 1, 1);

-- 组织管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(100, 2, '组织架构', 'MENU', '/org/org-manage', 'org/OrgManage/index', 'org:manage:view', 'Menu', 1, 1, 1, 1),
(101, 2, '用户管理', 'MENU', '/org/user-manage', 'org/UserManage/index', 'org:user:view', 'User', 2, 1, 1, 1),
(102, 2, '角色管理', 'MENU', '/org/role-manage', 'org/RoleManage/index', 'org:role:view', 'UserFilled', 3, 1, 1, 1);

-- 商品管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(200, 3, '商品列表', 'MENU', '/product/list', 'product/ProductList/index', 'product:list:view', 'List', 1, 1, 1, 1),
(201, 3, '商品分类', 'MENU', '/product/category', 'product/ProductCategory/index', 'product:category:view', 'Menu', 2, 1, 1, 1);

-- 价格管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(300, 4, '价格体系', 'MENU', '/price/system', 'price/PriceSystem/index', 'price:system:view', 'Coin', 1, 1, 1, 1),
(301, 4, '价格版本', 'MENU', '/price/version', 'price/PriceVersion/index', 'price:version:view', 'Document', 2, 1, 1, 1),
(302, 4, '毛利率配置', 'MENU', '/price/margin', 'price/MarginConfig/index', 'price:margin:view', 'TrendCharts', 3, 1, 1, 1);

-- 库存管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(400, 5, '库存查询', 'MENU', '/inventory/query', 'inventory/StockQuery/index', 'inventory:query:view', 'Search', 1, 1, 1, 1),
(401, 5, '库存流水', 'MENU', '/inventory/journal', 'inventory/StockJournal/index', 'inventory:journal:view', 'List', 2, 1, 1, 1),
(402, 5, '库存调整', 'MENU', '/inventory/adjust', 'inventory/StockAdjust/index', 'inventory:adjust:view', 'Edit', 3, 1, 1, 1);

-- 调拨管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(500, 6, '调拨申请', 'MENU', '/allocation/req', 'allocation/AllocationReq/index', 'allocation:req:view', 'Plus', 1, 1, 1, 1),
(501, 6, '调拨审核', 'MENU', '/allocation/audit', 'allocation/AllocationAudit/index', 'allocation:audit:view', 'CircleCheck', 2, 1, 1, 1),
(502, 6, '调拨记录', 'MENU', '/allocation/record', 'allocation/AllocationRecord/index', 'allocation:record:view', 'Document', 3, 1, 1, 1);

-- 系统管理子菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, permission, icon, sort, status, visible, keep_alive) VALUES
(600, 11, '字典管理', 'MENU', '/system/dict', 'system/DictManage/index', 'system:dict:view', 'Collection', 1, 1, 1, 1),
(601, 11, '日志管理', 'MENU', '/system/log', 'system/LogManage/index', 'system:log:view', 'Document', 2, 1, 1, 1),
(602, 11, '同步监控', 'MENU', '/system/sync', 'system/SyncMonitor/index', 'system:sync:view', 'Connection', 3, 1, 1, 1);

-- ============================================================
-- 初始化用户数据 (密码: 123456)
-- BCrypt加密后的123456: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5 (示例)
-- 使用: $2a$10$.q.5z5V4X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6 (示例BCrypt)
-- ============================================================

-- 实际的BCrypt加密: 123456 -> 使用在线工具生成
-- 这里使用一个示例BCrypt哈希值
INSERT INTO sys_user (id, username, password, real_name, phone, email, org_id, data_scope, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5', '系统管理员', '13800000000', 'admin@retail.com', 1, 'ALL', 1),
(2, 'hq_operator', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5', '总部运营', '13800000001', 'operator@retail.com', 1, 'THIS_LEVEL_CHILDREN', 1),
(3, 'region_manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5', '区域经理', '13800000002', 'region@retail.com', 2, 'THIS_LEVEL_CHILDREN', 1),
(4, 'store_manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5', '门店店长', '13800000003', 'store@retail.com', 5, 'THIS_LEVEL', 1),
(5, 'finance', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5', '财务人员', '13800000004', 'finance@retail.com', 1, 'ALL', 1);

-- ============================================================
-- 初始化用户角色关联
-- ============================================================

INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- ============================================================
-- 初始化角色菜单关联 (超级管理员关联所有菜单)
-- ============================================================

-- 超级管理员拥有所有菜单
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;

-- 总部运营拥有运营相关菜单
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 7), (2, 8),
(2, 100), (2, 101), (2, 102), (2, 200), (2, 201),
(2, 400), (2, 401), (2, 402), (2, 500), (2, 501), (2, 502);

-- 区域经理拥有区域相关菜单
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(3, 1), (3, 5), (3, 6), (3, 10),
(3, 400), (3, 401), (3, 500), (3, 502);

-- 店长拥有门店相关菜单
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(4, 1), (4, 5), (4, 6),
(4, 400), (4, 401), (4, 500);

-- 财务拥有财务相关菜单
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(5, 1), (5, 9), (5, 10),
(5, 601);

-- ============================================================
-- 初始化商品分类数据
-- ============================================================

INSERT INTO prod_category (id, parent_id, category_name, category_code, level, path, sort, status) VALUES
(1, 0, '饮料', 'CAT001', 1, ',1,', 1, 1),
(2, 0, '食品', 'CAT002', 1, ',2,', 2, 1),
(3, 0, '日用品', 'CAT003', 1, ',3,', 3, 1),
(4, 0, '烟酒', 'CAT004', 1, ',4,', 4, 1),
(5, 1, '饮用水', 'CAT00101', 2, ',1,5,', 1, 1),
(6, 1, '碳酸饮料', 'CAT00102', 2, ',1,6,', 2, 1),
(7, 1, '果汁', 'CAT00103', 2, ',1,7,', 3, 1),
(8, 2, '面包', 'CAT00201', 2, ',2,8,', 1, 1),
(9, 2, '零食', 'CAT00202', 2, ',2,9,', 2, 1),
(10, 2, '速食', 'CAT00203', 2, ',2,10,', 3, 1);

-- ============================================================
-- 初始化商品数据
-- ============================================================

INSERT INTO prod_product (id, sku_code, sku_name, category_id, unit, spec, barcode, cost_price, is_manage_stock, status) VALUES
(1, 'SKU001', '纯净水500ml', 5, '瓶', '500ml*24瓶', '6901234567001', 1.50, 1, 1),
(2, 'SKU002', '可乐330ml', 6, '罐', '330ml*24罐', '6901234567002', 1.80, 1, 1),
(3, 'SKU003', '橙汁1L', 7, '盒', '1L*12盒', '6901234567003', 5.50, 1, 1),
(4, 'SKU004', '全麦面包', 8, '个', '300g/个', '6901234567004', 3.00, 1, 1),
(5, 'SKU005', '薯片', 9, '袋', '100g/袋', '6901234567005', 4.50, 1, 1),
(6, 'SKU006', '方便面', 10, '袋', '100g/袋', '6901234567006', 2.50, 1, 1),
(7, 'SKU007', '牙膏', 3, '支', '120g/支', '6901234567007', 8.50, 1, 1),
(8, 'SKU008', '洗发水', 3, '瓶', '400ml/瓶', '6901234567008', 25.00, 1, 1),
(9, 'SKU009', '香烟', 4, '条', '200支/条', '6901234567009', 80.00, 1, 1),
(10, 'SKU010', '白酒', 4, '瓶', '500ml/瓶', '6901234567010', 150.00, 1, 1);

-- ============================================================
-- 初始化价格体系数据
-- ============================================================

INSERT INTO price_system (id, system_name, system_code, priority, status, description) VALUES
(1, '基准价', 'BASE', 1, 1, '商品基准售价，所有门店通用'),
(2, '会员价', 'MEMBER', 2, 1, '会员专享价格'),
(3, '促销价', 'PROMOTION', 3, 1, '促销活动价格'),
(4, '批发价', 'WHOLESALE', 4, 1, '大客户批发价格');

-- ============================================================
-- 初始化价格版本数据
-- ============================================================

INSERT INTO price_version (id, product_id, price_system_id, price, original_price, effective_time, version_no, status) VALUES
(1, 1, 1, 2.50, 2.50, NOW(), 'V20240401', 'ACTIVE'),
(2, 2, 1, 3.00, 3.00, NOW(), 'V20240401', 'ACTIVE'),
(3, 3, 1, 8.00, 8.00, NOW(), 'V20240401', 'ACTIVE'),
(4, 4, 1, 5.00, 5.00, NOW(), 'V20240401', 'ACTIVE'),
(5, 5, 1, 7.50, 7.50, NOW(), 'V20240401', 'ACTIVE'),
(6, 6, 1, 4.00, 4.00, NOW(), 'V20240401', 'ACTIVE'),
(7, 7, 1, 15.00, 15.00, NOW(), 'V20240401', 'ACTIVE'),
(8, 8, 1, 45.00, 45.00, NOW(), 'V20240401', 'ACTIVE'),
(9, 9, 1, 120.00, 120.00, NOW(), 'V20240401', 'ACTIVE'),
(10, 10, 1, 200.00, 200.00, NOW(), 'V20240401', 'ACTIVE');

-- 会员价
INSERT INTO price_version (id, product_id, price_system_id, price, original_price, effective_time, version_no, status) VALUES
(11, 1, 2, 2.20, 2.50, NOW(), 'V20240401', 'ACTIVE'),
(12, 2, 2, 2.70, 3.00, NOW(), 'V20240401', 'ACTIVE'),
(13, 3, 2, 7.20, 8.00, NOW(), 'V20240401', 'ACTIVE');

-- ============================================================
-- 初始化毛利率配置数据
-- ============================================================

INSERT INTO margin_config (id, scope_type, scope_id, min_margin, max_margin, is_force) VALUES
(1, 'CATEGORY', 1, 15.00, 50.00, 1),
(2, 'CATEGORY', 2, 20.00, 60.00, 1),
(3, 'CATEGORY', 3, 25.00, 70.00, 1),
(4, 'CATEGORY', 4, 30.00, 80.00, 1);

-- ============================================================
-- 初始化字典类型数据
-- ============================================================

INSERT INTO sys_dict_type (id, dict_name, dict_type, status) VALUES
(1, '组织类型', 'org_type', 1),
(2, '用户状态', 'user_status', 1),
(3, '订单状态', 'order_status', 1),
(4, '调拨状态', 'allo_status', 1),
(5, '支付方式', 'pay_type', 1);

-- ============================================================
-- 初始化字典数据数据
-- ============================================================

INSERT INTO sys_dict_data (id, dict_type, dict_label, dict_value, css_class, list_class, is_default, sort, status) VALUES
(1, 'org_type', '总部', 'HEADQUARTERS', '', 'primary', 1, 1, 1),
(2, 'org_type', '区域', 'REGION', '', 'success', 0, 2, 1),
(3, 'org_type', '门店', 'STORE', '', 'warning', 0, 3, 1),

(4, 'user_status', '启用', '1', '', 'success', 1, 1, 1),
(5, 'user_status', '禁用', '0', '', 'danger', 0, 2, 1),
(6, 'user_status', '锁定', '2', '', 'warning', 0, 3, 1),

(7, 'allo_status', '草稿', 'DRAFT', '', 'info', 0, 1, 1),
(8, 'allo_status', '待审核', 'PENDING', '', 'warning', 0, 2, 1),
(9, 'allo_status', '审核通过', 'AUDIT_PASS', '', 'success', 0, 3, 1),
(10, 'allo_status', '审核驳回', 'AUDIT_REJECT', '', 'danger', 0, 4, 1),
(11, 'allo_status', '已出库', 'OUTBOUND', '', 'primary', 0, 5, 1),
(12, 'allo_status', '已入库', 'INBOUND', '', 'success', 0, 6, 1),
(13, 'allo_status', '已完成', 'COMPLETED', '', 'success', 0, 7, 1),
(14, 'allo_status', '已取消', 'CANCELLED', '', 'info', 0, 8, 1),

(15, 'pay_type', '现金', 'CASH', '', 'success', 0, 1, 1),
(16, 'pay_type', '微信支付', 'WECHAT', '', 'success', 0, 2, 1),
(17, 'pay_type', '支付宝', 'ALIPAY', '', 'primary', 0, 3, 1),
(18, 'pay_type', '会员卡', 'MEMBER', '', 'warning', 0, 4, 1);
