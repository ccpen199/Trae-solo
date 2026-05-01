import { SendStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { config } from '../config';
import redis from '../lib/redis';

export interface ClickEvent {
  trackingId: string;
  linkIndex: number;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: Date;
}

export interface OpenEvent {
  trackingId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface TrackingStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalUniqueOpens: number;
  totalClicked: number;
  totalUniqueClicks: number;
  totalUnsubscribed: number;
  totalBounced: number;
  totalFailed: number;
  
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  
  explanation?: string;
}

class AnalyticsTrackerEngine {
  private readonly CACHE_TTL = 300;
  
  async trackOpen(event: OpenEvent): Promise<boolean> {
    logger.debug(`Tracking open: ${event.trackingId}`);
    
    const sendLog = await prisma.sendLog.findUnique({
      where: { trackingId: event.trackingId },
      include: { member: true, campaign: true },
    });
    
    if (!sendLog) {
      logger.warn(`SendLog not found for trackingId: ${event.trackingId}`);
      return false;
    }
    
    if (sendLog.status === SendStatus.UNSUBSCRIBED) {
      logger.warn(`Cannot track open for unsubscribed user: ${sendLog.email}`);
      return false;
    }
    
    const cacheKey = `open:${event.trackingId}:${event.ipAddress || 'no-ip'}`;
    const isCached = await redis.get(cacheKey);
    
    const isFirstOpen = !sendLog.openedAt;
    const isUnique = !isCached;
    
    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      
      if (!sendLog.openedAt) {
        updateData.openedAt = new Date();
        updateData.status = SendStatus.OPENED;
      }
      
      if (event.ipAddress) updateData.ipAddress = event.ipAddress;
      if (event.userAgent) updateData.userAgent = event.userAgent;
      
      await tx.sendLog.update({
        where: { id: sendLog.id },
        data: updateData,
      });
      
      if (isUnique) {
        await tx.audienceMember.update({
          where: { id: sendLog.memberId },
          data: {
            totalOpens: { increment: 1 },
            lastActivityAt: new Date(),
          },
        });
      }
    });
    
    if (isUnique) {
      await redis.setex(cacheKey, this.CACHE_TTL, '1');
      
      await this.invalidateCampaignCache(sendLog.campaignId);
    }
    
    logger.info(`Tracked open for: ${sendLog.email}, trackingId: ${event.trackingId}, unique: ${isUnique}`);
    
    return true;
  }
  
  async trackClick(event: ClickEvent): Promise<{ success: boolean; originalUrl?: string; explanation?: string }> {
    logger.debug(`Tracking click: ${event.trackingId}, linkIndex: ${event.linkIndex}`);
    
    const sendLog = await prisma.sendLog.findUnique({
      where: { trackingId: event.trackingId },
      include: { member: true, campaign: true },
    });
    
    if (!sendLog) {
      logger.warn(`SendLog not found for trackingId: ${event.trackingId}`);
      return { 
        success: false, 
        explanation: `未找到发送记录，trackingId: ${event.trackingId}` 
      };
    }
    
    if (sendLog.status === SendStatus.UNSUBSCRIBED) {
      logger.warn(`Cannot track click for unsubscribed user: ${sendLog.email}`);
      return { 
        success: false, 
        explanation: `用户已退订，无法追踪点击: ${sendLog.email}` 
      };
    }
    
    const clickLinks = sendLog.clickTrackingLinks as Record<string, string> | undefined;
    const originalUrl = clickLinks?.[event.linkIndex] || clickLinks?.[String(event.linkIndex)];
    
    const cacheKey = `click:${event.trackingId}:${event.linkIndex}:${event.ipAddress || 'no-ip'}`;
    const isCached = await redis.get(cacheKey);
    const isUnique = !isCached;
    
    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      
      if (!sendLog.clickedAt) {
        updateData.clickedAt = new Date();
      }
      
      await tx.sendLog.update({
        where: { id: sendLog.id },
        data: updateData,
      });
      
      await tx.clickLog.create({
        data: {
          sendLogId: sendLog.id,
          memberId: sendLog.memberId,
          trackingId: event.trackingId,
          linkIndex: event.linkIndex,
          originalUrl: originalUrl || '',
          redirectUrl: originalUrl,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          referrer: event.referrer,
          isUnique,
          deviceInfo: this.parseUserAgent(event.userAgent) as unknown as Record<string, unknown>,
        },
      });
      
      if (isUnique) {
        await tx.audienceMember.update({
          where: { id: sendLog.memberId },
          data: {
            totalClicks: { increment: 1 },
            lastActivityAt: new Date(),
          },
        });
      }
    });
    
    if (isUnique) {
      await redis.setex(cacheKey, this.CACHE_TTL, '1');
      await this.invalidateCampaignCache(sendLog.campaignId);
    }
    
    const explanation = this.generateClickExplanation(
      sendLog,
      event,
      originalUrl,
      isUnique
    );
    
    logger.info(`Tracked click for: ${sendLog.email}, trackingId: ${event.trackingId}, unique: ${isUnique}`);
    
    return {
      success: true,
      originalUrl: originalUrl || undefined,
      explanation,
    };
  }
  
  async trackUnsubscribe(
    trackingId: string,
    reason?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; explanation?: string }> {
    logger.debug(`Tracking unsubscribe: ${trackingId}`);
    
    const sendLog = await prisma.sendLog.findUnique({
      where: { trackingId },
      include: { member: true, campaign: true },
    });
    
    if (!sendLog) {
      return { 
        success: false, 
        explanation: `未找到发送记录，trackingId: ${trackingId}` 
      };
    }
    
    const now = new Date();
    
    await prisma.$transaction(async (tx) => {
      await tx.sendLog.update({
        where: { id: sendLog.id },
        data: {
          status: SendStatus.UNSUBSCRIBED,
          unsubscribedAt: now,
          ipAddress,
        },
      });
      
      await tx.audienceMember.update({
        where: { id: sendLog.memberId },
        data: {
          isSubscribed: false,
          unsubscribedAt: now,
        },
      });
      
      await tx.alert.create({
        data: {
          type: 'USER_UNSUBSCRIBE',
          severity: 'MEDIUM',
          message: `用户 ${sendLog.email} 已退订`,
          relatedEntityType: 'AudienceMember',
          relatedEntityId: sendLog.memberId,
          details: {
            campaignId: sendLog.campaignId,
            email: sendLog.email,
            reason,
            ipAddress,
          } as unknown as Record<string, unknown>,
        },
      });
    });
    
    await this.invalidateCampaignCache(sendLog.campaignId);
    
    const explanation = [
      '【点击追踪引擎 - 退订记录说明】',
      '',
      `追踪ID: ${trackingId}`,
      `用户邮箱: ${sendLog.email}`,
      `退订时间: ${now.toISOString()}`,
      `关联活动: ${sendLog.campaignId}`,
      `退订原因: ${reason || '用户未提供原因'}`,
      `IP地址: ${ipAddress || '未知'}`,
      '',
      '系统已自动执行以下操作:',
      '  1. 更新发送记录状态为 UNSUBSCRIBED',
      '  2. 更新用户订阅状态为 false',
      '  3. 创建风险告警通知管理员',
      '  4. 清除该用户的相关缓存',
    ].join('\n');
    
    logger.info(`User unsubscribed: ${sendLog.email}, trackingId: ${trackingId}`);
    
    return {
      success: true,
      explanation,
    };
  }
  
  async trackBounce(
    trackingId: string,
    bounceType: 'hard' | 'soft',
    reason: string,
    ipAddress?: string
  ): Promise<{ success: boolean; explanation?: string }> {
    const sendLog = await prisma.sendLog.findUnique({
      where: { trackingId },
      include: { member: true, campaign: true },
    });
    
    if (!sendLog) {
      return { 
        success: false, 
        explanation: `未找到发送记录，trackingId: ${trackingId}` 
      };
    }
    
    const now = new Date();
    
    await prisma.$transaction(async (tx) => {
      await tx.sendLog.update({
        where: { id: sendLog.id },
        data: {
          status: SendStatus.BOUNCED,
          bouncedAt: now,
          bounceReason: reason,
        },
      });
      
      const alertSeverity = bounceType === 'hard' ? 'HIGH' : 'MEDIUM';
      await tx.alert.create({
        data: {
          type: `BOUNCE_${bounceType.toUpperCase()}`,
          severity: alertSeverity,
          message: `邮件退信 [${bounceType}]: ${sendLog.email}`,
          relatedEntityType: 'AudienceMember',
          relatedEntityId: sendLog.memberId,
          details: {
            campaignId: sendLog.campaignId,
            email: sendLog.email,
            bounceType,
            reason,
            ipAddress,
          } as unknown as Record<string, unknown>,
        },
      });
    });
    
    await this.invalidateCampaignCache(sendLog.campaignId);
    
    const explanation = [
      '【点击追踪引擎 - 退信记录说明】',
      '',
      `追踪ID: ${trackingId}`,
      `用户邮箱: ${sendLog.email}`,
      `退信时间: ${now.toISOString()}`,
      `退信类型: ${bounceType} (${bounceType === 'hard' ? '永久退信' : '临时退信'})`,
      `退信原因: ${reason}`,
      '',
      '系统已自动执行以下操作:',
      `  1. 更新发送记录状态为 BOUNCED`,
      `  2. 创建 ${alertSeverity} 级别告警通知管理员`,
      bounceType === 'hard' ? '  3. 建议: 永久退信的邮箱应从后续发送列表中排除' : '  3. 建议: 临时退信可在稍后重试发送',
    ].join('\n');
    
    logger.info(`Email bounced [${bounceType}]: ${sendLog.email}, reason: ${reason}`);
    
    return {
      success: true,
      explanation,
    };
  }
  
  async getCampaignStats(campaignId: string): Promise<TrackingStats> {
    const cacheKey = `stats:campaign:${campaignId}`;
    const cachedStats = await redis.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sendBatches: {
          include: {
            sendLogs: true,
          },
        },
      },
    });
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    const allSendLogs = campaign.sendBatches.flatMap(batch => batch.sendLogs);
    
    const totalSent = allSendLogs.length;
    const totalDelivered = allSendLogs.filter(l => 
      [SendStatus.DELIVERED, SendStatus.OPENED, SendStatus.CLICKED].includes(l.status)
    ).length;
    const totalOpened = allSendLogs.filter(l => l.openedAt).length;
    const totalClicked = allSendLogs.filter(l => l.clickedAt).length;
    const totalUnsubscribed = allSendLogs.filter(l => l.status === SendStatus.UNSUBSCRIBED).length;
    const totalBounced = allSendLogs.filter(l => l.status === SendStatus.BOUNCED).length;
    const totalFailed = allSendLogs.filter(l => l.status === SendStatus.FAILED).length;
    
    const uniqueOpens = await prisma.clickLog.count({
      where: {
        sendLog: { campaignId },
        isUnique: true,
      },
    });
    
    const uniqueClicks = await prisma.clickLog.count({
      where: {
        sendLog: { campaignId },
        isUnique: true,
      },
    });
    
    const stats: TrackingStats = {
      totalSent,
      totalDelivered,
      totalOpened,
      totalUniqueOpens: uniqueOpens,
      totalClicked,
      totalUniqueClicks: uniqueClicks,
      totalUnsubscribed,
      totalBounced,
      totalFailed,
      
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
      clickToOpenRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      unsubscribeRate: totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      
      explanation: this.generateStatsExplanation(campaignId, allSendLogs, {
        totalSent, totalDelivered, totalOpened, totalClicked,
        totalUnsubscribed, totalBounced, totalFailed,
        uniqueOpens, uniqueClicks,
      }),
    };
    
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
    
    return stats;
  }
  
  private generateStatsExplanation(
    campaignId: string,
    sendLogs: Array<{ status: SendStatus; openedAt?: Date; clickedAt?: Date }>,
    counts: {
      totalSent: number;
      totalDelivered: number;
      totalOpened: number;
      totalClicked: number;
      totalUnsubscribed: number;
      totalBounced: number;
      totalFailed: number;
      uniqueOpens: number;
      uniqueClicks: number;
    }
  ): string {
    const {
      totalSent, totalDelivered, totalOpened, totalClicked,
      totalUnsubscribed, totalBounced, totalFailed,
      uniqueOpens, uniqueClicks,
    } = counts;
    
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    
    const parts: string[] = [];
    
    parts.push('【点击追踪引擎 - 统计数据说明】');
    parts.push('');
    parts.push(`活动ID: ${campaignId}`);
    parts.push(`统计时间: ${new Date().toISOString()}`);
    parts.push('');
    
    parts.push('=== 基础指标计算 ===');
    parts.push('');
    
    parts.push(`总发送数 (totalSent): ${totalSent}`);
    parts.push(`  计算方式: 统计所有关联的发送记录数量`);
    parts.push(`  数据来源: send_logs 表中 campaign_id = ${campaignId} 的记录数`);
    parts.push('');
    
    parts.push(`送达数 (totalDelivered): ${totalDelivered}`);
    parts.push(`  计算方式: 统计状态为 DELIVERED、OPENED、CLICKED 的发送记录`);
    parts.push(`  排除: BOUNCED(退信)、FAILED(发送失败)、UNSUBSCRIBED(退订)、PENDING(待发送) 等状态`);
    parts.push('');
    
    parts.push(`打开数 (totalOpened): ${totalOpened}`);
    parts.push(`  计算方式: 统计 openedAt 非空的发送记录`);
    parts.push(`  数据来源: send_logs.opened_at 字段`);
    parts.push('');
    
    parts.push(`点击数 (totalClicked): ${totalClicked}`);
    parts.push(`  计算方式: 统计 clickedAt 非空的发送记录`);
    parts.push(`  数据来源: send_logs.clicked_at 字段`);
    parts.push('');
    
    parts.push(`独立打开 (uniqueOpens): ${uniqueOpens}`);
    parts.push(`  计算方式: 统计 click_logs 中 is_unique = true 且类型为打开的记录`);
    parts.push(`  说明: 同一用户多次打开只计为1次独立打开`);
    parts.push('');
    
    parts.push(`独立点击 (uniqueClicks): ${uniqueClicks}`);
    parts.push(`  计算方式: 统计 click_logs 中 is_unique = true 的点击记录`);
    parts.push(`  说明: 同一用户多次点击同一链接只计为1次独立点击`);
    parts.push('');
    
    parts.push('=== 转化率指标计算 ===');
    parts.push('');
    
    parts.push(`送达率 (deliveryRate): ${deliveryRate.toFixed(2)}%`);
    parts.push(`  公式: (送达数 / 总发送数) × 100`);
    parts.push(`  计算: (${totalDelivered} / ${totalSent}) × 100 = ${deliveryRate.toFixed(2)}%`);
    parts.push(`  意义: 成功送达目标邮箱的比例，反映发送质量和列表清洁度`);
    parts.push('');
    
    parts.push(`打开率 (openRate): ${openRate.toFixed(2)}%`);
    parts.push(`  公式: (打开数 / 送达数) × 100`);
    parts.push(`  计算: (${totalOpened} / ${totalDelivered}) × 100 = ${openRate.toFixed(2)}%`);
    parts.push(`  意义: 收到邮件后打开的用户比例，反映主题行和发件人吸引力`);
    parts.push('');
    
    parts.push(`点击率 (clickRate): ${clickRate.toFixed(2)}%`);
    parts.push(`  公式: (点击数 / 送达数) × 100`);
    parts.push(`  计算: (${totalClicked} / ${totalDelivered}) × 100 = ${clickRate.toFixed(2)}%`);
    parts.push(`  意义: 收到邮件后点击链接的用户比例，反映内容相关性和CTA有效性`);
    parts.push('');
    
    if (totalOpened > 0) {
      const ctor = (totalClicked / totalOpened) * 100;
      parts.push(`点击打开比 (CTOR): ${ctor.toFixed(2)}%`);
      parts.push(`  公式: (点击数 / 打开数) × 100`);
      parts.push(`  计算: (${totalClicked} / ${totalOpened}) × 100 = ${ctor.toFixed(2)}%`);
      parts.push(`  意义: 在打开邮件的用户中点击的比例，更准确反映邮件内容质量`);
      parts.push('');
    }
    
    if (totalDelivered > 0 && totalUnsubscribed > 0) {
      const unsubRate = (totalUnsubscribed / totalDelivered) * 100;
      parts.push(`退订率 (unsubscribeRate): ${unsubRate.toFixed(2)}%`);
      parts.push(`  公式: (退订数 / 送达数) × 100`);
      parts.push(`  计算: (${totalUnsubscribed} / ${totalDelivered}) × 100 = ${unsubRate.toFixed(2)}%`);
      parts.push(`  意义: 收到邮件后退订的用户比例，反映内容反感度`);
      parts.push('');
    }
    
    if (totalSent > 0 && totalBounced > 0) {
      const bounceRate = (totalBounced / totalSent) * 100;
      parts.push(`退信率 (bounceRate): ${bounceRate.toFixed(2)}%`);
      parts.push(`  公式: (退信数 / 总发送数) × 100`);
      parts.push(`  计算: (${totalBounced} / ${totalSent}) × 100 = ${bounceRate.toFixed(2)}%`);
      parts.push(`  意义: 无法送达的邮件比例，高退信率会影响发件人声誉`);
      parts.push('');
    }
    
    parts.push('=== 状态分布详情 ===');
    parts.push('');
    
    const statusCounts: Record<string, number> = {};
    for (const log of sendLogs) {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
    }
    
    for (const [status, count] of Object.entries(statusCounts)) {
      const percentage = totalSent > 0 ? (count / totalSent) * 100 : 0;
      parts.push(`  ${status}: ${count} 封 (${percentage.toFixed(2)}%)`);
    }
    
    return parts.join('\n');
  }
  
  private generateClickExplanation(
    sendLog: { email: string; trackingId: string; campaignId: string },
    event: ClickEvent,
    originalUrl: string | undefined,
    isUnique: boolean
  ): string {
    const parts: string[] = [];
    
    parts.push('【点击追踪引擎 - 点击记录说明】');
    parts.push('');
    parts.push(`追踪ID: ${event.trackingId}`);
    parts.push(`用户邮箱: ${sendLog.email}`);
    parts.push(`关联活动: ${sendLog.campaignId}`);
    parts.push(`点击时间: ${event.timestamp.toISOString()}`);
    parts.push('');
    
    parts.push('=== 链接信息 ===');
    parts.push(`链接索引: ${event.linkIndex}`);
    parts.push(`原始URL: ${originalUrl || '未知'}`);
    parts.push(`追踪URL: ${config.tracking.baseUrl}/track/click/${event.trackingId}/${event.linkIndex}`);
    parts.push('');
    
    parts.push('=== 用户信息 ===');
    parts.push(`IP地址: ${event.ipAddress || '未知'}`);
    parts.push(`User-Agent: ${event.userAgent || '未知'}`);
    parts.push(`来源页面: ${event.referrer || '直接访问'}`);
    parts.push('');
    
    parts.push('=== 追踪逻辑 ===');
    parts.push(`是否首次点击: ${isUnique ? '是' : '否'}`);
    parts.push(`缓存检查: ${isUnique ? '无缓存，新增记录' : '已有缓存，仅更新统计'}`);
    parts.push(`缓存键: click:${event.trackingId}:${event.linkIndex}:${event.ipAddress || 'no-ip'}`);
    parts.push(`缓存过期: 5分钟后`);
    parts.push('');
    
    if (isUnique) {
      parts.push('=== 已执行操作 ===');
      parts.push('  1. 在 click_logs 表创建点击记录');
      parts.push('  2. 更新 audience_members.totalClicks (+1)');
      parts.push('  3. 更新 audience_members.lastActivityAt');
      parts.push('  4. 清除活动统计缓存');
      parts.push('  5. 设置 Redis 缓存防止重复计数');
    } else {
      parts.push('=== 已执行操作 ===');
      parts.push('  1. 在 click_logs 表创建点击记录 (is_unique=false)');
      parts.push('  2. 不更新独立点击统计');
      parts.push('  3. 不清除活动统计缓存');
    }
    
    return parts.join('\n');
  }
  
  private parseUserAgent(userAgent?: string): Record<string, string> {
    if (!userAgent) {
      return {};
    }
    
    const result: Record<string, string> = {};
    
    if (userAgent.includes('Mobile')) result.device = 'Mobile';
    else if (userAgent.includes('Tablet')) result.device = 'Tablet';
    else result.device = 'Desktop';
    
    if (userAgent.includes('Chrome')) result.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
    else if (userAgent.includes('Safari')) result.browser = 'Safari';
    else if (userAgent.includes('Edge')) result.browser = 'Edge';
    else result.browser = 'Other';
    
    if (userAgent.includes('Windows')) result.os = 'Windows';
    else if (userAgent.includes('Mac')) result.os = 'macOS';
    else if (userAgent.includes('Linux')) result.os = 'Linux';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) result.os = 'iOS';
    else if (userAgent.includes('Android')) result.os = 'Android';
    else result.os = 'Other';
    
    return result;
  }
  
  private async invalidateCampaignCache(campaignId: string): Promise<void> {
    const cacheKey = `stats:campaign:${campaignId}`;
    await redis.del(cacheKey);
    logger.debug(`Invalidated cache for campaign: ${campaignId}`);
  }
}

export const analyticsTrackerEngine = new AnalyticsTrackerEngine();
export default analyticsTrackerEngine;
