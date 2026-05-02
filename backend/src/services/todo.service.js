const { getDb } = require('../database/init');
const { generateId, stringifyJSON } = require('../utils/common');

const db = getDb();

const createTodo = (options) => {
  const {
    ownerId,
    ownerType = 'employee',
    mainOrderId,
    detailId,
    step,
    title,
    description,
    priority = 'normal',
    dueTime,
  } = options;

  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO todo_items (
      id, owner_id, owner_type, main_order_id, detail_id,
      step, title, description, priority, status, due_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);

  stmt.run(
    id, ownerId, ownerType, mainOrderId, detailId,
    step, title, description, priority, dueTime, createdAt
  );

  return { id, ...options, status: 'pending', createdAt };
};

const getTodos = (userId, options = {}) => {
  const { status, step, limit = 100, offset = 0 } = options;
  let sql = `
    SELECT t.*, 
           mo.order_no, mo.type as order_type, mo.status as order_status,
           m.name as owner_name, m.avatar as owner_avatar
    FROM todo_items t
    LEFT JOIN main_orders mo ON t.main_order_id = mo.id
    LEFT JOIN employees m ON t.owner_id = m.id
    WHERE t.owner_id = ? AND t.status != 'deleted'
  `;
  const params = [userId];

  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  if (step) {
    sql += ' AND t.step = ?';
    params.push(step);
  }

  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
};

const getTodoCount = (userId, options = {}) => {
  const { status } = options;
  let sql = "SELECT COUNT(*) as count FROM todo_items WHERE owner_id = ? AND status != 'deleted'";
  const params = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const row = db.prepare(sql).get(...params);
  return row ? row.count : 0;
};

const updateTodoStatus = (todoId, userId, status, completedAt = null) => {
  const stmt = db.prepare(`
    UPDATE todo_items 
    SET status = ?, completed_at = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?
  `);

  const now = new Date().toISOString();
  stmt.run(status, completedAt || now, now, todoId, userId);
  return { success: true };
};

const completeTodo = (todoId, userId) => {
  return updateTodoStatus(todoId, userId, 'completed', new Date().toISOString());
};

const deleteTodosByOrder = (mainOrderId, options = {}) => {
  const { step } = options;
  let sql = "UPDATE todo_items SET status = 'deleted' WHERE main_order_id = ?";
  const params = [mainOrderId];

  if (step) {
    sql += ' AND step = ?';
    params.push(step);
  }

  const stmt = db.prepare(sql);
  stmt.run(...params);
  return { success: true };
};

module.exports = {
  createTodo,
  getTodos,
  getTodoCount,
  updateTodoStatus,
  completeTodo,
  deleteTodosByOrder,
};
