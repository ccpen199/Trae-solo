import type {
  LivenessAction,
  CertificationStatus,
  CertificationStartResponse,
  CertificationResultResponse,
  CertificationHistoryItem,
} from '@gx-rs/shared';
import dayjs from 'dayjs';
import { generateUUID } from '@gx-rs/shared';

const actionPool: LivenessAction[] = ['BLINK', 'NOD', 'OPEN_MOUTH', 'TURN_LEFT', 'TURN_RIGHT'];

interface CertificationSession {
  sessionId: string;
  userId: string;
  actionSequence: LivenessAction[];
  expiresAt: number;
  livenessResults: boolean[];
  livenessFeatureHashes: string[];
  faceMatchHash?: string;
  status: CertificationStatus;
  createdAt: number;
}

const sessions = new Map<string, CertificationSession>();

export function createSession(userId: string): CertificationStartResponse {
  const sessionId = generateUUID();
  const sequence: LivenessAction[] = [];
  const usedIndices = new Set<number>();

  while (sequence.length < 3) {
    const idx = Math.floor(Math.random() * actionPool.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      sequence.push(actionPool[idx]);
    }
  }

  const session: CertificationSession = {
    sessionId,
    userId,
    actionSequence: sequence,
    expiresAt: Date.now() + 10 * 60 * 1000,
    livenessResults: [],
    livenessFeatureHashes: [],
    status: 'IN_PROGRESS',
    createdAt: Date.now(),
  };

  sessions.set(sessionId, session);

  return {
    sessionId,
    actionSequence: sequence,
    expiresAt: session.expiresAt,
  };
}

export function submitLiveness(
  sessionId: string,
  actionIndex: number,
  actionResult: boolean,
  encryptedFeatureHash: string,
): { success: boolean; allDone: boolean } {
  const session = sessions.get(sessionId);
  if (!session) return { success: false, allDone: false };
  if (session.status !== 'IN_PROGRESS') return { success: false, allDone: false };
  if (Date.now() > session.expiresAt) {
    session.status = 'FAILED';
    return { success: false, allDone: false };
  }

  session.livenessResults.push(actionResult);
  session.livenessFeatureHashes.push(encryptedFeatureHash);

  const allDone = session.livenessResults.length >= session.actionSequence.length;
  return { success: true, allDone };
}

export function submitFaceMatch(
  sessionId: string,
  encryptedFeatureHash: string,
): { success: boolean; matchScore: number } {
  const session = sessions.get(sessionId);
  if (!session) return { success: false, matchScore: 0 };
  if (session.status !== 'IN_PROGRESS') return { success: false, matchScore: 0 };
  if (session.livenessResults.length < session.actionSequence.length) {
    return { success: false, matchScore: 0 };
  }

  session.faceMatchHash = encryptedFeatureHash;

  const allLivenessPassed = session.livenessResults.every((r) => r);
  if (!allLivenessPassed) {
    session.status = 'FAILED';
    return { success: true, matchScore: 0 };
  }

  const matchScore = Math.round((85 + Math.random() * 15) * 10) / 10;
  session.status = matchScore >= 80 ? 'SUCCESS' : 'FAILED';

  return { success: true, matchScore };
}

export function getSessionResult(sessionId: string): CertificationResultResponse | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const livenessPassed = session.livenessResults.length >= session.actionSequence.length
    && session.livenessResults.every((r) => r);
  const faceMatched = !!session.faceMatchHash && session.status === 'SUCCESS';

  const result: CertificationResultResponse = {
    sessionId: session.sessionId,
    status: session.status,
    steps: {
      livenessPassed,
      faceMatched,
      coreSynced: session.status === 'SUCCESS',
    },
  };

  if (faceMatched) {
    result.matchScore = Math.round((85 + Math.random() * 15) * 10) / 10;
  }

  if (session.status === 'FAILED') {
    result.failReason = !livenessPassed ? '活体检测未通过' : '人脸比对未通过';
  }

  if (session.status === 'LOCKED') {
    result.lockExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  }

  return result;
}

export function getCertificationHistory(userId: string): CertificationHistoryItem[] {
  const history: CertificationHistoryItem[] = [];

  const channels: ('ONLINE' | 'OFFLINE')[] = ['ONLINE', 'OFFLINE'];

  for (let i = 0; i < 8; i++) {
    const date = dayjs().subtract(i * 90 + Math.floor(Math.random() * 30), 'day');
    const isSuccess = Math.random() > 0.2;
    const channel = channels[Math.floor(Math.random() * channels.length)];

    history.push({
      id: generateUUID(),
      date: date.format('YYYY-MM-DD'),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      channel,
      failReason: isSuccess ? undefined : '人脸比对相似度不足',
    });
  }

  return history;
}
