import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authenticate, UserPayload, requireRole } from '../middleware/auth';
import { patientService } from '../services/patient-service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('name').optional(),
    query('patientNumber').optional(),
    query('idCardNumber').optional(),
    query('phone').optional(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await patientService.searchPatients(
        {
          name: req.query.name as string | undefined,
          patientNumber: req.query.patientNumber as string | undefined,
          idCardNumber: req.query.idCardNumber as string | undefined,
          phone: req.query.phone as string | undefined,
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
      console.error('Search patients error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '搜索患者失败',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的患者ID')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.id;
      const patient = await patientService.getPatientById(patientId);

      res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      console.error('Get patient error:', error);
      res.status(404).json({
        success: false,
        error: error.message || '患者不存在',
      });
    }
  }
);

router.get(
  '/number/:patientNumber',
  [param('patientNumber').notEmpty().withMessage('患者编号不能为空')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientNumber = req.params.patientNumber;
      const patient = await patientService.getPatientByNumber(patientNumber);

      res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      console.error('Get patient by number error:', error);
      res.status(404).json({
        success: false,
        error: error.message || '患者不存在',
      });
    }
  }
);

router.post(
  '/',
  requireRole('DOCTOR', 'NURSE', 'ADMIN'),
  [
    body('name').notEmpty().withMessage('姓名不能为空'),
    body('gender')
      .isIn(['MALE', 'FEMALE', 'UNKNOWN'])
      .withMessage('无效的性别'),
    body('birthDate').optional().isISO8601().withMessage('无效的出生日期格式'),
    body('phone').optional(),
    body('idCardNumber').optional(),
    body('bloodType')
      .optional()
      .isIn(['A', 'B', 'AB', 'O', 'UNKNOWN'])
      .withMessage('无效的血型'),
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

      const patient = await patientService.createPatient(
        {
          name: req.body.name,
          gender: req.body.gender,
          birthDate: req.body.birthDate,
          phone: req.body.phone,
          idCardNumber: req.body.idCardNumber,
          emergencyContact: req.body.emergencyContact,
          emergencyPhone: req.body.emergencyPhone,
          address: req.body.address,
          allergies: req.body.allergies,
          pastMedicalHistory: req.body.pastMedicalHistory,
          familyHistory: req.body.familyHistory,
          bloodType: req.body.bloodType,
        },
        user,
        ipAddress
      );

      res.status(201).json({
        success: true,
        data: patient,
        message: '患者档案创建成功',
      });
    } catch (error: any) {
      console.error('Create patient error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '创建患者档案失败',
      });
    }
  }
);

router.put(
  '/:id',
  requireRole('DOCTOR', 'NURSE', 'ADMIN'),
  [
    param('id').isUUID().withMessage('无效的患者ID'),
    body('name').optional(),
    body('gender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'UNKNOWN'])
      .withMessage('无效的性别'),
    body('birthDate').optional().isISO8601().withMessage('无效的出生日期格式'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.id;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const patient = await patientService.updatePatient(
        patientId,
        {
          name: req.body.name,
          gender: req.body.gender,
          birthDate: req.body.birthDate,
          phone: req.body.phone,
          idCardNumber: req.body.idCardNumber,
          emergencyContact: req.body.emergencyContact,
          emergencyPhone: req.body.emergencyPhone,
          address: req.body.address,
          allergies: req.body.allergies,
          pastMedicalHistory: req.body.pastMedicalHistory,
          familyHistory: req.body.familyHistory,
          bloodType: req.body.bloodType,
        },
        user,
        ipAddress
      );

      res.json({
        success: true,
        data: patient,
        message: '患者档案更新成功',
      });
    } catch (error: any) {
      console.error('Update patient error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '更新患者档案失败',
      });
    }
  }
);

router.get(
  '/:id/visits',
  [
    param('id').isUUID().withMessage('无效的患者ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.id;
      const limit = req.query.limit as number | undefined;
      const offset = req.query.offset as number | undefined;

      const result = await patientService.getPatientVisitHistory(patientId, { limit, offset });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get patient visits error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '获取患者就诊历史失败',
      });
    }
  }
);

router.get(
  '/:id/summary',
  [param('id').isUUID().withMessage('无效的患者ID')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.id;
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

export default router;
