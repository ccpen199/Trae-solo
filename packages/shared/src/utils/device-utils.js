"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCapabilities = getDefaultCapabilities;
exports.generateDeviceId = generateDeviceId;
exports.validateVendorSignature = validateVendorSignature;
exports.buildStandardProperties = buildStandardProperties;
const device_enum_1 = require("../enums/device.enum");
const CATEGORY_DEFAULT_CAPABILITIES = {
    [device_enum_1.DeviceCategory.LIGHT]: [
        device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF,
        device_enum_1.DeviceCapability.BRIGHTNESS, device_enum_1.DeviceCapability.COLOR, device_enum_1.DeviceCapability.COLOR_TEMP,
    ],
    [device_enum_1.DeviceCategory.SWITCH]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.TIMER],
    [device_enum_1.DeviceCategory.PLUG]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.TIMER, device_enum_1.DeviceCapability.SCHEDULE],
    [device_enum_1.DeviceCategory.CURTAIN]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.MODE],
    [device_enum_1.DeviceCategory.AIR_CONDITIONER]: [
        device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.TEMPERATURE,
        device_enum_1.DeviceCapability.MODE, device_enum_1.DeviceCapability.FAN_SPEED,
    ],
    [device_enum_1.DeviceCategory.THERMOSTAT]: [device_enum_1.DeviceCapability.TEMPERATURE, device_enum_1.DeviceCapability.HUMIDITY, device_enum_1.DeviceCapability.MODE],
    [device_enum_1.DeviceCategory.CAMERA]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.MOTION],
    [device_enum_1.DeviceCategory.DOOR_LOCK]: [device_enum_1.DeviceCapability.LOCK, device_enum_1.DeviceCapability.BATTERY, device_enum_1.DeviceCapability.DOOR],
    [device_enum_1.DeviceCategory.SENSOR]: [device_enum_1.DeviceCapability.TEMPERATURE, device_enum_1.DeviceCapability.HUMIDITY, device_enum_1.DeviceCapability.MOTION, device_enum_1.DeviceCapability.BATTERY],
    [device_enum_1.DeviceCategory.SPEAKER]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.VOLUME],
    [device_enum_1.DeviceCategory.HUMIDIFIER]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.HUMIDITY, device_enum_1.DeviceCapability.MODE],
    [device_enum_1.DeviceCategory.PURIFIER]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.MODE, device_enum_1.DeviceCapability.FAN_SPEED],
    [device_enum_1.DeviceCategory.TV]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.VOLUME, device_enum_1.DeviceCapability.MODE],
    [device_enum_1.DeviceCategory.FAN]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF, device_enum_1.DeviceCapability.FAN_SPEED, device_enum_1.DeviceCapability.MODE],
    [device_enum_1.DeviceCategory.GATEWAY]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF],
    [device_enum_1.DeviceCategory.OTHER]: [device_enum_1.DeviceCapability.POWER, device_enum_1.DeviceCapability.ONOFF],
};
function getDefaultCapabilities(category) {
    return CATEGORY_DEFAULT_CAPABILITIES[category] || CATEGORY_DEFAULT_CAPABILITIES[device_enum_1.DeviceCategory.OTHER];
}
function generateDeviceId(vendorId, vendorDeviceId) {
    const hash = require('crypto')
        .createHash('sha256')
        .update(`${vendorId}:${vendorDeviceId}`)
        .digest('hex')
        .substring(0, 16);
    return `dev_${vendorId}_${hash}`;
}
function validateVendorSignature(payload, signature, secret) {
    const expected = require('crypto')
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    return require('crypto').timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function buildStandardProperties(raw, mappings) {
    const result = {};
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
//# sourceMappingURL=device-utils.js.map