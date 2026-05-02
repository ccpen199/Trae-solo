const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

function columnExists(db, tableName, columnName) {
  const result = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return result.some(col => col.name === columnName);
}

function migrateDatabase(db) {
  console.log('检查数据库迁移...');
  
  const migrations = [
    {
      version: '1.1',
      description: '添加 projects 表的新字段',
      check: () => !columnExists(db, 'projects', 'project_type'),
      execute: () => {
        db.exec(`
          ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'internal';
          ALTER TABLE projects ADD COLUMN acceptance_criteria TEXT;
          ALTER TABLE projects ADD COLUMN risk_assessment TEXT;
          ALTER TABLE projects ADD COLUMN team_members TEXT;
        `);
        console.log('已添加 projects 表的新字段: project_type, acceptance_criteria, risk_assessment, team_members');
      }
    }
  ];
  
  migrations.forEach(migration => {
    if (migration.check()) {
      console.log(`执行迁移: ${migration.version} - ${migration.description}`);
      migration.execute();
      console.log(`迁移完成: ${migration.version}`);
    }
  });
  
  console.log('数据库迁移检查完成');
}

function initDatabase(dbPath) {
  const dbDir = path.dirname(dbPath);
  require('fs').mkdirSync(dbDir, { recursive: true });
  
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT DEFAULT 'medium',
      project_type TEXT DEFAULT 'internal',
      project_manager_id TEXT,
      expected_start_date DATE,
      expected_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      progress INTEGER DEFAULT 0,
      budget REAL,
      tags TEXT,
      attachments TEXT,
      acceptance_criteria TEXT,
      risk_assessment TEXT,
      team_members TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_manager_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      task_no TEXT UNIQUE NOT NULL,
      project_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignee_id TEXT,
      reporter_id TEXT,
      due_date DATE,
      start_date DATE,
      end_date DATE,
      estimated_hours REAL,
      actual_hours REAL,
      progress INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      column_id TEXT,
      tags TEXT,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_columns (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      milestone_no TEXT UNIQUE NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date DATE,
      completed_date DATE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      doc_no TEXT UNIQUE NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      version INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft',
      is_locked INTEGER DEFAULT 0,
      author_id TEXT,
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT,
      file_path TEXT,
      change_log TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      entity_type TEXT,
      entity_id TEXT,
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exception_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      project_id TEXT,
      entity_type TEXT,
      entity_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      assigned_to TEXT,
      resolved_at DATETIME,
      resolved_by TEXT,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_states (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      state_code TEXT NOT NULL,
      state_name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_initial INTEGER DEFAULT 0,
      is_final INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(entity_type, state_code)
    );

    CREATE TABLE IF NOT EXISTS workflow_transitions (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      action_code TEXT NOT NULL,
      action_name TEXT NOT NULL,
      description TEXT,
      allowed_roles TEXT,
      requires_approval INTEGER DEFAULT 0,
      auto_execute INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(entity_type, from_state, action_code)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      allowed INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, resource, action)
    );

    CREATE TABLE IF NOT EXISTS edit_conflicts (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      conflict_version INTEGER NOT NULL,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      content_a TEXT,
      content_b TEXT,
      merged_content TEXT,
      status TEXT DEFAULT 'pending',
      resolved_by TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_a_id) REFERENCES users(id),
      FOREIGN KEY (user_b_id) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, name, email, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const users = [
      { id: 'user-pm-001', username: 'pm1', name: '张经理', email: 'pm1@example.com', role: 'project_manager' },
      { id: 'user-member-001', username: 'dev1', name: '李开发', email: 'dev1@example.com', role: 'member' },
      { id: 'user-member-002', username: 'dev2', name: '王开发', email: 'dev2@example.com', role: 'member' },
      { id: 'user-tester-001', username: 'tester1', name: '赵测试', email: 'tester1@example.com', role: 'tester' },
      { id: 'user-customer-001', username: 'customer1', name: '钱客户', email: 'customer1@example.com', role: 'customer' },
      { id: 'user-manager-001', username: 'manager1', name: '孙总监', email: 'manager1@example.com', role: 'management' },
    ];

    users.forEach(user => {
      insertUser.run(user.id, user.username, hashedPassword, user.name, user.email, user.role);
    });
  }

  const stateCount = db.prepare('SELECT COUNT(*) as count FROM workflow_states').get().count;
  
  if (stateCount === 0) {
    const insertState = db.prepare(`
      INSERT INTO workflow_states (id, entity_type, state_code, state_name, description, sort_order, is_initial, is_final)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const projectStates = [
      { id: 'ps-draft', entity_type: 'project', state_code: 'draft', state_name: '草稿', description: '项目初始状态', sort_order: 1, is_initial: 1, is_final: 0 },
      { id: 'ps-pending-initiation', entity_type: 'project', state_code: 'pending_initiation', state_name: '待立项', description: '等待项目立项审批', sort_order: 2, is_initial: 0, is_final: 0 },
      { id: 'ps-initiated', entity_type: 'project', state_code: 'initiated', state_name: '已立项', description: '项目已立项，等待任务拆解', sort_order: 3, is_initial: 0, is_final: 0 },
      { id: 'ps-task-breakdown', entity_type: 'project', state_code: 'task_breakdown', state_name: '任务拆解中', description: '正在进行任务拆解', sort_order: 4, is_initial: 0, is_final: 0 },
      { id: 'ps-executing', entity_type: 'project', state_code: 'executing', state_name: '执行协作中', description: '项目正在执行协作', sort_order: 5, is_initial: 0, is_final: 0 },
      { id: 'ps-acceptance', entity_type: 'project', state_code: 'acceptance', state_name: '验收中', description: '项目进入验收阶段', sort_order: 6, is_initial: 0, is_final: 0 },
      { id: 'ps-review-archive', entity_type: 'project', state_code: 'review_archive', state_name: '复盘归档', description: '项目复盘归档阶段', sort_order: 7, is_initial: 0, is_final: 0 },
      { id: 'ps-completed', entity_type: 'project', state_code: 'completed', state_name: '已完成', description: '项目已完成', sort_order: 8, is_initial: 0, is_final: 1 },
      { id: 'ps-cancelled', entity_type: 'project', state_code: 'cancelled', state_name: '已取消', description: '项目已取消', sort_order: 9, is_initial: 0, is_final: 1 },
    ];

    projectStates.forEach(state => {
      insertState.run(state.id, state.entity_type, state.state_code, state.state_name, state.description, state.sort_order, state.is_initial, state.is_final);
    });

    const insertTransition = db.prepare(`
      INSERT INTO workflow_transitions (id, entity_type, from_state, to_state, action_code, action_name, description, allowed_roles, requires_approval, auto_execute)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const projectTransitions = [
      { id: 'pt-submit', entity_type: 'project', from_state: 'draft', to_state: 'pending_initiation', action_code: 'submit', action_name: '提交立项申请', description: '项目经理提交项目立项申请', allowed_roles: 'project_manager,management', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-approve-init', entity_type: 'project', from_state: 'pending_initiation', to_state: 'initiated', action_code: 'approve_init', action_name: '批准立项', description: '管理层批准项目立项', allowed_roles: 'management', requires_approval: 1, auto_execute: 0 },
      { id: 'pt-reject-init', entity_type: 'project', from_state: 'pending_initiation', to_state: 'draft', action_code: 'reject_init', action_name: '驳回立项', description: '管理层驳回立项申请', allowed_roles: 'management', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-start-breakdown', entity_type: 'project', from_state: 'initiated', to_state: 'task_breakdown', action_code: 'start_breakdown', action_name: '开始任务拆解', description: '项目经理开始任务拆解', allowed_roles: 'project_manager', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-complete-breakdown', entity_type: 'project', from_state: 'task_breakdown', to_state: 'executing', action_code: 'complete_breakdown', action_name: '完成任务拆解', description: '任务拆解完成，进入执行阶段', allowed_roles: 'project_manager', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-enter-acceptance', entity_type: 'project', from_state: 'executing', to_state: 'acceptance', action_code: 'enter_acceptance', action_name: '进入验收', description: '项目进入验收阶段', allowed_roles: 'project_manager,tester', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-pass-acceptance', entity_type: 'project', from_state: 'acceptance', to_state: 'review_archive', action_code: 'pass_acceptance', action_name: '验收通过', description: '项目验收通过，进入复盘归档', allowed_roles: 'tester,customer,management', requires_approval: 1, auto_execute: 0 },
      { id: 'pt-fail-acceptance', entity_type: 'project', from_state: 'acceptance', to_state: 'executing', action_code: 'fail_acceptance', action_name: '验收驳回', description: '验收不通过，返回执行阶段', allowed_roles: 'tester,customer,management', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-complete-review', entity_type: 'project', from_state: 'review_archive', to_state: 'completed', action_code: 'complete_review', action_name: '完成复盘归档', description: '项目复盘归档完成', allowed_roles: 'project_manager,management', requires_approval: 0, auto_execute: 0 },
      { id: 'pt-cancel', entity_type: 'project', from_state: '*', to_state: 'cancelled', action_code: 'cancel', action_name: '取消项目', description: '取消项目', allowed_roles: 'management', requires_approval: 1, auto_execute: 0 },
    ];

    projectTransitions.forEach(transition => {
      insertTransition.run(
        transition.id, transition.entity_type, transition.from_state, transition.to_state,
        transition.action_code, transition.action_name, transition.description,
        transition.allowed_roles, transition.requires_approval, transition.auto_execute
      );
    });
  }

  const permissionCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get().count;
  
  if (permissionCount === 0) {
    const insertPermission = db.prepare(`
      INSERT INTO permissions (id, role, resource, action, allowed)
      VALUES (?, ?, ?, ?, ?)
    `);

    const permissions = [
      { id: 'perm-1', role: 'project_manager', resource: 'project', action: 'create', allowed: 1 },
      { id: 'perm-2', role: 'project_manager', resource: 'project', action: 'read', allowed: 1 },
      { id: 'perm-3', role: 'project_manager', resource: 'project', action: 'update', allowed: 1 },
      { id: 'perm-4', role: 'project_manager', resource: 'project', action: 'delete', allowed: 0 },
      { id: 'perm-5', role: 'project_manager', resource: 'task', action: 'create', allowed: 1 },
      { id: 'perm-6', role: 'project_manager', resource: 'task', action: 'read', allowed: 1 },
      { id: 'perm-7', role: 'project_manager', resource: 'task', action: 'update', allowed: 1 },
      { id: 'perm-8', role: 'project_manager', resource: 'task', action: 'delete', allowed: 1 },
      
      { id: 'perm-9', role: 'member', resource: 'project', action: 'read', allowed: 1 },
      { id: 'perm-10', role: 'member', resource: 'project', action: 'create', allowed: 0 },
      { id: 'perm-11', role: 'member', resource: 'task', action: 'read', allowed: 1 },
      { id: 'perm-12', role: 'member', resource: 'task', action: 'update', allowed: 1 },
      { id: 'perm-13', role: 'member', resource: 'task', action: 'create', allowed: 0 },
      
      { id: 'perm-14', role: 'tester', resource: 'project', action: 'read', allowed: 1 },
      { id: 'perm-15', role: 'tester', resource: 'task', action: 'read', allowed: 1 },
      { id: 'perm-16', role: 'tester', resource: 'defect', action: 'create', allowed: 1 },
      
      { id: 'perm-17', role: 'customer', resource: 'project', action: 'read', allowed: 1 },
      { id: 'perm-18', role: 'customer', resource: 'task', action: 'read', allowed: 1 },
      
      { id: 'perm-19', role: 'management', resource: 'project', action: 'read', allowed: 1 },
      { id: 'perm-20', role: 'management', resource: 'project', action: 'update', allowed: 1 },
      { id: 'perm-21', role: 'management', resource: 'project', action: 'delete', allowed: 1 },
    ];

    permissions.forEach(perm => {
      insertPermission.run(perm.id, perm.role, perm.resource, perm.action, perm.allowed);
    });
  }

  migrateDatabase(db);
  
  console.log('数据库初始化完成');
  return db;
}

module.exports = { initDatabase };
