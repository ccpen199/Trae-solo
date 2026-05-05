const { sequelize, Organization, User, Role, Permission, UserRole, RolePermission } = require('../src/models');

async function initData() {
  try {
    console.log('开始初始化数据...');

    await sequelize.sync({ force: true });
    console.log('数据库表同步完成');

    const company = await Organization.create({
      name: '总公司',
      code: 'COMPANY-001',
      type: 'company',
      sort: 1,
      status: 'active',
      description: '总公司'
    });

    const dept1 = await Organization.create({
      name: '技术部',
      code: 'DEPT-001',
      type: 'department',
      parentId: company.id,
      sort: 1,
      status: 'active',
      description: '技术部门'
    });

    const dept2 = await Organization.create({
      name: '产品部',
      code: 'DEPT-002',
      type: 'department',
      parentId: company.id,
      sort: 2,
      status: 'active',
      description: '产品部门'
    });

    console.log('机构数据初始化完成');

    const adminRole = await Role.create({
      name: '超级管理员',
      code: 'SUPER_ADMIN',
      type: 'system',
      sort: 1,
      status: 'active',
      description: '超级管理员角色，拥有所有权限'
    });

    const userRole = await Role.create({
      name: '普通员工',
      code: 'EMPLOYEE',
      type: 'system',
      sort: 2,
      status: 'active',
      description: '普通员工角色'
    });

    console.log('角色数据初始化完成');

    const menuPermissions = [
      {
        name: '工作台',
        code: 'dashboard',
        type: 'menu',
        path: '/dashboard',
        icon: 'HomeFilled',
        component: 'Dashboard',
        sort: 1,
        status: 'active'
      },
      {
        name: '机构管理',
        code: 'organization',
        type: 'menu',
        path: '/organization',
        icon: 'OfficeBuilding',
        component: 'Organization',
        sort: 2,
        status: 'active'
      },
      {
        name: '角色管理',
        code: 'role',
        type: 'menu',
        path: '/role',
        icon: 'UserFilled',
        component: 'Role',
        sort: 3,
        status: 'active'
      },
      {
        name: '日程管理',
        code: 'schedule',
        type: 'menu',
        path: '/schedule',
        icon: 'Calendar',
        component: 'Schedule',
        sort: 4,
        status: 'active'
      },
      {
        name: '用户管理',
        code: 'user',
        type: 'menu',
        path: '/user',
        icon: 'User',
        component: 'User',
        sort: 5,
        status: 'active'
      }
    ];

    const createdPermissions = [];
    for (const perm of menuPermissions) {
      const created = await Permission.create(perm);
      createdPermissions.push(created);
    }

    const buttonPermissions = [
      { name: '添加机构', code: 'organization:add', type: 'button', sort: 1 },
      { name: '编辑机构', code: 'organization:edit', type: 'button', sort: 2 },
      { name: '删除机构', code: 'organization:delete', type: 'button', sort: 3 },
      { name: '添加角色', code: 'role:add', type: 'button', sort: 1 },
      { name: '编辑角色', code: 'role:edit', type: 'button', sort: 2 },
      { name: '删除角色', code: 'role:delete', type: 'button', sort: 3 },
      { name: '分配权限', code: 'role:assign', type: 'button', sort: 4 },
      { name: '添加日程', code: 'schedule:add', type: 'button', sort: 1 },
      { name: '编辑日程', code: 'schedule:edit', type: 'button', sort: 2 },
      { name: '删除日程', code: 'schedule:delete', type: 'button', sort: 3 },
      { name: '添加用户', code: 'user:add', type: 'button', sort: 1 },
      { name: '编辑用户', code: 'user:edit', type: 'button', sort: 2 },
      { name: '删除用户', code: 'user:delete', type: 'button', sort: 3 }
    ];

    for (const perm of buttonPermissions) {
      await Permission.create({
        ...perm,
        status: 'active'
      });
    }

    console.log('权限数据初始化完成');

    for (const perm of createdPermissions) {
      await RolePermission.create({
        roleId: adminRole.id,
        permissionId: perm.id
      });
    }

    const dashboardPerm = createdPermissions.find(p => p.code === 'dashboard');
    const schedulePerm = createdPermissions.find(p => p.code === 'schedule');
    if (dashboardPerm) {
      await RolePermission.create({
        roleId: userRole.id,
        permissionId: dashboardPerm.id
      });
    }
    if (schedulePerm) {
      await RolePermission.create({
        roleId: userRole.id,
        permissionId: schedulePerm.id
      });
    }

    console.log('角色权限关联完成');

    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      realName: '管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      orgId: company.id,
      status: 'active'
    });

    const employee1 = await User.create({
      username: 'zhangsan',
      password: '123456',
      realName: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138001',
      orgId: dept1.id,
      status: 'active'
    });

    const employee2 = await User.create({
      username: 'lisi',
      password: '123456',
      realName: '李四',
      email: 'lisi@example.com',
      phone: '13800138002',
      orgId: dept2.id,
      status: 'active'
    });

    console.log('用户数据初始化完成');

    await UserRole.create({
      userId: adminUser.id,
      roleId: adminRole.id
    });

    await UserRole.create({
      userId: employee1.id,
      roleId: userRole.id
    });

    await UserRole.create({
      userId: employee2.id,
      roleId: userRole.id
    });

    console.log('用户角色关联完成');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Schedule.create({
      title: '周例会',
      description: '每周一上午的部门周例会',
      type: 'department',
      startTime: new Date(today.setHours(9, 0, 0, 0)),
      endTime: new Date(today.setHours(10, 0, 0, 0)),
      isAllDay: false,
      location: '会议室A',
      reminder: 30,
      color: '#67C23A',
      status: 'confirmed',
      visibility: 'department',
      creatorId: adminUser.id,
      orgId: company.id
    });

    await Schedule.create({
      title: '个人工作计划',
      description: '制定本周个人工作计划',
      type: 'personal',
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
      isAllDay: false,
      location: '工位',
      reminder: 15,
      color: '#409EFF',
      status: 'pending',
      visibility: 'private',
      creatorId: employee1.id,
      orgId: dept1.id
    });

    console.log('日程数据初始化完成');
    console.log('');
    console.log('========================================');
    console.log('初始化完成！默认登录账号：');
    console.log('管理员：admin / admin123');
    console.log('员工：zhangsan / 123456');
    console.log('员工：lisi / 123456');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('初始化数据失败:', error);
    process.exit(1);
  }
}

initData();
