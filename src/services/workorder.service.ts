import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { WorkOrder, ProgressLog, Satisfaction } from '@/types/entity';
import { mockDelay, mockSuccess, generateId } from '@/mocks/utils';
import { mockWorkOrders, mockProgressLogs, mockSatisfactions } from '@/mocks/data/workorders';

export interface WorkOrderListParams extends PageParams {
  type?: string;
  status?: string;
  priority?: string;
  keyword?: string;
}

export const getWorkOrderList = async (
  params?: WorkOrderListParams
): Promise<ApiResponse<PageResult<WorkOrder>>> => {
  await mockDelay();

  let list = [...mockWorkOrders];

  if (params?.type) {
    list = list.filter((item) => item.type === params.type);
  }
  if (params?.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params?.priority) {
    list = list.filter((item) => item.priority === params.priority);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.orderNo.toLowerCase().includes(kw) ||
        item.submitterName.toLowerCase().includes(kw)
    );
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export interface WorkOrderDetail extends Omit<WorkOrder, 'satisfaction'> {
  progressLogs: ProgressLog[];
  satisfaction?: Satisfaction;
}

export const getWorkOrderDetail = async (id: string): Promise<ApiResponse<WorkOrderDetail | null>> => {
  await mockDelay();

  const workOrder = mockWorkOrders.find((w) => w.id === id);
  if (!workOrder) {
    return mockSuccess(null);
  }

  const progressLogs = mockProgressLogs
    .filter((log) => log.workOrderId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const satisfaction = mockSatisfactions.find((s) => s.workOrderId === id);

  return mockSuccess({
    ...workOrder,
    progressLogs,
    satisfaction,
  });
};

export interface CreateWorkOrderData {
  title: string;
  description: string;
  type: string;
  priority: string;
  communityId: string;
  buildingId?: string;
  roomId?: string;
}

export const createWorkOrder = async (data: CreateWorkOrderData): Promise<ApiResponse<WorkOrder>> => {
  await mockDelay();

  const now = new Date();
  const newOrder: WorkOrder = {
    id: generateId('wo'),
    orderNo: `WO${now.getFullYear()}${String(mockWorkOrders.length + 1).padStart(6, '0')}`,
    title: data.title,
    description: data.description,
    type: data.type as WorkOrder['type'],
    status: 'PENDING',
    priority: data.priority as WorkOrder['priority'],
    source: 'RESIDENT_APP',
    submitterId: 'user_res_001',
    submitterName: '张三',
    communityId: data.communityId,
    buildingId: data.buildingId,
    roomId: data.roomId,
    slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  mockWorkOrders.unshift(newOrder);

  return mockSuccess(newOrder);
};

export const assignWorkOrder = async (id: string, assigneeId: string): Promise<ApiResponse<WorkOrder>> => {
  await mockDelay();

  const workOrder = mockWorkOrders.find((w) => w.id === id);
  if (!workOrder) {
    return mockSuccess({} as WorkOrder);
  }

  workOrder.assigneeId = assigneeId;
  workOrder.status = 'ASSIGNED';
  workOrder.updatedAt = new Date().toISOString();

  const staffUsers: Record<string, string> = {
    'user_prop_001': '张师傅',
    'user_prop_002': '李师傅',
    'user_prop_003': '王师傅',
  };
  workOrder.assigneeName = staffUsers[assigneeId] || '工作人员';

  return mockSuccess(workOrder);
};

export interface UpdateProgressData {
  action: string;
  remark?: string;
}

export const updateProgress = async (
  id: string,
  log: UpdateProgressData
): Promise<ApiResponse<ProgressLog>> => {
  await mockDelay();

  const now = new Date();
  const newLog: ProgressLog = {
    id: generateId('log'),
    workOrderId: id,
    operatorId: 'user_prop_001',
    operatorName: '张师傅',
    action: log.action,
    remark: log.remark,
    createdAt: now.toISOString(),
  };

  mockProgressLogs.push(newLog);

  const workOrder = mockWorkOrders.find((w) => w.id === id);
  if (workOrder) {
    if (log.action.includes('处理') || log.action.includes('开始')) {
      workOrder.status = 'IN_PROGRESS';
    }
    if (log.action.includes('完成')) {
      workOrder.status = 'COMPLETED';
      workOrder.completedAt = now.toISOString();
    }
    workOrder.updatedAt = now.toISOString();
  }

  return mockSuccess(newLog);
};

export const submitSatisfaction = async (
  id: string,
  rating: number,
  comment?: string
): Promise<ApiResponse<Satisfaction>> => {
  await mockDelay();

  const now = new Date();
  const satisfaction: Satisfaction = {
    id: generateId('sat'),
    workOrderId: id,
    residentId: 'user_res_001',
    rating,
    comment,
    createdAt: now.toISOString(),
  };

  mockSatisfactions.push(satisfaction);

  return mockSuccess(satisfaction);
};
