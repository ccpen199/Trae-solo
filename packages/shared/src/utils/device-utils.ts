import { DeviceCapability, DeviceCategory } from '../enums/device.enum';

export interface ICapabilityMapping {
  vendorCapability: string;
  standardCapability: DeviceCapability;
  transformer?: (value: any) => any;
  reverseTransformer?: (value: any) => any;
}

const CATEGORY_DEFAULT_CAPABILITIES: Record<DeviceCategory, DeviceCapability[]> = {
  [DeviceCategory.LIGHT]: [
    DeviceCapability.POWER, DeviceCapability.ONOFF,
    DeviceCapability.BRIGHTNESS, DeviceCapability.COLOR, DeviceCapability.COLOR_TEMP,
  ],
  [DeviceCategory.SWITCH]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.TIMER],
  [DeviceCategory.PLUG]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.TIMER, DeviceCapability.SCHEDULE],
  [DeviceCategory.CURTAIN]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.MODE],
  [DeviceCategory.AIR_CONDITIONER]: [
    DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.TEMPERATURE,
    DeviceCapability.MODE, DeviceCapability.FAN_SPEED,
  ],
  [DeviceCategory.THERMOSTAT]: [DeviceCapability.TEMPERATURE, DeviceCapability.HUMIDITY, DeviceCapability.MODE],
  [DeviceCategory.CAMERA]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.MOTION],
  [DeviceCategory.DOOR_LOCK]: [DeviceCapability.LOCK, DeviceCapability.BATTERY, DeviceCapability.DOOR],
  [DeviceCategory.SENSOR]: [DeviceCapability.TEMPERATURE, DeviceCapability.HUMIDITY, DeviceCapability.MOTION, DeviceCapability.BATTERY],
  [DeviceCategory.SPEAKER]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.VOLUME],
  [DeviceCategory.HUMIDIFIER]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.HUMIDITY, DeviceCapability.MODE],
  [DeviceCategory.PURIFIER]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.MODE, DeviceCapability.FAN_SPEED],
  [DeviceCategory.TV]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.VOLUME, DeviceCapability.MODE],
  [DeviceCategory.FAN]: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.FAN_SPEED, DeviceCapability.MODE],
  [DeviceCategory.GATEWAY]: [DeviceCapability.POWER, DeviceCapability.ONOFF],
  [DeviceCategory.OTHER]: [DeviceCapability.POWER, DeviceCapability.ONOFF],
};

export function getDefaultCapabilities(category: DeviceCategory): DeviceCapability[] {
  return CATEGORY_DEFAULT_CAPABILITIES[category] || CATEGORY_DEFAULT_CAPABILITIES[DeviceCategory.OTHER];
}

export function generateDeviceId(vendorId: string, vendorDeviceId: string): string {
  const hash = require('crypto')
    .createHash('sha256')
    .update(`${vendorId}:${vendorDeviceId}`)
    .digest('hex')
    .substring(0, 16);
  return `dev_${vendorId}_${hash}`;
}

export function validateVendorSignature(payload: string, signature: string, secret: string): boolean {
  const expected = require('crypto')
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return require('crypto').timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export function buildStandardProperties(raw: Record<string, any>, mappings: ICapabilityMapping[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const mapping of mappings) {
    if (raw[mapping.vendorCapability] !== undefined) {
      const value = mapping.transformer
        ? mapping.transformer(raw[mapping.vendorCapability])
        : raw[mapping.vendorCapability];
      result[mapping.standardCapability] = value;
    }
  }
  return result;
}
