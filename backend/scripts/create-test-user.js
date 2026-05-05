const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

const createTestUser = async () => {
  try {
    const username = 'user';
    const password = 'user123';
    const real_name = '仓库管理员';
    const email = 'user@example.com';
    const phone = '13800138001';
    const role = 'user';
    const status = 'active';

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Creating test user...');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('Hash:', hashedPassword);
    
    const checkResult = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (checkResult.rows.length > 0) {
      console.log('User already exists, updating password...');
      const updateResult = await query(
        `UPDATE users 
         SET password = $1, real_name = $2, email = $3, phone = $4, role = $5, status = $6, updated_at = CURRENT_TIMESTAMP
         WHERE username = $7
         RETURNING *`,
        [hashedPassword, real_name, email, phone, role, status, username]
      );
      if (updateResult.rows.length > 0) {
        console.log('User updated successfully!');
      }
    } else {
      console.log('Creating new user...');
      const insertResult = await query(
        `INSERT INTO users (username, password, real_name, email, phone, role, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [username, hashedPassword, real_name, email, phone, role, status]
      );
      if (insertResult.rows.length > 0) {
        console.log('User created successfully!');
      }
    }

    console.log('');
    console.log('========================================');
    console.log('  测试账号信息');
    console.log('========================================');
    console.log('  普通仓库管理员账号:');
    console.log('  - 用户名: user');
    console.log('  - 密码: user123');
    console.log('  - 角色: 仓库管理员 (user)');
    console.log('  - 权限: 可访问供应商、商品、出入库、库存管理');
    console.log('  - 不可访问: 用户管理、日志管理');
    console.log('');
    console.log('  系统管理员账号:');
    console.log('  - 用户名: admin');
    console.log('  - 密码: admin123');
    console.log('  - 角色: 系统管理员 (admin)');
    console.log('  - 权限: 所有功能');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestUser();
