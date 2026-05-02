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
  NotificationType,
  NotificationPriority,
  AuditAction,
} from '../entities';
import { ReceivingRequest, BusinessNode } from '../types';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class ReceivingService {
  private waybillRepo: Repository<MasterWaybill>;
  private detailRepo: Repository<WaybillDetail>;
  private spaceRepo: Repository<Space>;
  private userRepo: Repository<User>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.detailRepo = AppDataSource.getRepository(WaybillDetail);
    this.spaceRepo = AppDataSource.getRepository(Space);
    this.userRepo = AppDataSource.getRepository(User);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async lockSpace(spaceId: string, waybill: MasterWaybill, operator: User): Promise<Space> {
    const space = await this.spaceRepo.findOneBy({ id: spaceId });

    if (!space) {
      throw new Error('舱位不存在');
    }

    if (space.status !== SpaceStatus.AVAILABLE) {
      throw new Error('舱位已被锁定或占用');
    }

    if (space.masterWaybillId && space.masterWaybillId !== waybill.id) {
      throw new Error('舱位已被其他运单占用');
    }

    const totalWeight = waybill.totalWeight;
    const totalVolume = waybill.totalVolume;

    if (space.maxWeight && totalWeight > space.maxWeight) {
      throw new Error('货物重量超过舱位限制');
    }

    space.status = SpaceStatus.LOCKED;
    space.statusDisplay = '已锁定';
    space.lockedBy = operator.id;
    space.lockedAt = new Date();
    space.lockReason = '收货称重';
    space.masterWaybillId = waybill.id;
    space.masterNo = waybill.masterNo;
    space.allocatedWeight = totalWeight;
    space.allocatedVolume = totalVolume;

    const lockExpireTime = new Date();
    lockExpireTime.setMinutes(lockExpireTime.getMinutes() + 30);
    space.lockExpireTime = lockExpireTime;

    const savedSpace = await this.spaceRepo.save(space);

    await this.auditService.log(
      {
        operator,
        action: AuditAction.LOCK,
        entityType: 'Space',
        entityId: space.id,
        entityNo: space.spaceNo,
        description: `锁定舱位用于运单 ${waybill.masterNo}`,
      }
    );

    return savedSpace;
  }

  async releaseSpace(spaceId: string, operator: User, reason?: string): Promise<Space> {
    const space = await this.spaceRepo.findOneBy({ id: spaceId });

    if (!space) {
      throw new Error('舱位不存在');
    }

    if (space.status === SpaceStatus.OCCUPIED) {
      throw new Error('已占用的舱位无法释放');
    }

    space.status = SpaceStatus.AVAILABLE;
    space.statusDisplay = '可用';
    space.releasedAt = new Date();
    space.releasedBy = operator.id;
    space.releaseReason = reason || '操作取消';

    const savedSpace = await this.spaceRepo.save(space);

    await this.auditService.log(
      {
        operator,
        action: AuditAction.UNLOCK,
        entityType: 'Space',
        entityId: space.id,
        entityNo: space.spaceNo,
        description: reason || '释放舱位',
      }
    );

    return savedSpace;
  }

  async startReceiving(waybillId: string, warehouseUser: User): Promise<{
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

    if (warehouseUser.role !== UserRole.WAREHOUSE) {
      throw new Error('只有仓库用户可以进行收货操作');
    }

    if (waybill.status !== WaybillStatus.BOOKING_CONFIRMED) {
      throw new Error('运单状态不允许开始收货');
    }

    const fromStatus = waybill.status;

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.RECEIVING,
      operator: warehouseUser,
      flowType: FlowType.STATUS_CHANGE,
      flowNode: FlowNode.RECEIVING,
      content: '开始收货称重',
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.receivingDate = new Date();

    await this.waybillRepo.save(waybill);

    await this.notificationService.createNotification(
      waybill.forwarder!,
      waybill,
      `运单 ${waybill.masterNo} 开始收货`,
      '仓库已开始处理您的货物收货称重',
      {
        type: NotificationType.STATUS_CHANGE,
        priority: NotificationPriority.NORMAL,
      }
    );

    await this.auditService.logWaybillAction(
      warehouseUser,
      waybill,
      AuditAction.UPDATE,
      '开始收货称重',
      { status: fromStatus },
      { status: WaybillStatus.RECEIVING },
      ['status']
    );

    return {
      waybill,
      statusFlow,
    };
  }

  async completeReceiving(request: ReceivingRequest, warehouseUser: User): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    todo: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: request.waybillId },
      relations: ['forwarder', 'details'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (warehouseUser.role !== UserRole.WAREHOUSE) {
      throw new Error('只有仓库用户可以完成收货');
    }

    if (waybill.status !== WaybillStatus.RECEIVING) {
      throw new Error('运单状态不允许完成收货');
    }

    const space = await this.lockSpace(request.spaceId, waybill, warehouseUser);

    const fromStatus = waybill.status;

    let totalPieces = 0;
    let totalWeight = 0;
    let totalVolume = 0;

    for (const detailRequest of request.details) {
      const detail = waybill.details.find((d) => d.id === detailRequest.detailId);
      if (detail) {
        detail.pieces = detailRequest.actualPieces;
        detail.weight = detailRequest.actualWeight;
        detail.volume = detailRequest.actualVolume || 0;
        detail.status = DetailStatus.RECEIVED;
        detail.statusDisplay = '已收货';
        detail.receivedDate = new Date();
        detail.receivedBy = warehouseUser.id;
        detail.remark = detailRequest.remark;

        totalPieces += detail.pieces;
        totalWeight += detail.weight;
        totalVolume += detail.volume;
      }
    }

    waybill.totalPieces = totalPieces;
    waybill.totalWeight = totalWeight;
    waybill.totalVolume = totalVolume;

    space.status = SpaceStatus.OCCUPIED;
    space.statusDisplay = '已占用';
    space.allocatedBy = warehouseUser.id;
    space.allocatedAt = new Date();

    const securityUsers = await this.userRepo.find({
      where: { role: UserRole.SECURITY, active: true },
    });

    let nextResponsible: User | null = null;
    if (securityUsers.length > 0) {
      nextResponsible = securityUsers[0];
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.RECEIVED,
      operator: warehouseUser,
      flowType: FlowType.ACTION,
      flowNode: FlowNode.RECEIVING,
      content: request.remark || '收货称重完成',
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode: BusinessNode.SECURITY,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    await this.detailRepo.save(waybill.details);
    await this.spaceRepo.save(space);
    await this.waybillRepo.save(waybill);

    let todo: Todo | null = null;
    if (nextResponsible) {
      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        BusinessNode.SECURITY,
        `运单 ${waybill.masterNo} 安检检查`,
        {
          description: '收货已完成，请进行安检检查',
          priority: TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 收货完成`,
        `收货称重完成，共 ${totalPieces} 件，${totalWeight} 公斤，等待安检`,
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybill.id, '收货已完成，待办自动完成');

    await this.auditService.logWaybillAction(
      warehouseUser,
      waybill,
      AuditAction.UPDATE,
      '完成收货称重',
      { status: fromStatus, details: waybill.details.map((d) => ({ pieces: d.pieces, weight: d.weight })) },
      { status: WaybillStatus.RECEIVED, totalPieces, totalWeight },
      ['status', 'totalPieces', 'totalWeight', 'details']
    );

    return {
      waybill,
      statusFlow,
      todo: todo!,
    };
  }

  async getAvailableSpaces(
    originAirport: string,
    destinationAirport: string,
    options?: Partial<{
      airlineCode: string;
      spaceType: string;
      page: number;
      pageSize: number;
    }>
  ): Promise<{ items: Space[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.spaceRepo
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.flight', 'flight')
      .where('space.status = :status', { status: SpaceStatus.AVAILABLE });

    if (originAirport) {
      queryBuilder.andWhere('flight.originAirport = :originAirport', { originAirport });
    }
    if (destinationAirport) {
      queryBuilder.andWhere('flight.destinationAirport = :destinationAirport', { destinationAirport });
    }
    if (options?.airlineCode) {
      queryBuilder.andWhere('flight.airlineCode = :airlineCode', { airlineCode: options.airlineCode });
    }
    if (options?.spaceType) {
      queryBuilder.andWhere('space.type = :spaceType', { spaceType: options.spaceType });
    }

    queryBuilder.skip(skip).take(pageSize).orderBy('space.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }
}
