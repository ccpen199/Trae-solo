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
  SecurityCheck,
  SecurityCheckResult,
  SecurityCheckLevel,
  NotificationType,
  NotificationPriority,
  AuditAction,
} from '../entities';
import { SecurityCheckRequest, BusinessNode, LoadingActionType } from '../types';
import { numberGenerator } from './NumberGeneratorService';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class SecurityService {
  private waybillRepo: Repository<MasterWaybill>;
  private detailRepo: Repository<WaybillDetail>;
  private securityCheckRepo: Repository<SecurityCheck>;
  private userRepo: Repository<User>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.detailRepo = AppDataSource.getRepository(WaybillDetail);
    this.securityCheckRepo = AppDataSource.getRepository(SecurityCheck);
    this.userRepo = AppDataSource.getRepository(User);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async startSecurityCheck(waybillId: string, securityUser: User): Promise<{
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

    if (securityUser.role !== UserRole.SECURITY) {
      throw new Error('只有安检用户可以进行安检操作');
    }

    if (waybill.status !== WaybillStatus.RECEIVED) {
      throw new Error('运单状态不允许开始安检');
    }

    const fromStatus = waybill.status;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.SECURITY_CHECKING,
      operator: securityUser,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: FlowNode.SECURITY,
      content: '开始安检检查',
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.securityDate = new Date();

    await this.waybillRepo.save(waybill);

    await this.notificationService.createNotification(
      waybill.forwarder!,
      waybill,
      `运单 ${waybill.masterNo} 开始安检`,
      '安检已开始处理您的货物',
      {
        type: NotificationType.STATUS_CHANGE,
        priority: NotificationPriority.NORMAL,
      }
    );

    await this.auditService.logWaybillAction(
      securityUser,
      waybill,
      AuditAction.UPDATE,
      '开始安检检查',
      { status: fromStatus },
      { status: WaybillStatus.SECURITY_CHECKING },
      ['status']
    );

    return {
      waybill,
      statusFlow,
    };
  }

  async processSecurityCheck(request: SecurityCheckRequest, securityUser: User): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    securityCheck: SecurityCheck;
    todo?: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: request.waybillId },
      relations: ['forwarder', 'details'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (securityUser.role !== UserRole.SECURITY) {
      throw new Error('只有安检用户可以完成安检');
    }

    if (waybill.status !== WaybillStatus.SECURITY_CHECKING) {
      throw new Error('运单状态不允许处理安检');
    }

    const result = request.result as SecurityCheckResult;
    const checkLevel = (request.checkLevel as SecurityCheckLevel) || SecurityCheckLevel.LEVEL_1;

    const securityCheck = new SecurityCheck();
    securityCheck.checkNo = numberGenerator.generateCheckNo();
    securityCheck.masterWaybillId = waybill.id;
    securityCheck.checkLevel = checkLevel;
    securityCheck.checkLevelDisplay = this.getCheckLevelDisplay(checkLevel);
    securityCheck.result = result;
    securityCheck.resultDisplay = this.getCheckResultDisplay(result);
    securityCheck.checkStartTime = new Date();
    securityCheck.checkEndTime = new Date();
    securityCheck.checkerId = securityUser.id;
    securityCheck.checkerName = securityUser.name;
    securityCheck.checkerRole = securityUser.role;
    securityCheck.checkLocation = request.checkLocation;
    securityCheck.checkMethod = request.checkMethod;
    securityCheck.findings = request.findings;
    securityCheck.rejectReason = request.rejectReason;
    securityCheck.rejectCategory = request.rejectCategory;
    securityCheck.supplementRequirements = request.supplementRequirements;
    securityCheck.reassignedToId = request.reassignedToId;
    securityCheck.reassignedToName = request.reassignedToName;
    securityCheck.reassignmentReason = request.reassignmentReason;
    securityCheck.isDangerousGoods = request.isDangerousGoods || false;
    securityCheck.dangerousGoodsClass = request.dangerousGoodsClass;
    securityCheck.dangerousGoodsUnNo = request.dangerousGoodsUnNo;
    securityCheck.dangerousGoodsDescription = request.dangerousGoodsDescription;
    securityCheck.specialHandlingInstructions = request.specialHandlingInstructions;
    securityCheck.remark = request.remark;

    const detailIds = request.detailIds || waybill.details.map((d) => d.id);

    for (const detail of waybill.details) {
      if (detailIds.includes(detail.id)) {
        detail.securityCheckResult = result;
        detail.securityCheckDate = new Date();
        detail.securityCheckerId = securityUser.id;
        detail.securityRejectReason = request.rejectReason;

        if (result === SecurityCheckResult.PASSED) {
          detail.status = DetailStatus.SECURITY_PASSED;
          detail.statusDisplay = '安检通过';
        } else if (result === SecurityCheckResult.REJECTED) {
          detail.status = DetailStatus.SECURITY_REJECTED;
          detail.statusDisplay = '安检驳回';
        }
      }
    }

    const fromStatus = waybill.status;
    let toStatus: WaybillStatus;
    let flowType: FlowType;
    let content: string;

    if (result === SecurityCheckResult.PASSED) {
      toStatus = WaybillStatus.SECURITY_PASSED;
      flowType = FlowType.APPROVAL;
      content = '安检通过';
    } else if (result === SecurityCheckResult.REJECTED) {
      toStatus = WaybillStatus.SECURITY_REJECTED;
      flowType = FlowType.REJECT;
      content = request.rejectReason || '安检驳回';
    } else if (result === SecurityCheckResult.NEED_SUPPLEMENT) {
      toStatus = WaybillStatus.SECURITY_CHECKING;
      flowType = FlowType.ACTION;
      content = request.supplementRequirements || '需要补充资料';
    } else if (result === SecurityCheckResult.REASSIGNED) {
      toStatus = WaybillStatus.SECURITY_CHECKING;
      flowType = FlowType.ACTION;
      content = request.reassignmentReason || '安检转派';
    } else {
      toStatus = WaybillStatus.SECURITY_CHECKING;
      flowType = FlowType.ACTION;
      content = '安检处理中';
    }

    let nextResponsible: User | null = null;
    let nextNode: BusinessNode | undefined;

    if (result === SecurityCheckResult.PASSED) {
      const airlineUsers = await this.userRepo.find({
        where: { role: UserRole.AIRLINE, active: true },
      });
      if (airlineUsers.length > 0) {
        nextResponsible = airlineUsers[0];
        nextNode = BusinessNode.LOADING;
      }
    } else if (result === SecurityCheckResult.REJECTED) {
      if (waybill.forwarder) {
        nextResponsible = waybill.forwarder;
        nextNode = BusinessNode.SECURITY;
      }
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus,
      operator: securityUser,
      flowType,
      flowNode: FlowNode.SECURITY,
      content,
      rejectReason: request.rejectReason,
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    const savedSecurityCheck = await this.securityCheckRepo.save(securityCheck);
    await this.detailRepo.save(waybill.details);

    let todo: Todo | undefined;
    if (nextResponsible && nextNode) {
      let todoTitle: string;
      let todoDescription: string;

      if (result === SecurityCheckResult.PASSED) {
        todoTitle = `运单 ${waybill.masterNo} 装机安排`;
        todoDescription = '安检已通过，请安排装机';
      } else if (result === SecurityCheckResult.REJECTED) {
        todoTitle = `运单 ${waybill.masterNo} 安检驳回处理`;
        todoDescription = `安检驳回: ${request.rejectReason || '请重新处理'}`;
      } else {
        todoTitle = `运单 ${waybill.masterNo} 安检补充处理`;
        todoDescription = request.supplementRequirements || '请补充安检资料';
      }

      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        nextNode,
        todoTitle,
        {
          description: todoDescription,
          priority: result === SecurityCheckResult.REJECTED ? TodoPriority.URGENT : TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    if (waybill.forwarder) {
      let notificationTitle: string;
      let notificationContent: string;

      if (result === SecurityCheckResult.PASSED) {
        notificationTitle = `运单 ${waybill.masterNo} 安检通过`;
        notificationContent = '安检已通过，等待装机运输';
      } else if (result === SecurityCheckResult.REJECTED) {
        notificationTitle = `运单 ${waybill.masterNo} 安检驳回`;
        notificationContent = `安检驳回原因: ${request.rejectReason || '请联系安检部门'}`;
      } else if (result === SecurityCheckResult.NEED_SUPPLEMENT) {
        notificationTitle = `运单 ${waybill.masterNo} 需要补充资料`;
        notificationContent = `补充要求: ${request.supplementRequirements || '请联系安检部门'}`;
      } else {
        notificationTitle = `运单 ${waybill.masterNo} 安检处理中`;
        notificationContent = '安检正在处理中';
      }

      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        notificationTitle,
        notificationContent,
        {
          type: result === SecurityCheckResult.PASSED ? NotificationType.STATUS_CHANGE : NotificationType.EXCEPTION,
          priority: result === SecurityCheckResult.PASSED ? NotificationPriority.NORMAL : NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '安检已处理，待办自动完成');

    await this.auditService.logWaybillAction(
      securityUser,
      waybill,
      result === SecurityCheckResult.PASSED ? AuditAction.APPROVE : AuditAction.REJECT,
      `安检${this.getCheckResultDisplay(result)}`,
      { status: fromStatus, securityStatus: waybill.status },
      { status: toStatus, securityResult: result },
      ['status', 'securityDate']
    );

    return {
      waybill,
      statusFlow,
      securityCheck: savedSecurityCheck,
      todo,
    };
  }

  private getCheckLevelDisplay(level: SecurityCheckLevel): string {
    const map: Record<SecurityCheckLevel, string> = {
      [SecurityCheckLevel.LEVEL_1]: '一级检查',
      [SecurityCheckLevel.LEVEL_2]: '二级检查',
      [SecurityCheckLevel.LEVEL_3]: '三级检查',
      [SecurityCheckLevel.SPECIAL]: '专项检查',
    };
    return map[level] || level;
  }

  private getCheckResultDisplay(result: SecurityCheckResult): string {
    const map: Record<SecurityCheckResult, string> = {
      [SecurityCheckResult.PENDING]: '待检查',
      [SecurityCheckResult.PASSED]: '通过',
      [SecurityCheckResult.REJECTED]: '驳回',
      [SecurityCheckResult.NEED_SUPPLEMENT]: '需补充',
      [SecurityCheckResult.REASSIGNED]: '已转派',
    };
    return map[result] || result;
  }

  async getWaybillSecurityChecks(waybillId: string): Promise<SecurityCheck[]> {
    return this.securityCheckRepo.find({
      where: { masterWaybillId: waybillId },
      order: { createdAt: 'DESC' },
    });
  }
}
