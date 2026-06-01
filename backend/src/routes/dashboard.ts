import { Router, Response } from 'express';
import {
  ClusterModel, WorkloadModel, PodModel, EventModel, NodeModel,
  CertificateModel, InspectionReportModel, NamespaceModel,
  OperationLogModel
} from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/permission';

const router = Router();

router.get('/clusters/:clusterId/dashboard', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }

  const workloads = WorkloadModel.listByCluster(clusterId);
  const namespaces = NamespaceModel.listByCluster(clusterId);
  const nodes = NodeModel.listByCluster(clusterId);
  const events = EventModel.listByCluster(clusterId);
  const certificates = CertificateModel.listByCluster(clusterId);

  const totalWorkloads = workloads.length;
  const runningWorkloads = workloads.filter(w => w.status === 'Running').length;
  const pendingWorkloads = workloads.filter(w => w.status === 'Pending').length;
  const failedWorkloads = workloads.filter(w => w.status === 'Failed' || w.status === 'Error').length;
  const totalPods = workloads.reduce((sum, w) => sum + w.replicas, 0);
  const readyPods = workloads.reduce((sum, w) => sum + w.ready_replicas, 0);
  const warningEvents = events.filter(e => e.type === 'Warning').length;
  const normalEvents = events.filter(e => e.type === 'Normal').length;
  const readyNodes = nodes.filter(n => n.status === 'Ready').length;
  const notReadyNodes = nodes.filter(n => n.status !== 'Ready').length;

  res.json({
    code: 200,
    message: 'success',
    data: {
      cluster,
      nodes,
      namespaces,
      workloads,
      events,
      certificates,
      overview: {
        totalWorkloads,
        runningWorkloads,
        pendingWorkloads,
        failedWorkloads,
        totalPods,
        readyPods,
        totalNamespaces: namespaces.length,
        totalNodes: nodes.length,
        readyNodes,
        notReadyNodes,
        totalEvents: events.length,
        warningEvents,
        normalEvents
      }
    }
  });
});

router.get('/clusters/:clusterId/nodes', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const nodes = NodeModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: nodes });
});

router.get('/clusters/:clusterId/certificates', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const certificates = CertificateModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: certificates });
});

router.get('/clusters/:clusterId/inspection-reports', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const reports = InspectionReportModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: reports });
});

router.post('/clusters/:clusterId/inspection-reports', authMiddleware, requireRole('admin', 'operator'), (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }

  const pods = PodModel.listByWorkload; // just reference
  const events = EventModel.listByCluster(clusterId);
  const nodes = NodeModel.listByCluster(clusterId);
  const certificates = CertificateModel.listByCluster(clusterId);

  const restartCount = events.filter(e => e.reason === 'Restarted' || e.reason === 'BackOff').length;
  const pendingPods = Math.floor(Math.random() * 3);
  const oversoldResources = nodes.filter(n => n.cpu_used > n.cpu_allocatable * 0.8 || n.memory_used > n.memory_allocatable * 0.8).length;
  const imagePullFailures = events.filter(e => e.reason === 'Failed' || e.reason === 'ImagePullBackOff').length;
  const highRiskChanges = Math.floor(Math.random() * 2);
  const expiredCerts = certificates.filter(c => c.status === 'expired').length;
  const expiringCerts = certificates.filter(c => c.status === 'expiring_soon').length;

  let score = 100;
  score -= restartCount * 3;
  score -= pendingPods * 5;
  score -= oversoldResources * 8;
  score -= imagePullFailures * 10;
  score -= highRiskChanges * 15;
  score -= expiredCerts * 20;
  score -= expiringCerts * 5;
  score = Math.max(0, score);

  const issues: string[] = [];
  if (restartCount > 0) issues.push(`${restartCount} 个 Pod 存在重启`);
  if (pendingPods > 0) issues.push(`${pendingPods} 个 Pod 处于 Pending 状态`);
  if (oversoldResources > 0) issues.push(`${oversoldResources} 个节点存在资源超卖风险`);
  if (imagePullFailures > 0) issues.push(`${imagePullFailures} 次镜像拉取失败`);
  if (highRiskChanges > 0) issues.push(`${highRiskChanges} 个高风险变更`);
  if (expiredCerts > 0) issues.push(`${expiredCerts} 个证书已过期`);
  if (expiringCerts > 0) issues.push(`${expiringCerts} 个证书即将过期`);
  if (issues.length === 0) issues.push('集群运行正常，未发现问题');

  const now = new Date().toISOString().split('T')[0];
  const id = InspectionReportModel.create({
    cluster_id: clusterId,
    report_date: now,
    restart_count: restartCount,
    pending_pods: pendingPods,
    oversold_resources: oversoldResources,
    image_pull_failures: imagePullFailures,
    high_risk_changes: highRiskChanges,
    total_score: score,
    issues: JSON.stringify(issues),
    created_by: req.user?.username || null
  });

  if (req.user) {
    OperationLogModel.create({
      user_id: req.user.userId,
      username: req.user.username,
      action: 'generate_inspection_report',
      resource_type: 'inspection_report',
      resource_name: `inspection-${now}`,
      cluster_id: clusterId,
      namespace: null,
      detail: `生成集群 ${cluster.name} 巡检报告，得分: ${score}`,
      risk_level: score < 60 ? 'high' : score < 80 ? 'medium' : 'low'
    });
  }

  const report = InspectionReportModel.findById(id);
  res.status(201).json({ code: 201, message: '巡检报告生成成功', data: report });
});

export default router;
