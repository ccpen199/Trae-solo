import { Router, Response } from 'express';
import { OperationLogModel, PermissionModel, UserModel } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/permission';

const router = Router();

router.get('/logs', authMiddleware, (_req: AuthRequest, res: Response) => {
  const logs = OperationLogModel.list();
  res.json({ code: 200, message: 'success', data: logs });
});

router.get('/permissions', authMiddleware, requireRole('admin'), (_req: AuthRequest, res: Response) => {
  const permissions = PermissionModel.list();
  res.json({ code: 200, message: 'success', data: permissions });
});

router.post('/permissions', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { user_id, cluster_id, namespace, action } = req.body;

  if (!user_id || !action) {
    res.status(400).json({ code: 400, message: 'user_id 和 action 不能为空', data: null });
    return;
  }

  const user = UserModel.findById(user_id);
  if (!user) {
    res.status(404).json({ code: 404, message: '用户不存在', data: null });
    return;
  }

  const id = PermissionModel.create({
    user_id,
    cluster_id: cluster_id || null,
    namespace: namespace || null,
    action
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'grant_permission',
      resource_type: 'permission',
      resource_name: action,
      cluster_id: cluster_id || null,
      namespace: namespace || null,
      detail: `为用户 ${user.username} 授予权限: ${action}${cluster_id ? ' @ ' + cluster_id : ''}${namespace ? '/' + namespace : ''}`,
      risk_level: 'medium'
    });
  }

  res.status(201).json({ code: 201, message: '权限创建成功', data: { id } });
});

export default router;
