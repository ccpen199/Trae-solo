-- ==================== 初始化角色 ====================
INSERT INTO roles (role_name, role_code, description, status) VALUES 
('超级管理员', 'SUPER_ADMIN', '拥有所有权限', 1)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO roles (role_name, role_code, description, status) VALUES 
('管理员', 'ADMIN', '拥有大部分管理权限', 1)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO roles (role_name, role_code, description, status) VALUES 
('版主', 'MODERATOR', '可以管理文章和用户', 1)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO roles (role_name, role_code, description, status) VALUES 
('普通用户', 'USER', '普通注册用户', 1)
ON CONFLICT (role_code) DO NOTHING;

-- ==================== 初始化权限 ====================
-- 后台管理菜单
INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) VALUES 
('后台管理', 'admin', 'menu', 0, '/admin', 'Layout', 'setting', 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) VALUES 
('用户管理', 'admin:user', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/user', 'admin/user/index', 'user', 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) VALUES 
('角色管理', 'admin:role', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/role', 'admin/role/index', 'peoples', 2, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) VALUES 
('分类管理', 'admin:category', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/category', 'admin/category/index', 'component', 3, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, path, component, icon, sort, status) VALUES 
('文章管理', 'admin:article', 'menu', (SELECT id FROM permissions WHERE permission_code = 'admin'), '/admin/article', 'admin/article/index', 'documentation', 4, 1)
ON CONFLICT (permission_code) DO NOTHING;

-- 按钮权限
INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('用户查询', 'admin:user:query', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('用户新增', 'admin:user:add', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 2, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('用户修改', 'admin:user:edit', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 3, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('用户删除', 'admin:user:delete', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:user'), 4, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('文章查询', 'admin:article:query', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('文章新增', 'admin:article:add', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 2, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('文章修改', 'admin:article:edit', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 3, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('文章删除', 'admin:article:delete', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:article'), 4, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('分类管理', 'admin:category:manage', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:category'), 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO permissions (permission_name, permission_code, resource_type, parent_id, sort, status) VALUES 
('角色管理', 'admin:role:manage', 'button', (SELECT id FROM permissions WHERE permission_code = 'admin:role'), 1, 1)
ON CONFLICT (permission_code) DO NOTHING;

-- ==================== 初始化分类 ====================
INSERT INTO categories (category_name, category_code, description, sort, status) VALUES 
('技术交流', 'TECH', '技术相关讨论', 1, 1)
ON CONFLICT (category_code) DO NOTHING;

INSERT INTO categories (category_name, category_code, description, sort, status) VALUES 
('生活分享', 'LIFE', '生活相关分享', 2, 1)
ON CONFLICT (category_code) DO NOTHING;

INSERT INTO categories (category_name, category_code, description, sort, status) VALUES 
('闲聊灌水', 'CHAT', '闲聊灌水专区', 3, 1)
ON CONFLICT (category_code) DO NOTHING;

-- 小类
INSERT INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) VALUES 
('Java', 'JAVA', (SELECT id FROM categories WHERE category_code = 'TECH'), 'Java技术讨论', 1, 1)
ON CONFLICT (sub_category_code) DO NOTHING;

INSERT INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) VALUES 
('前端开发', 'FRONTEND', (SELECT id FROM categories WHERE category_code = 'TECH'), '前端技术讨论', 2, 1)
ON CONFLICT (sub_category_code) DO NOTHING;

INSERT INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) VALUES 
('数据库', 'DATABASE', (SELECT id FROM categories WHERE category_code = 'TECH'), '数据库技术', 3, 1)
ON CONFLICT (sub_category_code) DO NOTHING;

INSERT INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) VALUES 
('美食分享', 'FOOD', (SELECT id FROM categories WHERE category_code = 'LIFE'), '美食相关分享', 1, 1)
ON CONFLICT (sub_category_code) DO NOTHING;

INSERT INTO sub_categories (sub_category_name, sub_category_code, category_id, description, sort, status) VALUES 
('旅行日记', 'TRAVEL', (SELECT id FROM categories WHERE category_code = 'LIFE'), '旅行相关分享', 2, 1)
ON CONFLICT (sub_category_code) DO NOTHING;

-- ==================== 初始化管理员用户 (密码: admin123) ====================
INSERT INTO users (username, password, email, nickname, status) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'admin@bbs.com', '管理员', 1)
ON CONFLICT (username) DO NOTHING;

-- 关联角色
INSERT INTO user_roles (user_id, role_id) VALUES 
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN'))
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 超级管理员拥有所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN'), id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 管理员拥有部分权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE role_code = 'ADMIN'), id FROM permissions 
WHERE permission_code IN ('admin', 'admin:user', 'admin:article', 'admin:category', 'admin:user:query', 'admin:article:query', 'admin:article:add', 'admin:article:edit', 'admin:category:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;
