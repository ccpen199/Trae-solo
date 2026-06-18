export interface ChargingPileStatus {
  pileNo: string;
  status: string;
  currentPower: number;
  currentSoc: number;
  lastHeartbeat: Date;
}

export interface StartChargingResult {
  success: boolean;
  orderNo?: string;
  message?: string;
}

export interface StopChargingResult {
  success: boolean;
  chargedKwh?: number;
  totalAmount?: number;
  message?: string;
}

export interface ChargingData {
  pileNo: string;
  currentPower: number;
  currentSoc: number;
  chargedKwh: number;
  voltage: number;
  current: number;
  timestamp: Date;
}

export abstract class BasePileAdapter {
  protected operatorId: string;
  protected apiKey: string;
  protected apiSecret: string;
  protected baseUrl: string;

  constructor(operatorId: string, apiKey: string, apiSecret: string, baseUrl: string) {
    this.operatorId = operatorId;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  abstract getPileStatus(pileNo: string): Promise<ChargingPileStatus | null>;
  abstract startCharging(pileNo: string, userId: string, vin?: string): Promise<StartChargingResult>;
  abstract stopCharging(orderNo: string, pileNo: string): Promise<StopChargingResult>;
  abstract getChargingData(orderNo: string, pileNo: string): Promise<ChargingData | null>;
}

export default BasePileAdapter;
