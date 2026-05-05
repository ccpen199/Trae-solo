const { query } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const getRooms = async (filters = {}) => {
  let queryText = `
    SELECT 
      r.id, r.room_number, r.dormitory_id, r.floor, 
      r.room_type, r.total_beds, r.gender_type, r.status,
      d.building_code, d.building_name,
      COUNT(DISTINCT b.id) as total_actual_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) as occupied_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds
    FROM rooms r
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    LEFT JOIN beds b ON r.id = b.room_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.dormitory_id) {
    queryText += ` AND r.dormitory_id = $${paramIndex++}`;
    params.push(filters.dormitory_id);
  }

  if (filters.status) {
    queryText += ` AND r.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.floor) {
    queryText += ` AND r.floor = $${paramIndex++}`;
    params.push(filters.floor);
  }

  if (filters.keyword) {
    queryText += ` AND r.room_number ILIKE $${paramIndex}`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` GROUP BY r.id, d.id ORDER BY r.room_number`;

  const result = await query(queryText, params);
  return result.rows;
};

const getRoomById = async (id) => {
  const result = await query(`
    SELECT 
      r.id, r.room_number, r.dormitory_id, r.floor, 
      r.room_type, r.total_beds, r.gender_type, r.status,
      d.building_code, d.building_name, d.gender_type as dormitory_gender,
      COUNT(DISTINCT b.id) as total_actual_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) as occupied_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds
    FROM rooms r
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    LEFT JOIN beds b ON r.id = b.room_id
    WHERE r.id = $1
    GROUP BY r.id, d.id
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('房间不存在');
  }

  return result.rows[0];
};

const getRoomBeds = async (roomId) => {
  const result = await query(`
    SELECT 
      b.id, b.bed_number, b.bed_code, b.status,
      s.id as student_id, s.name as student_name, s.student_id as student_no,
      ci.id as check_in_id, ci.check_in_date
    FROM beds b
    LEFT JOIN check_in_records ci ON b.id = ci.bed_id AND ci.status = 'active'
    LEFT JOIN students s ON ci.student_id = s.id
    WHERE b.room_id = $1
    ORDER BY b.bed_number
  `, [roomId]);

  return result.rows;
};

const getAvailableRooms = async (filters = {}) => {
  let queryText = `
    SELECT 
      r.id, r.room_number, r.dormitory_id, r.floor, 
      r.room_type, r.total_beds, r.gender_type,
      d.building_code, d.building_name,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds
    FROM rooms r
    JOIN dormitories d ON r.dormitory_id = d.id
    JOIN beds b ON r.id = b.room_id
    WHERE r.status = 'available' AND b.status = 'available'
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.gender_type) {
    queryText += ` AND (r.gender_type = $${paramIndex++} OR r.gender_type IS NULL)`;
    params.push(filters.gender_type);
  }

  if (filters.dormitory_id) {
    queryText += ` AND r.dormitory_id = $${paramIndex++}`;
    params.push(filters.dormitory_id);
  }

  queryText += ` GROUP BY r.id, d.id HAVING COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) > 0 ORDER BY r.room_number`;

  const result = await query(queryText, params);
  return result.rows;
};

const createRoom = async (data) => {
  if (!data.room_number || !data.dormitory_id) {
    throw new ValidationError('房间号和宿舍楼不能为空');
  }

  const existing = await query(
    'SELECT id FROM rooms WHERE room_number = $1',
    [data.room_number]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('房间号已存在');
  }

  const result = await query(`
    INSERT INTO rooms (room_number, dormitory_id, floor, room_type, total_beds, gender_type, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    data.room_number,
    data.dormitory_id,
    data.floor || 1,
    data.room_type || 'standard',
    data.total_beds || 4,
    data.gender_type || null,
    data.status || 'available'
  ]);

  return result.rows[0];
};

const updateRoom = async (id, data) => {
  const existing = await query('SELECT * FROM rooms WHERE id = $1', [id]);
  
  if (existing.rows.length === 0) {
    throw new NotFoundError('房间不存在');
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['room_number', 'dormitory_id', 'floor', 'room_type', 'total_beds', 'gender_type', 'status'];
  
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
    UPDATE rooms SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} RETURNING *
  `, params);

  return result.rows[0];
};

const deleteRoom = async (id) => {
  const checkBeds = await query(`
    SELECT id FROM beds b 
    WHERE b.room_id = $1 AND b.status = 'occupied'
    LIMIT 1
  `, [id]);
  
  if (checkBeds.rows.length > 0) {
    throw new ValidationError('该房间存在已入住床位，无法删除');
  }

  const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('房间不存在');
  }

  return result.rows[0];
};

const getBeds = async (filters = {}) => {
  let queryText = `
    SELECT 
      b.id, b.bed_number, b.bed_code, b.status, b.room_id,
      r.room_number, r.floor,
      d.id as dormitory_id, d.building_code, d.building_name,
      s.id as student_id, s.name as student_name, s.student_id as student_no,
      ci.id as check_in_id, ci.check_in_date
    FROM beds b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    LEFT JOIN check_in_records ci ON b.id = ci.bed_id AND ci.status = 'active'
    LEFT JOIN students s ON ci.student_id = s.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND b.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.room_id) {
    queryText += ` AND b.room_id = $${paramIndex++}`;
    params.push(filters.room_id);
  }

  if (filters.dormitory_id) {
    queryText += ` AND d.id = $${paramIndex++}`;
    params.push(filters.dormitory_id);
  }

  if (filters.keyword) {
    queryText += ` AND (b.bed_code ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` ORDER BY b.bed_code`;

  const result = await query(queryText, params);
  return result.rows;
};

const getBedById = async (id) => {
  const result = await query(`
    SELECT 
      b.id, b.bed_number, b.bed_code, b.status, b.room_id,
      r.room_number, r.floor,
      d.id as dormitory_id, d.building_code, d.building_name,
      s.id as student_id, s.name as student_name, s.student_id as student_no,
      ci.id as check_in_id, ci.check_in_date
    FROM beds b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    LEFT JOIN check_in_records ci ON b.id = ci.bed_id AND ci.status = 'active'
    LEFT JOIN students s ON ci.student_id = s.id
    WHERE b.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('床位不存在');
  }

  return result.rows[0];
};

module.exports = {
  getRooms,
  getRoomById,
  getRoomBeds,
  getAvailableRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBeds,
  getBedById,
};