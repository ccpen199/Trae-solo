const express = require('express');
const router = express.Router();
const { authMiddleware, checkPermission } = require('../middleware/auth.middleware');
const OrderService = require('../services/order.service');
const NotificationService = require('../services/notification.service');
const TaxRuleEngine = require('../services/engines/tax-rule-engine.service');
const StatusService = require('../services/status.service');

router.use(authMiddleware);

router.get('/tax-types', (req, res) => {
  try {
    const taxTypes = TaxRuleEngine.getAllTaxTypes();
    res.json({
      success: true,
      data: taxTypes.map(t => ({
        id: t.id,
        taxCode: t.tax_code,
        taxName: t.tax_name,
        taxRate: t.tax_rate,
        description: t.description
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取税种列表失败',
      error: error.message 
    });
  }
});

router.get('/statuses', (req, res) => {
  try {
    const statuses = StatusService.getAllStatuses();
    res.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取状态列表失败',
      error: error.message 
    });
  }
});

router.get('/dashboard', (req, res) => {
  try {
    const stats = OrderService.getDashboardStats(req.user.id, req.user.role);
    const unreadCount = NotificationService.getUnreadCount(req.user.id);
    const pendingTodoCount = NotificationService.getPendingTodoCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        ...stats,
        unreadCount,
        pendingTodoCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取看板数据失败',
      error: error.message 
    });
  }
});

router.get('/', (req, res) => {
  try {
    const { 
      status, taxTypeId, responsiblePersonId, createdBy, 
      keyword, periodStart, periodEnd,
      page = 1, pageSize = 20 
    } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (taxTypeId) filters.taxTypeId = taxTypeId;
    if (responsiblePersonId) filters.responsiblePersonId = responsiblePersonId;
    if (createdBy) filters.createdBy = createdBy;
    if (keyword) filters.keyword = keyword;
    if (periodStart) filters.periodStart = periodStart;
    if (periodEnd) filters.periodEnd = periodEnd;
    
    const result = OrderService.getOrderList(filters, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取单据列表失败',
      error: error.message 
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = OrderService.getOrderById(req.params.id, true);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '单据不存在' 
      });
    }
    
    const availableActions = OrderService.getAvailableActions(order.status, req.user.role);
    
    res.json({
      success: true,
      data: {
        ...order,
        availableActions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取单据详情失败',
      error: error.message 
    });
  }
});

router.post('/', (req, res) => {
  try {
    const result = OrderService.createOrder(req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '创建单据失败',
      error: error.message 
    });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const result = OrderService.submitToTaxCalculation(req.params.id, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '提交单据失败',
      error: error.message 
    });
  }
});

router.post('/:id/calculate-tax', (req, res) => {
  try {
    const result = OrderService.calculateTax(req.params.id, req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '计算税额失败',
      error: error.message 
    });
  }
});

router.post('/:id/submit-declaration', (req, res) => {
  try {
    const result = OrderService.submitDeclaration(req.params.id, req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '提交申报失败',
      error: error.message 
    });
  }
});

router.post('/:id/get-receipt', (req, res) => {
  try {
    const result = OrderService.getReceipt(req.params.id, req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取回执失败',
      error: error.message 
    });
  }
});

router.post('/:id/risk-check', (req, res) => {
  try {
    const result = OrderService.performRiskCheck(req.params.id, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '执行风险检查失败',
      error: error.message 
    });
  }
});

router.post('/:id/risk-action', (req, res) => {
  try {
    const { action, ...actionData } = req.body;
    
    if (!action) {
      return res.status(400).json({ 
        success: false, 
        message: '请指定操作类型' 
      });
    }
    
    const result = OrderService.riskCheckAction(req.params.id, action, actionData, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '执行风险操作失败',
      error: error.message 
    });
  }
});

router.post('/:id/supplement-submit', (req, res) => {
  try {
    const result = OrderService.supplementSubmit(req.params.id, req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '提交补充资料失败',
      error: error.message 
    });
  }
});

router.post('/:id/cancel', (req, res) => {
  try {
    const { cancelReason } = req.body;
    const result = OrderService.cancelOrder(req.params.id, cancelReason, req.user);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '撤销单据失败',
      error: error.message 
    });
  }
});

router.get('/:id/available-actions', (req, res) => {
  try {
    const order = OrderService.getOrderById(req.params.id, false);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '单据不存在' 
      });
    }
    
    const actions = OrderService.getAvailableActions(order.status, req.user.role);
    
    res.json({
      success: true,
      data: {
        status: order.status,
        statusDisplay: order.status_display,
        availableActions: actions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取可用操作失败',
      error: error.message 
    });
  }
});

module.exports = router;
