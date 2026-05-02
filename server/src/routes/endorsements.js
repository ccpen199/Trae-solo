const express = require('express');
const { get, run, all, transaction } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { idempotentMiddleware } = require('../middleware/idempotent');
const { transitionStatus, getBillById } = require('../engines/billLedgerEngine');

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
      `SELECT COUNT(*) as total FROM endorsements ${whereClause}`,
      params
    );

    const endorsements = await all(`
      SELECT e.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             u.name as operator_name
      FROM endorsements e
      LEFT JOIN bills b ON e.bill_id = b.id
      LEFT JOIN users u ON e.operator_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        endorsements,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取背书列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取背书列表失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const endorsement = await get(`
      SELECT e.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.status as bill_status,
             u.name as operator_name
      FROM endorsements e
      LEFT JOIN bills b ON e.bill_id = b.id
      LEFT JOIN users u ON e.operator_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (!endorsement) {
      return res.status(404).json({
        success: false,
        message: '背书记录不存在'
      });
    }

    res.json({
      success: true,
      data: endorsement
    });
  } catch (error) {
    console.error('获取背书详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取背书详情失败',
      error: error.message
    });
  }
});

router.post('/', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { billId, fromCompany, toCompany, endorsementDate, amount } = req.body;

    const requiredFields = ['billId', 'fromCompany', 'toCompany', 'endorsementDate', 'amount'];
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

    if (bill.status !== 'pending_endorsement') {
      return res.status(400).json({
        success: false,
        message: `当前票据状态为 ${bill.status}，无法进行背书操作`
      });
    }

    const endorsementNo = `ED${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = await run(`
      INSERT INTO endorsements 
      (endorsement_no, bill_id, from_company, to_company, endorsement_date, 
       amount, status, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      endorsementNo,
      billId,
      fromCompany,
      toCompany,
      endorsementDate,
      amount,
      req.user.id
    ]);

    res.json({
      success: true,
      data: {
        id: result.lastID,
        endorsementNo
      },
      message: '背书申请创建成功'
    });
  } catch (error) {
    console.error('创建背书申请错误:', error);
    res.status(500).json({
      success: false,
      message: '创建背书申请失败',
      error: error.message
    });
  }
});

router.post('/:id/approve', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const endorsement = await get(`SELECT * FROM endorsements WHERE id = ?`, [id]);
    
    if (!endorsement) {
      return res.status(404).json({
        success: false,
        message: '背书记录不存在'
      });
    }

    if (endorsement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `当前背书状态为 ${endorsement.status}，无法审批`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE endorsements 
        SET status = 'approved', 
            approval_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [comment, req.user.id, id]);

      await transitionStatus(
        endorsement.bill_id, 
        'approve', 
        req.user.id, 
        comment || '背书审批通过'
      );
    });

    res.json({
      success: true,
      message: '背书审批通过，票据已进入待贴现申请状态'
    });
  } catch (error) {
    console.error('审批背书错误:', error);
    res.status(500).json({
      success: false,
      message: '审批背书失败',
      error: error.message
    });
  }
});

router.post('/:id/reject', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const endorsement = await get(`SELECT * FROM endorsements WHERE id = ?`, [id]);
    
    if (!endorsement) {
      return res.status(404).json({
        success: false,
        message: '背书记录不存在'
      });
    }

    if (endorsement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `当前背书状态为 ${endorsement.status}，无法驳回`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE endorsements 
        SET status = 'rejected', 
            approval_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [comment, req.user.id, id]);

      await transitionStatus(
        endorsement.bill_id, 
        'reject', 
        req.user.id, 
        comment || '背书审批驳回'
      );
    });

    res.json({
      success: true,
      message: '背书审批驳回，票据已退回待票据录入状态'
    });
  } catch (error) {
    console.error('驳回背书错误:', error);
    res.status(500).json({
      success: false,
      message: '驳回背书失败',
      error: error.message
    });
  }
});

router.post('/:id/request-info', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const endorsement = await get(`SELECT * FROM endorsements WHERE id = ?`, [id]);
    
    if (!endorsement) {
      return res.status(404).json({
        success: false,
        message: '背书记录不存在'
      });
    }

    if (endorsement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `当前背书状态为 ${endorsement.status}，无法要求补充资料`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE endorsements 
        SET status = 'pending_info', 
            approval_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [comment, req.user.id, id]);

      await transitionStatus(
        endorsement.bill_id, 
        'request_info', 
        req.user.id, 
        comment || '要求补充资料'
      );
    });

    res.json({
      success: true,
      message: '已要求补充资料，票据已退回待票据录入状态'
    });
  } catch (error) {
    console.error('要求补充资料错误:', error);
    res.status(500).json({
      success: false,
      message: '要求补充资料失败',
      error: error.message
    });
  }
});

router.post('/:id/reassign', requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const endorsement = await get(`SELECT * FROM endorsements WHERE id = ?`, [id]);
    
    if (!endorsement) {
      return res.status(404).json({
        success: false,
        message: '背书记录不存在'
      });
    }

    await run(`
      UPDATE endorsements 
      SET status = 'reassigned', 
          approval_comment = ?,
          operator_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [comment, req.user.id, id]);

    res.json({
      success: true,
      message: '背书已转派'
    });
  } catch (error) {
    console.error('转派背书错误:', error);
    res.status(500).json({
      success: false,
      message: '转派背书失败',
      error: error.message
    });
  }
});

module.exports = router;
