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

export class StateGridAdapter extends BasePileAdapter {
  private token: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(operatorId: string, apiKey: string, apiSecret: string, baseUrl: string) {
    super(operatorId, apiKey, apiSecret, baseUrl);
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpireTime) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/token`, {
        appId: this.apiKey,
        appSecret: this.apiSecret,
      });

      this.token = response.data.token;
      this.tokenExpireTime = now + response.data.expiresIn * 1000;
      return this.token || '';
    } catch (err) {
      logger.error('StateGrid 获取 token 失败', err);
      throw err;
    }
  }

  async getPileStatus(pileNo: string): Promise<ChargingPileStatus | null> {
    try {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/pile/status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { pileNo },
      });

      const data = response.data;
      return {
        pileNo: data.pileNo,
        status: data.status,
        currentPower: parseFloat(data.currentPower) || 0,
        currentSoc: parseInt(data.currentSoc) || 0,
        lastHeartbeat: new Date(data.lastHeartbeat),
      };
    } catch (err) {
      logger.error(`StateGrid 获取桩状态失败: ${pileNo}`, err);
      return null;
    }
  }

  async startCharging(pileNo: string, userId: string, vin?: string): Promise<StartChargingResult> {
    try {
      const token = await this.getToken();
      const orderNo = uuidv4().replace(/-/g, '').toUpperCase();

      await axios.post(
        `${this.baseUrl}/charging/start`,
        {
          pileNo,
          orderNo,
          userId,
          vin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        success: true,
        orderNo,
        message: '启动充电成功',
      };
    } catch (err) {
      logger.error(`StateGrid 启动充电失败: ${pileNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '启动充电失败',
      };
    }
  }

  async stopCharging(orderNo: string, pileNo: string): Promise<StopChargingResult> {
    try {
      const token = await this.getToken();
      const response = await axios.post(
        `${this.baseUrl}/charging/stop`,
        { orderNo, pileNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      return {
        success: true,
        chargedKwh: parseFloat(data.chargedKwh) || 0,
        totalAmount: parseFloat(data.totalAmount) || 0,
        message: '停止充电成功',
      };
    } catch (err) {
      logger.error(`StateGrid 停止充电失败: ${orderNo}`, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : '停止充电失败',
      };
    }
  }

  async getChargingData(orderNo: string, pileNo: string): Promise<ChargingData | null> {
    try {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/charging/data`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { orderNo, pileNo },
      });

      const data = response.data;
      return {
        pileNo: data.pileNo,
        currentPower: parseFloat(data.currentPower) || 0,
        currentSoc: parseInt(data.currentSoc) || 0,
        chargedKwh: parseFloat(data.chargedKwh) || 0,
        voltage: parseFloat(data.voltage) || 0,
        current: parseFloat(data.current) || 0,
        timestamp: new Date(data.timestamp),
      };
    } catch (err) {
      logger.error(`StateGrid 获取充电数据失败: ${orderNo}`, err);
      return null;
    }
  }
}

export default StateGridAdapter;
