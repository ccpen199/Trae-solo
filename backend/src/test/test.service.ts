import { Injectable, Logger } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { AlarmsService } from '../alarms/alarms.service';
import { ControlService } from '../control/control.service';
import { AgronomyService } from '../agronomy/agronomy.service';
import { AuditService } from '../audit/audit.service';
import { FarmGateway } from '../websocket/farm.gateway';
import { Sensor, SensorStatus, SensorType } from '../sensors/entities/sensor.entity';
import { ControlDevice, DeviceType, DeviceStatus } from '../control/entities/control-device.entity';
import { GrowthStage } from '../agronomy/entities/growth-stage.entity';
import { EnvironmentThreshold } from '../agronomy/entities/environment-threshold.entity';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Injectable()
export class TestService {
  private readonly logger = new Logger(TestService.name);

  constructor(
    private readonly sensorsService: SensorsService,
    private readonly alarmsService: AlarmsService,
    private readonly controlService: ControlService,
    private readonly agronomyService: AgronomyService,
    private readonly auditService: AuditService,
    private readonly farmGateway: FarmGateway,
  ) {}

  async getSystemStatus(): Promise<{
    sensors: Sensor[];
    devices: ControlDevice[];
    openAlarms: any[];
  }> {
    const sensors = await this.sensorsService.getAllSensors();
    const devices = await this.controlService.getAllDevices();
    const openAlarms = await this.alarmsService.getOpenAlarms();

    return {
      sensors,
      devices,
      openAlarms,
    };
  }

  async setupDemoData(): Promise<{
    crop: any;
    growthStages: any[];
    sensors: Sensor[];
    devices: ControlDevice[];
    thresholds: any[];
  }> {
    this.logger.log('Setting up demo data...');

    const existingSensors = await this.sensorsService.getAllSensors();
    const existingDevices = await this.controlService.getAllDevices();

    if (existingSensors.length > 0 || existingDevices.length > 0) {
      return {
        crop: null,
        growthStages: [],
        sensors: existingSensors,
        devices: existingDevices,
        thresholds: [],
      };
    }

    const crop = await this.agronomyService.createCrop({
      name: '水稻',
      code: 'RICE-001',
      variety: '杂交稻',
      totalGrowthDays: 120,
    });

    const growthStages: GrowthStage[] = [];
    const stageConfigs = [
      { name: '幼苗期', stageType: 'seedling', startDay: 1, endDay: 20 },
      { name: '分蘖期', stageType: 'vegetative', startDay: 21, endDay: 60 },
      { name: '抽穗期', stageType: 'flowering', startDay: 61, endDay: 90 },
      { name: '成熟期', stageType: 'ripening', startDay: 91, endDay: 120 },
    ];

    for (const config of stageConfigs) {
      const stage = await this.agronomyService.createGrowthStage({
        cropId: crop.id,
        name: config.name,
        stageType: config.stageType as any,
        startDay: config.startDay,
        endDay: config.endDay,
        description: `水稻${config.name}`,
      });
      growthStages.push(stage);
    }

    const thresholds: EnvironmentThreshold[] = [];
    const seedlingStage = growthStages[0];
    
    const thresholdConfigs = [
      { parameterType: 'temperature', thresholdType: 'optimal', minValue: 20, maxValue: 28, unit: '°C' },
      { parameterType: 'temperature', thresholdType: 'warning', minValue: 15, maxValue: 32, unit: '°C' },
      { parameterType: 'temperature', thresholdType: 'critical', minValue: 10, maxValue: 35, unit: '°C' },
      { parameterType: 'soil_moisture', thresholdType: 'optimal', minValue: 60, maxValue: 80, unit: '%' },
      { parameterType: 'soil_moisture', thresholdType: 'warning', minValue: 40, maxValue: 90, unit: '%' },
      { parameterType: 'humidity', thresholdType: 'optimal', minValue: 60, maxValue: 85, unit: '%' },
    ];

    for (const config of thresholdConfigs) {
      const threshold = await this.agronomyService.createThreshold({
        growthStageId: seedlingStage.id,
        parameterType: config.parameterType as any,
        thresholdType: config.thresholdType as any,
        minValue: config.minValue,
        maxValue: config.maxValue,
        unit: config.unit,
        recommendation: `${config.parameterType} ${config.thresholdType} threshold`,
      });
      thresholds.push(threshold);
    }

    const sensors: Sensor[] = [];
    const sensorConfigs = [
      { name: '温度传感器-A1', code: 'TEMP-A1-001', type: SensorType.TEMPERATURE, unit: '°C', minValue: -20, maxValue: 60 },
      { name: '土壤湿度传感器-A1', code: 'SOIL-MOIST-A1-001', type: SensorType.SOIL_MOISTURE, unit: '%', minValue: 0, maxValue: 100 },
      { name: '湿度传感器-A1', code: 'HUMID-A1-001', type: SensorType.HUMIDITY, unit: '%', minValue: 0, maxValue: 100 },
      { name: '光照传感器-A1', code: 'LIGHT-A1-001', type: SensorType.LIGHT_INTENSITY, unit: 'lux', minValue: 0, maxValue: 200000 },
    ];

    for (const config of sensorConfigs) {
      const sensor = await this.sensorsService.createSensor({
        name: config.name,
        code: config.code,
        type: config.type,
        status: SensorStatus.ONLINE,
        locationZone: 'zone-a',
        unit: config.unit,
        minValue: config.minValue,
        maxValue: config.maxValue,
        accuracy: 0.1,
      });
      sensors.push(sensor);

      await this.auditService.logCreate(
        AuditResourceType.SENSOR,
        sensor.id,
        sensor.name,
        { ...sensor },
        'system',
        'Demo Setup',
      );
    }

    const devices: ControlDevice[] = [];
    const deviceConfigs = [
      { name: '灌溉阀门-A1', code: 'IRR-A1-001', type: DeviceType.IRRIGATION_VALVE, maxCapacity: 100, unit: 'L/min' },
      { name: '卷帘设备-A1', code: 'ROLL-A1-001', type: DeviceType.ROLLER_CURTAIN, maxCapacity: 100, unit: '%' },
      { name: '通风风扇-A1', code: 'VENT-A1-001', type: DeviceType.VENTILATION_FAN, maxCapacity: 100, unit: '%' },
    ];

    for (const config of deviceConfigs) {
      const device = await this.controlService.createDevice({
        name: config.name,
        code: config.code,
        type: config.type,
        status: DeviceStatus.IDLE,
        locationZone: 'zone-a',
        currentValue: 0,
        targetValue: 50,
        maxCapacity: config.maxCapacity,
        unit: config.unit,
      });
      devices.push(device);

      await this.auditService.logCreate(
        AuditResourceType.CONTROL_DEVICE,
        device.id,
        device.name,
        { ...device },
        'system',
        'Demo Setup',
      );
    }

    this.logger.log('Demo data setup complete');

    return {
      crop,
      growthStages,
      sensors,
      devices,
      thresholds,
    };
  }

  async simulateSensorReading(
    sensorId: string,
    value: number,
    operatorName: string = 'System',
  ): Promise<{
    reading: any;
    alarm: any | null;
  }> {
    this.logger.log(`Simulating sensor reading for sensor ${sensorId}: ${value}`);

    const reading = await this.sensorsService.processSensorData(sensorId, value);

    this.farmGateway.broadcastSensorReading(reading, 'zone-a');

    await this.auditService.logCreate(
      AuditResourceType.SENSOR_READING,
      reading.id,
      `Sensor ${sensorId} reading`,
      { ...reading },
      'system',
      operatorName,
    );

    const sensor = await this.sensorsService.getSensorById(sensorId);
    if (sensor) {
      const crops = await this.agronomyService.getAllCrops ? 
        await this.agronomyService.getAllCrops() : [];
      
      if (crops.length > 0) {
        const crop = crops[0];
        const growthDay = 10;
        
        const alarm = await this.alarmsService.checkAndCreateAlarm(
          sensorId,
          reading.filteredValue ?? value,
          reading.timestamp,
          crop.id,
          growthDay,
        );

        if (alarm) {
          this.farmGateway.broadcastAlarmCreated(alarm);
          this.logger.log(`Alarm created: ${alarm.title}`);
        }

        return {
          reading,
          alarm,
        };
      }
    }

    return {
      reading,
      alarm: null,
    };
  }

  async simulateAlarmTrigger(
    sensorId: string,
    value: number,
    cropId?: string,
    growthDay: number = 10,
  ): Promise<{
    alarm: any | null;
    actions: any[];
  }> {
    this.logger.log(`Simulating alarm trigger for sensor ${sensorId}: ${value}`);

    const alarm = await this.alarmsService.checkAndCreateAlarm(
      sensorId,
      value,
      new Date(),
      cropId,
      growthDay,
    );

    if (alarm) {
      this.farmGateway.broadcastAlarmCreated(alarm);
      
      const actions = await this.alarmsService.getActionsForAlarm(alarm.id);
      
      return {
        alarm,
        actions,
      };
    }

    return {
      alarm: null,
      actions: [],
    };
  }

  async executeControlCommand(
    deviceId: string,
    targetValue: number,
    operatorName: string,
    usePid: boolean = false,
    reason?: string,
  ): Promise<any> {
    this.logger.log(`Executing control command for device ${deviceId}: target ${targetValue}`);

    let command: any;

    if (usePid) {
      command = await this.controlService.calculateAndExecutePidControl(
        deviceId,
        targetValue,
        undefined,
        undefined,
        operatorName,
      );
    } else {
      command = await this.controlService.createManualCommand(
        deviceId,
        targetValue,
        operatorName,
        reason,
      );
    }

    this.farmGateway.broadcastControlStatus(command);

    await this.auditService.logCreate(
      AuditResourceType.CONTROL_COMMAND,
      command.id,
      command.commandType,
      { ...command },
      'system',
      operatorName,
    );

    return command;
  }

  async runFullWorkflowTest(): Promise<{
    sensorReading: any;
    alarm: any | null;
    controlCommand: any | null;
    auditLogs: any[];
  }> {
    this.logger.log('Running full workflow test...');

    const sensors = await this.sensorsService.getAllSensors();
    if (sensors.length === 0) {
      throw new Error('No sensors found. Please set up demo data first.');
    }

    const temperatureSensor = sensors.find(s => s.type === SensorType.TEMPERATURE) || sensors[0];
    const soilMoistureSensor = sensors.find(s => s.type === SensorType.SOIL_MOISTURE);

    let alarm = null;
    let sensorReading = null;

    if (soilMoistureSensor) {
      const result = await this.simulateSensorReading(
        soilMoistureSensor.id,
        25,
        'Test System',
      );
      sensorReading = result.reading;
      alarm = result.alarm;
    }

    let controlCommand = null;
    const devices = await this.controlService.getAllDevices();
    const irrigationDevice = devices.find(d => d.type === DeviceType.IRRIGATION_VALVE);
    
    if (irrigationDevice && alarm) {
      controlCommand = await this.executeControlCommand(
        irrigationDevice.id,
        60,
        'Test Operator',
        true,
        'Soil moisture too low - automatic irrigation',
      );
    }

    return {
      sensorReading,
      alarm,
      controlCommand,
      auditLogs: [],
    };
  }
}
