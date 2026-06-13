"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneStatus = exports.SceneActionType = exports.SceneConditionOperator = exports.SceneTriggerType = void 0;
var SceneTriggerType;
(function (SceneTriggerType) {
    SceneTriggerType["MANUAL"] = "manual";
    SceneTriggerType["TIME"] = "time";
    SceneTriggerType["CRON"] = "cron";
    SceneTriggerType["DEVICE_STATE"] = "device_state";
    SceneTriggerType["SENSOR"] = "sensor";
    SceneTriggerType["GEOFENCE"] = "geofence";
    SceneTriggerType["WEATHER"] = "weather";
})(SceneTriggerType || (exports.SceneTriggerType = SceneTriggerType = {}));
var SceneConditionOperator;
(function (SceneConditionOperator) {
    SceneConditionOperator["EQ"] = "eq";
    SceneConditionOperator["NEQ"] = "neq";
    SceneConditionOperator["GT"] = "gt";
    SceneConditionOperator["GTE"] = "gte";
    SceneConditionOperator["LT"] = "lt";
    SceneConditionOperator["LTE"] = "lte";
    SceneConditionOperator["IN"] = "in";
    SceneConditionOperator["NOT_IN"] = "not_in";
    SceneConditionOperator["CONTAINS"] = "contains";
    SceneConditionOperator["BETWEEN"] = "between";
})(SceneConditionOperator || (exports.SceneConditionOperator = SceneConditionOperator = {}));
var SceneActionType;
(function (SceneActionType) {
    SceneActionType["DEVICE_CONTROL"] = "device_control";
    SceneActionType["DEVICE_DELAY"] = "device_delay";
    SceneActionType["SCENE_ACTIVATE"] = "scene_activate";
    SceneActionType["NOTIFICATION"] = "notification";
    SceneActionType["HTTP_CALLBACK"] = "http_callback";
})(SceneActionType || (exports.SceneActionType = SceneActionType = {}));
var SceneStatus;
(function (SceneStatus) {
    SceneStatus["ENABLED"] = "enabled";
    SceneStatus["DISABLED"] = "disabled";
    SceneStatus["ERROR"] = "error";
})(SceneStatus || (exports.SceneStatus = SceneStatus = {}));
//# sourceMappingURL=scene.enum.js.map