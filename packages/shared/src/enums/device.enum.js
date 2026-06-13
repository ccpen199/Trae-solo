"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharePermission = exports.DeviceCapability = exports.DeviceStatus = exports.DeviceConnectivity = exports.DeviceCategory = void 0;
var DeviceCategory;
(function (DeviceCategory) {
    DeviceCategory["LIGHT"] = "light";
    DeviceCategory["SWITCH"] = "switch";
    DeviceCategory["PLUG"] = "plug";
    DeviceCategory["CURTAIN"] = "curtain";
    DeviceCategory["AIR_CONDITIONER"] = "air_conditioner";
    DeviceCategory["THERMOSTAT"] = "thermostat";
    DeviceCategory["CAMERA"] = "camera";
    DeviceCategory["DOOR_LOCK"] = "door_lock";
    DeviceCategory["SENSOR"] = "sensor";
    DeviceCategory["SPEAKER"] = "speaker";
    DeviceCategory["HUMIDIFIER"] = "humidifier";
    DeviceCategory["PURIFIER"] = "purifier";
    DeviceCategory["TV"] = "tv";
    DeviceCategory["FAN"] = "fan";
    DeviceCategory["GATEWAY"] = "gateway";
    DeviceCategory["OTHER"] = "other";
})(DeviceCategory || (exports.DeviceCategory = DeviceCategory = {}));
var DeviceConnectivity;
(function (DeviceConnectivity) {
    DeviceConnectivity["WIFI"] = "wifi";
    DeviceConnectivity["BLE"] = "ble";
    DeviceConnectivity["ZIGBEE"] = "zigbee";
    DeviceConnectivity["Z_WAVE"] = "zwave";
    DeviceConnectivity["LORA"] = "lora";
    DeviceConnectivity["MESH"] = "mesh";
    DeviceConnectivity["CELLULAR"] = "cellular";
    DeviceConnectivity["ETHERNET"] = "ethernet";
})(DeviceConnectivity || (exports.DeviceConnectivity = DeviceConnectivity = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "online";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["SLEEPING"] = "sleeping";
    DeviceStatus["UPDATING"] = "updating";
    DeviceStatus["FAULT"] = "fault";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var DeviceCapability;
(function (DeviceCapability) {
    DeviceCapability["POWER"] = "power";
    DeviceCapability["ONOFF"] = "onoff";
    DeviceCapability["BRIGHTNESS"] = "brightness";
    DeviceCapability["COLOR"] = "color";
    DeviceCapability["COLOR_TEMP"] = "color_temp";
    DeviceCapability["HUMIDITY"] = "humidity";
    DeviceCapability["TEMPERATURE"] = "temperature";
    DeviceCapability["BATTERY"] = "battery";
    DeviceCapability["MOTION"] = "motion";
    DeviceCapability["DOOR"] = "door";
    DeviceCapability["LOCK"] = "lock";
    DeviceCapability["VOLUME"] = "volume";
    DeviceCapability["FAN_SPEED"] = "fan_speed";
    DeviceCapability["MODE"] = "mode";
    DeviceCapability["TIMER"] = "timer";
    DeviceCapability["SCHEDULE"] = "schedule";
})(DeviceCapability || (exports.DeviceCapability = DeviceCapability = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW_ONLY"] = "view_only";
    SharePermission["CONTROLLABLE"] = "controllable";
    SharePermission["FULL_SHARE"] = "full_share";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
//# sourceMappingURL=device.enum.js.map