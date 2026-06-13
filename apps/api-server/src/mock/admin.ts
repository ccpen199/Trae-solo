import type {
  DashboardSummary,
  PassRateTrendPoint,
  QueryTopItem,
  UncertifiedPerson,
  UncertifiedPersonFilter,
  ReminderTask,
  ReminderTaskDetail,
  CreateReminderTaskRequest,
  AuditLogItem,
  AuditLogModule,
  AuditLogResult,
  AuditLogQuery,
  TaskStatus,
  InsuranceType,
} from '@gx-rs/shared';
import { maskUtils, generateUUID } from '@gx-rs/shared';
import dayjs from 'dayjs';

export function getDashboardSummary(): DashboardSummary {
  return {
    todayCertCount: 1247,
    todayCertPassRate: 94.6,
    todayQueryCount: 5823,
    activeUsers7d: 32856,
    pendingReminderCount: 15,
  };
}

export function getPassRateTrend(): PassRateTrendPoint[] {
  const data: PassRateTrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const total = 800 + Math.floor(Math.random() * 500);
    const passRate = 90 + Math.random() * 8;
    const successCount = Math.round(total * passRate / 100);
    const failCount = Math.floor((total - successCount) * 0.7);
    const lockedCount = total - successCount - failCount;

    data.push({
      date: date.format('YYYY-MM-DD'),
      totalCount: total,
      successCount,
      failCount,
      lockedCount,
      passRate: Math.round(passRate * 10) / 10,
    });
  }
  return data;
}

export function getQueryTop10(): QueryTopItem[] {
  const items = [
    { itemName: '养老保险账户余额查询', queryCount: 12580, percentage: 23.5, momChange: 5.2, trend: 'UP' as const },
    { itemName: '社保缴费明细查询', queryCount: 10234, percentage: 19.1, momChange: -2.1, trend: 'DOWN' as const },
    { itemName: '生存认证办理', queryCount: 8976, percentage: 16.8, momChange: 8.7, trend: 'UP' as const },
    { itemName: '失业保险金申领', queryCount: 6543, percentage: 12.2, momChange: 0.3, trend: 'FLAT' as const },
    { itemName: '养老金发放记录', queryCount: 5432, percentage: 10.2, momChange: 1.5, trend: 'UP' as const },
    { itemName: '工伤保险待遇查询', queryCount: 3456, percentage: 6.5, momChange: -0.8, trend: 'DOWN' as const },
    { itemName: '生育津贴申领', queryCount: 2890, percentage: 5.4, momChange: 3.6, trend: 'UP' as const },
    { itemName: '社保卡挂失/补办', queryCount: 1567, percentage: 2.9, momChange: 0.1, trend: 'FLAT' as const },
    { itemName: '参保状态查询', queryCount: 1123, percentage: 2.1, momChange: -1.2, trend: 'DOWN' as const },
    { itemName: '社保转移接续', queryCount: 756, percentage: 1.4, momChange: 0.5, trend: 'UP' as const },
  ];

  return items.map((item, idx) => ({
    rank: idx + 1,
    ...item,
  }));
}

const regions = ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市'];
const surnames = ['韦', '黄', '李', '陈', '张', '王', '刘', '赵', '周', '吴', '梁', '覃', '杨', '何'];
const givenNames = ['建国', '丽娟', '明辉', '秀芳', '伟强', '桂花', '志远', '美玲', '国强', '春花', '文斌', '小燕'];

function generateUncertifiedPersons(): UncertifiedPerson[] {
  const persons: UncertifiedPerson[] = [];
  for (let i = 0; i < 50; i++) {
    const surname = surnames[i % surnames.length];
    const givenName = givenNames[i % givenNames.length];
    const name = surname + givenName;
    const region = regions[i % regions.length];
    const idNum = `4501${String(i + 1).padStart(2, '0')}`;
    const overdueDays = 30 + Math.floor(Math.random() * 300);
    const insTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'].slice(
      0,
      1 + Math.floor(Math.random() * 4),
    ) as InsuranceType[];

    persons.push({
      id: `UC${String(i + 1).padStart(4, '0')}`,
      nameMasked: maskUtils.maskName(name),
      idCardMasked: maskUtils.maskIdCard(`450${String(100 + i).padStart(3, '0')}19${70 + Math.floor(i / 5)}0115${String(1000 + i * 7).slice(-4)}`),
      region,
      lastCertDate: dayjs().subtract(overdueDays + 180, 'day').format('YYYY-MM-DD'),
      overdueDays,
      phoneMasked: maskUtils.maskPhone(`138${String(77000000 + i * 1234).slice(-8)}`),
      insuranceTypes: insTypes,
    });
  }
  return persons;
}

const allUncertifiedPersons = generateUncertifiedPersons();

export function getUncertifiedPersons(filter?: UncertifiedPersonFilter): UncertifiedPerson[] {
  let result = [...allUncertifiedPersons];

  if (filter?.region && filter.region.length > 0) {
    result = result.filter((p) => filter.region!.includes(p.region));
  }
  if (filter?.overdueDays) {
    const [min, max] = filter.overdueDays;
    result = result.filter((p) => p.overdueDays >= min && p.overdueDays <= max);
  }
  if (filter?.insuranceType && filter.insuranceType.length > 0) {
    result = result.filter((p) =>
      filter.insuranceType!.some((t) => p.insuranceTypes.includes(t)),
    );
  }

  return result;
}

const reminderTasks: ReminderTask[] = [
  {
    id: 'TASK001',
    name: '2024年Q1南宁地区未认证人员提醒',
    createdAt: '2024-01-15 09:30:00',
    creator: '张*强',
    totalCount: 156,
    deliveredCount: 148,
    readCount: 112,
    convertedCount: 87,
    status: 'COMPLETED',
    progress: 100,
  },
  {
    id: 'TASK002',
    name: '2024年Q2柳州地区高龄人员认证提醒',
    createdAt: '2024-04-02 14:20:00',
    creator: '张*强',
    totalCount: 89,
    deliveredCount: 85,
    readCount: 67,
    convertedCount: 52,
    status: 'COMPLETED',
    progress: 100,
  },
  {
    id: 'TASK003',
    name: '2024年Q3桂林地区养老认证催办',
    createdAt: '2024-07-10 10:00:00',
    creator: '张*强',
    totalCount: 203,
    deliveredCount: 198,
    readCount: 145,
    convertedCount: 98,
    status: 'RUNNING',
    progress: 72,
  },
  {
    id: 'TASK004',
    name: '2024年梧州地区超期未认证提醒',
    createdAt: '2024-09-05 11:30:00',
    creator: '张*强',
    totalCount: 78,
    deliveredCount: 0,
    readCount: 0,
    convertedCount: 0,
    status: 'DRAFT',
    progress: 0,
  },
  {
    id: 'TASK005',
    name: '2024年北海地区工伤保险认证提醒',
    createdAt: '2024-08-20 16:45:00',
    creator: '张*强',
    totalCount: 45,
    deliveredCount: 45,
    readCount: 38,
    convertedCount: 35,
    status: 'RUNNING',
    progress: 88,
  },
];

export function getReminderTasks(): ReminderTask[] {
  return reminderTasks;
}

export function getReminderTaskDetail(taskId: string): ReminderTaskDetail | null {
  const task = reminderTasks.find((t) => t.id === taskId);
  if (!task) return null;

  const regionMap: Record<string, string[]> = {
    TASK001: ['南宁市'],
    TASK002: ['柳州市'],
    TASK003: ['桂林市'],
    TASK004: ['梧州市'],
    TASK005: ['北海市'],
  };

  const filter: UncertifiedPersonFilter = {
    region: regionMap[taskId] || [],
  };

  return {
    ...task,
    filterCriteria: filter,
    persons: getUncertifiedPersons(filter).slice(0, 10),
  };
}

export function createReminderTask(request: CreateReminderTaskRequest): ReminderTask {
  const task: ReminderTask = {
    id: `TASK${String(reminderTasks.length + 1).padStart(3, '0')}`,
    name: request.name,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    creator: '张*强',
    totalCount: getUncertifiedPersons(request.filter).length,
    deliveredCount: 0,
    readCount: 0,
    convertedCount: 0,
    status: 'DRAFT',
    progress: 0,
  };
  reminderTasks.push(task);
  return task;
}

const auditModules: AuditLogModule[] = ['AUTH', 'SOCIAL', 'CERTIFY', 'TASK', 'SYSTEM'];
const auditResults: AuditLogResult[] = ['SUCCESS', 'FAIL'];
const operations: Record<AuditLogModule, string[]> = {
  AUTH: ['桂事通登录', 'Token刷新', '用户注销', '登录失败'],
  SOCIAL: ['余额查询', '缴费明细查询', '待遇发放查询', '同比环比查询'],
  CERTIFY: ['开始认证', '活体检测', '人脸比对', '认证结果查询'],
  TASK: ['创建提醒任务', '执行提醒任务', '取消任务', '查看任务详情'],
  SYSTEM: ['修改系统配置', '导出数据', '用户管理', '权限变更'],
};

function generateAuditLogs(): AuditLogItem[] {
  const logs: AuditLogItem[] = [];
  const userNames = ['韦*国', '黄*娟', '李*辉', '陈*芳', '张*强'];

  for (let i = 0; i < 100; i++) {
    const module = auditModules[i % auditModules.length];
    const ops = operations[module];
    const operation = ops[i % ops.length];
    const result = auditResults[i % auditResults.length];
    const userId = `USR${String((i % 5) + 1).padStart(3, '0')}`;

    logs.push({
      id: generateUUID(),
      timestamp: dayjs().subtract(i * 35 + Math.floor(Math.random() * 30), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      userId,
      userNameMasked: userNames[i % 5],
      operation,
      module,
      ip: `192.168.${1 + Math.floor(Math.random() * 10)}.${1 + Math.floor(Math.random() * 254)}`,
      deviceInfo: i % 3 === 0 ? '桂事通App/iOS 17.5' : i % 3 === 1 ? '桂事通App/Android 14' : 'Chrome/125.0',
      result,
      detail: result === 'SUCCESS' ? '操作成功' : '操作失败：权限不足',
    });
  }

  return logs;
}

const allAuditLogs = generateAuditLogs();

export function getAuditLogs(query?: AuditLogQuery): { list: AuditLogItem[]; total: number } {
  let result = [...allAuditLogs];

  if (query?.module) {
    result = result.filter((l) => l.module === query.module);
  }
  if (query?.result) {
    result = result.filter((l) => l.result === query.result);
  }
  if (query?.userId) {
    result = result.filter((l) => l.userId === query.userId);
  }
  if (query?.operation) {
    result = result.filter((l) => l.operation.includes(query.operation!));
  }
  if (query?.startDate) {
    result = result.filter((l) => l.timestamp >= query.startDate!);
  }
  if (query?.endDate) {
    result = result.filter((l) => l.timestamp <= query.endDate!);
  }

  const page = query?.page || 1;
  const size = query?.size || 20;
  const start = (page - 1) * size;

  return {
    list: result.slice(start, start + size),
    total: result.length,
  };
}
