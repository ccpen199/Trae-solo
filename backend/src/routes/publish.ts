import { Router, Response } from 'express';
import {
  ReleaseRecordModel, WorkloadModel, OperationLogModel,
  ClusterModel
} from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole, checkPermission } from '../middleware/permission';
import type { CreateReleaseRequest } from '../types';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'operator'),
  checkPermission('publish'),
  (req: AuthRequest, res: Response) => {
    const {
      cluster_id, namespace, workload_name, new_image, old_image,
      cpu_limit, memory_limit, health_check, gray_ratio, rollback_point,
      change_reason, on_duty
    } = req.body as CreateReleaseRequest;

    if (!cluster_id || !namespace || !workload_name || !new_image ||
        !old_image || !cpu_limit || !memory_limit ||
        health_check === undefined || gray_ratio === undefined ||
        !rollback_point || !change_reason || !on_duty) {
      res.status(400).json({
        code: 400,
        message: '缺少必要字段: cluster_id, namespace, workload_name, new_image, old_image, cpu_limit, memory_limit, health_check, gray_ratio, rollback_point, change_reason, on_duty',
        data: null
      });
      return;
    }

    if (gray_ratio < 0 || gray_ratio > 100) {
      res.status(400).json({ code: 400, message: '灰度比例必须在 0-100 之间', data: null });
      return;
    }

    const cluster = ClusterModel.findById(cluster_id);
    if (!cluster) {
      res.status(404).json({ code: 404, message: '集群不存在', data: null });
      return;
    }

    const id = ReleaseRecordModel.create({
      cluster_id,
      namespace,
      workload_name,
      old_image,
      new_image,
      cpu_limit,
      memory_limit,
      health_check,
      gray_ratio,
      rollback_point,
      change_reason,
      on_duty,
      status: 'pending',
      approver: null,
      operator: req.user?.username || 'unknown'
    });

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'create_release',
        resource_type: 'release',
        resource_name: workload_name,
        cluster_id,
        namespace,
        detail: `创建发布单: ${workload_name} ${old_image} -> ${new_image}, 灰度: ${gray_ratio}%, 值班: ${on_duty}, 原因: ${change_reason}`,
        risk_level: 'high'
      });
    }

    res.status(201).json({ code: 201, message: '发布单创建成功', data: { id } });
  }
);

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { cluster_id } = req.query;
  let releases = ReleaseRecordModel.list();
  if (cluster_id && typeof cluster_id === 'string') {
    releases = releases.filter(r => r.cluster_id === cluster_id);
  }
  res.json({ code: 200, message: 'success', data: releases });
});

router.post(
  '/:id/approve',
  authMiddleware,
  requireRole('admin'),
  checkPermission('approve'),
  (req: AuthRequest, res: Response) => {
    const release = ReleaseRecordModel.findById(req.params.id);
    if (!release) {
      res.status(404).json({ code: 404, message: '发布单不存在', data: null });
      return;
    }

    if (release.status !== 'pending') {
      res.status(400).json({ code: 400, message: '只有待审批状态的发布单才能审批', data: null });
      return;
    }

    const now = new Date().toISOString();
    ReleaseRecordModel.update(req.params.id, {
      status: 'approved',
      approver: req.user?.username || 'unknown',
      approved_at: now
    });

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'approve_release',
        resource_type: 'release',
        resource_name: release.workload_name,
        cluster_id: release.cluster_id,
        namespace: release.namespace,
        detail: `审批通过发布单: ${release.workload_name} ${release.old_image} -> ${release.new_image}`,
        risk_level: 'high'
      });
    }

    res.json({ code: 200, message: '发布单审批通过', data: null });
  }
);

router.post(
  '/:id/execute',
  authMiddleware,
  requireRole('admin', 'operator'),
  checkPermission('publish'),
  (req: AuthRequest, res: Response) => {
    const release = ReleaseRecordModel.findById(req.params.id);
    if (!release) {
      res.status(404).json({ code: 404, message: '发布单不存在', data: null });
      return;
    }

    if (release.status !== 'approved') {
      res.status(400).json({ code: 400, message: '发布单必须先通过审批', data: null });
      return;
    }

    const now = new Date().toISOString();
    const rollbackPoint = `rollback-${req.params.id}-${Date.now()}`;

    ReleaseRecordModel.update(req.params.id, {
      status: 'executing',
      rollback_point: rollbackPoint
    });

    setTimeout(() => {
      ReleaseRecordModel.update(req.params.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }, 100);

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'execute_release',
        resource_type: 'release',
        resource_name: release.workload_name,
        cluster_id: release.cluster_id,
        namespace: release.namespace,
        detail: `执行发布: ${release.workload_name} -> ${release.new_image}, 回滚点: ${rollbackPoint}`,
        risk_level: 'high'
      });
    }

    res.json({ code: 200, message: '发布已执行', data: { rollback_point: rollbackPoint } });
  }
);

router.post(
  '/:id/rollback',
  authMiddleware,
  requireRole('admin', 'operator'),
  checkPermission('publish'),
  (req: AuthRequest, res: Response) => {
    const release = ReleaseRecordModel.findById(req.params.id);
    if (!release) {
      res.status(404).json({ code: 404, message: '发布单不存在', data: null });
      return;
    }

    if (release.status !== 'completed' && release.status !== 'failed') {
      res.status(400).json({ code: 400, message: '只有已完成或失败的发布单才能回滚', data: null });
      return;
    }

    if (!release.old_image) {
      res.status(400).json({ code: 400, message: '没有可用的回滚镜像', data: null });
      return;
    }

    ReleaseRecordModel.update(req.params.id, {
      status: 'rolled_back',
      completed_at: new Date().toISOString()
    });

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'rollback_release',
        resource_type: 'release',
        resource_name: release.workload_name,
        cluster_id: release.cluster_id,
        namespace: release.namespace,
        detail: `回滚发布: ${release.workload_name} -> ${release.old_image}`,
        risk_level: 'high'
      });
    }

    res.json({ code: 200, message: '回滚成功', data: null });
  }
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  checkPermission('delete'),
  (req: AuthRequest, res: Response) => {
    const release = ReleaseRecordModel.findById(req.params.id);
    if (!release) {
      res.status(404).json({ code: 404, message: '发布单不存在', data: null });
      return;
    }

    if (release.status === 'executing') {
      res.status(400).json({ code: 400, message: '执行中的发布单不能删除', data: null });
      return;
    }

    ReleaseRecordModel.delete(req.params.id);

    if (req.user) {
      OperationLogModel.create({
        user_id: req.user.userId,
        username: req.user.username,
        action: 'delete_release',
        resource_type: 'release',
        resource_name: release.workload_name,
        cluster_id: release.cluster_id,
        namespace: release.namespace,
        detail: `删除发布单: ${release.workload_name}`,
        risk_level: 'high'
      });
    }

    res.json({ code: 200, message: '发布单删除成功', data: null });
  }
);

export default router;
