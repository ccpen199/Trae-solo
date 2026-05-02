import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prescriptionService, CreatePrescriptionRequest } from '../services/prescription-service';
import { UserPayload, requireRole } from '../middleware/auth';
import { auditEngine } from '../engines/audit-engine';

const router = Router();

router.get(
  '/pending',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as UserPayload;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await prescriptionService.getPendingPrescriptions(user.roleCode, { limit, offset });

      res.json({
        success: true,
        data: {
          prescriptions: result.prescriptions,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('Get pending prescriptions error:', error);
      res.status(500).json({
        success: false,
        error: '获取待处理处方列表失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/:prescriptionId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prescriptionId } = req.params;

      const prescription = await prescriptionService.getPrescriptionById(prescriptionId);

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error: any) {
      console.error('Get prescription error:', error);
      
      if (error.message === '处方不存在') {
        res.status(404).json({
          success: false,
          error: '处方不存在',
          code: 'PRESCRIPTION_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '获取处方详情失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/',
  requireRole('DOCTOR'),
  [
    body('visitId').notEmpty().withMessage('就诊ID不能为空'),
    body('type').isIn(['REGULAR', 'EMERGENCY', 'NARCOTIC', 'PSYCHIATRIC']).withMessage('处方类型无效'),
    body('items').isArray({ min: 1 }).withMessage('处方药品不能为空'),
    body('items.*.drugName').notEmpty().withMessage('药品名称不能为空'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('药品数量必须大于0'),
    body('items.*.dosage').notEmpty().withMessage('剂量不能为空'),
    body('items.*.frequency').notEmpty().withMessage('频次不能为空'),
    body('items.*.route').notEmpty().withMessage('给药途径不能为空'),
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
      const request: CreatePrescriptionRequest = req.body;

      const result = await prescriptionService.createPrescription(request, user, ipAddress);

      res.json({
        success: true,
        data: {
          prescription: result.prescription,
          validation: result.validation,
        },
      });
    } catch (error: any) {
      console.error('Create prescription error:', error);
      
      if (error.message === '就诊记录不存在') {
        res.status(404).json({
          success: false,
          error: '就诊记录不存在',
          code: 'VISIT_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '创建处方失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:prescriptionId/validate',
  requireRole('DOCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prescriptionId } = req.params;
      const user = req.user as UserPayload;

      const prescription = await prescriptionService.getPrescriptionById(prescriptionId);

      res.json({
        success: true,
        data: {
          prescription,
        },
      });
    } catch (error: any) {
      console.error('Validate prescription error:', error);
      res.status(500).json({
        success: false,
        error: '处方验证失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:prescriptionId/override',
  requireRole('DOCTOR'),
  [
    body('overrideReason').notEmpty().withMessage('忽略原因不能为空'),
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

      const { prescriptionId } = req.params;
      const { overrideReason } = req.body;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const prescription = await prescriptionService.overrideConflict(
        prescriptionId,
        overrideReason,
        user,
        ipAddress
      );

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error: any) {
      console.error('Override prescription conflict error:', error);
      
      if (error.message === '处方不存在') {
        res.status(404).json({
          success: false,
          error: '处方不存在',
          code: 'PRESCRIPTION_NOT_FOUND',
        });
        return;
      }

      if (error.message === '处方没有冲突需要忽略') {
        res.status(400).json({
          success: false,
          error: '处方没有冲突需要忽略',
          code: 'NO_CONFLICT',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '忽略处方冲突失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:prescriptionId/sign',
  requireRole('DOCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prescriptionId } = req.params;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const prescription = await prescriptionService.signPrescription(prescriptionId, user, ipAddress);

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error: any) {
      console.error('Sign prescription error:', error);
      
      if (error.message === '处方不存在') {
        res.status(404).json({
          success: false,
          error: '处方不存在',
          code: 'PRESCRIPTION_NOT_FOUND',
        });
        return;
      }

      if (error.message === '处方状态不允许签名') {
        res.status(400).json({
          success: false,
          error: '处方状态不允许签名',
          code: 'INVALID_STATUS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '处方签名失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:prescriptionId/dispense',
  requireRole('PHARMACIST'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prescriptionId } = req.params;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const prescription = await prescriptionService.dispensePrescription(prescriptionId, user, ipAddress);

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error: any) {
      console.error('Dispense prescription error:', error);
      
      if (error.message === '处方不存在') {
        res.status(404).json({
          success: false,
          error: '处方不存在',
          code: 'PRESCRIPTION_NOT_FOUND',
        });
        return;
      }

      if (error.message === '处方状态不允许发药') {
        res.status(400).json({
          success: false,
          error: '处方状态不允许发药',
          code: 'INVALID_STATUS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '处方发药失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/visit/:visitId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { visitId } = req.params;

      const prescriptions = await prescriptionService.getVisitPrescriptions(visitId);

      res.json({
        success: true,
        data: prescriptions,
      });
    } catch (error: any) {
      console.error('Get visit prescriptions error:', error);
      res.status(500).json({
        success: false,
        error: '获取就诊处方列表失败',
        message: error.message,
      });
    }
  }
);

export default router;
