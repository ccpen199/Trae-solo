const express = require('express');
const { get, run, all, transaction } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { idempotentMiddleware } = require('../middleware/idempotent');
const { 
  createBill, 
  transitionStatus, 
  getLedgerSummary, 
  getBillById, 
  getBillsList,
  getStatusLabel,
  STATUS_TRANSITIONS
} = require('../engines/billLedgerEngine');
const { 
  checkAndHandleAnomalies, 
  getDifferenceOrders,
  createDifferenceOrder 
} = require('../engines/reconciliationEngine');
const { evaluateAndUpdateRisk } = require('../engines/creditRiskEngine');
const { calculateBillTaxes } = require('../engines/taxRuleEngine');

const router = express.Router();

router.use(authenticate);
router.use(idempotentMiddleware);

router.get('/summary', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.billType) {
      filters.billType = req.query.billType;
    }
    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      filters.responsiblePersonId = req.user.id;
    }

    const summary = await getLedgerSummary(filters);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('获取票据汇总错误:', error);
    res.status(500).json({
      success: false,
      message: '获取票据汇总失败',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const filters = {};
    const pagination = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.billType) {
      filters.billType = req.query.billType;
    }
    if (req.query.billNumber) {
      filters.billNumber = req.query.billNumber;
    }
    if (req.query.startDate) {
      filters.startDate = req.query.startDate;
    }
    if (req.query.endDate) {
      filters.endDate = req.query.endDate;
    }

    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      filters.responsiblePersonId = req.user.id;
    }

    const result = await getBillsList(filters, pagination);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取票据列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取票据列表失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await getBillById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '票据不存在'
      });
    }

    const taxes = await calculateBillTaxes(bill);
    bill.taxes = taxes;

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.error('获取票据详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取票据详情失败',
      error: error.message
    });
  }
});

router.post('/', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const billData = req.body;

    const requiredFields = ['billType', 'billNumber', 'amount', 'drawer', 'acceptor', 'payee', 'issueDate', 'maturityDate'];
    const missingFields = requiredFields.filter(field => !billData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    const result = await createBill(billData, req.user.id);
    await evaluateAndUpdateRisk(result.id);

    res.json({
      success: true,
      data: result,
      message: '票据创建成功'
    });
  } catch (error) {
    console.error('创建票据错误:', error);
    
    if (error.message.includes('已存在')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '创建票据失败',
      error: error.message
    });
  }
});

router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: '缺少操作类型参数'
      });
    }

    const bill = await get(`SELECT * FROM bills WHERE id = ? AND is_deleted = 0`, [id]);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '票据不存在'
      });
    }

    if (action === 'submit') {
      const anomalyCheck = await checkAndHandleAnomalies({
        creditLimitCheck: {
          companyName: bill.drawer,
          amount: bill.amount,
          billId: bill.id
        },
        operatorId: req.user.id
      });

      if (anomalyCheck.hasAnomalies) {
        return res.status(200).json({
          success: true,
          data: {
            billId: bill.id,
            currentStatus: 'difference',
            anomalies: anomalyCheck.anomalies,
            message: '检测到异常，已转入差异单处理'
          }
        });
      }
    }

    const result = await transitionStatus(id, action, req.user.id, comment, metadata);

    if (action === 'approve' || action === 'submit') {
      await evaluateAndUpdateRisk(id);
    }

    res.json({
      success: true,
      data: result,
      message: `操作 ${action} 执行成功`
    });
  } catch (error) {
    console.error('执行票据操作错误:', error);
    
    if (error.message.includes('不允许') || error.message.includes('权限')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '执行操作失败',
      error: error.message
    });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await all(`
      SELECT h.*, u.name as operator_name
      FROM bill_status_history h
      LEFT JOIN users u ON h.operator_id = u.id
      WHERE h.bill_id = ?
      ORDER BY h.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取票据历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取票据历史失败',
      error: error.message
    });
  }
});

router.get('/:id/differences', async (req, res) => {
  try {
    const { id } = req.params;
    
    const differences = await getDifferenceOrders({ billId: id });

    res.json({
      success: true,
      data: differences
    });
  } catch (error) {
    console.error('获取差异单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取差异单失败',
      error: error.message
    });
  }
});

router.put('/:id', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bill = await get(`SELECT * FROM bills WHERE id = ? AND is_deleted = 0`, [id]);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '票据不存在'
      });
    }

    if (bill.status !== 'pending_input') {
      return res.status(400).json({
        success: false,
        message: '只有待录入状态的票据可以编辑'
      });
    }

    const allowedFields = ['amount', 'drawer', 'acceptor', 'payee', 'issueDate', 'maturityDate', 'expected_complete_date', 'responsible_person_id'];
    const updateFields = {};
    
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        updateFields[key] = updateData[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可更新的字段'
      });
    }

    const setClauses = Object.keys(updateFields).map(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbKey} = ?`;
    });
    const values = Object.values(updateFields);
    values.push(id);

    await run(`
      UPDATE bills 
      SET ${setClauses.join(', ')}, 
          updated_at = CURRENT_TIMESTAMP,
          updated_by = ?
      WHERE id = ?
    `, [...values, req.user.id, id]);

    await run(`
      INSERT INTO bill_status_history 
      (bill_id, from_status, to_status, action, operator_id, comment, created_at)
      VALUES (?, ?, ?, 'edit', ?, '更新票据信息', CURRENT_TIMESTAMP)
    `, [id, bill.status, bill.status, req.user.id]);

    await evaluateAndUpdateRisk(id);

    res.json({
      success: true,
      message: '票据更新成功'
    });
  } catch (error) {
    console.error('更新票据错误:', error);
    res.status(500).json({
      success: false,
      message: '更新票据失败',
      error: error.message
    });
  }
});

router.delete('/:id', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await get(`SELECT * FROM bills WHERE id = ? AND is_deleted = 0`, [id]);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '票据不存在'
      });
    }

    if (bill.status !== 'pending_input') {
      return res.status(400).json({
        success: false,
        message: '只有待录入状态的票据可以删除'
      });
    }

    await run(`
      UPDATE bills 
      SET is_deleted = 1, 
          updated_at = CURRENT_TIMESTAMP,
          updated_by = ?
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({
      success: true,
      message: '票据删除成功'
    });
  } catch (error) {
    console.error('删除票据错误:', error);
    res.status(500).json({
      success: false,
      message: '删除票据失败',
      error: error.message
    });
  }
});

module.exports = router;
