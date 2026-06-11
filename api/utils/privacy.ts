import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "health-data-encryption-key-2026";

export function encryptSensitiveData(data: unknown): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

export function decryptSensitiveData(encrypted: string): unknown {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + "****" + phone.substring(phone.length - 4);
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.substring(0, 6) + "********" + idCard.substring(idCard.length - 4);
}

export function desensitizeVitalRecord<T extends { userId?: string; user_id?: string }>(
  record: T
): T {
  const result = { ...record };
  if ("userId" in result) {
    result.userId = "***";
  }
  if ("user_id" in result) {
    (result as { user_id: string }).user_id = "***";
  }
  return result;
}

export function kAnonymize<T extends Record<string, unknown>>(
  records: T[],
  quasiIdentifiers: (keyof T)[],
  k: number = 5
): T[] {
  return records;
}

export function addDifferentialPrivacy<T extends Record<string, number>>(
  value: T,
  epsilon: number = 1.0,
  sensitivity: number = 1.0
): T {
  const result = { ...value };
  const scale = sensitivity / epsilon;

  for (const key of Object.keys(result) as (keyof T)[]) {
    if (typeof result[key] === "number") {
      const laplace = (Math.random() - 0.5) * 2 * scale;
      (result[key] as number) = Math.round(((result[key] as number) + laplace) * 100) / 100;
    }
  }

  return result;
}

export function hashUserId(userId: string): string {
  return CryptoJS.SHA256(userId + ENCRYPTION_KEY).toString();
}

export const dataMaskingRules = {
  phone: maskPhone,
  idCard: maskIdCard,
  name: (name: string) => (name.length > 1 ? name[0] + "*" : name),
  email: (email: string) => {
    const [local, domain] = email.split("@");
    return (local?.substring(0, 2) || "") + "***@" + domain;
  },
};

export interface DataPrivacyConfig {
  encryptSensitiveFields: boolean;
  maskIdentifiers: boolean;
  enableKAnonymity: boolean;
  enableDifferentialPrivacy: boolean;
  kValue: number;
  epsilon: number;
}

export const defaultPrivacyConfig: DataPrivacyConfig = {
  encryptSensitiveFields: true,
  maskIdentifiers: true,
  enableKAnonymity: false,
  enableDifferentialPrivacy: false,
  kValue: 5,
  epsilon: 1.0,
};

export function applyPrivacyFilter<T>(
  data: T,
  config: Partial<DataPrivacyConfig> = {}
): T {
  const mergedConfig = { ...defaultPrivacyConfig, ...config };
  let result = structuredClone(data);

  if (mergedConfig.encryptSensitiveFields && typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    if ("trajectory" in obj) {
      obj.trajectory_encrypted = encryptSensitiveData(obj.trajectory);
      delete obj.trajectory;
    }
    if ("rawData" in obj) {
      obj.raw_data_encrypted = encryptSensitiveData(obj.rawData);
      delete obj.rawData;
    }
    if ("noiseLevel" in obj) {
      obj.noiseLevelJson = JSON.stringify(obj.noiseLevel);
    }
    if ("stages" in obj) {
      obj.stagesJson = JSON.stringify(obj.stages);
    }
    if ("heartRateZones" in obj) {
      obj.heartRateZonesJson = JSON.stringify(obj.heartRateZones);
    }
    if ("dailyPlans" in obj) {
      obj.dailyPlansJson = JSON.stringify(obj.dailyPlans);
    }
    if ("dataTypes" in obj) {
      obj.dataTypesJson = JSON.stringify(obj.dataTypes);
    }
    if ("scope" in obj) {
      obj.scopeJson = JSON.stringify(obj.scope);
    }
    if ("availableSlots" in obj) {
      obj.availableSlotsJson = JSON.stringify(obj.availableSlots);
    }
  }

  return result;
}

export function reversePrivacyFilter<T>(data: T): T {
  const result = structuredClone(data) as Record<string, unknown>;

  if ("trajectory_encrypted" in result && typeof result.trajectory_encrypted === "string") {
    result.trajectory = decryptSensitiveData(result.trajectory_encrypted);
    delete result.trajectory_encrypted;
  }
  if ("raw_data_encrypted" in result && typeof result.raw_data_encrypted === "string") {
    result.rawData = decryptSensitiveData(result.raw_data_encrypted);
    delete result.raw_data_encrypted;
  }
  if ("noiseLevelJson" in result && typeof result.noiseLevelJson === "string") {
    result.noiseLevel = JSON.parse(result.noiseLevelJson);
    delete result.noiseLevelJson;
  }
  if ("stagesJson" in result && typeof result.stagesJson === "string") {
    result.stages = JSON.parse(result.stagesJson);
    delete result.stagesJson;
  }
  if ("heartRateZonesJson" in result && typeof result.heartRateZonesJson === "string") {
    result.heartRateZones = JSON.parse(result.heartRateZonesJson);
    delete result.heartRateZonesJson;
  }
  if ("dailyPlansJson" in result && typeof result.dailyPlansJson === "string") {
    result.dailyPlans = JSON.parse(result.dailyPlansJson);
    delete result.dailyPlansJson;
  }
  if ("dataTypesJson" in result && typeof result.dataTypesJson === "string") {
    result.dataTypes = JSON.parse(result.dataTypesJson);
    delete result.dataTypesJson;
  }
  if ("scopeJson" in result && typeof result.scopeJson === "string") {
    result.scope = JSON.parse(result.scopeJson);
    delete result.scopeJson;
  }
  if ("availableSlotsJson" in result && typeof result.availableSlotsJson === "string") {
    result.availableSlots = JSON.parse(result.availableSlotsJson);
    delete result.availableSlotsJson;
  }

  return result as T;
}
