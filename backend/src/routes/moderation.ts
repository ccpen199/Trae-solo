import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { reportService } from '../services/ReportService';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole, ReportType, ReportStatus } from '@prisma/client';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('type')
      .isIn(Object.values(ReportType))
      .withMessage('无效的举报类型'),
    body('reason')
      .isLength({ min: 1, max: 1000 })
      .withMessage('举报原因长度应在 1-1000 个字符之间'),
    body('postId')
      .optional()
      .isUUID()
      .withMessage('无效的帖子ID'),
    body('commentId')
      .optional()
      .isUUID()
      .withMessage('无效的评论ID')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: '需要登录' });
      }

      const { type, reason, postId, commentId } = req.body;
      const report = await reportService.createReport({
        type: type as ReportType,
        reason,
        postId,
        commentId,
        reporterId: req.user.id
      }, req.ip);

      return res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
);

router.get(
  '/',
  authenticate,
  authorize(UserRole.AUDITOR, UserRole.ADMIN),
  [
    query('status')
      .optional()
      .isIn(Object.values(ReportStatus))
      .withMessage('无效的状态'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量应在 1-100 之间'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('偏移量不能为负数')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status, limit = 20, offset = 0 } = req.query;
      const reports = await reportService.getReports({
        status: status as ReportStatus,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      return res.json({ success: true, data: reports });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get(
  '/:id',
  authenticate,
  authorize(UserRole.AUDITOR, UserRole.ADMIN),
  [
    param('id')
      .isUUID()
      .withMessage('无效的举报ID')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const report = await reportService.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, error: '举报不存在' });
      }

      return res.json({ success: true, data: report });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.put(
  '/:id/process',
  authenticate,
  authorize(UserRole.AUDITOR, UserRole.ADMIN),
  [
    param('id')
      .isUUID()
      .withMessage('无效的举报ID'),
    body('status')
      .isIn([ReportStatus.REVIEWING, ReportStatus.RESOLVED, ReportStatus.DISMISSED])
      .withMessage('无效的状态'),
    body('resolutionNote')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('处理备注不能超过 1000 个字符')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: '需要登录' });
      }

      const { status, resolutionNote } = req.body;
      const report = await reportService.updateReportStatus(
        req.params.id,
        req.user.id,
        status as ReportStatus,
        resolutionNote
      );

      return res.json({ success: true, data: report });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router;
