import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { UnionService } from '../services/union.service';
import { MemberService } from '../services/member.service';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }
  next();
};

// 获取联盟列表
router.get(
  '/',
  optionalAuthMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('keyword').optional().isString(),
    query('isRecommend').optional().isBoolean().toBoolean(),
    query('sortBy').optional().isIn(['reputation', 'memberCount', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize, keyword, isRecommend, sortBy, sortOrder } = req.query as any;
      const result = await UnionService.getUnions({
        page,
        pageSize,
        keyword,
        isRecommend,
        sortBy,
        sortOrder,
      });
      
      res.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取推荐联盟
router.get(
  '/recommended',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string || '10', 10);
      const unions = await UnionService.getRecommendedUnions(limit);
      
      res.json({
        code: 200,
        data: unions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取联盟排行榜
router.get(
  '/ranking',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = (req.query.type as 'reputation' | 'member') || 'reputation';
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      
      const result = await UnionService.getUnionRanking(type, page, pageSize);
      
      res.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取我的联盟
router.get(
  '/my',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const unions = await UnionService.getUserUnions(req.userId!);
      
      res.json({
        code: 200,
        data: unions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 创建联盟
router.post(
  '/',
  authMiddleware,
  [
    body('name').isString().isLength({ min: 2, max: 20 }).withMessage('联盟名称长度应为2-20个字符'),
    body('description').optional().isString().isLength({ max: 200 }).withMessage('描述长度不能超过200个字符'),
    body('avatar').optional().isString(),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, avatar } = req.body;
      const union = await UnionService.createUnion(req.userId!, name, description, avatar);
      
      res.json({
        code: 200,
        message: '创建联盟成功',
        data: union,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取联盟详情
router.get(
  '/:id',
  optionalAuthMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const union = await UnionService.getUnionDetail(req.params.id, req.userId);
      
      res.json({
        code: 200,
        data: union,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新联盟信息
router.put(
  '/:id',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    body('name').optional().isString().isLength({ min: 2, max: 20 }),
    body('description').optional().isString().isLength({ max: 200 }),
    body('avatar').optional(),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, avatar } = req.body;
      const union = await UnionService.updateUnion(
        req.params.id,
        req.userId!,
        { name, description, avatar }
      );
      
      res.json({
        code: 200,
        message: '更新成功',
        data: union,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 加入联盟
router.post(
  '/:id/join',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await MemberService.joinUnion(req.params.id, req.userId!);
      
      res.json({
        code: 200,
        message: '加入联盟成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 退出联盟
router.post(
  '/:id/leave',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await MemberService.leaveUnion(req.params.id, req.userId!);
      
      res.json({
        code: 200,
        message: '退出联盟成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取联盟成员列表
router.get(
  '/:id/members',
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isInt().toInt(),
    query('sortBy').optional().isIn(['contribution', 'joinAt', 'lastActiveAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize, role, sortBy, sortOrder } = req.query as any;
      const result = await MemberService.getUnionMembers(req.params.id, {
        page,
        pageSize,
        role,
        sortBy,
        sortOrder,
      });
      
      res.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取联盟成员贡献排行榜
router.get(
  '/:id/ranking/contribution',
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    validate,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      
      const result = await MemberService.getContributionRanking(req.params.id, page, pageSize);
      
      res.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 开除成员
router.post(
  '/:id/members/:userId/kick',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    param('userId').isUUID().withMessage('无效的用户ID'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await MemberService.kickMember(
        req.params.id,
        req.userId!,
        req.params.userId
      );
      
      res.json({
        code: 200,
        message: '已开除该成员',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 移交盟主
router.post(
  '/:id/transfer-leader',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    body('newLeaderId').isUUID().withMessage('无效的新盟主ID'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await MemberService.transferLeader(
        req.params.id,
        req.userId!,
        req.body.newLeaderId
      );
      
      res.json({
        code: 200,
        message: '移交盟主成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 设置副盟主
router.post(
  '/:id/members/:userId/set-vice',
  authMiddleware,
  [
    param('id').isUUID().withMessage('无效的联盟ID'),
    param('userId').isUUID().withMessage('无效的用户ID'),
    body('isVice').isBoolean().withMessage('isVice必须是布尔值'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await MemberService.setViceLeader(
        req.params.id,
        req.userId!,
        req.params.userId,
        req.body.isVice
      );
      
      res.json({
        code: 200,
        message: req.body.isVice ? '设置副盟主成功' : '取消副盟主成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 记录用户行为（用于声望和贡献增加）
router.post(
  '/action',
  authMiddleware,
  [
    body('type').isIn(['post', 'reply', 'login']).withMessage('无效的行为类型'),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await MemberService.recordUserAction(req.userId!, req.body.type);
      
      res.json({
        code: 200,
        message: '记录成功',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
