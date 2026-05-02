import prisma from '../config/database';
import mockDataService from './mockDataService';
import logger from '../config/logger';

class DatabaseService {
  private useMockData: boolean = false;

  constructor() {
    this.checkDatabaseConnection();
  }

  private async checkDatabaseConnection() {
    try {
      await prisma.$connect();
      logger.info('✅ 数据库连接成功，使用真实数据库');
      this.useMockData = false;
    } catch (error) {
      logger.warn('⚠️ 数据库连接失败，使用模拟数据');
      this.useMockData = true;
    }
  }

  isUsingMockData() {
    return this.useMockData;
  }

  // 通用方法
  async create(model: string, data: any) {
    if (this.useMockData) {
      return this.createMock(model, data);
    }
    return this.createReal(model, data);
  }

  async findUnique(model: string, where: any) {
    if (this.useMockData) {
      return this.findUniqueMock(model, where);
    }
    return this.findUniqueReal(model, where);
  }

  async findMany(model: string, args: any = {}) {
    if (this.useMockData) {
      return this.findManyMock(model, args);
    }
    return this.findManyReal(model, args);
  }

  async update(model: string, where: any, data: any) {
    if (this.useMockData) {
      return this.updateMock(model, where, data);
    }
    return this.updateReal(model, where, data);
  }

  // 真实数据库方法
  private async createReal(model: string, data: any) {
    try {
      return await (prisma as any)[model].create({ data });
    } catch (error) {
      logger.error(`Error creating ${model}:`, error);
      throw error;
    }
  }

  private async findUniqueReal(model: string, where: any) {
    try {
      return await (prisma as any)[model].findUnique({ where });
    } catch (error) {
      logger.error(`Error finding ${model}:`, error);
      throw error;
    }
  }

  private async findManyReal(model: string, args: any) {
    try {
      return await (prisma as any)[model].findMany(args);
    } catch (error) {
      logger.error(`Error finding many ${model}:`, error);
      throw error;
    }
  }

  private async updateReal(model: string, where: any, data: any) {
    try {
      return await (prisma as any)[model].update({ where, data });
    } catch (error) {
      logger.error(`Error updating ${model}:`, error);
      throw error;
    }
  }

  // 模拟数据方法
  private createMock(model: string, data: any) {
    switch (model) {
      case 'demand':
        return mockDataService.createDemand(data);
      case 'measurement':
        return mockDataService.createMeasurement(data);
      case 'design':
        return mockDataService.createDesign(data);
      case 'quote':
        return mockDataService.createQuote(data);
      case 'order':
        return mockDataService.createOrder(data);
      case 'split':
        return mockDataService.createSplit(data);
      case 'productionTask':
        return mockDataService.createProductionTask(data);
      case 'installation':
        return mockDataService.createInstallation(data);
      case 'auditLog':
        return mockDataService.createAuditLog(data);
      case 'exceptionLog':
        return mockDataService.createExceptionLog(data);
      default:
        throw new Error(`Model ${model} not supported in mock mode`);
    }
  }

  private findUniqueMock(model: string, where: any) {
    const id = where.id;
    switch (model) {
      case 'demand':
        return mockDataService.getDemandById(id);
      case 'measurement':
        return mockDataService.getMeasurementById(id);
      case 'design':
        return mockDataService.getDesignById(id);
      case 'quote':
        return mockDataService.getQuoteById(id);
      case 'order':
        return mockDataService.getOrderById(id);
      case 'split':
        return mockDataService.getSplitById(id);
      case 'productionTask':
        return mockDataService.getProductionTaskById(id);
      case 'installation':
        return mockDataService.getInstallationById(id);
      case 'user':
        return mockDataService.getUserById(id);
      default:
        return null;
    }
  }

  private findManyMock(model: string, args: any) {
    switch (model) {
      case 'demand':
        return mockDataService.getDemands();
      case 'quote':
        return (mockDataService as any).mockData.quotes || [];
      case 'order':
        return (mockDataService as any).mockData.orders || [];
      case 'split':
        return (mockDataService as any).mockData.splits || [];
      case 'productionTask':
        return (mockDataService as any).mockData.productionTasks || [];
      case 'installation':
        return (mockDataService as any).mockData.installations || [];
      case 'auditLog':
        return mockDataService.getAuditLogs();
      case 'exceptionLog':
        return mockDataService.getExceptionLogs();
      case 'user':
        return mockDataService.getUsers();
      default:
        return [];
    }
  }

  private updateMock(model: string, where: any, data: any) {
    const id = where.id;
    switch (model) {
      case 'demand':
        return mockDataService.updateDemand(id, data);
      case 'measurement':
        return mockDataService.updateMeasurement(id, data);
      case 'design':
        return mockDataService.updateDesign(id, data);
      case 'quote':
        return mockDataService.updateQuote(id, data);
      case 'order':
        return mockDataService.updateOrder(id, data);
      case 'split':
        return mockDataService.updateSplit(id, data);
      case 'productionTask':
        return mockDataService.updateProductionTask(id, data);
      case 'installation':
        return mockDataService.updateInstallation(id, data);
      case 'exceptionLog':
        return mockDataService.updateException(id, data);
      default:
        return null;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
