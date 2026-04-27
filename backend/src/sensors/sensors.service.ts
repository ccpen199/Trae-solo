import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sensor, SensorStatus, SensorType } from './entities/sensor.entity';
import { SensorReading, DataQuality } from './entities/sensor-reading.entity';

interface FilterConfig {
  windowSize: number;
  outlierThreshold: number;
  minValidRange: number;
  maxValidRange: number;
}

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  private readonly sensorFilterConfigs: Record<SensorType, FilterConfig> = {
    [SensorType.TEMPERATURE]: {
      windowSize: 5,
      outlierThreshold: 5,
      minValidRange: -20,
      maxValidRange: 60,
    },
    [SensorType.HUMIDITY]: {
      windowSize: 5,
      outlierThreshold: 15,
      minValidRange: 0,
      maxValidRange: 100,
    },
    [SensorType.SOIL_MOISTURE]: {
      windowSize: 7,
      outlierThreshold: 20,
      minValidRange: 0,
      maxValidRange: 100,
    },
    [SensorType.SOIL_PH]: {
      windowSize: 3,
      outlierThreshold: 1,
      minValidRange: 0,
      maxValidRange: 14,
    },
    [SensorType.LIGHT_INTENSITY]: {
      windowSize: 3,
      outlierThreshold: 5000,
      minValidRange: 0,
      maxValidRange: 200000,
    },
    [SensorType.CO2_SENSOR]: {
      windowSize: 5,
      outlierThreshold: 200,
      minValidRange: 0,
      maxValidRange: 5000,
    },
    [SensorType.WIND_SPEED]: {
      windowSize: 3,
      outlierThreshold: 10,
      minValidRange: 0,
      maxValidRange: 50,
    },
    [SensorType.RAINFALL]: {
      windowSize: 1,
      outlierThreshold: 50,
      minValidRange: 0,
      maxValidRange: 500,
    },
  };

  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private readingRepository: Repository<SensorReading>,
  ) {}

  async getSensorById(id: string): Promise<Sensor> {
    return this.sensorRepository.findOne({
      where: { id, isDeleted: false },
    });
  }

  async updateSensorHeartbeat(sensorId: string): Promise<void> {
    await this.sensorRepository.update(sensorId, {
      status: SensorStatus.ONLINE,
      lastHeartbeatAt: new Date(),
    });
  }

  async processSensorData(
    sensorId: string,
    rawValue: number,
    timestamp: Date = new Date(),
    metadata?: Record<string, any>,
  ): Promise<SensorReading> {
    const sensor = await this.getSensorById(sensorId);
    if (!sensor) {
      throw new Error(`Sensor ${sensorId} not found`);
    }

    await this.updateSensorHeartbeat(sensorId);

    const reading = this.readingRepository.create({
      sensorId,
      rawValue,
      timestamp,
      dataQuality: DataQuality.RAW,
      isOutlier: false,
      metadata,
    });

    const filteredResult = await this.applyFiltering(sensor, rawValue, timestamp);
    reading.filteredValue = filteredResult.filteredValue;
    reading.dataQuality = filteredResult.dataQuality;
    reading.isOutlier = filteredResult.isOutlier;
    reading.filterComment = filteredResult.comment;

    return this.readingRepository.save(reading);
  }

  private async applyFiltering(
    sensor: Sensor,
    rawValue: number,
    timestamp: Date,
  ): Promise<{
    filteredValue: number;
    dataQuality: DataQuality;
    isOutlier: boolean;
    comment: string;
  }> {
    const config = this.sensorFilterConfigs[sensor.type];

    if (!config) {
      return {
        filteredValue: rawValue,
        dataQuality: DataQuality.RAW,
        isOutlier: false,
        comment: 'No filter config available',
      };
    }

    if (rawValue < config.minValidRange || rawValue > config.maxValidRange) {
      return {
        filteredValue: null,
        dataQuality: DataQuality.ANOMALY,
        isOutlier: true,
        comment: `Value ${rawValue} out of valid range [${config.minValidRange}, ${config.maxValidRange}]`,
      };
    }

    const recentReadings = await this.getRecentReadings(
      sensor.id,
      config.windowSize,
      timestamp,
    );

    if (recentReadings.length > 0) {
      const validReadings = recentReadings.filter(r => 
        r.filteredValue !== null && !r.isOutlier
      );

      if (validReadings.length > 0) {
        const avgValue = validReadings.reduce((sum, r) => sum + r.filteredValue, 0) / validReadings.length;
        const stdDev = this.calculateStandardDeviation(
          validReadings.map(r => r.filteredValue),
          avgValue,
        );

        const deviation = Math.abs(rawValue - avgValue);
        const threshold = Math.max(config.outlierThreshold, stdDev * 3);

        if (deviation > threshold) {
          return {
            filteredValue: avgValue,
            dataQuality: DataQuality.ANOMALY,
            isOutlier: true,
            comment: `Outlier detected: deviation ${deviation.toFixed(2)} exceeds threshold ${threshold.toFixed(2)}`,
          };
        }
      }
    }

    const allValues = [...recentReadings.filter(r => r.filteredValue !== null).map(r => r.filteredValue), rawValue];
    const filteredValue = this.applyMovingAverage(allValues, Math.min(config.windowSize, allValues.length));

    return {
      filteredValue,
      dataQuality: DataQuality.FILTERED,
      isOutlier: false,
      comment: 'Filtered with moving average',
    };
  }

  private async getRecentReadings(
    sensorId: string,
    windowSize: number,
    beforeTimestamp: Date,
  ): Promise<SensorReading[]> {
    const fiveMinutesAgo = new Date(beforeTimestamp.getTime() - 5 * 60 * 1000);

    return this.readingRepository.find({
      where: {
        sensorId,
        timestamp: Between(fiveMinutesAgo, beforeTimestamp),
      },
      order: { timestamp: 'DESC' },
      take: windowSize,
    });
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private applyMovingAverage(values: number[], windowSize: number): number {
    if (values.length === 0) return 0;
    const window = values.slice(-windowSize);
    return window.reduce((a, b) => a + b, 0) / window.length;
  }

  async getLatestReadings(sensorId: string, limit: number = 100): Promise<SensorReading[]> {
    return this.readingRepository.find({
      where: { sensorId, isDeleted: false },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getReadingsInRange(
    sensorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<SensorReading[]> {
    return this.readingRepository.find({
      where: {
        sensorId,
        timestamp: Between(startTime, endTime),
        isDeleted: false,
      },
      order: { timestamp: 'ASC' },
    });
  }

  async getAggregatedReadings(
    sensorId: string,
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 15,
  ): Promise<{
    timestamp: Date;
    avgValue: number;
    minValue: number;
    maxValue: number;
    count: number;
  }[]> {
    const readings = await this.getReadingsInRange(sensorId, startTime, endTime);
    
    if (readings.length === 0) return [];

    const aggregated: Record<string, {
      timestamp: Date;
      values: number[];
    }> = {};

    const intervalMs = intervalMinutes * 60 * 1000;

    for (const reading of readings) {
      if (reading.filteredValue === null) continue;
      
      const intervalStart = new Date(
        Math.floor(reading.timestamp.getTime() / intervalMs) * intervalMs,
      );
      const key = intervalStart.toISOString();

      if (!aggregated[key]) {
        aggregated[key] = {
          timestamp: intervalStart,
          values: [],
        };
      }
      aggregated[key].values.push(reading.filteredValue);
    }

    return Object.values(aggregated)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(item => ({
        timestamp: item.timestamp,
        avgValue: item.values.reduce((a, b) => a + b, 0) / item.values.length,
        minValue: Math.min(...item.values),
        maxValue: Math.max(...item.values),
        count: item.values.length,
      }));
  }

  async createSensor(sensorData: Partial<Sensor>): Promise<Sensor> {
    const sensor = this.sensorRepository.create(sensorData);
    return this.sensorRepository.save(sensor);
  }
}
