const { getAllDevices, getCurrentTemperature, getLatestDeviceData } = require('./deviceService');

const clients = new Map();

function handleWebSocket(ws, wss) {
  const clientId = Date.now().toString();
  clients.set(clientId, { ws, subscriptions: new Set() });
  
  console.log('WebSocket客户端已连接:', clientId);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('WebSocket消息解析错误:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket客户端已断开:', clientId);
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
    clients.delete(clientId);
  });
}

function handleMessage(clientId, message) {
  const { type, payload } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  switch (type) {
    case 'subscribe':
      if (payload.channels) {
        payload.channels.forEach(channel => {
          client.subscriptions.add(channel);
        });
      }
      sendToClient(clientId, {
        type: 'subscribed',
        payload: { channels: Array.from(client.subscriptions) }
      });
      break;
      
    case 'unsubscribe':
      if (payload.channels) {
        payload.channels.forEach(channel => {
          client.subscriptions.delete(channel);
        });
      }
      sendToClient(clientId, {
        type: 'unsubscribed',
        payload: { channels: Array.from(client.subscriptions) }
      });
      break;
      
    case 'ping':
      sendToClient(clientId, { type: 'pong' });
      break;
      
    case 'get_devices':
      const devices = getAllDevices();
      sendToClient(clientId, {
        type: 'devices',
        payload: { devices }
      });
      break;
      
    case 'get_temperature':
      const temp = getCurrentTemperature(payload.deviceId);
      sendToClient(clientId, {
        type: 'temperature',
        payload: { 
          deviceId: payload.deviceId,
          temperature: temp
        }
      });
      break;
      
    default:
      console.log('未知WebSocket消息类型:', type);
  }
}

function sendToClient(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) {
    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
    }
  }
}

function broadcastToChannel(channel, message) {
  clients.forEach((client, clientId) => {
    if (client.subscriptions.has(channel)) {
      sendToClient(clientId, message);
    }
  });
}

function broadcastDeviceUpdate(deviceId, data) {
  broadcastToChannel('devices', {
    type: 'device_update',
    payload: {
      deviceId,
      data,
      timestamp: new Date().toISOString()
    }
  });
}

function broadcastTemperatureUpdate(deviceId, temperature) {
  broadcastToChannel('temperature', {
    type: 'temperature_update',
    payload: {
      deviceId,
      temperature,
      timestamp: new Date().toISOString()
    }
  });
}

function broadcastAlert(alert) {
  broadcastToChannel('alerts', {
    type: 'alert',
    payload: {
      ...alert,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  handleWebSocket,
  sendToClient,
  broadcastToChannel,
  broadcastDeviceUpdate,
  broadcastTemperatureUpdate,
  broadcastAlert
};
