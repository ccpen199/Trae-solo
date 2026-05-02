import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authenticate, UserPayload, requireRole } from '../middleware/auth';
import { visitService } from '../services/visit-service';
import { patientService } from '../services/patient-service';

const router = Router();

router.use(authenticate);

router.get(
  '/pending',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as UserPayload;
      const limit = req.query.limit as number | undefined;
      const offset = req.query.offset as number | undefined;

      const result = await visitService.getPendingVisits(
        user.roleCode === 'DOCTOR' ? user.id : undefined,
        user.roleCode === 'DOCTOR' ? user.departmentId : undefined,
        { limit, offset }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get pending visits error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '获取待诊列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的就诊ID')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const visitId = req.params.id;
      const visit = await visitService.getVisitById(visitId);

      res.json({
        success: true,
        data: visit,
      });
    } catch (error: any) {
      console.error('Get visit error:', error);
      res.status(404).json({
        success: false,
        error: error.message || '就诊记录不存在',
      });
    }
  }
);

router.post(
  '/',
  requireRole('DOCTOR', 'ADMIN'),
  [
    body('patientId').isUUID().withMessage('无效的患者ID'),
    body('departmentId').isUUID().withMessage('无效的科室ID'),
    body('doctorId').optional().isUUID().withMessage('无效的医生ID'),
    body('visitType')
      .isIn(['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOWUP'])
      .withMessage('无效的就诊类型'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const visit = await visitService.createVisit(
        {
          patientId: req.body.patientId,
          departmentId: req.body.departmentId,
          doctorId: req.body.doctorId || user.id,
          visitType: req.body.visitType,
          roomNumber: req.body.roomNumber,
          bedNumber: req.body.bedNumber,
        },
        user,
        ipAddress
      );

      res.status(201).json({
        success: true,
        data: visit,
        message: '就诊记录创建成功',
      });
    } catch (error: any) {
      console.error('Create visit error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '创建就诊记录失败',
      });
    }
  }
);

router.put(
  '/:id',
  requireRole('DOCTOR', 'ADMIN'),
  [param('id').isUUID().withMessage('无效的就诊ID')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const visitId = req.params.id;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const visit = await visitService.updateVisit(
        visitId,
        {
          chiefComplaint: req.body.chiefComplaint,
          presentIllness: req.body.presentIllness,
          pastHistory: req.body.pastHistory,
          physicalExam: req.body.physicalExam,
          diagnosis: req.body.diagnosis,
          treatmentPlan: req.body.treatmentPlan,
        },
        user,
        ipAddress
      );

      res.json({
        success: true,
        data: visit,
        message: '就诊记录更新成功',
      });
    } catch (error: any) {
      console.error('Update visit error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '更新就诊记录失败',
      });
    }
  }
);

router.post(
  '/:id/status',
  requireRole('DOCTOR', 'NURSE', 'ADMIN'),
  [
    param('id').isUUID().withMessage('无效的就诊ID'),
    body('statusCode').notEmpty().withMessage('状态码不能为空'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const visitId = req.params.id;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const visit = await visitService.changeStatus(
        visitId,
        req.body.statusCode,
        user,
        ipAddress,
        req.body.reason
      );

      res.json({
        success: true,
        data: visit,
        message: '状态更新成功',
      });
    } catch (error: any) {
      console.error('Change visit status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '更新状态失败',
      });
    }
  }
);

router.get(
  '/patient/:patientId/history',
  [
    param('patientId').isUUID().withMessage('无效的患者ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const limit = req.query.limit as number | undefined;
      const offset = req.query.offset as number | undefined;

      const result = await visitService.getPatientVisitHistory(patientId, { limit, offset });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get patient visit history error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '获取患者就诊历史失败',
      });
    }
  }
);

router.get(
  '/patient/:patientId/summary',
  [param('patientId').isUUID().withMessage('无效的患者ID')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const summary = await patientService.getPatientMedicalSummary(patientId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get patient summary error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '获取患者摘要失败',
      });
    }
  }
);

router.get(
  '/',
  [
    query('patientName').optional(),
    query('patientId').optional().isUUID(),
    query('visitNumber').optional(),
    query('doctorId').optional().isUUID(),
    query('departmentId').optional().isUUID(),
    query('statusCode').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await visitService.searchVisits(
        {
          patientName: req.query.patientName as string | undefined,
          patientId: req.query.patientId as string | undefined,
          visitNumber: req.query.visitNumber as string | undefined,
          doctorId: req.query.doctorId as string | undefined,
          departmentId: req.query.departmentId as string | undefined,
          statusCode: req.query.statusCode as string | undefined,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        },
        {
          limit: req.query.limit as number | undefined,
          offset: req.query.offset as number | undefined,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Search visits error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '搜索就诊记录失败',
      });
    }
  }
);

export default router;
