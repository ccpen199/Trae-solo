const { query } = require('../config/database');
const { queue } = require('../config/queue');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const generateTicketNumber = async () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  
  const result = await query(`
    SELECT COUNT(*) as count FROM maintenance_tickets 
    WHERE ticket_number LIKE $1
  `, [`WT${dateStr}%`]);
  
  const count = result.rows[0].count + 1;
  return `WT${dateStr}${String(count).padStart(4, '0')}`;
};

const getMaintenanceTickets = async (filters = {}) => {
  let queryText = `
    SELECT 
      mt.id, mt.ticket_number, mt.category, mt.title, mt.description,
      mt.priority, mt.status, mt.created_at, mt.updated_at,
      mt.processed_at, mt.completed_at, mt.solution,
      s.id as student_id, s.student_id as student_no, s.name as student_name, s.phone as student_phone,
      r.id as room_id, r.room_number,
      d.id as dormitory_id, d.building_code, d.building_name,
      au.id as assigned_to_id, au.name as assigned_to_name
    FROM maintenance_tickets mt
    LEFT JOIN students s ON mt.student_id = s.id
    LEFT JOIN rooms r ON mt.room_id = r.id
    LEFT JOIN dormitories d ON mt.dormitory_id = d.id
    LEFT JOIN users au ON mt.assigned_to = au.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND mt.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.priority) {
    queryText += ` AND mt.priority = $${paramIndex++}`;
    params.push(filters.priority);
  }

  if (filters.category) {
    queryText += ` AND mt.category = $${paramIndex++}`;
    params.push(filters.category);
  }

  if (filters.student_id) {
    queryText += ` AND mt.student_id = $${paramIndex++}`;
    params.push(filters.student_id);
  }

  if (filters.dormitory_id) {
    queryText += ` AND mt.dormitory_id = $${paramIndex++}`;
    params.push(filters.dormitory_id);
  }

  if (filters.keyword) {
    queryText += ` AND (mt.title ILIKE $${paramIndex} OR mt.description ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex} OR r.room_number ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` ORDER BY 
    CASE mt.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'normal' THEN 3 
      WHEN 'low' THEN 4 
    END,
    mt.created_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
};

const getMaintenanceTicketById = async (id) => {
  const result = await query(`
    SELECT 
      mt.id, mt.ticket_number, mt.category, mt.title, mt.description,
      mt.priority, mt.status, mt.created_at, mt.updated_at,
      mt.processed_at, mt.completed_at, mt.solution,
      s.id as student_id, s.student_id as student_no, s.name as student_name, 
      s.phone as student_phone, s.gender, s.major, s.class,
      r.id as room_id, r.room_number, r.floor,
      d.id as dormitory_id, d.building_code, d.building_name,
      au.id as assigned_to_id, au.name as assigned_to_name, au.phone as assigned_to_phone
    FROM maintenance_tickets mt
    LEFT JOIN students s ON mt.student_id = s.id
    LEFT JOIN rooms r ON mt.room_id = r.id
    LEFT JOIN dormitories d ON mt.dormitory_id = d.id
    LEFT JOIN users au ON mt.assigned_to = au.id
    WHERE mt.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('维修单不存在');
  }

  return result.rows[0];
};

const createMaintenanceTicket = async (data) => {
  if (!data.student_id || !data.category || !data.title) {
    throw new ValidationError('学生、维修类别和标题不能为空');
  }

  const studentResult = await query(`
    SELECT s.*, ci.room_id, ci.dormitory_id, r.room_number
    FROM students s
    LEFT JOIN check_in_records ci ON s.id = ci.student_id AND ci.status = 'active'
    LEFT JOIN rooms r ON ci.room_id = r.id
    WHERE s.id = $1
  `, [data.student_id]);

  if (studentResult.rows.length === 0) {
    throw new NotFoundError('学生不存在');
  }

  const student = studentResult.rows[0];

  const ticketNumber = await generateTicketNumber();

  const result = await query(`
    INSERT INTO maintenance_tickets 
    (ticket_number, student_id, room_id, dormitory_id, category, title, description, priority, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING *
  `, [
    ticketNumber,
    data.student_id,
    data.room_id || student.room_id,
    data.dormitory_id || student.dormitory_id,
    data.category,
    data.title,
    data.description || null,
    data.priority || 'normal'
  ]);

  const ticket = result.rows[0];

  await queue.add('maintenance', {
    type: 'maintenance',
    action: 'created',
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    studentId: data.student_id,
    studentName: student.name,
    title: data.title,
    category: data.category,
    priority: data.priority || 'normal',
    roomNumber: student.room_number,
    timestamp: new Date().toISOString()
  });

  return ticket;
};

const updateMaintenanceTicket = async (id, data) => {
  const existing = await query('SELECT * FROM maintenance_tickets WHERE id = $1', [id]);
  
  if (existing.rows.length === 0) {
    throw new NotFoundError('维修单不存在');
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['category', 'title', 'description', 'priority'];
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      params.push(data[field]);
    }
  }

  if (updates.length === 0) {
    return existing.rows[0];
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const result = await query(`
    UPDATE maintenance_tickets SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} RETURNING *
  `, params);

  return result.rows[0];
};

const processTicket = async (id, assignedTo) => {
  const existing = await query(`
    SELECT mt.*, s.name as student_name, s.phone as student_phone, r.room_number
    FROM maintenance_tickets mt
    LEFT JOIN students s ON mt.student_id = s.id
    LEFT JOIN rooms r ON mt.room_id = r.id
    WHERE mt.id = $1 AND mt.status = 'pending'
  `, [id]);

  if (existing.rows.length === 0) {
    throw new NotFoundError('维修单不存在或已处理');
  }

  const ticket = existing.rows[0];

  const result = await query(`
    UPDATE maintenance_tickets 
    SET status = 'processing', assigned_to = $1, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `, [assignedTo, id]);

  await queue.add('maintenance', {
    type: 'maintenance',
    action: 'processed',
    ticketId: id,
    ticketNumber: ticket.ticket_number,
    studentName: ticket.student_name,
    studentPhone: ticket.student_phone,
    roomNumber: ticket.room_number,
    assignedTo: assignedTo,
    timestamp: new Date().toISOString()
  });

  return result.rows[0];
};

const completeTicket = async (id, solution) => {
  const existing = await query(`
    SELECT mt.*, s.name as student_name, s.phone as student_phone
    FROM maintenance_tickets mt
    LEFT JOIN students s ON mt.student_id = s.id
    WHERE mt.id = $1 AND mt.status = 'processing'
  `, [id]);

  if (existing.rows.length === 0) {
    throw new NotFoundError('维修单不存在或未处于处理中状态');
  }

  const ticket = existing.rows[0];

  const result = await query(`
    UPDATE maintenance_tickets 
    SET status = 'completed', solution = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `, [solution || null, id]);

  await queue.add('maintenance', {
    type: 'maintenance',
    action: 'completed',
    ticketId: id,
    ticketNumber: ticket.ticket_number,
    studentName: ticket.student_name,
    studentPhone: ticket.student_phone,
    solution: solution,
    timestamp: new Date().toISOString()
  });

  return result.rows[0];
};

const getStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_tickets,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_tickets
    FROM maintenance_tickets
  `);

  return result.rows[0];
};

module.exports = {
  getMaintenanceTickets,
  getMaintenanceTicketById,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  processTicket,
  completeTicket,
  getStats,
};