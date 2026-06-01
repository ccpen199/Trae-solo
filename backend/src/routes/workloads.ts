import { Router, Response } from 'express';
import {
  WorkloadModel, PodModel, ServiceModel, IngressModel,
  ConfigMapModel, SecretModel, EventModel, ReleaseRecordModel,
  OperationLogModel, ClusterModel
} from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole, checkPermission } from '../middleware/permission';

const router = Router();

router.get('/clusters/:clusterId/workloads', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const workloads = WorkloadModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: workloads });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: workload });
});

router.get('/:id/pods', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const pods = PodModel.listByWorkload(req.params.id);
  res.json({ code: 200, message: 'success', data: pods });
});

router.get('/:id/services', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const services = ServiceModel.listByWorkload(req.params.id);
  res.json({ code: 200, message: 'success', data: services });
});

router.get('/:id/ingresses', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const ingresses = IngressModel.listByWorkload(req.params.id);
  res.json({ code: 200, message: 'success', data: ingresses });
});

router.get('/:id/configmaps', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const configMaps = ConfigMapModel.listByWorkload(req.params.id);
  res.json({ code: 200, message: 'success', data: configMaps });
});

router.get('/:id/secrets', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const secrets = SecretModel.listByWorkload(req.params.id);
  res.json({ code: 200, message: 'success', data: secrets });
});

router.get('/:id/events', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const events = EventModel.listByWorkload(workload.cluster_id, workload.namespace, workload.name);
  res.json({ code: 200, message: 'success', data: events });
});

router.get('/:id/rollouts', authMiddleware, (req: AuthRequest, res: Response) => {
  const workload = WorkloadModel.findById(req.params.id);
  if (!workload) {
    res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
    return;
  }
  const releases = ReleaseRecordModel.listByWorkload(workload.cluster_id, workload.namespace, workload.name);
  res.json({ code: 200, message: 'success', data: releases });
});

function loadWorkloadForPermission(req: AuthRequest, _res: Response, next: () => void) {
  const existing = WorkloadModel.findById(req.params.id);
  if (existing) {
    req.body.cluster_id = existing.cluster_id;
    req.body.namespace = existing.namespace;
  }
  next();
}

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'operator'),
  loadWorkloadForPermission,
  checkPermission('delete'),
  (req: AuthRequest, res: Response) => {
    const existing = WorkloadModel.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ code: 404, message: '工作负载不存在', data: null });
      return;
    }

    WorkloadModel.delete(req.params.id);

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'delete_workload',
        resource_type: 'workload',
        resource_name: existing.name,
        cluster_id: existing.cluster_id,
        namespace: existing.namespace,
        detail: `删除工作负载: ${existing.name} (${existing.type})`,
        risk_level: 'high'
      });
    }

    res.json({ code: 200, message: '工作负载删除成功', data: null });
  }
);

export default router;
