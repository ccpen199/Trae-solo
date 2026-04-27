import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControlDevice, DeviceType, DeviceStatus } from './entities/control-device.entity';
import { ControlCommand, ControlCommandType, ControlCommandStatus, ControlSource } from './entities/control-command.entity';
import { SensorsService } from '../sensors/sensors.service';
import { AgronomyService } from '../agronomy/agronomy.service';
import { EnvironmentParameter } from '../agronomy/entities/environment-threshold.entity';

interface PidState {
  integralSum: number;
  lastError: number;
  lastTimestamp: number;
}

@Injectable()
export class ControlService {
  private readonly logger = new Logger(ControlService.name);

  private pidStates: Map<string, PidState> = new Map();

  private readonly deviceTypeToCommandType: Record<DeviceType, ControlCommandType> = {
    [DeviceType.IRRIGATION_VALVE]: ControlCommandType.IRRIGATION,
    [DeviceType.ROLLER_CURTAIN]: ControlCommandType.ROLLER_CURTAIN,
    [DeviceType.VENTILATION_FAN]: ControlCommandType.VENTILATION,
    [DeviceType.HEATER]: ControlCommandType.HEATING,
    [DeviceType.HUMIDIFIER]: ControlCommandType.HUMIDIFICATION,
    [DeviceType.CO2_GENERATOR]: ControlCommandType.CO2_CONTROL,
    [DeviceType.LIGHT_SYSTEM]: ControlCommandType.LIGHTING,
  };

  private readonly deviceTypeToSensorType: Record<DeviceType, {
    sensorType: string;
    parameter: EnvironmentParameter;
  }> = {
    [DeviceType.IRRIGATION_VALVE]: {
      sensorType: 'soil_moisture',
      parameter: EnvironmentParameter.SOIL_MOISTURE,
    },
    [DeviceType.ROLLER_CURTAIN]: {
      sensorType: 'light_intensity',
      parameter: EnvironmentParameter.LIGHT_INTENSITY,
    },
    [DeviceType.VENTILATION_FAN]: {
      sensorType: 'temperature',
      parameter: EnvironmentParameter.TEMPERATURE,
    },
    [DeviceType.HEATER]: {
      sensorType: 'temperature',
      parameter: EnvironmentParameter.TEMPERATURE,
    },
    [DeviceType.HUMIDIFIER]: {
      sensorType: 'humidity',
      parameter: EnvironmentParameter.HUMIDITY,
    },
    [DeviceType.CO2_GENERATOR]: {
      sensorType: 'co2_sensor',
      parameter: EnvironmentParameter.CO2_LEVEL,
    },
    [DeviceType.LIGHT_SYSTEM]: {
      sensorType: 'light_intensity',
      parameter: EnvironmentParameter.LIGHT_INTENSITY,
    },
  };

  constructor(
    @InjectRepository(ControlDevice)
    private deviceRepository: Repository<ControlDevice>,
    @InjectRepository(ControlCommand)
    private commandRepository: Repository<ControlCommand>,
    private sensorsService: SensorsService,
    private agronomyService: AgronomyService,
  ) {}

  async getDeviceById(id: string): Promise<ControlDevice> {
    return this.deviceRepository.findOne({
      where: { id, isDeleted: false },
    });
  }

  async getDevicesInZone(locationZone: string): Promise<ControlDevice[]> {
    return this.deviceRepository.find({
      where: { locationZone, isDeleted: false },
    });
  }

  async calculateAndExecutePidControl(
    deviceId: string,
    targetValue: number,
    cropId?: string,
    growthDay?: number,
    operatorName?: string,
  ): Promise<ControlCommand> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const sensorMapping = this.deviceTypeToSensorType[device.type];
    if (!sensorMapping) {
      throw new Error(`No sensor mapping for device type: ${device.type}`);
    }

    const { parameter } = sensorMapping;

    const optimalValue = await this.determineOptimalValue(device, parameter, cropId, growthDay, targetValue);

    const currentValue = await this.getCurrentValue(device);

    const pidResult = this.calculatePidOutput(device, currentValue, optimalValue);

    const command = await this.createPidCommand(
      device,
      optimalValue,
      currentValue,
      pidResult,
      cropId,
      growthDay,
      operatorName,
    );

    await this.updateDeviceState(device, command, pidResult.output);

    return command;
  }

  private async determineOptimalValue(
    device: ControlDevice,
    parameter: EnvironmentParameter,
    cropId?: string,
    growthDay?: number,
    explicitTarget?: number,
  ): Promise<number> {
    if (explicitTarget !== undefined && explicitTarget !== null) {
      return explicitTarget;
    }

    if (cropId && growthDay !== undefined) {
      const growthStage = await this.agronomyService.getGrowthStageByDay(cropId, growthDay);
      if (growthStage) {
        const optimalRange = await this.agronomyService.getOptimalValue(growthStage.id, parameter);
        if (optimalRange) {
          return optimalRange.optimal;
        }
      }
    }

    if (device.targetValue !== undefined && device.targetValue !== null) {
      return device.targetValue;
    }

    throw new Error('Cannot determine optimal value: no target or crop information provided');
  }

  private async getCurrentValue(device: ControlDevice): Promise<number> {
    if (device.currentValue !== undefined && device.currentValue !== null) {
      return device.currentValue;
    }

    return 0;
  }

  private calculatePidOutput(
    device: ControlDevice,
    currentValue: number,
    targetValue: number,
  ): {
    targetValue: number;
    currentValue: number;
    kp: number;
    ki: number;
    kd: number;
    error: number;
    integralSum: number;
    derivative: number;
    output: number;
  } {
    const pidConfig = device.pidConfig || {
      kp: 1.0,
      ki: 0.1,
      kd: 0.05,
      outputMin: 0,
      outputMax: 100,
      integralMax: 100,
    };

    const { kp, ki, kd, outputMin, outputMax, integralMax } = pidConfig;

    let pidState = this.pidStates.get(device.id);
    const now = Date.now();

    if (!pidState) {
      pidState = {
        integralSum: 0,
        lastError: 0,
        lastTimestamp: now,
      };
      this.pidStates.set(device.id, pidState);
    }

    const error = targetValue - currentValue;
    const dt = (now - pidState.lastTimestamp) / 1000;

    let integralSum = pidState.integralSum + error * dt;
    integralSum = Math.max(-integralMax, Math.min(integralMax, integralSum));

    const derivative = dt > 0 ? (error - pidState.lastError) / dt : 0;

    let output = kp * error + ki * integralSum + kd * derivative;
    output = Math.max(outputMin, Math.min(outputMax, output));

    pidState.integralSum = integralSum;
    pidState.lastError = error;
    pidState.lastTimestamp = now;

    this.pidStates.set(device.id, pidState);

    return {
      targetValue,
      currentValue,
      kp,
      ki,
      kd,
      error,
      integralSum,
      derivative,
      output,
    };
  }

  private async createPidCommand(
    device: ControlDevice,
    targetValue: number,
    currentValue: number,
    pidResult: any,
    cropId?: string,
    growthDay?: number,
    operatorName?: string,
  ): Promise<ControlCommand> {
    const commandType = this.deviceTypeToCommandType[device.type];

    let durationSeconds: number | null = null;
    let flowRate: number | null = null;

    if (device.type === DeviceType.IRRIGATION_VALVE) {
      const { output } = pidResult;
      const maxFlowRate = device.maxCapacity || 100;
      flowRate = (output / 100) * maxFlowRate;

      durationSeconds = 600;
    }

    const command = this.commandRepository.create({
      deviceId: device.id,
      commandType,
      status: ControlCommandStatus.PENDING,
      source: operatorName ? ControlSource.MANUAL : ControlSource.AUTOMATIC,
      targetValue,
      durationSeconds,
      flowRate,
      isPidControlled: true,
      pidResult,
      operatorName,
      reason: this.generateCommandReason(device, targetValue, currentValue),
    });

    if (growthDay !== undefined && cropId) {
      const growthStage = await this.agronomyService.getGrowthStageByDay(cropId, growthDay);
      if (growthStage) {
        command['growthStage'] = growthStage;
      }
    }

    const savedCommand = await this.commandRepository.save(command);

    await this.simulateCommandExecution(savedCommand, device);

    return savedCommand;
  }

  private generateCommandReason(
    device: ControlDevice,
    targetValue: number,
    currentValue: number,
  ): string {
    const deviceNames: Record<DeviceType, string> = {
      [DeviceType.IRRIGATION_VALVE]: '灌溉阀门',
      [DeviceType.ROLLER_CURTAIN]: '卷帘设备',
      [DeviceType.VENTILATION_FAN]: '通风设备',
      [DeviceType.HEATER]: '加热设备',
      [DeviceType.HUMIDIFIER]: '加湿设备',
      [DeviceType.CO2_GENERATOR]: 'CO2发生器',
      [DeviceType.LIGHT_SYSTEM]: '照明系统',
    };

    const delta = targetValue - currentValue;
    const action = delta > 0 ? '增加' : '减少';

    return `${deviceNames[device.type]} PID控制: 当前值${currentValue.toFixed(2)}, 目标值${targetValue.toFixed(2)}, 需要${action}${Math.abs(delta).toFixed(2)}`;
  }

  private async simulateCommandExecution(
    command: ControlCommand,
    device: ControlDevice,
  ): Promise<void> {
    command.status = ControlCommandStatus.EXECUTING;
    command.startedAt = new Date();
    await this.commandRepository.save(command);

    setTimeout(async () => {
      command.status = ControlCommandStatus.COMPLETED;
      command.completedAt = new Date();
      command.executionNotes = '执行成功';
      command.feedbackData = {
        success: true,
        executedAt: new Date().toISOString(),
      };
      await this.commandRepository.save(command);

      device.status = DeviceStatus.RUNNING;
      device.lastOperatedAt = new Date();
      if (command.pidResult) {
        device.currentValue = command.pidResult.targetValue;
      }
      await this.deviceRepository.save(device);

      this.logger.log(`Command ${command.id} executed successfully for device ${device.id}`);
    }, 1000);
  }

  private async updateDeviceState(
    device: ControlDevice,
    command: ControlCommand,
    pidOutput: number,
  ): Promise<void> {
    device.targetValue = command.targetValue;
    device.lastOperatedAt = new Date();
    await this.deviceRepository.save(device);
  }

  async createManualCommand(
    deviceId: string,
    targetValue: number,
    operatorName: string,
    reason?: string,
    durationSeconds?: number,
  ): Promise<ControlCommand> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const commandType = this.deviceTypeToCommandType[device.type];

    const command = this.commandRepository.create({
      deviceId,
      commandType,
      status: ControlCommandStatus.PENDING,
      source: ControlSource.MANUAL,
      targetValue,
      durationSeconds,
      isPidControlled: false,
      operatorName,
      reason: reason || '手动操作',
    });

    const savedCommand = await this.commandRepository.save(command);
    await this.simulateCommandExecution(savedCommand, device);

    return savedCommand;
  }

  async getCommandsForDevice(
    deviceId: string,
    limit: number = 20,
  ): Promise<ControlCommand[]> {
    return this.commandRepository.find({
      where: { deviceId, isDeleted: false },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getPendingCommands(): Promise<ControlCommand[]> {
    return this.commandRepository.find({
      where: {
        status: ControlCommandStatus.PENDING,
        isDeleted: false,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<ControlDevice> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    device.status = status;
    return this.deviceRepository.save(device);
  }

  async createDevice(deviceData: Partial<ControlDevice>): Promise<ControlDevice> {
    const device = this.deviceRepository.create(deviceData);
    return this.deviceRepository.save(device);
  }

  async getAllDevices(): Promise<ControlDevice[]> {
    return this.deviceRepository.find({
      where: { isDeleted: false },
    });
  }

  resetPidState(deviceId: string): void {
    this.pidStates.delete(deviceId);
    this.logger.log(`PID state reset for device: ${deviceId}`);
  }
}
