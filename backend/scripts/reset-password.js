const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

const resetAdminPassword = async () => {
  try {
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('New password hash:', hashedPassword);
    
    const result = await query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('Password updated successfully for user: admin');
      console.log('Password: admin123');
    } else {
      console.log('User not found, creating admin user...');
      const insertResult = await query(
        'INSERT INTO users (username, password, real_name, email, phone, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        ['admin', hashedPassword, '系统管理员', 'admin@example.com', '13800138000', 'admin', 'active']
      );
      if (insertResult.rows.length > 0) {
        console.log('Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin123');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdminPassword();
