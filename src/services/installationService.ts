import prisma from '../config/database';
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
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'PRODUCTION_COMPLETED') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      const existingInstallations = await prisma.installation.findMany({
        where: { orderId }
      });

      if (existingInstallations.length > 0) {
        const activeInstallations = existingInstallations.filter(i => 
          i.status !== 'COMPLETED' && i.status !== 'ACCEPTED'
        );
        if (activeInstallations.length > 0) {
          throw new Error('该订单已有进行中的安装任务');
        }
      }

      const taskNumber = await this.generateTaskNumber();

      const installation = await prisma.$transaction(async (tx) => {
        const newInstallation = await tx.installation.create({
          data: {
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
          }
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'INSTALLATION_ASSIGNED' as any }
        });

        return newInstallation;
      });

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

      logger.info(`[InstallationService] 智能派工完成: orderId=${orderId}, success=${assignmentResult.success}`);

      return assignmentResult;
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
      const installation = await prisma.installation.findUnique({
        where: { id: installationId }
      });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      if (installation.status !== 'PENDING_ASSIGNMENT') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const installer = await prisma.user.findUnique({
        where: { id: installerId },
        include: { installerProfile: true }
      });

      if (!installer || installer.role !== 'INSTALLER') {
        throw new Error('安装师傅不存在或角色不正确');
      }

      if (!installer.installerProfile?.isAvailable) {
        throw new Error('安装师傅当前不可用');
      }

      const previousState = {
        status: installation.status,
        installerId: installation.installerId,
        scheduledDate: installation.scheduledDate,
        timeSlot: installation.timeSlot
      };

      const updatedInstallation = await prisma.$transaction(async (tx) => {
        const newInstallation = await tx.installation.update({
          where: { id: installationId },
          data: {
            installerId,
            status: 'ASSIGNED' as InstallationStatus,
            scheduledDate,
            timeSlot
          }
        });

        await tx.order.update({
          where: { id: installation.orderId },
          data: { status: 'INSTALLATION_SCHEDULED' as any }
        });

        await tx.installationProgress.create({
          data: {
            installationId,
            newStatus: 'ASSIGNED' as InstallationStatus,
            actorId: assignedBy,
            notes: '分配安装师傅'
          }
        });

        return newInstallation;
      });

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
        metadata: { installerName: installer.name }
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
      const installation = await prisma.installation.findUnique({
        where: { id: installationId }
      });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      if (installation.installerId !== installerId) {
        throw new Error('安装师傅无权限操作此任务');
      }

      if (installation.status !== 'ASSIGNED' && installation.status !== 'SCHEDULED') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const previousState = {
        status: installation.status,
        actualStartAt: installation.actualStartAt
      };

      const updatedInstallation = await prisma.$transaction(async (tx) => {
        const newInstallation = await tx.installation.update({
          where: { id: installationId },
          data: {
            status: 'IN_PROGRESS' as InstallationStatus,
            actualStartAt: new Date()
          }
        });

        await tx.order.update({
          where: { id: installation.orderId },
          data: { status: 'INSTALLATION_IN_PROGRESS' as any }
        });

        await tx.installationProgress.create({
          data: {
            installationId,
            previousStatus: installation.status as any,
            newStatus: 'IN_PROGRESS' as InstallationStatus,
            actorId: installerId,
            notes: '开始安装'
          }
        });

        return newInstallation;
      });

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
      const installation = await prisma.installation.findUnique({
        where: { id: installationId }
      });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      if (installation.installerId !== installerId) {
        throw new Error('安装师傅无权限操作此任务');
      }

      if (installation.status !== 'IN_PROGRESS') {
        throw new Error(`安装任务状态不正确，当前状态: ${installation.status}`);
      }

      const previousState = {
        status: installation.status,
        actualEndAt: installation.actualEndAt,
        installationPhotos: installation.installationPhotos
      };

      const updatedInstallation = await prisma.$transaction(async (tx) => {
        const newInstallation = await tx.installation.update({
          where: { id: installationId },
          data: {
            status: 'COMPLETED' as InstallationStatus,
            actualEndAt: new Date(),
            installationPhotos: [...installation.installationPhotos, ...installationPhotos],
            notes: notes || installation.notes
          }
        });

        await tx.order.update({
          where: { id: installation.orderId },
          data: { status: 'INSTALLATION_COMPLETED' as any }
        });

        await tx.installationProgress.create({
          data: {
            installationId,
            previousStatus: installation.status as any,
            newStatus: 'COMPLETED' as InstallationStatus,
            actorId: installerId,
            notes: notes || '安装完成'
          }
        });

        return newInstallation;
      });

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
      const installation = await prisma.installation.findUnique({
        where: { id: installationId },
        include: { order: true }
      });

      if (!installation) {
        throw new Error('安装任务不存在');
      }

      if (installation.order.customerId !== customerId) {
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

      const updatedInstallation = await prisma.$transaction(async (tx) => {
        const newInstallation = await tx.installation.update({
          where: { id: installationId },
          data: {
            status: 'ACCEPTED' as InstallationStatus,
            customerFeedback,
            customerRating
          }
        });

        await tx.order.update({
          where: { id: installation.orderId },
          data: { status: 'ACCEPTED' as any }
        });

        await tx.installationProgress.create({
          data: {
            installationId,
            previousStatus: installation.status as any,
            newStatus: 'ACCEPTED' as InstallationStatus,
            actorId: customerId,
            notes: customerFeedback || '客户验收通过'
          }
        });

        return newInstallation;
      });

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
    return prisma.installation.findUnique({
      where: { id: installationId },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } }
          }
        },
        installer: {
          select: { id: true, name: true, phone: true },
          include: { installerProfile: true }
        },
        progressHistory: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getInstallationsByOrder(orderId: string): Promise<any[]> {
    return prisma.installation.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        installer: { select: { id: true, name: true } },
        progressHistory: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getInstallationsByInstaller(installerId: string, status?: InstallationStatus): Promise<any[]> {
    const where: any = { installerId };
    if (status) {
      where.status = status;
    }

    return prisma.installation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true }
        }
      }
    });
  }

  async getPendingAssignments(): Promise<any[]> {
    return prisma.installation.findMany({
      where: { status: 'PENDING_ASSIGNMENT' },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true },
          include: {
            customer: { select: { id: true, name: true, phone: true } }
          }
        }
      }
    });
  }

  private async generateTaskNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const count = await prisma.installation.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `IT${dateStr}${sequence}`;
  }
}

export const installationService = new InstallationService();
export default InstallationService;
