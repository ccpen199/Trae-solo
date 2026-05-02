const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

class ProjectService {
  constructor(db) {
    this.db = db;
  }

  generateProjectNo() {
    const datePrefix = dayjs().format('YYYYMM');
    const count = this.db.prepare(`
      SELECT COUNT(*) as count FROM projects 
      WHERE project_no LIKE ?
    `).get(`${datePrefix}%`).count;
    
    const sequence = String(count + 1).padStart(4, '0');
    return `PRJ-${datePrefix}-${sequence}`;
  }

  createProject(projectData, userId) {
    const { 
      name, description, priority, project_type,
      project_manager_id, expected_start_date, expected_end_date, 
      budget, tags, attachments, acceptance_criteria, risk_assessment,
      milestones, team_members, testers
    } = projectData;

    if (!name || !name.trim()) {
      throw new Error('项目名称不能为空');
    }

    const existingName = this.db.prepare(`
      SELECT id FROM projects WHERE name = ?
    `).get(name.trim());
    
    if (existingName) {
      throw new Error('项目名称已存在');
    }

    const projectId = uuidv4();
    const projectNo = this.generateProjectNo();

    const insertProject = this.db.prepare(`
      INSERT INTO projects (
        id, project_no, name, description, status, priority, project_type,
        project_manager_id, expected_start_date, expected_end_date, 
        budget, tags, attachments, acceptance_criteria, risk_assessment,
        team_members, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertProject.run(
      projectId,
      projectNo,
      name.trim(),
      description,
      'draft',
      priority || 'medium',
      project_type || 'internal',
      project_manager_id,
      expected_start_date,
      expected_end_date,
      budget,
      tags ? JSON.stringify(tags) : null,
      attachments ? JSON.stringify(attachments) : null,
      acceptance_criteria,
      risk_assessment,
      team_members && team_members.length > 0 ? JSON.stringify(team_members) : null,
      userId
    );

    this.initProjectTaskColumns(projectId);

    if (milestones && milestones.length > 0) {
      const insertMilestone = this.db.prepare(`
        INSERT INTO milestones (
          id, milestone_no, project_id, name, description, 
          due_date, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      const datePrefix = dayjs().format('YYYYMM');
      const baseCount = this.db.prepare(`
        SELECT COUNT(*) as count FROM milestones 
        WHERE milestone_no LIKE ?
      `).get(`ML-${datePrefix}%`).count;

      milestones.forEach((milestone, index) => {
        const sequence = String(baseCount + index + 1).padStart(4, '0');
        const milestoneNo = `ML-${datePrefix}-${sequence}`;
        
        insertMilestone.run(
          uuidv4(),
          milestoneNo,
          projectId,
          milestone.name,
          milestone.description,
          milestone.due_date,
          index + 1
        );
      });
    }

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(uuidv4(), userId, 'create_project', 'project', projectId, name);

    return this.getProjectById(projectId);
  }

  initProjectTaskColumns(projectId) {
    const columns = [
      { id: uuidv4(), name: '待办', status: 'todo', sort_order: 1 },
      { id: uuidv4(), name: '进行中', status: 'in_progress', sort_order: 2 },
      { id: uuidv4(), name: '待审核', status: 'review', sort_order: 3 },
      { id: uuidv4(), name: '已完成', status: 'done', sort_order: 4 },
    ];

    const insertColumn = this.db.prepare(`
      INSERT INTO task_columns (id, project_id, name, status, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    columns.forEach(col => {
      insertColumn.run(col.id, projectId, col.name, col.status, col.sort_order);
    });
  }

  getProjectById(projectId) {
    const project = this.db.prepare(`
      SELECT 
        p.*,
        pm.name as project_manager_name,
        pm.role as project_manager_role,
        creator.name as creator_name,
        creator.role as creator_role
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE p.id = ?
    `).get(projectId);

    if (!project) return null;

    if (project.tags) {
      try { project.tags = JSON.parse(project.tags); } catch { project.tags = []; }
    }
    if (project.attachments) {
      try { project.attachments = JSON.parse(project.attachments); } catch { project.attachments = []; }
    }
    if (project.team_members) {
      try { project.team_members = JSON.parse(project.team_members); } catch { project.team_members = []; }
    }

    const milestones = this.db.prepare(`
      SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order ASC
    `).all(projectId);
    project.milestones = milestones || [];

    return project;
  }

  getProjects(userId, userRole, filters = {}) {
    let baseQuery = `
      SELECT 
        p.*,
        pm.name as project_manager_name,
        creator.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      LEFT JOIN users creator ON p.created_by = creator.id
    `;

    const conditions = [];
    const params = [];

    if (userRole !== 'management') {
      conditions.push(`(p.created_by = ? OR p.project_manager_id = ? OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assignee_id = ?))`);
      params.push(userId, userId, userId);
    }

    if (filters.status) {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }

    if (filters.priority) {
      conditions.push('p.priority = ?');
      params.push(filters.priority);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.project_no LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += ' ORDER BY p.updated_at DESC';

    const projects = this.db.prepare(baseQuery).all(...params);

    projects.forEach(p => {
      if (p.tags) {
        try { p.tags = JSON.parse(p.tags); } catch { p.tags = []; }
      }
      if (p.team_members) {
        try { p.team_members = JSON.parse(p.team_members); } catch { p.team_members = []; }
      }
    });

    return projects;
  }

  updateProject(projectId, projectData, userId) {
    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const allowedFields = [
      'name', 'description', 'priority', 'project_type',
      'project_manager_id', 'expected_start_date', 'expected_end_date', 
      'budget', 'tags', 'attachments', 'acceptance_criteria', 'risk_assessment',
      'team_members'
    ];
    const updates = [];
    const values = [];
    const oldValues = {};

    allowedFields.forEach(field => {
      if (projectData[field] !== undefined) {
        oldValues[field] = project[field];
        updates.push(`${field} = ?`);
        
        if (field === 'tags' || field === 'attachments' || field === 'team_members') {
          values.push(projectData[field] && projectData[field].length > 0 ? JSON.stringify(projectData[field]) : null);
        } else {
          values.push(projectData[field]);
        }
      }
    });

    if (updates.length === 0) {
      return project;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(projectId);

    const updateQuery = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
    this.db.prepare(updateQuery).run(...values);

    if (projectData.milestones) {
      this.db.prepare('DELETE FROM milestones WHERE project_id = ?').run(projectId);
      
      if (projectData.milestones.length > 0) {
        const insertMilestone = this.db.prepare(`
          INSERT INTO milestones (
            id, milestone_no, project_id, name, description, 
            due_date, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const datePrefix = dayjs().format('YYYYMM');
        const baseCount = this.db.prepare(`
          SELECT COUNT(*) as count FROM milestones 
          WHERE milestone_no LIKE ?
        `).get(`ML-${datePrefix}%`).count;

        projectData.milestones.forEach((milestone, index) => {
          const sequence = String(baseCount + index + 1).padStart(4, '0');
          const milestoneNo = `ML-${datePrefix}-${sequence}`;
          
          insertMilestone.run(
            uuidv4(),
            milestoneNo,
            projectId,
            milestone.name,
            milestone.description,
            milestone.due_date,
            index + 1
          );
        });
      }
    }

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, old_value, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(
      uuidv4(),
      userId,
      'update_project',
      'project',
      projectId,
      project.name,
      JSON.stringify(oldValues),
      JSON.stringify(projectData)
    );

    return this.getProjectById(projectId);
  }

  getProjectTimeline(projectId) {
    const timeline = [];

    const logs = this.db.prepare(`
      SELECT 
        ol.*,
        u.name as user_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ol.entity_type = 'project' AND ol.entity_id = ?
      ORDER BY ol.created_at DESC
    `).all(projectId);

    const comments = this.db.prepare(`
      SELECT 
        c.*,
        u.name as user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.entity_type = 'project' AND c.entity_id = ?
      ORDER BY c.created_at DESC
    `).all(projectId);

    logs.forEach(log => {
      timeline.push({
        id: log.id,
        type: 'log',
        action: log.action,
        user: log.user_name,
        userId: log.user_id,
        oldValue: log.old_value,
        newValue: log.new_value,
        createdAt: log.created_at
      });
    });

    comments.forEach(comment => {
      timeline.push({
        id: comment.id,
        type: 'comment',
        content: comment.content,
        user: comment.user_name,
        userId: comment.user_id,
        createdAt: comment.created_at
      });
    });

    timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return timeline;
  }

  getProjectStatistics(projectId) {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const tasks = this.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(estimated_hours) as total_estimated,
        SUM(actual_hours) as total_actual
      FROM tasks
      WHERE project_id = ?
      GROUP BY status
    `).all(projectId);

    const taskSummary = {
      total: 0,
      byStatus: {},
      estimatedHours: 0,
      actualHours: 0
    };

    tasks.forEach(t => {
      taskSummary.total += t.count;
      taskSummary.byStatus[t.status] = t.count;
      taskSummary.estimatedHours += t.total_estimated || 0;
      taskSummary.actualHours += t.total_actual || 0;
    });

    const milestones = this.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM milestones
      WHERE project_id = ?
      GROUP BY status
    `).all(projectId);

    const milestoneSummary = {
      total: 0,
      byStatus: {}
    };

    milestones.forEach(m => {
      milestoneSummary.total += m.count;
      milestoneSummary.byStatus[m.status] = m.count;
    });

    const documents = this.db.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE project_id = ?
    `).get(projectId);

    return {
      project,
      tasks: taskSummary,
      milestones: milestoneSummary,
      documents: documents.count,
      progress: taskSummary.total > 0 ? Math.round((taskSummary.byStatus.done || 0) / taskSummary.total * 100) : 0
    };
  }
}

module.exports = ProjectService;
