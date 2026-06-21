const WebSocket = require('ws');
const http = require('http');
const { URL } = require('url');
const config = require('../config');
const { verifyToken } = require('../utils/common');
const db = require('../config/database');
const { decrypt } = require('../utils/sm4');
const fs = require('fs');
const path = require('path');

class StreamWebSocketServer {
  constructor() {
    this.wss = null;
    this.deviceConnections = new Map();
    this.clientSessions = new Map();
    this.userConnections = new Map();
    this.recordingProcesses = new Map();
    this.init();
    this.startOfflineMonitor();
  }

  init() {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ noServer: true });

    this.server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const queryParams = new URL(request.url, 'http://localhost').searchParams;

      if (pathname === '/stream') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, 'client');
        });
      } else if (pathname === '/device') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, 'device');
        });
      } else if (pathname === '/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, 'user');
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request, connectionType) => {
      const queryParams = new URL(request.url, 'http://localhost').searchParams;

      if (connectionType === 'client') {
        this.handleClientConnection(ws, queryParams);
      } else if (connectionType === 'device') {
        this.handleDeviceConnection(ws, queryParams);
      } else if (connectionType === 'user') {
        this.handleUserConnection(ws, queryParams, request);
      }
    });

    this.server.listen(config.wsPort, () => {
      console.log(`WebSocket server started on port ${config.wsPort}`);
    });
  }

  handleClientConnection(ws, queryParams) {
    const sessionId = queryParams.get('session');
    if (!sessionId || !this.clientSessions.has(sessionId)) {
      ws.close(1008, 'Invalid session');
      return;
    }

    const session = this.clientSessions.get(sessionId);
    ws.sessionId = sessionId;
    ws.deviceId = session.deviceId;
    ws.userId = session.userId;
    ws.permission = session.permission;
    ws.connectionType = 'client';
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (ws.permission === 'view') return;

        if (message.type === 'ptz' && ws.permission === 'config') {
          this.sendToDevice(ws.deviceId, JSON.stringify({
            type: 'ptz',
            command: message.command,
            speed: message.speed
          }));
        }

        if ((message.type === 'audio' || message.audioData) && (ws.permission === 'talk' || ws.permission === 'config')) {
          this.sendAudioToDevice(ws.deviceId, message.audioData || message.data, message.format || 'pcm');
        }

        if (message.type === 'request_keyframe') {
          this.sendToDevice(ws.deviceId, JSON.stringify({ type: 'request_keyframe' }));
        }
      } catch (e) {
        console.error('Client message parse error:', e);
      }
    });

    ws.on('close', () => {
      const deviceClients = this.getClientsForDevice(ws.deviceId);
      if (deviceClients.size === 1) {
        this.sendToDevice(ws.deviceId, JSON.stringify({ type: 'viewer_count', count: 0 }));
      }
    });

    const deviceClients = this.getClientsForDevice(ws.deviceId);
    this.sendToDevice(ws.deviceId, JSON.stringify({
      type: 'viewer_count',
      count: deviceClients.size
    }));
  }

  handleDeviceConnection(ws, queryParams) {
    const deviceSN = queryParams.get('sn');
    const token = queryParams.get('token');

    if (!deviceSN) {
      ws.close(1008, 'Device SN required');
      return;
    }

    const device = db.prepare('SELECT * FROM devices WHERE device_sn = ?').get(deviceSN);
    if (!device) {
      ws.close(1008, 'Device not registered');
      return;
    }

    ws.deviceId = device.id;
    ws.deviceSN = deviceSN;
    ws.connectionType = 'device';
    ws.isAlive = true;

    this.deviceConnections.set(device.id, ws);

    db.prepare(`
      UPDATE devices SET online_status = 1, 
      last_heartbeat_at = CURRENT_TIMESTAMP,
      last_online_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(device.id);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        let message;
        if (typeof data === 'string') {
          try {
            message = JSON.parse(data);
          } catch {
            message = { type: 'raw', data };
          }
        } else {
          this.forwardVideoFrame(device.id, data);
          return;
        }

        if (message.type === 'heartbeat') {
          db.prepare('UPDATE devices SET last_heartbeat_at = CURRENT_TIMESTAMP WHERE id = ?').run(device.id);
          this.safeSend(ws, JSON.stringify({ type: 'heartbeat_ack', serverTime: Date.now() }));
        }

        if (message.type === 'video_frame' || message.type === 'frame') {
          const frameData = message.encrypted ? decrypt(message.data) : message.data;
          this.forwardVideoFrame(device.id, Buffer.isBuffer(frameData) ? frameData : Buffer.from(frameData, 'base64'));
        }

        if (message.type === 'audio_data' || message.type === 'audio') {
          this.forwardAudioFrame(device.id, message.data || message.audioData);
        }

        if (message.type === 'event') {
          this.handleDeviceEvent(device, message);
        }
      } catch (e) {
        console.error('Device message error:', e);
      }
    });

    ws.on('close', () => {
      this.deviceConnections.delete(device.id);
      db.prepare('UPDATE devices SET online_status = 0 WHERE id = ?').run(device.id);
      this.notifyDeviceStatus(device.owner_id, device.id, 0);
    });

    this.notifyDeviceStatus(device.owner_id, device.id, 1);
    this.safeSend(ws, JSON.stringify({ type: 'connected', serverTime: Date.now() }));
  }

  handleUserConnection(ws, queryParams, request) {
    const token = queryParams.get('token');
    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(1008, 'Invalid token');
      return;
    }

    ws.userId = payload.userId;
    ws.role = payload.role;
    ws.connectionType = 'user';
    ws.isAlive = true;

    if (!this.userConnections.has(payload.userId)) {
      this.userConnections.set(payload.userId, new Set());
    }
    this.userConnections.get(payload.userId).add(ws);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : null;
        if (message && message.type === 'ping') {
          this.safeSend(ws, JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      const userSet = this.userConnections.get(payload.userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          this.userConnections.delete(payload.userId);
        }
      }
    });
  }

  registerStreamSession(sessionId, deviceId, userId, permission) {
    this.clientSessions.set(sessionId, {
      deviceId,
      userId,
      permission,
      createdAt: Date.now()
    });

    setTimeout(() => {
      this.clientSessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000);
  }

  getClientsForDevice(deviceId) {
    const clients = new Set();
    this.wss.clients.forEach((client) => {
      if (client.connectionType === 'client' && client.deviceId === deviceId && client.readyState === WebSocket.OPEN) {
        clients.add(client);
      }
    });
    return clients;
  }

  forwardVideoFrame(deviceId, frameBuffer) {
    const clients = this.getClientsForDevice(deviceId);
    const frameMessage = JSON.stringify({
      type: 'video_frame',
      codec: 'H.264',
      timestamp: Date.now()
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(frameMessage);
        client.send(frameBuffer);
      }
    });
  }

  forwardAudioFrame(deviceId, audioData) {
    const clients = this.getClientsForDevice(deviceId);
    const audioMessage = JSON.stringify({
      type: 'audio_frame',
      format: 'G.711A',
      timestamp: Date.now()
    });

    const audioBuffer = typeof audioData === 'string' ? Buffer.from(audioData, 'base64') : audioData;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(audioMessage);
        if (Buffer.isBuffer(audioBuffer)) client.send(audioBuffer);
      }
    });
  }

  sendToDevice(deviceId, message) {
    const deviceWs = this.deviceConnections.get(deviceId);
    if (deviceWs && deviceWs.readyState === WebSocket.OPEN) {
      this.safeSend(deviceWs, message);
      return true;
    }
    return false;
  }

  sendAudioToDevice(deviceId, audioData, format = 'pcm') {
    return this.sendToDevice(deviceId, JSON.stringify({
      type: 'audio_down',
      format,
      data: audioData
    }));
  }

  broadcastEvent(userId, eventData) {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return;

    const message = JSON.stringify(eventData);
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.safeSend(ws, message);
      }
    });

    const familyMembers = db.prepare('SELECT id FROM users WHERE parent_id = ?').all(userId);
    familyMembers.forEach((member) => {
      const memberConnections = this.userConnections.get(member.id);
      if (memberConnections) {
        memberConnections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            this.safeSend(ws, message);
          }
        });
      }
    });
  }

  notifyDeviceStatus(userId, deviceId, onlineStatus) {
    this.broadcastEvent(userId, {
      type: 'device_status',
      deviceId,
      onlineStatus
    });
  }

  async handleDeviceEvent(device, message) {
    try {
      const AlertController = require('../controllers/AlertController');
      await AlertController.reportAIEvent({
        body: {
          deviceSN: device.device_sn,
          eventType: message.eventType,
          eventLevel: message.eventLevel,
          confidence: message.confidence,
          snapshot: message.snapshot,
          location: message.location,
          description: message.description,
          smartTags: message.smartTags
        }
      }, {
        json: () => {},
        status: () => ({ json: () => {} })
      });
    } catch (e) {
      console.error('Handle device event error:', e);
    }
  }

  startRecording(deviceId, filePath, duration) {
    const process = {
      deviceId,
      filePath,
      duration,
      startTime: Date.now(),
      chunks: [],
      active: true
    };
    this.recordingProcesses.set(deviceId, process);

    setTimeout(() => {
      if (this.recordingProcesses.has(deviceId)) {
        this.stopRecording(deviceId);
      }
    }, duration * 1000);

    return process;
  }

  stopRecording(deviceId) {
    const process = this.recordingProcesses.get(deviceId);
    if (!process) return;

    process.active = false;
    this.recordingProcesses.delete(deviceId);

    const dir = path.dirname(process.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (process.chunks.length > 0) {
      fs.writeFileSync(process.filePath, Buffer.concat(process.chunks));
    }
  }

  startOfflineMonitor() {
    setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const offlineDevices = db.prepare(`
        SELECT id, owner_id, name FROM devices
        WHERE online_status = 1
          AND (last_heartbeat_at IS NULL OR last_heartbeat_at < ?)
      `).all(fiveMinutesAgo);

      offlineDevices.forEach((device) => {
        db.prepare('UPDATE devices SET online_status = 0 WHERE id = ?').run(device.id);
        this.notifyDeviceStatus(device.owner_id, device.id, 0);

        try {
          const AlertController = require('../controllers/AlertController');
          AlertController.triggerAlerts(null, {
            id: device.id,
            owner_id: device.owner_id,
            name: device.name,
            device_sn: ''
          }, 'offline', 'high', `设备 ${device.name} 已离线超过5分钟`, null);
        } catch (e) {}
      });
    }, 60 * 1000);

    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          try { ws.terminate(); } catch (e) {}
          return;
        }
        ws.isAlive = false;
        try { ws.ping(); } catch (e) {}
      });
    }, 30 * 1000);
  }

  safeSend(ws, message) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        return true;
      }
    } catch (e) {}
    return false;
  }
}

const wss = new StreamWebSocketServer();
module.exports = wss;
