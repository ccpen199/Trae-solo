import { Router, type Request, type Response } from 'express';
import { mockApplications, mockServices, type ApiResponse, type Application, type ApplicationLog } from '../data/mockData.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

let applicationsData = [...mockApplications];
let applicationLogs: ApplicationLog[] = [];

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const applicantId = req.user?.id || '1';

    let apps = applicationsData.filter(a => a.applicantId === applicantId);

    if (status) {
      apps = apps.filter(a => a.status === status);
    }

    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageNum = Number(page);
    const size = Number(pageSize);
    const total = apps.length;
    const startIndex = (pageNum - 1) * size;
    const paginatedApps = apps.slice(startIndex, startIndex + size);

    res.status(200).json({
      success: true,
      data: {
        list: paginatedApps,
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
      message: '获取办件列表成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取办件列表失败',
    } as ApiResponse);
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceId, formData, materials } = req.body;
    const applicantId = req.user?.id || '1';

    const service = mockServices.find(s => s.id === serviceId);

    if (!service) {
      res.status(404).json({
        success: false,
        message: '事项不存在',
      } as ApiResponse);
      return;
    }

    const newApplication: Application = {
      id: `app_${Date.now()}`,
      serviceId,
      serviceName: service.name,
      applicantId,
      status: 'submitted',
      formData: formData || {},
      materials: materials || [],
      currentStep: 1,
      totalSteps: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedTime: service.handlingTime,
    };

    applicationsData.unshift(newApplication);

    applicationLogs.push({
      id: `log_${Date.now()}`,
      applicationId: newApplication.id,
      action: 'submit',
      remark: '提交申请',
      operatorId: applicantId,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: newApplication,
      message: '提交申请成功',
    } as ApiResponse<Application>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交申请失败',
    } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = applicationsData.find(a => a.id === id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: '办件不存在',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: application,
      message: '获取办件详情成功',
    } as ApiResponse<Application>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取办件详情失败',
    } as ApiResponse);
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const applicantId = req.user?.id || '1';

    const index = applicationsData.findIndex(a => a.id === id);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '办件不存在',
      } as ApiResponse);
      return;
    }

    if (applicationsData[index].applicantId !== applicantId) {
      res.status(403).json({
        success: false,
        message: '无权修改此办件',
      } as ApiResponse);
      return;
    }

    applicationsData[index] = {
      ...applicationsData[index],
      ...updateData,
      updatedAt: new Date(),
    };

    applicationLogs.push({
      id: `log_${Date.now()}`,
      applicationId: id,
      action: 'update',
      remark: '更新申请信息',
      operatorId: applicantId,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      data: applicationsData[index],
      message: '更新办件成功',
    } as ApiResponse<Application>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新办件失败',
    } as ApiResponse);
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const applicantId = req.user?.id || '1';

    const index = applicationsData.findIndex(a => a.id === id);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '办件不存在',
      } as ApiResponse);
      return;
    }

    if (applicationsData[index].applicantId !== applicantId) {
      res.status(403).json({
        success: false,
        message: '无权删除此办件',
      } as ApiResponse);
      return;
    }

    applicationsData.splice(index, 1);

    res.status(200).json({
      success: true,
      message: '删除办件成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除办件失败',
    } as ApiResponse);
  }
});

router.post('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const applicantId = req.user?.id || '1';

    const application = applicationsData.find(a => a.id === id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: '办件不存在',
      } as ApiResponse);
      return;
    }

    if (application.applicantId !== applicantId) {
      res.status(403).json({
        success: false,
        message: '无权撤销此办件',
      } as ApiResponse);
      return;
    }

    if (application.status !== 'submitted' && application.status !== 'reviewing') {
      res.status(400).json({
        success: false,
        message: '此状态下的办件无法撤销',
      } as ApiResponse);
      return;
    }

    application.status = 'rejected';
    application.updatedAt = new Date();

    applicationLogs.push({
      id: `log_${Date.now()}`,
      applicationId: id,
      action: 'cancel',
      remark: '用户撤销申请',
      operatorId: applicantId,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      data: application,
      message: '撤销办件成功',
    } as ApiResponse<Application>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '撤销办件失败',
    } as ApiResponse);
  }
});

router.get('/:id/logs', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const logs = applicationLogs.filter(l => l.applicationId === id);

    res.status(200).json({
      success: true,
      data: logs,
      message: '获取办件日志成功',
    } as ApiResponse<ApplicationLog[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取办件日志失败',
    } as ApiResponse);
  }
});

router.post('/:id/materials', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { materials } = req.body;
    const applicantId = req.user?.id || '1';

    const application = applicationsData.find(a => a.id === id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: '办件不存在',
      } as ApiResponse);
      return;
    }

    if (application.applicantId !== applicantId) {
      res.status(403).json({
        success: false,
        message: '无权修改此办件材料',
      } as ApiResponse);
      return;
    }

    application.materials = [...application.materials, ...materials];
    application.updatedAt = new Date();

    applicationLogs.push({
      id: `log_${Date.now()}`,
      applicationId: id,
      action: 'upload_material',
      remark: '补充申请材料',
      operatorId: applicantId,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      data: application,
      message: '补充材料成功',
    } as ApiResponse<Application>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '补充材料失败',
    } as ApiResponse);
  }
});

export default router;
