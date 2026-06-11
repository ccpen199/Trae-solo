import { Router, type Request, type Response } from 'express';
import { investmentService } from '../services/InvestmentService';
import { festivalService } from '../services/FestivalService';
import { guideCertService } from '../services/GuideCertService';
import type { 
  InvestmentProject, 
  FestivalActivity, 
  GuideCertification,
  ApiResponse,
  PageResponse
} from '../../shared/types';

const router = Router();

const successResponse = <T>(data: T, message: string = 'success'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
  timestamp: Date.now(),
});

const errorResponse = (message: string, code: number = 400): ApiResponse<null> => ({
  code,
  message,
  data: null,
  timestamp: Date.now(),
});

router.get('/investment/projects', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, status, region, type, keyword } = req.query;
    
    const result: PageResponse<InvestmentProject> = await investmentService.getProjectList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as InvestmentProject['status'],
      region: region as string,
      type: type as string,
      keyword: keyword as string,
    });
    
    res.json(successResponse(result));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/investment/projects/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await investmentService.getProjectById(id);
    
    if (!project) {
      res.status(404).json(errorResponse('项目不存在', 404));
      return;
    }
    
    res.json(successResponse(project));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/investment/projects', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, region, totalInvestment, description, contactPerson, contactPhone, createdBy } = req.body;
    
    if (!name || !type || !region || !totalInvestment || !description || !contactPerson || !contactPhone || !createdBy) {
      res.status(400).json(errorResponse('缺少必填字段'));
      return;
    }
    
    const project = await investmentService.createProject({
      name,
      type,
      region,
      totalInvestment,
      description,
      contactPerson,
      contactPhone,
      createdBy,
    });
    
    res.status(201).json(successResponse(project, '项目创建成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.put('/investment/projects/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await investmentService.updateProject(id, req.body);
    
    if (!project) {
      res.status(404).json(errorResponse('项目不存在', 404));
      return;
    }
    
    res.json(successResponse(project, '项目更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.patch('/investment/projects/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      res.status(400).json(errorResponse('缺少状态参数'));
      return;
    }
    
    const project = await investmentService.updateProjectStatus(id, status);
    
    if (!project) {
      res.status(404).json(errorResponse('项目不存在', 404));
      return;
    }
    
    res.json(successResponse(project, '状态更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.delete('/investment/projects/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await investmentService.deleteProject(id);
    
    if (!success) {
      res.status(404).json(errorResponse('项目不存在', 404));
      return;
    }
    
    res.json(successResponse(null, '项目删除成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/investment/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await investmentService.getProjectStats();
    res.json(successResponse(stats));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/festival/activities', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, status, region, startDate, endDate, keyword } = req.query;
    
    const result: PageResponse<FestivalActivity> = await festivalService.getActivityList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as FestivalActivity['status'],
      region: region as string,
      startDate: startDate as string,
      endDate: endDate as string,
      keyword: keyword as string,
    });
    
    res.json(successResponse(result));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/festival/activities/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await festivalService.getActivityById(id);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/festival/activities', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, organizer, region, startDate, endDate, venue, expectedScale, description, createdBy } = req.body;
    
    if (!name || !organizer || !region || !startDate || !endDate || !venue || !expectedScale || !description || !createdBy) {
      res.status(400).json(errorResponse('缺少必填字段'));
      return;
    }
    
    const activity = await festivalService.createActivity({
      name,
      organizer,
      region,
      startDate,
      endDate,
      venue,
      expectedScale,
      description,
      createdBy,
    });
    
    res.status(201).json(successResponse(activity, '活动创建成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/festival/activities/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await festivalService.submitActivity(id);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity, '活动提交申报成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.put('/festival/activities/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await festivalService.updateActivity(id, req.body);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity, '活动更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.patch('/festival/activities/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      res.status(400).json(errorResponse('缺少状态参数'));
      return;
    }
    
    const activity = await festivalService.updateActivityStatus(id, status);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity, '状态更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/festival/activities/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await festivalService.approveActivity(id);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity, '活动审批通过'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/festival/activities/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activity = await festivalService.rejectActivity(id);
    
    if (!activity) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(activity, '活动已驳回'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.delete('/festival/activities/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await festivalService.deleteActivity(id);
    
    if (!success) {
      res.status(404).json(errorResponse('活动不存在', 404));
      return;
    }
    
    res.json(successResponse(null, '活动删除成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/festival/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await festivalService.getActivityStats();
    res.json(successResponse(stats));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/guide/certifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, status, userId, qualificationLevel, keyword } = req.query;
    
    const result: PageResponse<GuideCertification> = await guideCertService.getCertificationList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as GuideCertification['status'],
      userId: userId as string,
      qualificationLevel: qualificationLevel as GuideCertification['qualificationLevel'],
      keyword: keyword as string,
    });
    
    res.json(successResponse(result));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/guide/certifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const certification = await guideCertService.getCertificationById(id);
    
    if (!certification) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(certification));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/guide/certifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, realName, idCard, qualificationNo, qualificationLevel, certificateImage } = req.body;
    
    if (!userId || !realName || !idCard || !qualificationNo || !qualificationLevel || !certificateImage) {
      res.status(400).json(errorResponse('缺少必填字段'));
      return;
    }
    
    const certification = await guideCertService.submitCertification({
      userId,
      realName,
      idCard,
      qualificationNo,
      qualificationLevel,
      certificateImage,
    });
    
    res.status(201).json(successResponse(certification, '认证提交成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.put('/guide/certifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const certification = await guideCertService.updateCertification(id, req.body);
    
    if (!certification) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(certification, '认证更新成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/guide/certifications/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { validUntil } = req.body;
    
    if (!validUntil) {
      res.status(400).json(errorResponse('缺少有效期参数'));
      return;
    }
    
    const certification = await guideCertService.approveCertification(id, validUntil);
    
    if (!certification) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(certification, '认证通过'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/guide/certifications/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const certification = await guideCertService.rejectCertification(id);
    
    if (!certification) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(certification, '认证已驳回'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.post('/guide/certifications/:id/expire', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const certification = await guideCertService.expireCertification(id);
    
    if (!certification) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(certification, '认证已过期'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.delete('/guide/certifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await guideCertService.deleteCertification(id);
    
    if (!success) {
      res.status(404).json(errorResponse('认证不存在', 404));
      return;
    }
    
    res.json(successResponse(null, '认证删除成功'));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/guide/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await guideCertService.getCertificationStats();
    res.json(successResponse(stats));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/guide/expiry-alert', async (req: Request, res: Response): Promise<void> => {
  try {
    const expiringCerts = await guideCertService.checkCertificationExpiry();
    res.json(successResponse(expiringCerts));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

export default router;
