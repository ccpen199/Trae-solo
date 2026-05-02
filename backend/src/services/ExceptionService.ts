import { Repository, EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  MasterWaybill,
  StatusFlow,
  FlowType,
  FlowNode,
  WaybillStatus,
  User,
  UserRole,
  Todo,
  TodoPriority,
  NotificationType,
  NotificationPriority,
  AuditAction,
  Comment,
  CommentType,
} from '../entities';
import { ExceptionType, BusinessNode } from '../types';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export interface ExceptionContext {
  waybillId: string;
  exceptionType: ExceptionType;
  description: string;
  operator: User;
  originalTrajectory?: string;
  compensationData?: Record<string, any>;
  mapCallbackDelaySeconds?: number;
  locationDriftDistance?: number;
  expectedLocation?: string;
  actualLocation?: string;
  driverInfo?: Record<string, any>;
}

export class ExceptionService {
  private waybillRepo: Repository<MasterWaybill>;
  private userRepo: Repository<User>;
  private commentRepo: Repository<Comment>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  private static readonly EXCEPTION_TYPE_MAP: Record<ExceptionType, { display: string; level: TodoPriority }> = {
    [ExceptionType.LOCATION_DRIFT]: { display: '定位漂移', level: TodoPriority.URGENT },
    [ExceptionType.ROUTE_DEVIATION]: { display: '路线偏离', level: TodoPriority.URGENT },
    [ExceptionType.DRIVER_REJECT]: { display: '司机拒接', level: TodoPriority.HIGH },
    [ExceptionType.ARRIVAL_NOT_CONFIRMED]: { display: '到达未确认', level: TodoPriority.HIGH },
    [ExceptionType.MAP_CALLBACK_DELAY]: { display: '地图回调延迟', level: TodoPriority.NORMAL },
    [ExceptionType.OTHER]: { display: '其他异常', level: TodoPriority.HIGH },
  };

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.userRepo = AppDataSource.getRepository(User);
    this.commentRepo = AppDataSource.getRepository(Comment);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async triggerException(context: ExceptionContext): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    exceptionComment: Comment;
    todo?: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: context.waybillId },
      relations: ['forwarder'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    const fromStatus = waybill.status;
    const exceptionInfo = ExceptionService.EXCEPTION_TYPE_MAP[context.exceptionType] || {
      display: '未知异常',
      level: TodoPriority.HIGH,
    };

    const metadata: Record<string, any> = {
      exceptionType: context.exceptionType,
      originalTrajectory: context.originalTrajectory,
      compensationData: context.compensationData,
      mapCallbackDelaySeconds: context.mapCallbackDelaySeconds,
      locationDriftDistance: context.locationDriftDistance,
      expectedLocation: context.expectedLocation,
      actualLocation: context.actualLocation,
      driverInfo: context.driverInfo,
      triggerTime: new Date().toISOString(),
    };

    const flowContext: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.EXCEPTION,
      operator: context.operator,
      flowType: FlowType.EXCEPTION,
      flowNode: waybill.currentNode as FlowNode || FlowNode.BOOKING,
      content: `${exceptionInfo.display}: ${context.description}`,
      metadata,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(flowContext);

    waybill.exceptionType = context.exceptionType;
    waybill.exceptionDescription = context.description;

    await this.waybillRepo.save(waybill);

    const exceptionComment = new Comment();
    exceptionComment.masterWaybillId = waybill.id;
    exceptionComment.type = CommentType.COMMENT;
    exceptionComment.relatedNode = waybill.currentNode;
    exceptionComment.relatedNodeDisplay = StatusFlowService.getFlowNodeDisplay(
      waybill.currentNode as FlowNode
    );
    exceptionComment.authorId = context.operator.id;
    exceptionComment.authorName = context.operator.name;
    exceptionComment.authorRole = context.operator.role;
    exceptionComment.authorRoleDisplay = StatusFlowService.getRoleDisplay(context.operator.role);
    exceptionComment.content = `【${exceptionInfo.display}】${context.description}`;
    exceptionComment.isInternal = true;

    const savedComment = await this.commentRepo.save(exceptionComment);

    const adminUsers = await this.userRepo.find({
      where: { role: UserRole.ADMIN, active: true },
    });

    let todo: Todo | undefined;
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      todo = await this.todoService.createTodo(
        waybill,
        adminUser,
        waybill.currentNode as BusinessNode || BusinessNode.BOOKING,
        `运单 ${waybill.masterNo} 异常处理`,
        {
          description: `${exceptionInfo.display}: ${context.description}`,
          priority: exceptionInfo.level,
        }
      );

      await this.notificationService.createExceptionNotification(
        adminUser,
        waybill,
        exceptionInfo.display,
        context.description
      );
    }

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 发生异常`,
        `${exceptionInfo.display}: ${context.description}`,
        {
          type: NotificationType.EXCEPTION,
          priority: NotificationPriority.URGENT,
        }
      );
    }

    await this.auditService.logWaybillAction(
      context.operator,
      waybill,
      AuditAction.UPDATE,
      `触发异常: ${exceptionInfo.display}`,
      { status: fromStatus, exceptionType: waybill.exceptionType },
      { status: WaybillStatus.EXCEPTION, exceptionType: context.exceptionType },
      ['status', 'exceptionType', 'exceptionDescription']
    );

    return {
      waybill,
      statusFlow,
      exceptionComment: savedComment,
      todo,
    };
  }

  async resolveException(
    waybillId: string,
    operator: User,
    resolution: string,
    returnToStatus?: WaybillStatus
  ): Promise<{
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

    if (waybill.status !== WaybillStatus.EXCEPTION) {
      throw new Error('运单状态不是异常状态');
    }

    const fromStatus = waybill.status;
    const toStatus = returnToStatus || WaybillStatus.IN_TRANSIT;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus,
      operator,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: waybill.currentNode as FlowNode || FlowNode.BOOKING,
      content: `异常已解决: ${resolution}`,
      nextResponsibleId: waybill.currentResponsibleId,
      nextResponsibleRole: waybill.currentResponsibleRole as UserRole,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.exceptionType = undefined;
    waybill.exceptionDescription = undefined;

    await this.waybillRepo.save(waybill);

    const resolutionComment = new Comment();
    resolutionComment.masterWaybillId = waybill.id;
    resolutionComment.type = CommentType.COMMENT;
    resolutionComment.relatedNode = waybill.currentNode;
    resolutionComment.relatedNodeDisplay = StatusFlowService.getFlowNodeDisplay(
      waybill.currentNode as FlowNode
    );
    resolutionComment.authorId = operator.id;
    resolutionComment.authorName = operator.name;
    resolutionComment.authorRole = operator.role;
    resolutionComment.authorRoleDisplay = StatusFlowService.getRoleDisplay(operator.role);
    resolutionComment.content = `【异常解决】${resolution}`;
    resolutionComment.isInternal = false;

    await this.commentRepo.save(resolutionComment);

    if (waybill.currentResponsibleId) {
      const responsibleUser = await this.userRepo.findOneBy({ id: waybill.currentResponsibleId });
      if (responsibleUser) {
        const todo = await this.todoService.createTodo(
          waybill,
          responsibleUser,
          waybill.currentNode as BusinessNode || BusinessNode.BOOKING,
          `运单 ${waybill.masterNo} 异常已解决，请继续处理`,
          {
            description: resolution,
            priority: TodoPriority.HIGH,
          }
        );

        await this.notificationService.createTodoNotification(responsibleUser, waybill, todo.title);
      }
    }

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 异常已解决`,
        `解决方案: ${resolution}`,
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '异常已解决，待办自动完成');

    await this.auditService.logWaybillAction(
      operator,
      waybill,
      AuditAction.UPDATE,
      `解决异常: ${resolution}`,
      { status: fromStatus },
      { status: toStatus },
      ['status', 'exceptionType', 'exceptionDescription']
    );

    return {
      waybill,
      statusFlow,
    };
  }

  static getExceptionDisplay(exceptionType: ExceptionType): string {
    return this.EXCEPTION_TYPE_MAP[exceptionType]?.display || exceptionType;
  }
}
