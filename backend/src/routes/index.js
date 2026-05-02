const express = require('express');
const router = express.Router();
const VoucherService = require('../services/voucherService');
const ReviewService = require('../services/reviewService');
const LedgerService = require('../services/ledgerService');
const ReportService = require('../services/reportService');
const ClosureService = require('../services/closureService');
const VoucherEngine = require('../engines/voucherEngine');
const db = require('../config/database');

const MOCK_USER = {
  id: 'mock-user-1',
  username: 'accountant',
  name: '张会计',
  role: 'accountant'
};

function getCurrentUser(req) {
  const role = req.headers['x-user-role'] || 'accountant';
  const userId = req.headers['x-user-id'] || MOCK_USER.id;
  const userName = req.headers['x-user-name'] || MOCK_USER.name;
  
  return {
    id: userId,
    name: userName,
    role: role
  };
}

router.get('/health', (req, res) => {
  res.json({ success: true, message: '会计记账系统后端服务运行正常', timestamp: new Date().toISOString() });
});

router.get('/subjects', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM subjects WHERE is_active = 1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY code';

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: rows });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/subjects/:id', (req, res) => {
  db.get('SELECT * FROM subjects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: '科目不存在' });
    }
    res.json({ success: true, data: row });
  });
});

router.get('/vouchers', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      period: req.query.period,
      voucher_type: req.query.voucher_type,
      keyword: req.query.keyword,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const vouchers = await VoucherService.getVoucherList(filters);
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/vouchers/:id', async (req, res) => {
  try {
    const voucher = await VoucherService.getVoucherWithDetails(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, error: '凭证不存在' });
    }

    const user = getCurrentUser(req);
    const availableActions = VoucherEngine.getAvailableActions(voucher.status, user.role);

    res.json({ 
      success: true, 
      data: {
        ...voucher,
        availableActions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await VoucherService.createVoucher(req.body, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/vouchers/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await VoucherService.updateVoucher(req.params.id, req.body, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/submit', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await VoucherService.submitVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/cancel', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await VoucherService.cancelVoucher(req.params.id, user, req.body.reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/vouchers/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await VoucherService.deleteVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/lock', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.lockVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/unlock', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.unlockVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/review/pass', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.passReview(req.params.id, user, req.body.comment);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/review/reject', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.rejectReview(req.params.id, user, req.body.comment);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/review/supplement', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.supplementReview(
      req.params.id, user, 
      req.body.comment, req.body.requiredItems
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/review/transfer', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReviewService.transferReview(
      req.params.id, user,
      req.body.targetUserId, req.body.targetUserName,
      req.body.comment
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/ledger', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await LedgerService.generateLedger(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ledgers', async (req, res) => {
  try {
    const { period } = req.query;
    const result = await LedgerService.getGeneralLedger(period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ledgers/subject/:subjectId', async (req, res) => {
  try {
    const { period } = req.query;
    const result = await LedgerService.getLedgerBySubject(req.params.subjectId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/report', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReportService.generateReportForVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reports/balance-sheet', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReportService.generateBalanceSheet(req.body.period, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/balance-sheet/:period', async (req, res) => {
  try {
    const result = await ReportService.getBalanceSheet(req.params.period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reports/profit-sheet', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ReportService.generateProfitSheet(req.body.period, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/profit-sheet/:period', async (req, res) => {
  try {
    const result = await ReportService.getProfitSheet(req.params.period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/close', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ClosureService.closeVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vouchers/:id/unclose', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ClosureService.uncloseVoucher(req.params.id, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/periods/:period/close', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ClosureService.closePeriod(req.params.period, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/periods/:period/unclose', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const result = await ClosureService.unclosePeriod(req.params.period, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/periods/:period/status', async (req, res) => {
  try {
    const result = await ClosureService.getPeriodClosureStatus(req.params.period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const pendingCount = await VoucherService.getPendingCount(user.role);

    const period = req.query.period || new Date().toISOString().slice(0, 7);

    const voucherCounts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT status, COUNT(*) as count FROM vouchers 
         WHERE period = ? 
         GROUP BY status`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else {
            const counts = {};
            rows.forEach(row => {
              counts[row.status] = row.count;
            });
            resolve(counts);
          }
        }
      );
    });

    res.json({
      success: true,
      data: {
        pendingCount,
        voucherCounts: {
          draft: voucherCounts[VoucherEngine.VOUCHER_STATUSES.DRAFT] || 0,
          pending_review: voucherCounts[VoucherEngine.VOUCHER_STATUSES.PENDING_REVIEW] || 0,
          pending_ledger: voucherCounts[VoucherEngine.VOUCHER_STATUSES.PENDING_LEDGER] || 0,
          pending_report: voucherCounts[VoucherEngine.VOUCHER_STATUSES.PENDING_REPORT] || 0,
          pending_closure: voucherCounts[VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE] || 0,
          closed: voucherCounts[VoucherEngine.VOUCHER_STATUSES.CLOSED] || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users', (req, res) => {
  db.all('SELECT id, username, name, role FROM users WHERE is_active = 1', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT id, username, name, role FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!row) {
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }
      res.json({ success: true, data: row });
    }
  );
});

module.exports = router;
