import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  generateLandlordApplications,
  generateProperties,
  generateContracts,
  generateCreditProfiles,
  generateWorkOrders,
  generateEmergencyPlacements,
  generateAuditLogs,
  generateDashboardMetrics,
  generateHeatmapPoints,
} from '@/mock/dataFactory';
import type {
  LandlordApplication,
  Property,
  Contract,
  CreditProfile,
  ServiceWorkOrder as WorkOrder,
  EmergencyPlacement,
  AuditLog,
  DashboardMetrics,
  MapHeatmapPoint as HeatmapPoint,
} from '@/types';

/** 审计操作动作类型 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'complete'
  | 'export'
  | 'login'
  | 'view';

/** 当前登录用户 */
export interface CurrentUser {
  id: string;
  name: string;
  role:
    | '超级管理员'
    | '审核专员'
    | '财务人员'
    | '服务管家'
    | '房东'
    | '租客';
  avatar?: string;
  permissions: string[];
}

interface AddAuditLogParams {
  action: AuditAction;
  module: string;
  targetId: string;
  targetName: string;
  description: string;
  result?: 'success' | 'failed';
  changes?: { field: string; oldValue?: unknown; newValue?: unknown }[];
}

interface AppState {
  landlordApplications: LandlordApplication[];
  properties: Property[];
  contracts: Contract[];
  creditProfiles: CreditProfile[];
  workOrders: WorkOrder[];
  emergencyPlacements: EmergencyPlacement[];
  auditLogs: AuditLog[];
  dashboardMetrics: DashboardMetrics;
  heatmapPoints: HeatmapPoint[];
  currentUser: CurrentUser;

  addAuditLog: (params: AddAuditLogParams) => void;
  setAuditStatus: (
    id: string,
    status: string,
    remark?: string
  ) => void;
  setPropertyStatus: (id: string, status: Property['status']) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  updateContractStatus: (id: string, status: Contract['status']) => void;
  assignEngineer: (id: string, engineerId: string, engineerName?: string) => void;
  completeWorkOrder: (id: string, rating: number) => void;
  refreshMetrics: () => void;
}

/** 硬编码的当前登录管理员用户 (避免依赖 dataFactory 额外导出) */
const DEFAULT_CURRENT_USER: CurrentUser = {
  id: 'usr_admin_001',
  name: '张管理',
  role: '超级管理员',
  permissions: [
    'landlord:audit',
    'property:manage',
    'contract:manage',
    'service:dispatch',
    'finance:view',
    'audit:export',
    'system:config',
  ],
};

/** 审核状态文字映射 */
const AUDIT_STATUS_TEXT: Partial<Record<string, string>> = {
  pending: '待审核',
  auto_checking: '自动审核中',
  reviewing: '人工复核中',
  approved: '已通过',
  rejected: '已驳回',
} as any;

/** 房源状态文字映射 */
const PROPERTY_STATUS_TEXT: Partial<Record<string, string>> = {
  draft: '草稿',
  verifying: '核验中',
  listed: '已上架',
  rented: '已出租',
  offline: '已下架',
  removed: '已删除',
} as any;

/** 合同状态文字映射 */
const CONTRACT_STATUS_TEXT: Partial<Record<string, string>> = {
  draft: '草稿',
  pending_tenant_sign: '待租客签署',
  pending_landlord_sign: '待房东签署',
  signed: '已签署',
  performing: '履约中',
  expiring: '即将到期',
  expired: '已到期',
  breached: '已违约',
} as any;

export const useAppStore = create<AppState>((set, get) => ({
  landlordApplications: generateLandlordApplications(20),
  properties: generateProperties(30),
  contracts: generateContracts(20),
  creditProfiles: generateCreditProfiles(25),
  workOrders: generateWorkOrders(20),
  emergencyPlacements: generateEmergencyPlacements(8),
  auditLogs: generateAuditLogs(50),
  dashboardMetrics: generateDashboardMetrics(),
  heatmapPoints: generateHeatmapPoints(80),
  currentUser: DEFAULT_CURRENT_USER,

  addAuditLog: (params) => {
    const { currentUser, auditLogs } = get();
    const newLog = {
      id: uuidv4(),
      logId: 'LOG' + Date.now() + Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      module: params.module,
      action: params.action,
      targetType: params.module,
      targetId: params.targetId,
      targetName: params.targetName,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0',
      result: params.result ?? 'success',
      failReason: params.result === 'failed' ? '操作失败' : undefined,
      changes: params.changes,
      sessionId: 'sess_' + uuidv4().slice(0, 12),
      correlationId: uuidv4(),
    } as unknown as AuditLog;
    set({ auditLogs: [newLog, ...auditLogs].slice(0, 2000) });
  },

  setAuditStatus: (id, status, remark) => {
    const { landlordApplications } = get();
    const application = landlordApplications.find((a) => a.id === id);
    const updated = landlordApplications.map((a) =>
      a.id === id
        ? ({
            ...a,
            auditStatus: status,
            auditTime: new Date().toISOString(),
            auditorName: get().currentUser.name,
            auditRemark: remark,
          } as any)
        : a
    );
    set({ landlordApplications: updated });

    const statusText = (AUDIT_STATUS_TEXT as any)[status];
    get().addAuditLog({
      action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
      module: '房东审核',
      targetId: id,
      targetName: (application as any)?.name || (application as any)?.landlordName || '未知房东',
      description: `审核房东申请 [${application?.applyNo ?? id}]，结果：${statusText}${
        remark ? `，备注：${remark}` : ''
      }`,
      changes: [
        {
          field: 'auditStatus',
          oldValue: (application as any)?.auditStatus,
          newValue: status,
        },
      ],
    });
  },

  setPropertyStatus: (id, status) => {
    const { properties } = get();
    const property = properties.find((p) => p.id === id);
    const updated = properties.map((p) => (p.id === id ? { ...p, status } : p));
    set({ properties: updated });

    const statusText = (PROPERTY_STATUS_TEXT as any)[status];
    get().addAuditLog({
      action: 'update',
      module: '房源管理',
      targetId: id,
      targetName: property?.title || '未知房源',
      description: `更新房源 [${property?.propertyNo ?? id}] 状态为：${statusText}`,
      changes: [{ field: 'status', oldValue: property?.status, newValue: status }],
    });
  },

  updateProperty: (id, patch) => {
    const { properties } = get();
    const property = properties.find((p) => p.id === id);
    const updated = properties.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ properties: updated });

    const changedFields = Object.keys(patch);
    const changes = changedFields.map((f) => ({
      field: f,
      oldValue: (property as unknown as Record<string, unknown>)?.[f],
      newValue: (patch as unknown as Record<string, unknown>)[f],
    }));

    get().addAuditLog({
      action: 'update',
      module: '房源管理',
      targetId: id,
      targetName: property?.title || '未知房源',
      description: `更新房源 [${property?.propertyNo ?? id}] 信息，修改字段：${changedFields.join('、')}`,
      changes,
    });
  },

  updateContractStatus: (id, status) => {
    const { contracts } = get();
    const contract = contracts.find((c) => c.id === id);
    const updated = contracts.map((c) => (c.id === id ? { ...c, status } : c));
    set({ contracts: updated });

    const statusText = (CONTRACT_STATUS_TEXT as any)[status];
    get().addAuditLog({
      action: 'update',
      module: '合同管理',
      targetId: id,
      targetName: contract?.contractNo || '未知合同',
      description: `更新合同 [${contract?.contractNo ?? id}] 状态为：${statusText}`,
      changes: [{ field: 'status', oldValue: contract?.status, newValue: status }],
    });
  },

  assignEngineer: (id, engineerId, engineerName) => {
    const { workOrders } = get();
    const workOrder = workOrders.find((w) => w.id === id);
    const resolvedName = engineerName ?? `工程师${engineerId.slice(-3)}`;
    const now = new Date().toISOString();
    const updated = workOrders.map((w) =>
      w.id === id
        ? ({
            ...w,
            status: 'assigned' as any,
            assigneeId: engineerId,
            assigneeName: resolvedName,
            responseTime: (workOrder as any)?.responseTime ?? now,
            timeline: [
              ...(w.timeline ?? []),
              {
                id: uuidv4(),
                action: '已分派工程师',
                operatorName: get().currentUser.name,
                operatorRole: get().currentUser.role,
                remark: `分派给 ${resolvedName}`,
                createTime: now,
              } as any,
            ],
          } as any)
        : w
    );
    set({ workOrders: updated });

    get().addAuditLog({
      action: 'assign',
      module: '工单系统',
      targetId: id,
      targetName: workOrder?.title || '未知工单',
      description: `分派工单 [${workOrder?.orderNo ?? id}] 给工程师：${resolvedName}`,
      changes: [
        { field: 'assigneeId', newValue: engineerId },
        { field: 'assigneeName', newValue: resolvedName },
      ],
    });
  },

  completeWorkOrder: (id, rating) => {
    const { workOrders } = get();
    const workOrder = workOrders.find((w) => w.id === id);
    const now = new Date().toISOString();
    const updated = workOrders.map((w) =>
      w.id === id
        ? ({
            ...w,
            status: 'completed' as any,
            actualCompleteTime: now,
            rating,
            timeline: [
              ...(w.timeline ?? []),
              {
                id: uuidv4(),
                action: '工单已完成',
                operatorName: get().currentUser.name,
                operatorRole: get().currentUser.role,
                remark: `用户评分：${rating}星`,
                createTime: now,
              } as any,
            ],
          } as any)
        : w
    );
    set({ workOrders: updated });

    get().addAuditLog({
      action: 'complete',
      module: '工单系统',
      targetId: id,
      targetName: workOrder?.title || '未知工单',
      description: `完成工单 [${workOrder?.orderNo ?? id}]，用户评分：${rating}星`,
      changes: [{ field: 'rating', newValue: rating }],
    });
  },

  refreshMetrics: () => {
    set({ dashboardMetrics: generateDashboardMetrics() });
    get().addAuditLog({
      action: 'view',
      module: '数据看板',
      targetId: 'dashboard',
      targetName: '运营指标看板',
      description: '刷新数据看板指标',
    });
  },
}));
