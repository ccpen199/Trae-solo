import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EngagementMetric } from './entities/engagement-metric.entity';
import { DistributionChannel } from '../common/enums';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EngagementMetric)
    private metricsRepository: Repository<EngagementMetric>,
  ) {}

  async getContentMetrics(
    contentId: string,
    startDate?: Date,
    endDate?: Date,
    channel?: DistributionChannel,
  ) {
    const queryBuilder = this.metricsRepository
      .createQueryBuilder('metrics')
      .where('metrics.contentId = :contentId', { contentId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'metrics.collectedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    if (channel) {
      queryBuilder.andWhere('metrics.channel = :channel', { channel });
    }

    queryBuilder.orderBy('metrics.collectedAt', 'ASC');

    const metrics = await queryBuilder.getMany();

    return this.aggregateMetrics(metrics);
  }

  async getDashboardMetrics(
    userId: string,
    userRole: string,
    days: number = 7,
  ) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const queryBuilder = this.metricsRepository
      .createQueryBuilder('metrics')
      .leftJoinAndSelect('metrics.content', 'content')
      .where(
        'metrics.collectedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );

    if (userRole !== 'ADMIN' && userRole !== 'DATA_ANALYST') {
      queryBuilder.andWhere('content.authorId = :userId', { userId });
    }

    const metrics = await queryBuilder.getMany();

    return {
      overview: this.calculateOverview(metrics),
      byChannel: this.groupByChannel(metrics),
      byDay: this.groupByDay(metrics),
      topContents: this.getTopContents(metrics, 10),
    };
  }

  private aggregateMetrics(metrics: EngagementMetric[]) {
    const total = {
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      favoriteCount: 0,
    };

    const byChannel: Record<string, typeof total> = {};
    const byDate: Record<string, typeof total> = {};

    for (const metric of metrics) {
      const counts = {
        viewCount: Number(metric.viewCount),
        likeCount: Number(metric.likeCount),
        commentCount: Number(metric.commentCount),
        shareCount: Number(metric.shareCount),
        favoriteCount: Number(metric.favoriteCount),
      };

      total.viewCount += counts.viewCount;
      total.likeCount += counts.likeCount;
      total.commentCount += counts.commentCount;
      total.shareCount += counts.shareCount;
      total.favoriteCount += counts.favoriteCount;

      if (!byChannel[metric.channel]) {
        byChannel[metric.channel] = { ...total, viewCount: 0, likeCount: 0, commentCount: 0, shareCount: 0, favoriteCount: 0 };
      }
      byChannel[metric.channel].viewCount += counts.viewCount;
      byChannel[metric.channel].likeCount += counts.likeCount;
      byChannel[metric.channel].commentCount += counts.commentCount;
      byChannel[metric.channel].shareCount += counts.shareCount;
      byChannel[metric.channel].favoriteCount += counts.favoriteCount;

      const dateStr = format(metric.collectedAt, 'yyyy-MM-dd');
      if (!byDate[dateStr]) {
        byDate[dateStr] = { ...total, viewCount: 0, likeCount: 0, commentCount: 0, shareCount: 0, favoriteCount: 0 };
      }
      byDate[dateStr].viewCount += counts.viewCount;
      byDate[dateStr].likeCount += counts.likeCount;
      byDate[dateStr].commentCount += counts.commentCount;
      byDate[dateStr].shareCount += counts.shareCount;
      byDate[dateStr].favoriteCount += counts.favoriteCount;
    }

    return { total, byChannel, byDate, raw: metrics };
  }

  private calculateOverview(metrics: EngagementMetric[]) {
    let viewCount = 0;
    let likeCount = 0;
    let commentCount = 0;
    let shareCount = 0;
    let engagementRate = 0;

    for (const metric of metrics) {
      viewCount += Number(metric.viewCount);
      likeCount += Number(metric.likeCount);
      commentCount += Number(metric.commentCount);
      shareCount += Number(metric.shareCount);
    }

    const totalEngagements = likeCount + commentCount + shareCount;
    if (viewCount > 0) {
      engagementRate = (totalEngagements / viewCount) * 100;
    }

    return {
      viewCount,
      likeCount,
      commentCount,
      shareCount,
      totalEngagements,
      engagementRate: engagementRate.toFixed(2),
    };
  }

  private groupByChannel(metrics: EngagementMetric[]) {
    const grouped: Record<string, any> = {};

    for (const metric of metrics) {
      if (!grouped[metric.channel]) {
        grouped[metric.channel] = {
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
        };
      }

      grouped[metric.channel].viewCount += Number(metric.viewCount);
      grouped[metric.channel].likeCount += Number(metric.likeCount);
      grouped[metric.channel].commentCount += Number(metric.commentCount);
      grouped[metric.channel].shareCount += Number(metric.shareCount);
    }

    return grouped;
  }

  private groupByDay(metrics: EngagementMetric[]) {
    const grouped: Record<string, any> = {};

    for (const metric of metrics) {
      const dateStr = format(metric.collectedAt, 'yyyy-MM-dd');
      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
        };
      }

      grouped[dateStr].viewCount += Number(metric.viewCount);
      grouped[dateStr].likeCount += Number(metric.likeCount);
      grouped[dateStr].commentCount += Number(metric.commentCount);
      grouped[dateStr].shareCount += Number(metric.shareCount);
    }

    return grouped;
  }

  private getTopContents(metrics: EngagementMetric[], limit: number) {
    const contentTotals: Record<string, any> = {};

    for (const metric of metrics) {
      if (!contentTotals[metric.contentId]) {
        contentTotals[metric.contentId] = {
          contentId: metric.contentId,
          content: metric.content,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          totalEngagements: 0,
        };
      }

      contentTotals[metric.contentId].viewCount += Number(metric.viewCount);
      contentTotals[metric.contentId].likeCount += Number(metric.likeCount);
      contentTotals[metric.contentId].commentCount += Number(metric.commentCount);
      contentTotals[metric.contentId].shareCount += Number(metric.shareCount);
      contentTotals[metric.contentId].totalEngagements =
        contentTotals[metric.contentId].likeCount +
        contentTotals[metric.contentId].commentCount +
        contentTotals[metric.contentId].shareCount;
    }

    return Object.values(contentTotals)
      .sort((a, b) => b.totalEngagements - a.totalEngagements)
      .slice(0, limit);
  }

  async generateInteractionReport(
    userId: string,
    userRole: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const end = endDate || new Date();
    const start = startDate || subDays(end, 30);

    const queryBuilder = this.metricsRepository
      .createQueryBuilder('metrics')
      .leftJoinAndSelect('metrics.content', 'content')
      .leftJoinAndSelect('content.author', 'author')
      .where(
        'metrics.collectedAt BETWEEN :startDate AND :endDate',
        { startDate: start, endDate: end },
      );

    if (userRole !== 'ADMIN' && userRole !== 'DATA_ANALYST') {
      queryBuilder.andWhere('content.authorId = :userId', { userId });
    }

    const metrics = await queryBuilder.getMany();

    const report = {
      period: {
        startDate: start,
        endDate: end,
        generatedAt: new Date(),
      },
      summary: this.calculateOverview(metrics),
      channelBreakdown: this.groupByChannel(metrics),
      dailyTrend: this.groupByDay(metrics),
      topPerformingContents: this.getTopContents(metrics, 20),
      engagementByCategory: this.groupByCategory(metrics),
    };

    return report;
  }

  private groupByCategory(metrics: EngagementMetric[]) {
    const grouped: Record<string, any> = {};

    for (const metric of metrics) {
      const category = metric.content?.categoryId || 'uncategorized';

      if (!grouped[category]) {
        grouped[category] = {
          categoryId: category,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
        };
      }

      grouped[category].viewCount += Number(metric.viewCount);
      grouped[category].likeCount += Number(metric.likeCount);
      grouped[category].commentCount += Number(metric.commentCount);
      grouped[category].shareCount += Number(metric.shareCount);
    }

    return Object.values(grouped);
  }

  async collectSampleData() {
    const contentIds = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
    ];
    const channels = [
      DistributionChannel.WEB,
      DistributionChannel.APP,
      DistributionChannel.WECHAT,
      DistributionChannel.WEIBO,
    ];

    const endDate = new Date();
    const startDate = subDays(endDate, 14);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const contentId of contentIds) {
        for (const channel of channels) {
          const metric = this.metricsRepository.create({
            contentId,
            channel,
            viewCount: Math.floor(Math.random() * 10000) + 1000,
            likeCount: Math.floor(Math.random() * 500) + 50,
            commentCount: Math.floor(Math.random() * 100) + 10,
            shareCount: Math.floor(Math.random() * 200) + 20,
            favoriteCount: Math.floor(Math.random() * 300) + 30,
            collectedAt: new Date(d),
          });

          await this.metricsRepository.save(metric);
        }
      }
    }

    return { message: 'Sample engagement data generated successfully' };
  }
}
