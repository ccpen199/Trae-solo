import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, enterpriseMiddleware } from '../middleware/auth';
import { logisticsService, LogisticsCategory } from '../services/logisticsService';
import { logService } from '../services/logService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, enterpriseMiddleware);

router.post('/create', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const params = req.body;

    if (!params.logisticsNo || !params.goodsName) {
      return res.status(400).json({
        success: false,
        message: '物流单号和货物名称不能为空'
      });
    }

    const order = await logisticsService.createOrder(params, req.user);

    await logService.createLog({
      operationType: 'create_logistics',
      operationDesc: `用户 ${req.user.username} 新增物流单 ${params.logisticsNo}`,
      user: req.user,
      request: req,
    });

    res.json({
      success: true,
      message: '创建成功',
      data: order
    });
  } catch (error: any) {
    console.error('Create logistics error:', error);
    res.status(500).json({
      success: false,
      message: '创建物流单失败',
      error: error.message
    });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }

    const result = await logisticsService.importFromExcel(req.file, req.user);

    await logService.createLog({
      operationType: 'upload_logistics',
      operationDesc: `用户 ${req.user.username} 上传物流单，成功 ${result.success} 条，失败 ${result.failed} 条`,
      user: req.user,
      request: req,
      requestParams: JSON.stringify({ success: result.success, failed: result.failed }),
    });

    res.json({
      success: true,
      message: '上传完成',
      data: result
    });
  } catch (error: any) {
    console.error('Upload logistics error:', error);
    res.status(500).json({
      success: false,
      message: '上传物流单失败',
      error: error.message
    });
  }
});

router.get('/list/:category', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { category } = req.params;
    const validCategories: LogisticsCategory[] = ['production', 'initiator', 'transfer', 'receiver', 'unmatched'];

    if (!validCategories.includes(category as LogisticsCategory)) {
      return res.status(400).json({
        success: false,
        message: '无效的分类'
      });
    }

    const { page = 1, pageSize = 20, logisticsNo, startDate, endDate } = req.query;

    const result = await logisticsService.getOrdersForEnterprise(
      req.user,
      category as LogisticsCategory,
      {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        logisticsNo: logisticsNo as string,
        startDate: startDate as string,
        endDate: endDate as string,
      }
    );

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
    console.error('Get logistics list error:', error);
    res.status(500).json({
      success: false,
      message: '获取物流单列表失败',
      error: error.message
    });
  }
});

router.get('/detail/:id', async (req: Request, res: Response) => {
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
    console.error('Get logistics detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取物流单详情失败',
      error: error.message
    });
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要导出的物流单ID'
      });
    }

    const orders = await logisticsService.getOrdersByIds(ids);

    const buffer = await logisticsService.exportToExcel(orders);

    await logService.createLog({
      operationType: 'download_logistics',
      operationDesc: `用户 ${req.user.username} 导出物流单 ${orders.length} 条`,
      user: req.user,
      request: req,
      requestParams: JSON.stringify({ count: orders.length }),
    });

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

export default router;
