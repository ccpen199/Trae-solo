import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import OrchestrationEngine from '../engines/OrchestrationEngine';
import { getAllOrchestrations } from '../../../shared/utils/service-orchestration';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const orchs = getAllOrchestrations();
    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: orchs.length,
        orchestrations: orchs.map(o => ({
          id: o.id,
          name: o.name,
          description: o.description,
          version: o.version,
          status: o.status,
          stepsCount: o.steps.length,
          triggerEvent: o.triggerEvent,
          category: o.category
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const orch = OrchestrationEngine.getOrchestration(req.params.id);
    if (!orch) throw new AppError('编排流程不存在', 404);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        orchestration: orch,
        steps: orch.steps.map(s => ({
          ...s,
          status: 'ready',
          estimatedTime: s.type === 'api-call' ? '5秒' : s.type === 'approval' ? '1-2工作日' : '3秒'
        })),
        flowChart: {
          startNode: 'step-' + orch.steps[0].step,
          nodes: orch.steps.map(s => ({
            id: 'step-' + s.step,
            label: s.name,
            type: s.type,
            onFailure: s.onFailure
          })),
          edges: orch.steps.slice(0, -1).map(s => ({
            from: 'step-' + s.step,
            to: 'step-' + (s.step + 1),
            condition: 'success'
          }))
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/:id/execute', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const orch = OrchestrationEngine.getOrchestration(req.params.id);
    if (!orch) throw new AppError('编排流程不存在', 404);

    const applicationId = req.body.applicationId || `APP-${Date.now()}-ORCH`;

    const result = await OrchestrationEngine.execute(orch, {
      citizenId: req.citizenId!,
      applicationId,
      triggerData: req.body.triggerData || {},
      executionHistory: [],
      variables: {}
    });

    res.json({
      code: 0,
      message: result.success ? '编排执行成功' : '编排执行出现问题',
      data: {
        result,
        executionRecord: OrchestrationEngine.getExecutionRecord(
          result.results && Object.keys(result.results)[0]
            ? Object.keys(result.results)[0] : result.orchestrationId
        )
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/executions/mine', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const records = OrchestrationEngine.getExecutionByCitizen(req.citizenId!);
    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: records.length,
        executions: records.map(r => ({
          id: r.id,
          orchestrationId: r.orchestrationId,
          orchestrationName: r.orchestrationName,
          status: r.status,
          progress: `${r.completedSteps}/${r.totalSteps}`,
          startTime: r.startTime,
          duration: r.duration ? `${r.duration}ms` : undefined
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/executions/:executionId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const record = OrchestrationEngine.getExecutionRecord(req.params.executionId);
    if (!record) throw new AppError('执行记录不存在', 404);

    if (record.citizenId !== req.citizenId && req.role !== 'admin') {
      throw new AppError('无权查看该执行记录', 403);
    }

    res.json({
      code: 0,
      message: 'OK',
      data: record,
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/executions/:executionId/pause', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const success = OrchestrationEngine.pauseExecution(req.params.executionId);
    if (!success) throw new AppError('执行记录不存在', 404);

    res.json({
      code: 0,
      message: '执行已暂停',
      data: { paused: true, executionId: req.params.executionId },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
