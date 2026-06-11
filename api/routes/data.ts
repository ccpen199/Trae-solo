import { Router, type Request, type Response } from 'express';
import { dataAggregationService } from '../services/DataAggregationService.js';
import { dashboardService } from '../services/DashboardService.js';
import { openApiService } from '../services/OpenApiService.js';
import type {
  ApiResponse,
  ScenicSpotFlow,
  OTABookingData,
  IntangibleHeritage,
  CouponConsumption,
  Dashboard,
  DashboardWidget,
  OpenApi,
  ApiApplication,
} from '../../shared/types/index.js';

const router = Router();

const successResponse = <T>(data: T, message = 'success'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
  timestamp: Date.now(),
});

const errorResponse = (message: string, code = 400): ApiResponse<null> => ({
  code,
  message,
  data: null,
  timestamp: Date.now(),
});

// ==================== 景区客流数据 ====================

router.get('/scenic-flows', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startTime, endTime, region, scenicSpotId, page, pageSize } = req.query;
    const result = await dataAggregationService.getScenicFlows({
      startTime: startTime as string,
      endTime: endTime as string,
      region: region as string,
      scenicSpotId: scenicSpotId as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/scenic-flows/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startTime, endTime, region, scenicSpotId } = req.query;
    const result = await dataAggregationService.getFlowTrend({
      startTime: startTime as string,
      endTime: endTime as string,
      region: region as string,
      scenicSpotId: scenicSpotId as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/scenic-flows/regional', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startTime, endTime, region } = req.query;
    const result = await dataAggregationService.getRegionalFlowStats({
      startTime: startTime as string,
      endTime: endTime as string,
      region: region as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/scenic-flows', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<ScenicSpotFlow, 'id' | 'timestamp'>;
    const result = await dataAggregationService.createScenicFlow(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== OTA预订数据 ====================

router.get('/ota-bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, startDate, endDate, scenicSpotId, page, pageSize } = req.query;
    const result = await dataAggregationService.getOTABookings({
      platform: platform as string,
      startDate: startDate as string,
      endDate: endDate as string,
      scenicSpotId: scenicSpotId as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/ota-bookings/aggregation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, startDate, endDate, scenicSpotId, groupBy } = req.query;
    const result = await dataAggregationService.getOTAAggregation({
      platform: platform as string,
      startDate: startDate as string,
      endDate: endDate as string,
      scenicSpotId: scenicSpotId as string,
      groupBy: groupBy as 'platform' | 'date' | 'scenicSpot',
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/ota-bookings/platform-distribution', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, scenicSpotId } = req.query;
    const result = await dataAggregationService.getPlatformDistribution({
      startDate: startDate as string,
      endDate: endDate as string,
      scenicSpotId: scenicSpotId as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/ota-bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<OTABookingData, 'id'>;
    const result = await dataAggregationService.createOTABooking(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== 非遗名录 ====================

router.get('/heritages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, category, region, page, pageSize } = req.query;
    const result = await dataAggregationService.getHeritages({
      level: level as 'national' | 'provincial' | 'municipal',
      category: category as string,
      region: region as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/heritages/stats/by-level', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, region } = req.query;
    const result = await dataAggregationService.getHeritageLevelStats({
      category: category as string,
      region: region as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/heritages/stats/by-category', async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, region } = req.query;
    const result = await dataAggregationService.getHeritageCategoryStats({
      level: level as 'national' | 'provincial' | 'municipal',
      region: region as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/heritages', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<IntangibleHeritage, 'id'>;
    const result = await dataAggregationService.createHeritage(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== 消费券核销 ====================

router.get('/coupon-consumptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, region, couponBatchId, page, pageSize } = req.query;
    const result = await dataAggregationService.getCouponConsumptions({
      startDate: startDate as string,
      endDate: endDate as string,
      region: region as string,
      couponBatchId: couponBatchId as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/coupon-consumptions/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, region, couponBatchId } = req.query;
    const result = await dataAggregationService.getCouponStatistics({
      startDate: startDate as string,
      endDate: endDate as string,
      region: region as string,
      couponBatchId: couponBatchId as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/coupon-consumptions/writeoff-trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, region, couponBatchId } = req.query;
    const result = await dataAggregationService.getWriteOffTrend({
      startDate: startDate as string,
      endDate: endDate as string,
      region: region as string,
      couponBatchId: couponBatchId as string,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/coupon-consumptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<CouponConsumption, 'id'>;
    const result = await dataAggregationService.createCouponConsumption(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== 概览统计 ====================

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await dataAggregationService.getOverviewStats();
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== 看板管理 ====================

router.get('/dashboards', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, isPublic, role, page, pageSize } = req.query;
    const result = await dashboardService.getDashboards({
      ownerId: ownerId as string,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      role: role as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/dashboards/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.query;
    const result = await dashboardService.getDashboardById(
      id,
      userId as string,
      role as string
    );
    if (!result) {
      res.status(404).json(errorResponse('看板不存在或无权限访问', 404));
      return;
    }
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/dashboards/:id/data', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dashboardService.getDashboardData(id);
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/dashboards', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as {
      name: string;
      description: string;
      layout: DashboardWidget[];
      ownerId: string;
      isPublic?: boolean;
      sharedRoles?: string[];
    };
    const result = await dashboardService.createDashboard(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.put('/dashboards/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as Partial<{
      name: string;
      description: string;
      layout: DashboardWidget[];
      isPublic: boolean;
      sharedRoles: string[];
    }>;
    const result = await dashboardService.updateDashboard(id, data);
    if (!result) {
      res.status(404).json(errorResponse('看板不存在', 404));
      return;
    }
    res.json(successResponse(result, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.delete('/dashboards/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dashboardService.deleteDashboard(id);
    if (!result) {
      res.status(404).json(errorResponse('看板不存在', 404));
      return;
    }
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/dashboards/:id/widgets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const widget = req.body as DashboardWidget;
    const result = await dashboardService.addWidget(id, widget);
    if (!result) {
      res.status(404).json(errorResponse('看板不存在', 404));
      return;
    }
    res.json(successResponse(result, '组件添加成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.put('/dashboards/:id/widgets/:widgetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, widgetId } = req.params;
    const widget = req.body as Partial<DashboardWidget>;
    const result = await dashboardService.updateWidget(id, widgetId, widget);
    if (!result) {
      res.status(404).json(errorResponse('看板或组件不存在', 404));
      return;
    }
    res.json(successResponse(result, '组件更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.delete('/dashboards/:id/widgets/:widgetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, widgetId } = req.params;
    const result = await dashboardService.removeWidget(id, widgetId);
    if (!result) {
      res.status(404).json(errorResponse('看板或组件不存在', 404));
      return;
    }
    res.json(successResponse(result, '组件删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== API开放平台 - 接口目录 ====================

router.get('/openapi/apis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isPublic, method, page, pageSize } = req.query;
    const result = await openApiService.getApiList({
      category: category as string,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/openapi/apis/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await openApiService.getApiCategories();
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/openapi/apis/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await openApiService.getApiById(id);
    if (!result) {
      res.status(404).json(errorResponse('API不存在', 404));
      return;
    }
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/openapi/apis', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<OpenApi, 'id'>;
    const result = await openApiService.createApi(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message, 400));
  }
});

router.put('/openapi/apis/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as Partial<OpenApi>;
    const result = await openApiService.updateApi(id, data);
    if (!result) {
      res.status(404).json(errorResponse('API不存在', 404));
      return;
    }
    res.json(successResponse(result, '更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message, 400));
  }
});

router.delete('/openapi/apis/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await openApiService.deleteApi(id);
    if (!result) {
      res.status(404).json(errorResponse('API不存在', 404));
      return;
    }
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

// ==================== API开放平台 - 应用管理 ====================

router.get('/openapi/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, page, pageSize } = req.query;
    const result = await openApiService.getApplicationList(
      ownerId as string,
      page ? parseInt(page as string) : undefined,
      pageSize ? parseInt(pageSize as string) : undefined
    );
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/openapi/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.getApplicationById(id, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限访问', 404));
      return;
    }
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.get('/openapi/applications/:id/subscribed-apis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.getSubscribedApis(id, ownerId as string);
    res.json(successResponse(result));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/openapi/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as {
      name: string;
      description: string;
      ownerId: string;
    };
    const result = await openApiService.createApplication(data);
    res.status(201).json(successResponse(result, '创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.put('/openapi/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    const data = req.body as Partial<{
      name: string;
      description: string;
      status: 'active' | 'suspended';
      subscribedApis: string[];
    }>;
    const result = await openApiService.updateApplication(id, data, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限', 404));
      return;
    }
    res.json(successResponse(result, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.delete('/openapi/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.deleteApplication(id, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限', 404));
      return;
    }
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/openapi/applications/:id/subscribe/:apiId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, apiId } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.subscribeApi(id, apiId, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限', 404));
      return;
    }
    res.json(successResponse(result, '订阅成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message, 400));
  }
});

router.delete('/openapi/applications/:id/subscribe/:apiId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, apiId } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.unsubscribeApi(id, apiId, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限', 404));
      return;
    }
    res.json(successResponse(result, '取消订阅成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

router.post('/openapi/applications/:id/regenerate-secret', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;
    const result = await openApiService.regenerateAppSecret(id, ownerId as string);
    if (!result) {
      res.status(404).json(errorResponse('应用不存在或无权限', 404));
      return;
    }
    res.json(successResponse(result, '密钥重置成功'));
  } catch (error) {
    res.status(500).json(errorResponse((error as Error).message, 500));
  }
});

export default router;
