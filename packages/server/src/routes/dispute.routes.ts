import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { Dispute, DisputeCategory, DisputePriority } from '../entities/Dispute.js';
import { DisputeStatus } from '../types/common.js';
import { disputeService, CreateDisputeDto, ResolveDisputeDto } from '../services/dispute.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';

const router = Router();
const disputeRepository = AppDataSource.getRepository(Dispute);

router.get(
  '/categories',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(DisputeCategory),
    });
  }
);

router.get(
  '/priorities',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(DisputePriority),
    });
  }
);

router.get(
  '/statuses',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(DisputeStatus),
    });
  }
);

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { status, category, priority, farmerId, orderId, fromDate, toDate, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = disputeRepository
        .createQueryBuilder('dispute')
        .leftJoinAndSelect('dispute.order', 'order')
        .leftJoinAndSelect('dispute.farmer', 'farmer')
        .leftJoinAndSelect('dispute.expertAssignments', 'expertAssignments')
        .leftJoinAndSelect('expertAssignments.expert', 'expert')
        .orderBy('dispute.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('dispute.status = :status', { status });
      }

      if (category) {
        queryBuilder.andWhere('dispute.category = :category', { category });
      }

      if (priority) {
        queryBuilder.andWhere('dispute.priority = :priority', { priority });
      }

      if (farmerId) {
        queryBuilder.andWhere('dispute.farmerId = :farmerId', { farmerId });
      }

      if (orderId) {
        queryBuilder.andWhere('dispute.orderId = :orderId', { orderId });
      }

      if (fromDate) {
        queryBuilder.andWhere('dispute.createdAt >= :fromDate', { fromDate: new Date(fromDate as string) });
      }

      if (toDate) {
        queryBuilder.andWhere('dispute.createdAt <= :toDate', { toDate: new Date(toDate as string) });
      }

      if (req.user?.farmerId) {
        queryBuilder.andWhere('dispute.farmerId = :farmerId', { farmerId: req.user.farmerId });
      }

      const [disputes, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          disputes,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get disputes error:', error);
      res.status(500).json({
        success: false,
        message: '获取纠纷列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const dispute = await disputeService.getDisputeWithDetails(id);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Get dispute error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : '纠纷不存在',
      });
    }
  }
);

router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const dto: CreateDisputeDto = req.body;

      if (req.user.farmerId && !dto.farmerId) {
        dto.farmerId = req.user.farmerId;
      }

      const dispute = await disputeService.createDispute(dto, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Create dispute error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建纠纷失败',
      });
    }
  }
);

router.post(
  '/:id/submit-review',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const dispute = await disputeService.submitForReview(id, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Submit dispute for review error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '提交审核失败',
      });
    }
  }
);

router.post(
  '/:id/request-expert',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const dispute = await disputeService.requestExpertAssignment(id, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Request expert error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '请求专家分派失败',
      });
    }
  }
);

router.post(
  '/:id/reassign-expert',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: '重新分派原因不能为空',
        });
        return;
      }

      const dispute = await disputeService.reassignExpert(id, reason, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Reassign expert error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '重新分派专家失败',
      });
    }
  }
);

router.post(
  '/:id/submit-findings',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.EXPERT] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const { assignmentId, findings } = req.body;

      if (!assignmentId || !findings) {
        res.status(400).json({
          success: false,
          message: '分派ID和调查结果不能为空',
        });
        return;
      }

      const expertId = req.user.expertId;

      if (!expertId) {
        res.status(400).json({
          success: false,
          message: '用户没有关联专家账户',
        });
        return;
      }

      const dispute = await disputeService.submitExpertFindings(
        id,
        assignmentId,
        findings,
        expertId
      );

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Submit expert findings error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '提交专家调查结果失败',
      });
    }
  }
);

router.post(
  '/:id/request-evidence',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const dispute = await disputeService.requestEvidence(id, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Request evidence error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '请求补充证据失败',
      });
    }
  }
);

router.post(
  '/:id/submit-evidence',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const { evidenceFiles } = req.body;

      if (!evidenceFiles || !Array.isArray(evidenceFiles)) {
        res.status(400).json({
          success: false,
          message: '证据文件不能为空',
        });
        return;
      }

      const dispute = await disputeService.submitEvidence(id, evidenceFiles, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Submit evidence error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '提交证据失败',
      });
    }
  }
);

router.post(
  '/:id/resolve',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const dto: ResolveDisputeDto = req.body;

      const dispute = await disputeService.resolveDispute(id, dto, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Resolve dispute error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '结案失败',
      });
    }
  }
);

router.post(
  '/:id/close',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const dispute = await disputeService.closeDispute(id, req.user.userId);

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      console.error('Close dispute error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '关闭纠纷失败',
      });
    }
  }
);

router.get(
  '/:id/traceability',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const traceabilityChain = await disputeService.getDisputeTraceabilityChain(id);

      res.json({
        success: true,
        data: traceabilityChain,
      });
    } catch (error) {
      console.error('Get dispute traceability error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '获取追溯链失败',
      });
    }
  }
);

export default router;
