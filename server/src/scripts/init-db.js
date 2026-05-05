const pool = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('开始创建数据库表结构...');

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        status INTEGER DEFAULT 1,
        group_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);
    console.log('用户表创建成功');

    // 创建用户组表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES user_groups(id),
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('用户组表创建成功');

    // 创建角色表
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('角色表创建成功');

    // 创建权限表
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL,
        parent_id UUID REFERENCES permissions(id),
        path VARCHAR(255),
        component VARCHAR(255),
        icon VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        is_hidden BOOLEAN DEFAULT FALSE,
        is_root BOOLEAN DEFAULT FALSE,
        depends_on UUID REFERENCES permissions(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('权限表创建成功');

    // 创建用户-角色关联表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_id)
      )
    `);
    console.log('用户-角色关联表创建成功');

    // 创建角色-权限关联表
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id)
      )
    `);
    console.log('角色-权限关联表创建成功');

    // 创建操作日志表
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        username VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100),
        description TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        request_method VARCHAR(10),
        request_url VARCHAR(500),
        status INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('操作日志表创建成功');

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_permissions_parent ON permissions(parent_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_operation_logs_time ON operation_logs(created_at)');
    console.log('索引创建成功');

    // 插入初始权限数据
    console.log('开始插入权限数据...');

    const permissions = [
      // root权限（不展示）
      { name: '超级管理员权限', code: 'root', type: 'menu', is_root: true, is_hidden: true, sort_order: 0, path: '/root', description: '系统最高权限' },
      
      // 终端管理
      { name: '终端管理', code: 'terminal', type: 'menu', sort_order: 10, path: '/terminal', icon: 'DesktopOutlined', description: '终端管理模块' },
      { name: '终端查看', code: 'terminal:view', type: 'button', parent_code: 'terminal', sort_order: 1, path: '/api/terminal/list', description: '终端查看权限' },
      { name: '终端维护', code: 'terminal:maintain', type: 'button', parent_code: 'terminal', depends_code: 'terminal:view', sort_order: 2, path: '/api/terminal/maintain', description: '终端维护权限（依赖查看）' },
      { name: '终端组全见', code: 'terminal:all_group', type: 'button', parent_code: 'terminal', depends_code: 'terminal:view', sort_order: 3, path: '/api/terminal/all-group', description: '终端组全见权限（依赖查看）' },
      
      // 素材管理
      { name: '素材管理', code: 'material', type: 'menu', sort_order: 20, path: '/material', icon: 'FileTextOutlined', description: '素材管理模块' },
      { name: '素材查看', code: 'material:view', type: 'button', parent_code: 'material', sort_order: 1, path: '/api/material/list', description: '素材查看权限' },
      { name: '素材审核', code: 'material:audit', type: 'button', parent_code: 'material', depends_code: 'material:view', sort_order: 2, path: '/api/material/audit', description: '素材审核权限' },
      { name: '素材上传', code: 'material:upload', type: 'button', parent_code: 'material', depends_code: 'material:view', sort_order: 3, path: '/api/material/upload', description: '素材上传权限' },
      { name: '素材删除', code: 'material:delete', type: 'button', parent_code: 'material', depends_code: 'material:view', sort_order: 4, path: '/api/material/delete', description: '素材删除权限' },
      { name: '素材全见', code: 'material:all', type: 'button', parent_code: 'material', depends_code: 'material:view', sort_order: 5, path: '/api/material/all', description: '素材全见权限' },
      { name: '素材组内共享', code: 'material:group_share', type: 'button', parent_code: 'material', depends_code: 'material:view', sort_order: 6, path: '/api/material/group-share', description: '素材组内共享权限' },
      
      // 布局管理
      { name: '布局管理', code: 'layout', type: 'menu', sort_order: 30, path: '/layout', icon: 'LayoutOutlined', description: '布局管理模块' },
      { name: '布局查看', code: 'layout:view', type: 'button', parent_code: 'layout', sort_order: 1, path: '/api/layout/list', description: '布局查看权限' },
      { name: '布局管理', code: 'layout:manage', type: 'button', parent_code: 'layout', depends_code: 'layout:view', sort_order: 2, path: '/api/layout/manage', description: '布局管理权限' },
      { name: '布局全见', code: 'layout:all', type: 'button', parent_code: 'layout', depends_code: 'layout:view', sort_order: 3, path: '/api/layout/all', description: '布局全见权限' },
      { name: '布局组内共享', code: 'layout:group_share', type: 'button', parent_code: 'layout', depends_code: 'layout:view', sort_order: 4, path: '/api/layout/group-share', description: '布局组内共享权限' },
      
      // 节目管理
      { name: '节目管理', code: 'program', type: 'menu', sort_order: 40, path: '/program', icon: 'PlayCircleOutlined', description: '节目管理模块' },
      { name: '节目查看预览', code: 'program:view', type: 'button', parent_code: 'program', sort_order: 1, path: '/api/program/list', description: '节目查看预览权限' },
      { name: '节目制作', code: 'program:create', type: 'button', parent_code: 'program', depends_code: 'program:view', sort_order: 2, path: '/api/program/create', description: '节目制作权限' },
      { name: '节目修改', code: 'program:update', type: 'button', parent_code: 'program', depends_code: 'program:view', sort_order: 3, path: '/api/program/update', description: '节目修改权限' },
      { name: '节目删除', code: 'program:delete', type: 'button', parent_code: 'program', depends_code: 'program:view', sort_order: 4, path: '/api/program/delete', description: '节目删除权限' },
      { name: '节目全见', code: 'program:all', type: 'button', parent_code: 'program', depends_code: 'program:view', sort_order: 5, path: '/api/program/all', description: '节目全见权限' },
      { name: '节目组内共享', code: 'program:group_share', type: 'button', parent_code: 'program', depends_code: 'program:view', sort_order: 6, path: '/api/program/group-share', description: '节目组内共享权限' },
      
      // 播放计划
      { name: '播放计划', code: 'schedule', type: 'menu', sort_order: 50, path: '/schedule', icon: 'CalendarOutlined', description: '播放计划模块' },
      { name: '播放计划查看', code: 'schedule:view', type: 'button', parent_code: 'schedule', sort_order: 1, path: '/api/schedule/list', description: '播放计划查看权限' },
      { name: '播放计划制作', code: 'schedule:create', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 2, path: '/api/schedule/create', description: '播放计划制作权限' },
      { name: '播放计划修改', code: 'schedule:update', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 3, path: '/api/schedule/update', description: '播放计划修改权限' },
      { name: '播放计划删除', code: 'schedule:delete', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 4, path: '/api/schedule/delete', description: '播放计划删除权限' },
      { name: '播放计划审核', code: 'schedule:audit', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 5, path: '/api/schedule/audit', description: '播放计划审核权限' },
      { name: '播放计划全见', code: 'schedule:all', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 6, path: '/api/schedule/all', description: '播放计划全见权限' },
      { name: '播放计划组内共享', code: 'schedule:group_share', type: 'button', parent_code: 'schedule', depends_code: 'schedule:view', sort_order: 7, path: '/api/schedule/group-share', description: '播放计划组内共享权限' },
      
      // 用户管理
      { name: '用户管理', code: 'user', type: 'menu', sort_order: 60, path: '/user', icon: 'UserOutlined', description: '用户管理模块' },
      { name: '用户管理', code: 'user:manage', type: 'button', parent_code: 'user', sort_order: 1, path: '/api/user/*', description: '用户管理权限' },
      { name: '用户组管理', code: 'user:group', type: 'button', parent_code: 'user', sort_order: 2, path: '/api/user/group/*', description: '用户组管理权限' },
      
      // 角色管理
      { name: '角色管理', code: 'role', type: 'menu', sort_order: 70, path: '/role', icon: 'TeamOutlined', description: '角色管理模块' },
      { name: '角色管理', code: 'role:manage', type: 'button', parent_code: 'role', sort_order: 1, path: '/api/role/*', description: '角色管理权限' },
      
      // 日志管理
      { name: '日志管理', code: 'log', type: 'menu', sort_order: 80, path: '/log', icon: 'FileTextOutlined', description: '日志管理模块' },
      { name: '日志查看', code: 'log:view', type: 'button', parent_code: 'log', sort_order: 1, path: '/api/log/list', description: '日志查看权限' },
      { name: '日志导出', code: 'log:export', type: 'button', parent_code: 'log', depends_code: 'log:view', sort_order: 2, path: '/api/log/export', description: '日志导出权限' },
      
      // 系统管理
      { name: '系统管理', code: 'system', type: 'menu', sort_order: 90, path: '/system', icon: 'SettingOutlined', description: '系统管理模块' },
      { name: '系统设置', code: 'system:setting', type: 'button', parent_code: 'system', sort_order: 1, path: '/api/system/setting', description: '系统设置权限' },
      { name: 'FTP服务器', code: 'system:ftp', type: 'button', parent_code: 'system', sort_order: 2, path: '/api/system/ftp', description: 'FTP服务器管理权限' },
      { name: '布局分辨率', code: 'system:resolution', type: 'button', parent_code: 'system', sort_order: 3, path: '/api/system/resolution', description: '布局分辨率管理权限' },
      { name: '在线用户管理', code: 'system:online', type: 'button', parent_code: 'system', sort_order: 4, path: '/api/system/online', description: '在线用户管理权限' },
    ];

    // 先插入所有权限
    const permissionMap = {};
    for (const perm of permissions) {
      const result = await client.query(
        `INSERT INTO permissions (name, code, type, path, icon, sort_order, is_hidden, is_root, description, component)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (code) DO UPDATE SET 
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           path = EXCLUDED.path,
           icon = EXCLUDED.icon,
           sort_order = EXCLUDED.sort_order,
           is_hidden = EXCLUDED.is_hidden,
           is_root = EXCLUDED.is_root,
           description = EXCLUDED.description
         RETURNING id, code`,
        [perm.name, perm.code, perm.type, perm.path, perm.icon, perm.sort_order, perm.is_hidden || false, perm.is_root || false, perm.description, perm.component]
      );
      permissionMap[perm.code] = result.rows[0].id;
    }

    // 更新父级ID和依赖ID
    for (const perm of permissions) {
      if (perm.parent_code && permissionMap[perm.parent_code]) {
        await client.query(
          `UPDATE permissions SET parent_id = $1 WHERE code = $2`,
          [permissionMap[perm.parent_code], perm.code]
        );
      }
      if (perm.depends_code && permissionMap[perm.depends_code]) {
        await client.query(
          `UPDATE permissions SET depends_on = $1 WHERE code = $2`,
          [permissionMap[perm.depends_code], perm.code]
        );
      }
    }
    console.log('权限数据插入完成');

    // 插入root角色
    const rootRoleResult = await client.query(
      `INSERT INTO roles (name, code, description, is_system, status)
       VALUES ('超级管理员', 'root', '系统最高权限角色', true, 1)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id, code`
    );
    const rootRoleId = rootRoleResult.rows[0].id;
    console.log('root角色创建完成');

    // 为root角色分配所有权限
    const allPermissionIds = Object.values(permissionMap);
    for (const permId of allPermissionIds) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [rootRoleId, permId]
      );
    }
    console.log('root角色权限分配完成');

    // 创建root用户
    const hashedPassword = await bcrypt.hash('root123456', 10);
    const rootUserResult = await client.query(
      `INSERT INTO users (username, password, real_name, status)
       VALUES ('root', $1, '超级管理员', 1)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, real_name = EXCLUDED.real_name
       RETURNING id, username`,
      [hashedPassword]
    );
    const rootUserId = rootUserResult.rows[0].id;
    console.log('root用户创建完成');

    // 为root用户分配root角色
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [rootUserId, rootRoleId]
    );
    console.log('root用户角色分配完成');

    await client.query('COMMIT');
    console.log('数据库初始化完成！');
    console.log('默认登录账号: root / root123456');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

// 执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = initDatabase;
