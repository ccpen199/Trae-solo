import type {
  RiskEvent,
  RiskEventDetails,
  RiskEventType,
  SensitiveWordHit,
  HighFrequencyMonitor,
  User
} from '../types';
import { db } from '../data/database';

const SENSITIVE_WORDS: Record<string, SensitiveWordHit['category']> = {
  '赌博': 'scam', '博彩': 'scam', '传销': 'scam', '诈骗': 'scam',
  '贷款': 'scam', '网贷': 'scam', '兼职刷单': 'scam', '代刷': 'scam',
  '约炮': 'harassment', '一夜情': 'harassment', '色情': 'pornography',
  '裸聊': 'pornography', '卖淫': 'pornography',
  '暴力': 'violence', '打架': 'violence', '恐吓': 'violence', '威胁': 'violence',
  '傻逼': 'profanity', '操你': 'profanity', '草泥马': 'profanity', '废物': 'profanity',
  '骗子': 'profanity', '滚蛋': 'profanity'
};

const SCAM_PATTERNS = [
  /加微信/i, /加我微信/i, /vx:/i, /联系方式/i, /电话号码.*1\d{10}/i,
  /投资/i, /赚钱.*快/i, /稳赚不赔/i, /返利/i, /返现/i
];

export class RiskControlEngine {
  private static readonly HIGH_FREQ_WINDOW_MINUTES = 10;
  private static readonly MATCH_THRESHOLD = 15;
  private static readonly MESSAGE_THRESHOLD = 50;
  private static readonly ROOM_JOIN_THRESHOLD = 10;
  private static readonly CREDIT_DEDUCTION_MAP: Partial<Record<RiskEventType, number>> = {
    sensitive_word_detected: 5,
    high_frequency_match: 10,
    report_submitted: 20,
    scam_keyword_detected: 30,
    harassment_report: 15
  };

  static detectSensitiveWords(text: string): SensitiveWordHit[] {
    const hits: SensitiveWordHit[] = [];
    for (const [word, category] of Object.entries(SENSITIVE_WORDS)) {
      let pos = text.indexOf(word);
      while (pos !== -1) {
        hits.push({
          word,
          category,
          position: { start: pos, end: pos + word.length }
        });
        pos = text.indexOf(word, pos + 1);
      }
    }
    for (const pattern of SCAM_PATTERNS) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        hits.push({
          word: match[0],
          category: 'scam',
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    }
    return hits;
  }

  static censorSensitiveContent(text: string): { censored: string; hitCount: number } {
    const hits = this.detectSensitiveWords(text);
    if (hits.length === 0) return { censored: text, hitCount: 0 };
    let censored = text;
    const sorted = hits.sort((a, b) => b.position.start - a.position.start);
    for (const hit of sorted) {
      const replacement = '*'.repeat(Math.max(1, hit.position.end - hit.position.start));
      censored = censored.substring(0, hit.position.start) + replacement + censored.substring(hit.position.end);
    }
    return { censored, hitCount: hits.length };
  }

  static recordAndCheckHighFrequency(
    userId: string,
    action: 'match' | 'message' | 'room_join'
  ): { allowed: boolean; monitor: HighFrequencyMonitor; exceeded: boolean } {
    const now = new Date();
    let monitor = db.highFrequencyMonitors.get(userId);
    const windowStart = new Date(now.getTime() - this.HIGH_FREQ_WINDOW_MINUTES * 60000);

    if (!monitor || monitor.windowStart < windowStart) {
      monitor = {
        userId,
        windowStart: now,
        matchCount: 0,
        messageCount: 0,
        roomJoinCount: 0
      };
    }

    if (action === 'match') monitor.matchCount++;
    if (action === 'message') monitor.messageCount++;
    if (action === 'room_join') monitor.roomJoinCount++;

    db.highFrequencyMonitors.set(userId, monitor);

    const exceeded =
      monitor.matchCount > this.MATCH_THRESHOLD ||
      monitor.messageCount > this.MESSAGE_THRESHOLD ||
      monitor.roomJoinCount > this.ROOM_JOIN_THRESHOLD;

    if (exceeded) {
      this.createRiskEvent(userId, 'high_frequency_match', 'high', {
        matchCount: monitor.matchCount,
        messageCount: monitor.messageCount,
        roomJoinCount: monitor.roomJoinCount,
        timeWindowMinutes: this.HIGH_FREQ_WINDOW_MINUTES
      });
    }

    return {
      allowed: !exceeded,
      monitor,
      exceeded
    };
  }

  static createRiskEvent(
    userId: string,
    eventType: RiskEventType,
    severity: RiskEvent['severity'],
    details: RiskEventDetails
  ): RiskEvent {
    const event: RiskEvent = {
      id: db.generateId(),
      userId,
      eventType,
      severity,
      details,
      detectedAt: new Date(),
      status: 'pending',
      actions: []
    };

    const deduction = this.CREDIT_DEDUCTION_MAP[eventType];
    if (deduction) {
      this.applyCreditDeduction(userId, deduction, eventType, event.id);
      event.actions.push({
        type: 'credit_deduction',
        executedAt: new Date(),
        executedBy: 'system',
        note: `自动扣减信用分 ${deduction} 分`,
        metadata: { deductedPoints: deduction }
      });
    }

    if (severity === 'high' || severity === 'critical') {
      event.actions.push({
        type: 'temporary_match_block',
        executedAt: new Date(),
        executedBy: 'system',
        note: '触发高频匹配风控，暂时禁止匹配24小时'
      });
    }
    if (severity === 'critical') {
      event.actions.push({
        type: 'manual_review_required',
        executedAt: new Date(),
        executedBy: 'system',
        note: '严重违规，已提交人工审核'
      });
    }

    db.riskEvents.set(event.id, event);
    return event;
  }

  static applyCreditDeduction(
    userId: string,
    points: number,
    reasonType: string,
    relatedId: string
  ): void {
    const user = db.users.get(userId);
    if (!user) return;
    const newScore = Math.max(300, user.creditScore - points);
    user.creditRecords.push({
      id: db.generateId(),
      type: reasonType as User['creditRecords'][number]['type'],
      scoreChange: -points,
      reason: `风控处罚：${reasonType}`,
      relatedId,
      createdAt: new Date()
    });
    user.creditScore = newScore;
  }

  static addCreditScore(
    userId: string,
    points: number,
    type: User['creditRecords'][number]['type'],
    reason: string,
    relatedId?: string
  ): void {
    const user = db.users.get(userId);
    if (!user) return;
    const newScore = Math.min(900, user.creditScore + points);
    user.creditRecords.push({
      id: db.generateId(),
      type,
      scoreChange: points,
      reason,
      relatedId,
      createdAt: new Date()
    });
    user.creditScore = newScore;
  }

  static evaluateContent(userId: string, content: string, contextType: 'message' | 'activity' | 'bubble'): {
    allowed: boolean;
    censoredContent: string;
    hits: SensitiveWordHit[];
    riskLevel: RiskEvent['severity'];
  } {
    const hits = this.detectSensitiveWords(content);
    const { censored } = this.censorSensitiveContent(content);

    if (hits.length === 0) {
      return {
        allowed: true,
        censoredContent: content,
        hits: [],
        riskLevel: 'low'
      };
    }

    const hasScam = hits.some(h => h.category === 'scam');
    const hasPorn = hits.some(h => h.category === 'pornography' || h.category === 'violence');
    const hasHarass = hits.some(h => h.category === 'harassment');

    let severity: RiskEvent['severity'] = 'low';
    let allowed = true;

    if (hasScam) {
      severity = 'high';
      allowed = false;
    } else if (hasPorn) {
      severity = 'critical';
      allowed = false;
    } else if (hasHarass || hits.length >= 3) {
      severity = 'medium';
    }

    if (severity !== 'low') {
      this.createRiskEvent(userId, 'sensitive_word_detected', severity, {
        messageContent: censored,
        keywordsFound: hits.map(h => h.word)
      });
    }

    if (contextType === 'activity' && !allowed) {
      this.createRiskEvent(userId, 'scam_keyword_detected', 'critical', {
        messageContent: censored,
        keywordsFound: hits.map(h => h.word)
      });
    }

    return {
      allowed,
      censoredContent: censored,
      hits,
      riskLevel: severity
    };
  }

  static getUserRiskLevel(userId: string): RiskEvent['severity'] {
    const user = db.users.get(userId);
    if (!user) return 'low';
    const recentEvents = Array.from(db.riskEvents.values()).filter(
      e => e.userId === userId &&
           new Date(e.detectedAt).getTime() > Date.now() - 30 * 86400000
    );
    const critical = recentEvents.some(e => e.severity === 'critical' && e.status !== 'resolved');
    const high = recentEvents.some(e => e.severity === 'high' && e.status !== 'resolved');
    const medium = recentEvents.some(e => e.severity === 'medium' && e.status !== 'resolved');
    if (critical || user.creditScore < 500) return 'critical';
    if (high || user.creditScore < 600) return 'high';
    if (medium || user.creditScore < 650) return 'medium';
    return 'low';
  }
}
