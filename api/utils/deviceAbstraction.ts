import type { Device, ScanResult, ConnectionStatus } from "../../shared/types.js";

export interface ProtocolAdapter {
  brand: string;
  models: string[];
  parseHeartRate(data: ArrayBuffer): number | null;
  parseHRV(data: ArrayBuffer): number | null;
  parseBloodOxygen(data: ArrayBuffer): number | null;
  parseStressIndex(data: ArrayBuffer): number | null;
  parseSleepData(data: ArrayBuffer): unknown | null;
  parseExerciseData(data: ArrayBuffer): unknown | null;
  getServiceUUID(): string;
  getCharacteristicUUID(type: string): string;
  getSupportedFeatures(): string[];
  getProtocolVersion(): string;
}

class XiaomiBandAdapter implements ProtocolAdapter {
  brand = "Xiaomi";
  models = ["Mi Band 7", "Mi Band 8", "Mi Band 9", "Redmi Band 2"];

  parseHeartRate(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 1) {
      return view.getUint8(0);
    }
    return null;
  }

  parseHRV(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 2) {
      return view.getUint16(0, true) / 10;
    }
    return null;
  }

  parseBloodOxygen(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 1) {
      return view.getUint8(0);
    }
    return null;
  }

  parseStressIndex(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 1) {
      return view.getUint8(0);
    }
    return null;
  }

  parseSleepData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  parseExerciseData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  getServiceUUID(): string {
    return "0000180d-0000-1000-8000-00805f9b34fb";
  }

  getCharacteristicUUID(type: string): string {
    const uuids: Record<string, string> = {
      heartRate: "00002a37-0000-1000-8000-00805f9b34fb",
      hrv: "00002a37-0000-1000-8000-00805f9b34fb",
      bloodOxygen: "00002a5e-0000-1000-8000-00805f9b34fb",
      stress: "00002a5e-0000-1000-8000-00805f9b34fb",
    };
    return uuids[type] || "";
  }

  getSupportedFeatures(): string[] {
    return ["心率监测", "血氧监测", "睡眠分析", "压力评估", "HRV分析", "运动追踪"];
  }

  getProtocolVersion(): string {
    return "BLE 5.2 / GATT / HRS v1.0";
  }
}

class HuaweiWatchAdapter implements ProtocolAdapter {
  brand = "Huawei";
  models = ["Watch GT3", "Watch GT4", "Watch 4", "Watch 4 Pro"];

  parseHeartRate(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 2) {
      return view.getUint8(1);
    }
    return null;
  }

  parseHRV(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 4) {
      return view.getUint16(2, true) / 10;
    }
    return null;
  }

  parseBloodOxygen(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 3) {
      return view.getUint8(2);
    }
    return null;
  }

  parseStressIndex(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 4) {
      return view.getUint8(3);
    }
    return null;
  }

  parseSleepData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  parseExerciseData(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 4) {
      return view.getUint32(0, true);
    }
    return null;
  }

  getServiceUUID(): string {
    return "0000fee0-0000-1000-8000-00805f9b34fb";
  }

  getCharacteristicUUID(type: string): string {
    const uuids: Record<string, string> = {
      heartRate: "0000fee1-0000-1000-8000-00805f9b34fb",
      hrv: "0000fee2-0000-1000-8000-00805f9b34fb",
      bloodOxygen: "0000fee3-0000-1000-8000-00805f9b34fb",
      stress: "0000fee4-0000-1000-8000-00805f9b34fb",
    };
    return uuids[type] || "";
  }

  getSupportedFeatures(): string[] {
    return ["心率监测", "血氧监测", "睡眠分析", "压力评估", "HRV分析", "运动追踪", "体温监测"];
  }

  getProtocolVersion(): string {
    return "BLE 5.3 / GATT / Huawei Health Protocol v2.1";
  }
}

class AppleWatchAdapter implements ProtocolAdapter {
  brand = "Apple";
  models = ["Watch Series 8", "Watch Series 9", "Watch Ultra", "Watch Ultra 2"];

  parseHeartRate(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 8) {
      return view.getUint16(2, false);
    }
    return null;
  }

  parseHRV(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 16) {
      return view.getFloat64(8, false);
    }
    return null;
  }

  parseBloodOxygen(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 8) {
      return view.getUint8(0);
    }
    return null;
  }

  parseStressIndex(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 8) {
      return view.getUint8(1);
    }
    return null;
  }

  parseSleepData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  parseExerciseData(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 8) {
      return view.getFloat64(0, false);
    }
    return null;
  }

  getServiceUUID(): string {
    return "0000180d-0000-1000-8000-00805f9b34fb";
  }

  getCharacteristicUUID(type: string): string {
    const uuids: Record<string, string> = {
      heartRate: "00002a37-0000-1000-8000-00805f9b34fb",
      hrv: "00002a37-0000-1000-8000-00805f9b34fb",
      bloodOxygen: "00002a5e-0000-1000-8000-00805f9b34fb",
      stress: "00002a5e-0000-1000-8000-00805f9b34fb",
    };
    return uuids[type] || "";
  }

  getSupportedFeatures(): string[] {
    return ["心率监测", "血氧监测", "睡眠分析", "压力评估", "HRV分析", "运动追踪", "ECG心电图", "跌倒检测"];
  }

  getProtocolVersion(): string {
    return "BLE 5.3 / GATT / HealthKit / HRS v1.0";
  }
}

class GenericBLEAdapter implements ProtocolAdapter {
  brand = "Generic";
  models = ["*"];

  parseHeartRate(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 2) {
      const flags = view.getUint8(0);
      const rateFormat = flags & 0x01;
      return rateFormat === 1 ? view.getUint16(1, true) : view.getUint8(1);
    }
    return null;
  }

  parseHRV(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 4) {
      return view.getUint16(2, true) / 10;
    }
    return null;
  }

  parseBloodOxygen(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 2) {
      return view.getUint8(1);
    }
    return null;
  }

  parseStressIndex(data: ArrayBuffer): number | null {
    const view = new DataView(data);
    if (view.byteLength >= 2) {
      return view.getUint8(0);
    }
    return null;
  }

  parseSleepData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  parseExerciseData(data: ArrayBuffer): unknown | null {
    return { raw: new Uint8Array(data) };
  }

  getServiceUUID(): string {
    return "0000180d-0000-1000-8000-00805f9b34fb";
  }

  getCharacteristicUUID(type: string): string {
    const uuids: Record<string, string> = {
      heartRate: "00002a37-0000-1000-8000-00805f9b34fb",
      hrv: "00002a37-0000-1000-8000-00805f9b34fb",
      bloodOxygen: "00002a5e-0000-1000-8000-00805f9b34fb",
      stress: "00002a5e-0000-1000-8000-00805f9b34fb",
    };
    return uuids[type] || "";
  }

  getSupportedFeatures(): string[] {
    return ["心率监测", "血氧监测", "睡眠分析", "运动追踪"];
  }

  getProtocolVersion(): string {
    return "BLE 5.0 / GATT / Standard HRS v1.0";
  }
}

const adapters: ProtocolAdapter[] = [
  new XiaomiBandAdapter(),
  new HuaweiWatchAdapter(),
  new AppleWatchAdapter(),
  new GenericBLEAdapter(),
];

export class DeviceAbstractionLayer {
  private adapters: Map<string, ProtocolAdapter> = new Map();

  constructor() {
    for (const adapter of adapters) {
      this.adapters.set(adapter.brand, adapter);
    }
  }

  getAdapter(brand: string, model?: string): ProtocolAdapter {
    let adapter = this.adapters.get(brand);

    if (!adapter || (model && !adapter.models.includes(model) && adapter.models[0] !== "*")) {
      adapter = this.adapters.get("Generic") as ProtocolAdapter;
    }

    return adapter;
  }

  getAllBrands(): string[] {
    return Array.from(this.adapters.keys()).filter((b) => b !== "Generic");
  }

  getModelsForBrand(brand: string): string[] {
    const adapter = this.adapters.get(brand);
    return adapter?.models || [];
  }

  simulateScan(): ScanResult[] {
    const brands = this.getAllBrands();
    return brands.slice(0, 3).map((brand, index) => {
      const adapter = this.adapters.get(brand) as ProtocolAdapter;
      return {
        deviceId: `sim-${Date.now()}-${index}`,
        name: `${adapter.models[0] || "Unknown"}`,
        brand,
        signalStrength: -50 - Math.random() * 40,
        supportedProtocols: ["BLE", "GATT", "HRS"],
      };
    });
  }

  parseData(
    brand: string,
    model: string,
    dataType: string,
    data: ArrayBuffer
  ): number | null {
    const adapter = this.getAdapter(brand, model);
    const parseMethods: Record<string, (d: ArrayBuffer) => number | null> = {
      heartRate: adapter.parseHeartRate.bind(adapter),
      hrv: adapter.parseHRV.bind(adapter),
      bloodOxygen: adapter.parseBloodOxygen.bind(adapter),
      stressIndex: adapter.parseStressIndex.bind(adapter),
    };
    const parser = parseMethods[dataType];
    return parser ? parser(data) : null;
  }
}

export const deviceAbstractionLayer = new DeviceAbstractionLayer();
