import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  BasePileAdapter,
  ChargingPileStatus,
  StartChargingResult,
  StopChargingResult,
  ChargingData,
} from './base';
import logger from '../utils/logger';

export class ThirdPartyAdapter extends BasePileAdapter {
  private accessKey: string;

  constructor(operatorId: string, apiKey: string, apiSecret: string, baseUrl: string) {
    super(operatorId, apiKey, apiSecret, baseUrl);
    this.accessKey = apiKey;
  }

  private generateSign(params: Record<string, any>, timestamp: string): string {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    return require('crypto')
      .createHash('md5')
      .update(`${queryString}&secret=${this.apiSecret}&timestamp=${timestamp}`)
      .digest('hex');
  }

  private async request(path: string, method: string = 'GET', data?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { ...data, accessKey: this.accessKey, timestamp };
    const sign = this.generateSign(params, timestamp);

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        params: method === 'GET' ? { ...params, sign } : undefined,
        data: method !== 'GET' ? { ...params, sign } : undefined,
      });
      return response.data;
    } catch (err) {
      logger.error(`ThirdParty 请求失败: ${path}`, err);
      throw err;
    }
  }

  async getPileStatus(pileNo: string): Promise<ChargingPileStatus | null> {
    try {
      const data = await this.request('/pile/status', 'GET', { pileNo });

      return {
        pileNo: data.pileNo,
        status: data.status,
        currentPower: parseFloat(data.power) || 0,
        currentSoc: parseInt(data.soc) || 0,
        lastHeartbeat: new Date(data.heartbeatTime),
      };
    } catch (err) {
      logger.error(`ThirdParty 获取桩状态失败: ${pileNo}`, err);
      return null;
    }
  }

  async startCharging(pileNo: string, userId: string, vin?: string): Promise<StartChargingResult> {
    try {
      const outTradeNo = uuidv4().replace(/-/g, '');
      const data = await this.request('/charging/start', 'POST', {
        pileNo,
        outTradeNo,
        userId,
        vin,
      });

      return {
        success: true,
        orderNo: data.orderNo || outTradeNo,
        message: '启动充电成功',
      };
    } catch (err) {
      logger.error(`ThirdParty 启动充电失败: ${pileNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '启动充电失败',
      };
    }
  }

  async stopCharging(orderNo: string, pileNo: string): Promise<StopChargingResult> {
    try {
      const data = await this.request('/charging/stop', 'POST', { orderNo, pileNo });

      return {
        success: true,
        chargedKwh: parseFloat(data.totalKwh) || 0,
        totalAmount: parseFloat(data.totalAmount) || 0,
        message: '停止充电成功',
      };
    } catch (err) {
      logger.error(`ThirdParty 停止充电失败: ${orderNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '停止充电失败',
      };
    }
  }

  async getChargingData(orderNo: string, pileNo: string): Promise<ChargingData | null> {
    try {
      const data = await this.request('/charging/realdata', 'GET', { orderNo, pileNo });

      return {
        pileNo: data.pileNo,
        currentPower: parseFloat(data.currentPower) || 0,
        currentSoc: parseInt(data.soc) || 0,
        chargedKwh: parseFloat(data.totalKwh) || 0,
        voltage: parseFloat(data.voltage) || 0,
        current: parseFloat(data.current) || 0,
        timestamp: new Date(data.time),
      };
    } catch (err) {
      logger.error(`ThirdParty 获取充电数据失败: ${orderNo}`, err);
      return null;
    }
  }
}

export default ThirdPartyAdapter;
