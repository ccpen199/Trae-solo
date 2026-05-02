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
  Space,
  SpaceStatus,
  Flight,
  NotificationType,
  NotificationPriority,
  AuditAction,
  Comment,
  CommentType,
  ApprovalResult,
} from '../entities';
import { LoadingRequest, BusinessNode, LoadingActionType } from '../types';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class LoadingService {
  private waybillRepo: Repository<MasterWaybill>;
  private detailRepo: Repository<WaybillDetail>;
  private flightRepo: Repository<Flight>;
  private spaceRepo: Repository<Space>;
  private userRepo: Repository<User>;
  private commentRepo: Repository<Comment>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.detailRepo = AppDataSource.getRepository(WaybillDetail);
    this.flightRepo = AppDataSource.getRepository(Flight);
    this.spaceRepo = AppDataSource.getRepository(Space);
    this.userRepo = AppDataSource.getRepository(User);
    this.commentRepo = AppDataSource.getRepository(Comment);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async getAvailableActions(waybill: MasterWaybill): Promise<{
    actions: { type: string; display: string; description: string }[];
  }> {
    const actions: { type: string; display: string; description: string }[] = [];

    if (waybill.status === WaybillStatus.SECURITY_PASSED) {
      actions.push({
        type: LoadingActionType.PASS,
        display: '通过装机',
        description: '确认装机条件满足，安排装机',
      });
      actions.push({
        type: LoadingActionType.REJECT,
        display: '驳回装机',
        description: '装机条件不满足，驳回重新处理',
      });
      actions.push({
        type: LoadingActionType.SUPPLEMENT,
        display: '补充资料',
        description: '要求补充装机相关资料',
      });
      actions.push({
        type: LoadingActionType.REASSIGN,
        display: '转派处理',
        description: '转派给其他人员处理',
      });
    }

    return { actions };
  }

  async processLoadingAction(
    waybillId: string,
    actionType: LoadingActionType,
    operator: User,
    options?: Partial<{
      flightId: string;
      comment: string;
      rejectReason: string;
      supplementRequirements: string;
      reassignedToId: string;
      reassignedToName: string;
      reassignmentReason: string;
    }>
  ): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    comment?: Comment;
    todo?: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder', 'details'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (waybill.status !== WaybillStatus.SECURITY_PASSED) {
      throw new Error('运单状态不允许装机操作');
    }

    const fromStatus = waybill.status;
    let toStatus: WaybillStatus;
    let flowType: FlowType;
    let content: string;

    const comment = new Comment();
    comment.masterWaybillId = waybill.id;
    comment.authorId = operator.id;
    comment.authorName = operator.name;
    comment.authorRole = operator.role;
    comment.relatedNode = FlowNode.LOADING;
    comment.relatedNodeDisplay = StatusFlowService.getFlowNodeDisplay(FlowNode.LOADING);

    let nextResponsible: User | null = null;
    let nextNode: BusinessNode | undefined;

    switch (actionType) {
      case LoadingActionType.PASS:
        toStatus = WaybillStatus.LOADING;
        flowType = FlowType.APPROVAL;
        content = options?.comment || '装机通过';
        comment.type = CommentType.APPROVAL;
        comment.approvalResult = ApprovalResult.APPROVED;
        comment.approvalResultDisplay = '审批通过';
        comment.content = options?.comment || '装机条件满足，审批通过';

        if (options?.flightId) {
          const flight = await this.flightRepo.findOneBy({ id: options.flightId });
          if (flight) {
            waybill.flightId = flight.id;
            waybill.airlineCode = flight.airlineCode;
          }
        }

        const consigneeUsers = await this.userRepo.find({
          where: { role: UserRole.CONSIGNEE, active: true },
        });
        if (consigneeUsers.length > 0) {
          nextResponsible = consigneeUsers[0];
          nextNode = BusinessNode.IN_TRANSIT;
        }
        break;

      case LoadingActionType.REJECT:
        toStatus = WaybillStatus.SECURITY_REJECTED;
        flowType = FlowType.REJECT;
        content = options?.rejectReason || '装机驳回';
        comment.type = CommentType.REJECTION;
        comment.approvalResult = ApprovalResult.REJECTED;
        comment.approvalResultDisplay = '审批驳回';
        comment.rejectReason = options?.rejectReason;
        comment.content = options?.rejectReason || '装机条件不满足，驳回重新处理';

        if (waybill.forwarder) {
          nextResponsible = waybill.forwarder;
          nextNode = BusinessNode.SECURITY;
        }
        break;

      case LoadingActionType.SUPPLEMENT:
        toStatus = WaybillStatus.SECURITY_PASSED;
        flowType = FlowType.ACTION;
        content = options?.supplementRequirements || '需要补充资料';
        comment.type = CommentType.INQUIRY;
        comment.content = options?.supplementRequirements || '请补充装机相关资料';

        if (waybill.forwarder) {
          nextResponsible = waybill.forwarder;
          nextNode = BusinessNode.LOADING;
        }
        break;

      case LoadingActionType.REASSIGN:
        toStatus = WaybillStatus.SECURITY_PASSED;
        flowType = FlowType.ACTION;
        content = options?.reassignmentReason || '装机转派';
        comment.type = CommentType.INSTRUCTION;
        comment.content = options?.reassignmentReason || '转派给其他人员处理';

        if (options?.reassignedToId) {
          const reassignedUser = await this.userRepo.findOneBy({ id: options.reassignedToId });
          if (reassignedUser) {
            nextResponsible = reassignedUser;
            nextNode = BusinessNode.LOADING;
          }
        }
        break;

      default:
        throw new Error('未知的装机操作类型');
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus,
      operator,
      flowType,
      flowNode: FlowNode.LOADING,
      content,
      rejectReason: options?.rejectReason,
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    if (actionType === LoadingActionType.PASS) {
      waybill.loadingDate = new Date();

      for (const detail of waybill.details) {
        detail.status = DetailStatus.LOADED;
        detail.statusDisplay = '已装机';
        detail.loadedDate = new Date();
        detail.loadedBy = operator.id;
      }

      await this.detailRepo.save(waybill.details);

      const spaces = await this.spaceRepo.find({
        where: { masterWaybillId: waybill.id },
      });
      for (const space of spaces) {
        space.status = SpaceStatus.OCCUPIED;
        space.statusDisplay = '已占用';
      }
      await this.spaceRepo.save(spaces);
    }

    const savedComment = await this.commentRepo.save(comment);

    await this.waybillRepo.save(waybill);

    let todo: Todo | undefined;
    if (nextResponsible && nextNode) {
      let todoTitle: string;
      let todoDescription: string;

      if (actionType === LoadingActionType.PASS) {
        todoTitle = `运单 ${waybill.masterNo} 运输中`;
        todoDescription = '货物已装机，正在运输中，请关注到港信息';
      } else if (actionType === LoadingActionType.REJECT) {
        todoTitle = `运单 ${waybill.masterNo} 装机驳回处理`;
        todoDescription = options?.rejectReason || '装机被驳回，请重新处理';
      } else if (actionType === LoadingActionType.SUPPLEMENT) {
        todoTitle = `运单 ${waybill.masterNo} 补充装机资料`;
        todoDescription = options?.supplementRequirements || '请补充装机相关资料';
      } else {
        todoTitle = `运单 ${waybill.masterNo} 装机处理`;
        todoDescription = options?.reassignmentReason || '请处理装机相关事宜';
      }

      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        nextNode,
        todoTitle,
        {
          description: todoDescription,
          priority: actionType === LoadingActionType.REJECT ? TodoPriority.URGENT : TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    if (waybill.forwarder) {
      let notificationTitle: string;
      let notificationContent: string;

      if (actionType === LoadingActionType.PASS) {
        notificationTitle = `运单 ${waybill.masterNo} 已装机`;
        notificationContent = '货物已装机，正在运输中';
      } else if (actionType === LoadingActionType.REJECT) {
        notificationTitle = `运单 ${waybill.masterNo} 装机驳回`;
        notificationContent = options?.rejectReason || '装机被驳回，请重新处理';
      } else {
        notificationTitle = `运单 ${waybill.masterNo} 装机处理中`;
        notificationContent = '装机相关事宜正在处理中';
      }

      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        notificationTitle,
        notificationContent,
        {
          type: actionType === LoadingActionType.PASS ? NotificationType.STATUS_CHANGE : NotificationType.EXCEPTION,
          priority: actionType === LoadingActionType.PASS ? NotificationPriority.NORMAL : NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '装机已处理，待办自动完成');

    await this.auditService.logWaybillAction(
      operator,
      waybill,
      actionType === LoadingActionType.PASS ? AuditAction.APPROVE : AuditAction.UPDATE,
      `装机${this.getActionDisplay(actionType)}`,
      { status: fromStatus },
      { status: toStatus },
      ['status', 'loadingDate']
    );

    return {
      waybill,
      statusFlow,
      comment: savedComment,
      todo,
    };
  }

  private getActionDisplay(actionType: LoadingActionType): string {
    const map: Record<LoadingActionType, string> = {
      [LoadingActionType.PASS]: '通过',
      [LoadingActionType.REJECT]: '驳回',
      [LoadingActionType.SUPPLEMENT]: '需补充',
      [LoadingActionType.REASSIGN]: '转派',
    };
    return map[actionType] || actionType;
  }

  async markInTransit(waybillId: string, operator: User): Promise<{
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

    if (waybill.status !== WaybillStatus.LOADING) {
      throw new Error('运单状态不允许标记为运输中');
    }

    const fromStatus = waybill.status;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.IN_TRANSIT,
      operator,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: FlowNode.IN_TRANSIT,
      content: '航班已起飞，货物运输中',
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.actualDepartureDate = new Date();

    for (const detail of waybill.details) {
      detail.status = DetailStatus.IN_TRANSIT;
      detail.statusDisplay = '运输中';
    }

    await this.detailRepo.save(waybill.details);
    await this.waybillRepo.save(waybill);

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 已起飞`,
        '航班已起飞，货物正在运输中',
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.NORMAL,
        }
      );
    }

    await this.auditService.logWaybillAction(
      operator,
      waybill,
      AuditAction.UPDATE,
      '航班已起飞，货物运输中',
      { status: fromStatus },
      { status: WaybillStatus.IN_TRANSIT },
      ['status', 'actualDepartureDate']
    );

    return {
      waybill,
      statusFlow,
    };
  }
}
