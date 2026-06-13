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
exports.VoiceCommandDto = exports.UpdateSceneDto = exports.CreateSceneDto = exports.CreateSceneActionDto = exports.CreateSceneConditionDto = exports.CreateSceneTriggerDto = void 0;
const class_validator_1 = require("class-validator");
const scene_enum_1 = require("../enums/scene.enum");
class CreateSceneTriggerDto {
}
exports.CreateSceneTriggerDto = CreateSceneTriggerDto;
__decorate([
    (0, class_validator_1.IsEnum)(scene_enum_1.SceneTriggerType),
    __metadata("design:type", String)
], CreateSceneTriggerDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSceneTriggerDto.prototype, "config", void 0);
class CreateSceneConditionDto {
}
exports.CreateSceneConditionDto = CreateSceneConditionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSceneConditionDto.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(scene_enum_1.SceneConditionOperator),
    __metadata("design:type", String)
], CreateSceneConditionDto.prototype, "operator", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSceneConditionDto.prototype, "value2", void 0);
class CreateSceneActionDto {
}
exports.CreateSceneActionDto = CreateSceneActionDto;
__decorate([
    (0, class_validator_1.IsEnum)(scene_enum_1.SceneActionType),
    __metadata("design:type", String)
], CreateSceneActionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSceneActionDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSceneActionDto.prototype, "delayMs", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSceneActionDto.prototype, "config", void 0);
class CreateSceneDto {
}
exports.CreateSceneDto = CreateSceneDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSceneDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSceneDto.prototype, "coverImage", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    __metadata("design:type", Array)
], CreateSceneDto.prototype, "triggers", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateSceneDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    __metadata("design:type", Array)
], CreateSceneDto.prototype, "actions", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(scene_enum_1.SceneStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSceneDto.prototype, "status", void 0);
class UpdateSceneDto {
}
exports.UpdateSceneDto = UpdateSceneDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(scene_enum_1.SceneStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneDto.prototype, "triggers", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneDto.prototype, "actions", void 0);
class VoiceCommandDto {
}
exports.VoiceCommandDto = VoiceCommandDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VoiceCommandDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VoiceCommandDto.prototype, "asrSource", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VoiceCommandDto.prototype, "homeId", void 0);
//# sourceMappingURL=scene.dto.js.map