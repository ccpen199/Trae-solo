const { query } = require('../config/database');
const nodemailer = require('nodemailer');

const getLogList = async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 10, 
      user_id, 
      username, 
      module, 
      action, 
      status, 
      start_date, 
      end_date 
    } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT * FROM operation_logs WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (user_id) {
      queryText += ` AND user_id = $${paramIndex}`;
      queryParams.push(parseInt(user_id));
      paramIndex++;
    }

    if (username) {
      queryText += ` AND username LIKE $${paramIndex}`;
      queryParams.push(`%${username}%`);
      paramIndex++;
    }

    if (module) {
      queryText += ` AND module = $${paramIndex}`;
      queryParams.push(module);
      paramIndex++;
    }

    if (action) {
      queryText += ` AND action = $${paramIndex}`;
      queryParams.push(action);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (start_date) {
      queryText += ` AND created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND created_at <= $${paramIndex}`;
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get log list error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取日志列表失败' 
    });
  }
};

const getLogDetail = async (req, res) => {
  try {
    const logId = parseInt(req.params.id);

    const result = await query(
      'SELECT * FROM operation_logs WHERE id = $1',
      [logId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '日志记录不存在' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get log detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取日志详情失败' 
    });
  }
};

const getLogStatistics = async (req, res) => {
  try {
    const { module, start_date, end_date } = req.query;

    let queryText = `SELECT 
                      COUNT(*) as total_count,
                      COUNT(*) FILTER (WHERE status = 'success') as success_count,
                      COUNT(*) FILTER (WHERE status = 'failed') as failed_count
                    FROM operation_logs WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      queryText += ` AND module = $${paramIndex}`;
      queryParams.push(module);
      paramIndex++;
    }

    if (start_date) {
      queryText += ` AND created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND created_at <= $${paramIndex}`;
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const summaryResult = await query(queryText, queryParams);

    let moduleQuery = `SELECT 
                        module,
                        COUNT(*) as count,
                        COUNT(*) FILTER (WHERE status = 'success') as success_count,
                        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
                      FROM operation_logs WHERE 1=1`;
    let moduleParams = [];
    let moduleParamIndex = 1;

    if (start_date) {
      moduleQuery += ` AND created_at >= $${moduleParamIndex}`;
      moduleParams.push(start_date);
      moduleParamIndex++;
    }

    if (end_date) {
      moduleQuery += ` AND created_at <= $${moduleParamIndex}`;
      moduleParams.push(end_date + ' 23:59:59');
      moduleParamIndex++;
    }

    moduleQuery += ' GROUP BY module ORDER BY count DESC';

    const moduleResult = await query(moduleQuery, moduleParams);

    let actionQuery = `SELECT 
                        action,
                        COUNT(*) as count
                      FROM operation_logs WHERE 1=1`;
    let actionParams = [];
    let actionParamIndex = 1;

    if (start_date) {
      actionQuery += ` AND created_at >= $${actionParamIndex}`;
      actionParams.push(start_date);
      actionParamIndex++;
    }

    if (end_date) {
      actionQuery += ` AND created_at <= $${actionParamIndex}`;
      actionParams.push(end_date + ' 23:59:59');
      actionParamIndex++;
    }

    actionQuery += ' GROUP BY action ORDER BY count DESC LIMIT 20';

    const actionResult = await query(actionQuery, actionParams);

    res.json({
      success: true,
      data: {
        summary: {
          total_count: parseInt(summaryResult.rows[0].total_count) || 0,
          success_count: parseInt(summaryResult.rows[0].success_count) || 0,
          failed_count: parseInt(summaryResult.rows[0].failed_count) || 0
        },
        by_module: moduleResult.rows,
        top_actions: actionResult.rows
      }
    });
  } catch (error) {
    console.error('Get log statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取日志统计失败' 
    });
  }
};

const sendBatchEmails = async (req, res) => {
  try {
    const { receivers, subject, content } = req.body;

    if (!receivers || receivers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '请至少提供一个收件人' 
      });
    }

    if (!subject) {
      return res.status(400).json({ 
        success: false, 
        message: '邮件主题不能为空' 
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const receiver of receivers) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: receiver.email || receiver,
          subject: subject,
          html: content
        });

        results.push({
          email: receiver.email || receiver,
          success: true,
          messageId: info.messageId
        });
        successCount++;
      } catch (emailError) {
        results.push({
          email: receiver.email || receiver,
          success: false,
          error: emailError.message
        });
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `邮件发送完成，成功: ${successCount}, 失败: ${failedCount}`,
      data: {
        total: receivers.length,
        success: successCount,
        failed: failedCount,
        results
      }
    });
  } catch (error) {
    console.error('Send batch emails error:', error);
    res.status(500).json({ 
      success: false, 
      message: '发送邮件失败: ' + error.message 
    });
  }
};

const getModuleList = async (req, res) => {
  try {
    const modules = [
      { value: 'system', label: '系统管理' },
      { value: 'user', label: '用户管理' },
      { value: 'supplier', label: '供应商管理' },
      { value: 'product', label: '商品管理' },
      { value: 'stock_in', label: '入库管理' },
      { value: 'stock_out', label: '出库管理' },
      { value: 'inventory', label: '库存管理' },
      { value: 'log', label: '日志管理' }
    ];

    const actions = [
      { value: 'login', label: '登录' },
      { value: 'logout', label: '登出' },
      { value: 'create_user', label: '创建用户' },
      { value: 'update_user', label: '更新用户' },
      { value: 'delete_user', label: '删除用户' },
      { value: 'update_profile', label: '更新个人信息' },
      { value: 'change_password', label: '修改密码' },
      { value: 'create_supplier', label: '创建供应商' },
      { value: 'update_supplier', label: '更新供应商' },
      { value: 'delete_supplier', label: '删除供应商' },
      { value: 'create_product', label: '创建商品' },
      { value: 'update_product', label: '更新商品' },
      { value: 'delete_product', label: '删除商品' },
      { value: 'create_product_type', label: '创建商品类型' },
      { value: 'delete_product_type', label: '删除商品类型' },
      { value: 'create_stock_in', label: '创建入库单' },
      { value: 'update_stock_in', label: '更新入库单' },
      { value: 'complete_stock_in', label: '完成入库' },
      { value: 'cancel_stock_in', label: '取消入库' },
      { value: 'create_stock_out', label: '创建出库单' },
      { value: 'update_stock_out', label: '更新出库单' },
      { value: 'complete_stock_out', label: '完成出库' },
      { value: 'cancel_stock_out', label: '取消出库' },
      { value: 'export', label: '导出数据' },
      { value: 'send_email', label: '发送邮件' }
    ];

    res.json({
      success: true,
      data: {
        modules,
        actions
      }
    });
  } catch (error) {
    console.error('Get module list error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取模块列表失败' 
    });
  }
};

module.exports = {
  getLogList,
  getLogDetail,
  getLogStatistics,
  sendBatchEmails,
  getModuleList
};