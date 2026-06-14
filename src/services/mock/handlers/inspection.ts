import { http, HttpResponse } from 'msw';
import {
  mockInspections,
  successResponse,
  errorResponse,
  mockPlaces,
  mockSystemUsers,
} from '../data/mockData';
import type {
  InspectionTask,
  InspectionListParams,
  InspectionCreateParams,
  InspectionExecuteParams,
  InspectionStatus,
  InspectionAcceptParams,
  InspectionReviewParams,
  InspectionLifecycleNode,
} from '../../api/inspection';

let inspections = [...mockInspections];

const inspectionTypeNames: Record<string, string> = {
  routine: '日常巡检',
  special: '专项检查',
  complaint: '投诉核查',
  emergency: '应急检查',
};

const inspectionPriorityNames: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const inspectionStatusNames: Record<string, string> = {
  pending: '待派发',
  dispatched: '已派发',
  accepted: '已接收',
  in_progress: '执行中',
  submitted: '已提交',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已退回',
  cancelled: '已取消',
};

const generateLifecycle = (task: InspectionTask): InspectionLifecycleNode[] => {
  const nodes: InspectionLifecycleNode[] = [];
  const base = new Date(task.createdAt);

  nodes.push({
    step: 1,
    stepName: '创建任务',
    operator: '系统管理员',
    operatorRole: '管理员',
    operateTime: task.createdAt,
    content: `创建${task.typeName}任务：${task.title}`,
    result: '任务已创建',
  });

  if (task.status !== 'pending') {
    nodes.push({
      step: 2,
      stepName: '派发任务',
      operator: '系统管理员',
      operatorRole: '管理员',
      operateTime: task.dispatchTime || new Date(base.getTime() + 1800000).toISOString().replace('T', ' ').substring(0, 19),
      content: task.dispatchRemark || `任务已派发给巡检员${task.inspector}`,
      result: '已派发',
    });
  }

  if (['accepted', 'in_progress', 'submitted', 'reviewing', 'completed', 'rejected'].includes(task.status)) {
    nodes.push({
      step: 3,
      stepName: '接收任务',
      operator: task.inspector,
      operatorRole: '巡检员',
      operateTime: task.acceptTime || new Date(base.getTime() + 3600000).toISOString().replace('T', ' ').substring(0, 19),
      content: task.acceptRemark || '巡检员已确认接收任务',
      result: '已接收',
    });
  }

  if (['submitted', 'reviewing', 'completed', 'rejected'].includes(task.status)) {
    nodes.push({
      step: 4,
      stepName: '执行巡检',
      operator: task.inspector,
      operatorRole: '巡检员',
      operateTime: task.startTime,
      content: `巡检执行完毕，结果：${task.result || '-'}`,
      result: `评分：${task.score || '-'}分`,
    });
  }

  if (['submitted', 'reviewing', 'completed', 'rejected'].includes(task.status)) {
    nodes.push({
      step: 5,
      stepName: '提交结果',
      operator: task.inspector,
      operatorRole: '巡检员',
      operateTime: task.submitTime || task.completedAt || new Date(base.getTime() + 7200000).toISOString().replace('T', ' ').substring(0, 19),
      content: '巡检结果已提交，等待审核',
      result: '已提交',
    });
  }

  if (['completed', 'rejected'].includes(task.status)) {
    nodes.push({
      step: 6,
      stepName: '复查审核',
      operator: task.reviewer || '监管员王五',
      operatorRole: '监管员',
      operateTime: task.reviewTime || new Date(base.getTime() + 10800000).toISOString().replace('T', ' ').substring(0, 19),
      content: task.reviewRemark || (task.status === 'completed' ? '审核通过' : '审核不通过，需重新巡检'),
      result: task.reviewResult === 'reject' ? '退回重新巡检' : '审核通过',
    });
  }

  if (task.status === 'completed') {
    nodes.push({
      step: 7,
      stepName: '关闭任务',
      operator: task.reviewer || '监管员王五',
      operatorRole: '监管员',
      operateTime: task.completedAt || new Date(base.getTime() + 14400000).toISOString().replace('T', ' ').substring(0, 19),
      content: '任务完成，已归档',
      result: '已关闭',
    });
  }

  if (task.status === 'cancelled') {
    nodes.push({
      step: 2,
      stepName: '取消任务',
      operator: '系统管理员',
      operatorRole: '管理员',
      operateTime: task.completedAt || task.createdAt,
      content: task.remark || '任务已取消',
      result: '已取消',
    });
  }

  return nodes;
};

export const inspectionHandlers = [
  http.get('/api/inspection/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const placeId = url.searchParams.get('placeId') || '';
    const type = url.searchParams.get('type') || '';
    const priority = url.searchParams.get('priority') || '';
    const status = url.searchParams.get('status') || '';
    const inspector = url.searchParams.get('inspector') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = [...inspections];

    if (placeId) filtered = filtered.filter((i) => i.placeId === placeId);
    if (type) filtered = filtered.filter((i) => i.type === type);
    if (priority) filtered = filtered.filter((i) => i.priority === priority);
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (inspector) filtered = filtered.filter((i) => i.inspector.includes(inspector));
    if (startDate) filtered = filtered.filter((i) => i.createdAt >= startDate);
    if (endDate) filtered = filtered.filter((i) => i.createdAt <= endDate + ' 23:59:59');
    if (keyword) filtered = filtered.filter((i) => i.title.includes(keyword) || i.description.includes(keyword));

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(successResponse({ list, total: filtered.length, page, pageSize }));
  }),

  http.get('/api/inspection/:id', ({ params }) => {
    const { id } = params;
    const inspection = inspections.find((i) => i.id === id);
    if (!inspection) return HttpResponse.json(errorResponse(404, '巡检任务不存在'));

    const taskWithLifecycle = {
      ...inspection,
      lifecycle: generateLifecycle(inspection),
    };

    return HttpResponse.json(successResponse(taskWithLifecycle));
  }),

  http.post('/api/inspection', async ({ request }) => {
    const body = (await request.json()) as InspectionCreateParams;
    const place = mockPlaces.find((p) => p.id === body.placeId);
    const user = mockSystemUsers.find((u) => u.id === body.inspectorId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newInspection: InspectionTask = {
      id: crypto.randomUUID(),
      taskNo: 'INSP' + Date.now().toString(),
      title: body.title,
      type: body.type,
      typeName: inspectionTypeNames[body.type],
      priority: body.priority,
      priorityName: inspectionPriorityNames[body.priority],
      placeId: body.placeId,
      placeName: place?.name || '未知场所',
      inspector: user?.realName || '未知巡检员',
      inspectorId: body.inspectorId,
      status: 'dispatched',
      statusName: '已派发',
      description: body.description,
      checkItems: body.checkItems.map((item) => ({
        id: crypto.randomUUID(),
        ...item,
        status: 'na' as const,
      })),
      createdAt: now,
      startTime: body.startTime,
      deadline: body.deadline,
      dispatchTime: now,
    };

    inspections.unshift(newInspection);
    return HttpResponse.json(successResponse(newInspection, '创建成功'));
  }),

  http.put('/api/inspection/execute', async ({ request }) => {
    const body = (await request.json()) as InspectionExecuteParams;
    const { id, checkItems, result, score, remark } = body;
    const index = inspections.findIndex((i) => i.id === id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '巡检任务不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...inspections[index],
      status: 'submitted' as InspectionStatus,
      statusName: '已提交',
      checkItems,
      submitTime: now,
      result,
      score,
      remark,
    };

    inspections[index] = updated;
    return HttpResponse.json(successResponse(updated, '执行完成'));
  }),

  http.put('/api/inspection/:id/cancel', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const { reason } = body as { reason: string };
    const index = inspections.findIndex((i) => i.id === id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '巡检任务不存在'));

    const updated = {
      ...inspections[index],
      status: 'cancelled' as InspectionStatus,
      statusName: '已取消',
      remark: reason,
    };

    inspections[index] = updated;
    return HttpResponse.json(successResponse(updated, '取消成功'));
  }),

  http.post('/api/inspection/accept', async ({ request }) => {
    const body = (await request.json()) as InspectionAcceptParams;
    const index = inspections.findIndex((i) => i.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '巡检任务不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...inspections[index],
      status: 'accepted' as InspectionStatus,
      statusName: '已接收',
      acceptTime: now,
      acceptRemark: body.acceptRemark,
    };

    inspections[index] = updated;
    return HttpResponse.json(successResponse(updated, '接收成功'));
  }),

  http.post('/api/inspection/review', async ({ request }) => {
    const body = (await request.json()) as InspectionReviewParams;
    const index = inspections.findIndex((i) => i.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '巡检任务不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...inspections[index],
      status: body.reviewResult === 'pass' ? 'completed' as InspectionStatus : 'rejected' as InspectionStatus,
      statusName: body.reviewResult === 'pass' ? '已完成' : '已退回',
      reviewResult: body.reviewResult,
      reviewRemark: body.reviewRemark,
      reviewTime: now,
      reviewer: '监管员王五',
      ...(body.reviewResult === 'pass' ? { completedAt: now } : { rejectTime: now, rejectRemark: body.reviewRemark }),
    };

    inspections[index] = updated;
    return HttpResponse.json(successResponse(updated, body.reviewResult === 'pass' ? '审核通过，任务关闭' : '审核不通过，退回重新巡检'));
  }),

  http.get('/api/inspection/statistics', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const placeId = url.searchParams.get('placeId') || '';

    let filtered = [...inspections];
    if (placeId) filtered = filtered.filter((i) => i.placeId === placeId);
    if (startDate) filtered = filtered.filter((i) => i.createdAt >= startDate);
    if (endDate) filtered = filtered.filter((i) => i.createdAt <= endDate + ' 23:59:59');

    const stats = {
      total: filtered.length,
      pending: filtered.filter((i) => ['pending', 'dispatched'].includes(i.status)).length,
      in_progress: filtered.filter((i) => ['accepted', 'in_progress'].includes(i.status)).length,
      completed: filtered.filter((i) => i.status === 'completed').length,
      cancelled: filtered.filter((i) => i.status === 'cancelled').length,
      avgScore: filtered.filter((i) => i.status === 'completed').length > 0
        ? Math.round(filtered.filter((i) => i.status === 'completed' && i.score).reduce((sum, i) => sum + (i.score || 0), 0) / filtered.filter((i) => i.status === 'completed').length)
        : 0,
    };

    return HttpResponse.json(successResponse(stats));
  }),
];
