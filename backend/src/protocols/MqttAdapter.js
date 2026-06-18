class MqttAdapter {
  constructor() {
    this.connected = false;
    this.pendingRequests = new Map();
  }

  async connect() {
    this.connected = true;
    return this;
  }

  async sendCommand(device, command, params, options) {
    if (!this.connected) {
      await this.connect();
    }

    const topic = `device/${device.deviceCode}/cmd/${command}`;
    const payload = {
      requestId: options.requestId,
      command,
      params,
      timestamp: Date.now(),
    };

    return this.simulateDeviceResponse(device, command, params);
  }

  simulateDeviceResponse(device, command, params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = {
          start: {
            success: true,
            message: '设备已启动',
            data: {
              startedAt: new Date(),
              estimatedEnd: new Date(Date.now() + (params.duration || 30) * 60 * 1000),
            },
          },
          stop: {
            success: true,
            message: '设备已停止',
            data: {
              stoppedAt: new Date(),
              usedDuration: params.usedDuration || 0,
              metrics: {
                waterUsed: Math.random() * 50,
                electricityUsed: Math.random() * 2,
              },
            },
          },
          pause: {
            success: true,
            message: '设备已暂停',
            data: { pausedAt: new Date() },
          },
          resume: {
            success: true,
            message: '设备已恢复',
            data: { resumedAt: new Date() },
          },
          status: {
            success: true,
            data: {
              workingStatus: ['idle', 'running', 'paused'][Math.floor(Math.random() * 3)],
              temperature: 25 + Math.random() * 15,
              progress: Math.floor(Math.random() * 100),
              remainingTime: Math.floor(Math.random() * 30),
              error: null,
            },
          },
          set_settings: {
            success: true,
            message: '设置已更新',
            data: params,
          },
        };

        resolve(responses[command] || { success: true, message: '命令已执行' });
      }, 500 + Math.random() * 1000);
    });
  }

  disconnect() {
    this.connected = false;
  }
}

module.exports = MqttAdapter;
