const { query } = require('../config/database');
const { queue } = require('../config/queue');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const getCheckInRecords = async (filters = {}) => {
  let queryText = `
    SELECT 
      ci.id, ci.check_in_date, ci.expected_check_out_date, 
      ci.actual_check_out_date, ci.status, ci.notes,
      s.id as student_id, s.student_id as student_no, s.name as student_name, 
      s.gender, s.major, s.class,
      b.id as bed_id, b.bed_code,
      r.id as room_id, r.room_number,
      d.id as dormitory_id, d.building_code, d.building_name
    FROM check_in_records ci
    LEFT JOIN students s ON ci.student_id = s.id
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    LEFT JOIN dormitories d ON ci.dormitory_id = d.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND ci.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.student_id) {
    queryText += ` AND ci.student_id = $${paramIndex++}`;
    params.push(filters.student_id);
  }

  if (filters.dormitory_id) {
    queryText += ` AND ci.dormitory_id = $${paramIndex++}`;
    params.push(filters.dormitory_id);
  }

  if (filters.room_id) {
    queryText += ` AND ci.room_id = $${paramIndex++}`;
    params.push(filters.room_id);
  }

  if (filters.keyword) {
    queryText += ` AND (s.name ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex} OR r.room_number ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  queryText += ` ORDER BY ci.created_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
};

const getCheckInRecordById = async (id) => {
  const result = await query(`
    SELECT 
      ci.id, ci.check_in_date, ci.expected_check_out_date, 
      ci.actual_check_out_date, ci.status, ci.notes,
      s.id as student_id, s.student_id as student_no, s.name as student_name, 
      s.gender, s.phone, s.major, s.class, s.grade,
      b.id as bed_id, b.bed_code, b.bed_number,
      r.id as room_id, r.room_number, r.floor,
      d.id as dormitory_id, d.building_code, d.building_name
    FROM check_in_records ci
    LEFT JOIN students s ON ci.student_id = s.id
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    LEFT JOIN dormitories d ON ci.dormitory_id = d.id
    WHERE ci.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('入住记录不存在');
  }

  return result.rows[0];
};

const createCheckIn = async (data) => {
  if (!data.student_id || !data.bed_id) {
    throw new ValidationError('学生和床位不能为空');
  }

  const studentResult = await query(`
    SELECT s.*, ci.id as active_check_in_id
    FROM students s
    LEFT JOIN check_in_records ci ON s.id = ci.student_id AND ci.status = 'active'
    WHERE s.id = $1
  `, [data.student_id]);

  if (studentResult.rows.length === 0) {
    throw new NotFoundError('学生不存在');
  }

  const student = studentResult.rows[0];
  
  if (student.active_check_in_id) {
    throw new ValidationError('该学生已入住，无法重复入住');
  }

  const bedResult = await query(`
    SELECT b.*, r.id as room_id, r.room_number, r.gender_type as room_gender,
           d.id as dormitory_id, d.building_code, d.gender_type as dormitory_gender
    FROM beds b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN dormitories d ON r.dormitory_id = d.id
    WHERE b.id = $1 AND b.status = 'available'
  `, [data.bed_id]);

  if (bedResult.rows.length === 0) {
    throw new ValidationError('床位不存在或已被占用');
  }

  const bed = bedResult.rows[0];

  const genderType = bed.room_gender || bed.dormitory_gender;
  if (genderType && genderType !== 'mixed' && genderType !== student.gender) {
    throw new ValidationError('该床位性别限制与学生性别不符');
  }

  const client = await (await require('../config/database').pool.connect());
  
  try {
    await client.query('BEGIN');

    const checkInResult = await client.query(`
      INSERT INTO check_in_records 
      (student_id, bed_id, room_id, dormitory_id, check_in_date, expected_check_out_date, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [
      data.student_id,
      data.bed_id,
      bed.room_id,
      bed.dormitory_id,
      data.check_in_date || new Date(),
      data.expected_check_out_date || null,
      data.notes || null
    ]);

    await client.query(`
      UPDATE beds SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [data.bed_id]);

    const checkRoomStatus = await client.query(`
      SELECT COUNT(*) as available_count FROM beds 
      WHERE room_id = $1 AND status = 'available'
    `, [bed.room_id]);

    if (checkRoomStatus.rows[0].available_count == 0) {
      await client.query(`
        UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [bed.room_id]);
    }

    await client.query('COMMIT');

    const checkInRecord = checkInResult.rows[0];
    
    await queue.add('checkIn', {
      type: 'checkIn',
      studentId: data.student_id,
      studentName: student.name,
      bedCode: bed.bed_code,
      roomNumber: bed.room_number,
      checkInDate: checkInRecord.check_in_date,
      timestamp: new Date().toISOString()
    });

    return checkInRecord;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const checkOut = async (checkInId, data = {}) => {
  const checkInResult = await query(`
    SELECT ci.*, b.id as bed_id, r.id as room_id, s.name as student_name
    FROM check_in_records ci
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    LEFT JOIN students s ON ci.student_id = s.id
    WHERE ci.id = $1 AND ci.status = 'active'
  `, [checkInId]);

  if (checkInResult.rows.length === 0) {
    throw new NotFoundError('入住记录不存在或已迁出');
  }

  const checkInRecord = checkInResult.rows[0];

  const client = await (await require('../config/database').pool.connect());
  
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE check_in_records 
      SET status = 'completed', actual_check_out_date = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      data.actual_check_out_date || new Date(),
      data.notes || checkInRecord.notes,
      checkInId
    ]);

    await client.query(`
      UPDATE beds SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [checkInRecord.bed_id]);

    await client.query(`
      UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [checkInRecord.room_id]);

    await client.query('COMMIT');

    await queue.add('checkOut', {
      type: 'checkOut',
      studentId: checkInRecord.student_id,
      studentName: checkInRecord.student_name,
      bedId: checkInRecord.bed_id,
      checkOutDate: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });

    return { success: true, message: '迁出成功' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getStudents = async (filters = {}) => {
  let queryText = `
    SELECT 
      s.id, s.student_id, s.name, s.gender, s.birthday,
      s.major, s.class, s.grade, s.phone, s.email, s.address, s.status,
      u.id as user_id, u.username,
      ci.id as check_in_id, ci.check_in_date,
      b.id as bed_id, b.bed_code,
      r.id as room_id, r.room_number,
      d.id as dormitory_id, d.building_code, d.building_name
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN check_in_records ci ON s.id = ci.student_id AND ci.status = 'active'
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    LEFT JOIN dormitories d ON ci.dormitory_id = d.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    queryText += ` AND s.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.major) {
    queryText += ` AND s.major = $${paramIndex++}`;
    params.push(filters.major);
  }

  if (filters.grade) {
    queryText += ` AND s.grade = $${paramIndex++}`;
    params.push(filters.grade);
  }

  if (filters.keyword) {
    queryText += ` AND (s.name ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex} OR s.class ILIKE $${paramIndex})`;
    params.push(`%${filters.keyword}%`);
  }

  if (filters.has_check_in !== undefined) {
    if (filters.has_check_in) {
      queryText += ` AND ci.id IS NOT NULL`;
    } else {
      queryText += ` AND ci.id IS NULL`;
    }
  }

  queryText += ` ORDER BY s.student_id`;

  const result = await query(queryText, params);
  return result.rows;
};

const getStudentById = async (id) => {
  const result = await query(`
    SELECT 
      s.id, s.student_id, s.name, s.gender, s.birthday,
      s.major, s.class, s.grade, s.phone, s.email, s.address, s.status,
      u.id as user_id, u.username,
      ci.id as check_in_id, ci.check_in_date, ci.expected_check_out_date, ci.notes as check_in_notes,
      b.id as bed_id, b.bed_code, b.bed_number,
      r.id as room_id, r.room_number, r.floor,
      d.id as dormitory_id, d.building_code, d.building_name
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN check_in_records ci ON s.id = ci.student_id AND ci.status = 'active'
    LEFT JOIN beds b ON ci.bed_id = b.id
    LEFT JOIN rooms r ON ci.room_id = r.id
    LEFT JOIN dormitories d ON ci.dormitory_id = d.id
    WHERE s.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('学生不存在');
  }

  return result.rows[0];
};

const createStudent = async (data) => {
  if (!data.student_id || !data.name) {
    throw new ValidationError('学号和姓名不能为空');
  }

  const existing = await query(
    'SELECT id FROM students WHERE student_id = $1',
    [data.student_id]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('学号已存在');
  }

  const result = await query(`
    INSERT INTO students (student_id, user_id, name, gender, birthday, major, class, grade, phone, email, address, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    data.student_id,
    data.user_id || null,
    data.name,
    data.gender || null,
    data.birthday || null,
    data.major || null,
    data.class || null,
    data.grade || null,
    data.phone || null,
    data.email || null,
    data.address || null,
    data.status || 'active'
  ]);

  return result.rows[0];
};

const updateStudent = async (id, data) => {
  const existing = await query('SELECT * FROM students WHERE id = $1', [id]);
  
  if (existing.rows.length === 0) {
    throw new NotFoundError('学生不存在');
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['student_id', 'user_id', 'name', 'gender', 'birthday', 'major', 'class', 'grade', 'phone', 'email', 'address', 'status'];
  
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
    UPDATE students SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} RETURNING *
  `, params);

  return result.rows[0];
};

module.exports = {
  getCheckInRecords,
  getCheckInRecordById,
  createCheckIn,
  checkOut,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
};