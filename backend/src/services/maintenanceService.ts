import { WorkOrder, IWorkOrder } from '@models/WorkOrder';
import { Device, IDevice } from '@models/Device';
import { Firmware, IFirmware } from '@models/Firmware';
import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo } from '@utils/helpers';
import * as mongoose from 'mongoose';

export interface WorkOrderCreateParams {
  deviceId: string;
  title: string;
  description: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'firmware_upgrade';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporterId: string;
  assigneeId?: string;
}

export interface WorkOrderUpdateParams {
  status?: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  resolution?: string;
  remark?: string;
}

export interface WorkOrderQueryParams {
  deviceId?: string;
  reporterId?: string;
  assigneeId?: string;
  status?: string;
  type?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface RemoteControlParams {
  deviceId: string;
  command: 'restart' | 'shutdown' | 'start' | 'stop' | 'reset' | 'sync_time' | 'set_param';
  params?: Record<string, any>;
  operatorId: string;
}

export interface FirmwareUploadParams {
  version: string;
  targetModels?: string[];
  deviceType?: string;
  name?: string;
  fileName?: string;
  fileHash?: string;
  md5?: string;
  checksum?: string;
  releaseNotes?: string[];
  releaseNote?: string;
  isMandatory?: boolean;
  forceUpdate?: boolean;
  description?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedBy?: string;
}

export interface FirmwareUpgradeTaskParams {
  firmwareId: string;
  deviceIds: string[];
  upgradeMode: 'immediate' | 'scheduled';
  scheduledTime?: Date;
}

export interface RemoteCommandResult {
  commandId: string;
  deviceId: string;
  command: string;
  status: 'sent' | 'success' | 'failed' | 'timeout';
  result?: any;
  errorMessage?: string;
  executedAt?: Date;
}

export interface UpgradeTaskInfo {
  taskId: string;
  firmwareId: string;
  firmwareVersion: string;
  deviceIds: string[];
  totalDevices: number;
  successCount: number;
  failedCount: number;
  upgradeMode: 'immediate' | 'scheduled';
  scheduledTime: Date;
  status: string;
  completedAt?: Date;
  createdAt: Date;
}

export class MaintenanceService {
  private static instance: MaintenanceService;

  private commandQueue: Map<string, RemoteCommandResult> = new Map();
  private upgradeTaskStore: Map<string, UpgradeTaskInfo> = new Map();

  private constructor() {}

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  public async createWorkOrder(params: WorkOrderCreateParams): Promise<IWorkOrder> {
    try {
      const { deviceId, title, description, type, priority, reporterId, assigneeId } = params;

      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      if (!title || title.length < 1 || title.length > 200) {
        throw new Error('工单标题长度必须在1-200个字符之间');
      }

      if (!description) {
        throw new Error('工单描述不能为空');
      }

      if (!['repair', 'maintenance', 'inspection', 'installation', 'firmware_upgrade'].includes(type)) {
        throw new Error('无效的工单类型');
      }

      if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
        throw new Error('无效的优先级');
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('设备不存在');
      }

      const reporter = await User.findById(reporterId);
      if (!reporter) {
        throw new Error('报修人不存在');
      }

      let assigneeObjectId: mongoose.Types.ObjectId | undefined;
      if (assigneeId) {
        const assignee = await User.findById(assigneeId);
        if (!assignee) {
          throw new Error('处理人不存在');
        }
        assigneeObjectId = new mongoose.Types.ObjectId(assigneeId);
      }

      const workOrder = new WorkOrder({
        orderNo: `WO${Date.now()}${Math.floor(Math.random() * 10000)}`,
        deviceId: new mongoose.Types.ObjectId(deviceId),
        title,
        description,
        type,
        priority,
        reporterId: new mongoose.Types.ObjectId(reporterId),
        assigneeId: assigneeObjectId,
        status: assigneeObjectId ? 'assigned' : 'created',
        createdAt: new Date()
      });

      await workOrder.save();

      await Device.findByIdAndUpdate(deviceId, {
        $set: { status: 'maintenance' }
      });

      logger.info(`创建工单成功: orderNo=${workOrder.orderNo}, deviceId=${deviceId}, type=${type}`);
      return workOrder;
    } catch (error) {
      logger.error('创建工单失败:', error);
      throw error;
    }
  }

  public async getWorkOrderById(orderId: string): Promise<IWorkOrder> {
    try {
      if (!orderId) {
        throw new Error('工单ID不能为空');
      }

      const workOrder = await WorkOrder.findById(orderId)
        .populate('deviceId', 'deviceId deviceName location')
        .populate('reporterId', 'realName phone')
        .populate('assigneeId', 'realName phone');

      if (!workOrder) {
        throw new Error('工单不存在');
      }

      return workOrder;
    } catch (error) {
      logger.error('获取工单详情失败:', error);
      throw error;
    }
  }

  public async updateWorkOrder(orderId: string, params: WorkOrderUpdateParams): Promise<IWorkOrder> {
    try {
      if (!orderId) {
        throw new Error('工单ID不能为空');
      }

      const workOrder = await WorkOrder.findById(orderId);
      if (!workOrder) {
        throw new Error('工单不存在');
      }

      const updateData: Partial<IWorkOrder> = {};
      let pushOperation: any = null;

      if (params.status !== undefined) {
        if (!['created', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(params.status)) {
          throw new Error('无效的工单状态');
        }
        updateData.status = params.status;

        if (params.status === 'in_progress') {
          updateData.startedAt = new Date();
        } else if (params.status === 'completed' || params.status === 'cancelled') {
          updateData.completedAt = new Date();
        }
      }

      if (params.title !== undefined) {
        if (params.title.length < 1 || params.title.length > 200) {
          throw new Error('工单标题长度必须在1-200个字符之间');
        }
        updateData.title = params.title;
      }

      if (params.description !== undefined) {
        updateData.description = params.description;
      }

      if (params.priority !== undefined) {
        if (!['low', 'medium', 'high', 'critical'].includes(params.priority)) {
          throw new Error('无效的优先级');
        }
        updateData.priority = params.priority;
      }

      if (params.assigneeId !== undefined) {
        if (params.assigneeId) {
          const assignee = await User.findById(params.assigneeId);
          if (!assignee) {
            throw new Error('处理人不存在');
          }
          updateData.assigneeId = new mongoose.Types.ObjectId(params.assigneeId);
          if (!updateData.status) {
            updateData.status = 'assigned';
          }
        } else {
          updateData.assigneeId = undefined;
        }
      }

      if (params.resolution !== undefined) {
        updateData.resolution = params.resolution;
      }

      if (params.remark !== undefined) {
        pushOperation = {
          operationLogs: {
            operator: 'system',
            action: 'update',
            remark: params.remark,
            timestamp: new Date()
          }
        };
      }

      const updatedOrder = await WorkOrder.findByIdAndUpdate(
        orderId,
        { $set: updateData, ...(pushOperation ? { $push: pushOperation } : {}) },
        { new: true }
      );

      if (params.status === 'completed' && workOrder.deviceId) {
        await Device.findByIdAndUpdate(workOrder.deviceId, {
          $set: { status: 'online' }
        });
      }

      logger.info(`更新工单成功: orderId=${orderId}, status=${params.status}`);
      return updatedOrder!;
    } catch (error) {
      logger.error('更新工单失败:', error);
      throw error;
    }
  }

  public async queryWorkOrders(params: WorkOrderQueryParams): Promise<{ orders: IWorkOrder[]; total: number }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;

      const query: any = {};

      if (params.deviceId) query.deviceId = params.deviceId;
      if (params.reporterId) query.reporterId = params.reporterId;
      if (params.assigneeId) query.assigneeId = params.assigneeId;
      if (params.status) query.status = params.status;
      if (params.type) query.type = params.type;
      if (params.priority) query.priority = params.priority;

      if (params.startDate || params.endDate) {
        query.createdAt = {};
        if (params.startDate) query.createdAt.$gte = params.startDate;
        if (params.endDate) query.createdAt.$lte = params.endDate;
      }

      const total = await WorkOrder.countDocuments(query);
      const orders = await WorkOrder.find(query)
        .populate('deviceId', 'deviceId deviceName location')
        .populate('reporterId', 'realName phone')
        .populate('assigneeId', 'realName phone')
        .sort({ createdAt: -1, priority: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { orders, total };
    } catch (error) {
      logger.error('查询工单列表失败:', error);
      throw error;
    }
  }

  public async addWorkOrderRemark(orderId: string, operatorId: string, remark: string): Promise<IWorkOrder> {
    try {
      if (!orderId || !operatorId || !remark) {
        throw new Error('参数错误');
      }

      const operator = await User.findById(operatorId);
      if (!operator) {
        throw new Error('操作人不存在');
      }

      const workOrder = await WorkOrder.findByIdAndUpdate(
        orderId,
        {
          $push: {
            operationLogs: {
              operator: operator.realName || 'operator',
              operatorId,
              action: 'remark',
              remark,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      if (!workOrder) {
        throw new Error('工单不存在');
      }

      logger.info(`添加工单备注成功: orderId=${orderId}`);
      return workOrder;
    } catch (error) {
      logger.error('添加工单备注失败:', error);
      throw error;
    }
  }

  public async sendRemoteCommand(params: RemoteControlParams): Promise<RemoteCommandResult> {
    try {
      const { deviceId, command, params: commandParams, operatorId } = params;

      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const validCommands = ['restart', 'shutdown', 'start', 'stop', 'reset', 'sync_time', 'set_param'];
      if (!validCommands.includes(command)) {
        throw new Error('无效的控制命令');
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('设备不存在');
      }

      if (device.status !== 'online') {
        throw new Error('设备不在线，无法执行远程控制');
      }

      const operator = await User.findById(operatorId);
      if (!operator) {
        throw new Error('操作人不存在');
      }

      const commandId = `CMD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const result: RemoteCommandResult = {
        commandId,
        deviceId,
        command,
        status: 'sent',
        executedAt: new Date()
      };

      this.commandQueue.set(commandId, result);

      logger.info(`发送远程控制命令: commandId=${commandId}, deviceId=${deviceId}, command=${command}, operator=${operator.realName || ''}`);

      setImmediate(async () => {
        try {
          const success = await this.executeCommand(deviceId, command, commandParams);
          
          const updatedResult = this.commandQueue.get(commandId);
          if (updatedResult) {
            updatedResult.status = success ? 'success' : 'failed';
            updatedResult.executedAt = new Date();
            if (!success) {
              updatedResult.errorMessage = '命令执行失败';
            }
            this.commandQueue.set(commandId, updatedResult);
          }

          await WorkOrder.findByIdAndUpdate(deviceId, {
            $push: {
              operationLogs: {
                operator: operator.realName || 'system',
                operatorId,
                action: `remote_${command}`,
                remark: success ? '远程控制成功' : '远程控制失败',
                timestamp: new Date()
              }
            }
          } as any);
        } catch (error) {
          const updatedResult = this.commandQueue.get(commandId);
          if (updatedResult) {
            updatedResult.status = 'failed';
            updatedResult.errorMessage = error instanceof Error ? error.message : '未知错误';
            this.commandQueue.set(commandId, updatedResult);
          }
        }
      });

      return result;
    } catch (error) {
      logger.error('发送远程控制命令失败:', error);
      throw error;
    }
  }

  private async executeCommand(deviceId: string, command: string, params?: Record<string, any>): Promise<boolean> {
    try {
      logger.info(`执行设备命令: deviceId=${deviceId}, command=${command}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (command) {
        case 'restart':
          await Device.findByIdAndUpdate(deviceId, { status: 'offline' });
          setTimeout(async () => {
            await Device.findByIdAndUpdate(deviceId, { status: 'online', lastHeartbeatAt: new Date() });
          }, 5000);
          break;
        case 'shutdown':
          await Device.findByIdAndUpdate(deviceId, { status: 'offline' });
          break;
        case 'start':
        case 'reset':
          await Device.findByIdAndUpdate(deviceId, { status: 'online', lastHeartbeatAt: new Date() });
          break;
        case 'set_param':
          if (params) {
            await Device.findByIdAndUpdate(deviceId, { $set: params });
          }
          break;
        default:
          break;
      }

      return true;
    } catch (error) {
      logger.error('执行设备命令失败:', error);
      return false;
    }
  }

  public async getCommandResult(commandId: string): Promise<RemoteCommandResult | null> {
    const result = this.commandQueue.get(commandId);
    return result || null;
  }

  public async uploadFirmware(params: FirmwareUploadParams): Promise<IFirmware> {
    try {
      const {
        version,
        targetModels,
        deviceType,
        name,
        fileName,
        fileHash,
        md5,
        checksum,
        releaseNotes,
        releaseNote,
        isMandatory,
        forceUpdate,
        description,
        fileUrl,
        fileSize,
        uploadedBy,
      } = params;

      const finalTargetModels = targetModels || (deviceType ? [deviceType] : []);
      const finalName = name || fileName || `firmware-${version}`;
      const finalFileHash = fileHash || md5 || '';
      const finalReleaseNotes = releaseNotes || (releaseNote ? [releaseNote] : []);
      const finalIsMandatory = isMandatory !== undefined ? isMandatory : forceUpdate;

      if (!version || finalTargetModels.length === 0 || !finalName || !finalFileHash) {
        throw new Error('参数不完整');
      }

      const existingFirmware = await Firmware.findOne({ version, targetModels: { $in: finalTargetModels } });
      if (existingFirmware) {
        throw new Error('该设备类型的此版本固件已存在');
      }

      const firmware = new Firmware({
        version,
        targetModels: finalTargetModels,
        name: finalName,
        fileHash: finalFileHash,
        checksum: checksum || finalFileHash,
        releaseNotes: finalReleaseNotes,
        isMandatory: finalIsMandatory || false,
        description: description || '',
        fileUrl: fileUrl || '',
        fileSize: fileSize || 0,
        uploadedBy: uploadedBy ? new mongoose.Types.ObjectId(uploadedBy) : undefined,
        status: 'draft'
      });

      await firmware.save();
      logger.info(`上传固件成功: version=${version}`);
      return firmware;
    } catch (error) {
      logger.error('上传固件失败:', error);
      throw error;
    }
  }

  public async createFirmwareUpgradeTask(params: FirmwareUpgradeTaskParams): Promise<UpgradeTaskInfo> {
    try {
      const { firmwareId, deviceIds, upgradeMode, scheduledTime } = params;

      if (!firmwareId || !deviceIds || deviceIds.length === 0) {
        throw new Error('参数错误');
      }

      if (!['immediate', 'scheduled'].includes(upgradeMode)) {
        throw new Error('无效的升级模式');
      }

      if (upgradeMode === 'scheduled' && !scheduledTime) {
        throw new Error('定时升级需要指定升级时间');
      }

      const firmware = await Firmware.findById(firmwareId);
      if (!firmware) {
        throw new Error('固件不存在');
      }

      const validDevices = await Device.find({
        _id: { $in: deviceIds },
        deviceModel: { $in: firmware.targetModels }
      });

      if (validDevices.length !== deviceIds.length) {
        throw new Error('部分设备不存在或设备类型不匹配');
      }

      const taskId = `UPG${Date.now()}`;
      const upgradeTask: UpgradeTaskInfo = {
        taskId,
        firmwareId,
        firmwareVersion: firmware.version,
        deviceIds,
        totalDevices: deviceIds.length,
        successCount: 0,
        failedCount: 0,
        upgradeMode,
        scheduledTime: scheduledTime || new Date(),
        status: upgradeMode === 'immediate' ? 'in_progress' : 'created',
        createdAt: new Date()
      };

      this.upgradeTaskStore.set(taskId, upgradeTask);

      await Firmware.findByIdAndUpdate(firmwareId, {
        $set: { status: 'published' as any, releasedAt: new Date() as any }
      });

      if (upgradeMode === 'immediate') {
        setImmediate(() => this.executeFirmwareUpgrade(firmwareId, deviceIds, taskId));
      }

      logger.info(`创建固件升级任务成功: taskId=${taskId}, firmwareVersion=${firmware.version}, deviceCount=${deviceIds.length}`);
      return upgradeTask;
    } catch (error) {
      logger.error('创建固件升级任务失败:', error);
      throw error;
    }
  }

  private async executeFirmwareUpgrade(firmwareId: string, deviceIds: string[], taskId: string): Promise<void> {
    try {
      const firmware = await Firmware.findById(firmwareId);
      if (!firmware) return;

      let successCount = 0;
      let failedCount = 0;

      for (const deviceId of deviceIds) {
        try {
          await Device.findByIdAndUpdate(deviceId, {
            $set: {
              firmwareVersion: firmware.version
            }
          });
          successCount++;
          logger.info(`设备固件升级成功: deviceId=${deviceId}, version=${firmware.version}`);
        } catch (error) {
          failedCount++;
          logger.error(`设备固件升级失败: deviceId=${deviceId}`, error);
        }
      }

      const task = this.upgradeTaskStore.get(taskId);
      if (task) {
        task.successCount = successCount;
        task.failedCount = failedCount;
        task.status = 'completed';
        task.completedAt = new Date();
        this.upgradeTaskStore.set(taskId, task);
      }

      logger.info(`固件升级任务完成: taskId=${taskId}, success=${successCount}, failed=${failedCount}`);
    } catch (error) {
      logger.error('执行固件升级任务失败:', error);
    }
  }

  public async getFirmwareList(targetModel?: string): Promise<IFirmware[]> {
    try {
      const query: any = {};
      if (targetModel) {
        query.targetModels = targetModel;
      }

      const firmwares = await Firmware.find(query).sort({ createdAt: -1 });
      return firmwares;
    } catch (error) {
      logger.error('获取固件列表失败:', error);
      throw error;
    }
  }

  public async getWorkOrderStatistics(params?: {
    startDate?: Date;
    endDate?: Date;
    assigneeId?: string;
  }): Promise<any> {
    try {
      const query: any = {};

      if (params?.startDate || params?.endDate) {
        query.createdAt = {};
        if (params.startDate) query.createdAt.$gte = params.startDate;
        if (params.endDate) query.createdAt.$lte = params.endDate;
      }
      if (params?.assigneeId) {
        query.assigneeId = params.assigneeId;
      }

      const stats = await WorkOrder.aggregate([
        { $match: query },
        {
          $group: {
            _id: { status: '$status', type: '$type' },
            count: { $sum: 1 }
          }
        }
      ]);

      const result: any = {
        total: 0,
        byStatus: {},
        byType: {}
      };

      stats.forEach((stat: any) => {
        result.total += stat.count;
        result.byStatus[stat._id.status] = (result.byStatus[stat._id.status] || 0) + stat.count;
        result.byType[stat._id.type] = (result.byType[stat._id.type] || 0) + stat.count;
      });

      return result;
    } catch (error) {
      logger.error('获取工单统计失败:', error);
      throw error;
    }
  }
}

export const maintenanceService = MaintenanceService.getInstance();
