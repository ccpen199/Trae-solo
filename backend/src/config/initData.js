const { Role, User, Category, Board } = require('../models');
const bcrypt = require('bcryptjs');

async function initRoles() {
  const roles = [
    {
      name: 'admin',
      displayName: '管理员',
      description: '拥有最高权限，可以管理所有内容和用户',
      permissions: [
        'manage_users', 'manage_roles', 'manage_categories', 'manage_boards',
        'manage_topics', 'manage_replies', 'view_logs', 'ban_users',
        'create_topic', 'update_topic', 'delete_topic',
        'create_reply', 'update_reply', 'delete_reply',
        'lock_topic', 'top_topic', 'highlight_topic'
      ],
      level: 100
    },
    {
      name: 'moderator',
      displayName: '版主',
      description: '可以管理指定版块的主题和回复',
      permissions: [
        'create_topic', 'update_topic', 'delete_topic',
        'create_reply', 'update_reply', 'delete_reply',
        'lock_topic', 'top_topic', 'highlight_topic'
      ],
      level: 50
    },
    {
      name: 'user',
      displayName: '普通用户',
      description: '已注册用户，可以发帖、回帖、编辑个人信息',
      permissions: [
        'create_topic', 'update_topic', 'delete_topic',
        'create_reply', 'update_reply', 'delete_reply',
        'edit_profile'
      ],
      level: 10
    },
    {
      name: 'guest',
      displayName: '游客',
      description: '未登录用户，只能浏览公开内容',
      permissions: ['view_public'],
      level: 0
    }
  ];

  for (const role of roles) {
    const [existingRole, created] = await Role.findOrCreate({
      where: { name: role.name },
      defaults: role
    });
    
    if (!created) {
      await existingRole.update(role);
    }
  }

  console.log('角色初始化完成');
  return Role.findOne({ where: { name: 'admin' } });
}

async function ensurePasswordEncrypted(user, plainPassword) {
  if (!user) return;
  
  const isMatch = await bcrypt.compare(plainPassword, user.password);
  if (!isMatch) {
    console.log(`重置用户 "${user.username}" 的密码...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    await user.update({ password: hashedPassword });
    console.log(`用户 "${user.username}" 密码已重置`);
  }
}

async function initAdmin(adminRole) {
  if (!adminRole) return;

  const adminPassword = 'admin123';
  const [admin, created] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      email: 'admin@forum.com',
      password: adminPassword,
      nickname: '论坛管理员',
      status: 'active',
      roleId: adminRole.id
    }
  });

  if (created) {
    console.log('管理员账户创建完成: admin / admin123');
  } else {
    console.log('管理员账户已存在，检查密码...');
    await ensurePasswordEncrypted(admin, adminPassword);
  }

  return admin;
}

async function initTestUser(userRole) {
  if (!userRole) return;

  const testPassword = '123456';
  const [testUser, created] = await User.findOrCreate({
    where: { username: 'testuser' },
    defaults: {
      username: 'testuser',
      email: 'test@forum.com',
      password: testPassword,
      nickname: '测试用户',
      status: 'active',
      roleId: userRole.id
    }
  });

  if (created) {
    console.log('测试用户创建完成: testuser / 123456');
  } else {
    console.log('测试用户已存在，检查密码...');
    await ensurePasswordEncrypted(testUser, testPassword);
  }

  return testUser;
}

async function initCategoriesAndBoards() {
  const categories = [
    {
      name: '综合讨论',
      description: '综合讨论区',
      sortOrder: 1,
      boards: [
        { name: '新人报道', description: '新人报到，认识新朋友', sortOrder: 1 },
        { name: '灌水闲聊', description: '闲聊灌水，轻松一刻', sortOrder: 2 },
        { name: '站务公告', description: '论坛公告和事务处理', sortOrder: 3 }
      ]
    },
    {
      name: '技术交流',
      description: '技术交流与分享',
      sortOrder: 2,
      boards: [
        { name: '前端开发', description: 'HTML/CSS/JavaScript/Vue/React等前端技术', sortOrder: 1 },
        { name: '后端开发', description: 'Java/Python/Node.js/Go等后端技术', sortOrder: 2 },
        { name: '移动开发', description: 'iOS/Android/Flutter等移动开发技术', sortOrder: 3 },
        { name: '数据库', description: 'MySQL/PostgreSQL/Redis/MongoDB等数据库技术', sortOrder: 4 }
      ]
    },
    {
      name: '生活分享',
      description: '生活点滴分享',
      sortOrder: 3,
      boards: [
        { name: '美食天地', description: '美食分享与烹饪技巧', sortOrder: 1 },
        { name: '旅行摄影', description: '旅行见闻与摄影作品', sortOrder: 2 },
        { name: '影音娱乐', description: '电影、音乐、游戏讨论', sortOrder: 3 }
      ]
    }
  ];

  for (const catData of categories) {
    const [category, created] = await Category.findOrCreate({
      where: { name: catData.name },
      defaults: {
        name: catData.name,
        description: catData.description,
        sortOrder: catData.sortOrder
      }
    });

    for (const boardData of catData.boards) {
      await Board.findOrCreate({
        where: { name: boardData.name, categoryId: category.id },
        defaults: {
          name: boardData.name,
          description: boardData.description,
          categoryId: category.id,
          sortOrder: boardData.sortOrder,
          isPublic: true
        }
      });
    }

    console.log(`分区 "${catData.name}" 及其版块初始化完成`);
  }
}

async function initAllData() {
  try {
    console.log('开始初始化数据...');
    
    const adminRole = await initRoles();
    await initAdmin(adminRole);
    
    const userRole = await Role.findOne({ where: { name: 'user' } });
    await initTestUser(userRole);
    
    await initCategoriesAndBoards();
    
    console.log('所有数据初始化完成!');
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
}

module.exports = initAllData;
