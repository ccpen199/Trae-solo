"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSharePermissionDto = exports.ShareDeviceDto = exports.ScheduleControlDto = exports.BatchControlDto = exports.ControlDeviceDto = void 0;
const class_validator_1 = require("class-validator");
const device_enum_1 = require("../enums/device.enum");
class ControlDeviceDto {
}
exports.ControlDeviceDto = ControlDeviceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ControlDeviceDto.prototype, "command", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ControlDeviceDto.prototype, "params", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ControlDeviceDto.prototype, "timeoutMs", void 0);
class BatchControlDto {
}
exports.BatchControlDto = BatchControlDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    __metadata("design:type", Array)
], BatchControlDto.prototype, "commands", void 0);
class ScheduleControlDto {
}
exports.ScheduleControlDto = ScheduleControlDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleControlDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ScheduleControlDto.prototype, "commands", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleControlDto.prototype, "triggerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], ScheduleControlDto.prototype, "triggerAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScheduleControlDto.prototype, "cronExpression", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ScheduleControlDto.prototype, "weekdays", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ScheduleControlDto.prototype, "enabled", void 0);
class ShareDeviceDto {
}
exports.ShareDeviceDto = ShareDeviceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShareDeviceDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShareDeviceDto.prototype, "shareeIdOrEmail", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(device_enum_1.SharePermission),
    __metadata("design:type", String)
], ShareDeviceDto.prototype, "permission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], ShareDeviceDto.prototype, "expiredAt", void 0);
class UpdateSharePermissionDto {
}
exports.UpdateSharePermissionDto = UpdateSharePermissionDto;
__decorate([
    (0, class_validator_1.IsEnum)(device_enum_1.SharePermission),
    __metadata("design:type", String)
], UpdateSharePermissionDto.prototype, "permission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateSharePermissionDto.prototype, "expiredAt", void 0);
//# sourceMappingURL=control.dto.js.map