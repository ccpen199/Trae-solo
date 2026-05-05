const db = require('../database/index');
const { getRedisClient } = require('../database/redis');
const bcrypt = require('bcryptjs');

class TeacherController {
  static async checkDuplicateName(req, res) {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '请输入教师姓名'
        });
      }

      const result = await db.query(
        `SELECT id, name, department_id, position, status 
         FROM teachers 
         WHERE name = $1`,
        [name]
      );

      if (result.rows.length > 0) {
        const departments = await db.query(
          'SELECT id, name FROM departments'
        );
        
        const deptMap = {};
        departments.rows.forEach(d => deptMap[d.id] = d.name);

        const duplicates = result.rows.map(r => ({
          id: r.id,
          name: r.name,
          department: deptMap[r.department_id] || '未分配',
          position: r.position || '未设置',
          status: r.status
        }));

        return res.json({
          success: true,
          hasDuplicate: true,
          count: duplicates.length,
          duplicates: duplicates,
          message: `已找到 ${duplicates.length} 位同名教师，请人工判重`
        });
      }

      return res.json({
        success: true,
        hasDuplicate: false,
        count: 0,
        message: '无同名教师，可继续录入'
      });
    } catch (error) {
      console.error('检查同名教师错误:', error);
      return res.status(500).json({
        success: false,
        message: '检查同名教师失败'
      });
    }
  }

  static async createTeacher(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const {
        name,
        gender,
        birth_date,
        id_card,
        phone,
        email,
        address,
        education,
        major,
        department_id,
        position,
        entry_date
      } = req.body;

      if (!name || !entry_date) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '教师姓名和入职日期为必填项'
        });
      }

      if (id_card) {
        const idCheck = await client.query(
          'SELECT id FROM teachers WHERE id_card = $1',
          [id_card]
        );
        if (idCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: '该身份证号已存在'
          });
        }
      }

      const teacherResult = await client.query(
        `INSERT INTO teachers (
          name, gender, birth_date, id_card, phone, email, address,
          education, major, department_id, position, entry_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, name, status, created_at`,
        [
          name,
          gender,
          birth_date || null,
          id_card || null,
          phone || null,
          email || null,
          address || null,
          education || null,
          major || null,
          department_id || null,
          position || null,
          entry_date,
          'probation'
        ]
      );

      const teacher = teacherResult.rows[0];

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: '教师基本信息录入成功',
        data: {
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          status: teacher.status,
          next_step: '请开通教师卡账号'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('创建教师档案错误:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: '数据重复，请检查唯一约束字段'
        });
      }

      return res.status(500).json({
        success: false,
        message: '创建教师档案失败'
      });
    } finally {
      client.release();
    }
  }

  static async createTeacherAccount(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { teacher_id, card_account, card_password } = req.body;

      if (!teacher_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '请指定教师ID'
        });
      }

      const teacherCheck = await client.query(
        'SELECT id, name, status FROM teachers WHERE id = $1',
        [teacher_id]
      );

      if (teacherCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '教师不存在'
        });
      }

      const existingAccount = await client.query(
        'SELECT id FROM teacher_accounts WHERE teacher_id = $1',
        [teacher_id]
      );

      if (existingAccount.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '该教师账号已存在'
        });
      }

      const teacher = teacherCheck.rows[0];
      const finalCardAccount = card_account || teacher.name;

      const accountCheck = await client.query(
        'SELECT id FROM teacher_accounts WHERE card_account = $1',
        [finalCardAccount]
      );

      if (accountCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `教师卡账号 "${finalCardAccount}" 已被使用，请指定其他账号`
        });
      }

      const defaultPassword = card_password || '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await client.query(
        `INSERT INTO teacher_accounts 
         (teacher_id, card_account, card_password, is_active)
         VALUES ($1, $2, $3, $4)`,
        [teacher_id, finalCardAccount, hashedPassword, true]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: '教师卡账号开通成功',
        data: {
          teacher_id: teacher_id,
          teacher_name: teacher.name,
          card_account: finalCardAccount,
          is_active: true
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('开通教师账号错误:', error);
      return res.status(500).json({
        success: false,
        message: '开通教师账号失败'
      });
    } finally {
      client.release();
    }
  }

  static async searchTeachers(req, res) {
    try {
      const { 
        name, 
        department_id, 
        status, 
        card_account,
        page = 1, 
        page_size = 20 
      } = req.query;

      let conditions = [];
      let params = [];
      let paramIndex = 1;

      if (name && name.trim()) {
        conditions.push(`t.name ILIKE $${paramIndex}`);
        params.push(`%${name.trim()}%`);
        paramIndex++;
      }

      if (department_id) {
        conditions.push(`t.department_id = $${paramIndex}`);
        params.push(department_id);
        paramIndex++;
      }

      if (status) {
        conditions.push(`t.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (card_account && card_account.trim()) {
        conditions.push(`ta.card_account ILIKE $${paramIndex}`);
        params.push(`%${card_account.trim()}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM teachers t
        LEFT JOIN teacher_accounts ta ON t.id = ta.teacher_id
        ${whereClause}
      `;

      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const offset = (parseInt(page) - 1) * parseInt(page_size);
      const limit = parseInt(page_size);

      const dataQuery = `
        SELECT 
          t.id,
          t.name,
          t.gender,
          t.birth_date,
          t.id_card,
          t.phone,
          t.email,
          t.education,
          t.major,
          t.department_id,
          d.name as department_name,
          t.position,
          t.entry_date,
          t.status,
          ta.card_account,
          ta.is_active,
          t.created_at,
          t.updated_at
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN teacher_accounts ta ON t.id = ta.teacher_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataParams = [...params, limit, offset];
      const dataResult = await db.query(dataQuery, dataParams);

      const teachers = dataResult.rows.map(teacher => ({
        ...teacher,
        status_label: {
          'probation': '试用期',
          'regular': '已转正',
          'resigned': '已离职',
          'fired': '已辞退'
        }[teacher.status] || teacher.status
      }));

      return res.json({
        success: true,
        data: {
          list: teachers,
          pagination: {
            page: parseInt(page),
            page_size: parseInt(page_size),
            total: total,
            total_pages: Math.ceil(total / parseInt(page_size))
          }
        }
      });

    } catch (error) {
      console.error('查询教师信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '查询教师信息失败'
      });
    }
  }

  static async getTeacherById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT 
          t.id,
          t.name,
          t.gender,
          t.birth_date,
          t.id_card,
          t.phone,
          t.email,
          t.address,
          t.education,
          t.major,
          t.department_id,
          d.name as department_name,
          t.position,
          t.entry_date,
          t.status,
          ta.card_account,
          ta.is_active,
          ta.last_login,
          t.created_at,
          t.updated_at
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN teacher_accounts ta ON t.id = ta.teacher_id
        WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '教师不存在'
        });
      }

      const teacher = result.rows[0];

      const statusMap = {
        'probation': '试用期',
        'regular': '已转正',
        'resigned': '已离职',
        'fired': '已辞退'
      };

      teacher.status_label = statusMap[teacher.status] || teacher.status;

      return res.json({
        success: true,
        data: teacher
      });

    } catch (error) {
      console.error('获取教师详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取教师详情失败'
      });
    }
  }

  static async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatableFields = [
        'gender', 'birth_date', 'id_card', 'phone', 'email', 'address',
        'education', 'major', 'department_id', 'position', 'entry_date', 'status'
      ];

      const fields = [];
      const values = [];
      let index = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (updatableFields.includes(key)) {
          fields.push(`${key} = $${index}`);
          values.push(value);
          index++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有可更新的字段'
        });
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await db.query(
        `UPDATE teachers SET ${fields.join(', ')} WHERE id = $${index} RETURNING id`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '教师不存在'
        });
      }

      return res.json({
        success: true,
        message: '教师信息更新成功'
      });

    } catch (error) {
      console.error('更新教师信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新教师信息失败'
      });
    }
  }

  static async getAccountList(req, res) {
    try {
      const { 
        teacher_name, 
        card_account, 
        is_active,
        page = 1, 
        page_size = 20 
      } = req.query;

      let conditions = ['1=1'];
      let params = [];
      let paramIndex = 1;

      if (teacher_name && teacher_name.trim()) {
        conditions.push(`t.name ILIKE $${paramIndex}`);
        params.push(`%${teacher_name.trim()}%`);
        paramIndex++;
      }

      if (card_account && card_account.trim()) {
        conditions.push(`ta.card_account ILIKE $${paramIndex}`);
        params.push(`%${card_account.trim()}%`);
        paramIndex++;
      }

      if (is_active !== undefined && is_active !== '') {
        conditions.push(`ta.is_active = $${paramIndex}`);
        params.push(is_active === 'true' || is_active === true);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM teacher_accounts ta
        JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE ${whereClause}
      `;

      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const offset = (parseInt(page) - 1) * parseInt(page_size);
      const limit = parseInt(page_size);

      const dataQuery = `
        SELECT 
          ta.id,
          ta.teacher_id,
          t.name as teacher_name,
          t.gender,
          t.phone,
          d.name as department_name,
          t.position,
          t.status as teacher_status,
          ta.card_account,
          ta.is_active,
          ta.last_login,
          ta.created_at,
          ta.updated_at
        FROM teacher_accounts ta
        JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE ${whereClause}
        ORDER BY ta.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataParams = [...params, limit, offset];
      const dataResult = await db.query(dataQuery, dataParams);

      const accounts = dataResult.rows.map(account => ({
        ...account,
        teacher_status_label: {
          'probation': '试用期',
          'regular': '已转正',
          'resigned': '已离职',
          'fired': '已辞退'
        }[account.teacher_status] || account.teacher_status
      }));

      return res.json({
        success: true,
        data: {
          list: accounts,
          pagination: {
            page: parseInt(page),
            page_size: parseInt(page_size),
            total: total,
            total_pages: Math.ceil(total / parseInt(page_size))
          }
        }
      });

    } catch (error) {
      console.error('查询账号列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '查询账号列表失败'
      });
    }
  }

  static async getAccountByTeacherId(req, res) {
    try {
      const { teacher_id } = req.params;

      const result = await db.query(
        `SELECT 
          ta.id,
          ta.teacher_id,
          t.name as teacher_name,
          t.gender,
          t.phone,
          d.name as department_name,
          t.position,
          t.status as teacher_status,
          ta.card_account,
          ta.is_active,
          ta.last_login,
          ta.created_at,
          ta.updated_at
        FROM teacher_accounts ta
        JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE ta.teacher_id = $1`,
        [teacher_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '该教师账号不存在'
        });
      }

      const account = result.rows[0];
      account.teacher_status_label = {
        'probation': '试用期',
        'regular': '已转正',
        'resigned': '已离职',
        'fired': '已辞退'
      }[account.teacher_status] || account.teacher_status;

      return res.json({
        success: true,
        data: account
      });

    } catch (error) {
      console.error('获取教师账号错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取教师账号失败'
      });
    }
  }

  static async resetPassword(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { teacher_id } = req.params;
      const { new_password } = req.body;

      const accountCheck = await client.query(
        'SELECT id FROM teacher_accounts WHERE teacher_id = $1',
        [teacher_id]
      );

      if (accountCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '该教师账号不存在'
        });
      }

      const password = new_password || '123456';
      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query(
        `UPDATE teacher_accounts 
         SET card_password = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE teacher_id = $2`,
        [hashedPassword, teacher_id]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: new_password ? '密码重置成功' : '密码已重置为默认值 123456'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('重置密码错误:', error);
      return res.status(500).json({
        success: false,
        message: '重置密码失败'
      });
    } finally {
      client.release();
    }
  }

  static async toggleAccountStatus(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { teacher_id } = req.params;
      const { is_active } = req.body;

      const accountCheck = await client.query(
        'SELECT id, is_active FROM teacher_accounts WHERE teacher_id = $1',
        [teacher_id]
      );

      if (accountCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '该教师账号不存在'
        });
      }

      const newStatus = is_active !== undefined ? is_active : !accountCheck.rows[0].is_active;

      await client.query(
        `UPDATE teacher_accounts 
         SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE teacher_id = $2`,
        [newStatus, teacher_id]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: newStatus ? '账号已启用' : '账号已禁用',
        data: { is_active: newStatus }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('切换账号状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '切换账号状态失败'
      });
    } finally {
      client.release();
    }
  }

  static async updateAccount(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { teacher_id } = req.params;
      const { card_account } = req.body;

      const accountCheck = await client.query(
        'SELECT id FROM teacher_accounts WHERE teacher_id = $1',
        [teacher_id]
      );

      if (accountCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '该教师账号不存在'
        });
      }

      if (card_account && card_account.trim()) {
        const duplicateCheck = await client.query(
          'SELECT id FROM teacher_accounts WHERE card_account = $1 AND teacher_id != $2',
          [card_account.trim(), teacher_id]
        );

        if (duplicateCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: '教师卡账号已被使用'
          });
        }

        await client.query(
          `UPDATE teacher_accounts 
           SET card_account = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE teacher_id = $2`,
          [card_account.trim(), teacher_id]
        );
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: '账号信息更新成功'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('更新账号错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新账号失败'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = TeacherController;
