require('dotenv').config();
const sequelize = require('../config/database');
const { 
  User, 
  Role, 
  Permission, 
  UserRole, 
  RolePermission,
  ProductCategory,
  Product,
  NewsCategory,
  News
} = require('../models');

const seedData = async () => {
  try {
    console.log('开始初始化数据库...');
    
    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');
    
    const superAdminRole = await Role.create({
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统所有权限',
      is_system: true,
      status: 'active'
    });
    
    const adminRole = await Role.create({
      name: '管理员',
      code: 'admin',
      description: '拥有大部分管理权限',
      is_system: true,
      status: 'active'
    });
    
    const memberRole = await Role.create({
      name: '会员',
      code: 'member',
      description: '普通会员用户',
      is_system: true,
      status: 'active'
    });
    
    console.log('角色创建完成');
    
    const permissions = [
      { name: '系统管理', code: 'system', type: 'menu', path: '/admin/system', icon: 'setting', sort: 100 },
      { name: '用户管理', code: 'system:user', type: 'menu', path: '/admin/system/user', parentId: null, sort: 101 },
      { name: '角色管理', code: 'system:role', type: 'menu', path: '/admin/system/role', parentId: null, sort: 102 },
      { name: '权限管理', code: 'system:permission', type: 'menu', path: '/admin/system/permission', parentId: null, sort: 103 },
      
      { name: '产品管理', code: 'product', type: 'menu', path: '/admin/product', icon: 'shop', sort: 10 },
      { name: '产品列表', code: 'product:list', type: 'menu', path: '/admin/product/list', parentId: null, sort: 11 },
      { name: '产品分类', code: 'product:category', type: 'menu', path: '/admin/product/category', parentId: null, sort: 12 },
      
      { name: '新闻管理', code: 'news', type: 'menu', path: '/admin/news', icon: 'file-text', sort: 20 },
      { name: '新闻列表', code: 'news:list', type: 'menu', path: '/admin/news/list', parentId: null, sort: 21 },
      { name: '新闻分类', code: 'news:category', type: 'menu', path: '/admin/news/category', parentId: null, sort: 22 },
      
      { name: '下载管理', code: 'download', type: 'menu', path: '/admin/download', icon: 'download', sort: 30 },
      { name: '留言管理', code: 'message', type: 'menu', path: '/admin/message', icon: 'message', sort: 40 },
      { name: '招聘管理', code: 'job', type: 'menu', path: '/admin/job', icon: 'team', sort: 50 },
    ];
    
    const createdPermissions = [];
    for (const perm of permissions) {
      const created = await Permission.create({
        name: perm.name,
        code: perm.code,
        type: perm.type,
        path: perm.path,
        icon: perm.icon,
        sort: perm.sort,
        status: 'active'
      });
      createdPermissions.push(created);
    }
    
    for (const role of [superAdminRole, adminRole]) {
      for (const perm of createdPermissions) {
        await RolePermission.create({
          role_id: role.id,
          permission_id: perm.id
        });
      }
    }
    
    console.log('权限创建完成');
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      phone: '13800138000',
      password: 'admin123',
      nickname: '管理员',
      user_type: 'admin',
      status: 'active'
    });
    
    const testUser = await User.create({
      username: 'test',
      email: 'test@example.com',
      phone: '13800138001',
      password: 'test123',
      nickname: '测试用户',
      user_type: 'member',
      status: 'active'
    });
    
    await UserRole.create({ user_id: adminUser.id, role_id: superAdminRole.id });
    await UserRole.create({ user_id: testUser.id, role_id: memberRole.id });
    
    console.log('用户创建完成');
    console.log('管理员账号: admin / admin123');
    console.log('测试用户账号: test / test123');
    
    const productCategories = [
      { name: '电子产品', code: 'electronics', description: '各类电子产品', sort: 1 },
      { name: '办公设备', code: 'office', description: '办公设备及耗材', sort: 2 },
      { name: '家用电器', code: 'home', description: '家用电器产品', sort: 3 },
    ];
    
    const createdProductCategories = [];
    for (const cat of productCategories) {
      const created = await ProductCategory.create({
        name: cat.name,
        code: cat.code,
        description: cat.description,
        sort: cat.sort,
        status: 'active',
        is_show: true
      });
      createdProductCategories.push(created);
    }
    
    const subCategories = [
      { name: '智能手机', code: 'smartphone', parentIndex: 0, sort: 1 },
      { name: '平板电脑', code: 'tablet', parentIndex: 0, sort: 2 },
      { name: '笔记本电脑', code: 'laptop', parentIndex: 0, sort: 3 },
      { name: '打印机', code: 'printer', parentIndex: 1, sort: 1 },
      { name: '投影仪', code: 'projector', parentIndex: 1, sort: 2 },
    ];
    
    for (const sub of subCategories) {
      await ProductCategory.create({
        name: sub.name,
        code: sub.code,
        parent_id: createdProductCategories[sub.parentIndex].id,
        level: 2,
        sort: sub.sort,
        status: 'active',
        is_show: true
      });
    }
    
    console.log('产品分类创建完成');
    
    const products = [
      { title: '智能旗舰手机 Pro Max', code: 'PHONE-001', categoryIndex: 0, price: 6999, summary: '最新旗舰智能手机，搭载最新处理器', is_recommended: true, is_hot: true },
      { title: '轻薄商务笔记本电脑', code: 'LAPTOP-001', categoryIndex: 2, price: 8999, summary: '轻薄便携，商务办公首选', is_recommended: true },
      { title: '高清办公投影仪', code: 'PROJ-001', categoryIndex: 4, price: 4999, summary: '高清画质，会议必备', is_hot: true },
      { title: '无线彩色打印机', code: 'PRINT-001', categoryIndex: 3, price: 2999, summary: '无线打印，高效办公', is_new: true },
      { title: '专业平板电脑', code: 'TABLET-001', categoryIndex: 1, price: 3999, summary: '专业生产力工具', is_recommended: true },
    ];
    
    for (const prod of products) {
      await Product.create({
        title: prod.title,
        code: prod.code,
        category_id: createdProductCategories[prod.categoryIndex]?.id || null,
        summary: prod.summary,
        description: `这是${prod.title}的详细描述。产品特性包括高性能、高品质、优质服务等。`,
        price: prod.price,
        original_price: prod.price * 1.2,
        stock: 100,
        unit: '台',
        is_recommended: prod.is_recommended || false,
        is_new: prod.is_new || false,
        is_hot: prod.is_hot || false,
        status: 'active',
        publish_at: new Date()
      });
    }
    
    console.log('产品创建完成');
    
    const newsCategories = [
      { name: '公司动态', code: 'company', description: '公司最新动态和公告', sort: 1 },
      { name: '行业资讯', code: 'industry', description: '行业最新资讯', sort: 2 },
      { name: '媒体报道', code: 'media', description: '媒体对公司的报道', sort: 3 },
      { name: '合作交流', code: 'cooperation', description: '合作交流活动', sort: 4 },
    ];
    
    const createdNewsCategories = [];
    for (const cat of newsCategories) {
      const created = await NewsCategory.create({
        name: cat.name,
        code: cat.code,
        description: cat.description,
        sort: cat.sort,
        status: 'active',
        is_show: true
      });
      createdNewsCategories.push(created);
    }
    
    console.log('新闻分类创建完成');
    
    const newsItems = [
      { title: '公司2024年度表彰大会圆满举行', categoryIndex: 0, is_top: true, is_recommended: true, summary: '公司年度表彰大会在总部隆重举行，表彰了过去一年中表现优秀的团队和个人。' },
      { title: '新产品发布会即将召开', categoryIndex: 0, is_recommended: true, summary: '公司将于下月举办新产品发布会，敬请期待最新产品系列。' },
      { title: '行业数字化转型趋势分析', categoryIndex: 1, is_hot: true, summary: '随着技术的不断发展，行业数字化转型已成为必然趋势。' },
      { title: '我司荣获年度最佳创新企业奖', categoryIndex: 2, is_recommended: true, summary: '在刚刚结束的行业颁奖典礼上，我司荣获年度最佳创新企业奖。' },
      { title: '与知名企业达成战略合作协议', categoryIndex: 3, summary: '公司与多家知名企业达成战略合作协议，共同推动行业发展。' },
    ];
    
    for (const news of newsItems) {
      await News.create({
        title: news.title,
        category_id: createdNewsCategories[news.categoryIndex]?.id || null,
        summary: news.summary,
        content: `<p>${news.summary}</p><p>这是新闻的详细内容部分。在这里可以详细介绍新闻的背景、经过和影响等信息。</p>`,
        author: '管理员',
        source: '公司官网',
        is_top: news.is_top || false,
        is_recommended: news.is_recommended || false,
        is_hot: news.is_hot || false,
        status: 'published',
        publish_at: new Date()
      });
    }
    
    console.log('新闻创建完成');
    
    console.log('\n========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    console.log('管理员账号: admin / admin123');
    console.log('测试用户账号: test / test123');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('初始化数据库失败:', error);
    process.exit(1);
  }
};

seedData();