import { v4 as uuidv4 } from 'uuid';
import { config } from '@config/index';
import { Device } from '@models/Device';
import { DeviceCommand, DeviceCommandType, DeviceCommandStatus } from '@models/DeviceCommand';
import { CryptoService } from '@security/crypto';
import { AntiReplayProtection } from '@security/antiReplay';
import { DeviceAuthService } from '@security/deviceAuth';
import { logger } from '@utils/logger';
import { mqttClient } from './mqttClient';

export enum CommandType {
  REBOOT = 'reboot',
  PARAM_CONFIG = 'param_config',
  FIRMWARE_UPGRADE = 'firmware_upgrade',
  STATUS_QUERY = 'status_query',
  FACTORY_RESET = 'factory_reset'
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  EXECUTING = 'executing',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

export interface CommandPayload {
  commandId: string;
  type: CommandType;
  timestamp: number;
  nonce: string;
  params?: Record<string, any>;
  firmwareUrl?: string;
  firmwareVersion?: string;
  signature?: string;
}

export interface CommandResponse {
  commandId: string;
  deviceId: string;
  status: CommandStatus;
  timestamp: number;
  result?: Record<string, any>;
  errorCode?: number;
  errorMessage?: string;
  progress?: number;
  nonce?: string;
  signature?: string;
}

export interface CommandResult {
  success: boolean;
  commandId: string;
  status: CommandStatus;
  result?: any;
  error?: string;
}

interface PendingCommand {
  command: CommandPayload;
  deviceId: string;
  status: CommandStatus;
  createdAt: number;
  timeoutAt: number;
  retries: number;
  maxRetries: number;
}

class DeviceCommandService {
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private commandTimeout: number = 300000;
  private maxRetries: number = 3;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupResponseHandlers();
    this.startTimeoutChecker();
  }

  private setupResponseHandlers(): void {
    const responseTopic = `device/+/command/response`;
    mqttClient.subscribe(responseTopic, this.handleCommandResponse.bind(this));
  }

  private startTimeoutChecker(): void {
    setInterval(() => {
      this.checkPendingCommandsTimeout();
    }, 5000);
  }

  private checkPendingCommandsTimeout(): void {
    const now = Date.now();
    for (const [commandId, pendingCmd] of Array.from(this.pendingCommands.entries())) {
      if (now > pendingCmd.timeoutAt) {
        if (pendingCmd.retries < pendingCmd.maxRetries) {
          this.retryCommand(commandId, pendingCmd);
        } else {
          this.handleCommandTimeout(commandId, pendingCmd);
        }
      }
    }
  }

  private async retryCommand(commandId: string, pendingCmd: PendingCommand): Promise<void> {
    pendingCmd.retries++;
    pendingCmd.timeoutAt = Date.now() + this.commandTimeout;
    logger.warn(`[DeviceCommand] 重试指令 ${commandId}，第 ${pendingCmd.retries} 次`);

    const topic = `device/${pendingCmd.deviceId}/command`;
    await mqttClient.publish(topic, pendingCmd.command, 1);
  }

  private async handleCommandTimeout(commandId: string, pendingCmd: PendingCommand): Promise<void> {
    logger.error(`[DeviceCommand] 指令超时 - CommandId: ${commandId}, DeviceId: ${pendingCmd.deviceId}`);

    this.pendingCommands.delete(commandId);

    await DeviceCommand.updateOne(
      { commandId },
      {
        status: CommandStatus.TIMEOUT as DeviceCommandStatus
      }
    );
  }

  private async handleCommandResponse(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      const response: CommandResponse = JSON.parse(payload.toString());

      logger.info(`[DeviceCommand] 收到指令响应 - DeviceId: ${deviceId}, CommandId: ${response.commandId}`);

      const isValid = await this.validateResponse(deviceId, response);
      if (!isValid) {
        logger.error(`[DeviceCommand] 响应验证失败 - DeviceId: ${deviceId}, CommandId: ${response.commandId}`);
        return;
      }

      const isReplay = await AntiReplayProtection.checkReplayAttack(
        deviceId,
        response.nonce || response.commandId,
        Math.floor(response.timestamp / 1000)
      );

      if (isReplay.isReplay) {
        logger.warn(`[DeviceCommand] 检测到重放攻击 - CommandId: ${response.commandId}`);
        return;
      }

      if (!isReplay.isTimestampValid) {
        logger.warn(`[DeviceCommand] 时间戳无效 - CommandId: ${response.commandId}`);
        return;
      }

      await this.processCommandResponse(deviceId, response);
    } catch (error) {
      logger.error('[DeviceCommand] 处理指令响应错误', error);
    }
  }

  private async validateResponse(deviceId: string, response: CommandResponse): Promise<boolean> {
    try {
      const device = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (!device) {
        logger.error(`[DeviceCommand] 设备不存在 - DeviceId: ${deviceId}`);
        return false;
      }

      const signature = response.signature;
      if (!signature) {
        logger.error(`[DeviceCommand] 缺少签名 - CommandId: ${response.commandId}`);
        return false;
      }

      const responseWithoutSignature = { ...response };
      delete responseWithoutSignature.signature;

      const isValid = CryptoService.verifySignature(
        JSON.stringify(responseWithoutSignature),
        signature,
        device.deviceSecret
      );

      if (!isValid) {
        logger.error(`[DeviceCommand] 签名验证失败 - CommandId: ${response.commandId}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[DeviceCommand] 验证响应错误', error);
      return false;
    }
  }

  private async processCommandResponse(deviceId: string, response: CommandResponse): Promise<void> {
    const pendingCmd = this.pendingCommands.get(response.commandId);
    if (!pendingCmd) {
      logger.warn(`[DeviceCommand] 未找到待处理指令 - CommandId: ${response.commandId}`);
      return;
    }

    pendingCmd.status = response.status;

    const updateData: any = {
      status: response.status as DeviceCommandStatus,
      result: response.result,
      errorCode: response.errorCode,
      errorMessage: response.errorMessage,
      progress: response.progress
    };

    if (response.status === CommandStatus.ACKNOWLEDGED) {
      updateData.acknowledgedAt = new Date();
    } else if (response.status === CommandStatus.SUCCESS ||
               response.status === CommandStatus.FAILED ||
               response.status === CommandStatus.TIMEOUT) {
      updateData.completedAt = new Date();
    }

    await DeviceCommand.updateOne(
      { commandId: response.commandId },
      updateData
    );

    if (response.status === CommandStatus.SUCCESS ||
        response.status === CommandStatus.FAILED ||
        response.status === CommandStatus.TIMEOUT) {
      this.pendingCommands.delete(response.commandId);
      logger.info(`[DeviceCommand] 指令执行完成 - CommandId: ${response.commandId}, Status: ${response.status}`);
    }
  }

  private async createCommandPayload(
    deviceId: string,
    type: CommandType,
    params?: Record<string, any>
  ): Promise<CommandPayload> {
    const commandId = uuidv4().toUpperCase();
    const nonce = CryptoService.generateNonce();
    const timestamp = Date.now();

    const payload: CommandPayload = {
      commandId,
      type,
      timestamp,
      nonce,
      params
    };

    const device = await Device.findOne({ deviceId }).select('+deviceSecret');
    if (device && device.deviceSecret) {
      const signature = CryptoService.hmacSHA256WithDeviceSecret(
        device.deviceSecret,
        JSON.stringify(payload)
      );
      payload.signature = signature;
    }

    return payload;
  }

  public async sendRebootCommand(deviceId: string, delaySeconds: number = 0): Promise<CommandResult> {
    logger.info(`[DeviceCommand] 发送重启指令 - DeviceId: ${deviceId}, 延迟: ${delaySeconds}s`);

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不存在'
      };
    }

    const isOnline = await this.checkDeviceOnline(deviceId);
    if (!isOnline) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不在线'
      };
    }

    const payload = await this.createCommandPayload(deviceId, CommandType.REBOOT, {
      delaySeconds
    });

    return this.sendCommand(deviceId, payload);
  }

  public async sendParamConfigCommand(
    deviceId: string,
    params: Record<string, any>
  ): Promise<CommandResult> {
    logger.info(`[DeviceCommand] 发送参数配置指令 - DeviceId: ${deviceId}`);

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不存在'
      };
    }

    const isOnline = await this.checkDeviceOnline(deviceId);
    if (!isOnline) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不在线'
      };
    }

    const payload = await this.createCommandPayload(deviceId, CommandType.PARAM_CONFIG, params);

    return this.sendCommand(deviceId, payload);
  }

  public async sendFirmwareUpgradeCommand(
    deviceId: string,
    firmwareUrl: string,
    firmwareVersion: string
  ): Promise<CommandResult> {
    logger.info(`[DeviceCommand] 发送固件升级指令 - DeviceId: ${deviceId}, Version: ${firmwareVersion}`);

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不存在'
      };
    }

    const isOnline = await this.checkDeviceOnline(deviceId);
    if (!isOnline) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不在线'
      };
    }

    const payload = await this.createCommandPayload(deviceId, CommandType.FIRMWARE_UPGRADE, {
      firmwareUrl,
      firmwareVersion
    });
    payload.firmwareUrl = firmwareUrl;
    payload.firmwareVersion = firmwareVersion;

    return this.sendCommand(deviceId, payload);
  }

  public async sendStatusQueryCommand(deviceId: string): Promise<CommandResult> {
    logger.info(`[DeviceCommand] 发送状态查询指令 - DeviceId: ${deviceId}`);

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不存在'
      };
    }

    const isOnline = await this.checkDeviceOnline(deviceId);
    if (!isOnline) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不在线'
      };
    }

    const payload = await this.createCommandPayload(deviceId, CommandType.STATUS_QUERY);

    return this.sendCommand(deviceId, payload);
  }

  public async sendFactoryResetCommand(deviceId: string): Promise<CommandResult> {
    logger.info(`[DeviceCommand] 发送恢复出厂设置指令 - DeviceId: ${deviceId}`);

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不存在'
      };
    }

    const isOnline = await this.checkDeviceOnline(deviceId);
    if (!isOnline) {
      return {
        success: false,
        commandId: '',
        status: CommandStatus.FAILED,
        error: '设备不在线'
      };
    }

    const payload = await this.createCommandPayload(deviceId, CommandType.FACTORY_RESET);

    return this.sendCommand(deviceId, payload);
  }

  private async checkDeviceOnline(deviceId: string): Promise<boolean> {
    const device = await Device.findOne({ deviceId });
    if (device) {
      return device.status === 'online';
    }
    return false;
  }

  private async sendCommand(deviceId: string, payload: CommandPayload): Promise<CommandResult> {
    try {
      const topic = `device/${deviceId}/command`;

      await DeviceCommand.create({
        commandId: payload.commandId,
        deviceId,
        type: payload.type as DeviceCommandType,
        status: CommandStatus.PENDING as DeviceCommandStatus,
        params: payload.params,
        firmwareUrl: payload.firmwareUrl,
        firmwareVersion: payload.firmwareVersion,
        requestData: payload
      });

      await mqttClient.publish(topic, payload, 1);

      const pendingCmd: PendingCommand = {
        command: payload,
        deviceId,
        status: CommandStatus.SENT,
        createdAt: Date.now(),
        timeoutAt: Date.now() + this.commandTimeout,
        retries: 0,
        maxRetries: this.maxRetries
      };

      this.pendingCommands.set(payload.commandId, pendingCmd);

      await DeviceCommand.updateOne(
        { commandId: payload.commandId },
        {
          status: CommandStatus.SENT as DeviceCommandStatus,
          sentAt: new Date()
        }
      );

      logger.info(`[DeviceCommand] 指令已发送 - CommandId: ${payload.commandId}, Type: ${payload.type}`);

      return {
        success: true,
        commandId: payload.commandId,
        status: CommandStatus.SENT
      };
    } catch (error) {
      logger.error('[DeviceCommand] 发送指令失败', error);

      await DeviceCommand.updateOne(
        { commandId: payload.commandId },
        {
          status: CommandStatus.FAILED as DeviceCommandStatus,
          errorMessage: error instanceof Error ? error.message : '未知错误'
        }
      );

      return {
        success: false,
        commandId: payload.commandId,
        status: CommandStatus.FAILED,
        error: error instanceof Error ? error.message : '发送指令失败'
      };
    }
  }

  public getCommandStatus(commandId: string): CommandStatus | null {
    const pendingCmd = this.pendingCommands.get(commandId);
    return pendingCmd ? pendingCmd.status : null;
  }

  public async getCommandHistory(deviceId: string, limit: number = 20): Promise<any[]> {
    const commands = await DeviceCommand.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return commands.map(t => ({
      commandId: t.commandId,
      type: t.type,
      status: t.status,
      result: t.result,
      errorCode: t.errorCode,
      errorMessage: t.errorMessage,
      createdAt: t.createdAt
    }));
  }

  public getPendingCommandsCount(): number {
    return this.pendingCommands.size;
  }

  public cancelCommand(commandId: string): boolean {
    if (this.pendingCommands.has(commandId)) {
      this.pendingCommands.delete(commandId);
      logger.info(`[DeviceCommand] 已取消指令 - CommandId: ${commandId}`);
      return true;
    }
    return false;
  }
}

export const deviceCommandService = new DeviceCommandService();
export default deviceCommandService;
