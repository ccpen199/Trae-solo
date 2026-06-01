import { Router, Response } from 'express';
import { NamespaceModel, OperationLogModel, ClusterModel } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/permission';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const namespaces = NamespaceModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: namespaces });
});

router.post('/', authMiddleware, requireRole('admin', 'operator'), (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const { name, description, status } = req.body;

  if (!name) {
    res.status(400).json({ code: 400, message: '命名空间名称不能为空', data: null });
    return;
  }

  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }

  const id = NamespaceModel.create({
    cluster_id: clusterId,
    name,
    description: description || null,
    status: status || 'active'
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'create_namespace',
      resource_type: 'namespace',
      resource_name: name,
      cluster_id: clusterId,
      namespace: name,
      detail: `在集群 ${cluster.name} 创建命名空间: ${name}`,
      risk_level: 'low'
    });
  }

  res.status(201).json({ code: 201, message: '命名空间创建成功', data: { id } });
});

router.put('/:id', authMiddleware, requireRole('admin', 'operator'), (req: AuthRequest, res: Response) => {
  const existing = NamespaceModel.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ code: 404, message: '命名空间不存在', data: null });
    return;
  }

  const { name, description, status } = req.body;
  NamespaceModel.update(req.params.id, {
    name: name || undefined,
    description: description !== undefined ? description : undefined,
    status: status || undefined
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'update_namespace',
      resource_type: 'namespace',
      resource_name: name || existing.name,
      cluster_id: req.params.clusterId,
      namespace: name || existing.name,
      detail: `更新命名空间: ${name || existing.name}`,
      risk_level: 'low'
    });
  }

  res.json({ code: 200, message: '命名空间更新成功', data: null });
});

router.delete('/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = NamespaceModel.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ code: 404, message: '命名空间不存在', data: null });
    return;
  }

  NamespaceModel.delete(req.params.id);

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'delete_namespace',
      resource_type: 'namespace',
      resource_name: existing.name,
      cluster_id: req.params.clusterId,
      namespace: existing.name,
      detail: `删除命名空间: ${existing.name}`,
      risk_level: 'medium'
    });
  }

  res.json({ code: 200, message: '命名空间删除成功', data: null });
});

export default router;
