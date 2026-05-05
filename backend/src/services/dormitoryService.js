const { query } = require('../config/database');
const cache = require('../config/redis');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const getDormitories = async (filters = {}) => {
  let queryText = `
    SELECT 
      d.id, d.building_code, d.building_name, d.description, 
      d.gender_type, d.total_rooms, d.total_beds, d.status,
      COUNT(DISTINCT r.id) as actual_rooms,
      COUNT(DISTINCT b.id) as actual_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) as occupied_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds
    FROM dormitories d
    LEFT JOIN rooms r ON d.id = r.dormitory_id
    LEFT JOIN beds b ON r.id = b.room_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND d.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.gender_type) {
    queryText += ` AND d.gender_type = $${paramIndex++}`;
    params.push(filters.gender_type);
  }

  if (filters.keyword) {
    queryText += ` AND (d.building_code ILIKE $${paramIndex} OR d.building_name ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` GROUP BY d.id ORDER BY d.building_code`;

  const result = await query(queryText, params);
  return result.rows;
};

const getDormitoryById = async (id) => {
  const result = await query(`
    SELECT 
      d.id, d.building_code, d.building_name, d.description, 
      d.gender_type, d.total_rooms, d.total_beds, d.status,
      COUNT(DISTINCT r.id) as actual_rooms,
      COUNT(DISTINCT b.id) as actual_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) as occupied_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds
    FROM dormitories d
    LEFT JOIN rooms r ON d.id = r.dormitory_id
    LEFT JOIN beds b ON r.id = b.room_id
    WHERE d.id = $1
    GROUP BY d.id
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('宿舍楼不存在');
  }

  return result.rows[0];
};

const createDormitory = async (data) => {
  if (!data.building_code || !data.building_name) {
    throw new ValidationError('楼栋编号和名称不能为空');
  }

  const existing = await query(
    'SELECT id FROM dormitories WHERE building_code = $1',
    [data.building_code]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('楼栋编号已存在');
  }

  const result = await query(`
    INSERT INTO dormitories (building_code, building_name, description, gender_type, total_rooms, total_beds, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    data.building_code,
    data.building_name,
    data.description || '',
    data.gender_type || 'mixed',
    data.total_rooms || 0,
    data.total_beds || 0,
    data.status || 'active'
  ]);

  await cache.del('dormitories:all');
  return result.rows[0];
};

const updateDormitory = async (id, data) => {
  const existing = await query('SELECT * FROM dormitories WHERE id = $1', [id]);
  
  if (existing.rows.length === 0) {
    throw new NotFoundError('宿舍楼不存在');
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['building_name', 'description', 'gender_type', 'total_rooms', 'total_beds', 'status'];
  
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
    UPDATE dormitories SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} RETURNING *
  `, params);

  await cache.del('dormitories:all');
  return result.rows[0];
};

const deleteDormitory = async (id) => {
  const checkRooms = await query('SELECT id FROM rooms WHERE dormitory_id = $1 LIMIT 1', [id]);
  
  if (checkRooms.rows.length > 0) {
    throw new ValidationError('该宿舍楼存在房间，无法删除');
  }

  const result = await query('DELETE FROM dormitories WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('宿舍楼不存在');
  }

  await cache.del('dormitories:all');
  return result.rows[0];
};

const getRoomStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_rooms,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
      COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
      COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms
    FROM rooms
  `);

  return result.rows[0];
};

const getBedStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_beds,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_beds,
      COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
      COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_beds
    FROM beds
  `);

  return result.rows[0];
};

module.exports = {
  getDormitories,
  getDormitoryById,
  createDormitory,
  updateDormitory,
  deleteDormitory,
  getRoomStats,
  getBedStats,
};