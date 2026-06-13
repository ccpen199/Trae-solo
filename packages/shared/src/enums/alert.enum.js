"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannel = exports.OtaStatus = exports.AlertStatus = exports.AlertSeverity = exports.AlertType = void 0;
var AlertType;
(function (AlertType) {
    AlertType["DEVICE_OFFLINE"] = "device_offline";
    AlertType["HIGH_POWER_CONSUMPTION"] = "high_power_consumption";
    AlertType["LOW_BATTERY"] = "low_battery";
    AlertType["DEVICE_FAULT"] = "device_fault";
    AlertType["OTA_FAILED"] = "ota_failed";
    AlertType["SECURITY_ALERT"] = "security_alert";
    AlertType["TEMPERATURE_ABNORMAL"] = "temperature_abnormal";
    AlertType["UNUSUAL_ACTIVITY"] = "unusual_activity";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["OPEN"] = "open";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["IGNORED"] = "ignored";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var OtaStatus;
(function (OtaStatus) {
    OtaStatus["PENDING"] = "pending";
    OtaStatus["DOWNLOADING"] = "downloading";
    OtaStatus["INSTALLING"] = "installing";
    OtaStatus["SUCCESS"] = "success";
    OtaStatus["FAILED"] = "failed";
    OtaStatus["CANCELED"] = "canceled";
})(OtaStatus || (exports.OtaStatus = OtaStatus = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["WEBHOOK"] = "webhook";
    NotificationChannel["WECHAT"] = "wechat";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
//# sourceMappingURL=alert.enum.js.map