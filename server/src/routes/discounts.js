const express = require('express');
const { get, run, all, transaction } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { idempotentMiddleware } = require('../middleware/idempotent');
const { transitionStatus } = require('../engines/billLedgerEngine');
const { calculateDiscountTax } = require('../engines/taxRuleEngine');

const router = express.Router();

router.use(authenticate);
router.use(idempotentMiddleware);

router.get('/', async (req, res) => {
  try {
    const { billId, status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (billId) {
      whereClause += ' AND bill_id = ?';
      params.push(billId);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countResult = await get(
      `SELECT COUNT(*) as total FROM discount_applications ${whereClause}`,
      params
    );

    const discounts = await all(`
      SELECT d.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.maturity_date,
             u.name as operator_name
      FROM discount_applications d
      LEFT JOIN bills b ON d.bill_id = b.id
      LEFT JOIN users u ON d.operator_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        discounts,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取贴现列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取贴现列表失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await get(`
      SELECT d.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.maturity_date,
             b.status as bill_status,
             u.name as operator_name
      FROM discount_applications d
      LEFT JOIN bills b ON d.bill_id = b.id
      LEFT JOIN users u ON d.operator_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: '贴现申请不存在'
      });
    }

    res.json({
      success: true,
      data: discount
    });
  } catch (error) {
    console.error('获取贴现详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取贴现详情失败',
      error: error.message
    });
  }
});

router.post('/calculate', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { discountAmount, discountRate, days } = req.body;

    if (!discountAmount || !discountRate || !days) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: discountAmount, discountRate, days'
      });
    }

    const calculation = await calculateDiscountTax(
      parseFloat(discountAmount),
      parseFloat(discountRate),
      parseInt(days)
    );

    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('计算贴现错误:', error);
    res.status(500).json({
      success: false,
      message: '计算贴现失败',
      error: error.message
    });
  }
});

router.post('/', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { billId, bankName, discountAmount, discountRate, discountDate } = req.body;

    const requiredFields = ['billId', 'bankName', 'discountAmount', 'discountRate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    const bill = await get(`SELECT * FROM bills WHERE id = ? AND is_deleted = 0`, [billId]);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '票据不存在'
      });
    }

    if (bill.status !== 'pending_discount') {
      return res.status(400).json({
        success: false,
        message: `当前票据状态为 ${bill.status}，无法进行贴现申请`
      });
    }

    const discountNo = `DA${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const dailyRate = parseFloat(discountRate) / 365;
    const issueDate = new Date(bill.issue_date);
    const maturityDate = new Date(bill.maturity_date);
    const days = Math.ceil((maturityDate - issueDate) / (1000 * 60 * 60 * 24));
    
    const interestAmount = parseFloat(discountAmount) * dailyRate * days;
    const actualAmount = parseFloat(discountAmount) - interestAmount;

    const result = await run(`
      INSERT INTO discount_applications 
      (discount_no, bill_id, bank_name, discount_amount, discount_rate, 
       discount_date, interest_amount, actual_amount, status, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      discountNo,
      billId,
      bankName,
      parseFloat(discountAmount),
      parseFloat(discountRate),
      discountDate || null,
      interestAmount,
      actualAmount,
      req.user.id
    ]);

    res.json({
      success: true,
      data: {
        id: result.lastID,
        discountNo,
        interestAmount,
        actualAmount
      },
      message: '贴现申请创建成功'
    });
  } catch (error) {
    console.error('创建贴现申请错误:', error);
    res.status(500).json({
      success: false,
      message: '创建贴现申请失败',
      error: error.message
    });
  }
});

router.post('/:id/approve', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const discount = await get(`SELECT * FROM discount_applications WHERE id = ?`, [id]);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: '贴现申请不存在'
      });
    }

    if (discount.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `当前贴现状态为 ${discount.status}，无法审批`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE discount_applications 
        SET status = 'approved', 
            approval_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [comment, req.user.id, id]);

      await transitionStatus(
        discount.bill_id, 
        'approve', 
        req.user.id, 
        comment || '贴现审批通过'
      );
    });

    res.json({
      success: true,
      message: '贴现审批通过，票据已进入待到期提示状态'
    });
  } catch (error) {
    console.error('审批贴现错误:', error);
    res.status(500).json({
      success: false,
      message: '审批贴现失败',
      error: error.message
    });
  }
});

router.post('/:id/reject', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const discount = await get(`SELECT * FROM discount_applications WHERE id = ?`, [id]);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: '贴现申请不存在'
      });
    }

    if (discount.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `当前贴现状态为 ${discount.status}，无法驳回`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE discount_applications 
        SET status = 'rejected', 
            approval_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [comment, req.user.id, id]);

      await transitionStatus(
        discount.bill_id, 
        'reject', 
        req.user.id, 
        comment || '贴现审批驳回'
      );
    });

    res.json({
      success: true,
      message: '贴现审批驳回，票据已退回待背书流转状态'
    });
  } catch (error) {
    console.error('驳回贴现错误:', error);
    res.status(500).json({
      success: false,
      message: '驳回贴现失败',
      error: error.message
    });
  }
});

module.exports = router;
