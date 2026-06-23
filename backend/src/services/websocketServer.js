const WebSocket = require('ws');
const http = require('http');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.setupHandlers();
    console.log('🔌 WebSocket 服务已启动');
  }

  setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = Math.random().toString(36).substring(2, 15);
      console.log(`📡 新客户端连接: ${clientId}`);

      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        role: req.headers['x-user-role'] || 'viewer'
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (err) {
          console.error('❌ WebSocket 消息解析失败:', err);
          ws.send(JSON.stringify({ type: 'error', message: '无效的消息格式' }));
        }
      });

      ws.on('close', () => {
        console.log(`📡 客户端断开连接: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket 错误:', err);
      });

      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: '连接成功'
      }));
    });
  }

  handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        if (data.channel) {
          client.subscriptions.add(data.channel);
          client.ws.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel
          }));
          console.log(`📡 客户端 ${clientId} 订阅频道: ${data.channel}`);
        }
        break;

      case 'unsubscribe':
        if (data.channel) {
          client.subscriptions.delete(data.channel);
          client.ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: data.channel
          }));
        }
        break;

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          message: '未知的消息类型'
        }));
    }
  }

  broadcast(channel, data) {
    const message = JSON.stringify({
      type: 'message',
      channel,
      data,
      timestamp: Date.now()
    });

    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  sendAlert(alert) {
    this.broadcast('alerts', {
      type: 'new_alert',
      alert: {
        id: alert._id,
        alertId: alert.alertId,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        deviceId: alert.deviceId,
        createdAt: alert.createdAt
      }
    });
    console.log('🚨 广播新告警:', alert.alertId);
  }

  sendDeviceStatusUpdate(device) {
    this.broadcast('devices', {
      type: 'device_status',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        currentFlowRate: device.currentFlowRate,
        lastHeartbeat: device.lastHeartbeat
      }
    });
  }

  sendTransactionUpdate(transaction) {
    this.broadcast('transactions', {
      type: 'new_transaction',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        studentId: transaction.studentId,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  }

  sendWorkOrderUpdate(workOrder) {
    this.broadcast('workorders', {
      type: 'workorder_update',
      workOrder: {
        id: workOrder._id,
        orderId: workOrder.orderId,
        status: workOrder.status,
        priority: workOrder.priority,
        title: workOrder.title,
        assigneeName: workOrder.assigneeName
      }
    });
  }

  getConnectedClients() {
    return this.clients.size;
  }

  close() {
    this.wss.close();
    console.log('🔌 WebSocket 服务已关闭');
  }
}

let wsServer = null;

function initWebSocket(server) {
  if (!wsServer) {
    wsServer = new WebSocketServer(server);
  }
  return wsServer;
}

function getWebSocketServer() {
  return wsServer;
}

module.exports = {
  initWebSocket,
  getWebSocketServer
};
