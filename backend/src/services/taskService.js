const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

class TaskService {
  constructor(db) {
    this.db = db;
  }

  generateTaskNo(projectId) {
    const project = this.db.prepare('SELECT project_no FROM projects WHERE id = ?').get(projectId);
    if (!project) throw new Error('项目不存在');

    const count = this.db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE project_id = ?
    `).get(projectId).count;

    return `TSK-${project.project_no.replace('PRJ-', '')}-${String(count + 1).padStart(3, '0')}`;
  }

  createTask(taskData, userId) {
    const { project_id, parent_id, name, description, priority, assignee_id, due_date, estimated_hours, tags, attachments, column_id } = taskData;

    if (!project_id || !name || !name.trim()) {
      throw new Error('项目ID和任务名称不能为空');
    }

    const taskId = uuidv4();
    const taskNo = this.generateTaskNo(project_id);

    let finalColumnId = column_id;
    let finalStatus = 'todo';

    if (!finalColumnId) {
      const firstColumn = this.db.prepare(`
        SELECT id, status FROM task_columns WHERE project_id = ? ORDER BY sort_order LIMIT 1
      `).get(project_id);
      
      if (firstColumn) {
        finalColumnId = firstColumn.id;
        finalStatus = firstColumn.status;
      }
    } else {
      const column = this.db.prepare('SELECT status FROM task_columns WHERE id = ?').get(finalColumnId);
      if (column) {
        finalStatus = column.status;
      }
    }

    const maxOrder = this.db.prepare(`
      SELECT MAX(sort_order) as max_order FROM tasks WHERE project_id = ? AND column_id = ?
    `).get(project_id, finalColumnId);
    const sortOrder = (maxOrder?.max_order || 0) + 1;

    const insertTask = this.db.prepare(`
      INSERT INTO tasks (
        id, task_no, project_id, parent_id, name, description, status, priority,
        assignee_id, reporter_id, due_date, estimated_hours, progress,
        sort_order, column_id, tags, attachments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertTask.run(
      taskId, taskNo, project_id, parent_id, name.trim(), description,
      finalStatus, priority || 'medium', assignee_id, userId, due_date,
      estimated_hours, 0, sortOrder, finalColumnId,
      tags ? JSON.stringify(tags) : null,
      attachments ? JSON.stringify(attachments) : null
    );

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(uuidv4(), userId, 'create_task', 'task', taskId, name);

    if (assignee_id) {
      this.createNotification(assignee_id, 'task_assigned', `新任务分配`, `您被分配了新任务：${name}`, 'task', taskId);
    }

    this.updateProjectProgress(project_id);

    return this.getTaskById(taskId);
  }

  getTaskById(taskId) {
    const task = this.db.prepare(`
      SELECT 
        t.*,
        p.name as project_name,
        p.project_no,
        assignee.name as assignee_name,
        reporter.name as reporter_name,
        parent.name as parent_task_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN tasks parent ON t.parent_id = parent.id
      WHERE t.id = ?
    `).get(taskId);

    if (!task) return null;

    if (task.tags) {
      try { task.tags = JSON.parse(task.tags); } catch { task.tags = []; }
    }
    if (task.attachments) {
      try { task.attachments = JSON.parse(task.attachments); } catch { task.attachments = []; }
    }

    return task;
  }

  getProjectTasks(projectId, filters = {}) {
    let baseQuery = `
      SELECT 
        t.*,
        assignee.name as assignee_name,
        reporter.name as reporter_name
      FROM tasks t
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      WHERE t.project_id = ?
    `;

    const conditions = [];
    const params = [projectId];

    if (filters.status) {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }
    if (filters.column_id) {
      conditions.push('t.column_id = ?');
      params.push(filters.column_id);
    }
    if (filters.assignee_id) {
      conditions.push('t.assignee_id = ?');
      params.push(filters.assignee_id);
    }
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        conditions.push('t.parent_id IS NULL');
      } else {
        conditions.push('t.parent_id = ?');
        params.push(filters.parent_id);
      }
    }

    if (conditions.length > 0) {
      baseQuery += ' AND ' + conditions.join(' AND ');
    }

    baseQuery += ' ORDER BY t.sort_order, t.created_at';

    const tasks = this.db.prepare(baseQuery).all(...params);

    tasks.forEach(t => {
      if (t.tags) {
        try { t.tags = JSON.parse(t.tags); } catch { t.tags = []; }
      }
    });

    return tasks;
  }

  updateTask(taskId, taskData, userId) {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const allowedFields = ['name', 'description', 'priority', 'assignee_id', 'due_date', 'start_date', 'end_date', 'estimated_hours', 'actual_hours', 'progress', 'tags', 'attachments', 'parent_id'];
    const updates = [];
    const values = [];
    const oldValues = {};

    let assigneeChanged = false;
    let oldAssigneeId = task.assignee_id;

    allowedFields.forEach(field => {
      if (taskData[field] !== undefined) {
        oldValues[field] = task[field];
        updates.push(`${field} = ?`);
        
        if (field === 'tags' || field === 'attachments') {
          values.push(taskData[field] ? JSON.stringify(taskData[field]) : null);
        } else {
          values.push(taskData[field]);
        }

        if (field === 'assignee_id' && taskData[field] !== oldAssigneeId) {
          assigneeChanged = true;
        }
      }
    });

    if (updates.length === 0) {
      return task;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(taskId);

    const updateQuery = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    this.db.prepare(updateQuery).run(...values);

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, old_value, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(
      uuidv4(),
      userId,
      'update_task',
      'task',
      taskId,
      task.name,
      JSON.stringify(oldValues),
      JSON.stringify(taskData)
    );

    if (assigneeChanged && taskData.assignee_id) {
      this.createNotification(taskData.assignee_id, 'task_assigned', `任务分配`, `您被分配了任务：${task.name}`, 'task', taskId);
    }

    this.updateProjectProgress(task.project_id);

    return this.getTaskById(taskId);
  }

  moveTask(taskId, newColumnId, newIndex, userId) {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const column = this.db.prepare('SELECT * FROM task_columns WHERE id = ?').get(newColumnId);
    if (!column) {
      throw new Error('列不存在');
    }

    const oldColumnId = task.column_id;
    const oldStatus = task.status;
    const newStatus = column.status;

    const tasksInNewColumn = this.db.prepare(`
      SELECT id, sort_order FROM tasks WHERE project_id = ? AND column_id = ? ORDER BY sort_order
    `).all(task.project_id, newColumnId);

    const insertIndex = Math.min(Math.max(0, newIndex), tasksInNewColumn.length);

    const updateTask = this.db.prepare(`
      UPDATE tasks 
      SET column_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    updateTask.run(newColumnId, newStatus, taskId);

    const recalculateOrder = this.db.prepare(`
      UPDATE tasks 
      SET sort_order = ? 
      WHERE id = ?
    `);

    let sortOrder = 1;
    for (let i = 0; i < tasksInNewColumn.length; i++) {
      if (i === insertIndex) {
        recalculateOrder.run(sortOrder++, taskId);
      }
      if (tasksInNewColumn[i].id !== taskId) {
        recalculateOrder.run(sortOrder++, tasksInNewColumn[i].id);
      }
    }
    if (insertIndex >= tasksInNewColumn.length) {
      recalculateOrder.run(sortOrder++, taskId);
    }

    const oldColumnTasks = this.db.prepare(`
      SELECT id FROM tasks WHERE project_id = ? AND column_id = ? ORDER BY sort_order
    `).all(task.project_id, oldColumnId);
    
    oldColumnTasks.forEach((t, index) => {
      recalculateOrder.run(index + 1, t.id);
    });

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, old_value, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(
      uuidv4(),
      userId,
      'move_task',
      'task',
      taskId,
      task.name,
      JSON.stringify({ column_id: oldColumnId, status: oldStatus }),
      JSON.stringify({ column_id: newColumnId, status: newStatus })
    );

    if (newStatus === 'done' && oldStatus !== 'done') {
      const completeTask = this.db.prepare(`
        UPDATE tasks SET progress = 100, end_date = DATE('now') WHERE id = ?
      `);
      completeTask.run(taskId);
    }

    this.updateProjectProgress(task.project_id);

    return this.getTaskById(taskId);
  }

  getKanbanBoard(projectId) {
    const columns = this.db.prepare(`
      SELECT * FROM task_columns WHERE project_id = ? ORDER BY sort_order
    `).all(projectId);

    const tasks = this.getProjectTasks(projectId);

    return columns.map(column => ({
      ...column,
      tasks: tasks.filter(t => t.column_id === column.id)
    }));
  }

  getGanttData(projectId) {
    const tasks = this.db.prepare(`
      SELECT 
        t.id, t.task_no, t.name, t.description, t.status, t.priority,
        t.start_date, t.end_date, t.due_date, t.progress,
        t.parent_id,
        assignee.name as assignee_name
      FROM tasks t
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      WHERE t.project_id = ?
      ORDER BY t.created_at
    `).all(projectId);

    const milestones = this.db.prepare(`
      SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order, due_date
    `).all(projectId);

    return {
      tasks,
      milestones
    };
  }

  updateProjectProgress(projectId) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE project_id = ?
    `).get(projectId);

    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    this.db.prepare(`
      UPDATE projects SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(progress, projectId);
  }

  createNotification(userId, type, title, content, entityType, entityId) {
    const insertNotif = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, entity_type, entity_id, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertNotif.run(
      uuidv4(),
      userId,
      type,
      title,
      content,
      entityType,
      entityId,
      `/${entityType}s/${entityId}`
    );
  }

  deleteTask(taskId, userId) {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const projectId = task.project_id;

    const logAction = this.db.prepare(`
      INSERT INTO operation_logs (id, user_id, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logAction.run(uuidv4(), userId, 'delete_task', 'task', taskId, task.name);

    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    this.updateProjectProgress(projectId);

    return { success: true, taskId };
  }
}

module.exports = TaskService;
