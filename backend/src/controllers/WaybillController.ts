import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import {
  MasterWaybill,
  User,
  UserRole,
  WaybillDetail,
  StatusFlow,
  Comment,
  CommentType,
  Todo,
  Notification,
  SecurityCheck,
  Space,
  SpaceStatus,
  Flight,
  WaybillStatus,
} from '../entities';
import {
  BookingService,
  ReceivingService,
  SecurityService,
  LoadingService,
  ArrivalService,
  StatusFlowService,
  TodoService,
  NotificationService,
} from '../services';
import {
  BookingRequest,
  ReceivingRequest,
  SecurityCheckRequest,
  LoadingRequest,
  ArrivalRequest,
  PickupRequest,
  LoadingActionType,
} from '../types';
import * as response from '../utils/response';

export class WaybillController {
  private waybillRepo;
  private userRepo;
  private bookingService;
  private receivingService;
  private securityService;
  private loadingService;
  private arrivalService;
  private statusFlowService;
  private todoService;
  private notificationService;

  constructor() {
    this.waybillRepo = AppDataSource.getRepository(MasterWaybill);
    this.userRepo = AppDataSource.getRepository(User);
    this.bookingService = new BookingService();
    this.receivingService = new ReceivingService();
    this.securityService = new SecurityService();
    this.loadingService = new LoadingService();
    this.arrivalService = new ArrivalService();
    this.statusFlowService = new StatusFlowService();
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
  }

  async getMockUser(): Promise<User> {
    let user = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!user) {
      user = new User();
      user.username = 'admin';
      user.password = 'admin123';
      user.name = '系统管理员';
      user.role = UserRole.ADMIN;
      user.active = true;
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async getForwarderUser(): Promise<User> {
    let user = await this.userRepo.findOne({ where: { username: 'forwarder' } });
    if (!user) {
      user = new User();
      user.username = 'forwarder';
      user.password = '123456';
      user.name = '货代用户';
      user.role = UserRole.FORWARDER;
      user.active = true;
      user.companyName = '示例货代公司';
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async createDraftWaybill(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.getForwarderUser();
      const request = req.body as BookingRequest;

      const result = await this.bookingService.createBooking(user, request);

      res.json(response.success(result, '订舱草稿创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async submitBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const user = await this.getForwarderUser();

      const result = await this.bookingService.submitBooking(waybillId, user);

      res.json(response.success(result, '订舱提交成功'));
    } catch (error) {
      next(error);
    }
  }

  async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const { flightId } = req.body;
      const user = await this.getMockUser();

      let airlineUser = await this.userRepo.findOne({ where: { username: 'airline' } });
      if (!airlineUser) {
        airlineUser = new User();
        airlineUser.username = 'airline';
        airlineUser.password = '123456';
        airlineUser.name = '航司用户';
        airlineUser.role = UserRole.AIRLINE;
        airlineUser.active = true;
        airlineUser = await this.userRepo.save(airlineUser);
      }

      const result = await this.bookingService.confirmBooking(waybillId, airlineUser, flightId);

      res.json(response.success(result, '订舱确认成功'));
    } catch (error) {
      next(error);
    }
  }

  async getWaybillList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 20, status, forwarderId, originAirport, destinationAirport, sortBy, sortOrder } = req.query;

      const result = await this.bookingService.getWaybillList({
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as WaybillStatus,
        forwarderId: forwarderId as string,
        originAirport: originAirport as string,
        destinationAirport: destinationAirport as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(response.paginated(result.items, result.total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  }

  async getWaybillDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;

      const waybill = await this.waybillRepo.findOne({
        where: { id: waybillId },
        relations: ['forwarder', 'flight', 'details'],
      });

      if (!waybill) {
        return res.status(404).json(response.notFound('运单不存在'));
      }

      const timeline = await this.statusFlowService.getWaybillTimeline(waybillId);
      const todos = await this.todoService.getWaybillPendingTodos(waybillId);
      const securityChecks = await this.securityService.getWaybillSecurityChecks(waybillId);

      res.json(
        response.success({
          waybill,
          timeline,
          todos,
          securityChecks,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async startReceiving(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;

      let warehouseUser = await this.userRepo.findOne({ where: { username: 'warehouse' } });
      if (!warehouseUser) {
        warehouseUser = new User();
        warehouseUser.username = 'warehouse';
        warehouseUser.password = '123456';
        warehouseUser.name = '仓库用户';
        warehouseUser.role = UserRole.WAREHOUSE;
        warehouseUser.active = true;
        warehouseUser = await this.userRepo.save(warehouseUser);
      }

      const result = await this.receivingService.startReceiving(waybillId, warehouseUser);

      res.json(response.success(result, '开始收货'));
    } catch (error) {
      next(error);
    }
  }

  async completeReceiving(req: Request, res: Response, next: NextFunction) {
    try {
      const request = req.body as ReceivingRequest;

      let warehouseUser = await this.userRepo.findOne({ where: { username: 'warehouse' } });
      if (!warehouseUser) {
        warehouseUser = new User();
        warehouseUser.username = 'warehouse';
        warehouseUser.password = '123456';
        warehouseUser.name = '仓库用户';
        warehouseUser.role = UserRole.WAREHOUSE;
        warehouseUser.active = true;
        warehouseUser = await this.userRepo.save(warehouseUser);
      }

      let space = await AppDataSource.getRepository(Space).findOne({
        where: { status: SpaceStatus.AVAILABLE },
        relations: ['flight'],
      });

      if (!space) {
        const flightRepo = AppDataSource.getRepository(Flight);
        let flight = await flightRepo.findOne({ where: { flightNo: 'CA1234' } });
        if (!flight) {
          flight = new Flight();
          flight.flightNo = 'CA1234';
          flight.airlineCode = 'CA';
          flight.airlineName = '中国国际航空';
          flight.flightNumber = '1234';
          flight.originAirport = 'PEK';
          flight.originAirportName = '北京首都国际机场';
          flight.destinationAirport = 'SHA';
          flight.destinationAirportName = '上海虹桥国际机场';
          flight.scheduledDepartureTime = new Date(Date.now() + 86400000);
          flight.scheduledArrivalTime = new Date(Date.now() + 90000000);
          flight.status = 'scheduled' as any;
          flight = await flightRepo.save(flight);
        }

        const spaceRepo = AppDataSource.getRepository(Space);
        space = new Space();
        space.spaceNo = 'SP001';
        space.flightId = flight.id;
        space.flightNo = flight.flightNo;
        space.type = 'general' as any;
        space.status = SpaceStatus.AVAILABLE;
        space.statusDisplay = '可用';
        space.maxWeight = 5000;
        space.maxVolume = 50;
        space = await spaceRepo.save(space);
      }

      request.spaceId = space.id;

      const result = await this.receivingService.completeReceiving(request, warehouseUser);

      res.json(response.success(result, '收货完成'));
    } catch (error) {
      next(error);
    }
  }

  async startSecurityCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;

      let securityUser = await this.userRepo.findOne({ where: { username: 'security' } });
      if (!securityUser) {
        securityUser = new User();
        securityUser.username = 'security';
        securityUser.password = '123456';
        securityUser.name = '安检用户';
        securityUser.role = UserRole.SECURITY;
        securityUser.active = true;
        securityUser = await this.userRepo.save(securityUser);
      }

      const result = await this.securityService.startSecurityCheck(waybillId, securityUser);

      res.json(response.success(result, '开始安检'));
    } catch (error) {
      next(error);
    }
  }

  async processSecurityCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const request = req.body as SecurityCheckRequest;

      let securityUser = await this.userRepo.findOne({ where: { username: 'security' } });
      if (!securityUser) {
        securityUser = new User();
        securityUser.username = 'security';
        securityUser.password = '123456';
        securityUser.name = '安检用户';
        securityUser.role = UserRole.SECURITY;
        securityUser.active = true;
        securityUser = await this.userRepo.save(securityUser);
      }

      const result = await this.securityService.processSecurityCheck(request, securityUser);

      res.json(response.success(result, '安检处理完成'));
    } catch (error) {
      next(error);
    }
  }

  async getLoadingActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;

      const waybill = await this.waybillRepo.findOne({ where: { id: waybillId } });
      if (!waybill) {
        return res.status(404).json(response.notFound('运单不存在'));
      }

      const result = await this.loadingService.getAvailableActions(waybill);

      res.json(response.success(result));
    } catch (error) {
      next(error);
    }
  }

  async processLoadingAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const { actionType, ...options } = req.body;

      const user = await this.getMockUser();

      let airlineUser = await this.userRepo.findOne({ where: { username: 'airline' } });
      if (!airlineUser) {
        airlineUser = new User();
        airlineUser.username = 'airline';
        airlineUser.password = '123456';
        airlineUser.name = '航司用户';
        airlineUser.role = UserRole.AIRLINE;
        airlineUser.active = true;
        airlineUser = await this.userRepo.save(airlineUser);
      }

      const result = await this.loadingService.processLoadingAction(
        waybillId,
        actionType as LoadingActionType,
        airlineUser,
        options
      );

      res.json(response.success(result, '装机操作完成'));
    } catch (error) {
      next(error);
    }
  }

  async markInTransit(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const user = await this.getMockUser();

      const result = await this.loadingService.markInTransit(waybillId, user);

      res.json(response.success(result, '航班已起飞'));
    } catch (error) {
      next(error);
    }
  }

  async markArrived(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const request = req.body as ArrivalRequest;
      const user = await this.getMockUser();

      const result = await this.arrivalService.markArrived(waybillId, user, request);

      res.json(response.success(result, '货物已到港'));
    } catch (error) {
      next(error);
    }
  }

  async completePickup(req: Request, res: Response, next: NextFunction) {
    try {
      const { waybillId } = req.params;
      const request = req.body as PickupRequest;

      let consigneeUser = await this.userRepo.findOne({ where: { username: 'consignee' } });
      if (!consigneeUser) {
        consigneeUser = new User();
        consigneeUser.username = 'consignee';
        consigneeUser.password = '123456';
        consigneeUser.name = '收货人';
        consigneeUser.role = UserRole.CONSIGNEE;
        consigneeUser.active = true;
        consigneeUser = await this.userRepo.save(consigneeUser);
      }

      await this.arrivalService.startPickup(waybillId, consigneeUser);
      const result = await this.arrivalService.completePickup(waybillId, consigneeUser, request);

      res.json(response.success(result, '提货完成，运单结束'));
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSpaces(req: Request, res: Response, next: NextFunction) {
    try {
      const { originAirport, destinationAirport, airlineCode, spaceType, page = 1, pageSize = 20 } = req.query;

      const result = await this.receivingService.getAvailableSpaces(
        originAirport as string,
        destinationAirport as string,
        {
          airlineCode: airlineCode as string,
          spaceType: spaceType as string,
          page: Number(page),
          pageSize: Number(pageSize),
        }
      );

      res.json(response.paginated(result.items, result.total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  }
}
