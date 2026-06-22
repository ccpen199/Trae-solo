import type {
  GuardianRelation,
  GuardianRequest,
  SafetySession,
  HeartbeatLog,
  WhistleAlert,
  WhistleEventType,
  AIComfortLog
} from '../types';
import { db } from '../data/database';

export class SafetyService {
  static requestGuardian(
    fromUserId: string,
    toUserId: string,
    relationName: string,
    permissionLevel: GuardianRelation['permissionLevel'],
    mutual: boolean,
    message: string
  ): GuardianRequest | null {
    if (fromUserId === toUserId) return null;
    const from = db.users.get(fromUserId);
    const to = db.users.get(toUserId);
    if (!from || !to) return null;

    const existing = Array.from(db.guardianRelations.values()).find(
      r =>
        (r.guarderId === fromUserId && r.guardianId === toUserId) ||
        (r.guarderId === toUserId && r.guardianId === fromUserId)
    );
    if (existing && existing.status === 'active') return null;

    const pendingReq = Array.from(db.guardianRequests.values()).find(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
    if (pendingReq) return pendingReq;

    const req: GuardianRequest = {
      id: db.generateId(),
      fromUserId,
      toUserId,
      relationName,
      permissionLevel,
      mutual,
      message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000)
    };
    db.guardianRequests.set(req.id, req);
    return req;
  }

  static respondToGuardianRequest(requestId: string, userId: string, accept: boolean): boolean {
    const req = db.guardianRequests.get(requestId);
    if (!req || req.toUserId !== userId || req.status !== 'pending') return false;
    req.status = accept ? 'accepted' : 'rejected';

    if (accept) {
      const now = new Date();
      const rel: GuardianRelation = {
        id: db.generateId(),
        guarderId: req.fromUserId,
        guardianId: req.toUserId,
        relationName: req.relationName,
        status: 'active',
        mutual: req.mutual,
        permissionLevel: req.permissionLevel,
        createdAt: now,
        activatedAt: now
      };
      db.guardianRelations.set(rel.id, rel);

      if (req.mutual) {
        const reverseRel: GuardianRelation = {
          id: db.generateId(),
          guarderId: req.toUserId,
          guardianId: req.fromUserId,
          relationName: req.relationName,
          status: 'active',
          mutual: true,
          permissionLevel: req.permissionLevel,
          createdAt: now,
          activatedAt: now
        };
        db.guardianRelations.set(reverseRel.id, reverseRel);
      }
    }
    return true;
  }

  static getUserGuardians(userId: string): GuardianRelation[] {
    return Array.from(db.guardianRelations.values()).filter(
      r => (r.guarderId === userId || r.guardianId === userId) && r.status === 'active'
    );
  }

  static getUserGuardianRequests(userId: string): GuardianRequest[] {
    return Array.from(db.guardianRequests.values()).filter(
      r => (r.fromUserId === userId || r.toUserId === userId) && r.status === 'pending'
    );
  }

  static startSafetySession(
    userId: string,
    guardianIds: string[],
    activityId?: string,
    checkInMinutes: number = 30
  ): SafetySession | null {
    const user = db.users.get(userId);
    if (!user) return null;
    const validGuardians = guardianIds.filter(gid => {
      const rel = Array.from(db.guardianRelations.values()).find(
        r =>
          ((r.guarderId === userId && r.guardianId === gid) ||
            (r.guardianId === userId && r.guarderId === gid)) &&
          r.status === 'active'
      );
      return !!rel;
    });
    if (validGuardians.length === 0) return null;

    const now = new Date();
    const session: SafetySession = {
      id: db.generateId(),
      userId,
      activityId,
      guardianIds: validGuardians,
      startTime: now,
      endTime: new Date(now.getTime() + 12 * 3600 * 1000),
      checkInInterval: Math.max(5, checkInMinutes),
      status: 'active',
      heartbeatLogs: [],
      alerts: [],
      aiComfortLogs: []
    };
    db.safetySessions.set(session.id, session);
    return session;
  }

  static submitHeartbeat(
    sessionId: string,
    userId: string,
    latitude?: number,
    longitude?: number,
    batteryLevel: number = 100,
    signalStrength: number = 100,
    isManual: boolean = false
  ): { success: boolean; nextDue: Date; missedCount: number } {
    const session = db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) return { success: false, nextDue: new Date(), missedCount: 0 };
    if (session.status !== 'active' && session.status !== 'alarm') return { success: false, nextDue: new Date(), missedCount: 0 };

    const now = new Date();
    const log: HeartbeatLog = {
      id: db.generateId(),
      sessionId,
      timestamp: now,
      location: latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined,
      batteryLevel,
      signalStrength,
      isManual
    };
    session.heartbeatLogs.push(log);

    if (session.status === 'alarm' && isManual) {
      session.status = 'active';
      const lastAlert = [...session.alerts].reverse().find(a => !a.resolved);
      if (lastAlert) {
        lastAlert.resolved = true;
        lastAlert.resolvedAt = now;
        lastAlert.resolutionNote = '用户手动签到确认安全';
      }
    }

    const lastHeartbeats = session.heartbeatLogs.slice(-10);
    const intervalMs = session.checkInInterval * 60 * 1000;
    let missedCount = 0;
    for (let i = 1; i < lastHeartbeats.length; i++) {
      const gap = lastHeartbeats[i].timestamp.getTime() - lastHeartbeats[i - 1].timestamp.getTime();
      if (gap > intervalMs * 2) missedCount++;
    }

    if (missedCount >= 3 && session.status === 'active') {
      this.triggerAlert(session, 'heartbeat_missed', 'high', {
        missedHeartbeats: missedCount,
        lastHeartbeatTime: log.timestamp
      });
    }

    return {
      success: true,
      nextDue: new Date(now.getTime() + intervalMs),
      missedCount
    };
  }

  private static triggerAlert(
    session: SafetySession,
    eventType: WhistleEventType,
    severity: WhistleAlert['severity'],
    details: Record<string, unknown>
  ): WhistleAlert {
    const now = new Date();
    const alert: WhistleAlert = {
      id: db.generateId(),
      sessionId: session.id,
      eventType,
      severity,
      triggeredAt: now,
      acknowledged: false,
      resolved: false,
      emergencyContactNotified: false,
      aiVoiceInitiated: false,
      details
    };

    session.alerts.push(alert);

    if (severity === 'high' || severity === 'critical') {
      session.status = 'alarm';
      this.initiateAIComfort(session, alert);
      if (severity === 'critical') {
        this.notifyEmergencyContact(session, alert);
      }
    }

    db.safetySessions.set(session.id, session);
    return alert;
  }

  private static initiateAIComfort(session: SafetySession, alert: WhistleAlert): AIComfortLog {
    const now = new Date();
    const scripts = [
      { ai: '您好，这里是平安哨AI守护系统，检测到您的平安哨有异常提醒，请问您现在安全吗？', user: '嗯…我没事，就是有点晚了。' },
      { ai: '我们检测到您可能存在安全风险，需要我帮您联系紧急联系人或报警吗？', user: '不用，我马上就回家了。' }
    ];
    const script = scripts[Math.floor(Math.random() * scripts.length)];

    const comfortLog: AIComfortLog = {
      id: db.generateId(),
      sessionId: session.id,
      alertId: alert.id,
      triggeredAt: now,
      conversationSummary: 'AI主动呼叫确认用户安全，用户表示无异常。',
      userMood: Math.random() > 0.7 ? 'anxious' : 'calm',
      escalationRecommended: false,
      callDuration: 45 + Math.floor(Math.random() * 90),
      transcript: [
        { speaker: 'ai', content: script.ai, timestamp: now },
        { speaker: 'user', content: script.user, timestamp: new Date(now.getTime() + 5000) },
        { speaker: 'ai', content: '好的，请注意安全，如有任何问题请随时使用平安哨一键求助功能。祝您平安！', timestamp: new Date(now.getTime() + 10000) }
      ]
    };
    alert.aiVoiceInitiated = true;
    session.aiComfortLogs.push(comfortLog);
    return comfortLog;
  }

  private static notifyEmergencyContact(session: SafetySession, alert: WhistleAlert): void {
    const user = db.users.get(session.userId);
    if (!user?.emergencyContact) return;
    alert.emergencyContactNotified = true;
    alert.details = {
      ...alert.details,
      emergencyContact: user.emergencyContact,
      notificationTime: new Date()
    };
  }

  static manualTriggerWhistle(
    sessionId: string,
    userId: string,
    severity: 'medium' | 'high' | 'critical' = 'high',
    location?: { latitude: number; longitude: number }
  ): WhistleAlert | null {
    const session = db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) return null;
    const alert = this.triggerAlert(session, 'manual_alert', severity, {
      manualTrigger: true,
      triggerTime: new Date(),
      location
    });
    return alert;
  }

  static endSession(sessionId: string, userId: string): boolean {
    const session = db.safetySessions.get(sessionId);
    if (!session || session.userId !== userId) return false;
    if (session.status === 'emergency') return false;
    session.status = 'completed';
    session.endTime = new Date();
    return true;
  }

  static getUserSessions(userId: string, status?: SafetySession['status']): SafetySession[] {
    let sessions = Array.from(db.safetySessions.values()).filter(s => s.userId === userId);
    if (status) sessions = sessions.filter(s => s.status === status);
    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  static acknowledgeAlert(alertId: string, guardianId: string): boolean {
    for (const session of db.safetySessions.values()) {
      const alert = session.alerts.find(a => a.id === alertId);
      if (alert) {
        if (!session.guardianIds.includes(guardianId) && session.userId !== guardianId) return false;
        alert.acknowledged = true;
        alert.acknowledgedBy = guardianId;
        alert.acknowledgedAt = new Date();
        return true;
      }
    }
    return false;
  }

  static resolveAlert(alertId: string, userId: string, note: string): boolean {
    for (const session of db.safetySessions.values()) {
      const alert = session.alerts.find(a => a.id === alertId);
      if (alert) {
        if (session.userId !== userId && !session.guardianIds.includes(userId)) return false;
        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.resolutionNote = note;
        if (session.status === 'alarm') {
          const allResolved = session.alerts.every(a => a.resolved || a.severity === 'low');
          if (allResolved) session.status = 'active';
        }
        return true;
      }
    }
    return false;
  }
}
