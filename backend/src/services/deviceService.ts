import { Device, IDevice } from '@models/Device';
import { DeviceBinding, IDeviceBinding } from '@models/DeviceBinding';
import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo, generateDeviceId, generateQrCode } from '@utils/helpers';

export interface DeviceCreateParams {
  deviceId?: string;
  deviceModel: string;
  deviceName?: string;
  projectId: string;
  location?: {
    type?: 'Point';
    coordinates?: [number, number];
    address: string;
    campus: string;
    building: string;
    floor: string;
    room?: string;
  };
}

export interface DeviceUpdateParams {
  deviceName?: string;
  location?: {
    type?: 'Point';
    coordinates?: [number, number];
    address?: string;
    campus?: string;
    building?: string;
    floor?: string;
    room?: string;
  };
  status?: 'online' | 'offline' | 'fault' | 'maintenance';
  firmwareVersion?: string;
  lastHeartbeatAt?: Date;
}

export interface DeviceBindParams {
  deviceId: string;
  userId: string;
  bindType: 'owner' | 'user';
}

export interface DeviceQueryParams {
  userId?: string;
  projectId?: string;
  status?: string;
  deviceModel?: string;
  page?: number;
  pageSize?: number;
}

export interface DeviceStatusData {
  currentTemperature?: number;
  currentFlowRate?: number;
  totalWaterUsage?: number;
  network?: {
    signalStrength?: number;
  };
  lastOnlineAt?: Date;
}

export class DeviceService {
  private static instance: DeviceService;

  private constructor() {}

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  private validateDeviceId(deviceId: string): boolean {
    const deviceIdRegex = /^[A-Z0-9-]{8,30}$/;
    return deviceIdRegex.test(deviceId);
  }

  public async createDevice(params: DeviceCreateParams): Promise<IDevice> {
    try {
      const { deviceModel, projectId, location } = params;
      const deviceId = params.deviceId || generateDeviceId(deviceModel);

      if (!this.validateDeviceId(deviceId)) {
        throw new Error('设备编号格式不正确');
      }

      if (!deviceModel) {
        throw new Error('设备型号不能为空');
      }

      if (!projectId) {
        throw new Error('项目ID不能为空');
      }

      const existingDevice = await Device.findOne({ deviceId });
      if (existingDevice) {
        throw new Error('设备编号已存在');
      }

      const deviceSecret = CryptoService.generateDeviceSecret(deviceId);
      const qrCode = generateQrCode(deviceId);

      const deviceLocation = location ? {
        type: 'Point' as const,
        coordinates: location.coordinates || [0, 0],
        address: location.address,
        campus: location.campus,
        building: location.building,
        floor: location.floor,
        room: location.room
      } : {
        type: 'Point' as const,
        coordinates: [0, 0] as [number, number],
        address: '未设置',
        campus: '未设置',
        building: '未设置',
        floor: '未设置'
      };

      const device = new Device({
        deviceId,
        deviceModel,
        deviceName: params.deviceName || `${deviceModel}-${deviceId.slice(-4)}`,
        deviceSecret,
        qrCode,
        location: deviceLocation,
        projectId,
        status: 'offline',
        firmwareVersion: '1.0.0',
        hardwareVersion: '1.0.0',
        totalWaterUsage: 0,
        totalRuntime: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        isHeating: false,
        hasColdWater: true,
        hasHotWater: true,
        hasWarmWater: true
      });

      await device.save();
      logger.info(`创建设备成功: deviceId=${deviceId}`);
      return device;
    } catch (error) {
      logger.error('创建设备失败:', error);
      throw error;
    }
  }

  public async getDeviceById(deviceId: string): Promise<IDevice> {
    try {
      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const device = await Device.findById(deviceId)
        .populate('projectId');

      if (!device) {
        throw new Error('设备不存在');
      }

      return device;
    } catch (error) {
      logger.error('获取设备信息失败:', error);
      throw error;
    }
  }

  public async getDeviceByNo(deviceId: string): Promise<IDevice> {
    try {
      if (!deviceId) {
        throw new Error('设备编号不能为空');
      }

      const device = await Device.findOne({ deviceId })
        .populate('projectId');

      if (!device) {
        throw new Error('设备不存在');
      }

      return device;
    } catch (error) {
      logger.error('通过编号获取设备失败:', error);
      throw error;
    }
  }

  public async updateDevice(deviceId: string, params: DeviceUpdateParams): Promise<IDevice> {
    try {
      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const updateData: Partial<IDevice> = {};

      if (params.deviceName !== undefined) {
        if (params.deviceName.length < 1 || params.deviceName.length > 50) {
          throw new Error('设备名称长度必须在1-50个字符之间');
        }
        updateData.deviceName = params.deviceName;
      }

      if (params.location !== undefined) {
        updateData.location = {
          type: 'Point',
          coordinates: params.location.coordinates || [0, 0],
          address: params.location.address || '未设置',
          campus: params.location.campus || '未设置',
          building: params.location.building || '未设置',
          floor: params.location.floor || '未设置',
          room: params.location.room
        } as IDevice['location'];
      }

      if (params.status !== undefined) {
        if (!['online', 'offline', 'fault', 'maintenance'].includes(params.status)) {
          throw new Error('无效的设备状态');
        }
        updateData.status = params.status;
      }

      if (params.firmwareVersion !== undefined) {
        updateData.firmwareVersion = params.firmwareVersion;
      }

      if (params.lastHeartbeatAt !== undefined) {
        updateData.lastHeartbeatAt = params.lastHeartbeatAt;
      }

      const device = await Device.findByIdAndUpdate(
        deviceId,
        { $set: updateData },
        { new: true }
      );

      if (!device) {
        throw new Error('设备不存在');
      }

      logger.info(`更新设备成功: deviceId=${deviceId}`);
      return device;
    } catch (error) {
      logger.error('更新设备失败:', error);
      throw error;
    }
  }

  public async deleteDevice(deviceId: string): Promise<void> {
    try {
      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('设备不存在');
      }

      await DeviceBinding.deleteMany({ deviceId });

      await Device.findByIdAndDelete(deviceId);

      logger.info(`删除设备成功: deviceId=${deviceId}`);
    } catch (error) {
      logger.error('删除设备失败:', error);
      throw error;
    }
  }

  public async bindDevice(params: DeviceBindParams): Promise<IDeviceBinding> {
    try {
      const { deviceId, userId, bindType } = params;

      if (!deviceId || !userId) {
        throw new Error('设备ID和用户ID不能为空');
      }

      if (!['owner', 'user'].includes(bindType)) {
        throw new Error('无效的绑定类型');
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        throw new Error('设备不存在');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const existingBinding = await DeviceBinding.findOne({ deviceId, userId });
      if (existingBinding && existingBinding.status === 'active') {
        throw new Error('设备已绑定该用户');
      }

      const binding = new DeviceBinding({
        deviceId,
        userId,
        studentPhone: user.phone,
        deviceCode: device.deviceId,
        bindType,
        boundAt: new Date(),
        status: 'active',
        isActive: true,
      });

      await binding.save();

      logger.info(`设备绑定成功: deviceId=${deviceId}, userId=${userId}, bindType=${bindType}`);
      return binding;
    } catch (error) {
      logger.error('设备绑定失败:', error);
      throw error;
    }
  }

  public async unbindDevice(deviceId: string, userId: string): Promise<void> {
    try {
      if (!deviceId || !userId) {
        throw new Error('设备ID和用户ID不能为空');
      }

      const binding = await DeviceBinding.findOne({ deviceId, userId, status: 'active' });
      if (!binding) {
        throw new Error('绑定关系不存在');
      }

      await DeviceBinding.findByIdAndUpdate(binding._id, {
        $set: { status: 'inactive', isActive: false, unboundAt: new Date() }
      });

      logger.info(`设备解绑成功: deviceId=${deviceId}, userId=${userId}`);
    } catch (error) {
      logger.error('设备解绑失败:', error);
      throw error;
    }
  }

  public async getDeviceBindings(deviceId: string): Promise<IDeviceBinding[]> {
    try {
      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const bindings = await DeviceBinding.find({ deviceId, status: 'active' })
        .populate('userId', 'realName phone avatar');

      return bindings;
    } catch (error) {
      logger.error('获取设备绑定列表失败:', error);
      throw error;
    }
  }

  public async getUserDevices(userId: string, params?: Omit<DeviceQueryParams, 'userId'>): Promise<{ devices: IDevice[]; total: number }> {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;

      const bindings = await DeviceBinding.find({ userId, status: 'active' });
      const deviceIds = bindings.map(b => b.deviceId);

      const query: any = { _id: { $in: deviceIds } };

      if (params?.status) {
        query.status = params.status;
      }
      if (params?.deviceModel) {
        query.deviceModel = params.deviceModel;
      }

      const total = await Device.countDocuments(query);
      const devices = await Device.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { devices, total };
    } catch (error) {
      logger.error('获取用户设备列表失败:', error);
      throw error;
    }
  }

  public async queryDevices(params: DeviceQueryParams): Promise<{ devices: IDevice[]; total: number }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;

      const query: any = {};

      if (params.projectId) {
        query.projectId = params.projectId;
      }
      if (params.status) {
        query.status = params.status;
      }
      if (params.deviceModel) {
        query.deviceModel = params.deviceModel;
      }

      const total = await Device.countDocuments(query);
      const devices = await Device.find(query)
        .populate('projectId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { devices, total };
    } catch (error) {
      logger.error('查询设备列表失败:', error);
      throw error;
    }
  }

  public async updateDeviceStatus(deviceId: string, statusData: DeviceStatusData): Promise<IDevice> {
    try {
      if (!deviceId) {
        throw new Error('设备ID不能为空');
      }

      const updateData: Partial<IDevice> = {
        lastHeartbeatAt: new Date(),
        status: 'online'
      };

      if (statusData.currentTemperature !== undefined) {
        updateData.currentTemperature = statusData.currentTemperature;
      }
      if (statusData.currentFlowRate !== undefined) {
        updateData.currentFlowRate = statusData.currentFlowRate;
      }
      if (statusData.totalWaterUsage !== undefined) {
        updateData.totalWaterUsage = statusData.totalWaterUsage;
      }
      if (statusData.network?.signalStrength !== undefined) {
        updateData.network = {
          signalStrength: statusData.network.signalStrength
        };
      }

      const device = await Device.findByIdAndUpdate(
        deviceId,
        { $set: updateData },
        { new: true }
      );

      if (!device) {
        throw new Error('设备不存在');
      }

      return device;
    } catch (error) {
      logger.error('更新设备状态失败:', error);
      throw error;
    }
  }

  public async updateDeviceFirmware(deviceId: string, firmwareVersion: string): Promise<IDevice> {
    try {
      if (!deviceId || !firmwareVersion) {
        throw new Error('参数错误');
      }

      const device = await Device.findByIdAndUpdate(
        deviceId,
        {
          $set: {
            firmwareVersion
          }
        },
        { new: true }
      );

      if (!device) {
        throw new Error('设备不存在');
      }

      logger.info(`设备固件更新成功: deviceId=${deviceId}, version=${firmwareVersion}`);
      return device;
    } catch (error) {
      logger.error('设备固件更新失败:', error);
      throw error;
    }
  }

  public async getDeviceStatistics(projectId?: string): Promise<any> {
    try {
      const match: any = {};
      if (projectId) match.projectId = projectId;

      const stats = await Device.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } },
            offline: { $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] } },
            fault: { $sum: { $cond: [{ $eq: ['$status', 'fault'] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
            totalWaterUsage: { $sum: '$totalWaterUsage' }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        online: 0,
        offline: 0,
        fault: 0,
        maintenance: 0,
        totalWaterUsage: 0
      };
    } catch (error) {
      logger.error('获取设备统计失败:', error);
      throw error;
    }
  }
}

export const deviceService = DeviceService.getInstance();
