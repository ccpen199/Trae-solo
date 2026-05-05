import { get, all } from '../database.js';

export const getExpenseTypes = async (req, res) => {
  try {
    const types = await all(`
      SELECT * FROM expense_types WHERE is_active = 1 ORDER BY id
    `);

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('获取报销类型错误:', error);
    res.status(500).json({ success: false, message: '获取报销类型失败' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await all(`
      SELECT * FROM projects WHERE is_active = 1 ORDER BY id
    `);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, exclude_self, department } = req.query;
    
    let sql = `
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.email,
        u.phone,
        u.department, 
        r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    let params = [];

    if (role) {
      const roles = role.split(',');
      sql += ` AND r.name IN (${roles.map(() => '?').join(',')})`;
      params.push(...roles);
    }

    if (exclude_self) {
      sql += ' AND u.id != ?';
      params.push(req.userId);
    }

    if (department) {
      sql += ' AND u.department = ?';
      params.push(department);
    }

    sql += ' ORDER BY u.id';

    const users = await all(sql, params);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const user_id = req.userId;

    const user = await get(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [user_id]);

    const statistics = {
      my_pending: 0,
      my_approved: 0,
      my_rejected: 0,
      to_approve: 0,
      to_review: 0,
      cc_count: 0
    };

    const myPending = await get(`
      SELECT COUNT(*) as count FROM expense_applications 
      WHERE applicant_id = ? AND status IN ('draft', 'submitted', 'approving', 'reviewing')
    `, [user_id]);
    statistics.my_pending = myPending.count;

    const myApproved = await get(`
      SELECT COUNT(*) as count FROM expense_applications 
      WHERE applicant_id = ? AND status IN ('approved', 'archived')
    `, [user_id]);
    statistics.my_approved = myApproved.count;

    const myRejected = await get(`
      SELECT COUNT(*) as count FROM expense_applications 
      WHERE applicant_id = ? AND status IN ('approver_rejected', 'finance_rejected')
    `, [user_id]);
    statistics.my_rejected = myRejected.count;

    if (user.role_name === 'approver') {
      const toApprove = await get(`
        SELECT COUNT(*) as count FROM expense_applications 
        WHERE approver_id = ? AND status IN ('submitted', 'approving')
      `, [user_id]);
      statistics.to_approve = toApprove.count;
    }

    if (user.role_name === 'finance' || user.role_name === 'admin') {
      const toReview = await get(`
        SELECT COUNT(*) as count FROM expense_applications 
        WHERE status = 'reviewing'
      `);
      statistics.to_review = toReview.count;
    }

    const ccCount = await get(`
      SELECT COUNT(*) as count FROM cc_records 
      WHERE user_id = ? AND is_read = 0
    `, [user_id]);
    statistics.cc_count = ccCount.count;

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await all(`
      SELECT DISTINCT department FROM users 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `);

    res.json({
      success: true,
      data: departments.map(d => d.department)
    });
  } catch (error) {
    console.error('获取部门列表错误:', error);
    res.status(500).json({ success: false, message: '获取部门列表失败' });
  }
};
