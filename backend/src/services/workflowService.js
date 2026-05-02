const { v4: uuidv4 } = require('uuid');

class WorkflowService {
  constructor(db) {
    this.db = db;
  }

  getStateInfo(entityType, stateCode) {
    return this.db.prepare(`
      SELECT * FROM workflow_states 
      WHERE entity_type = ? AND state_code = ?
    `).get(entityType, stateCode);
  }

  getAvailableTransitions(entityType, fromState, userRole) {
    let transitions;
    
    if (fromState === '*') {
      transitions = this.db.prepare(`
        SELECT * FROM workflow_transitions 
        WHERE entity_type = ? AND from_state = '*'
      `).all(entityType);
    } else {
      transitions = this.db.prepare(`
        SELECT * FROM workflow_transitions 
        WHERE entity_type = ? AND (from_state = ? OR from_state = '*')
      `).all(entityType, fromState);
    }

    return transitions.filter(transition => {
      if (!transition.allowed_roles || transition.allowed_roles === '') return true;
      const allowedRoles = transition.allowed_roles.split(',');
      
      if (fromState === 'pending_initiation' && userRole === 'project_manager') {
        return true;
      }
      
      return allowedRoles.includes(userRole) || allowedRoles.includes('*');
    });
  }

  getStateActions(entityType, stateCode) {
    const stateActions = {
      project: {
        draft: {
          allowed: ['view', 'edit', 'submit', 'delete'],
          forbidden: ['approve', 'execute_task', 'accept'],
          responsible: 'project_manager',
          downstream: 'pending_initiation'
        },
        pending_initiation: {
          allowed: ['view', 'approve_init', 'reject_init'],
          forbidden: ['delete', 'execute_task'],
          responsible: 'management,project_manager',
          downstream: 'initiated'
        },
        initiated: {
          allowed: ['view', 'start_breakdown'],
          forbidden: ['delete', 'execute_task'],
          responsible: 'project_manager',
          downstream: 'task_breakdown'
        },
        task_breakdown: {
          allowed: ['view', 'edit_task', 'create_task', 'complete_breakdown'],
          forbidden: ['delete', 'execute_task'],
          responsible: 'project_manager',
          downstream: 'executing'
        },
        executing: {
          allowed: ['view', 'execute_task', 'update_task', 'enter_acceptance'],
          forbidden: ['delete', 'breakdown'],
          responsible: 'member',
          downstream: 'acceptance'
        },
        acceptance: {
          allowed: ['view', 'test', 'approve_acceptance', 'reject_acceptance'],
          forbidden: ['edit', 'delete', 'execute_task'],
          responsible: 'tester,customer',
          downstream: 'review_archive'
        },
        review_archive: {
          allowed: ['view', 'review', 'archive', 'complete_review'],
          forbidden: ['edit', 'delete', 'execute_task'],
          responsible: 'project_manager',
          downstream: 'completed'
        },
        completed: {
          allowed: ['view', 'export'],
          forbidden: ['edit', 'delete', 'execute'],
          responsible: 'management',
          downstream: null
        },
        cancelled: {
          allowed: ['view'],
          forbidden: ['edit', 'delete', 'execute'],
          responsible: 'management',
          downstream: null
        }
      }
    };

    return stateActions[entityType]?.[stateCode] || {
      allowed: ['view'],
      forbidden: ['edit', 'delete'],
      responsible: 'unknown',
      downstream: null
    };
  }

  canPerformAction(entityType, stateCode, action, userRole) {
    const stateActions = this.getStateActions(entityType, stateCode);
    return stateActions.allowed.includes(action) && !stateActions.forbidden.includes(action);
  }

  transitionProjectState(projectId, actionCode, userId, comment) {
    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const transitions = this.getAvailableTransitions('project', project.status, user.role);
    const transition = transitions.find(t => t.action_code === actionCode);

    if (!transition) {
      throw new Error(`当前状态 [${project.status}] 不允许执行动作 [${actionCode}]`);
    }

    const oldStatus = project.status;
    const newStatus = transition.to_state;

    const updateProject = this.db.prepare(`
      UPDATE projects 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    updateProject.run(newStatus, projectId);

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, old_value, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(
      uuidv4(),
      userId,
      actionCode,
      'project',
      projectId,
      project.name,
      oldStatus,
      newStatus
    );

    if (comment) {
      const addComment = this.db.prepare(`
        INSERT INTO comments (id, entity_type, entity_id, content, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      addComment.run(uuidv4(), 'project', projectId, comment, userId);
    }

    this.createNotificationForTransition(projectId, newStatus, transition, user);

    return {
      success: true,
      projectId,
      oldStatus,
      newStatus,
      action: actionCode,
      transitionedAt: new Date().toISOString()
    };
  }

  createNotificationForTransition(projectId, newStatus, transition, user) {
    const project = this.db.prepare(`
      SELECT p.*, 
             pm.name as pm_name, pm.email as pm_email,
             creator.name as creator_name
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE p.id = ?
    `).get(projectId);

    const notificationMessages = {
      pending_initiation: { title: '新项目待立项', content: `项目「${project.name}」已提交立项申请，请审批。` },
      initiated: { title: '项目已立项', content: `项目「${project.name}」已通过立项审批，可开始任务拆解。` },
      task_breakdown: { title: '任务拆解开始', content: `项目「${project.name}」已进入任务拆解阶段。` },
      executing: { title: '项目开始执行', content: `项目「${project.name}」任务拆解完成，已进入执行协作阶段。` },
      acceptance: { title: '项目进入验收', content: `项目「${project.name}」已进入验收阶段，请测试。` },
      review_archive: { title: '项目验收通过', content: `项目「${project.name}」验收通过，进入复盘归档阶段。` },
      completed: { title: '项目完成', content: `项目「${project.name}」已完成复盘归档。` },
      cancelled: { title: '项目已取消', content: `项目「${project.name}」已被取消。` }
    };

    const message = notificationMessages[newStatus] || {
      title: '项目状态变更',
      content: `项目「${project.name}」状态已变更。`
    };

    const notifyUsers = new Set();
    
    if (project.project_manager_id) notifyUsers.add(project.project_manager_id);
    if (project.created_by) notifyUsers.add(project.created_by);

    if (newStatus === 'pending_initiation') {
      const managers = this.db.prepare("SELECT id FROM users WHERE role = 'management'").all();
      managers.forEach(m => notifyUsers.add(m.id));
    }

    if (newStatus === 'acceptance') {
      const testers = this.db.prepare("SELECT id FROM users WHERE role = 'tester'").all();
      testers.forEach(t => notifyUsers.add(t.id));
    }

    const insertNotification = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, entity_type, entity_id, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    notifyUsers.forEach(userId => {
      if (userId === user.id) return;
      
      insertNotification.run(
        uuidv4(),
        userId,
        'project_status_change',
        message.title,
        message.content,
        'project',
        projectId,
        `/projects/${projectId}`
      );
    });
  }

  getProjectStatusBoard(userId, userRole) {
    const query = `
      SELECT 
        p.*,
        pm.name as project_manager_name,
        creator.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'in_progress') as in_progress_tasks
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      LEFT JOIN users creator ON p.created_by = creator.id
      ${userRole !== 'management' ? 'WHERE p.created_by = ? OR p.project_manager_id = ? OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assignee_id = ?)' : ''}
      ORDER BY p.updated_at DESC
    `;

    let projects;
    if (userRole === 'management') {
      projects = this.db.prepare(query).all();
    } else {
      projects = this.db.prepare(query).all(userId, userId, userId);
    }

    const stateInfo = this.db.prepare(`
      SELECT state_code, state_name, description 
      FROM workflow_states 
      WHERE entity_type = 'project'
      ORDER BY sort_order
    `).all();

    const board = stateInfo.map(state => ({
      stateCode: state.state_code,
      stateName: state.state_name,
      description: state.description,
      projects: projects.filter(p => p.status === state.state_code)
    }));

    return {
      board,
      statistics: {
        total: projects.length,
        byStatus: stateInfo.reduce((acc, state) => {
          acc[state.state_code] = projects.filter(p => p.status === state.state_code).length;
          return acc;
        }, {})
      }
    };
  }
}

module.exports = WorkflowService;
