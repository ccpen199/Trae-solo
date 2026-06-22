import { get, post } from './http';
import type {
  TaskPool,
  GrabTaskRequest,
  AcceptTaskRequest,
  DispatchResult,
  Order,
} from '@shared/types';

const DEMO_RIDER_ID = 'rider-demo-001';

const now = Date.now();

const mockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-' + Math.random().toString(36).slice(2, 9),
  orderNo: 'DD' + Date.now() + Math.floor(Math.random() * 1000),
  type: 'express',
  title: '同城快递配送',
  goodsDescription: '文件资料',
  goodsDesc: '文件资料',
  amount: 18,
  tip: 5,
  distance: 3200,
  estimatedTime: 35,
  pickupAddress: '北京市朝阳区建国路88号SOHO现代城A座1层',
  pickupLocation: { latitude: 39.9142, longitude: 116.4617 },
  pickupName: '张经理',
  pickupPhone: '13800138001',
  pickupContact: { name: '张经理', phone: '13800138001' },
  deliveryAddress: '北京市海淀区中关村大街1号海淀剧院B2层',
  deliveryLocation: { latitude: 39.9847, longitude: 116.3046 },
  deliveryName: '李总',
  deliveryPhone: '13900139002',
  deliveryContact: { name: '李总', phone: '13900139002' },
  weight: 0.8,
  size: 'small',
  expectedPickupTime: new Date(now + 1000 * 60 * 30),
  expectedDeliveryTime: new Date(now + 1000 * 60 * 60),
  estimatedDeliveryTime: new Date(now + 1000 * 60 * 60),
  status: 'pending',
  riderId: undefined,
  acceptedAt: undefined,
  actualPickupTime: undefined,
  actualDeliveryTime: undefined,
  deadline: new Date(now + 1000 * 60 * 90),
  cancelReason: undefined,
  exceptionReason: undefined,
  isUrgent: false,
  requireSignature: true,
  photos: [],
  source: 'system',
  externalOrderNo: undefined,
  remark: '请轻拿轻放，重要文件',
  pickupCode: '8821',
  deliveryCode: '5634',
  createdAt: new Date(now - 1000 * 60 * 5),
  updatedAt: new Date(now - 1000 * 60 * 5),
  ...overrides,
});

const mockTaskFromOrder = (order: Order, overrides: Partial<TaskPool> = {}): TaskPool => ({
  id: 'task-' + order.id,
  orderId: order.id,
  orderType: order.type,
  status: 'available',
  dispatchMode: 'auto',
  priority: 2,
  expireTime: order.deadline as Date,
  retryCount: 0,
  maxRetryCount: 3,
  matchedRiders: [DEMO_RIDER_ID],
  tags: order.isUrgent ? ['urgent'] : [],
  isHot: order.isUrgent,
  order,
  distance: order.distance,
  estimatedTime: order.estimatedTime,
  estimatedAmount: (order.amount ?? 0) + (order.tip ?? 0),
  matchScore: 88.5,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  ...overrides,
});

const buildMockTasks = (): TaskPool[] => {
  const o1 = mockOrder({
    id: 'order-express-01',
    orderNo: 'DD2026062100001',
    type: 'express',
    title: '同城文件快递',
    amount: 20,
    tip: 8,
    distance: 4500,
    estimatedTime: 45,
    pickupAddress: '北京市朝阳区国贸中心T1-2301',
    deliveryAddress: '北京市东城区王府井大街138号新东安市场',
    isUrgent: true,
    goodsDescription: '合同文件，需本人签收',
    status: 'pending',
  });

  const o2 = mockOrder({
    id: 'order-takeout-02',
    orderNo: 'DD2026062100002',
    type: 'takeout',
    title: '海底捞火锅外卖',
    amount: 15,
    tip: 12,
    distance: 2800,
    estimatedTime: 28,
    pickupAddress: '北京市朝阳区三里屯太古里海底捞',
    deliveryAddress: '北京市朝阳区工体北路甲2号盈科中心15层',
    isUrgent: false,
    goodsDescription: '火锅套餐4人份，含保温袋',
    status: 'pending',
  });

  const o3 = mockOrder({
    id: 'order-medicine-03',
    orderNo: 'DD2026062100003',
    type: 'medicine',
    title: '同仁堂处方药配送',
    amount: 12,
    tip: 6,
    distance: 1500,
    estimatedTime: 18,
    pickupAddress: '北京市西城区大栅栏24号同仁堂药店',
    deliveryAddress: '北京市西城区前门东大街10号楼',
    isUrgent: false,
    goodsDescription: '处方药，需核对身份证',
    status: 'pending',
  });

  const o4 = mockOrder({
    id: 'order-grocery-04',
    orderNo: 'DD2026062100004',
    type: 'grocery',
    title: '盒马鲜生超市配送',
    amount: 22,
    tip: 0,
    distance: 3800,
    estimatedTime: 40,
    pickupAddress: '北京市朝阳区十里堡盒马鲜生',
    deliveryAddress: '北京市朝阳区青年路朝阳大悦城公寓',
    isUrgent: false,
    goodsDescription: '生鲜冷链，注意保鲜',
    weight: 8.5,
    status: 'pending',
  });

  const o5 = mockOrder({
    id: 'order-document-05',
    orderNo: 'DD2026062100005',
    type: 'document',
    title: '律师事务所文书专送',
    amount: 35,
    tip: 15,
    distance: 6500,
    estimatedTime: 60,
    pickupAddress: '北京市朝阳区CBD万达广场9号楼',
    deliveryAddress: '北京市海淀区上地科技园区10号楼',
    isUrgent: true,
    goodsDescription: '法律文书原件，加急专送',
    status: 'pending',
  });

  const myCurrentOrder = mockOrder({
    id: 'order-current-06',
    orderNo: 'DD2026062100006',
    type: 'express',
    title: '财务发票专送',
    amount: 16,
    tip: 5,
    distance: 2100,
    estimatedTime: 22,
    pickupAddress: '北京市朝阳区亚运村汇欣大厦A座',
    deliveryAddress: '北京市朝阳区望京SOHO T3-2105',
    isUrgent: false,
    goodsDescription: '发票专用信封',
    status: 'delivering',
    riderId: DEMO_RIDER_ID,
    acceptedAt: new Date(now - 1000 * 60 * 18),
    actualPickupTime: new Date(now - 1000 * 60 * 5),
    deadline: new Date(now + 1000 * 60 * 22),
  });

  return [
    mockTaskFromOrder(o1, { id: 'task-' + o1.id, dispatchMode: 'auto', isHot: true, matchScore: 92.3, distance: o1.distance, estimatedTime: o1.estimatedTime, estimatedAmount: 28 }),
    mockTaskFromOrder(o2, { id: 'task-' + o2.id, dispatchMode: 'manual', isHot: false, matchScore: 86.7, distance: o2.distance, estimatedTime: o2.estimatedTime, estimatedAmount: 27 }),
    mockTaskFromOrder(o3, { id: 'task-' + o3.id, dispatchMode: 'auto', isHot: false, matchScore: 94.1, distance: o3.distance, estimatedTime: o3.estimatedTime, estimatedAmount: 18 }),
    mockTaskFromOrder(o4, { id: 'task-' + o4.id, dispatchMode: 'manual', isHot: false, matchScore: 79.8, distance: o4.distance, estimatedTime: o4.estimatedTime, estimatedAmount: 22 }),
    mockTaskFromOrder(o5, { id: 'task-' + o5.id, dispatchMode: 'auto', isHot: true, matchScore: 81.2, distance: o5.distance, estimatedTime: o5.estimatedTime, estimatedAmount: 50 }),
    mockTaskFromOrder(myCurrentOrder, {
      id: 'task-' + myCurrentOrder.id,
      status: 'accepted',
      dispatchMode: 'auto',
      assignedRiderId: DEMO_RIDER_ID,
      acceptTime: myCurrentOrder.acceptedAt,
      distance: myCurrentOrder.distance,
      estimatedTime: myCurrentOrder.estimatedTime,
      estimatedAmount: 21,
    }),
  ];
};

const allMockTasks = buildMockTasks();

const isDemoMode = (): boolean => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token?.startsWith?.('demo-token-')) return true;
    } catch {}
  }
  return false;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const taskService = {
  getAvailableTasks: async (params?: {
    orderType?: string;
    maxDistance?: number;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      const query = new URLSearchParams(params as any).toString();
      return await get<{ items: TaskPool[]; total: number }>(`/tasks/available?${query}`);
    } catch {
      if (isDemoMode()) {
        await delay(350);
        const available = allMockTasks.filter(
          (t) => t.status === 'available' && !t.assignedRiderId
        );
        return { items: available, total: available.length };
      }
      throw new Error('获取任务列表失败');
    }
  },

  getCurrentTask: async () => {
    try {
      return await get<TaskPool | null>('/tasks/current');
    } catch {
      if (isDemoMode()) {
        await delay(250);
        const current = allMockTasks.find((t) => t.assignedRiderId === DEMO_RIDER_ID);
        return current || null;
      }
      return null;
    }
  },

  grabTask: async (data: GrabTaskRequest) => {
    try {
      return await post<DispatchResult>('/tasks/grab', data);
    } catch {
      if (isDemoMode()) {
        await delay(500);
        const task = allMockTasks.find((t) => t.id === data.taskId);
        if (!task) return { success: false, taskId: data.taskId!, orderId: '', riderId: DEMO_RIDER_ID, dispatchMode: 'manual', matchScore: 0, reasons: ['任务不存在'], dispatchedAt: new Date(), message: '任务不存在或已被抢' };
        if (task.assignedRiderId) return { success: false, taskId: data.taskId!, orderId: task.orderId, riderId: DEMO_RIDER_ID, dispatchMode: 'manual', matchScore: 0, reasons: ['任务已被抢走'], dispatchedAt: new Date(), message: '手慢了，任务已被其他骑手抢走' };
        task.assignedRiderId = DEMO_RIDER_ID;
        task.status = 'accepted';
        task.acceptTime = new Date();
        if (task.order) {
          task.order.riderId = DEMO_RIDER_ID;
          task.order.status = 'accepted';
          task.order.acceptedAt = new Date();
        }
        return { success: true, taskId: data.taskId!, orderId: task.orderId, riderId: DEMO_RIDER_ID, dispatchMode: 'manual', matchScore: task.matchScore ?? 0, reasons: ['抢单成功'], dispatchedAt: new Date(), order: task.order, message: '抢单成功' };
      }
      throw new Error('抢单失败');
    }
  },

  acceptTask: async (data: AcceptTaskRequest) => {
    try {
      return await post<DispatchResult>('/tasks/accept', data);
    } catch {
      if (isDemoMode()) {
        await delay(400);
        const task = allMockTasks.find((t) => t.id === data.taskId);
        if (!task) return { success: false, taskId: data.taskId!, orderId: '', riderId: DEMO_RIDER_ID, dispatchMode: 'auto', matchScore: 0, reasons: ['任务不存在'], dispatchedAt: new Date(), message: '任务不存在' };
        task.assignedRiderId = DEMO_RIDER_ID;
        task.status = 'accepted';
        task.acceptTime = new Date();
        if (task.order) {
          task.order.riderId = DEMO_RIDER_ID;
          task.order.status = 'accepted';
          task.order.acceptedAt = new Date();
        }
        return { success: true, taskId: data.taskId!, orderId: task.orderId, riderId: DEMO_RIDER_ID, dispatchMode: 'auto', matchScore: task.matchScore ?? 0, reasons: ['接单成功'], dispatchedAt: new Date(), order: task.order, message: '接单成功' };
      }
      throw new Error('接单失败');
    }
  },

  getTaskDetail: async (taskId: string) => {
    try {
      return await get<TaskPool>(`/tasks/${taskId}`);
    } catch {
      if (isDemoMode()) {
        await delay(200);
        const task = allMockTasks.find((t) => t.id === taskId);
        if (task) return task;
      }
      throw new Error('任务不存在');
    }
  },
};
