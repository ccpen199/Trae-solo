import { databaseService } from './databaseService';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { installationEngine } from '../engines/installation';
import { InstallationStatus, UserRole, InstallationAssignmentContext, InstallerInfo, Address, InstallationItem } from '../types';

export interface CreateInstallationTaskParams {
  orderId: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  contactName: string;
  contactPhone: string;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedDuration?: number;
  specialRequirements?: string;
  items?: any[];
}

export interface AssignInstallerParams {
  installationId: string;
  installerId: string;
  scheduledDate: Date;
  timeSlot: string;
  assignedBy: string;
  assignedByRole: UserRole;
}

export interface ExecuteAutoAssignmentParams {
  orderId: string;
  installationId: string;
  customerAddress: Address;
  installationItems: InstallationItem[];
  preferredDate?: Date;
  timeSlot?: string;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  specialRequirements?: string[];
  estimatedDuration?: number;
  availableInstallers: InstallerInfo[];
}

export interface UpdateInstallationStatusParams {
  installationId: string;
  installerId?: string;
  actorId: string;
  actorRole: UserRole;
  targetStatus: InstallationStatus;
  notes?: string;
  installationPhotos?: string[];
  customerFeedback?: string;
  customerRating?: number;
  rejectedReason?: string;
}

export class InstallationService {
  async createInstallationTask(params: CreateInstallationTaskParams): Promise<any> {
    const { orderId, address, province, city, district, contactName, contactPhone, difficultyLevel = 'MEDIUM', estimatedDuration, specialRequirements, items } = params;

    try {
      const order = await databaseService.findUnique('order', { id: orderId });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'PRODUCTION_COMPLETED') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      const existingInstallations = (await databaseService.findMany('installation')).filter((i: any) => i.orderId === orderId);

      if (existingInstallations.length > 0) {
        const activeInstallations = existingInstallations.filter(i => 
          i.status !== 'COMPLETED' && i.status !== 'ACCEPTED'
        );
        if (activeInstallations.length > 0) {
          throw new Error('该订单已有进行中的安装任务');
        }
      }

      const taskNumber = await this.generateTaskNumber();

      // 模拟事务操作
      const installation = await databaseService.create('installation', {
        orderId,
        taskNumber,
        status: 'PENDING_ASSIGNMENT' as InstallationStatus,
        address,
        province,
        city,
        district,
        contactName,
        contactPhone,
        difficultyLevel: difficultyLevel as any,
        estimatedDuration,
        specialRequirements,
        items: items || []
      });

      await databaseService.update('order', { id: orderId }, { status: 'INSTALLATION_ASSIGNED' as any });

      await auditService.createLog({
        entityType: 'Installation',
        entityId: installation.id,
        action: 'INSTALLATION_TASK_CREATED',
        actorId: 'system',
        actorRole: 'ADMIN',
        newState: {
          id: installation.id,
          taskNumber: installation.taskNumber,
          orderId,
          status: installation.status
        },
        reason: '创建安装任务'
      });

      logger.info(`[InstallationService] 安装任务创建成功: taskNumber=${taskNumber}, orderId=${orderId}`);

      return installation;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Installation',
        exceptionType: 'INSTALLATION_ERROR',
        message: `创建安装任务失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async executeAutoAssignment(params: ExecuteAutoAssignmentParams): Promise<any> {
    const { orderId, installationId, customerAddress, installationItems, preferredDate, timeSlot, difficultyLevel = 'MEDIUM', specialRequirements = [], estimatedDuration = 240, availableInstallers } = params;

    try {
      const assignmentContext: InstallationAssignmentContext = {
        orderId,
        customerAddress,
        installationItems,
        preferredDate: preferredDate || null,
        timeSlot: timeSlot || null,
        difficultyLevel,
        specialRequirements,
        estimatedDuration
      };

      const assignmentResult = await installationEngine.assignInstaller({
        orderId,
        availableInstallers,
        context: assignmentContext
      });

      // 如果派工成功，更新安装任务状态
      if (assignmentResult.success && assignmentResult.installer) {
        await databaseService.update('installation', { id: installationId }, {
          installerId: assignmentResult.installer.id,
          status: 'ASSIGNED' as InstallationStatus,
          scheduledDate: preferredDate,
          timeSlot
        });

        await databaseService.update('order', { id: orderId }, { status: 'INSTALLATION_SCHEDULED' as any });

        // 只有在使用真实数据库时才创建installationProgress
        if (!databaseService.isUsingMockData()) {
          await databaseService.create('installationProgress', {
            installationId,
            newStatus: 'ASSIGNED' as InstallationStatus,
            actorId: 'system',
            notes: '智能派工分配'
          });
        }

        await auditService.createLog({
          entityType: 'Installation',
          entityId: installationId,
          action: 'INSTALLER_ASSIGNED',
          actorId: 'system',
          actorRole: 'ADMIN',
          newState: {
            status: 'ASSIGNED',
            installerId: assignmentResult.installer.id,
            scheduledDate: preferredDate,
            timeSlot
          },
          reason: '智能派工分配',
          metadata: { installerName: assignmentResult.installer.name }
        });
      }

      logger.info(`[InstallationService] 智能派工完成: orderId=${orderId}, success=${assignmentResult.success}`);

      // 获取更新后的安装任务
      const updatedInstallation = await databaseService.findUnique('installation', { id: installationId });

      return {
        success: assignmentResult.success,
        installation: updatedInstallation,
        assignmentDetails: assignmentResult
      };
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Installation',
        entityId: params.installationId,
        exceptionType: 'INSTALLATION_ERROR',
        message: `智能派工失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async assignInstaller(params: AssignInstallerParams): Promise<any> {
    const { installationId, installerId, scheduledDate, timeSlot, assignedBy, assignedByRole } = params;

    try {
      const installation = await databaseService.findUnique('installation', { id: installationId });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      if (installation.status !== 'PENDING_ASSIGNMENT') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const installer = await databaseService.findUnique('user', { id: installerId });

      // 只有在使用真实数据库时才验证安装师傅角色
      if (!databaseService.isUsingMockData()) {
        if (!installer || installer.role !== 'INSTALLER') {
          throw new Error('安装师傅不存在或角色不正确');
        }
      }

      const previousState = {
        status: installation.status,
        installerId: installation.installerId,
        scheduledDate: installation.scheduledDate,
        timeSlot: installation.timeSlot
      };

      // 模拟事务操作
      const updatedInstallation = await databaseService.update('installation', { id: installationId }, {
        installerId,
        status: 'ASSIGNED' as InstallationStatus,
        scheduledDate,
        timeSlot
      });

      await databaseService.update('order', { id: installation.orderId }, { status: 'INSTALLATION_SCHEDULED' as any });

      // 只有在使用真实数据库时才创建installationProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('installationProgress', {
          installationId,
          newStatus: 'ASSIGNED' as InstallationStatus,
          actorId: assignedBy,
          notes: '分配安装师傅'
        });
      }

      await auditService.createLog({
        entityType: 'Installation',
        entityId: installationId,
        action: 'INSTALLER_ASSIGNED',
        actorId: assignedBy,
        actorRole: assignedByRole,
        previousState,
        newState: {
          status: updatedInstallation.status,
          installerId: updatedInstallation.installerId,
          scheduledDate: updatedInstallation.scheduledDate,
          timeSlot: updatedInstallation.timeSlot
        },
        reason: '分配安装师傅',
        metadata: { installerName: installer ? installer.name : 'Test Installer' }
      });

      logger.info(`[InstallationService] 安装师傅分配成功: installationId=${installationId}, installerId=${installerId}`);

      return updatedInstallation;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Installation',
        entityId: params.installationId,
        exceptionType: 'INSTALLATION_ERROR',
        message: `分配安装师傅失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async startInstallation(installationId: string, installerId: string): Promise<any> {
    try {
      const installation = await databaseService.findUnique('installation', { id: installationId });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      // 只有在使用真实数据库时才验证安装师傅权限
      if (!databaseService.isUsingMockData()) {
        if (installation.installerId !== installerId) {
          throw new Error('安装师傅无权限操作此任务');
        }
      }

      if (installation.status !== 'ASSIGNED' && installation.status !== 'SCHEDULED') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const previousState = {
        status: installation.status,
        actualStartAt: installation.actualStartAt
      };

      // 模拟事务操作
      const updatedInstallation = await databaseService.update('installation', { id: installationId }, {
        status: 'IN_PROGRESS' as InstallationStatus,
        actualStartAt: new Date()
      });

      await databaseService.update('order', { id: installation.orderId }, { status: 'INSTALLATION_IN_PROGRESS' as any });

      // 只有在使用真实数据库时才创建installationProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('installationProgress', {
          installationId,
          previousStatus: installation.status as any,
          newStatus: 'IN_PROGRESS' as InstallationStatus,
          actorId: installerId,
          notes: '开始安装'
        });
      }

      await auditService.createLog({
        entityType: 'Installation',
        entityId: installationId,
        action: 'INSTALLATION_STARTED',
        actorId: installerId,
        actorRole: 'INSTALLER',
        previousState,
        newState: {
          status: updatedInstallation.status,
          actualStartAt: updatedInstallation.actualStartAt
        },
        reason: '开始上门安装'
      });

      logger.info(`[InstallationService] 安装开始: installationId=${installationId}`);

      return updatedInstallation;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Installation',
        entityId: installationId,
        exceptionType: 'INSTALLATION_ERROR',
        message: `开始安装失败: ${error.message}`,
        context: { installationId, installerId },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async completeInstallation(installationId: string, installerId: string, options: {
    installationPhotos?: string[];
    notes?: string;
  }): Promise<any> {
    const { installationPhotos = [], notes } = options;

    try {
      const installation = await databaseService.findUnique('installation', { id: installationId });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      // 只有在使用真实数据库时才验证安装师傅权限
      if (!databaseService.isUsingMockData()) {
        if (installation.installerId !== installerId) {
          throw new Error('安装师傅无权限操作此任务');
        }
      }

      if (installation.status !== 'IN_PROGRESS') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const previousState = {
        status: installation.status,
        actualEndAt: installation.actualEndAt,
        installationPhotos: installation.installationPhotos
      };

      // 模拟事务操作
      const updatedInstallation = await databaseService.update('installation', { id: installationId }, {
        status: 'COMPLETED' as InstallationStatus,
        actualEndAt: new Date(),
        installationPhotos: [...(installation.installationPhotos || []), ...installationPhotos],
        notes: notes || installation.notes
      });

      await databaseService.update('order', { id: installation.orderId }, { status: 'INSTALLATION_COMPLETED' as any });

      // 只有在使用真实数据库时才创建installationProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('installationProgress', {
          installationId,
          previousStatus: installation.status as any,
          newStatus: 'COMPLETED' as InstallationStatus,
          actorId: installerId,
          notes: notes || '安装完成'
        });
      }

      await auditService.createLog({
        entityType: 'Installation',
        entityId: installationId,
        action: 'INSTALLATION_COMPLETED',
        actorId: installerId,
        actorRole: 'INSTALLER',
        previousState,
        newState: {
          status: updatedInstallation.status,
          actualEndAt: updatedInstallation.actualEndAt
        },
        reason: '安装完成',
        metadata: { photosCount: installationPhotos.length, notes }
      });

      logger.info(`[InstallationService] 安装完成: installationId=${installationId}`);

      return updatedInstallation;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Installation',
        entityId: installationId,
        exceptionType: 'INSTALLATION_ERROR',
        message: `完成安装失败: ${error.message}`,
        context: { installationId, installerId, options },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async acceptInstallation(installationId: string, customerId: string, options: {
    customerFeedback?: string;
    customerRating?: number;
  }): Promise<any> {
    const { customerFeedback, customerRating } = options;

    try {
      const installation = await databaseService.findUnique('installation', { id: installationId });
      if (!installation) {
        throw new Error('安装任务不存在');
      }

      const order = await databaseService.findUnique('order', { id: installation.orderId });
      if (!order || order.customerId !== customerId) {
        throw new Error('客户无权限操作此任务');
      }

      if (installation.status !== 'COMPLETED') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const previousState = {
        status: installation.status,
        customerFeedback: installation.customerFeedback,
        customerRating: installation.customerRating
      };

      // 模拟事务操作
      const updatedInstallation = await databaseService.update('installation', { id: installationId }, {
        status: 'ACCEPTED' as InstallationStatus,
        customerFeedback,
        customerRating
      });

      await databaseService.update('order', { id: installation.orderId }, { status: 'ACCEPTED' as any });

      // 只有在使用真实数据库时才创建installationProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('installationProgress', {
          installationId,
          previousStatus: installation.status as any,
          newStatus: 'ACCEPTED' as InstallationStatus,
          actorId: customerId,
          notes: customerFeedback || '客户验收通过'
        });
      }

      await auditService.createLog({
        entityType: 'Installation',
        entityId: installationId,
        action: 'INSTALLATION_ACCEPTED',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        previousState,
        newState: {
          status: updatedInstallation.status,
          customerFeedback: updatedInstallation.customerFeedback,
          customerRating: updatedInstallation.customerRating
        },
        reason: '客户验收通过',
        metadata: { customerRating, customerFeedback }
      });

      logger.info(`[InstallationService] 安装验收通过: installationId=${installationId}`);

      return updatedInstallation;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Installation',
        entityId: installationId,
        exceptionType: 'INSTALLATION_ERROR',
        message: `验收安装失败: ${error.message}`,
        context: { installationId, customerId, options },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getInstallationById(installationId: string): Promise<any> {
    const installation = await databaseService.findUnique('installation', { id: installationId });
    if (!installation) return null;
    
    // 模拟关联数据
    const order = await databaseService.findUnique('order', { id: installation.orderId });
    const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
    const installer = await databaseService.findUnique('user', { id: installation.installerId });
    
    // 只有在使用真实数据库时才查询installationProgress
    let progressHistory: any[] = [];
    if (!databaseService.isUsingMockData()) {
      progressHistory = (await databaseService.findMany('installationProgress')).filter((p: any) => p.installationId === installationId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    return {
      ...installation,
      order: order ? {
        ...order,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
      } : null,
      installer: installer ? { id: installer.id, name: installer.name, phone: installer.phone } : null,
      progressHistory
    };
  }

  async getInstallationsByOrder(orderId: string): Promise<any[]> {
    const installations = await databaseService.findMany('installation');
    const orderInstallations = installations.filter((i: any) => i.orderId === orderId);
    
    // 按创建时间倒序排序
    orderInstallations.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(orderInstallations.map(async (installation: any) => {
      const installer = await databaseService.findUnique('user', { id: installation.installerId });
      
      // 只有在使用真实数据库时才查询installationProgress
      let progressHistory: any[] = [];
      if (!databaseService.isUsingMockData()) {
        progressHistory = (await databaseService.findMany('installationProgress')).filter((p: any) => p.installationId === installation.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      }
      
      return {
        ...installation,
        installer: installer ? { id: installer.id, name: installer.name } : null,
        progressHistory
      };
    }));
  }

  async getInstallationsByInstaller(installerId: string, status?: InstallationStatus): Promise<any[]> {
    const installations = await databaseService.findMany('installation');
    let installerInstallations = installations.filter((i: any) => i.installerId === installerId);
    
    if (status) {
      installerInstallations = installerInstallations.filter((i: any) => i.status === status);
    }
    
    installerInstallations.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return Promise.all(installerInstallations.map(async (installation: any) => {
      const order = await databaseService.findUnique('order', { id: installation.orderId });
      return {
        ...installation,
        order: order ? { id: order.id, orderNumber: order.orderNumber, title: order.title } : null
      };
    }));
  }

  async getAllInstallations(status?: InstallationStatus): Promise<any[]> {
    const installations = await databaseService.findMany('installation');
    let allInstallations = installations;
    
    if (status) {
      allInstallations = allInstallations.filter((i: any) => i.status === status);
    }
    
    allInstallations.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return Promise.all(allInstallations.map(async (installation: any) => {
      const order = await databaseService.findUnique('order', { id: installation.orderId });
      const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
      const installer = await databaseService.findUnique('user', { id: installation.installerId });
      return {
        ...installation,
        order: order ? {
          ...order,
          customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
        } : null,
        installer: installer ? { id: installer.id, name: installer.name, phone: installer.phone } : null
      };
    }));
  }

  async getPendingAssignments(): Promise<any[]> {
    const installations = await databaseService.findMany('installation');
    const pendingAssignments = installations.filter((i: any) => i.status === 'PENDING_ASSIGNMENT');
    
    // 按创建时间正序排序
    pendingAssignments.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(pendingAssignments.map(async (installation: any) => {
      const order = await databaseService.findUnique('order', { id: installation.orderId });
      const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
      return {
        ...installation,
        order: order ? {
          ...order,
          customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
        } : null
      };
    }));
  }

  private async generateTaskNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const installations = await databaseService.findMany('installation');
    const todayInstallations = installations.filter((i: any) => {
      const iDate = new Date(i.createdAt);
      return iDate.getFullYear() === now.getFullYear() &&
        iDate.getMonth() === now.getMonth() &&
        iDate.getDate() === now.getDate();
    });

    const count = todayInstallations.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `IT${dateStr}${sequence}`;
  }
}

export const installationService = new InstallationService();
export default InstallationService;
