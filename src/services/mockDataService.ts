import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { 
  User, 
  Demand, 
  Measurement, 
  Design, 
  Quote, 
  Order, 
  Split, 
  ProductionTask, 
  Installation, 
  AuditLog, 
  ExceptionLog
} from '@prisma/client';
import { UserRole, DemandStatus, MeasurementStatus, DesignStatus, QuoteStatus, OrderStatus, SplitStatus, ProductionStatus, InstallationStatus } from '../types';

class MockDataService {
  private mockData: {
    users: User[];
    demands: Demand[];
    measurements: Measurement[];
    designs: Design[];
    quotes: Quote[];
    orders: Order[];
    splits: Split[];
    productionTasks: ProductionTask[];
    installations: Installation[];
    auditLogs: AuditLog[];
    exceptionLogs: ExceptionLog[];
  };

  constructor() {
    this.mockData = this.initializeMockData();
  }

  private initializeMockData() {
    const adminUser: User = {
      id: 'test-user-id',
      phone: '13800138000',
      password: 'hashed-password',
      name: 'Test Admin',
      avatar: null,
      role: 'ADMIN',
      email: 'admin@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const designerUser: User = {
      id: 'test-designer-id',
      phone: '13900139000',
      password: 'hashed-password',
      name: 'Test Designer',
      avatar: null,
      role: 'DESIGNER',
      email: 'designer@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const testDemand: Demand = {
      id: 'test-demand-id',
      demandNumber: 'DM20260427001',
      customerId: adminUser.id,
      designerId: null,
      status: 'PENDING_ASSIGNMENT',
      houseType: '三居室',
      area: new Prisma.Decimal(120),
      style: '现代简约',
      budgetRange: '10-15万',
      address: '北京市朝阳区建国路88号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      contactName: '张三',
      contactPhone: '13800138000',
      description: '全屋定制家具',
      images: [],
      assignedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      users: [adminUser, designerUser],
      demands: [testDemand],
      measurements: [],
      designs: [],
      quotes: [],
      orders: [],
      splits: [],
      productionTasks: [],
      installations: [],
      auditLogs: [],
      exceptionLogs: []
    };
  }

  // 用户相关
  getUserById(id: string) {
    return this.mockData.users.find(user => user.id === id);
  }

  getUsers() {
    return this.mockData.users;
  }

  // 需求相关
  createDemand(demand: Omit<Demand, 'id' | 'demandNumber' | 'createdAt' | 'updatedAt'>) {
    const newDemand: Demand = {
      ...demand,
      id: uuidv4(),
      demandNumber: `DM${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(this.mockData.demands.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.demands.push(newDemand);
    return newDemand;
  }

  getDemandById(id: string) {
    return this.mockData.demands.find(demand => demand.id === id);
  }

  getDemands() {
    return this.mockData.demands;
  }

  updateDemand(id: string, data: Partial<Demand>) {
    const index = this.mockData.demands.findIndex(demand => demand.id === id);
    if (index !== -1) {
      this.mockData.demands[index] = {
        ...this.mockData.demands[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.demands[index];
    }
    return null;
  }

  // 量尺相关
  createMeasurement(measurement: Omit<Measurement, 'id' | 'createdAt' | 'updatedAt'>) {
    const newMeasurement: Measurement = {
      ...measurement,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.measurements.push(newMeasurement);
    return newMeasurement;
  }

  getMeasurementById(id: string) {
    return this.mockData.measurements.find(measurement => measurement.id === id);
  }

  updateMeasurement(id: string, data: Partial<Measurement>) {
    const index = this.mockData.measurements.findIndex(measurement => measurement.id === id);
    if (index !== -1) {
      this.mockData.measurements[index] = {
        ...this.mockData.measurements[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.measurements[index];
    }
    return null;
  }

  // 设计相关
  createDesign(design: Omit<Design, 'id' | 'createdAt' | 'updatedAt'>) {
    const newDesign: Design = {
      ...design,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.designs.push(newDesign);
    return newDesign;
  }

  getDesignById(id: string) {
    return this.mockData.designs.find(design => design.id === id);
  }

  updateDesign(id: string, data: Partial<Design>) {
    const index = this.mockData.designs.findIndex(design => design.id === id);
    if (index !== -1) {
      this.mockData.designs[index] = {
        ...this.mockData.designs[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.designs[index];
    }
    return null;
  }

  // 报价相关
  createQuote(quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) {
    const newQuote: Quote = {
      ...quote,
      id: uuidv4(),
      quoteNumber: `QT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(this.mockData.quotes.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.quotes.push(newQuote);
    return newQuote;
  }

  getQuoteById(id: string) {
    return this.mockData.quotes.find(quote => quote.id === id);
  }

  updateQuote(id: string, data: Partial<Quote>) {
    const index = this.mockData.quotes.findIndex(quote => quote.id === id);
    if (index !== -1) {
      this.mockData.quotes[index] = {
        ...this.mockData.quotes[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.quotes[index];
    }
    return null;
  }

  // 订单相关
  createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) {
    const newOrder: Order = {
      ...order,
      id: uuidv4(),
      orderNumber: `ORD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(this.mockData.orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.orders.push(newOrder);
    return newOrder;
  }

  getOrderById(id: string) {
    return this.mockData.orders.find(order => order.id === id);
  }

  updateOrder(id: string, data: Partial<Order>) {
    const index = this.mockData.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.mockData.orders[index] = {
        ...this.mockData.orders[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.orders[index];
    }
    return null;
  }

  // 拆单相关
  createSplit(split: Omit<Split, 'id' | 'createdAt' | 'updatedAt'>) {
    const newSplit: Split = {
      ...split,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.splits.push(newSplit);
    return newSplit;
  }

  getSplitById(id: string) {
    return this.mockData.splits.find(split => split.id === id);
  }

  updateSplit(id: string, data: Partial<Split>) {
    const index = this.mockData.splits.findIndex(split => split.id === id);
    if (index !== -1) {
      this.mockData.splits[index] = {
        ...this.mockData.splits[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.splits[index];
    }
    return null;
  }

  // 生产相关
  createProductionTask(task: Omit<ProductionTask, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt'>) {
    const newTask: ProductionTask = {
      ...task,
      id: uuidv4(),
      taskNumber: `PT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(this.mockData.productionTasks.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.productionTasks.push(newTask);
    return newTask;
  }

  getProductionTaskById(id: string) {
    return this.mockData.productionTasks.find(task => task.id === id);
  }

  updateProductionTask(id: string, data: Partial<ProductionTask>) {
    const index = this.mockData.productionTasks.findIndex(task => task.id === id);
    if (index !== -1) {
      this.mockData.productionTasks[index] = {
        ...this.mockData.productionTasks[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.productionTasks[index];
    }
    return null;
  }

  // 安装相关
  createInstallation(installation: Omit<Installation, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt'>) {
    const newInstallation: Installation = {
      ...installation,
      id: uuidv4(),
      taskNumber: `IT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(this.mockData.installations.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.installations.push(newInstallation);
    return newInstallation;
  }

  getInstallationById(id: string) {
    return this.mockData.installations.find(installation => installation.id === id);
  }

  updateInstallation(id: string, data: Partial<Installation>) {
    const index = this.mockData.installations.findIndex(installation => installation.id === id);
    if (index !== -1) {
      this.mockData.installations[index] = {
        ...this.mockData.installations[index],
        ...data,
        updatedAt: new Date()
      };
      return this.mockData.installations[index];
    }
    return null;
  }

  // 审计日志相关
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const newLog: AuditLog = {
      ...log,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.mockData.auditLogs.push(newLog);
    return newLog;
  }

  getAuditLogs() {
    return this.mockData.auditLogs;
  }

  // 异常日志相关
  createExceptionLog(log: Omit<ExceptionLog, 'id' | 'createdAt'>) {
    const newLog: ExceptionLog = {
      ...log,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.mockData.exceptionLogs.push(newLog);
    return newLog;
  }

  getExceptionLogs() {
    return this.mockData.exceptionLogs;
  }

  updateException(id: string, data: Partial<ExceptionLog>) {
    const index = this.mockData.exceptionLogs.findIndex(log => log.id === id);
    if (index !== -1) {
      this.mockData.exceptionLogs[index] = {
        ...this.mockData.exceptionLogs[index],
        ...data
      };
      return this.mockData.exceptionLogs[index];
    }
    return null;
  }
}

export const mockDataService = new MockDataService();
export default mockDataService;
