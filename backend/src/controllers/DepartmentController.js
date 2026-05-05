const db = require('../database/index');

class DepartmentController {
  static async getAllDepartments(req, res) {
    try {
      const result = await db.query(
        `SELECT id, name, description, created_at, updated_at
         FROM departments
         ORDER BY name`
      );

      return res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('获取部门列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取部门列表失败'
      });
    }
  }

  static async getDepartmentById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, name, description, created_at, updated_at
         FROM departments
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '部门不存在'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('获取部门详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取部门详情失败'
      });
    }
  }

  static async createDepartment(req, res) {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: '部门名称为必填项'
        });
      }

      const existing = await db.query(
        'SELECT id FROM departments WHERE name = $1',
        [name.trim()]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '部门名称已存在'
        });
      }

      const result = await db.query(
        `INSERT INTO departments (name, description)
         VALUES ($1, $2)
         RETURNING id, name, description`,
        [name.trim(), description || null]
      );

      return res.status(201).json({
        success: true,
        message: '部门创建成功',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('创建部门错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建部门失败'
      });
    }
  }

  static async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const check = await db.query(
        'SELECT id FROM departments WHERE id = $1',
        [id]
      );

      if (check.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '部门不存在'
        });
      }

      if (name && name.trim()) {
        const existing = await db.query(
          'SELECT id FROM departments WHERE name = $1 AND id != $2',
          [name.trim(), id]
        );

        if (existing.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: '部门名称已存在'
          });
        }
      }

      const result = await db.query(
        `UPDATE departments 
         SET name = COALESCE(NULLIF($1, ''), name),
             description = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, description`,
        [name ? name.trim() : null, description, id]
      );

      return res.json({
        success: true,
        message: '部门更新成功',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('更新部门错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新部门失败'
      });
    }
  }

  static async deleteDepartment(req, res) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;

      const teacherCount = await client.query(
        'SELECT COUNT(*) FROM teachers WHERE department_id = $1',
        [id]
      );

      if (parseInt(teacherCount.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '该部门下还有教师，无法删除'
        });
      }

      const result = await client.query(
        'DELETE FROM departments WHERE id = $1 RETURNING id, name',
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '部门不存在'
        });
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: '部门删除成功',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('删除部门错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除部门失败'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = DepartmentController;
