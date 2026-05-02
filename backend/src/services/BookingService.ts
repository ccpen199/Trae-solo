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
  TodoStatus,
  TodoPriority,
  TodoSource,
  Flight,
  Space,
  SpaceStatus,
  SpaceType,
  Notification,
  NotificationType,
  NotificationPriority,
  AuditAction,
} from '../entities';
import { BookingRequest, WaybillDetailRequest, BusinessNode } from '../types';
import { numberGenerator } from './NumberGeneratorService';
import { StatusFlowService, StatusChangeContext } from './StatusFlowService';
import { TodoService } from './TodoService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class BookingService {
  private waybillRepo: Repository<MasterWaybill>;
  private detailRepo: Repository<WaybillDetail>;
  private userRepo: Repository<User>;
  private flightRepo: Repository<Flight>;
  private spaceRepo: Repository<Space>;

  private statusFlowService: StatusFlowService;
  private todoService: TodoService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.detailRepo = AppDataSource.getRepository(WaybillDetail);
    this.userRepo = AppDataSource.getRepository(User);
    this.flightRepo = AppDataSource.getRepository(Flight);
    this.spaceRepo = AppDataSource.getRepository(Space);

    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  async createBooking(forwarder: User, request: BookingRequest): Promise<{
    waybill: MasterWaybill;
    details: WaybillDetail[];
    statusFlow: StatusFlow;
    todo: Todo | null;
    notifications: Notification[];
  }> {
    return await AppDataSource.transaction(async (entityManager: EntityManager) => {
      const waybill = new MasterWaybill();
      waybill.masterNo = numberGenerator.generateMasterNo();
      waybill.bookingNo = numberGenerator.generateBookingNo();
      waybill.status = WaybillStatus.DRAFT;
      waybill.statusDisplay = StatusFlowService.getStatusDisplay(WaybillStatus.DRAFT);
      waybill.forwarderId = forwarder.id;
      waybill.forwarder = forwarder;
      waybill.originAirport = request.originAirport;
      waybill.destinationAirport = request.destinationAirport;
      waybill.shipperName = request.shipperName;
      waybill.shipperPhone = request.shipperPhone;
      waybill.shipperAddress = request.shipperAddress;
      waybill.consigneeName = request.consigneeName;
      waybill.consigneePhone = request.consigneePhone;
      waybill.consigneeAddress = request.consigneeAddress;
      waybill.airlineCode = request.airlineCode;
      waybill.flightId = request.flightId;
      waybill.goodsDescription = request.goodsDescription;
      waybill.goodsType = request.goodsType;
      waybill.isDangerous = request.isDangerous || false;
      waybill.dangerousGoodsInfo = request.dangerousGoodsInfo;
      waybill.priority = request.priority || 'normal';
      waybill.remark = request.remark;
      waybill.currentNode = FlowNode.BOOKING;
      waybill.currentResponsibleId = forwarder.id;
      waybill.currentResponsibleRole = forwarder.role;

      if (request.expectedDepartureDate) {
        waybill.expectedDepartureDate = new Date(request.expectedDepartureDate);
      }
      if (request.expectedArrivalDate) {
        waybill.expectedArrivalDate = new Date(request.expectedArrivalDate);
      }

      let totalPieces = 0;
      let totalWeight = 0;
      let totalVolume = 0;

      const details: WaybillDetail[] = [];
      for (const detailRequest of request.details) {
        const detail = new WaybillDetail();
        detail.detailNo = numberGenerator.generateDetailNo();
        detail.masterWaybillId = waybill.id;
        detail.lineNo = detailRequest.lineNo;
        detail.goodsName = detailRequest.goodsName;
        detail.goodsCode = detailRequest.goodsCode;
        detail.goodsType = detailRequest.goodsType;
        detail.pieces = detailRequest.pieces;
        detail.unit = detailRequest.unit || '件';
        detail.weight = detailRequest.weight;
        detail.volume = detailRequest.volume;
        detail.length = detailRequest.length;
        detail.width = detailRequest.width;
        detail.height = detailRequest.height;
        detail.isDangerous = detailRequest.isDangerous || false;
        detail.dangerousClass = detailRequest.dangerousClass;
        detail.unNumber = detailRequest.unNumber;
        detail.packingType = detailRequest.packingType;
        detail.markNo = detailRequest.markNo;
        detail.description = detailRequest.description;
        detail.status = DetailStatus.PENDING;
        detail.statusDisplay = '待处理';

        totalPieces += detail.pieces;
        totalWeight += detail.weight;
        if (detail.volume) {
          totalVolume += detail.volume;
        }

        details.push(detail);
      }

      waybill.totalPieces = totalPieces;
      waybill.totalWeight = totalWeight;
      waybill.totalVolume = totalVolume;

      const savedWaybill = await entityManager.save(waybill);

      for (const detail of details) {
        detail.masterWaybillId = savedWaybill.id;
      }
      const savedDetails = await entityManager.save(details);

      await this.auditService.logWaybillAction(
        forwarder,
        savedWaybill,
        AuditAction.CREATE,
        '创建订舱单',
        null,
        savedWaybill,
        ['masterNo', 'bookingNo', 'status', 'forwarderId', 'originAirport', 'destinationAirport', 'totalPieces', 'totalWeight']
      );

      return {
        waybill: savedWaybill,
        details: savedDetails,
        statusFlow: null as any,
        todo: null,
        notifications: [],
      };
    });
  }

  async submitBooking(waybillId: string, forwarder: User): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    todo: Todo;
    notifications: Notification[];
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (waybill.forwarderId !== forwarder.id) {
      throw new Error('无权操作此运单');
    }

    if (waybill.status !== WaybillStatus.DRAFT) {
      throw new Error('运单状态不允许提交');
    }

    const fromStatus = waybill.status;

    const airlineUsers = await this.userRepo.find({
      where: { role: UserRole.AIRLINE, active: true },
    });

    let nextResponsible: User | null = null;
    if (airlineUsers.length > 0) {
      nextResponsible = airlineUsers[0];
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.BOOKING_SUBMITTED,
      operator: forwarder,
      flowType: FlowType.ACTION,
      flowNode: FlowNode.BOOKING,
      content: '货代提交订舱申请',
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode: BusinessNode.BOOKING,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    waybill.bookingDate = new Date();

    await this.waybillRepo.save(waybill);

    let todo: Todo | null = null;
    if (nextResponsible) {
      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        BusinessNode.BOOKING,
        `运单 ${waybill.masterNo} 订舱审核`,
        {
          description: '货代已提交订舱申请，请审核确认舱位',
          priority: TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    const notifications: Notification[] = [];

    await this.notificationService.createNotification(
      forwarder,
      waybill,
      `运单 ${waybill.masterNo} 已提交`,
      '您的订舱申请已提交，等待航司确认',
      {
        type: NotificationType.STATUS_CHANGE,
        priority: NotificationPriority.NORMAL,
      }
    );

    await this.auditService.logWaybillAction(
      forwarder,
      waybill,
      AuditAction.UPDATE,
      '提交订舱申请',
      { status: fromStatus },
      { status: WaybillStatus.BOOKING_SUBMITTED },
      ['status']
    );

    return {
      waybill,
      statusFlow,
      todo: todo!,
      notifications,
    };
  }

  async confirmBooking(waybillId: string, airlineUser: User, flightId?: string): Promise<{
    waybill: MasterWaybill;
    statusFlow: StatusFlow;
    todo: Todo;
  }> {
    const waybill = await this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder'],
    });

    if (!waybill) {
      throw new Error('运单不存在');
    }

    if (airlineUser.role !== UserRole.AIRLINE) {
      throw new Error('只有航司用户可以确认订舱');
    }

    if (waybill.status !== WaybillStatus.BOOKING_SUBMITTED) {
      throw new Error('运单状态不允许确认');
    }

    const fromStatus = waybill.status;

    if (flightId) {
      const flight = await this.flightRepo.findOneBy({ id: flightId });
      if (flight) {
        waybill.flightId = flightId;
        waybill.airlineCode = flight.airlineCode;
      }
    }

    const warehouseUsers = await this.userRepo.find({
      where: { role: UserRole.WAREHOUSE, active: true },
    });

    let nextResponsible: User | null = null;
    if (warehouseUsers.length > 0) {
      nextResponsible = warehouseUsers[0];
    }

    const context: StatusChangeContext = {
      waybill,
      fromStatus,
      toStatus: WaybillStatus.BOOKING_CONFIRMED,
      operator: airlineUser,
      flowType: FlowType.APPROVAL,
      flowNode: FlowNode.BOOKING,
      content: '航司确认订舱',
      nextResponsibleId: nextResponsible?.id,
      nextResponsibleRole: nextResponsible?.role,
      nextNode: BusinessNode.RECEIVING,
    };

    const statusFlow = await this.statusFlowService.createStatusFlow(context);

    await this.waybillRepo.save(waybill);

    let todo: Todo | null = null;
    if (nextResponsible) {
      todo = await this.todoService.createTodo(
        waybill,
        nextResponsible,
        BusinessNode.RECEIVING,
        `运单 ${waybill.masterNo} 收货称重`,
        {
          description: '订舱已确认，请准备收货称重',
          priority: TodoPriority.HIGH,
        }
      );

      await this.notificationService.createTodoNotification(nextResponsible, waybill, todo.title);
    }

    if (waybill.forwarder) {
      await this.notificationService.createNotification(
        waybill.forwarder,
        waybill,
        `运单 ${waybill.masterNo} 订舱已确认`,
        '您的订舱申请已被航司确认，请安排货物入仓',
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.HIGH,
        }
      );
    }

    await this.todoService.cancelWaybillTodos(waybillId, '订舱已确认，待办自动完成');

    await this.auditService.logWaybillAction(
      airlineUser,
      waybill,
      AuditAction.APPROVE,
      '航司确认订舱',
      { status: fromStatus },
      { status: WaybillStatus.BOOKING_CONFIRMED },
      ['status', 'flightId']
    );

    return {
      waybill,
      statusFlow,
      todo: todo!,
    };
  }

  async getWaybillById(waybillId: string): Promise<MasterWaybill | null> {
    return this.waybillRepo.findOne({
      where: { id: waybillId },
      relations: ['forwarder', 'flight', 'details'],
    });
  }

  async getWaybillList(
    options?: Partial<{
      status: WaybillStatus;
      forwarderId: string;
      originAirport: string;
      destinationAirport: string;
      page: number;
      pageSize: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }>
  ): Promise<{ items: MasterWaybill[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {};

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.forwarderId) {
      where.forwarderId = options.forwarderId;
    }
    if (options?.originAirport) {
      where.originAirport = options.originAirport;
    }
    if (options?.destinationAirport) {
      where.destinationAirport = options.destinationAirport;
    }

    const order: Record<string, any> = {};
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';
    order[sortBy] = sortOrder;

    const [items, total] = await this.waybillRepo.findAndCount({
      where,
      order,
      skip,
      take: pageSize,
      relations: ['forwarder', 'flight'],
    });

    return { items, total };
  }
}
