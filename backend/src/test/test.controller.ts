import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TestService } from './test.service';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('status')
  async getSystemStatus(): Promise<{
    sensors: any[];
    devices: any[];
    openAlarms: any[];
  }> {
    return this.testService.getSystemStatus();
  }

  @Post('setup-demo')
  async setupDemoData(): Promise<{
    crop: any;
    growthStages: any[];
    sensors: any[];
    devices: any[];
    thresholds: any[];
  }> {
    return this.testService.setupDemoData();
  }

  @Post('sensor-reading')
  async simulateSensorReading(
    @Body() body: {
      sensorId: string;
      value: number;
      operatorName?: string;
    },
  ): Promise<{
    reading: any;
    alarm: any | null;
  }> {
    return this.testService.simulateSensorReading(
      body.sensorId,
      body.value,
      body.operatorName || 'System',
    );
  }

  @Post('alarm-trigger')
  async simulateAlarmTrigger(
    @Body() body: {
      sensorId: string;
      value: number;
      cropId?: string;
      growthDay?: number;
    },
  ): Promise<{
    alarm: any | null;
    actions: any[];
  }> {
    return this.testService.simulateAlarmTrigger(
      body.sensorId,
      body.value,
      body.cropId,
      body.growthDay || 10,
    );
  }

  @Post('control-command')
  async executeControlCommand(
    @Body() body: {
      deviceId: string;
      targetValue: number;
      operatorName: string;
      usePid?: boolean;
      reason?: string;
    },
  ): Promise<any> {
    return this.testService.executeControlCommand(
      body.deviceId,
      body.targetValue,
      body.operatorName,
      body.usePid || false,
      body.reason,
    );
  }

  @Post('full-workflow')
  async runFullWorkflowTest(): Promise<{
    sensorReading: any;
    alarm: any | null;
    controlCommand: any | null;
    auditLogs: any[];
  }> {
    return this.testService.runFullWorkflowTest();
  }
}
