const express = require('express');
const bcrypt = require('bcryptjs');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(['student:read']), async (req, res) => {
  try {
    const { class_id, status, keyword, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT u.*, sp.student_number, sp.class_id, sp.enrollment_date, 
             sp.enrollment_status, sp.major, sp.admission_score,
             c.class_name, c.class_code, c.grade
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
      WHERE u.role = 'student'
    `;
    const params = [];
    
    if (class_id) {
      sql += ' AND sp.class_id = ?';
      params.push(class_id);
    }
    
    if (status) {
      sql += ' AND sp.enrollment_status = ?';
      params.push(status);
    }
    
    if (keyword) {
      sql += ' AND (u.name LIKE ? OR sp.student_number LIKE ? OR u.username LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sp.student_number DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const students = await allQuery(sql, params);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['student:read']), async (req, res) => {
  try {
    const student = await getQuery(
      `SELECT u.*, sp.*, c.class_name, c.class_code, c.grade
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN classes c ON sp.class_id = c.id
       WHERE u.id = ? AND u.role = 'student'`,
      [req.params.id]
    );
    
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }
    
    res.json({ student });
    
  } catch (error) {
    console.error('获取学生详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['student:create']), async (req, res) => {
  try {
    const {
      username, password, name, gender, birth_date, phone, email, address,
      student_number, class_id, enrollment_date, enrollment_status = 'studying',
      major, admission_score, id_card_number, emergency_contact, emergency_phone
    } = req.body;
    
    if (!username || !password || !name || !student_number) {
      return res.status(400).json({ error: '用户名、密码、姓名、学号为必填项' });
    }
    
    const existingUsername = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const existingStudentNumber = await getQuery(
      'SELECT * FROM student_profiles WHERE student_number = ?',
      [student_number]
    );
    if (existingStudentNumber) {
      return res.status(400).json({ error: '学号已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await runQuery(
      `INSERT INTO users (username, password, role, name, gender, birth_date, phone, email, address, status)
       VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, 'active')`,
      [username, hashedPassword, name, gender, birth_date, phone, email, address]
    );
    
    const userId = userResult.lastID;
    
    await runQuery(
      `INSERT INTO student_profiles 
       (user_id, student_number, class_id, enrollment_date, enrollment_status, 
        major, admission_score, id_card_number, emergency_contact, emergency_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, student_number, class_id, enrollment_date, enrollment_status,
       major, admission_score, id_card_number, emergency_contact, emergency_phone]
    );
    
    if (class_id) {
      await runQuery(
        'UPDATE classes SET student_count = student_count + 1 WHERE id = ?',
        [class_id]
      );
    }
    
    res.json({
      success: true,
      userId,
      message: '学生创建成功'
    });
    
  } catch (error) {
    console.error('创建学生错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['student:update']), async (req, res) => {
  try {
    const {
      name, gender, birth_date, phone, email, address, status,
      class_id, enrollment_date, enrollment_status,
      major, admission_score, id_card_number, emergency_contact, emergency_phone
    } = req.body;
    
    const existingStudent = await getQuery(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [req.params.id, 'student']
    );
    
    if (!existingStudent) {
      return res.status(404).json({ error: '学生不存在' });
    }
    
    const currentProfile = await getQuery(
      'SELECT * FROM student_profiles WHERE user_id = ?',
      [req.params.id]
    );
    
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
    
    if (class_id !== undefined && currentProfile.class_id !== class_id) {
      if (currentProfile.class_id) {
        await runQuery(
          'UPDATE classes SET student_count = student_count - 1 WHERE id = ?',
          [currentProfile.class_id]
        );
      }
      if (class_id) {
        await runQuery(
          'UPDATE classes SET student_count = student_count + 1 WHERE id = ?',
          [class_id]
        );
      }
    }
    
    let updateProfileFields = [];
    let updateProfileParams = [];
    
    if (class_id !== undefined) {
      updateProfileFields.push('class_id = ?');
      updateProfileParams.push(class_id);
    }
    if (enrollment_date !== undefined) {
      updateProfileFields.push('enrollment_date = ?');
      updateProfileParams.push(enrollment_date);
    }
    if (enrollment_status !== undefined) {
      updateProfileFields.push('enrollment_status = ?');
      updateProfileParams.push(enrollment_status);
    }
    if (major !== undefined) {
      updateProfileFields.push('major = ?');
      updateProfileParams.push(major);
    }
    if (admission_score !== undefined) {
      updateProfileFields.push('admission_score = ?');
      updateProfileParams.push(admission_score);
    }
    if (id_card_number !== undefined) {
      updateProfileFields.push('id_card_number = ?');
      updateProfileParams.push(id_card_number);
    }
    if (emergency_contact !== undefined) {
      updateProfileFields.push('emergency_contact = ?');
      updateProfileParams.push(emergency_contact);
    }
    if (emergency_phone !== undefined) {
      updateProfileFields.push('emergency_phone = ?');
      updateProfileParams.push(emergency_phone);
    }
    
    if (updateProfileFields.length > 0) {
      updateProfileFields.push('updated_at = CURRENT_TIMESTAMP');
      updateProfileParams.push(req.params.id);
      await runQuery(
        `UPDATE student_profiles SET ${updateProfileFields.join(', ')} WHERE user_id = ?`,
        updateProfileParams
      );
    }
    
    res.json({
      success: true,
      message: '学生信息更新成功'
    });
    
  } catch (error) {
    console.error('更新学生信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['student:delete']), async (req, res) => {
  try {
    const student = await getQuery(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [req.params.id, 'student']
    );
    
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }
    
    const profile = await getQuery(
      'SELECT * FROM student_profiles WHERE user_id = ?',
      [req.params.id]
    );
    
    if (profile && profile.class_id) {
      await runQuery(
        'UPDATE classes SET student_count = student_count - 1 WHERE id = ?',
        [profile.class_id]
      );
    }
    
    await runQuery('DELETE FROM student_profiles WHERE user_id = ?', [req.params.id]);
    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '学生删除成功'
    });
    
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/schedule', authMiddleware(['student:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const schedules = await allQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              u.name as teacher_name, cr.room_name, cr.building
       FROM enrollments e
       JOIN schedules s ON e.schedule_id = s.id
       JOIN courses c ON s.course_id = c.id
       JOIN users u ON s.teacher_id = u.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       WHERE e.student_id = ? 
         AND e.term = ? 
         AND e.academic_year = ?
         AND e.status = 'enrolled'
         AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.id, term, academic_year]
    );
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly,
      totalCredits: schedules.reduce((sum, s) => sum + (s.credits || 0), 0)
    });
    
  } catch (error) {
    console.error('获取学生课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/grades', authMiddleware(['student:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    let sql = `
      SELECT g.*, c.course_name, c.credits, c.course_type, u.name as teacher_name
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      JOIN users u ON g.teacher_id = u.id
      WHERE g.student_id = ?
    `;
    const params = [req.params.id];
    
    if (term) {
      sql += ' AND g.term = ?';
      params.push(term);
    }
    if (academic_year) {
      sql += ' AND g.academic_year = ?';
      params.push(academic_year);
    }
    
    sql += ' ORDER BY g.academic_year DESC, g.term DESC, g.created_at DESC';
    
    const grades = await allQuery(sql, params);
    
    res.json({ grades });
    
  } catch (error) {
    console.error('获取学生成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/attendance', authMiddleware(['student:read']), async (req, res) => {
  try {
    const { term, academic_year, course_id } = req.query;
    
    let sql = `
      SELECT a.*, c.course_name, u.name as teacher_name, s.day_of_week, s.start_time, s.end_time
      FROM attendances a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN schedules s ON a.schedule_id = s.id
      WHERE a.student_id = ?
    `;
    const params = [req.params.id];
    
    if (term || academic_year || course_id) {
      if (course_id) {
        sql += ' AND a.course_id = ?';
        params.push(course_id);
      }
    }
    
    sql += ' ORDER BY a.attendance_date DESC';
    
    const attendances = await allQuery(sql, params);
    
    const statistics = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'present').length,
      late: attendances.filter(a => a.status === 'late').length,
      early_leave: attendances.filter(a => a.status === 'early_leave').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      leave: attendances.filter(a => a.status === 'leave').length
    };
    
    res.json({ attendances, statistics });
    
  } catch (error) {
    console.error('获取学生考勤错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
