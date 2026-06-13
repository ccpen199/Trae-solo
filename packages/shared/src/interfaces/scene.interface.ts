import {
  SceneTriggerType,
  SceneConditionOperator,
  SceneActionType,
  SceneStatus,
} from '../enums/scene.enum';

export interface ISceneCondition {
  id: string;
  field: string;
  operator: SceneConditionOperator;
  value: any;
  value2?: any;
}

export interface ISceneTrigger {
  id: string;
  type: SceneTriggerType;
  config: {
    deviceId?: string;
    sensorType?: string;
    time?: string;
    cron?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    condition?: string;
  };
}

export interface ISceneAction {
  id: string;
  type: SceneActionType;
  order: number;
  delayMs?: number;
  config: {
    deviceId?: string;
    commands?: Record<string, any>;
    sceneId?: string;
    title?: string;
    content?: string;
    channels?: string[];
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
}

export interface IScene {
  id: string;
  name: string;
  description?: string;
  homeId: string;
  coverImage?: string;
  triggers: ISceneTrigger[];
  conditions: ISceneCondition[];
  actions: ISceneAction[];
  status: SceneStatus;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
}

export interface ISceneExecutionLog {
  id: string;
  sceneId: string;
  triggerType: SceneTriggerType;
  success: boolean;
  actions: {
    actionId: string;
    success: boolean;
    error?: string;
    executedAt: Date;
  }[];
  executedAt: Date;
}
