import { http, HttpResponse } from 'msw';
import {
  mockAlarms,
  successResponse,
  errorResponse,
  generateMockAlarms,
  mockPlaces,
} from '../data/mockData';
import type { Alarm, AlarmListParams, AlarmHandleParams, AlarmStatisticsData, AlarmLifecycleNode, AlarmConfirmParams, AlarmReceiveParams, AlarmProcessParams, AlarmReviewParams } from '../../api/alarm';

let alarms = [...mockAlarms];

const alarmTypeNames: Record<string, string> = {
  overcrowd: '人员拥挤',
  fire: '消防安全',
  intrusion: '入侵检测',
  equipment: '设备异常',
  system: '系统告警',
  other: '其他告警',
};

const alarmLevelNames: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

const alarmStatusNames: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  dispatched: '已派发',
  received: '已接收',
  processing: '处理中',
  resolved: '已解决',
  reviewing: '审核中',
  closed: '已关闭',
  ignored: '已忽略',
};

const generateLifecycle = (alarm: Alarm): AlarmLifecycleNode[] => {
  const nodes: AlarmLifecycleNode[] = [];
  const now = new Date(alarm.startedAt);

  nodes.push({
    step: 1,
    stepName: 'AI识别告警',
    operator: 'AI系统',
    operatorRole: '自动识别',
    operateTime: alarm.startedAt,
    content: `AI检测到${alarm.typeName}：${alarm.title}`,
    result: '自动触发告警',
    lawReference: '《互联网上网服务营业场所管理条例》第二十三条',
  });

  if (alarm.status !== 'pending') {
    nodes.push({
      step: 2,
      stepName: '告警确认/派发',
      operator: alarm.handler || '值班员张三',
      operatorRole: '值班人员',
      operateTime: new Date(now.getTime() + 300000).toISOString().replace('T', ' ').substring(0, 19),
      content: alarm.dispatchOpinion || `确认告警真实性，派发给${alarm.handler || '处置人员'}`,
      result: '已派发',
    });
  }

  if (['received', 'processing', 'resolved', 'reviewing', 'closed'].includes(alarm.status)) {
    nodes.push({
      step: 3,
      stepName: '处置接收',
      operator: alarm.handler || '李四',
      operatorRole: '处置人员',
      operateTime: new Date(now.getTime() + 600000).toISOString().replace('T', ' ').substring(0, 19),
      content: alarm.receiveRemark || '已到达现场，初步判断告警属实',
      result: '已接收',
    });
  }

  if (['resolved', 'reviewing', 'closed'].includes(alarm.status)) {
    nodes.push({
      step: 4,
      stepName: '现场处置',
      operator: alarm.handler || '李四',
      operatorRole: '处置人员',
      operateTime: new Date(now.getTime() + 1800000).toISOString().replace('T', ' ').substring(0, 19),
      content: alarm.handleResult || '已现场处置完毕，整改措施已落实',
      result: '处置完成',
      attachments: alarm.images,
    });
  }

  if (['reviewing', 'closed'].includes(alarm.status)) {
    nodes.push({
      step: 5,
      stepName: '结果回传',
      operator: alarm.handler || '李四',
      operatorRole: '处置人员',
      operateTime: new Date(now.getTime() + 2100000).toISOString().replace('T', ' ').substring(0, 19),
      content: '处置报告已提交，请审核',
      result: '已回传',
    });
  }

  if (alarm.status === 'reviewing' || alarm.status === 'closed') {
    nodes.push({
      step: 6,
      stepName: '复查审核',
      operator: alarm.reviewer || '王五',
      operatorRole: '监管员',
      operateTime: alarm.reviewTime || new Date(now.getTime() + 2700000).toISOString().replace('T', ' ').substring(0, 19),
      content: alarm.reviewRemark || (alarm.status === 'closed' ? '审核通过，处置到位' : '待审核'),
      result: alarm.reviewResult === 'reject' ? '审核不通过，退回重新处置' : '审核通过',
      lawReference: '《娱乐场所管理条例》第三十二条',
    });
  }

  if (alarm.status === 'closed') {
    nodes.push({
      step: 7,
      stepName: '关闭归档',
      operator: alarm.closedBy || '系统',
      operatorRole: '系统',
      operateTime: alarm.closeTime || new Date(now.getTime() + 3600000).toISOString().replace('T', ' ').substring(0, 19),
      content: '告警处理完毕，已归档',
      result: '已关闭',
    });
  }

  return nodes;
};

export const alarmHandlers = [
  http.get('/api/alarm/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const placeId = url.searchParams.get('placeId') || '';
    const type = url.searchParams.get('type') || '';
    const level = url.searchParams.get('level') || '';
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = [...alarms];

    if (placeId) filtered = filtered.filter((a) => a.placeId === placeId);
    if (type) filtered = filtered.filter((a) => a.type === type);
    if (level) filtered = filtered.filter((a) => a.level === level);
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (startDate) filtered = filtered.filter((a) => a.createdAt >= startDate);
    if (endDate) filtered = filtered.filter((a) => a.createdAt <= endDate + ' 23:59:59');
    if (keyword) filtered = filtered.filter((a) => a.title.includes(keyword) || a.description.includes(keyword));

    filtered.sort((a, b) => {
      const levelOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const statusOrder: Record<string, number> = { pending: 4, processing: 3, resolved: 2, ignored: 1 };
      return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0) || (levelOrder[b.level] - levelOrder[a.level]);
    });

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(successResponse({ list, total: filtered.length, page, pageSize }));
  }),

  http.get('/api/alarm/:id', ({ params }) => {
    const { id } = params;
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const alarmWithLifecycle = {
      ...alarm,
      confidence: Math.floor(Math.random() * 15 + 82),
      lifecycle: generateLifecycle(alarm),
    };

    return HttpResponse.json(successResponse(alarmWithLifecycle));
  }),

  http.put('/api/alarm/handle', async ({ request }) => {
    const body = (await request.json()) as AlarmHandleParams;
    const { id, status, handleMethod, handleResult, handler } = body;
    const index = alarms.findIndex((a) => a.id === id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const started = new Date(alarms[index].startedAt);
    const duration = Math.floor((new Date(now).getTime() - started.getTime()) / 1000);

    const updated = {
      ...alarms[index],
      status,
      statusName: alarmStatusNames[status] || status,
      handledAt: now,
      handler,
      handleMethod,
      handleResult,
      handleDuration: duration,
    };

    alarms[index] = updated;
    return HttpResponse.json(successResponse(updated, '处理完成'));
  }),

  http.post('/api/alarm/confirm', async ({ request }) => {
    const body = (await request.json()) as AlarmConfirmParams;
    const index = alarms.findIndex((a) => a.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...alarms[index],
      status: (body.isConfirmed ? 'dispatched' : 'ignored') as Alarm['status'],
      statusName: body.isConfirmed ? '已派发' : '已忽略',
      handler: body.handler,
      dispatchOpinion: body.dispatchOpinion,
      dispatchTime: now,
    };

    alarms[index] = updated;
    return HttpResponse.json(successResponse(updated, body.isConfirmed ? '已派发' : '已忽略'));
  }),

  http.post('/api/alarm/receive', async ({ request }) => {
    const body = (await request.json()) as AlarmReceiveParams;
    const index = alarms.findIndex((a) => a.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...alarms[index],
      status: 'received' as Alarm['status'],
      statusName: '已接收',
      receiveTime: now,
      receiveRemark: body.receiveRemark,
    };

    alarms[index] = updated;
    return HttpResponse.json(successResponse(updated, '已接收'));
  }),

  http.post('/api/alarm/process', async ({ request }) => {
    const body = (await request.json()) as AlarmProcessParams;
    const index = alarms.findIndex((a) => a.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...alarms[index],
      status: 'resolved' as Alarm['status'],
      statusName: '已解决',
      handledAt: now,
      handleResult: body.handleResult,
      handlePhotos: body.handlePhotos,
    };

    alarms[index] = updated;
    return HttpResponse.json(successResponse(updated, '处置完成'));
  }),

  http.post('/api/alarm/review', async ({ request }) => {
    const body = (await request.json()) as AlarmReviewParams;
    const index = alarms.findIndex((a) => a.id === body.id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '告警不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...alarms[index],
      status: (body.reviewResult === 'pass' ? 'closed' : 'processing') as Alarm['status'],
      statusName: body.reviewResult === 'pass' ? '已关闭' : '处理中',
      reviewResult: body.reviewResult,
      reviewRemark: body.reviewRemark,
      reviewTime: now,
      reviewer: '监管员王五',
      ...(body.reviewResult === 'pass' ? { closeTime: now, closedBy: '监管员王五' } : {}),
    };

    alarms[index] = updated;
    return HttpResponse.json(successResponse(updated, body.reviewResult === 'pass' ? '审核通过，已关闭' : '审核不通过，退回重新处置'));
  }),

  http.get('/api/alarm/statistics', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const placeId = url.searchParams.get('placeId') || '';

    let filtered = [...alarms];
    if (placeId) filtered = filtered.filter((a) => a.placeId === placeId);
    if (startDate) filtered = filtered.filter((a) => a.createdAt >= startDate);
    if (endDate) filtered = filtered.filter((a) => a.createdAt <= endDate + ' 23:59:59');

    const levelStats = { low: 0, medium: 0, high: 0, critical: 0 };
    const typeStats = { overcrowd: 0, fire: 0, intrusion: 0, equipment: 0, system: 0, other: 0 };
    filtered.forEach((a) => { levelStats[a.level]++; typeStats[a.type]++; });

    const trend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend.push({ date: dateStr, count: filtered.filter((a) => a.createdAt.startsWith(dateStr)).length });
    }

    const stats: AlarmStatisticsData = {
      total: filtered.length,
      pending: filtered.filter((a) => a.status === 'pending').length,
      processing: filtered.filter((a) => ['processing', 'confirmed', 'dispatched', 'received'].includes(a.status)).length,
      resolved: filtered.filter((a) => ['resolved', 'closed'].includes(a.status)).length,
      levelStats,
      typeStats,
      trend,
    };

    return HttpResponse.json(successResponse(stats));
  }),

  http.post('/api/alarm/export', () => {
    return HttpResponse.json(successResponse('https://example.com/export/alarm-' + Date.now() + '.xlsx', '导出成功'));
  }),
];
