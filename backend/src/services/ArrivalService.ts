import { Repository, EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  MasterWaybill,
  WaybillDetail,
  StatusFlow,
  FlowType,
  FlowNode,
  WaybillStatus,
  DetailStatus,
  User,
  UserRole,
  Todo,
  TodoPriority,
  NotificationType,
  NotificationPriority,
  AuditAction,
} from '../entities';
import { ArrivalRequest, PickupRequest, BusinessNode } from '../types';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class ArrivalService {
  private waybillRepo: Repository<MasterWaybill>;
  private detailRepo: Repository<WaybillDetail>;
  private userRepo: Repository<User>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.detailRepo = AppDataSource.getRepository(WaybillDetail);
    this.userRepo = AppDataSource.getRepository(User);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async markArrived(waybillId: string, operator: User, request?: ArrivalRequest): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    todo?: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder', 'details'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (waybill.status !== WaybillStatus.IN_TRANSIT) {
      throw new Error('运单状态不允许标记为已到港');
    }

    const fromStatus = waybill.status;

    const consigneeUsers = await this.userRepo.find({
      where: { role: UserRole.CONSIGNEE, active: true },
    });

    let nextResponsible: User | null = null;
    if (consigneeUsers.length > 0) {
      nextResponsible = consigneeUsers[0];
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.ARRIVED,
      operator,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: FlowNode.ARRIVAL,
      content: '航班已到达，货物已到港',
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode: BusinessNode.PICKUP,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.arrivalDate = new Date();
    waybill.actualArrivalDate = request?.actualArrivalTime
      ? new Date(request.actualArrivalTime)
      : new Date();

    for (const detail of waybill.details) {
      detail.status = DetailStatus.ARRIVED;
      detail.statusDisplay = '已到港';
      detail.arrivedDate = waybill.actualArrivalDate;
    }

    await this.detailRepo.save(waybill.details);
    await this.waybillRepo.save(waybill);

    let todo: Todo | undefined;
    if (nextResponsible) {
      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        BusinessNode.PICKUP,
        `运单 ${waybill.masterNo} 到港提货`,
        {
          description: '货物已到港，请安排提货',
          priority: TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 已到港`,
        '货物已到达目的机场，请通知收货人提货',
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '货物已到港，待办自动完成');

    await this.auditService.logWaybillAction(
      operator,
      waybill,
      AuditAction.UPDATE,
      '货物已到港',
      { status: fromStatus },
      { status: WaybillStatus.ARRIVED },
      ['status', 'arrivalDate', 'actualArrivalDate']
    );

    return {
      waybill,
      statusFlow,
      todo,
    };
  }

  async startPickup(waybillId: string, consigneeUser: User): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (consigneeUser.role !== UserRole.CONSIGNEE && consigneeUser.role !== UserRole.ADMIN) {
      throw new Error('只有收货人或管理员可以进行提货操作');
    }

    if (waybill.status !== WaybillStatus.ARRIVED) {
      throw new Error('运单状态不允许开始提货');
    }

    const fromStatus = waybill.status;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.PICKING_UP,
      operator: consigneeUser,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: FlowNode.PICKUP,
      content: '开始提货流程',
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    await this.waybillRepo.save(waybill);

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 开始提货`,
        '收货人已开始提货流程',
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.NORMAL,
        }
      );
    }

    await this.auditService.logWaybillAction(
      consigneeUser,
      waybill,
      AuditAction.UPDATE,
      '开始提货流程',
      { status: fromStatus },
      { status: WaybillStatus.PICKING_UP },
      ['status']
    );

    return {
      waybill,
      statusFlow,
    };
  }

  async completePickup(waybillId: string, consigneeUser: User, request: PickupRequest): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder', 'details'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (consigneeUser.role !== UserRole.CONSIGNEE && consigneeUser.role !== UserRole.ADMIN) {
      throw new Error('只有收货人或管理员可以完成提货');
    }

    if (waybill.status !== WaybillStatus.PICKING_UP && waybill.status !== WaybillStatus.ARRIVED) {
      throw new Error('运单状态不允许完成提货');
    }

    const fromStatus = waybill.status;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.COMPLETED,
      operator: consigneeUser,
      flowType: FlowType.ACTION,
      flowNode: FlowNode.COMPLETION,
      content: request.remark || '提货完成',
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.pickupDate = request.pickupTime ? new Date(request.pickupTime) : new Date();

    for (const detail of waybill.details) {
      detail.status = DetailStatus.DELIVERED;
      detail.statusDisplay = '已交付';
      detail.deliveredDate = waybill.pickupDate;
    }

    await this.detailRepo.save(waybill.details);
    await this.waybillRepo.save(waybill);

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 已完成`,
        '收货人已完成提货，运单流程结束',
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '提货已完成，待办自动完成');

    await this.auditService.logWaybillAction(
      consigneeUser,
      waybill,
      AuditAction.UPDATE,
      '提货完成，运单结束',
      { status: fromStatus },
      { status: WaybillStatus.COMPLETED },
      ['status', 'pickupDate']
    );

    return {
      waybill,
      statusFlow,
    };
  }
}
