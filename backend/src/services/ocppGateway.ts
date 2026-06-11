import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config';
import { stationService } from './stationService';
import { chargingService, userService } from './userService';
import { settlementService } from './settlementService';
import { v4 as uuidv4 } from 'uuid';

interface OcppMessage {
  0: number;
  1: string;
  2: string;
  3?: any;
}

interface ChargerConnection {
  ws: WebSocket;
  chargerId: string;
  stationId: string | null;
  lastHeartbeat: Date;
}

const connectedChargers = new Map<string, ChargerConnection>();

export function startOcppGateway() {
  const wss = new WebSocketServer({ port: config.ocppPort, host: config.host });

  console.log(`OCPP 1.6 Gateway started on ws://${config.host}:${config.ocppPort}`);

  wss.on('connection', (ws, req) => {
    const url = req.url || '';
    const chargerId = url.split('/').pop() || uuidv4();

    console.log(`Charger connected: ${chargerId}`);

    const connection: ChargerConnection = {
      ws,
      chargerId,
      stationId: null,
      lastHeartbeat: new Date(),
    };
    connectedChargers.set(chargerId, connection);

    ws.on('message', (data) => {
      try {
        const message: OcppMessage = JSON.parse(data.toString());
        handleOcppMessage(chargerId, message, ws);
      } catch (err) {
        console.error('Error parsing OCPP message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`Charger disconnected: ${chargerId}`);
      const conn = connectedChargers.get(chargerId);
      if (conn && conn.stationId) {
        stationService.getPilesByStationId(conn.stationId).forEach(pile => {
          if (pile.pile_code.includes(chargerId) || chargerId.includes(pile.pile_code)) {
            stationService.updatePileStatus(pile.id, 'offline');
          }
        });
      }
      connectedChargers.delete(chargerId);
    });

    ws.on('error', (err) => {
      console.error(`Charger ${chargerId} error:`, err);
    });

    const bootMsg: OcppMessage = [2, uuidv4(), 'BootNotification', {
      chargePointVendor: 'SimulatedVendor',
      chargePointModel: 'SimulatedModel',
      chargePointSerialNumber: chargerId,
    }];
    ws.send(JSON.stringify(bootMsg));
  });

  return wss;
}

function handleOcppMessage(chargerId: string, message: OcppMessage, ws: WebSocket) {
  const [msgType, msgId, action, payload] = message;
  const connection = connectedChargers.get(chargerId);

  if (!connection) return;

  switch (msgType) {
    case 2:
      handleRequest(chargerId, msgId, action, payload, ws);
      break;
    case 3:
      handleResponse(chargerId, msgId, payload);
      break;
    case 4:
      console.log(`OCPP Error from ${chargerId}:`, payload);
      break;
  }
}

function handleRequest(chargerId: string, msgId: string, action: string, payload: any, ws: WebSocket) {
  let responsePayload: any = {};

  switch (action) {
    case 'BootNotification':
      responsePayload = {
        status: 'Accepted',
        currentTime: new Date().toISOString(),
        heartbeatInterval: 30,
      };
      break;

    case 'Heartbeat':
      const conn = connectedChargers.get(chargerId);
      if (conn) {
        conn.lastHeartbeat = new Date();
      }
      responsePayload = {
        currentTime: new Date().toISOString(),
      };
      break;

    case 'StatusNotification':
      handleStatusNotification(chargerId, payload);
      responsePayload = {};
      break;

    case 'MeterValues':
      handleMeterValues(chargerId, payload);
      responsePayload = {};
      break;

    case 'StartTransaction':
      responsePayload = handleStartTransaction(chargerId, payload);
      break;

    case 'StopTransaction':
      responsePayload = handleStopTransaction(chargerId, payload);
      break;

    case 'Authorize':
      responsePayload = {
        idTagInfo: {
          status: 'Accepted',
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
        },
      };
      break;

    default:
      responsePayload = {};
  }

  const response: OcppMessage = [3, msgId, responsePayload];
  ws.send(JSON.stringify(response));
}

function handleResponse(chargerId: string, msgId: string, payload: any) {
  console.log(`Response from ${chargerId}, msgId: ${msgId}`, payload);
}

function handleStatusNotification(chargerId: string, payload: any) {
  const { connectorId, status, errorCode } = payload;
  console.log(`Status from ${chargerId} connector ${connectorId}: ${status}, error: ${errorCode}`);

  const pileCode = `${chargerId}-${connectorId}`;
  const pile = stationService.getPileByCode(pileCode);

  if (pile) {
    let newStatus: string = status.toLowerCase();
    if (newStatus === 'available') newStatus = 'available';
    else if (newStatus === 'charging') newStatus = 'charging';
    else if (newStatus === 'faulted') newStatus = 'fault';
    else if (newStatus === 'unavailable') newStatus = 'offline';

    stationService.updatePileStatus(pile.id, newStatus);
  }
}

function handleMeterValues(chargerId: string, payload: any) {
  const { connectorId, meterValue } = payload;
  const pileCode = `${chargerId}-${connectorId}`;
  const pile = stationService.getPileByCode(pileCode);

  if (pile) {
    let energy = 0;
    let power = 0;

    if (meterValue && meterValue.length > 0) {
      const values = meterValue[0].sampledValue || [];
      for (const val of values) {
        if (val.format === 'Wh' || val.unit === 'Wh') {
          energy = parseFloat(val.value) / 1000;
        }
        if (val.unit === 'W' || val.format === 'Power') {
          power = parseFloat(val.value) / 1000;
        }
      }
    }

    stationService.updatePileStatus(pile.id, 'charging', power);
  }
}

function handleStartTransaction(chargerId: string, payload: any): any {
  const { connectorId, idTag, meterStart } = payload;
  const pileCode = `${chargerId}-${connectorId}`;
  const pile = stationService.getPileByCode(pileCode);

  if (pile) {
    const session = chargingService.createSession(idTag, pile.id);
    return {
      idTagInfo: {
        status: 'Accepted',
      },
      transactionId: parseInt(session.id.replace(/-/g, '').slice(0, 8), 16),
    };
  }

  return {
    idTagInfo: {
      status: 'Rejected',
    },
  };
}

function handleStopTransaction(chargerId: string, payload: any): any {
  const { transactionId, meterStop, reason } = payload;

  const sessions = chargingService.getUserActiveSessions(transactionId.toString());
  if (sessions.length > 0) {
    const session = sessions[0];
    chargingService.stopSession(session.id, 'completed');
    settlementService.createSettlement(session.id);
  }

  return {
    idTagInfo: {
      status: 'Accepted',
    },
  };
}

export function sendRemoteStart(chargerId: string, connectorId: number, idTag: string) {
  const connection = connectedChargers.get(chargerId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
    return { success: false, error: 'Charger not connected' };
  }

  const message: OcppMessage = [
    2,
    uuidv4(),
    'RemoteStartTransaction',
    {
      connectorId,
      idTag,
    },
  ];

  connection.ws.send(JSON.stringify(message));
  return { success: true };
}

export function sendRemoteStop(chargerId: string, transactionId: number) {
  const connection = connectedChargers.get(chargerId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
    return { success: false, error: 'Charger not connected' };
  }

  const message: OcppMessage = [
    2,
    uuidv4(),
    'RemoteStopTransaction',
    {
      transactionId,
    },
  ];

  connection.ws.send(JSON.stringify(message));
  return { success: true };
}

export function getConnectedChargers() {
  return Array.from(connectedChargers.values()).map(c => ({
    chargerId: c.chargerId,
    stationId: c.stationId,
    lastHeartbeat: c.lastHeartbeat,
  }));
}
