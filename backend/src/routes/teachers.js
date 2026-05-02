const express = require('express');
const bcrypt = require('bcryptjs');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(['teacher:read']), async (req, res) => {
  try {
    const { department, status, keyword, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT u.*, tp.teacher_number, tp.department, tp.position, tp.teach_subjects,
             tp.entry_date, tp.teacher_qualification
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role IN ('teacher', 'homeroom_teacher')
    `;
    const params = [];
    
    if (department) {
      sql += ' AND tp.department = ?';
      params.push(department);
    }
    
    if (status) {
      sql += ' AND u.status = ?';
      params.push(status);
    }
    
    if (keyword) {
      sql += ' AND (u.name LIKE ? OR tp.teacher_number LIKE ? OR tp.department LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY tp.teacher_number LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const teachers = await allQuery(sql, params);
    
    res.json({
      teachers,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取教师列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['teacher:read']), async (req, res) => {
  try {
    const teacher = await getQuery(
      `SELECT u.*, tp.teacher_number, tp.department, tp.position, tp.teach_subjects,
              tp.entry_date, tp.teacher_qualification
       FROM users u
       JOIN teacher_profiles tp ON u.id = tp.user_id
       WHERE u.id = ? AND u.role IN ('teacher', 'homeroom_teacher')`,
      [req.params.id]
    );
    
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }
    
    const courses = await allQuery(
      `SELECT c.* FROM courses c 
       WHERE c.teacher_id = ? AND c.status = 'published'
       ORDER BY c.academic_year DESC, c.term DESC`,
      [req.params.id]
    );
    
    const homeroomClass = await getQuery(
      `SELECT c.* FROM classes c WHERE c.homeroom_teacher_id = ? AND c.status = 'active'`,
      [req.params.id]
    );
    
    res.json({ 
      teacher,
      courses,
      homeroomClass
    });
    
  } catch (error) {
    console.error('获取教师详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['teacher:create']), async (req, res) => {
  try {
    const {
      username, password, name, gender, birth_date, phone, email, address,
      teacher_number, department, position, teach_subjects, entry_date,
      teacher_qualification, role = 'teacher'
    } = req.body;
    
    if (!username || !password || !name || !teacher_number) {
      return res.status(400).json({ error: '用户名、密码、姓名、工号为必填项' });
    }
    
    if (role !== 'teacher' && role !== 'homeroom_teacher') {
      return res.status(400).json({ error: '无效的角色类型' });
    }
    
    const existingUsername = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const existingTeacherNumber = await getQuery(
      'SELECT * FROM teacher_profiles WHERE teacher_number = ?',
      [teacher_number]
    );
    if (existingTeacherNumber) {
      return res.status(400).json({ error: '工号已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await runQuery(
      `INSERT INTO users (username, password, role, name, gender, birth_date, phone, email, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [username, hashedPassword, role, name, gender, birth_date, phone, email, address]
    );
    
    const userId = userResult.lastID;
    
    await runQuery(
      `INSERT INTO teacher_profiles 
       (user_id, teacher_number, department, position, teach_subjects, entry_date, teacher_qualification)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, teacher_number, department || null, position || null, teach_subjects || null, 
       entry_date || null, teacher_qualification || null]
    );
    
    res.json({
      success: true,
      userId,
      message: '教师创建成功'
    });
    
  } catch (error) {
    console.error('创建教师错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['teacher:update']), async (req, res) => {
  try {
    const {
      name, gender, birth_date, phone, email, address, status,
      department, position, teach_subjects, entry_date, teacher_qualification
    } = req.body;
    
    const existingTeacher = await getQuery(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)',
      [req.params.id, 'teacher', 'homeroom_teacher']
    );
    
    if (!existingTeacher) {
      return res.status(404).json({ error: '教师不存在' });
    }
    
    let updateUserFields = [];
    let updateUserParams = [];
    
    if (name !== undefined) {
      updateUserFields.push('name = ?');
      updateUserParams.push(name);
    }
    if (gender !== undefined) {
      updateUserFields.push('gender = ?');
      updateUserParams.push(gender);
    }
    if (birth_date !== undefined) {
      updateUserFields.push('birth_date = ?');
      updateUserParams.push(birth_date);
    }
    if (phone !== undefined) {
      updateUserFields.push('phone = ?');
      updateUserParams.push(phone);
    }
    if (email !== undefined) {
      updateUserFields.push('email = ?');
      updateUserParams.push(email);
    }
    if (address !== undefined) {
      updateUserFields.push('address = ?');
      updateUserParams.push(address);
    }
    if (status !== undefined) {
      updateUserFields.push('status = ?');
      updateUserParams.push(status);
    }
    
    if (updateUserFields.length > 0) {
      updateUserFields.push('updated_at = CURRENT_TIMESTAMP');
      updateUserParams.push(req.params.id);
      await runQuery(
        `UPDATE users SET ${updateUserFields.join(', ')} WHERE id = ?`,
        updateUserParams
      );
    }
    
    let updateProfileFields = [];
    let updateProfileParams = [];
    
    if (department !== undefined) {
      updateProfileFields.push('department = ?');
      updateProfileParams.push(department);
    }
    if (position !== undefined) {
      updateProfileFields.push('position = ?');
      updateProfileParams.push(position);
    }
    if (teach_subjects !== undefined) {
      updateProfileFields.push('teach_subjects = ?');
      updateProfileParams.push(teach_subjects);
    }
    if (entry_date !== undefined) {
      updateProfileFields.push('entry_date = ?');
      updateProfileParams.push(entry_date);
    }
    if (teacher_qualification !== undefined) {
      updateProfileFields.push('teacher_qualification = ?');
      updateProfileParams.push(teacher_qualification);
    }
    
    if (updateProfileFields.length > 0) {
      updateProfileFields.push('updated_at = CURRENT_TIMESTAMP');
      updateProfileParams.push(req.params.id);
      await runQuery(
        `UPDATE teacher_profiles SET ${updateProfileFields.join(', ')} WHERE user_id = ?`,
        updateProfileParams
      );
    }
    
    res.json({
      success: true,
      message: '教师信息更新成功'
    });
    
  } catch (error) {
    console.error('更新教师信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['teacher:delete']), async (req, res) => {
  try {
    const teacher = await getQuery(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)',
      [req.params.id, 'teacher', 'homeroom_teacher']
    );
    
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }
    
    const courseCount = await getQuery(
      'SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?',
      [req.params.id]
    );
    
    if (courseCount.count > 0) {
      return res.status(400).json({ error: '该教师还有课程安排，无法删除' });
    }
    
    const scheduleCount = await getQuery(
      'SELECT COUNT(*) as count FROM schedules WHERE teacher_id = ?',
      [req.params.id]
    );
    
    if (scheduleCount.count > 0) {
      return res.status(400).json({ error: '该教师还有排课记录，无法删除' });
    }
    
    const homeroomClassCount = await getQuery(
      'SELECT COUNT(*) as count FROM classes WHERE homeroom_teacher_id = ?',
      [req.params.id]
    );
    
    if (homeroomClassCount.count > 0) {
      return res.status(400).json({ error: '该教师还有担任班主任的班级，无法删除' });
    }
    
    await runQuery('DELETE FROM teacher_profiles WHERE user_id = ?', [req.params.id]);
    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '教师删除成功'
    });
    
  } catch (error) {
    console.error('删除教师错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/departments/list', authMiddleware(['teacher:read']), async (req, res) => {
  try {
    const departments = await allQuery(
      'SELECT DISTINCT department FROM teacher_profiles WHERE department IS NOT NULL ORDER BY department'
    );
    
    res.json({
      departments: departments.map(d => d.department)
    });
    
  } catch (error) {
    console.error('获取院系列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my/courses', authMiddleware(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'homeroom_teacher') {
      return res.status(403).json({ error: '只有教师可以查看自己的课程' });
    }
    
    const { term, academic_year, status } = req.query;
    
    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') as enrolled_count
      FROM courses c
      WHERE c.teacher_id = ?
    `;
    const params = [req.user.id];
    
    if (term) {
      sql += ' AND c.term = ?';
      params.push(term);
    }
    if (academic_year) {
      sql += ' AND c.academic_year = ?';
      params.push(academic_year);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY c.academic_year DESC, c.term DESC, c.course_code';
    
    const courses = await allQuery(sql, params);
    
    res.json({ courses });
    
  } catch (error) {
    console.error('获取我的课程错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my/schedule', authMiddleware(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'homeroom_teacher') {
      return res.status(403).json({ error: '只有教师可以查看自己的课表' });
    }
    
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const schedules = await allQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              cr.room_name, cr.building, cl.class_name
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE s.teacher_id = ? 
         AND s.term = ? 
         AND s.academic_year = ?
         AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.user.id, term, academic_year]
    );
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly,
      totalHours: schedules.length * 2
    });
    
  } catch (error) {
    console.error('获取我的课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
