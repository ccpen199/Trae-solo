import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { AlarmsService } from '../alarms/alarms.service';
import { ControlService } from '../control/control.service';

interface ClientInfo {
  id: string;
  userId: string;
  userName: string;
  subscribedZones: string[];
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/farm',
})
export class FarmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FarmGateway.name);
  private clients: Map<string, ClientInfo> = new Map();

  constructor(
    private sensorsService: SensorsService,
    private alarmsService: AlarmsService,
    private controlService: ControlService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const clientInfo: ClientInfo = {
      id: client.id,
      userId: client.handshake.query.userId as string || 'anonymous',
      userName: client.handshake.query.userName as string || 'Anonymous',
      subscribedZones: [],
      connectedAt: new Date(),
    };

    this.clients.set(client.id, clientInfo);

    client.emit('connected', {
      message: 'Connected to Smart Farm WebSocket',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { zones: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      clientInfo.subscribedZones = data.zones || [];
      this.clients.set(client.id, clientInfo);
    }

    client.emit('subscribed', {
      zones: data.zones,
      message: `Subscribed to zones: ${data.zones?.join(', ') || 'none'}`,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { zones: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.clients.get(client.id);
    if (clientInfo && data.zones) {
      clientInfo.subscribedZones = clientInfo.subscribedZones.filter(
        (zone) => !data.zones.includes(zone),
      );
      this.clients.set(client.id, clientInfo);
    }

    client.emit('unsubscribed', {
      zones: data.zones,
    });
  }

  @SubscribeMessage('get_latest_readings')
  async handleGetLatestReadings(
    @MessageBody() data: { sensorId: string; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const readings = await this.sensorsService.getLatestReadings(
        data.sensorId,
        data.limit || 20,
      );

      client.emit('latest_readings', {
        sensorId: data.sensorId,
        readings,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to get latest readings: ${error.message}`,
      });
    }
  }

  @SubscribeMessage('get_open_alarms')
  async handleGetOpenAlarms(@ConnectedSocket() client: Socket) {
    try {
      const alarms = await this.alarmsService.getOpenAlarms();

      client.emit('open_alarms', {
        alarms,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to get open alarms: ${error.message}`,
      });
    }
  }

  @SubscribeMessage('acknowledge_alarm')
  async handleAcknowledgeAlarm(
    @MessageBody() data: { alarmId: string; operatorName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const alarm = await this.alarmsService.acknowledgeAlarm(
        data.alarmId,
        data.operatorName,
      );

      this.broadcastAlarmUpdate(alarm, 'alarm_acknowledged');

      client.emit('alarm_acknowledged', {
        alarm,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to acknowledge alarm: ${error.message}`,
      });
    }
  }

  @SubscribeMessage('confirm_action')
  async handleConfirmAction(
    @MessageBody() data: { actionId: string; operatorName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const action = await this.alarmsService.confirmAction(
        data.actionId,
        data.operatorName,
      );

      client.emit('action_confirmed', {
        action,
      });

      this.broadcastMessage('action_confirmed', {
        action,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to confirm action: ${error.message}`,
      });
    }
  }

  @SubscribeMessage('execute_pid_control')
  async handleExecutePidControl(
    @MessageBody() data: {
      deviceId: string;
      targetValue?: number;
      cropId?: string;
      growthDay?: number;
      operatorName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const command = await this.controlService.calculateAndExecutePidControl(
        data.deviceId,
        data.targetValue,
        data.cropId,
        data.growthDay,
        data.operatorName,
      );

      client.emit('pid_control_executed', {
        command,
      });

      this.broadcastMessage('control_command_issued', {
        command,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to execute PID control: ${error.message}`,
      });
    }
  }

  @SubscribeMessage('manual_control')
  async handleManualControl(
    @MessageBody() data: {
      deviceId: string;
      targetValue: number;
      operatorName: string;
      reason?: string;
      durationSeconds?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const command = await this.controlService.createManualCommand(
        data.deviceId,
        data.targetValue,
        data.operatorName,
        data.reason,
        data.durationSeconds,
      );

      client.emit('manual_control_executed', {
        command,
      });

      this.broadcastMessage('control_command_issued', {
        command,
      });
    } catch (error) {
      client.emit('error', {
        message: `Failed to execute manual control: ${error.message}`,
      });
    }
  }

  broadcastSensorReading(sensorReading: any, locationZone: string) {
    this.broadcastToZone(locationZone, 'sensor_reading', {
      sensorReading,
      locationZone,
    });
  }

  broadcastAlarmCreated(alarm: any) {
    this.broadcastMessage('alarm_created', {
      alarm,
    });
  }

  broadcastAlarmUpdate(alarm: any, event: string = 'alarm_updated') {
    this.broadcastMessage(event, {
      alarm,
    });
  }

  broadcastControlStatus(command: any) {
    this.broadcastMessage('control_status_updated', {
      command,
    });
  }

  private broadcastToZone(locationZone: string, event: string, data: any) {
    for (const [clientId, clientInfo] of this.clients.entries()) {
      if (clientInfo.subscribedZones.includes(locationZone) || clientInfo.subscribedZones.includes('*')) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit(event, data);
        }
      }
    }
  }

  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }
}
