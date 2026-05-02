const express = require('express');
const { get, run, all, transaction } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { idempotentMiddleware } = require('../middleware/idempotent');
const { transitionStatus } = require('../engines/billLedgerEngine');

const router = express.Router();

router.use(authenticate);
router.use(idempotentMiddleware);

router.get('/', async (req, res) => {
  try {
    const { billId, status, reminderType, page = 1, pageSize = 20 } = req.query;
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
    if (reminderType) {
      whereClause += ' AND reminder_type = ?';
      params.push(reminderType);
    }

    const countResult = await get(
      `SELECT COUNT(*) as total FROM maturity_reminders ${whereClause}`,
      params
    );

    const reminders = await all(`
      SELECT m.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.maturity_date,
             u1.name as locked_by_name,
             u2.name as operator_name
      FROM maturity_reminders m
      LEFT JOIN bills b ON m.bill_id = b.id
      LEFT JOIN users u1 ON m.locked_by = u1.id
      LEFT JOIN users u2 ON m.operator_id = u2.id
      ${whereClause}
      ORDER BY m.reminder_date ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        reminders,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取到期提醒列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取到期提醒列表失败',
      error: error.message
    });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + parseInt(days));

    const reminders = await all(`
      SELECT m.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.maturity_date,
             b.status as bill_status
      FROM maturity_reminders m
      LEFT JOIN bills b ON m.bill_id = b.id
      WHERE m.reminder_date >= ? 
        AND m.reminder_date <= ?
        AND m.status = 'pending'
        AND m.is_locked = 0
      ORDER BY m.reminder_date ASC
    `, [today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0]]);

    res.json({
      success: true,
      data: {
        reminders,
        period: {
          start: today.toISOString().split('T')[0],
          end: futureDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('获取即将到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到期提醒失败',
      error: error.message
    });
  }
});

router.post('/:id/lock', requireRole('finance', 'bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await get(`SELECT * FROM maturity_reminders WHERE id = ?`, [id]);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '到期提醒不存在'
      });
    }

    if (reminder.is_locked === 1) {
      return res.status(409).json({
        success: false,
        message: '该到期提醒已被其他用户锁定'
      });
    }

    await run(`
      UPDATE maturity_reminders 
      SET is_locked = 1, 
          locked_by = ?,
          locked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({
      success: true,
      message: '到期提醒已锁定，防止多端并发修改'
    });
  } catch (error) {
    console.error('锁定到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '锁定到期提醒失败',
      error: error.message
    });
  }
});

router.post('/:id/unlock', requireRole('finance', 'bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await get(`SELECT * FROM maturity_reminders WHERE id = ?`, [id]);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '到期提醒不存在'
      });
    }

    if (reminder.is_locked === 1 && reminder.locked_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '您没有权限解锁此提醒'
      });
    }

    await run(`
      UPDATE maturity_reminders 
      SET is_locked = 0, 
          locked_by = NULL,
          locked_at = NULL
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: '到期提醒已解锁'
    });
  } catch (error) {
    console.error('解锁到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '解锁到期提醒失败',
      error: error.message
    });
  }
});

router.post('/:id/process', requireRole('finance', 'bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const reminder = await get(`SELECT * FROM maturity_reminders WHERE id = ?`, [id]);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '到期提醒不存在'
      });
    }

    if (reminder.is_locked === 1 && reminder.locked_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(409).json({
        success: false,
        message: '该到期提醒已被其他用户锁定，请先解锁'
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE maturity_reminders 
        SET status = 'processed', 
            operator_id = ?,
            processed_comment = ?,
            is_locked = 0,
            locked_by = NULL,
            locked_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user.id, comment, id]);

      await transitionStatus(
        reminder.bill_id, 
        'process', 
        req.user.id, 
        comment || '到期提醒处理完成'
      );

      await run(`
        UPDATE bills 
        SET due_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reminder.bill_id]);
    });

    res.json({
      success: true,
      message: '到期提醒处理完成，票据已归档'
    });
  } catch (error) {
    console.error('处理到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '处理到期提醒失败',
      error: error.message
    });
  }
});

router.post('/:id/send', requireRole('finance', 'bank', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await get(`SELECT * FROM maturity_reminders WHERE id = ?`, [id]);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: '到期提醒不存在'
      });
    }

    await run(`
      UPDATE maturity_reminders 
      SET status = 'sent', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: '到期提醒已发送'
    });
  } catch (error) {
    console.error('发送到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '发送到期提醒失败',
      error: error.message
    });
  }
});

router.post('/generate', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const bills = await all(`
      SELECT id, bill_number, maturity_date, status
      FROM bills 
      WHERE status = 'pending_maturity' 
        AND is_deleted = 0
      ORDER BY maturity_date ASC
    `);

    const generated = [];

    for (const bill of bills) {
      const maturityDate = new Date(bill.maturity_date);
      
      const reminderTypes = [
        { type: '7_days', days: -7 },
        { type: '3_days', days: -3 },
        { type: '1_day', days: -1 },
        { type: 'on_time', days: 0 },
        { type: 'overdue', days: 1 }
      ];

      for (const rt of reminderTypes) {
        const reminderDate = new Date(maturityDate);
        reminderDate.setDate(maturityDate.getDate() + rt.days);

        const existing = await get(
          `SELECT id FROM maturity_reminders 
           WHERE bill_id = ? AND reminder_type = ?`,
          [bill.id, rt.type]
        );

        if (!existing) {
          const reminderNo = `MR${Date.now()}${Math.floor(Math.random() * 1000)}`;
          
          await run(`
            INSERT INTO maturity_reminders 
            (reminder_no, bill_id, reminder_type, reminder_date, status)
            VALUES (?, ?, ?, ?, 'pending')
          `, [
            reminderNo,
            bill.id,
            rt.type,
            reminderDate.toISOString().split('T')[0]
          ]);

          generated.push({
            reminderNo,
            billId: bill.id,
            billNumber: bill.bill_number,
            reminderType: rt.type,
            reminderDate: reminderDate.toISOString().split('T')[0]
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        generated,
        count: generated.length
      },
      message: `成功生成 ${generated.length} 条到期提醒`
    });
  } catch (error) {
    console.error('生成到期提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '生成到期提醒失败',
      error: error.message
    });
  }
});

module.exports = router;
