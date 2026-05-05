import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { enterpriseService } from '../services/enterpriseService';
import { logisticsService } from '../services/logisticsService';
import { logService } from '../services/logService';
import { OperationType } from '../entities/OperationLog';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users/pending', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;

    const result = await enterpriseService.getPendingEnterprises({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      keyword: keyword as string,
    });

    res.json({
      success: true,
      data: {
        users: result.users,
        total: result.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      }
    });
  } catch (error: any) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: '获取未审核用户列表失败',
      error: error.message
    });
  }
});

router.get('/users/approved', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;

    const result = await enterpriseService.getApprovedEnterprises({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      keyword: keyword as string,
    });

    res.json({
      success: true,
      data: {
        users: result.users,
        total: result.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      }
    });
  } catch (error: any) {
    console.error('Get approved users error:', error);
    res.status(500).json({
      success: false,
      message: '获取已审核用户列表失败',
      error: error.message
    });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await enterpriseService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

router.post('/users/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await enterpriseService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await enterpriseService.approveUser(id);

    await logService.createLog({
      operationType: 'approve_enterprise',
      operationDesc: `管理员 ${req.user?.username} 审核通过用户 ${user.username}`,
      user: req.user,
      request: req,
    });

    res.json({
      success: true,
      message: '审核通过'
    });
  } catch (error: any) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: '审核失败',
      error: error.message
    });
  }
});

router.post('/users/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await enterpriseService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await enterpriseService.rejectUser(id, reason || '未提供拒绝原因');

    await logService.createLog({
      operationType: 'reject_enterprise',
      operationDesc: `管理员 ${req.user?.username} 拒绝用户 ${user.username}，原因：${reason}`,
      user: req.user,
      request: req,
    });

    res.json({
      success: true,
      message: '已拒绝'
    });
  } catch (error: any) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: '拒绝失败',
      error: error.message
    });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await enterpriseService.getUserById(id);

    await enterpriseService.deleteUser(id);

    if (user) {
      await logService.createLog({
        operationType: 'delete_enterprise',
        operationDesc: `管理员 ${req.user?.username} 删除用户 ${user.username}`,
        user: req.user,
        request: req,
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
});

router.get('/logistics', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      logisticsNo,
      productionEnterpriseCode,
      initiatorEnterpriseCode,
      receiverEnterpriseCode,
      startDate,
      endDate,
      isUnmatched,
    } = req.query;

    const result = await logisticsService.getOrdersForAdmin({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      logisticsNo: logisticsNo as string,
      productionEnterpriseCode: productionEnterpriseCode as string,
      initiatorEnterpriseCode: initiatorEnterpriseCode as string,
      receiverEnterpriseCode: receiverEnterpriseCode as string,
      startDate: startDate as string,
      endDate: endDate as string,
      isUnmatched: isUnmatched ? isUnmatched === 'true' : undefined,
    });

    res.json({
      success: true,
      data: {
        orders: result.orders,
        total: result.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      }
    });
  } catch (error: any) {
    console.error('Get logistics error:', error);
    res.status(500).json({
      success: false,
      message: '获取物流单列表失败',
      error: error.message
    });
  }
});

router.get('/logistics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await logisticsService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '物流单不存在'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Get logistics error:', error);
    res.status(500).json({
      success: false,
      message: '获取物流单详情失败',
      error: error.message
    });
  }
});

router.post('/logistics/export', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    let orders;
    if (ids && ids.length > 0) {
      orders = await logisticsService.getOrdersByIds(ids);
    } else {
      const result = await logisticsService.getOrdersForAdmin({
        page: 1,
        pageSize: 10000,
      });
      orders = result.orders;
    }

    const buffer = await logisticsService.exportToExcel(orders);

    if (req.user) {
      await logService.createLog({
        operationType: 'download_logistics',
        operationDesc: `管理员 ${req.user.username} 导出物流单 ${orders.length} 条`,
        user: req.user,
        request: req,
        requestParams: JSON.stringify({ count: orders.length }),
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=物流单_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Export logistics error:', error);
    res.status(500).json({
      success: false,
      message: '导出物流单失败',
      error: error.message
    });
  }
});

router.get('/logs', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      operationType,
      username,
      enterpriseCode,
      startDate,
      endDate,
    } = req.query;

    const result = await logService.getLogs({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      operationType: operationType as OperationType,
      username: username as string,
      enterpriseCode: enterpriseCode as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      }
    });
  } catch (error: any) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: '获取日志列表失败',
      error: error.message
    });
  }
});

router.delete('/logs', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的日志ID'
      });
    }

    await logService.deleteLogs(ids);

    if (req.user) {
      await logService.createLog({
        operationType: 'delete_log',
        operationDesc: `管理员 ${req.user.username} 批量删除日志 ${ids.length} 条`,
        user: req.user,
        request: req,
        requestParams: JSON.stringify({ count: ids.length }),
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('Delete logs error:', error);
    res.status(500).json({
      success: false,
      message: '删除日志失败',
      error: error.message
    });
  }
});

export default router;
