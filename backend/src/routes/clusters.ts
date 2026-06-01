import { Router, Response } from 'express';
import { ClusterModel, OperationLogModel, WorkloadModel, EventModel, NamespaceModel } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/permission';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const clusters = ClusterModel.list();
  res.json({ code: 200, message: 'success', data: clusters });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const cluster = ClusterModel.findById(req.params.id);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: cluster });
});

router.post('/', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { name, description, api_server, status, node_count } = req.body;

  if (!name) {
    res.status(400).json({ code: 400, message: '集群名称不能为空', data: null });
    return;
  }

  const id = ClusterModel.create({
    name,
    description: description || null,
    api_server: api_server || null,
    status: status || 'healthy',
    node_count: node_count || 0
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'create_cluster',
      resource_type: 'cluster',
      resource_name: name,
      cluster_id: id,
      namespace: null,
      detail: `创建集群: ${name}`,
      risk_level: 'medium'
    });
  }

  res.status(201).json({ code: 201, message: '集群创建成功', data: { id } });
});

router.put('/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = ClusterModel.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }

  const { name, description, api_server, status, node_count } = req.body;
  ClusterModel.update(req.params.id, {
    name: name || undefined,
    description: description !== undefined ? description : undefined,
    api_server: api_server !== undefined ? api_server : undefined,
    status: status || undefined,
    node_count: node_count !== undefined ? node_count : undefined
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'update_cluster',
      resource_type: 'cluster',
      resource_name: name || existing.name,
      cluster_id: req.params.id,
      namespace: null,
      detail: `更新集群: ${name || existing.name}`,
      risk_level: 'medium'
    });
  }

  res.json({ code: 200, message: '集群更新成功', data: null });
});

router.delete('/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = ClusterModel.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }

  ClusterModel.delete(req.params.id);

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'delete_cluster',
      resource_type: 'cluster',
      resource_name: existing.name,
      cluster_id: req.params.id,
      namespace: null,
      detail: `删除集群: ${existing.name}`,
      risk_level: 'high'
    });
  }

  res.json({ code: 200, message: '集群删除成功', data: null });
});

router.get('/:id/workloads', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const cluster = ClusterModel.findById(id);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const workloads = WorkloadModel.listByCluster(id);
  res.json({ code: 200, message: 'success', data: workloads });
});

router.get('/:id/events', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const cluster = ClusterModel.findById(id);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const events = EventModel.listByCluster(id);
  res.json({ code: 200, message: 'success', data: events });
});

router.get('/:id/namespaces', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const cluster = ClusterModel.findById(id);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const namespaces = NamespaceModel.listByCluster(id);
  res.json({ code: 200, message: 'success', data: namespaces });
});

export default router;
