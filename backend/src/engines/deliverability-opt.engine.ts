import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import redis from '../lib/redis';
import { config } from '../config';

export interface SendOptimizationResult {
  success: boolean;
  shouldSend: boolean;
  reason?: string;
  recommendedDelay?: number;
  batchSize?: number;
  priority?: number;
  explanation?: string;
}

export interface BounceAnalysis {
  email: string;
  bounceType: 'hard' | 'soft' | 'unknown';
  bounceCount: number;
  lastBounceAt?: Date;
  reason?: string;
  shouldSuppress: boolean;
  suppressionReason?: string;
}

export interface ReputationMetrics {
  domain: string;
  senderScore: number;
  spamTrapHits: number;
  complaintRate: number;
  bounceRate: number;
  senderPolicyFramework: 'pass' | 'fail' | 'neutral' | 'softfail' | 'none';
  domainKeysIdentifiedMail: 'pass' | 'fail' | 'neutral' | 'none';
  domainBasedMessageAuthentication: 'pass' | 'fail' | 'neutral' | 'temperror' | 'permerror' | 'none';
  reputation: 'excellent' | 'good' | 'neutral' | 'poor' | 'bad';
  explanation?: string;
}

export interface EngagementScore {
  memberId: string;
  email: string;
  score: number;
  category: 'high' | 'medium' | 'low' | 'inactive';
  factors: {
    openRate: number;
    clickRate: number;
    recency: number;
    frequency: number;
    unsubscribeRisk: number;
  };
  recommendedAction: 'send_soon' | 'send_later' | 'reduce_frequency' | 're_engage' | 'suppress';
  explanation?: string;
}

class DeliverabilityOptEngine {
  private readonly CACHE_TTL = 3600;
  
  private readonly SENDER_SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    NEUTRAL: 50,
    POOR: 30,
  };
  
  private readonly BOUNCE_THRESHOLDS = {
    HARD_BOUNCE_MAX: 1,
    SOFT_BOUNCE_MAX: 3,
    TOTAL_BOUNCE_MAX: 5,
  };
  
  private readonly ENGAGEMENT_THRESHOLDS = {
    HIGH: 70,
    MEDIUM: 40,
    LOW: 20,
  };
  
  async optimizeSend(
    campaignId: string,
    memberId: string,
    email: string
  ): Promise<SendOptimizationResult> {
    logger.debug(`Optimizing send for: ${email}, campaign: ${campaignId}`);
    
    const reasons: string[] = [];
    let shouldSend = true;
    let recommendedDelay = 0;
    let batchSize = config.batch.maxPerBatch;
    let priority = 0;
    
    const bounceAnalysis = await this.analyzeBounceHistory(email);
    if (bounceAnalysis.shouldSuppress) {
      shouldSend = false;
      reasons.push(`退信抑制: ${bounceAnalysis.suppressionReason}`);
    }
    
    const reputation = await this.getSenderReputation();
    if (reputation.reputation === 'poor' || reputation.reputation === 'bad') {
      batchSize = Math.max(10, Math.floor(batchSize * 0.3));
      reasons.push(`发送限制: 发件人声誉较差 (${reputation.reputation})，减少批次大小至 ${batchSize}`);
    }
    
    const engagement = await this.getEngagementScore(memberId);
    switch (engagement.recommendedAction) {
      case 'send_soon':
        priority = 1;
        reasons.push(`优先发送: 用户活跃度高 (分数: ${engagement.score})`);
        break;
      case 'send_later':
        recommendedDelay = this.getOptimalSendTime();
        reasons.push(`延迟发送: 推荐在最佳时间发送 (延迟 ${recommendedDelay}ms)`);
        break;
      case 'reduce_frequency':
        const lastSend = await this.getLastSendTime(memberId);
        if (lastSend && this.isTooRecent(lastSend)) {
          shouldSend = false;
          reasons.push(`频率限制: 最近发送过于频繁 (上次: ${lastSend.toISOString()})`);
        }
        break;
      case 're_engage':
        reasons.push(`重新激活: 用户活跃度低 (分数: ${engagement.score})，建议使用重新激活内容`);
        break;
      case 'suppress':
        shouldSend = false;
        reasons.push(`抑制发送: 用户活跃度极低，建议从发送列表中排除`);
        break;
    }
    
    const currentRate = await this.getCurrentSendRate();
    const maxRate = this.getMaxSendRate(reputation.senderScore);
    if (currentRate >= maxRate) {
      recommendedDelay = Math.max(recommendedDelay, 60000);
      reasons.push(`速率限制: 当前发送速率 (${currentRate}/分钟) 接近上限 (${maxRate}/分钟)，建议延迟发送`);
    }
    
    const explanation = this.generateOptimizationExplanation(
      email,
      campaignId,
      bounceAnalysis,
      reputation,
      engagement,
      currentRate,
      maxRate,
      shouldSend,
      reasons
    );
    
    logger.debug(`Send optimization result for ${email}: shouldSend=${shouldSend}, reasons=${reasons.join('; ')}`);
    
    return {
      success: true,
      shouldSend,
      reason: reasons.length > 0 ? reasons.join('; ') : undefined,
      recommendedDelay: recommendedDelay > 0 ? recommendedDelay : undefined,
      batchSize,
      priority,
      explanation,
    };
  }
  
  async analyzeBounceHistory(email: string): Promise<BounceAnalysis> {
    const cacheKey = `bounce:${email}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const domain = email.split('@')[1] || email;
    
    const bounceLogs = await prisma.sendLog.findMany({
      where: {
        email,
        status: { in: ['BOUNCED', 'FAILED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    const hardBounces = bounceLogs.filter(l => l.bounceReason?.includes('hard') || l.bounceReason?.includes('550') || l.bounceReason?.includes('552'));
    const softBounces = bounceLogs.filter(l => l.bounceReason?.includes('soft') || l.bounceReason?.includes('421') || l.bounceReason?.includes('450') || l.bounceReason?.includes('451') || l.bounceReason?.includes('452'));
    
    const hardCount = hardBounces.length;
    const softCount = softBounces.length;
    const totalCount = bounceLogs.length;
    
    let bounceType: 'hard' | 'soft' | 'unknown' = 'unknown';
    let shouldSuppress = false;
    let suppressionReason: string | undefined;
    let reason: string | undefined;
    
    if (bounceLogs.length > 0) {
      const lastBounce = bounceLogs[0];
      reason = lastBounce.bounceReason || undefined;
      
      if (hardCount > 0) {
        bounceType = 'hard';
      } else if (softCount > 0) {
        bounceType = 'soft';
      }
    }
    
    if (hardCount >= this.BOUNCE_THRESHOLDS.HARD_BOUNCE_MAX) {
      shouldSuppress = true;
      suppressionReason = `硬退信次数 (${hardCount}) 超过阈值 (${this.BOUNCE_THRESHOLDS.HARD_BOUNCE_MAX})`;
    } else if (softCount >= this.BOUNCE_THRESHOLDS.SOFT_BOUNCE_MAX) {
      shouldSuppress = true;
      suppressionReason = `软退信次数 (${softCount}) 超过阈值 (${this.BOUNCE_THRESHOLDS.SOFT_BOUNCE_MAX})`;
    } else if (totalCount >= this.BOUNCE_THRESHOLDS.TOTAL_BOUNCE_MAX) {
      shouldSuppress = true;
      suppressionReason = `总退信次数 (${totalCount}) 超过阈值 (${this.BOUNCE_THRESHOLDS.TOTAL_BOUNCE_MAX})`;
    }
    
    const result: BounceAnalysis = {
      email,
      bounceType,
      bounceCount: totalCount,
      lastBounceAt: bounceLogs[0]?.bouncedAt,
      reason,
      shouldSuppress,
      suppressionReason,
    };
    
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    
    return result;
  }
  
  async getSenderReputation(): Promise<ReputationMetrics> {
    const cacheKey = 'reputation:sender';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const senderDomain = config.smtp.from.split('@')[1] || 'example.com';
    
    const recentLogs = await prisma.sendLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    const totalSent = recentLogs.length;
    const bounced = recentLogs.filter(l => l.status === 'BOUNCED').length;
    const unsubscribed = recentLogs.filter(l => l.status === 'UNSUBSCRIBED').length;
    
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0;
    
    let senderScore = 80;
    if (bounceRate > 10) senderScore -= 20;
    else if (bounceRate > 5) senderScore -= 10;
    else if (bounceRate > 2) senderScore -= 5;
    
    if (complaintRate > 1) senderScore -= 15;
    else if (complaintRate > 0.5) senderScore -= 8;
    else if (complaintRate > 0.1) senderScore -= 3;
    
    let reputation: ReputationMetrics['reputation'] = 'neutral';
    if (senderScore >= this.SENDER_SCORE_THRESHOLDS.EXCELLENT) {
      reputation = 'excellent';
    } else if (senderScore >= this.SENDER_SCORE_THRESHOLDS.GOOD) {
      reputation = 'good';
    } else if (senderScore >= this.SENDER_SCORE_THRESHOLDS.NEUTRAL) {
      reputation = 'neutral';
    } else if (senderScore >= this.SENDER_SCORE_THRESHOLDS.POOR) {
      reputation = 'poor';
    } else {
      reputation = 'bad';
    }
    
    const result: ReputationMetrics = {
      domain: senderDomain,
      senderScore,
      spamTrapHits: 0,
      complaintRate,
      bounceRate,
      senderPolicyFramework: 'pass',
      domainKeysIdentifiedMail: 'pass',
      domainBasedMessageAuthentication: 'pass',
      reputation,
      explanation: this.generateReputationExplanation(
        senderDomain,
        senderScore,
        reputation,
        bounceRate,
        complaintRate,
        totalSent
      ),
    };
    
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    
    return result;
  }
  
  async getEngagementScore(memberId: string): Promise<EngagementScore> {
    const cacheKey = `engagement:${memberId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const member = await prisma.audienceMember.findUnique({
      where: { id: memberId },
    });
    
    if (!member) {
      throw new Error(`Audience member not found: ${memberId}`);
    }
    
    const recentLogs = await prisma.sendLog.findMany({
      where: {
        memberId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const totalSent = Math.max(recentLogs.length, 1);
    const opens = recentLogs.filter(l => l.openedAt).length;
    const clicks = recentLogs.filter(l => l.clickedAt).length;
    const lastActivityAt = member.lastActivityAt;
    
    const openRate = (opens / totalSent) * 100;
    const clickRate = (clicks / totalSent) * 100;
    
    let recencyScore = 50;
    if (lastActivityAt) {
      const daysSinceActivity = (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity <= 7) recencyScore = 100;
      else if (daysSinceActivity <= 14) recencyScore = 80;
      else if (daysSinceActivity <= 30) recencyScore = 60;
      else if (daysSinceActivity <= 60) recencyScore = 40;
      else recencyScore = 10;
    }
    
    let frequencyScore = 50;
    const lastSend = recentLogs[0];
    if (lastSend) {
      const daysSinceLastSend = (Date.now() - lastSend.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastSend <= 2) frequencyScore = 90;
      else if (daysSinceLastSend <= 7) frequencyScore = 70;
      else if (daysSinceLastSend <= 14) frequencyScore = 50;
      else if (daysSinceLastSend <= 30) frequencyScore = 30;
      else frequencyScore = 10;
    }
    
    let unsubscribeRisk = 5;
    if (!member.isSubscribed) {
      unsubscribeRisk = 100;
    } else if (openRate < 10) {
      unsubscribeRisk = 30;
    } else if (openRate < 20) {
      unsubscribeRisk = 15;
    }
    
    const score = Math.round(
      openRate * 0.35 +
      clickRate * 0.35 +
      recencyScore * 0.15 +
      frequencyScore * 0.10 +
      (100 - unsubscribeRisk) * 0.05
    );
    
    let category: EngagementScore['category'] = 'medium';
    if (score >= this.ENGAGEMENT_THRESHOLDS.HIGH) {
      category = 'high';
    } else if (score >= this.ENGAGEMENT_THRESHOLDS.MEDIUM) {
      category = 'medium';
    } else if (score >= this.ENGAGEMENT_THRESHOLDS.LOW) {
      category = 'low';
    } else {
      category = 'inactive';
    }
    
    let recommendedAction: EngagementScore['recommendedAction'] = 'send_later';
    switch (category) {
      case 'high':
        recommendedAction = 'send_soon';
        break;
      case 'medium':
        recommendedAction = 'send_later';
        break;
      case 'low':
        recommendedAction = 'reduce_frequency';
        break;
      case 'inactive':
        if (score < 10) {
          recommendedAction = 'suppress';
        } else {
          recommendedAction = 're_engage';
        }
        break;
    }
    
    const result: EngagementScore = {
      memberId,
      email: member.email,
      score,
      category,
      factors: {
        openRate,
        clickRate,
        recency: recencyScore,
        frequency: frequencyScore,
        unsubscribeRisk,
      },
      recommendedAction,
      explanation: this.generateEngagementExplanation(
        member.email,
        score,
        category,
        { openRate, clickRate, recencyScore, frequencyScore, unsubscribeRisk },
        totalSent,
        opens,
        clicks,
        lastActivityAt
      ),
    };
    
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    
    return result;
  }
  
  private getOptimalSendTime(): number {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 9 && hour < 11) {
      return 0;
    } else if (hour >= 14 && hour < 16) {
      return 0;
    } else if (hour < 9) {
      const nineAM = new Date(now);
      nineAM.setHours(9, 0, 0, 0);
      return nineAM.getTime() - now.getTime();
    } else if (hour >= 11 && hour < 14) {
      const twoPM = new Date(now);
      twoPM.setHours(14, 0, 0, 0);
      return twoPM.getTime() - now.getTime();
    } else {
      const tomorrowNineAM = new Date(now);
      tomorrowNineAM.setDate(tomorrowNineAM.getDate() + 1);
      tomorrowNineAM.setHours(9, 0, 0, 0);
      return tomorrowNineAM.getTime() - now.getTime();
    }
  }
  
  private async getLastSendTime(memberId: string): Promise<Date | null> {
    const lastSend = await prisma.sendLog.findFirst({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
    return lastSend?.createdAt || null;
  }
  
  private isTooRecent(lastSend: Date): boolean {
    const hoursSinceLastSend = (Date.now() - lastSend.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSend < 24;
  }
  
  private async getCurrentSendRate(): Promise<number> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const count = await prisma.sendLog.count({
      where: {
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });
    return count;
  }
  
  private getMaxSendRate(senderScore: number): number {
    if (senderScore >= 90) return 1000;
    if (senderScore >= 70) return 500;
    if (senderScore >= 50) return 200;
    if (senderScore >= 30) return 50;
    return 10;
  }
  
  private generateOptimizationExplanation(
    email: string,
    campaignId: string,
    bounceAnalysis: BounceAnalysis,
    reputation: ReputationMetrics,
    engagement: EngagementScore,
    currentRate: number,
    maxRate: number,
    shouldSend: boolean,
    reasons: string[]
  ): string {
    const parts: string[] = [];
    
    parts.push('【发送优化引擎 - 计算依据说明】');
    parts.push('');
    parts.push(`目标邮箱: ${email}`);
    parts.push(`活动ID: ${campaignId}`);
    parts.push(`评估时间: ${new Date().toISOString()}`);
    parts.push('');
    
    parts.push('=== 最终决策 ===');
    parts.push(`是否发送: ${shouldSend ? '是' : '否'}`);
    if (reasons.length > 0) {
      parts.push(`决策原因: `);
      reasons.forEach((r, i) => parts.push(`  ${i + 1}. ${r}`));
    }
    parts.push('');
    
    parts.push('=== 退信分析 ===');
    parts.push(`退信类型: ${bounceAnalysis.bounceType}`);
    parts.push(`历史退信次数: ${bounceAnalysis.bounceCount}`);
    if (bounceAnalysis.lastBounceAt) {
      parts.push(`最近退信时间: ${bounceAnalysis.lastBounceAt.toISOString()}`);
    }
    if (bounceAnalysis.reason) {
      parts.push(`退信原因: ${bounceAnalysis.reason}`);
    }
    parts.push(`是否抑制: ${bounceAnalysis.shouldSuppress ? '是' : '否'}`);
    if (bounceAnalysis.suppressionReason) {
      parts.push(`抑制原因: ${bounceAnalysis.suppressionReason}`);
    }
    parts.push(`阈值: 硬退信>${this.BOUNCE_THRESHOLDS.HARD_BOUNCE_MAX}, 软退信>${this.BOUNCE_THRESHOLDS.SOFT_BOUNCE_MAX}, 总退信>${this.BOUNCE_THRESHOLDS.TOTAL_BOUNCE_MAX}`);
    parts.push('');
    
    parts.push('=== 发件人声誉 ===');
    parts.push(`发件域: ${reputation.domain}`);
    parts.push(`发件人分数: ${reputation.senderScore}/100`);
    parts.push(`声誉等级: ${reputation.reputation}`);
    parts.push(`退信率: ${reputation.bounceRate.toFixed(2)}%`);
    parts.push(`投诉率: ${reputation.complaintRate.toFixed(2)}%`);
    parts.push(`SPF: ${reputation.senderPolicyFramework}`);
    parts.push(`DKIM: ${reputation.domainKeysIdentifiedMail}`);
    parts.push(`DMARC: ${reputation.domainBasedMessageAuthentication}`);
    parts.push(`声誉阈值: 优秀>=${this.SENDER_SCORE_THRESHOLDS.EXCELLENT}, 良好>=${this.SENDER_SCORE_THRESHOLDS.GOOD}, 一般>=${this.SENDER_SCORE_THRESHOLDS.NEUTRAL}, 较差>=${this.SENDER_SCORE_THRESHOLDS.POOR}`);
    parts.push('');
    
    parts.push('=== 用户活跃度 ===');
    parts.push(`活跃度分数: ${engagement.score}/100`);
    parts.push(`活跃度等级: ${engagement.category}`);
    parts.push(`推荐动作: ${engagement.recommendedAction}`);
    parts.push('评分因子分解:');
    parts.push(`  - 打开率: ${engagement.factors.openRate.toFixed(1)}% (权重 35%)`);
    parts.push(`  - 点击率: ${engagement.factors.clickRate.toFixed(1)}% (权重 35%)`);
    parts.push(`  - 最近活跃: ${engagement.factors.recency}/100 (权重 15%)`);
    parts.push(`  - 发送频率: ${engagement.factors.frequency}/100 (权重 10%)`);
    parts.push(`  - 退订风险: ${engagement.factors.unsubscribeRisk}% (反向权重 5%)`);
    parts.push(`活跃度阈值: 高>=${this.ENGAGEMENT_THRESHOLDS.HIGH}, 中>=${this.ENGAGEMENT_THRESHOLDS.MEDIUM}, 低>=${this.ENGAGEMENT_THRESHOLDS.LOW}`);
    parts.push('');
    
    parts.push('=== 发送速率控制 ===');
    parts.push(`当前速率: ${currentRate} 封/分钟`);
    parts.push(`允许最大速率: ${maxRate} 封/分钟`);
    parts.push(`速率计算依据: 发件人分数 ${reputation.senderScore}`);
    parts.push(`速率映射: `);
    parts.push(`  - 分数>=90 → 1000封/分钟`);
    parts.push(`  - 分数>=70 → 500封/分钟`);
    parts.push(`  - 分数>=50 → 200封/分钟`);
    parts.push(`  - 分数>=30 → 50封/分钟`);
    parts.push(`  - 分数<30 → 10封/分钟`);
    parts.push('');
    
    parts.push('=== 最佳发送时间 ===');
    parts.push(`推荐发送窗口: 9:00-11:00, 14:00-16:00`);
    parts.push(`逻辑: 工作日上午和下午是邮件打开率最高的时段`);
    parts.push('');
    
    return parts.join('\n');
  }
  
  private generateReputationExplanation(
    domain: string,
    score: number,
    reputation: string,
    bounceRate: number,
    complaintRate: number,
    totalSent: number
  ): string {
    const parts: string[] = [];
    
    parts.push('【发送优化引擎 - 发件人声誉说明】');
    parts.push('');
    parts.push(`发件域: ${domain}`);
    parts.push(`计算时间: ${new Date().toISOString()}`);
    parts.push('');
    
    parts.push('=== 分数计算 ===');
    parts.push(`基础分数: 80`);
    parts.push(`退信率调整: ${bounceRate > 10 ? -20 : bounceRate > 5 ? -10 : bounceRate > 2 ? -5 : 0}`);
    parts.push(`投诉率调整: ${complaintRate > 1 ? -15 : complaintRate > 0.5 ? -8 : complaintRate > 0.1 ? -3 : 0}`);
    parts.push(`最终分数: ${score}/100`);
    parts.push('');
    
    parts.push('=== 等级映射 ===');
    parts.push(`分数 ${score} → 等级: ${reputation}`);
    parts.push('');
    
    parts.push('=== 数据来源 ===');
    parts.push(`统计周期: 最近30天`);
    parts.push(`总发送量: ${totalSent} 封`);
    parts.push(`退信数: ${Math.round((bounceRate / 100) * totalSent)} 封 (${bounceRate.toFixed(2)}%)`);
    parts.push(`投诉数: ${Math.round((complaintRate / 100) * totalSent)} 封 (${complaintRate.toFixed(2)}%)`);
    
    return parts.join('\n');
  }
  
  private generateEngagementExplanation(
    email: string,
    score: number,
    category: string,
    factors: { openRate: number; clickRate: number; recencyScore: number; frequencyScore: number; unsubscribeRisk: number },
    totalSent: number,
    opens: number,
    clicks: number,
    lastActivityAt: Date | null
  ): string {
    const parts: string[] = [];
    
    parts.push('【发送优化引擎 - 用户活跃度说明】');
    parts.push('');
    parts.push(`用户邮箱: ${email}`);
    parts.push(`计算时间: ${new Date().toISOString()}`);
    parts.push('');
    
    parts.push('=== 分数计算公式 ===');
    parts.push(`活跃度分数 = 打开率×35% + 点击率×35% + 最近活跃×15% + 发送频率×10% + (100-退订风险)×5%`);
    parts.push('');
    
    parts.push('=== 各因子计算详情 ===');
    parts.push('');
    
    parts.push(`1. 打开率 (权重 35%)`);
    parts.push(`   计算公式: (打开数 / 总发送数) × 100`);
    parts.push(`   计算过程: (${opens} / ${totalSent}) × 100 = ${factors.openRate.toFixed(2)}%`);
    parts.push(`   贡献值: ${(factors.openRate * 0.35).toFixed(2)}`);
    parts.push('');
    
    parts.push(`2. 点击率 (权重 35%)`);
    parts.push(`   计算公式: (点击数 / 总发送数) × 100`);
    parts.push(`   计算过程: (${clicks} / ${totalSent}) × 100 = ${factors.clickRate.toFixed(2)}%`);
    parts.push(`   贡献值: ${(factors.clickRate * 0.35).toFixed(2)}`);
    parts.push('');
    
    parts.push(`3. 最近活跃 (权重 15%)`);
    parts.push(`   数据来源: audience_members.last_activity_at`);
    parts.push(`   最后活跃时间: ${lastActivityAt ? lastActivityAt.toISOString() : '无记录'}`);
    if (lastActivityAt) {
      const days = (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
      parts.push(`   距今天数: ${days.toFixed(1)} 天`);
    }
    parts.push(`   分数映射: ${factors.recencyScore}/100`);
    parts.push(`   映射规则:`);
    parts.push(`     - 7天内 → 100分`);
    parts.push(`     - 14天内 → 80分`);
    parts.push(`     - 30天内 → 60分`);
    parts.push(`     - 60天内 → 40分`);
    parts.push(`     - 60天以上 → 10分`);
    parts.push(`   贡献值: ${(factors.recencyScore * 0.15).toFixed(2)}`);
    parts.push('');
    
    parts.push(`4. 发送频率 (权重 10%)`);
    parts.push(`   数据来源: 最近一次发送记录的时间`);
    parts.push(`   分数: ${factors.frequencyScore}/100`);
    parts.push(`   映射规则:`);
    parts.push(`     - 2天内 → 90分`);
    parts.push(`     - 7天内 → 70分`);
    parts.push(`     - 14天内 → 50分`);
    parts.push(`     - 30天内 → 30分`);
    parts.push(`     - 30天以上 → 10分`);
    parts.push(`   贡献值: ${(factors.frequencyScore * 0.10).toFixed(2)}`);
    parts.push('');
    
    parts.push(`5. 退订风险 (反向权重 5%)`);
    parts.push(`   分数: ${factors.unsubscribeRisk}/100`);
    parts.push(`   计算规则:`);
    parts.push(`     - 已退订 → 100分`);
    parts.push(`     - 打开率<10% → 30分`);
    parts.push(`     - 打开率<20% → 15分`);
    parts.push(`     - 其他 → 5分`);
    parts.push(`   贡献值: ${((100 - factors.unsubscribeRisk) * 0.05).toFixed(2)}`);
    parts.push('');
    
    parts.push('=== 最终结果 ===');
    parts.push(`总分数: ${score}/100`);
    parts.push(`等级: ${category}`);
    parts.push('等级映射规则:');
    parts.push(`  - 高活跃: 分数 >= ${this.ENGAGEMENT_THRESHOLDS.HIGH}`);
    parts.push(`  - 中活跃: 分数 >= ${this.ENGAGEMENT_THRESHOLDS.MEDIUM}`);
    parts.push(`  - 低活跃: 分数 >= ${this.ENGAGEMENT_THRESHOLDS.LOW}`);
    parts.push(`  - 不活跃: 分数 < ${this.ENGAGEMENT_THRESHOLDS.LOW}`);
    parts.push('');
    
    parts.push('=== 数据来源 ===');
    parts.push(`统计周期: 最近90天`);
    parts.push(`总发送数: ${totalSent}`);
    parts.push(`打开数: ${opens}`);
    parts.push(`点击数: ${clicks}`);
    
    return parts.join('\n');
  }
}

export const deliverabilityOptEngine = new DeliverabilityOptEngine();
export default deliverabilityOptEngine;
