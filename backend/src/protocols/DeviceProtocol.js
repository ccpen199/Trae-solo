const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const { Device, DeviceCommandLog } = require('../models');

class DeviceProtocol extends EventEmitter {
  constructor() {
    super();
    this.adapters = new Map();
    this.commandTimeouts = new Map();
  }

  registerAdapter(protocol, adapter) {
    this.adapters.set(protocol, adapter);
  }

  getAdapter(protocol) {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`不支持的协议: ${protocol}`);
    }
    return adapter;
  }

  async sendCommand(deviceId, command, params = {}, options = {}) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }

    const requestId = uuidv4();
    const adapter = this.getAdapter(device.protocol);
    
    const isOffline = device.status === 'offline';
    
    if (isOffline && options.allowOffline !== false) {
      await this.queueOfflineCommand(device, command, params, options);
      return {
        requestId,
        status: 'queued',
        message: '设备离线，命令已加入离线队列',
        fromOffline: true,
      };
    }

    if (isOffline && options.allowOffline === false) {
      throw new Error('设备离线，无法执行命令');
    }

    const commandLog = await DeviceCommandLog.create({
      deviceId,
      command,
      params,
      protocol: device.protocol,
      source: options.source || 'user',
      userId: options.userId,
      status: 'sent',
      requestId,
      sentAt: new Date(),
      fromOffline: false,
    });

    try {
      const result = await adapter.sendCommand(device, command, params, {
        requestId,
        timeout: options.timeout || 30000,
      });

      await commandLog.updateOne({
        status: 'executed',
        response: result,
        deliveredAt: new Date(),
        executedAt: new Date(),
      });

      this.emit('command:executed', { deviceId, command, params, result });

      return {
        requestId,
        status: 'executed',
        result,
        fromOffline: false,
      };
    } catch (error) {
      await commandLog.updateOne({
        status: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async queueOfflineCommand(device, command, params, options) {
    device.offlineQueue.push({
      command,
      params,
      timestamp: new Date(),
      synced: false,
    });
    await device.save();

    await DeviceCommandLog.create({
      deviceId: device._id,
      command,
      params,
      protocol: device.protocol,
      source: options.source || 'user',
      userId: options.userId,
      status: 'sent',
      requestId: uuidv4(),
      sentAt: new Date(),
      fromOffline: true,
    });
  }

  async syncOfflineCommands(deviceId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }

    const pendingCommands = device.offlineQueue.filter(cmd => !cmd.synced);
    const results = [];

    for (const cmd of pendingCommands) {
      try {
        const result = await this.sendCommand(deviceId, cmd.command, cmd.params, {
          source: 'offline_sync',
          allowOffline: false,
        });
        cmd.synced = true;
        results.push({ command: cmd.command, status: 'success', result });
      } catch (error) {
        results.push({ command: cmd.command, status: 'failed', error: error.message });
      }
    }

    device.offlineQueue = device.offlineQueue.filter(cmd => !cmd.synced);
    await device.save();

    return results;
  }

  async startDevice(deviceId, options = {}) {
    return this.sendCommand(deviceId, 'start', options.params || {}, options);
  }

  async stopDevice(deviceId, options = {}) {
    return this.sendCommand(deviceId, 'stop', options.params || {}, options);
  }

  async pauseDevice(deviceId, options = {}) {
    return this.sendCommand(deviceId, 'pause', options.params || {}, options);
  }

  async resumeDevice(deviceId, options = {}) {
    return this.sendCommand(deviceId, 'resume', options.params || {}, options);
  }

  async getDeviceStatus(deviceId) {
    return this.sendCommand(deviceId, 'status', {}, { source: 'system' });
  }

  async setDeviceSettings(deviceId, settings, options = {}) {
    return this.sendCommand(deviceId, 'set_settings', settings, options);
  }

  handleDeviceStatusUpdate(deviceCode, status) {
    this.emit('device:status', { deviceCode, status, timestamp: new Date() });
  }

  handleDeviceHeartbeat(deviceCode, data) {
    this.emit('device:heartbeat', { deviceCode, data, timestamp: new Date() });
  }

  handleDeviceFault(deviceCode, faultCode, faultMessage) {
    this.emit('device:fault', { deviceCode, faultCode, faultMessage, timestamp: new Date() });
  }
}

const deviceProtocol = new DeviceProtocol();
module.exports = deviceProtocol;
