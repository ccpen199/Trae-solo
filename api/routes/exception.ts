import { Router, type Request, type Response } from 'express';
import { mockExceptionEvents } from '../../src/mock/data.js';
import type { WorkOrder } from '../../shared/types.js';

const router = Router();

router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', status, severity, eventType } = req.query;
    let events = [...mockExceptionEvents];
    
    if (status) {
      events = events.filter(e => e.status === status);
    }
    
    if (severity) {
      events = events.filter(e => e.severity === severity);
    }
    
    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }
    
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paginatedEvents = events.slice(start, end);
    
    const stats = {
      total: mockExceptionEvents.length,
      pending: mockExceptionEvents.filter(e => e.status === '待处理').length,
      processing: mockExceptionEvents.filter(e => e.status === '处理中').length,
      resolved: mockExceptionEvents.filter(e => e.status === '已解决').length,
      highPriority: mockExceptionEvents.filter(e => e.severity === '高').length,
    };
    
    const typeDistribution = mockExceptionEvents.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: events.length,
        page: pageNum,
        pageSize: size,
        stats,
        typeDistribution,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取异常事件失败' });
  }
});

router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = mockExceptionEvents.find(e => e.id === req.params.id);
    if (!event) {
      res.status(404).json({ success: false, error: '异常事件不存在' });
      return;
    }
    
    const workOrder: WorkOrder | null = event.workOrderId ? {
      id: event.workOrderId,
      eventId: event.id,
      handlerId: 'h001',
      priority: event.severity === '高' ? '紧急' : event.severity === '中' ? '高' : '中',
      status: event.status === '待处理' ? '待分配' : event.status === '处理中' ? '处理中' : '已完成',
      operationLog: [
        { time: event.createdAt, operator: '系统', action: '异常事件自动检测并创建工单' },
        { time: new Date(Date.now() - 3600000).toISOString(), operator: '李管理员', action: '工单已分配' },
      ],
    } : null;
    
    res.json({
      success: true,
      data: {
        ...event,
        workOrder,
        attributionAnalysis: {
          rootCause: event.attribution,
          suggestedSolution: getSuggestedSolution(event.eventType),
          relatedKnowledge: getRelatedKnowledge(event.eventType),
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '获取异常详情失败' });
  }
});

function getSuggestedSolution(eventType: string): string {
  const solutions: Record<string, string> = {
    '跟车干扰': '建议车主保持安全车距(>2米)，降低车速通过ETC车道；如已扣费失败，可走人工车道或稍后重试。',
    '标签失效': '检查OBU设备是否有电，尝试重新激活；如电池耗尽，需到网点更换设备。',
    '交易失败': '检查账户余额是否充足，确认绑定银行卡状态；如为网络问题，稍后自动重试。',
    '路径异常': '系统自动补全门架数据，如费用有异议可申请人工复核。',
    '其他': '建议联系客服，提供详细信息以便进一步排查。',
  };
  return solutions[eventType] || solutions['其他'];
}

function getRelatedKnowledge(eventType: string): string[] {
  const knowledge: Record<string, string[]> = {
    '跟车干扰': [
      'ETC车道通行速度应控制在20km/h以内',
      '与前车保持至少2米的安全距离',
      '确保OBU设备已正确激活并粘贴在指定位置',
    ],
    '标签失效': [
      'OBU设备内置电池使用寿命约5年',
      '设备长时间暴晒可能导致电池加速老化',
      '更换设备需携带身份证和行驶证到网点办理',
    ],
    '交易失败': [
      '确保账户余额充足或绑定银行卡状态正常',
      '系统支持72小时内自动重试3次',
      '如多次失败，请联系客服处理',
    ],
    '路径异常': [
      '门架数据传输延迟属正常现象',
      '系统会在24小时内自动补全数据',
      '如对费用有异议，可在30日内申请复核',
    ],
    '其他': [
      '客服热线：96533',
      '工作时间：08:00-22:00',
      '也可通过APP在线客服咨询',
    ],
  };
  return knowledge[eventType] || knowledge['其他'];
}

router.post('/events/:id/assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { handlerId, handlerName, remark } = req.body;
    
    const event = mockExceptionEvents.find(e => e.id === id);
    if (!event) {
      res.status(404).json({ success: false, error: '异常事件不存在' });
      return;
    }
    
    event.status = '处理中';
    if (!event.workOrderId) {
      event.workOrderId = `w${Date.now()}`;
    }
    
    const workOrder: WorkOrder = {
      id: event.workOrderId,
      eventId: event.id,
      handlerId,
      priority: event.severity === '高' ? '紧急' : event.severity === '中' ? '高' : '中',
      status: '处理中',
      operationLog: [
        { time: event.createdAt, operator: '系统', action: '异常事件自动检测并创建工单' },
        { time: new Date().toISOString(), operator: handlerName || '管理员', action: `工单已分配${remark ? `，备注：${remark}` : ''}` },
      ],
    };
    
    res.json({
      success: true,
      data: {
        event,
        workOrder,
      },
      message: '工单已派发',
    });
  } catch {
    res.status(500).json({ success: false, error: '派发工单失败' });
  }
});

router.post('/events/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const event = mockExceptionEvents.find(e => e.id === id);
    if (!event) {
      res.status(404).json({ success: false, error: '异常事件不存在' });
      return;
    }
    
    event.status = '已解决';
    event.resolvedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: event,
      message: '事件已解决',
    });
  } catch {
    res.status(500).json({ success: false, error: '解决事件失败' });
  }
});

router.post('/events/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const event = mockExceptionEvents.find(e => e.id === id);
    if (!event) {
      res.status(404).json({ success: false, error: '异常事件不存在' });
      return;
    }
    
    event.status = '已关闭';
    
    res.json({
      success: true,
      data: event,
      message: '事件已关闭',
    });
  } catch {
    res.status(500).json({ success: false, error: '关闭事件失败' });
  }
});

router.get('/stats/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;
    const dayCount = parseInt(days as string);
    
    const trendData = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dayCount - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 15) + 5,
        resolved: Math.floor(Math.random() * 12) + 3,
      };
    });
    
    res.json({
      success: true,
      data: trendData,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取趋势数据失败' });
  }
});

router.get('/handlers', async (req: Request, res: Response): Promise<void> => {
  try {
    const handlers = [
      { id: 'h001', name: '李管理员', role: '运维工程师', status: '在线', currentTasks: 3 },
      { id: 'h002', name: '王技术', role: '技术支持', status: '在线', currentTasks: 1 },
      { id: 'h003', name: '张客服', role: '客服专员', status: '忙碌', currentTasks: 5 },
      { id: 'h004', name: '陈主管', role: '运营主管', status: '在线', currentTasks: 2 },
    ];
    
    res.json({
      success: true,
      data: handlers,
    });
  } catch {
    res.status(500).json({ success: false, error: '获取处理人员失败' });
  }
});

export default router;
