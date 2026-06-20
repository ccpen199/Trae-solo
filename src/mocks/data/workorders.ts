import type { WorkOrder, ProgressLog, Satisfaction, WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '@/types/entity';

const now = new Date();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const types: WorkOrderType[] = ['REPAIR', 'COMPLAINT', 'CONSULT', 'SUGGESTION', 'OTHER'];
const statuses: WorkOrderStatus[] = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const priorities: WorkOrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const titleTemplates: Record<WorkOrderType, string[]> = {
  REPAIR: ['水管漏水需要维修', '电梯故障停运', '楼道灯不亮', '空调不制冷', '门锁损坏', '窗户漏水', '下水道堵塞', '墙面开裂'],
  COMPLAINT: ['噪音扰民投诉', '卫生清洁不到位', '停车位被占', '保安态度差', '快递丢失投诉', '绿化养护差'],
  CONSULT: ['物业费收费标准咨询', '装修流程咨询', '停车位办理咨询', '居住证办理咨询', '过户流程咨询', '子女入学咨询'],
  SUGGESTION: ['建议增加健身器材', '建议增设充电桩', '建议优化门禁系统', '建议增加儿童游乐设施', '建议改善绿化', '建议举办社区活动'],
  OTHER: ['其他问题反馈', '需要协助办理事项', '综合问题咨询'],
};

const staffUsers = [
  { id: 'user_prop_001', name: '张师傅' },
  { id: 'user_prop_002', name: '李师傅' },
  { id: 'user_prop_003', name: '王师傅' },
];

const residentUsers = [
  { id: 'user_res_001', name: '张三' },
  { id: 'user_res_002', name: '李四' },
  { id: 'user_res_003', name: '王五' },
  { id: 'user_res_004', name: '赵六' },
  { id: 'user_res_005', name: '孙七' },
];

const generateWorkOrders = (): WorkOrder[] => {
  const orders: WorkOrder[] = [];
  for (let i = 1; i <= 30; i++) {
    const type = types[i % types.length];
    const statusIdx = i % statuses.length;
    const status = statuses[statusIdx];
    const priority = priorities[i % priorities.length];
    const submitter = residentUsers[i % residentUsers.length];
    const assignee = i > 2 ? staffUsers[i % staffUsers.length] : null;
    const createdAt = new Date(thirtyDaysAgo.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000);
    const slaDeadline = new Date(createdAt.getTime() + (4 + Math.random() * 20) * 60 * 60 * 1000);
    const completedAt = status === 'COMPLETED' ? new Date(createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000) : undefined;

    const titles = titleTemplates[type];
    const title = titles[i % titles.length];

    orders.push({
      id: `wo_${i.toString().padStart(3, '0')}`,
      orderNo: `WO${new Date(createdAt).getFullYear()}${String(i).padStart(6, '0')}`,
      title,
      description: `${title}的详细描述：${type === 'REPAIR' ? '设备出现故障，需要尽快安排工作人员上门维修处理。' : type === 'COMPLAINT' ? '对此问题表示非常不满，希望物业能够尽快解决。' : '希望能得到相关的回复和处理。'}`,
      type,
      status,
      priority,
      submitterId: submitter.id,
      submitterName: submitter.name,
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
      communityId: 'comm_yangguang',
      buildingId: i % 2 === 0 ? 'bld_yangguang_1' : 'bld_yangguang_2',
      roomId: i % 2 === 0 ? 'room_yangguang_1_1_1001' : 'room_yangguang_2_1_301',
      slaDeadline: slaDeadline.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: (completedAt || createdAt).toISOString(),
      completedAt: completedAt?.toISOString(),
    });
  }
  return orders;
};

export const mockWorkOrders: WorkOrder[] = generateWorkOrders();

const generateProgressLogs = (): ProgressLog[] => {
  const logs: ProgressLog[] = [];
  let logId = 1;

  mockWorkOrders.forEach((order, orderIdx) => {
    const logCount = 3 + (orderIdx % 3);
    const baseTime = new Date(order.createdAt).getTime();

    for (let i = 0; i < logCount; i++) {
      const logTime = new Date(baseTime + i * 2 * 60 * 60 * 1000 + Math.random() * 30 * 60 * 1000);
      let action = '';
      let operatorId = '';
      let operatorName = '';
      let remark = '';

      if (i === 0) {
        action = '提交工单';
        operatorId = order.submitterId;
        operatorName = order.submitterName;
        remark = '业主提交工单申请';
      } else if (i === 1 && order.status !== 'PENDING') {
        action = '分配工单';
        operatorId = 'user_comm_001';
        operatorName = '王秀兰';
        remark = `已分配给${order.assigneeName}处理`;
      } else if (order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') {
        action = '处理中';
        operatorId = order.assigneeId || 'user_prop_001';
        operatorName = order.assigneeName || '张师傅';
        remark = `正在处理中，进度${(i - 1) * 25}%`;
      }

      if (action) {
        logs.push({
          id: `log_${logId.toString().padStart(4, '0')}`,
          workOrderId: order.id,
          operatorId,
          operatorName,
          action,
          remark,
          createdAt: logTime.toISOString(),
        });
        logId++;
      }
    }

    if (order.status === 'COMPLETED') {
      const completeTime = new Date(order.completedAt || order.updatedAt);
      logs.push({
        id: `log_${logId.toString().padStart(4, '0')}`,
        workOrderId: order.id,
        operatorId: order.assigneeId || 'user_prop_001',
        operatorName: order.assigneeName || '张师傅',
        action: '工单完成',
        remark: '已处理完成，请业主确认',
        createdAt: completeTime.toISOString(),
      });
      logId++;
    }
  });

  return logs;
};

export const mockProgressLogs: ProgressLog[] = generateProgressLogs();

const generateSatisfactions = (): Satisfaction[] => {
  const satisfactions: Satisfaction[] = [];
  const completedOrders = mockWorkOrders.filter((o) => o.status === 'COMPLETED');

  completedOrders.slice(0, 8).forEach((order, idx) => {
    const rating = [5, 4, 3, 5, 4, 5, 3, 4][idx];
    const comments = [
      '非常满意，服务态度好，处理速度快！',
      '整体不错，问题解决了。',
      '一般，处理时间有点长。',
      '师傅很专业，推荐！',
      '还可以吧，希望下次能更快。',
      '非常专业，点赞！',
      '处理结果还行，但沟通可以更好。',
      '服务周到，满意。',
    ];
    satisfactions.push({
      id: `sat_${idx + 1}`,
      workOrderId: order.id,
      residentId: order.submitterId,
      rating,
      comment: comments[idx],
      createdAt: new Date(new Date(order.completedAt!).getTime() + 30 * 60 * 1000).toISOString(),
    });
  });

  return satisfactions;
};

export const mockSatisfactions: Satisfaction[] = generateSatisfactions();
