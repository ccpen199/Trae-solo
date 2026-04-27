import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm, AlarmSeverity, AlarmStatus, AlarmType } from './entities/alarm.entity';
import { AlarmAction, AlarmActionType, AlarmActionStatus } from './entities/alarm-action.entity';
import { SensorsService } from '../sensors/sensors.service';
import { AgronomyService } from '../agronomy/agronomy.service';
import { EnvironmentParameter, ThresholdType } from '../agronomy/entities/environment-threshold.entity';
import { SensorType } from '../sensors/entities/sensor.entity';

interface WeatherForecast {
  predictedRain: boolean;
  rainProbability: number;
  hoursUntilRain: number;
  temperatureTrend: 'rising' | 'falling' | 'stable';
}

@Injectable()
export class AlarmsService {
  private readonly logger = new Logger(AlarmsService.name);

  private readonly sensorTypeToParameter: Record<SensorType, EnvironmentParameter> = {
    [SensorType.TEMPERATURE]: EnvironmentParameter.TEMPERATURE,
    [SensorType.HUMIDITY]: EnvironmentParameter.HUMIDITY,
    [SensorType.SOIL_MOISTURE]: EnvironmentParameter.SOIL_MOISTURE,
    [SensorType.SOIL_PH]: EnvironmentParameter.SOIL_PH,
    [SensorType.LIGHT_INTENSITY]: EnvironmentParameter.LIGHT_INTENSITY,
    [SensorType.CO2_SENSOR]: EnvironmentParameter.CO2_LEVEL,
    [SensorType.WIND_SPEED]: EnvironmentParameter.WIND_SPEED,
    [SensorType.RAINFALL]: EnvironmentParameter.RAINFALL,
  };

  constructor(
    @InjectRepository(Alarm)
    private alarmRepository: Repository<Alarm>,
    @InjectRepository(AlarmAction)
    private actionRepository: Repository<AlarmAction>,
    private sensorsService: SensorsService,
    private agronomyService: AgronomyService,
  ) {}

  async checkAndCreateAlarm(
    sensorId: string,
    value: number,
    timestamp: Date,
    cropId?: string,
    growthDay?: number,
  ): Promise<Alarm | null> {
    const sensor = await this.sensorsService.getSensorById(sensorId);
    if (!sensor) {
      this.logger.error(`Sensor ${sensorId} not found`);
      return null;
    }

    const parameterType = this.sensorTypeToParameter[sensor.type];
    if (!parameterType) {
      this.logger.warn(`No parameter mapping for sensor type: ${sensor.type}`);
      return null;
    }

    let growthStage = null;
    let thresholdCheck = null;

    if (cropId && growthDay !== undefined) {
      growthStage = await this.agronomyService.getGrowthStageByDay(cropId, growthDay);
      
      if (growthStage) {
        thresholdCheck = await this.agronomyService.checkThresholdViolation(
          growthStage.id,
          parameterType,
          value,
        );
      }
    }

    if (!thresholdCheck || !thresholdCheck.isViolation) {
      return null;
    }

    const weatherForecast = await this.predictWeather(sensorId);
    const { adjustedSeverity, adjustmentReason } = this.adjustAlarmSeverity(
      thresholdCheck.thresholdType as ThresholdType,
      parameterType,
      value,
      weatherForecast,
    );

    const existingOpenAlarm = await this.findOpenAlarm(sensorId, parameterType);
    if (existingOpenAlarm) {
      return this.updateExistingAlarm(existingOpenAlarm, value, adjustedSeverity, weatherForecast);
    }

    const alarm = this.alarmRepository.create({
      alarmType: AlarmType.THRESHOLD_EXCEEDED,
      severity: adjustedSeverity,
      status: AlarmStatus.OPEN,
      title: this.generateAlarmTitle(parameterType, thresholdCheck.direction, adjustedSeverity),
      description: this.generateAlarmDescription(parameterType, value, thresholdCheck),
      actualValue: value,
      thresholdMin: thresholdCheck.threshold?.minValue,
      thresholdMax: thresholdCheck.threshold?.maxValue,
      triggeredAt: timestamp,
      sensorId,
      growthStageId: growthStage?.id,
      thresholdId: thresholdCheck.threshold?.id,
      weatherForecast: {
        predictedRain: weatherForecast.predictedRain,
        rainProbability: weatherForecast.rainProbability,
        hoursUntilRain: weatherForecast.hoursUntilRain,
        adjustedSeverity,
        adjustmentReason,
      },
      isAdjusted: adjustedSeverity !== this.mapThresholdToSeverity(thresholdCheck.thresholdType as ThresholdType),
    });

    const savedAlarm = await this.alarmRepository.save(alarm);

    await this.createSuggestedActions(savedAlarm, parameterType, thresholdCheck, weatherForecast);

    return savedAlarm;
  }

  private mapThresholdToSeverity(thresholdType: ThresholdType): AlarmSeverity {
    switch (thresholdType) {
      case ThresholdType.CRITICAL:
        return AlarmSeverity.CRITICAL;
      case ThresholdType.WARNING:
        return AlarmSeverity.WARNING;
      default:
        return AlarmSeverity.INFO;
    }
  }

  private async predictWeather(sensorId: string): Promise<WeatherForecast> {
    const sensor = await this.sensorsService.getSensorById(sensorId);
    
    const recentReadings = await this.sensorsService.getLatestReadings(sensorId, 20);
    
    const rainfallReadings = await this.getRainfallData(sensor.locationZone);
    
    const rainProbability = this.calculateRainProbability(rainfallReadings, recentReadings);
    const predictedRain = rainProbability > 60;
    
    return {
      predictedRain,
      rainProbability,
      hoursUntilRain: predictedRain ? Math.floor(Math.random() * 24) + 1 : null,
      temperatureTrend: 'stable',
    };
  }

  private async getRainfallData(zone: string): Promise<any[]> {
    return [];
  }

  private calculateRainProbability(
    rainfallReadings: any[],
    recentReadings: any[],
  ): number {
    const baseProbability = 20;
    
    const humidityReadings = recentReadings.filter(r => r.filteredValue !== null);
    if (humidityReadings.length > 0) {
      const avgHumidity = humidityReadings.reduce((sum, r) => sum + r.filteredValue, 0) / humidityReadings.length;
      if (avgHumidity > 80) {
        return Math.min(90, baseProbability + (avgHumidity - 80) * 2);
      }
    }
    
    return baseProbability;
  }

  private adjustAlarmSeverity(
    originalThreshold: ThresholdType,
    parameterType: EnvironmentParameter,
    value: number,
    weatherForecast: WeatherForecast,
  ): { adjustedSeverity: AlarmSeverity; adjustmentReason: string } {
    const originalSeverity = this.mapThresholdToSeverity(originalThreshold);

    if (parameterType === EnvironmentParameter.SOIL_MOISTURE && value < 30) {
      if (weatherForecast.predictedRain && weatherForecast.rainProbability > 70) {
        const hoursUntilRain = weatherForecast.hoursUntilRain;
        
        if (hoursUntilRain <= 6) {
          return {
            adjustedSeverity: this.downgradeSeverity(originalSeverity, 2),
            adjustmentReason: `Rain predicted in ${hoursUntilRain} hours (${weatherForecast.rainProbability}% probability). Downgrading irrigation alert significantly.`,
          };
        } else if (hoursUntilRain <= 12) {
          return {
            adjustedSeverity: this.downgradeSeverity(originalSeverity, 1),
            adjustmentReason: `Rain predicted in ${hoursUntilRain} hours (${weatherForecast.rainProbability}% probability). Downgrading irrigation alert slightly.`,
          };
        }
      }
    }

    if (parameterType === EnvironmentParameter.TEMPERATURE) {
      if (weatherForecast.temperatureTrend === 'falling' && value > 35) {
        return {
          adjustedSeverity: this.downgradeSeverity(originalSeverity, 1),
          adjustmentReason: 'Temperature trending downward. Reducing cooling alert severity.',
        };
      }
    }

    return {
      adjustedSeverity: originalSeverity,
      adjustmentReason: 'No weather adjustment needed.',
    };
  }

  private downgradeSeverity(severity: AlarmSeverity, levels: number): AlarmSeverity {
    const severityOrder = [AlarmSeverity.CRITICAL, AlarmSeverity.WARNING, AlarmSeverity.INFO];
    const currentIndex = severityOrder.indexOf(severity);
    const newIndex = Math.min(severityOrder.length - 1, currentIndex + levels);
    return severityOrder[newIndex];
  }

  private async findOpenAlarm(
    sensorId: string,
    parameterType: EnvironmentParameter,
  ): Promise<Alarm | null> {
    return this.alarmRepository.findOne({
      where: {
        sensorId,
        status: AlarmStatus.OPEN,
        isDeleted: false,
      },
      order: { triggeredAt: 'DESC' },
    });
  }

  private async updateExistingAlarm(
    alarm: Alarm,
    newValue: number,
    newSeverity: AlarmSeverity,
    weatherForecast: WeatherForecast,
  ): Promise<Alarm> {
    alarm.actualValue = newValue;
    alarm.severity = newSeverity;
    alarm.weatherForecast = {
      ...alarm.weatherForecast,
      predictedRain: weatherForecast.predictedRain,
      rainProbability: weatherForecast.rainProbability,
      hoursUntilRain: weatherForecast.hoursUntilRain,
    };
    return this.alarmRepository.save(alarm);
  }

  private async createSuggestedActions(
    alarm: Alarm,
    parameterType: EnvironmentParameter,
    thresholdCheck: any,
    weatherForecast: WeatherForecast,
  ): Promise<void> {
    const suggestions = this.generateSuggestions(
      parameterType,
      thresholdCheck,
      weatherForecast,
    );

    for (const suggestion of suggestions) {
      const action = this.actionRepository.create({
        alarmId: alarm.id,
        actionType: AlarmActionType.SUGGESTION,
        status: AlarmActionStatus.PENDING,
        title: suggestion.title,
        recommendation: suggestion.recommendation,
        requiresConfirmation: suggestion.requiresConfirmation,
        actionDetails: JSON.stringify(suggestion.details),
      });
      await this.actionRepository.save(action);
    }
  }

  private generateSuggestions(
    parameterType: EnvironmentParameter,
    thresholdCheck: any,
    weatherForecast: WeatherForecast,
  ): {
    title: string;
    recommendation: string;
    requiresConfirmation: boolean;
    details: any;
  }[] {
    const suggestions = [];

    switch (parameterType) {
      case EnvironmentParameter.SOIL_MOISTURE:
        if (thresholdCheck.direction === 'below') {
          if (weatherForecast.predictedRain) {
            suggestions.push({
              title: '等待降雨',
              recommendation: `预计${weatherForecast.hoursUntilRain}小时后降雨（概率${weatherForecast.rainProbability}%），建议暂时不灌溉。`,
              requiresConfirmation: false,
              details: { waitTime: weatherForecast.hoursUntilRain, rainProbability: weatherForecast.rainProbability },
            });
          } else {
            suggestions.push({
              title: '启动灌溉系统',
              recommendation: '土壤湿度低于阈值，建议启动灌溉系统。',
              requiresConfirmation: true,
              details: { action: 'irrigation', targetMoisture: 50 },
            });
          }
        }
        break;

      case EnvironmentParameter.TEMPERATURE:
        if (thresholdCheck.direction === 'above') {
          suggestions.push({
            title: '开启通风/降温',
            recommendation: '温度过高，建议开启通风设备或遮阳网。',
            requiresConfirmation: true,
            details: { action: 'ventilation' },
          });
        } else if (thresholdCheck.direction === 'below') {
          suggestions.push({
            title: '开启加热设备',
            recommendation: '温度过低，建议开启加热设备。',
            requiresConfirmation: true,
            details: { action: 'heating' },
          });
        }
        break;

      case EnvironmentParameter.HUMIDITY:
        if (thresholdCheck.direction === 'above') {
          suggestions.push({
            title: '加强通风',
            recommendation: '湿度过高，建议加强通风降低湿度。',
            requiresConfirmation: true,
            details: { action: 'ventilation' },
          });
        }
        break;
    }

    return suggestions;
  }

  private generateAlarmTitle(
    parameterType: EnvironmentParameter,
    direction: 'below' | 'above',
    severity: AlarmSeverity,
  ): string {
    const parameterNames: Record<EnvironmentParameter, string> = {
      [EnvironmentParameter.TEMPERATURE]: '温度',
      [EnvironmentParameter.HUMIDITY]: '湿度',
      [EnvironmentParameter.SOIL_MOISTURE]: '土壤湿度',
      [EnvironmentParameter.SOIL_PH]: '土壤pH值',
      [EnvironmentParameter.LIGHT_INTENSITY]: '光照强度',
      [EnvironmentParameter.CO2_LEVEL]: 'CO2浓度',
      [EnvironmentParameter.WIND_SPEED]: '风速',
      [EnvironmentParameter.RAINFALL]: '降雨量',
    };

    const severityLabels: Record<AlarmSeverity, string> = {
      [AlarmSeverity.CRITICAL]: '严重',
      [AlarmSeverity.WARNING]: '警告',
      [AlarmSeverity.INFO]: '提示',
    };

    const directionLabels = {
      below: '过低',
      above: '过高',
    };

    return `[${severityLabels[severity]}] ${parameterNames[parameterType]}${directionLabels[direction]}`;
  }

  private generateAlarmDescription(
    parameterType: EnvironmentParameter,
    value: number,
    thresholdCheck: any,
  ): string {
    const threshold = thresholdCheck.threshold;
    const direction = thresholdCheck.direction;

    if (direction === 'below' && threshold?.minValue !== null) {
      return `当前值 ${value} 低于阈值下限 ${threshold.minValue}`;
    } else if (direction === 'above' && threshold?.maxValue !== null) {
      return `当前值 ${value} 高于阈值上限 ${threshold.maxValue}`;
    }

    return `当前值 ${value} 超出阈值范围`;
  }

  async getOpenAlarms(): Promise<Alarm[]> {
    return this.alarmRepository.find({
      where: {
        status: AlarmStatus.OPEN,
        isDeleted: false,
      },
      order: { severity: 'DESC', triggeredAt: 'DESC' },
      relations: ['sensor', 'growthStage', 'actions'],
    });
  }

  async acknowledgeAlarm(
    alarmId: string,
    operatorName: string,
  ): Promise<Alarm> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, isDeleted: false },
    });

    if (!alarm) {
      throw new Error(`Alarm ${alarmId} not found`);
    }

    alarm.status = AlarmStatus.ACKNOWLEDGED;
    alarm.acknowledgedAt = new Date();
    alarm.acknowledgedBy = operatorName;

    return this.alarmRepository.save(alarm);
  }

  async resolveAlarm(
    alarmId: string,
    operatorName: string,
    resolutionNotes?: string,
  ): Promise<Alarm> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, isDeleted: false },
    });

    if (!alarm) {
      throw new Error(`Alarm ${alarmId} not found`);
    }

    alarm.status = AlarmStatus.RESOLVED;
    alarm.resolvedAt = new Date();
    alarm.resolvedBy = operatorName;
    if (resolutionNotes) {
      alarm.resolutionNotes = resolutionNotes;
    }

    return this.alarmRepository.save(alarm);
  }

  async getActionsForAlarm(alarmId: string): Promise<AlarmAction[]> {
    return this.actionRepository.find({
      where: { alarmId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });
  }

  async confirmAction(actionId: string, operatorName: string): Promise<AlarmAction> {
    const action = await this.actionRepository.findOne({
      where: { id: actionId, isDeleted: false },
    });

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    action.isConfirmed = true;
    action.confirmedBy = operatorName;
    action.confirmedAt = new Date();
    action.status = AlarmActionStatus.EXECUTING;

    return this.actionRepository.save(action);
  }
}
