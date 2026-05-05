const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  console.log('开始创建数据库表...');

  // 用户表
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      department VARCHAR(100),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 公文表
  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      security_level VARCHAR(50) NOT NULL DEFAULT '普通',
      document_number VARCHAR(50) UNIQUE,
      document_type VARCHAR(50) NOT NULL DEFAULT '发文',
      status VARCHAR(50) NOT NULL DEFAULT '草稿',
      current_node VARCHAR(100),
      creator_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived_at TIMESTAMP,
      is_archived BOOLEAN DEFAULT FALSE
    );
  `);

  // 流程节点表
  await query(`
    CREATE TABLE IF NOT EXISTS process_nodes (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      node_name VARCHAR(100) NOT NULL,
      node_order INTEGER NOT NULL,
      node_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT '待处理',
      handler_id INTEGER REFERENCES users(id),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 审批意见表
  await query(`
    CREATE TABLE IF NOT EXISTS approval_comments (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      node_id INTEGER REFERENCES process_nodes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      comment TEXT NOT NULL,
      action VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 待办任务表
  await query(`
    CREATE TABLE IF NOT EXISTS todo_tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      node_id INTEGER REFERENCES process_nodes(id) ON DELETE CASCADE,
      task_type VARCHAR(50) NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT '待处理',
      priority VARCHAR(20) DEFAULT '普通',
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `);

  // 权限范围表
  await query(`
    CREATE TABLE IF NOT EXISTS document_permissions (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      permission_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_id, user_id, permission_type)
    );
  `);

  // 附件表
  await query(`
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT,
      file_type VARCHAR(100),
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建索引
  await query(`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_documents_creator ON documents(creator_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_process_nodes_document ON process_nodes(document_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_todo_tasks_user ON todo_tasks(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_todo_tasks_status ON todo_tasks(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_approval_comments_document ON approval_comments(document_id);`);

  console.log('数据库表创建完成！');

  // 创建默认用户
  const defaultUsers = [
    { username: 'admin', password: 'admin123', name: '管理员', role: 'admin', department: '综合部' },
    { username: 'user1', password: 'user123', name: '张三', role: 'user', department: '技术部' },
    { username: 'user2', password: 'user123', name: '李四', role: 'user', department: '财务部' },
    { username: 'approver', password: 'approver123', name: '王总', role: 'approver', department: '领导层' },
  ];

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const existing = await query(
      'SELECT id FROM users WHERE username = $1',
      [user.username]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO users (username, password, name, email, department, role) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.username, hashedPassword, user.name, `${user.username}@company.com`, user.department, user.role]
      );
      console.log(`创建默认用户: ${user.username}`);
    }
  }

  console.log('默认用户创建完成！');
};

module.exports = {
  createTables,
};
