-- ==================== 初始化角色 ====================
MERGE INTO roles (role_name, role_code, description, status) KEY(role_code) VALUES 
('超级管理员', 'SUPER_ADMIN', '拥有所有权限', 1);

MERGE INTO roles (role_name, role_code, description, status) KEY(role_code) VALUES 
('管理员', 'ADMIN', '拥有大部分管理权限', 1);

MERGE INTO roles (role_name, role_code, description, status) KEY(role_code) VALUES 
('版主', 'MODERATOR', '可以管理文章和用户', 1);

MERGE INTO roles (role_name, role_code, description, status) KEY(role_code) VALUES 
('普通用户', 'USER', '普通注册用户', 1);

-- ==================== 初始化权限 ====================
-- 后台管理菜单
MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) KEY(permission_code) VALUES 
('后台管理', 'admin', 'menu', 0, '/admin', 'Layout', 'setting', 1, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) KEY(permission_code) VALUES 
('用户管理', 'admin:user', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/user', 'admin/user/index', 'user', 1, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) KEY(permission_code) VALUES 
('角色管理', 'admin:role', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/role', 'admin/role/index', 'peoples', 2, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) KEY(permission_code) VALUES 
('分类管理', 'admin:category', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/category', 'admin/category/index', 'component', 3, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) KEY(permission_code) VALUES 
('文章管理', 'admin:article', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/article', 'admin/article/index', 'documentation', 4, 1);

-- 按钮权限
MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('用户查询', 'admin:user:query', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 1, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('用户新增', 'admin:user:add', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 2, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('用户修改', 'admin:user:edit', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 3, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('用户删除', 'admin:user:delete', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 4, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('文章查询', 'admin:article:query', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 1, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('文章新增', 'admin:article:add', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 2, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('文章修改', 'admin:article:edit', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 3, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('文章删除', 'admin:article:delete', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 4, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('分类管理', 'admin:category:manage', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:category'), 1, 1);

MERGE INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) KEY(permission_code) VALUES 
('角色管理', 'admin:role:manage', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:role'), 1, 1);

-- ==================== 初始化分类 ====================
MERGE INTO categories (category_name, category_code, description, sort, status) KEY(category_code) VALUES 
('技术交流', 'TECH', '技术相关讨论', 1, 1);

MERGE INTO categories (category_name, category_code, description, sort, status) KEY(category_code) VALUES 
('生活分享', 'LIFE', '生活相关分享', 2, 1);

MERGE INTO categories (category_name, category_code, description, sort, status) KEY(category_code) VALUES 
('闲聊灌水', 'CHAT', '闲聊灌水专区', 3, 1);

-- 小类
MERGE INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) KEY(sub_category_code) VALUES 
('Java', 'JAVA', (SELECT id FROM categories WHERE category_code = 'TECH'), 'Java技术讨论', 1, 1);

MERGE INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) KEY(sub_category_code) VALUES 
('前端开发', 'FRONTEND', (SELECT id FROM categories WHERE category_code = 'TECH'), '前端技术讨论', 2, 1);

MERGE INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) KEY(sub_category_code) VALUES 
('数据库', 'DATABASE', (SELECT id FROM categories WHERE category_code = 'TECH'), '数据库技术', 3, 1);

MERGE INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) KEY(sub_category_code) VALUES 
('美食分享', 'FOOD', (SELECT id FROM categories WHERE category_code = 'LIFE'), '美食相关分享', 1, 1);

MERGE INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) KEY(sub_category_code) VALUES 
('旅行日记', 'TRAVEL', (SELECT id FROM categories WHERE category_code = 'LIFE'), '旅行相关分享', 2, 1);

-- ==================== 初始化管理员用户 (密码: admin123) ====================
-- BCrypt hash of 'admin123': $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E
MERGE INTO users (username, password, email, nickname, status) KEY(username) VALUES 
('admin', '$2a$10$EqN0XQr8c9yP4g6J5H7k8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3', 'admin@bbs.com', '管理员', 1);

-- 关联角色
MERGE INTO user_roles (user_id, role_id) KEY(user_id, role_id) VALUES 
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN'));

-- 超级管理员拥有所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN'), id FROM permissions
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN') 
    AND rp.permission_id = permissions.id
);

-- 管理员拥有部分权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE role_code = 'ADMIN'), id FROM permissions 
WHERE permission_code IN ('admin', 'admin:user', 'admin:article', 'admin:category', 'admin:user:query', 'admin:article:query', 'admin:article:add', 'admin:article:edit', 'admin:category:manage')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM roles WHERE role_code = 'ADMIN') 
    AND rp.permission_id = permissions.id
);
