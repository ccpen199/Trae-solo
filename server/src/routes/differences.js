const express = require('express');
const { get, run, all, transaction } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { idempotentMiddleware } = require('../middleware/idempotent');

const router = express.Router();

router.use(authenticate);
router.use(idempotentMiddleware);

router.get('/', async (req, res) => {
  try {
    const { billId, currentStatus, diffType, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (billId) {
      whereClause += ' AND bill_id = ?';
      params.push(billId);
    }
    if (currentStatus) {
      whereClause += ' AND current_status = ?';
      params.push(currentStatus);
    }
    if (diffType) {
      whereClause += ' AND diff_type = ?';
      params.push(diffType);
    }

    const countResult = await get(
      `SELECT COUNT(*) as total FROM difference_orders ${whereClause}`,
      params
    );

    const differences = await all(`
      SELECT d.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.status as bill_status,
             u.name as operator_name
      FROM difference_orders d
      LEFT JOIN bills b ON d.bill_id = b.id
      LEFT JOIN users u ON d.operator_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        differences,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取差异单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取差异单列表失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const difference = await get(`
      SELECT d.*, 
             b.bill_number,
             b.bill_type,
             b.amount as bill_amount,
             b.status as bill_status,
             u.name as operator_name
      FROM difference_orders d
      LEFT JOIN bills b ON d.bill_id = b.id
      LEFT JOIN users u ON d.operator_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!difference) {
      return res.status(404).json({
        success: false,
        message: '差异单不存在'
      });
    }

    res.json({
      success: true,
      data: difference
    });
  } catch (error) {
    console.error('获取差异单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取差异单详情失败',
      error: error.message
    });
  }
});

router.post('/:id/resolve', requireRole('finance', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionComment } = req.body;

    const difference = await get(`SELECT * FROM difference_orders WHERE id = ?`, [id]);
    
    if (!difference) {
      return res.status(404).json({
        success: false,
        message: '差异单不存在'
      });
    }

    if (difference.current_status !== 'open' && difference.current_status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `当前差异单状态为 ${difference.current_status}，无法解决`
      });
    }

    await transaction(async () => {
      await run(`
        UPDATE difference_orders 
        SET current_status = 'resolved', 
            resolved_at = CURRENT_TIMESTAMP,
            resolution_comment = ?,
            operator_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [resolutionComment, req.user.id, id]);

      if (difference.bill_id) {
        const openDifferences = await get(
          `SELECT COUNT(*) as count FROM difference_orders 
           WHERE bill_id = ? AND current_status IN ('open', 'processing') AND id != ?`,
          [difference.bill_id, id]
        );

        if (openDifferences.count === 0) {
          const originalStatus = difference.original_status || 'pending_input';
          
          await run(`
            UPDATE bills 
            SET status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [originalStatus, difference.bill_id]);

          await run(`
            INSERT INTO bill_status_history 
            (bill_id, from_status, to_status, action, operator_id, comment, created_at)
            VALUES (?, 'difference', ?, '差异已解决', ?, ?, CURRENT_TIMESTAMP)
          `, [difference.bill_id, originalStatus, req.user.id, resolutionComment]);
        }
      }
    });

    res.json({
      success: true,
      message: '差异单已解决，票据状态已恢复'
    });
  } catch (error) {
    console.error('解决差异单错误:', error);
    res.status(500).json({
      success: false,
      message: '解决差异单失败',
      error: error.message
    });
  }
});

router.post('/:id/close', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionComment } = req.body;

    const difference = await get(`SELECT * FROM difference_orders WHERE id = ?`, [id]);
    
    if (!difference) {
      return res.status(404).json({
        success: false,
        message: '差异单不存在'
      });
    }

    await run(`
      UPDATE difference_orders 
      SET current_status = 'closed', 
          resolved_at = CURRENT_TIMESTAMP,
          resolution_comment = ?,
          operator_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [resolutionComment || '差异单已关闭', req.user.id, id]);

    res.json({
      success: true,
      message: '差异单已关闭'
    });
  } catch (error) {
    console.error('关闭差异单错误:', error);
    res.status(500).json({
      success: false,
      message: '关闭差异单失败',
      error: error.message
    });
  }
});

router.post('/:id/reassign', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newOperatorId, comment } = req.body;

    const difference = await get(`SELECT * FROM difference_orders WHERE id = ?`, [id]);
    
    if (!difference) {
      return res.status(404).json({
        success: false,
        message: '差异单不存在'
      });
    }

    await run(`
      UPDATE difference_orders 
      SET current_status = 'processing', 
          operator_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newOperatorId || req.user.id, id]);

    res.json({
      success: true,
      message: '差异单已转派'
    });
  } catch (error) {
    console.error('转派差异单错误:', error);
    res.status(500).json({
      success: false,
      message: '转派差异单失败',
      error: error.message
    });
  }
});

router.get('/summary/dashboard', requireRole('finance', 'admin', 'auditor'), async (req, res) => {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN current_status = 'open' THEN 1 ELSE 0 END) as openCount,
        SUM(CASE WHEN current_status = 'processing' THEN 1 ELSE 0 END) as processingCount,
        SUM(CASE WHEN current_status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount,
        SUM(CASE WHEN current_status = 'closed' THEN 1 ELSE 0 END) as closedCount,
        SUM(CASE WHEN diff_type = 'credit_limit' THEN 1 ELSE 0 END) as creditLimitCount,
        SUM(CASE WHEN diff_type = 'exchange_rate' THEN 1 ELSE 0 END) as exchangeRateCount,
        SUM(CASE WHEN diff_type = 'invoice' THEN 1 ELSE 0 END) as invoiceCount,
        SUM(CASE WHEN diff_type = 'callback' THEN 1 ELSE 0 END) as callbackCount,
        SUM(CASE WHEN diff_type = 'reconciliation' THEN 1 ELSE 0 END) as reconciliationCount
      FROM difference_orders
    `);

    const recentDifferences = await all(`
      SELECT d.*, 
             b.bill_number,
             u.name as operator_name
      FROM difference_orders d
      LEFT JOIN bills b ON d.bill_id = b.id
      LEFT JOIN users u ON d.operator_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: {
          ...stats,
          totalCount: stats.totalCount || 0,
          openCount: stats.openCount || 0,
          processingCount: stats.processingCount || 0,
          resolvedCount: stats.resolvedCount || 0,
          closedCount: stats.closedCount || 0
        },
        recentDifferences
      }
    });
  } catch (error) {
    console.error('获取差异单统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取差异单统计失败',
      error: error.message
    });
  }
});

module.exports = router;
