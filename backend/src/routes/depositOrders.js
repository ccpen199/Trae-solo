const express = require('express');
const db = require('../config/database');
const { authMiddleware, financeOrAdminMiddleware, roleMiddleware } = require('../middleware/auth');
const { logOperation, logOrderTrail } = require('../services/logService');
const { generateDepositNo } = require('../utils/orderNoGenerator');

const router = express.Router();

const DEPOSIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

router.get('/', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      customerId,
      departmentId,
      employeeId,
      orderId,
      paymentMethodId,
      status,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(do.deposit_no LIKE ? OR o.order_no LIKE ? OR c.name LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (customerId) {
      whereConditions.push('do.customer_id = ?');
      params.push(customerId);
    }

    if (departmentId) {
      whereConditions.push('do.department_id = ?');
      params.push(departmentId);
    }

    if (employeeId) {
      whereConditions.push('do.sales_id = ?');
      params.push(employeeId);
    }

    if (orderId) {
      whereConditions.push('do.order_id = ?');
      params.push(orderId);
    }

    if (paymentMethodId) {
      whereConditions.push('do.payment_method_id = ?');
      params.push(paymentMethodId);
    }

    if (status) {
      whereConditions.push('do.status = ?');
      params.push(status);
    }

    if (startDate) {
      whereConditions.push('DATE(do.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(do.created_at) <= ?');
      params.push(endDate);
    }

    if (req.user.roleCode === 'sales') {
      whereConditions.push('do.sales_id = ?');
      params.push(req.user.id);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM deposit_orders do
      LEFT JOIN orders o ON do.order_id = o.id
      LEFT JOIN customers c ON do.customer_id = c.id
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        do.*,
        o.order_no,
        o.status as order_status,
        c.name as customer_name,
        c.phone as customer_phone,
        c.customer_no,
        u.name as sales_name,
        u.employee_id as sales_employee_id,
        d.name as department_name,
        pm.name as payment_method_name,
        ru.name as reviewed_by_name
      FROM deposit_orders do
      LEFT JOIN orders o ON do.order_id = o.id
      LEFT JOIN customers c ON do.customer_id = c.id
      LEFT JOIN users u ON do.sales_id = u.id
      LEFT JOIN departments d ON do.department_id = d.id
      LEFT JOIN payment_methods pm ON do.payment_method_id = pm.id
      LEFT JOIN users ru ON do.reviewed_by = ru.id
      WHERE ${whereClause}
      ORDER BY do.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get deposit orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取定金单列表失败',
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const depositOrder = db.prepare(`
      SELECT 
        do.*,
        o.order_no,
        o.status as order_status,
        o.total_amount as order_total_amount,
        o.final_amount as order_final_amount,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        u.name as sales_name,
        d.name as department_name,
        pm.name as payment_method_name,
        ru.name as reviewed_by_name
      FROM deposit_orders do
      LEFT JOIN orders o ON do.order_id = o.id
      LEFT JOIN customers c ON do.customer_id = c.id
      LEFT JOIN users u ON do.sales_id = u.id
      LEFT JOIN departments d ON do.department_id = d.id
      LEFT JOIN payment_methods pm ON do.payment_method_id = pm.id
      LEFT JOIN users ru ON do.reviewed_by = ru.id
      WHERE do.id = ?
    `).get(id);

    if (!depositOrder) {
      return res.status(404).json({
        success: false,
        message: '定金单不存在'
      });
    }

    res.json({
      success: true,
      data: depositOrder
    });
  } catch (error) {
    console.error('Get deposit order detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取定金单详情失败',
      error: error.message
    });
  }
});

router.post('/:id/approve', authMiddleware, financeOrAdminMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { remark } = req.body;

      const depositOrder = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(id);

      if (!depositOrder) {
        throw new Error('定金单不存在');
      }

      if (depositOrder.status !== DEPOSIT_STATUS.PENDING) {
        throw new Error('定金单状态不正确，无法审核');
      }

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE deposit_orders 
        SET status = ?, reviewed_by = ?, reviewed_at = ?, review_remark = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        DEPOSIT_STATUS.APPROVED,
        req.user.id,
        now,
        remark,
        id
      );

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(depositOrder.order_id);
      
      if (order) {
        db.prepare(`
          UPDATE orders 
          SET review_status = ?, status = ?, paid_amount = paid_amount + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run('approved', 'pending_shipment', depositOrder.amount, depositOrder.order_id);

        logOrderTrail({
          orderId: depositOrder.order_id,
          action: '财务审核通过',
          content: `定金单审核通过，定金金额：${depositOrder.amount}${remark ? `，备注：${remark}` : ''}`,
          operator: req.user,
          statusBefore: order.status,
          statusAfter: 'pending_shipment'
        });
      }

      logOperation({
        user: req.user,
        module: '财务审核',
        action: '审核通过',
        targetType: 'deposit_order',
        targetId: id,
        detail: { depositNo: depositOrder.deposit_no, amount: depositOrder.amount, remark },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '定金单审核通过'
    });
  } catch (error) {
    console.error('Approve deposit order error:', error);
    res.status(500).json({
      success: false,
      message: '审核失败',
      error: error.message
    });
  }
});

router.post('/:id/reject', authMiddleware, financeOrAdminMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { remark } = req.body;

      const depositOrder = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(id);

      if (!depositOrder) {
        throw new Error('定金单不存在');
      }

      if (depositOrder.status !== DEPOSIT_STATUS.PENDING) {
        throw new Error('定金单状态不正确，无法拒绝');
      }

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE deposit_orders 
        SET status = ?, reviewed_by = ?, reviewed_at = ?, review_remark = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        DEPOSIT_STATUS.REJECTED,
        req.user.id,
        now,
        remark || '审核不通过',
        id
      );

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(depositOrder.order_id);
      
      if (order) {
        db.prepare(`
          UPDATE orders 
          SET review_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run('rejected', depositOrder.order_id);

        logOrderTrail({
          orderId: depositOrder.order_id,
          action: '财务审核拒绝',
          content: `定金单审核不通过，原因：${remark || '未填写原因'}`,
          operator: req.user,
          statusBefore: order.status,
          statusAfter: order.status
        });
      }

      logOperation({
        user: req.user,
        module: '财务审核',
        action: '审核拒绝',
        targetType: 'deposit_order',
        targetId: id,
        detail: { depositNo: depositOrder.deposit_no, remark },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '定金单审核不通过，已退回销售'
    });
  } catch (error) {
    console.error('Reject deposit order error:', error);
    res.status(500).json({
      success: false,
      message: '审核操作失败',
      error: error.message
    });
  }
});

router.put('/:id/cancel', authMiddleware, roleMiddleware('super_admin', 'sales'), (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const depositOrder = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(id);

      if (!depositOrder) {
        throw new Error('定金单不存在');
      }

      if (depositOrder.status !== DEPOSIT_STATUS.PENDING) {
        throw new Error('只能取消待审核的定金单');
      }

      if (req.user.roleCode === 'sales' && depositOrder.sales_id !== req.user.id) {
        throw new Error('只能取消自己创建的定金单');
      }

      db.prepare(`
        UPDATE deposit_orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(DEPOSIT_STATUS.CANCELLED, id);

      logOperation({
        user: req.user,
        module: '定金单管理',
        action: '取消定金单',
        targetType: 'deposit_order',
        targetId: id,
        detail: { depositNo: depositOrder.deposit_no, reason },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '定金单已取消'
    });
  } catch (error) {
    console.error('Cancel deposit order error:', error);
    res.status(500).json({
      success: false,
      message: '取消定金单失败',
      error: error.message
    });
  }
});

module.exports = router;
