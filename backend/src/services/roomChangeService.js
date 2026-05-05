const { query } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const getRoomChangeRecords = async (filters = {}) => {
  let queryText = `
    SELECT 
      rc.id, rc.change_date, rc.reason, rc.status, rc.approved_at,
      s.id as student_id, s.student_id as student_no, s.name as student_name, s.gender,
      old_b.bed_code as old_bed_code, old_r.room_number as old_room_number, old_d.building_code as old_building_code,
      new_b.bed_code as new_bed_code, new_r.room_number as new_room_number, new_d.building_code as new_building_code,
      au.name as approved_by_name
    FROM room_change_records rc
    LEFT JOIN students s ON rc.student_id = s.id
    LEFT JOIN beds old_b ON rc.old_bed_id = old_b.id
    LEFT JOIN rooms old_r ON rc.old_room_id = old_r.id
    LEFT JOIN dormitories old_d ON rc.old_dormitory_id = old_d.id
    LEFT JOIN beds new_b ON rc.new_bed_id = new_b.id
    LEFT JOIN rooms new_r ON rc.new_room_id = new_r.id
    LEFT JOIN dormitories new_d ON rc.new_dormitory_id = new_d.id
    LEFT JOIN users au ON rc.approved_by = au.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND rc.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.student_id) {
    queryText += ` AND rc.student_id = $${paramIndex++}`;
    params.push(filters.student_id);
  }

  if (filters.keyword) {
    queryText += ` AND (s.name ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` ORDER BY rc.created_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
};

const getRoomChangeRecordById = async (id) => {
  const result = await query(`
    SELECT 
      rc.id, rc.change_date, rc.reason, rc.status, rc.approved_at, rc.created_at,
      s.id as student_id, s.student_id as student_no, s.name as student_name, s.gender, s.phone, s.major,
      old_b.id as old_bed_id, old_b.bed_code as old_bed_code, old_b.bed_number as old_bed_number,
      old_r.id as old_room_id, old_r.room_number as old_room_number, old_r.floor as old_floor,
      old_d.id as old_dormitory_id, old_d.building_code as old_building_code, old_d.building_name as old_building_name,
      new_b.id as new_bed_id, new_b.bed_code as new_bed_code, new_b.bed_number as new_bed_number,
      new_r.id as new_room_id, new_r.room_number as new_room_number, new_r.floor as new_floor,
      new_d.id as new_dormitory_id, new_d.building_code as new_building_code, new_d.building_name as new_building_name,
      au.name as approved_by_name
    FROM room_change_records rc
    LEFT JOIN students s ON rc.student_id = s.id
    LEFT JOIN beds old_b ON rc.old_bed_id = old_b.id
    LEFT JOIN rooms old_r ON rc.old_room_id = old_r.id
    LEFT JOIN dormitories old_d ON rc.old_dormitory_id = old_d.id
    LEFT JOIN beds new_b ON rc.new_bed_id = new_b.id
    LEFT JOIN rooms new_r ON rc.new_room_id = new_r.id
    LEFT JOIN dormitories new_d ON rc.new_dormitory_id = new_d.id
    LEFT JOIN users au ON rc.approved_by = au.id
    WHERE rc.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('调房记录不存在');
  }

  return result.rows[0];
};

const createRoomChangeRequest = async (data) => {
  if (!data.student_id || !data.new_bed_id) {
    throw new ValidationError('学生和目标床位不能为空');
  }

  const studentResult = await query(`
    SELECT s.*, ci.id as check_in_id, ci.bed_id, ci.room_id, ci.dormitory_id,
           b.bed_code as current_bed_code, r.room_number as current_room_number
    FROM students s
    JOIN check_in_records ci ON s.id = ci.student_id AND ci.status = 'active'
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    WHERE s.id = $1
  `, [data.student_id]);

  if (studentResult.rows.length === 0) {
    throw new ValidationError('学生不存在或未入住');
  }

  const student = studentResult.rows[0];

  if (student.bed_id == data.new_bed_id) {
    throw new ValidationError('目标床位与当前床位相同');
  }

  const newBedResult = await query(`
    SELECT b.*, r.id as room_id, r.room_number, r.gender_type as room_gender,
           d.id as dormitory_id, d.building_code, d.gender_type as dormitory_gender
    FROM beds b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    WHERE b.id = $1
  `, [data.new_bed_id]);

  if (newBedResult.rows.length === 0) {
    throw new NotFoundError('目标床位不存在');
  }

  const newBed = newBedResult.rows[0];

  if (newBed.status !== 'available') {
    throw new ValidationError('目标床位已被占用');
  }

  const genderType = newBed.room_gender || newBed.dormitory_gender;
  if (genderType && genderType !== 'mixed' && genderType !== student.gender) {
    throw new ValidationError('目标床位性别限制与学生性别不符');
  }

  const result = await query(`
    INSERT INTO room_change_records 
    (student_id, old_bed_id, new_bed_id, old_room_id, new_room_id, 
     old_dormitory_id, new_dormitory_id, change_date, reason, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *
  `, [
    data.student_id,
    student.bed_id,
    data.new_bed_id,
    student.room_id,
    newBed.room_id,
    student.dormitory_id,
    newBed.dormitory_id,
    data.change_date || new Date(),
    data.reason || null
  ]);

  return result.rows[0];
};

const approveRoomChange = async (id, approvedBy, approved = true) => {
  const roomChangeResult = await query(`
    SELECT rc.*, s.name as student_name
    FROM room_change_records rc
    JOIN students s ON rc.student_id = s.id
    WHERE rc.id = $1 AND rc.status = 'pending'
  `, [id]);

  if (roomChangeResult.rows.length === 0) {
    throw new NotFoundError('调房申请不存在或已处理');
  }

  const roomChange = roomChangeResult.rows[0];

  if (!approved) {
    const result = await query(`
      UPDATE room_change_records 
      SET status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [approvedBy, id]);

    return result.rows[0];
  }

  const newBedCheck = await query(`
    SELECT id FROM beds WHERE id = $1 AND status = 'available'
  `, [roomChange.new_bed_id]);

  if (newBedCheck.rows.length === 0) {
    throw new ValidationError('目标床位已被占用，无法调房');
  }

  const client = await (await require('../config/database').pool.connect());
  
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE check_in_records 
      SET bed_id = $1, room_id = $2, dormitory_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE student_id = $4 AND status = 'active'
    `, [
      roomChange.new_bed_id,
      roomChange.new_room_id,
      roomChange.new_dormitory_id,
      roomChange.student_id
    ]);

    await client.query(`
      UPDATE beds SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [roomChange.old_bed_id]);

    await client.query(`
      UPDATE beds SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [roomChange.new_bed_id]);

    await client.query(`
      UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [roomChange.old_room_id]);

    const newRoomAvailableCheck = await client.query(`
      SELECT COUNT(*) as available_count FROM beds WHERE room_id = $1 AND status = 'available'
    `, [roomChange.new_room_id]);

    if (newRoomAvailableCheck.rows[0].available_count == 0) {
      await client.query(`
        UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [roomChange.new_room_id]);
    }

    const updateResult = await client.query(`
      UPDATE room_change_records 
      SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [approvedBy, id]);

    await client.query('COMMIT');

    return updateResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getRoomChangeRecords,
  getRoomChangeRecordById,
  createRoomChangeRequest,
  approveRoomChange,
};