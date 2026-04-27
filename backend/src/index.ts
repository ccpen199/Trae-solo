import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { SensorDataService } from './services/sensorDataService';
import { AerationControlService, PondLoad } from './services/aerationControlService';
import { EmergencyService } from './services/emergencyService';
import { FeedingControlService } from './services/feedingControlService';
import { AlertService } from './services/alertService';
import { Alert, AerationPlan, FeedingPlan, PondEnvironment } from './types';
import { PowerMonitorData } from './engines/powerSwitchEngine';
import { AcousticSensorData } from './engines/feedingDecisionEngine';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

const sensorService = new SensorDataService();
const aerationService = new AerationControlService();
const emergencyService = new EmergencyService();
const feedingService = new FeedingControlService();
const alertService = new AlertService();

const clients: Map<string, WebSocket> = new Map();

const broadcast = (data: unknown) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const handleNewAlert = (alert: Alert) => {
  alertService.createAlert({
    ...alert,
    id: uuidv4()
  });
  broadcast({
    type: 'NEW_ALERT',
    data: alert
  });
};

sensorService.onAlert(handleNewAlert);
aerationService.onAlert(handleNewAlert);
emergencyService.onAlert(handleNewAlert);
feedingService.onAlert(handleNewAlert);

wss.on('connection', (ws, request) => {
  const clientId = uuidv4();
  console.log(`✓ 新的 WebSocket 连接: ${clientId}`);
  console.log(`  来源: ${request.headers.origin || request.socket.remoteAddress}`);
  clients.set(clientId, ws);

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    data: { clientId, timestamp: Date.now() }
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      console.log(`收到消息 [${clientId}]:`, parsed.type);
      handleWebSocketMessage(parsed, ws);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`✗ WebSocket 连接关闭 [${clientId}]: code=${code}, reason=${reason}`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`✗ WebSocket 错误 [${clientId}]:`, error.message);
  });
});

const handleWebSocketMessage = (message: { type: string; data?: unknown }, ws: WebSocket) => {
  switch (message.type) {
    case 'GET_STATUS':
      ws.send(JSON.stringify({
        type: 'STATUS_UPDATE',
        data: {
          ponds: sensorService.getPonds(),
          devices: [
            ...sensorService.getDevices(),
            ...aerationService.getDevices(),
            ...emergencyService.getDevices(),
            ...feedingService.getDevices()
          ],
          businessNodes: [
            ...sensorService.getBusinessNodes(),
            ...aerationService.getBusinessNodes(),
            ...emergencyService.getBusinessNodes(),
            ...feedingService.getBusinessNodes()
          ],
          powerStatus: emergencyService.getPowerStatus(),
          alerts: alertService.getActiveAlerts(),
          timestamp: Date.now()
        }
      }));
      break;

    case 'ACKNOWLEDGE_ALERT':
      if (message.data && typeof message.data === 'object') {
        const { alertId, operator } = message.data as { alertId: string; operator: string };
        const alert = alertService.acknowledgeAlert(alertId, operator);
        if (alert) {
          broadcast({
            type: 'ALERT_ACKNOWLEDGED',
            data: alert
          });
        }
      }
      break;

    case 'RESOLVE_ALERT':
      if (message.data && typeof message.data === 'object') {
        const { alertId } = message.data as { alertId: string };
        const alert = alertService.resolveAlert(alertId);
        if (alert) {
          broadcast({
            type: 'ALERT_RESOLVED',
            data: alert
          });
        }
      }
      break;

    case 'APPROVE_AERATION_PLAN':
      if (message.data && typeof message.data === 'object') {
        const { planId, approver } = message.data as { planId: string; approver: string };
        const plan = aerationService.approvePlan(planId, approver);
        if (plan) {
          broadcast({
            type: 'AERATION_PLAN_APPROVED',
            data: plan
          });
        }
      }
      break;

    case 'APPROVE_FEEDING_PLAN':
      if (message.data && typeof message.data === 'object') {
        const { planId, approver } = message.data as { planId: string; approver: string };
        const plan = feedingService.approveFeedingPlan(planId, approver);
        if (plan) {
          broadcast({
            type: 'FEEDING_PLAN_APPROVED',
            data: plan
          });
        }
      }
      break;

    case 'SIMULATE_SENSOR_DATA':
      if (message.data && typeof message.data === 'object') {
        const { pondId, dissolvedOxygen, temperature, ammoniaNitrogen, nitrite } = message.data as {
          pondId: string;
          dissolvedOxygen: number;
          temperature: number;
          ammoniaNitrogen: number;
          nitrite: number;
        };
        
        const sensorData = sensorService.processSensorData({
          pondId,
          timestamp: Date.now(),
          ammoniaNitrogen,
          nitrite,
          dissolvedOxygen,
          temperature
        });

        feedingService.updateSensorData(sensorData);

        broadcast({
          type: 'SENSOR_DATA_UPDATED',
          data: sensorData
        });

        const doTrend = sensorService.getDOEngine().getTrend(pondId);
        if (doTrend) {
          broadcast({
            type: 'DO_TREND_UPDATED',
            data: doTrend
          });
        }
      }
      break;

    case 'SIMULATE_POWER_LOSS':
      emergencyService.simulatePowerLoss();
      broadcast({
        type: 'EMERGENCY_MODE_CHANGED',
        data: { isEmergency: true }
      });
      break;

    case 'SIMULATE_POWER_RESTORE':
      emergencyService.simulatePowerRestore();
      broadcast({
        type: 'EMERGENCY_MODE_CHANGED',
        data: { isEmergency: false }
      });
      break;

    case 'GENERATE_AERATION_PLAN':
      if (message.data && typeof message.data === 'object') {
        const { pondId, currentDO, temperature, fishBiomass, waterVolume } = message.data as PondLoad;
        
        const doTrend = sensorService.getDOEngine().getTrend(pondId);
        const plan = aerationService.calculateOptimalAerationPlan({
          pondId,
          currentDO,
          temperature,
          fishBiomass,
          waterVolume
        }, doTrend);

        ws.send(JSON.stringify({
          type: 'AERATION_PLAN_GENERATED',
          data: plan
        }));
      }
      break;

    case 'GENERATE_FEEDING_PLAN':
      if (message.data && typeof message.data === 'object') {
        const { pondId, fishWeight, waterTemperature, waterQualityScore, acousticData } = message.data as {
          pondId: string;
          fishWeight: number;
          waterTemperature: number;
          waterQualityScore: number;
          acousticData?: {
            feedingIntensity: number;
            frequencyBand: number;
            analysisTime: number;
            interpretation: string;
          };
        };

        const env: PondEnvironment = {
          pondId,
          fishWeight,
          fishCount: 1000,
          waterTemperature,
          waterQualityScore
        };

        const plan = feedingService.generateFeedingPlan(env, acousticData);

        ws.send(JSON.stringify({
          type: 'FEEDING_PLAN_GENERATED',
          data: plan
        }));
      }
      break;
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/ponds', (req, res) => {
  res.json(sensorService.getPonds());
});

app.get('/api/devices', (req, res) => {
  res.json([
    ...sensorService.getDevices(),
    ...aerationService.getDevices(),
    ...emergencyService.getDevices(),
    ...feedingService.getDevices()
  ]);
});

app.get('/api/alerts', (req, res) => {
  const { status } = req.query;
  if (status === 'active') {
    res.json(alertService.getActiveAlerts());
  } else if (status === 'acknowledged') {
    res.json(alertService.getAcknowledgedAlerts());
  } else if (status === 'resolved') {
    res.json(alertService.getResolvedAlerts());
  } else {
    res.json(alertService.getAllAlerts());
  }
});

app.get('/api/business-nodes', (req, res) => {
  res.json([
    ...sensorService.getBusinessNodes(),
    ...aerationService.getBusinessNodes(),
    ...emergencyService.getBusinessNodes(),
    ...feedingService.getBusinessNodes()
  ]);
});

app.get('/api/power-status', (req, res) => {
  res.json(emergencyService.getPowerStatus());
});

app.get('/api/aeration-plans', (req, res) => {
  res.json(aerationService.getAllPlans());
});

app.get('/api/feeding-plans', (req, res) => {
  res.json(feedingService.getAllPlans());
});

app.get('/api/sensor-data/:pondId', (req, res) => {
  const { pondId } = req.params;
  const { limit } = req.query;
  const data = sensorService.getSensorData(pondId, limit ? parseInt(limit as string) : undefined);
  res.json(data);
});

app.post('/api/sensor-data', (req, res) => {
  const { pondId, dissolvedOxygen, temperature, ammoniaNitrogen, nitrite } = req.body;
  
  const sensorData = sensorService.processSensorData({
    pondId,
    timestamp: Date.now(),
    ammoniaNitrogen,
    nitrite,
    dissolvedOxygen,
    temperature
  });

  feedingService.updateSensorData(sensorData);
  broadcast({ type: 'SENSOR_DATA_UPDATED', data: sensorData });
  
  res.json(sensorData);
});

app.post('/api/power-data', (req, res) => {
  const { isPowered, voltage, current, source } = req.body as PowerMonitorData;
  
  const status = emergencyService.processPowerData({
    isPowered,
    voltage,
    current,
    timestamp: Date.now(),
    source
  });

  broadcast({ type: 'POWER_STATUS_UPDATED', data: status });
  
  res.json(status);
});

app.post('/api/acoustic-data', (req, res) => {
  const { pondId, frequencyData, intensityData, source } = req.body as AcousticSensorData;
  
  const result = feedingService.processAcousticData({
    pondId,
    timestamp: Date.now(),
    frequencyData,
    intensityData,
    source
  });

  broadcast({ type: 'ACOUSTIC_DATA_UPDATED', data: result });
  
  res.json(result);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`水产养殖监控系统后端服务已启动`);
  console.log(`HTTP 服务器: http://localhost:${PORT}`);
  console.log(`WebSocket 端点: ws://localhost:${PORT}/ws`);
});
