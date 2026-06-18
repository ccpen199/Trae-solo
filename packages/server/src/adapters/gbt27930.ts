import {
  BasePileAdapter,
  ChargingPileStatus,
  StartChargingResult,
  StopChargingResult,
  ChargingData,
} from './base';
import logger from '../utils/logger';

export class GBT27930Adapter extends BasePileAdapter {
  private connectedPiles: Map<string, any> = new Map();

  constructor(operatorId: string, apiKey: string, apiSecret: string, baseUrl: string) {
    super(operatorId, apiKey, apiSecret, baseUrl);
  }

  async getPileStatus(pileNo: string): Promise<ChargingPileStatus | null> {
    try {
      const pile = this.connectedPiles.get(pileNo);
      if (!pile) {
        return {
          pileNo,
          status: 'offline',
          currentPower: 0,
          currentSoc: 0,
          lastHeartbeat: new Date(),
        };
      }

      return {
        pileNo,
        status: pile.status || 'idle',
        currentPower: pile.currentPower || 0,
        currentSoc: pile.currentSoc || 0,
        lastHeartbeat: pile.lastHeartbeat || new Date(),
      };
    } catch (err) {
      logger.error(`GBT27930 获取桩状态失败: ${pileNo}`, err);
      return null;
    }
  }

  async startCharging(pileNo: string, userId: string, vin?: string): Promise<StartChargingResult> {
    try {
      const pile = this.connectedPiles.get(pileNo);
      if (!pile || pile.status === 'offline') {
        return {
          success: false,
          message: '充电桩离线',
        };
      }

      const orderNo = `GBT${Date.now()}${Math.floor(Math.random() * 10000)}`;

      this.connectedPiles.set(pileNo, {
        ...pile,
        status: 'charging',
        currentOrder: orderNo,
        userId,
        vin,
        startTime: new Date(),
      });

      return {
        success: true,
        orderNo,
        message: '启动充电成功',
      };
    } catch (err) {
      logger.error(`GBT27930 启动充电失败: ${pileNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '启动充电失败',
      };
    }
  }

  async stopCharging(orderNo: string, pileNo: string): Promise<StopChargingResult> {
    try {
      const pile = this.connectedPiles.get(pileNo);
      if (!pile) {
        return {
          success: false,
          message: '充电桩不存在',
        };
      }

      const chargedKwh = pile.chargedKwh || 0;
      const totalAmount = chargedKwh * 1.5;

      this.connectedPiles.set(pileNo, {
        ...pile,
        status: 'idle',
        currentOrder: null,
        chargedKwh: 0,
      });

      return {
        success: true,
        chargedKwh,
        totalAmount,
        message: '停止充电成功',
      };
    } catch (err) {
      logger.error(`GBT27930 停止充电失败: ${orderNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '停止充电失败',
      };
    }
  }

  async getChargingData(orderNo: string, pileNo: string): Promise<ChargingData | null> {
    try {
      const pile = this.connectedPiles.get(pileNo);
      if (!pile) {
        return null;
      }

      return {
        pileNo,
        currentPower: pile.currentPower || 0,
        currentSoc: pile.currentSoc || 0,
        chargedKwh: pile.chargedKwh || 0,
        voltage: pile.voltage || 0,
        current: pile.current || 0,
        timestamp: new Date(),
      };
    } catch (err) {
      logger.error(`GBT27930 获取充电数据失败: ${orderNo}`, err);
      return null;
    }
  }

  setPileStatus(pileNo: string, status: Partial<ChargingPileStatus> & { [key: string]: any }): void {
    const existing = this.connectedPiles.get(pileNo) || {};
    this.connectedPiles.set(pileNo, {
      ...existing,
      ...status,
      lastHeartbeat: new Date(),
    });
  }
}

export default GBT27930Adapter;
