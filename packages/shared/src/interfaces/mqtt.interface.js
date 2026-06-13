"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTT_TOPICS = exports.MqttMessageType = exports.MqttQoS = void 0;
var MqttQoS;
(function (MqttQoS) {
    MqttQoS[MqttQoS["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
    MqttQoS[MqttQoS["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
    MqttQoS[MqttQoS["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE";
})(MqttQoS || (exports.MqttQoS = MqttQoS = {}));
var MqttMessageType;
(function (MqttMessageType) {
    MqttMessageType["TELEMETRY"] = "telemetry";
    MqttMessageType["STATUS"] = "status";
    MqttMessageType["COMMAND"] = "command";
    MqttMessageType["COMMAND_RESPONSE"] = "command_response";
    MqttMessageType["OTA"] = "ota";
    MqttMessageType["DISCOVERY"] = "discovery";
    MqttMessageType["HEARTBEAT"] = "heartbeat";
})(MqttMessageType || (exports.MqttMessageType = MqttMessageType = {}));
exports.MQTT_TOPICS = {
    telemetry: (v, d) => `iot/${v}/${d}/telemetry`,
    status: (v, d) => `iot/${v}/${d}/status`,
    command: (v, d) => `iot/${v}/${d}/command`,
    commandResponse: (v, d) => `iot/${v}/${d}/command/resp`,
    ota: (v, d) => `iot/${v}/${d}/ota`,
    discovery: (v) => `iot/${v}/discovery`,
    heartbeat: (v, d) => `iot/${v}/${d}/heartbeat`,
};
//# sourceMappingURL=mqtt.interface.js.map