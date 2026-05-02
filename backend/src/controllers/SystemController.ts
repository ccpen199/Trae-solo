import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import {
  User,
  UserRole,
  Todo,
  TodoStatus,
  Notification,
  NotificationType,
  AuditLog,
  AuditAction,
  StatisticsSnapshot,
  SnapshotType,
  MasterWaybill,
  WaybillStatus,
  Flight,
  Space,
} from '../entities';
import { TodoService, NotificationService, AuditService } from '../services';
import * as response from '../utils/response';

export class SystemController {
  private userRepo;
  private todoService;
  private notificationService;
  private auditService;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.todoService = new TodoService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
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

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const waybillRepo = AppDataSource.getRepository(MasterWaybill);

      const totalWaybills = await waybillRepo.count();

      const statusCounts: Record<string, number> = {};
      const statuses = Object.values(WaybillStatus);
      for (const status of statuses) {
        statusCounts[status] = await waybillRepo.count({ where: { status } });
      }

      const user = await this.getMockUser();
      const pendingTodos = await this.todoService.getPendingCount(user.id);
      const unreadNotifications = await this.notificationService.getUnreadCount(user.id);

      const snapshotRepo = AppDataSource.getRepository(StatisticsSnapshot);
      const latestSnapshot = await snapshotRepo.findOne({
        where: { type: SnapshotType.REAL_TIME, isLatest: true },
        order: { snapshotTime: 'DESC' },
      });

      res.json(
        response.success({
          totalWaybills,
          statusCounts,
          pendingTodos,
          unreadNotifications,
          latestSnapshot,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getUserTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 20, status, relatedNode, priority } = req.query;
      const user = await this.getMockUser();

      const result = await this.todoService.getUserTodos(user.id, {
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as TodoStatus,
        relatedNode: relatedNode as any,
        priority: priority as any,
      });

      res.json(response.paginated(result.items, result.total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  }

  async startTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { todoId } = req.params;
      const user = await this.getMockUser();

      const result = await this.todoService.startTodo(todoId, user.id);

      if (!result) {
        return res.status(404).json(response.notFound('待办不存在或无权操作'));
      }

      res.json(response.success(result, '开始处理待办'));
    } catch (error) {
      next(error);
    }
  }

  async completeTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { todoId } = req.params;
      const { completionNote } = req.body;
      const user = await this.getMockUser();

      const result = await this.todoService.completeTodo(todoId, user.id, completionNote);

      if (!result) {
        return res.status(404).json(response.notFound('待办不存在或无权操作'));
      }

      res.json(response.success(result, '待办已完成'));
    } catch (error) {
      next(error);
    }
  }

  async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 20, isRead, type } = req.query;
      const user = await this.getMockUser();

      const result = await this.notificationService.getUserNotifications(user.id, {
        page: Number(page),
        pageSize: Number(pageSize),
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        type: type as NotificationType,
      });

      res.json(response.paginated(result.items, result.total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;
      const user = await this.getMockUser();

      const result = await this.notificationService.markAsRead(notificationId, user.id);

      if (!result) {
        return res.status(404).json(response.notFound('通知不存在'));
      }

      res.json(response.success(result, '已标记为已读'));
    } catch (error) {
      next(error);
    }
  }

  async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.getMockUser();

      await this.notificationService.markAllAsRead(user.id);

      res.json(response.success(null, '已全部标记为已读'));
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 20, operatorId, entityType, entityId, action, level, fromDate, toDate } = req.query;

      const result = await this.auditService.getAuditLogs({
        page: Number(page),
        pageSize: Number(pageSize),
        operatorId: operatorId as string,
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as AuditAction,
        level: level as any,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(response.paginated(result.items, result.total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userRepo.find({
        where: { active: true },
        order: { createdAt: 'DESC' },
      });

      res.json(response.success(users));
    } catch (error) {
      next(error);
    }
  }

  async createTestData(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = [
        { username: 'admin', name: '系统管理员', role: UserRole.ADMIN, companyName: '系统' },
        { username: 'forwarder', name: '货代用户', role: UserRole.FORWARDER, companyName: '示例货代公司' },
        { username: 'airline', name: '航司用户', role: UserRole.AIRLINE, companyName: '中国国际航空' },
        { username: 'warehouse', name: '仓库用户', role: UserRole.WAREHOUSE, companyName: '示例仓库' },
        { username: 'security', name: '安检用户', role: UserRole.SECURITY, companyName: '安检部门' },
        { username: 'consignee', name: '收货人', role: UserRole.CONSIGNEE, companyName: '示例收货公司' },
      ];

      const createdUsers: User[] = [];
      for (const roleData of roles) {
        let user = await this.userRepo.findOne({ where: { username: roleData.username } });
        if (!user) {
          user = new User();
          user.username = roleData.username;
          user.password = '123456';
          user.name = roleData.name;
          user.role = roleData.role;
          user.companyName = roleData.companyName;
          user.active = true;
          user = await this.userRepo.save(user);
        }
        createdUsers.push(user);
      }

      const flightRepo = AppDataSource.getRepository(Flight);
      const flights = [
        {
          flightNo: 'CA1234',
          airlineCode: 'CA',
          airlineName: '中国国际航空',
          flightNumber: '1234',
          originAirport: 'PEK',
          originAirportName: '北京首都国际机场',
          destinationAirport: 'SHA',
          destinationAirportName: '上海虹桥国际机场',
        },
        {
          flightNo: 'MU5678',
          airlineCode: 'MU',
          airlineName: '中国东方航空',
          flightNumber: '5678',
          originAirport: 'SHA',
          originAirportName: '上海虹桥国际机场',
          destinationAirport: 'CAN',
          destinationAirportName: '广州白云国际机场',
        },
      ];

      const spaceRepo = AppDataSource.getRepository(Space);
      for (const flightData of flights) {
        let flight = await flightRepo.findOne({ where: { flightNo: flightData.flightNo } });
        if (!flight) {
          flight = new Flight();
          Object.assign(flight, flightData);
          flight.scheduledDepartureTime = new Date(Date.now() + 86400000);
          flight.scheduledArrivalTime = new Date(Date.now() + 90000000);
          flight.status = 'scheduled' as any;
          flight = await flightRepo.save(flight);
        }

        const existingSpaces = await spaceRepo.count({ where: { flightId: flight.id } });
        if (existingSpaces === 0) {
          for (let i = 0; i < 3; i++) {
            const space = new Space();
            space.spaceNo = `SP${flightData.flightNo}${i + 1}`;
            space.flightId = flight.id;
            space.flightNo = flight.flightNo;
            space.type = 'general' as any;
            space.typeDisplay = '普通舱位';
            space.status = 'available' as any;
            space.statusDisplay = '可用';
            space.maxWeight = 5000;
            space.maxVolume = 50;
            space.unitPriceWeight = 15;
            space.unitPriceVolume = 100;
            await spaceRepo.save(space);
          }
        }
      }

      res.json(response.success({ users: createdUsers, message: '测试数据创建成功' }));
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const isConnected = AppDataSource.isInitialized;

      res.json(
        response.success({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: isConnected ? 'connected' : 'disconnected',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
