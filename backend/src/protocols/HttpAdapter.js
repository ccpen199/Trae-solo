class HttpAdapter {
  constructor() {
    this.baseUrl = 'http://device.local/api';
  }

  async sendCommand(device, command, params, options) {
    const url = `${this.baseUrl}/${device.deviceCode}/${command}`;
    
    return this.simulateHttpResponse(device, command, params);
  }

  simulateHttpResponse(device, command, params) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.05) {
          reject(new Error('设备请求超时'));
          return;
        }

        const responses = {
          start: {
            code: 200,
            success: true,
            data: {
              sessionId: Date.now().toString(),
              startedAt: new Date().toISOString(),
            },
          },
          stop: {
            code: 200,
            success: true,
            data: {
              completed: true,
              duration: params.duration || 0,
            },
          },
          status: {
            code: 200,
            success: true,
            data: {
              online: true,
              state: 'running',
              uptime: Math.floor(Math.random() * 86400),
              firmware: 'v1.2.3',
            },
          },
        };

        resolve(responses[command] || { code: 200, success: true });
      }, 200 + Math.random() * 800);
    });
  }
}

module.exports = HttpAdapter;
