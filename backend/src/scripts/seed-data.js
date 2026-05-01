require('dotenv').config();
const { sequelize, User, Category } = require('../models');
const logger = require('../utils/logger');

async function seedData() {
  console.log('========================================');
  console.log('  初始化种子数据');
  console.log('========================================');
  
  const transaction = await sequelize.transaction();
  
  try {
    console.log('\n1. 创建默认分类...');
    const defaultCategories = [
      { name: '科技', code: 'tech', keywords: '科技,互联网,人工智能,AI,云计算,大数据,5G,区块链', sort: 1, status: 'active' },
      { name: '财经', code: 'finance', keywords: '财经,股票,基金,投资,理财,银行,保险,证券', sort: 2, status: 'active' },
      { name: '体育', code: 'sports', keywords: '体育,足球,篮球,NBA,CBA,奥运会,世界杯,网球', sort: 3, status: 'active' },
      { name: '娱乐', code: 'entertainment', keywords: '娱乐,明星,电影,电视剧,音乐,综艺,演唱会', sort: 4, status: 'active' },
      { name: '健康', code: 'health', keywords: '健康,医疗,养生,健身,减肥,饮食,运动', sort: 5, status: 'active' },
      { name: '教育', code: 'education', keywords: '教育,学习,学校,高考,考研,留学,培训', sort: 6, status: 'active' },
      { name: '汽车', code: 'auto', keywords: '汽车,新能源,特斯拉,电动车,SUV,轿车,跑车', sort: 7, status: 'active' },
      { name: '房产', code: 'house', keywords: '房产,房价,买房,租房,装修,家具,家居', sort: 8, status: 'active' },
      { name: '美食', code: 'food', keywords: '美食,美食探店,烹饪,菜谱,餐厅,美食推荐', sort: 9, status: 'active' },
      { name: '旅游', code: 'travel', keywords: '旅游,旅行,景点,酒店,机票,攻略,游记', sort: 10, status: 'active' },
      { name: '游戏', code: 'game', keywords: '游戏,电竞,手游,端游,王者荣耀,原神,吃鸡', sort: 11, status: 'active' },
      { name: '军事', code: 'military', keywords: '军事,武器,军队,国防,战争,战略,装备', sort: 12, status: 'active' }
    ];

    for (const categoryData of defaultCategories) {
      const [category, created] = await Category.findOrCreate({
        where: { code: categoryData.code },
        defaults: categoryData,
        transaction
      });
      if (created) {
        console.log(`  ✓ 创建分类: ${category.name}`);
      } else {
        console.log(`  跳过分类: ${category.name} (已存在)`);
      }
    }

    console.log('\n2. 创建默认管理员账户...');
    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123456',
        nickname: '超级管理员',
        role: 'admin',
        status: 'active'
      },
      transaction
    });
    
    if (adminCreated) {
      console.log(`  ✓ 创建管理员: admin / admin123456`);
    } else {
      console.log(`  跳过管理员: admin (已存在)`);
    }

    console.log('\n3. 创建示例运营账户...');
    const [operatorUser, operatorCreated] = await User.findOrCreate({
      where: { username: 'operator' },
      defaults: {
        username: 'operator',
        password: 'operator123',
        nickname: '内容运营',
        role: 'operator',
        status: 'active'
      },
      transaction
    });
    
    if (operatorCreated) {
      console.log(`  ✓ 创建运营账户: operator / operator123`);
    } else {
      console.log(`  跳过运营账户: operator (已存在)`);
    }

    console.log('\n4. 创建示例算法工程师账户...');
    const [algorithmUser, algorithmCreated] = await User.findOrCreate({
      where: { username: 'algorithm' },
      defaults: {
        username: 'algorithm',
        password: 'algorithm123',
        nickname: '算法工程师',
        role: 'algorithm',
        status: 'active'
      },
      transaction
    });
    
    if (algorithmCreated) {
      console.log(`  ✓ 创建算法账户: algorithm / algorithm123`);
    } else {
      console.log(`  跳过算法账户: algorithm (已存在)`);
    }

    console.log('\n5. 创建示例广告主账户...');
    const [advertiserUser, advertiserCreated] = await User.findOrCreate({
      where: { username: 'advertiser' },
      defaults: {
        username: 'advertiser',
        password: 'advertiser123',
        nickname: '广告主',
        role: 'advertiser',
        status: 'active'
      },
      transaction
    });
    
    if (advertiserCreated) {
      console.log(`  ✓ 创建广告主账户: advertiser / advertiser123`);
    } else {
      console.log(`  跳过广告主账户: advertiser (已存在)`);
    }

    console.log('\n6. 创建示例读者账户...');
    const [readerUser, readerCreated] = await User.findOrCreate({
      where: { username: 'reader' },
      defaults: {
        username: 'reader',
        password: 'reader123',
        nickname: '测试读者',
        role: 'reader',
        status: 'active'
      },
      transaction
    });
    
    if (readerCreated) {
      console.log(`  ✓ 创建读者账户: reader / reader123`);
    } else {
      console.log(`  跳过读者账户: reader (已存在)`);
    }

    await transaction.commit();
    
    console.log('');
    console.log('========================================');
    console.log('  种子数据初始化完成！');
    console.log('========================================');
    console.log('');
    console.log('可用账户列表：');
    console.log('');
    console.log('  🔐 超级管理员');
    console.log('     用户名: admin');
    console.log('     密码: admin123456');
    console.log('     角色: 管理员');
    console.log('');
    console.log('  📊 运营管理');
    console.log('     用户名: operator');
    console.log('     密码: operator123');
    console.log('     角色: 内容运营');
    console.log('');
    console.log('  🔧 算法工程师');
    console.log('     用户名: algorithm');
    console.log('     密码: algorithm123');
    console.log('     角色: 算法工程师');
    console.log('');
    console.log('  📢 广告主');
    console.log('     用户名: advertiser');
    console.log('     密码: advertiser123');
    console.log('     角色: 广告主');
    console.log('');
    console.log('  👤 普通读者');
    console.log('     用户名: reader');
    console.log('     密码: reader123');
    console.log('     角色: 读者');
    console.log('');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('种子数据初始化失败:', error);
    logger.error('种子数据初始化失败', error);
    process.exit(1);
  }
}

seedData();
