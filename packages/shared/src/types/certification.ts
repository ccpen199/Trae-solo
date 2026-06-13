// 生存认证模块类型定义
export type LivenessAction = 'BLINK' | 'NOD' | 'OPEN_MOUTH' | 'TURN_LEFT' | 'TURN_RIGHT';

export const LivenessActionMap: Record<LivenessAction, string> = {
  BLINK: '眨眨眼',
  NOD: '点点头',
  OPEN_MOUTH: '张张嘴',
  TURN_LEFT: '向左转头',
  TURN_RIGHT: '向右转头'
};

export const LivenessActionIconMap: Record<LivenessAction, string> = {
  BLINK: 'eye',
  NOD: 'move-down',
  OPEN_MOUTH: 'mic',
  TURN_LEFT: 'arrow-left',
  TURN_RIGHT: 'arrow-right'
};

export type CertificationStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'LOCKED';

export interface CertificationStartResponse {
  sessionId: string;
  actionSequence: LivenessAction[];
  expiresAt: number;
}

export interface LivenessSubmitRequest {
  sessionId: string;
  actionIndex: number;
  actionResult: boolean;
  encryptedFeatureHash: string;
  deviceFingerprint: string;
}

export interface FaceMatchRequest {
  sessionId: string;
  encryptedFeatureHash: string;
}

export interface CertificationResultResponse {
  sessionId: string;
  status: CertificationStatus;
  steps: {
    livenessPassed: boolean;
    faceMatched: boolean;
    coreSynced: boolean;
  };
  matchScore?: number;
  failReason?: string;
  lockExpiresAt?: number;
  failCount?: number;
}

export interface CertificationHistoryItem {
  id: string;
  date: string;
  status: 'SUCCESS' | 'FAILED';
  channel: 'ONLINE' | 'OFFLINE';
  failReason?: string;
}
