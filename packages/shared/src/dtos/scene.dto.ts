import { IsString, IsArray, ValidateNested, IsEnum, IsOptional, IsNotEmpty, IsObject, IsNumber, IsBoolean } from 'class-validator';
import { SceneTriggerType, SceneConditionOperator, SceneActionType, SceneStatus } from '../enums/scene.enum';

export class CreateSceneTriggerDto {
  @IsEnum(SceneTriggerType)
  type: SceneTriggerType;

  @IsObject()
  config: any;
}

export class CreateSceneConditionDto {
  @IsString()
  field: string;

  @IsEnum(SceneConditionOperator)
  operator: SceneConditionOperator;

  value: any;

  @IsOptional()
  value2?: any;
}

export class CreateSceneActionDto {
  @IsEnum(SceneActionType)
  type: SceneActionType;

  @IsNumber()
  order: number;

  @IsNumber()
  @IsOptional()
  delayMs?: number;

  @IsObject()
  config: any;
}

export class CreateSceneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  homeId: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  triggers: CreateSceneTriggerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  conditions?: CreateSceneConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  actions: CreateSceneActionDto[];

  @IsEnum(SceneStatus)
  @IsOptional()
  status?: SceneStatus;
}

export class UpdateSceneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SceneStatus)
  @IsOptional()
  status?: SceneStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  triggers?: CreateSceneTriggerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  conditions?: CreateSceneConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  actions?: CreateSceneActionDto[];
}

export class VoiceCommandDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  asrSource?: 'tmgc' | 'xiaoai' | 'alexa' | 'google' | 'siri';

  @IsString()
  homeId: string;
}
