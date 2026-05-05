const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('./src/models');

const resetAdminPassword = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@groupbuy.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('正在重置管理员密码...');
    console.log('邮箱:', adminEmail);
    console.log('新密码:', adminPassword);

    const admin = await User.findOne({ where: { email: adminEmail } });

    if (admin) {
      admin.password = adminPassword;
      await admin.save();
      console.log('管理员密码重置成功！');
    } else {
      console.log('管理员不存在，正在创建...');
      await User.create({
        username: '管理员',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'active',
      });
      console.log('管理员创建成功！');
    }

    process.exit(0);
  } catch (error) {
    console.error('重置管理员密码失败:', error);
    process.exit(1);
  }
};

resetAdminPassword();
