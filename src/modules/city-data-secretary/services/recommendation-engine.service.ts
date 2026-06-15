import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation, RecommendType } from '../entities/recommendation.entity';
import { UserTagRel } from '../entities/user-tag-rel.entity';
import { BehaviorLog } from '../entities/behavior-log.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { RecommendFeedbackDto, FeedbackType } from '../dto/recommendation.dto';

interface CandidateItem {
  id: string;
  title: string;
  type: RecommendType;
  tags: string[];
  extraInfo?: Record<string, any>;
}

const MOCK_CANDIDATES: CandidateItem[] = [
  { id: 'svc_001', title: '身份证到期换领', type: 'service_item', tags: ['cert', 'gov_worker'] },
  { id: 'svc_002', title: '社保转移接续办理', type: 'service_item', tags: ['social_security', 'age_middle'] },
  { id: 'svc_003', title: '公积金提取申请', type: 'service_item', tags: ['housing_fund', 'house_owner'] },
  { id: 'svc_004', title: '驾驶证期满换证', type: 'service_item', tags: ['transport', 'car_owner'] },
  { id: 'svc_005', title: '新生儿出生登记', type: 'service_item', tags: ['has_children', 'age_young'] },
  { id: 'svc_006', title: '退休手续办理', type: 'service_item', tags: ['retired', 'age_senior'] },
  { id: 'svc_007', title: '慢性病门诊报销', type: 'service_item', tags: ['medical', 'chronic_patient'] },
  { id: 'svc_008', title: '个人所得税年度汇算', type: 'service_item', tags: ['tax', 'high_income'] },
  { id: 'cert_001', title: '您的身份证将在30天内到期', type: 'cert', tags: ['cert'] },
  { id: 'cert_002', title: '驾驶证即将到期换证提醒', type: 'cert', tags: ['cert', 'car_owner'] },
  { id: 'cert_003', title: '社保卡余额年度对账通知', type: 'cert', tags: ['social_security'] },
  { id: 'cert_004', title: '不动产权证电子证照已生成', type: 'cert', tags: ['cert', 'house_owner'] },
  { id: 'policy_001', title: '2024年度住房公积金政策调整', type: 'policy', tags: ['housing_fund'] },
  { id: 'policy_002', title: '城乡居民医疗保险缴费通知', type: 'policy', tags: ['medical', 'age_senior'] },
  { id: 'policy_003', title: '高校毕业生就业创业补贴政策', type: 'policy', tags: ['age_young', 'high_education'] },
  { id: 'policy_004', title: '养老护理补贴申请指南', type: 'policy', tags: ['age_senior', 'retired'] },
  { id: 'policy_005', title: '保障性住房申请条件解读', type: 'policy', tags: ['house_owner'] },
  { id: 'policy_006', title: '新能源汽车购车补贴政策', type: 'policy', tags: ['car_owner', 'high_income'] },
];

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepo: Repository<Recommendation>,
    @InjectRepository(UserTagRel)
    private readonly userTagRelRepo: Repository<UserTagRel>,
    @InjectRepository(BehaviorLog)
    private readonly behaviorLogRepo: Repository<BehaviorLog>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
  ) {}

  async generateRecommendations(
    userId: string,
    recommendType?: RecommendType,
    limit = 10,
  ): Promise<Recommendation[]> {
    this.logger.log(`为用户[${userId}]生成推荐，类型: ${recommendType || 'all'}, limit: ${limit}`);

    const [userTags, recentBehaviors] = await Promise.all([
      this.userTagRelRepo
        .createQueryBuilder('rel')
        .leftJoinAndSelect('rel.tag', 'tag')
        .where('rel.user_id = :userId', { userId })
        .andWhere('rel.deleted_at IS NULL')
        .getMany(),
      this.behaviorLogRepo
        .createQueryBuilder('b')
        .where('b.user_id = :userId', { userId })
        .andWhere('b.create_time >= :start', { start: new Date(Date.now() - 30 * 24 * 3600 * 1000) })
        .orderBy('b.createTime', 'DESC')
        .limit(200)
        .getMany(),
    ]);

    const userTagWeights = new Map<string, number>();
    for (const rel of userTags) {
      const tag = (rel as any).tag;
      if (tag) {
        userTagWeights.set(tag.tagCode, rel.tagWeight);
      }
    }

    const viewedItems = new Set<string>();
    for (const b of recentBehaviors) {
      if (b.targetId) {
        viewedItems.add(`${b.targetType}:${b.targetId}`);
      }
    }

    const candidates = recommendType
      ? MOCK_CANDIDATES.filter(c => c.type === recommendType)
      : MOCK_CANDIDATES;

    const scored = candidates.map(candidate => {
      let score = 0;
      let reasons: string[] = [];

      for (const candidateTag of candidate.tags) {
        const weight = userTagWeights.get(candidateTag);
        if (weight !== undefined) {
          score += weight * 0.5;
          if (weight >= 0.8) {
            reasons.push(`符合用户标签特征`);
          }
        }
      }

      const key = `${candidate.type}:${candidate.id}`;
      if (viewedItems.has(key)) {
        score *= 0.3;
      }

      const behaviorCount = recentBehaviors.filter(b => b.targetType === candidate.type).length;
      if (behaviorCount > 5) {
        score += 0.2;
        reasons.push(`您关注过此类内容`);
      }

      score += Math.random() * 0.15;
      score = Math.min(0.99, Math.max(0, score));

      if (reasons.length === 0) {
        reasons.push('基于您的兴趣推荐');
      }

      return {
        candidate,
        score,
        reason: reasons.join('，'),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, limit);

    const existing = await this.recommendationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const existingKeys = new Set(existing.map(e => `${e.recommendType}:${e.targetId}`));

    const results: Recommendation[] = [];
    for (const item of selected) {
      const key = `${item.candidate.type}:${item.candidate.id}`;
      if (!existingKeys.has(key)) {
        const rec = this.recommendationRepo.create({
          userId,
          recommendType: item.candidate.type,
          targetId: item.candidate.id,
          targetTitle: item.candidate.title,
          score: item.score,
          reason: item.reason,
          extraInfo: item.candidate.extraInfo || null,
          isRead: false,
          isClicked: false,
          isFavorited: false,
          isIgnored: false,
          createTime: new Date(),
        });
        results.push(await this.recommendationRepo.save(rec));
      }
    }

    this.logger.log(`用户[${userId}]推荐生成完成，新增${results.length}条`);
    return results;
  }

  async getRecommendations(
    userId: string,
    recommendType?: RecommendType,
    page = 1,
    pageSize = 10,
  ): Promise<{ list: Recommendation[]; total: number; page: number; pageSize: number }> {
    const where: any = { userId };
    if (recommendType) {
      where.recommendType = recommendType;
    }

    const [list, total] = await this.recommendationRepo.findAndCount({
      where,
      order: { score: 'DESC', createTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  async handleFeedback(dto: RecommendFeedbackDto): Promise<Recommendation> {
    const rec = await this.recommendationRepo.findOne({
      where: { id: dto.recommendationId },
    });

    if (!rec) {
      throw new Error('推荐记录不存在');
    }

    switch (dto.feedbackType) {
      case 'click':
        rec.isClicked = true;
        rec.isRead = true;
        break;
      case 'ignore':
        rec.isIgnored = true;
        break;
      case 'favorite':
        rec.isFavorited = true;
        rec.isRead = true;
        break;
    }

    return this.recommendationRepo.save(rec);
  }

  async markAllAsRead(userId: string, recommendType?: RecommendType): Promise<number> {
    const where: any = { userId, isRead: false };
    if (recommendType) {
      where.recommendType = recommendType;
    }
    const result = await this.recommendationRepo.update(where, { isRead: true });
    return result.affected || 0;
  }

  async getUnreadCount(userId: string): Promise<{ total: number; byType: Record<RecommendType, number> }> {
    const unread = await this.recommendationRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.is_read = false')
      .andWhere('r.deleted_at IS NULL')
      .select(['r.recommend_type', 'COUNT(*) as count'])
      .groupBy('r.recommend_type')
      .getRawMany();

    const byType: Record<string, number> = {
      service_item: 0,
      cert: 0,
      policy: 0,
    };
    let total = 0;

    for (const row of unread) {
      const type = row.recommend_type as RecommendType;
      const count = parseInt(row.count, 10);
      byType[type] = count;
      total += count;
    }

    return { total, byType: byType as Record<RecommendType, number> };
  }
}
