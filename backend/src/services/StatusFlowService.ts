import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  StatusFlow,
  FlowType,
  FlowNode,
  MasterWaybill,
  WaybillStatus,
  User,
  UserRole,
} from '../entities';
import { BusinessNode } from '../types';

export interface StatusChangeContext {
  waybill: MasterWaybill;
  fromStatus: WaybillStatus;
  toStatus: WaybillStatus;
  operator: User;
  flowType: FlowType;
  flowNode: FlowNode;
  content?: string;
  remark?: string;
  rejectReason?: string;
  nextResponsibleId?: string;
  nextResponsibleRole?: UserRole;
  nextNode?: BusinessNode;
  metadata?: Record<string, any>;
}

export class StatusFlowService {
  private statusFlowRepo: Repository<StatusFlow>;
  private waybillRepo: Repository<MasterWaybill>;

  private static readonly STATUS_DISPLAY_MAP: Record<WaybillStatus, string> = {
    [WaybillStatus.DRAFT]: '草稿',
    [WaybillStatus.BOOKING_SUBMITTED]: '订舱提交',
    [WaybillStatus.BOOKING_CONFIRMED]: '订舱确认',
    [WaybillStatus.RECEIVING]: '收货中',
    [WaybillStatus.RECEIVED]: '收货完成',
    [WaybillStatus.SECURITY_CHECKING]: '安检中',
    [WaybillStatus.SECURITY_PASSED]: '安检通过',
    [WaybillStatus.SECURITY_REJECTED]: '安检驳回',
    [WaybillStatus.LOADING]: '装机中',
    [WaybillStatus.IN_TRANSIT]: '运输中',
    [WaybillStatus.ARRIVED]: '已到港',
    [WaybillStatus.PICKING_UP]: '提货中',
    [WaybillStatus.COMPLETED]: '已完成',
    [WaybillStatus.CANCELLED]: '已取消',
    [WaybillStatus.EXCEPTION]: '异常',
  };

  private static readonly FLOW_TYPE_DISPLAY_MAP: Record<FlowType, string> = {
    [FlowType.STATUS_CHANGE]: '状态变更',
    [FlowType.ACTION]: '操作',
    [FlowType.COMMENT]: '评论',
    [FlowType.APPROVAL]: '审批',
    [FlowType.REJECT]: '驳回',
    [FlowType.CANCEL]: '取消',
    [FlowType.EXCEPTION]: '异常',
    [FlowType.CORRECTION]: '冲正',
    [FlowType.REOPEN]: '重开',
  };

  private static readonly FLOW_NODE_DISPLAY_MAP: Record<FlowNode, string> = {
    [FlowNode.BOOKING]: '订舱',
    [FlowNode.RECEIVING]: '收货',
    [FlowNode.SECURITY]: '安检',
    [FlowNode.LOADING]: '装机',
    [FlowNode.IN_TRANSIT]: '运输',
    [FlowNode.ARRIVAL]: '到港',
    [FlowNode.PICKUP]: '提货',
    [FlowNode.COMPLETION]: '完成',
  };

  private static readonly ROLE_DISPLAY_MAP: Record<UserRole, string> = {
    [UserRole.FORWARDER]: '货代',
    [UserRole.AIRLINE]: '航司',
    [UserRole.WAREHOUSE]: '仓库',
    [UserRole.SECURITY]: '安检',
    [UserRole.CONSIGNEE]: '收货人',
    [UserRole.ADMIN]: '管理员',
  };

  constructor() {
    this.statusFlowRepo = AppDataSource.getRepository(StatusFlow);
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
  }

  static getStatusDisplay(status: WaybillStatus): string {
    return this.STATUS_DISPLAY_MAP[status] || status;
  }

  static getFlowTypeDisplay(flowType: FlowType): string {
    return this.FLOW_TYPE_DISPLAY_MAP[flowType] || flowType;
  }

  static getFlowNodeDisplay(flowNode: FlowNode): string {
    return this.FLOW_NODE_DISPLAY_MAP[flowNode] || flowNode;
  }

  static getRoleDisplay(role: UserRole): string {
    return this.ROLE_DISPLAY_MAP[role] || role;
  }

  static getTimelineIcon(flowType: FlowType): string {
    const iconMap: Record<FlowType, string> = {
      [FlowType.STATUS_CHANGE]: 'sync',
      [FlowType.ACTION]: 'check-circle',
      [FlowType.COMMENT]: 'message',
      [FlowType.APPROVAL]: 'check-square',
      [FlowType.REJECT]: 'x-circle',
      [FlowType.CANCEL]: 'slash',
      [FlowType.EXCEPTION]: 'alert-triangle',
      [FlowType.CORRECTION]: 'edit',
      [FlowType.REOPEN]: 'refresh-cw',
    };
    return iconMap[flowType] || 'circle';
  }

  static getTimelineColor(flowType: FlowType): string {
    const colorMap: Record<FlowType, string> = {
      [FlowType.STATUS_CHANGE]: '#1890ff',
      [FlowType.ACTION]: '#52c41a',
      [FlowType.COMMENT]: '#722ed1',
      [FlowType.APPROVAL]: '#13c2c2',
      [FlowType.REJECT]: '#ff4d4f',
      [FlowType.CANCEL]: '#8c8c8c',
      [FlowType.EXCEPTION]: '#faad14',
      [FlowType.CORRECTION]: '#eb2f96',
      [FlowType.REOPEN]: '#2f54eb',
    };
    return colorMap[flowType] || '#1890ff';
  }

  async createStatusFlow(context: StatusChangeContext): Promise<StatusFlow> {
    const flow = new StatusFlow();
    flow.masterWaybillId = context.waybill.id;
    flow.flowType = context.flowType;
    flow.flowTypeDisplay = StatusFlowService.getFlowTypeDisplay(context.flowType);
    flow.flowNode = context.flowNode;
    flow.flowNodeDisplay = StatusFlowService.getFlowNodeDisplay(context.flowNode);
    flow.fromStatus = context.fromStatus;
    flow.fromStatusDisplay = StatusFlowService.getStatusDisplay(context.fromStatus);
    flow.toStatus = context.toStatus;
    flow.toStatusDisplay = StatusFlowService.getStatusDisplay(context.toStatus);
    flow.operatorId = context.operator.id;
    flow.operatorName = context.operator.name;
    flow.operatorRole = context.operator.role;
    flow.operatorRoleDisplay = StatusFlowService.getRoleDisplay(context.operator.role);
    flow.flowTime = new Date();
    flow.isVisibleOnTimeline = true;
    flow.timelineIcon = StatusFlowService.getTimelineIcon(context.flowType);
    flow.timelineColor = StatusFlowService.getTimelineColor(context.flowType);

    if (context.content) {
      flow.content = context.content;
    }
    if (context.remark) {
      flow.remark = context.remark;
    }
    if (context.rejectReason) {
      flow.rejectReason = context.rejectReason;
    }
    if (context.nextResponsibleId) {
      flow.nextResponsibleId = context.nextResponsibleId;
    }
    if (context.nextResponsibleRole) {
      flow.nextResponsibleRole = context.nextResponsibleRole;
    }
    if (context.nextNode) {
      flow.nextNode = context.nextNode;
    }
    if (context.metadata) {
      flow.metadata = JSON.stringify(context.metadata);
    }

    const savedFlow = await this.statusFlowRepo.save(flow);

    context.waybill.status = context.toStatus;
    context.waybill.statusDisplay = StatusFlowService.getStatusDisplay(context.toStatus);
    context.waybill.currentNode = context.flowNode;

    if (context.nextResponsibleId) {
      context.waybill.currentResponsibleId = context.nextResponsibleId;
    }
    if (context.nextResponsibleRole) {
      context.waybill.currentResponsibleRole = context.nextResponsibleRole;
    }

    await this.waybillRepo.save(context.waybill);

    return savedFlow;
  }

  async getWaybillTimeline(waybillId: string): Promise<StatusFlow[]> {
    return this.statusFlowRepo.find({
      where: { masterWaybillId: waybillId, isVisibleOnTimeline: true },
      order: { flowTime: 'DESC', createdAt: 'DESC' },
    });
  }

  async getLatestFlow(waybillId: string): Promise<StatusFlow | null> {
    const flows = await this.statusFlowRepo.find({
      where: { masterWaybillId: waybillId },
      order: { flowTime: 'DESC' },
      take: 1,
    });
    return flows[0] || null;
  }
}
