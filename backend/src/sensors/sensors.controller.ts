import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Controller('sensors')
export class SensorsController {
  constructor(
    private readonly sensorsService: SensorsService,
    private readonly auditService: AuditService,
  ) {}

  @Get(':id')
  async getSensorById(@Param('id') id: string): Promise<Sensor> {
    return this.sensorsService.getSensorById(id);
  }

  @Post()
  async createSensor(
    @Body() sensorData: Partial<Sensor>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<Sensor> {
    const sensor = await this.sensorsService.createSensor(sensorData);

    await this.auditService.logCreate(
      AuditResourceType.SENSOR,
      sensor.id,
      sensor.name,
      { ...sensor },
      operatorId,
      operatorName,
    );

    return sensor;
  }

  @Post(':id/readings')
  async processSensorData(
    @Param('id') id: string,
    @Body() body: {
      value: number;
      timestamp?: string;
      metadata?: Record<string, any>;
    },
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<SensorReading> {
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    const reading = await this.sensorsService.processSensorData(
      id,
      body.value,
      timestamp,
      body.metadata,
    );

    await this.auditService.logCreate(
      AuditResourceType.SENSOR_READING,
      reading.id,
      `Sensor ${id} reading`,
      { ...reading },
      operatorId,
      operatorName,
    );

    return reading;
  }

  @Get(':id/readings')
  async getLatestReadings(
    @Param('id') id: string,
    @Query('limit') limit: number = 100,
  ): Promise<SensorReading[]> {
    return this.sensorsService.getLatestReadings(id, limit);
  }

  @Get(':id/readings/range')
  async getReadingsInRange(
    @Param('id') id: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<SensorReading[]> {
    return this.sensorsService.getReadingsInRange(
      id,
      new Date(startTime),
      new Date(endTime),
    );
  }

  @Get(':id/readings/aggregated')
  async getAggregatedReadings(
    @Param('id') id: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('intervalMinutes') intervalMinutes: number = 15,
  ): Promise<{
    timestamp: Date;
    avgValue: number;
    minValue: number;
    maxValue: number;
    count: number;
  }[]> {
    return this.sensorsService.getAggregatedReadings(
      id,
      new Date(startTime),
      new Date(endTime),
      intervalMinutes,
    );
  }
}
