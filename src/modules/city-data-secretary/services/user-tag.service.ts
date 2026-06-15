import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserTag, TagCategory } from '../entities/user-tag.entity';
import { UserTagRel, TagSource } from '../entities/user-tag-rel.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { BehaviorLog } from '../entities/behavior-log.entity';

interface TagRuleContext {
  profile: UserProfile;
  recentBehaviors: BehaviorLog[];
}

@Injectable()
export class UserTagService {
  private readonly logger = new Logger(UserTagService.name);

  constructor(
    @InjectRepository(UserTag)
    private readonly userTagRepo: Repository<UserTag>,
    @InjectRepository(UserTagRel)
    private readonly userTagRelRepo: Repository<UserTagRel>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
    @InjectRepository(BehaviorLog)
    private readonly behaviorLogRepo: Repository<BehaviorLog>,
  ) {}

  async getAllTags(category?: TagCategory): Promise<UserTag[]> {
    const where: any = {};
    if (category) {
      where.tagCategory = category;
    }
    return this.userTagRepo.find({ where });
  }

  async getUserTags(userId: string): Promise<Array<UserTagRel & { tag?: UserTag }>> {
    const rels = await this.userTagRelRepo
      .createQueryBuilder('rel')
      .leftJoinAndMapOne('rel.tag', UserTag, 'tag', 'tag.id = rel.tag_id')
      .where('rel.user_id = :userId', { userId })
      .andWhere('rel.deleted_at IS NULL')
      .andWhere('(rel.expire_time IS NULL OR rel.expire_time > NOW())')
      .getMany();
    return rels as Array<UserTagRel & { tag?: UserTag }>;
  }

  async autoTagUser(userId: string): Promise<UserTagRel[]> {
    this.logger.log(`开始为用户[${userId}]自动打标签...`);

    const profile = await this.userProfileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      this.logger.warn(`用户[${userId}]画像不存在，跳过自动打标签`);
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBehaviors = await this.behaviorLogRepo
      .createQueryBuilder('b')
      .where('b.user_id = :userId', { userId })
      .andWhere('b.create_time >= :startDate', { startDate: thirtyDaysAgo })
      .getMany();

    const allTags = await this.userTagRepo.find();
    const newRels: UserTagRel[] = [];

    for (const tag of allTags) {
      const matchResult = this.evaluateTagRule(tag, { profile, recentBehaviors });
      if (matchResult.matched) {
        const existing = await this.userTagRelRepo.findOne({
          where: { userId, tagId: tag.id },
        });

        if (existing) {
          existing.tagWeight = matchResult.weight;
          if (matchResult.value) {
            existing.tagValue = matchResult.value;
          }
          await this.userTagRelRepo.save(existing);
          newRels.push(existing);
        } else {
          const rel = this.userTagRelRepo.create({
            userId,
            tagId: tag.id,
            tagWeight: matchResult.weight,
            tagValue: matchResult.value,
            source: 'auto' as TagSource,
          });
          const saved = await this.userTagRelRepo.save(rel);
          newRels.push(saved);
        }
      }
    }

    this.logger.log(`用户[${userId}]自动打标签完成，共匹配${newRels.length}个标签`);
    return newRels;
  }

  private evaluateTagRule(
    tag: UserTag,
    ctx: TagRuleContext,
  ): { matched: boolean; weight: number; value?: string } {
    const { profile, recentBehaviors } = ctx;

    switch (tag.tagCode) {
      case 'age_young':
        if (profile.ageRange === '18-25' || profile.ageRange === '26-35') {
          return { matched: true, weight: 0.9 };
        }
        break;
      case 'age_middle':
        if (profile.ageRange === '36-45' || profile.ageRange === '46-55') {
          return { matched: true, weight: 0.9 };
        }
        break;
      case 'age_senior':
        if (profile.ageRange === '56-65' || profile.ageRange === '66+') {
          return { matched: true, weight: 0.95 };
        }
        break;
      case 'has_children':
        if (profile.hasChildren) {
          return { matched: true, weight: 1.0 };
        }
        break;
      case 'high_education':
        if (profile.educationLevel === 'bachelor' ||
            profile.educationLevel === 'master' ||
            profile.educationLevel === 'phd') {
          return { matched: true, weight: 0.9 };
        }
        break;
      case 'gov_worker':
        if (profile.occupationType === 'government' || profile.occupationType === 'institution') {
          return { matched: true, weight: 1.0 };
        }
        break;
      case 'high_income':
        if (profile.incomeRange === '20k-50k' || profile.incomeRange === 'above_50k') {
          return { matched: true, weight: 0.85 };
        }
        break;
      case 'house_owner':
        if (profile.housingStatus === 'own_full' || profile.housingStatus === 'own_mortgage') {
          return { matched: true, weight: 1.0 };
        }
        break;
      case 'car_owner':
        if (profile.carOwner) {
          return { matched: true, weight: 1.0 };
        }
        break;
      case 'retired':
        if (profile.socialSecurityStatus === 'retired' || profile.occupationType === 'retired') {
          return { matched: true, weight: 1.0 };
        }
        break;
      case 'chronic_patient':
        if (profile.healthStatus === 'chronic') {
          return { matched: true, weight: 0.95 };
        }
        break;
      case 'active_user': {
        const last7Days = recentBehaviors.filter(b => {
          const d = new Date(b.createTime);
          return d.getTime() > Date.now() - 7 * 24 * 3600 * 1000;
        }).length;
        if (last7Days >= 5) {
          return { matched: true, weight: Math.min(1.0, last7Days / 10 + 0.5) };
        }
        break;
      }
      case 'service_searcher': {
        const searchCount = recentBehaviors.filter(b => b.action === 'search').length;
        if (searchCount >= 3) {
          return { matched: true, weight: Math.min(1.0, searchCount / 10 + 0.5), value: String(searchCount) };
        }
        break;
      }
      case 'cert_follower': {
        const certViews = recentBehaviors.filter(b => b.targetType === 'cert').length;
        if (certViews >= 2) {
          return { matched: true, weight: 0.8, value: String(certViews) };
        }
        break;
      }
      case 'policy_enthusiast': {
        const policyViews = recentBehaviors.filter(b => b.targetType === 'policy').length;
        if (policyViews >= 3) {
          return { matched: true, weight: 0.85, value: String(policyViews) };
        }
        break;
      }
    }

    return { matched: false, weight: 0 };
  }

  async addManualTag(userId: string, tagId: string, tagValue?: string, weight = 1.0): Promise<UserTagRel> {
    const existing = await this.userTagRelRepo.findOne({
      where: { userId, tagId },
    });

    if (existing) {
      existing.source = 'manual';
      existing.tagWeight = weight;
      if (tagValue) existing.tagValue = tagValue;
      return this.userTagRelRepo.save(existing);
    }

    const rel = this.userTagRelRepo.create({
      userId,
      tagId,
      tagValue: tagValue || null,
      tagWeight: weight,
      source: 'manual',
    });
    return this.userTagRelRepo.save(rel);
  }

  async removeUserTag(userId: string, tagId: string): Promise<void> {
    await this.userTagRelRepo.softDelete({ userId, tagId });
  }

  async initializeTagLibrary(): Promise<UserTag[]> {
    const existingTags = await this.userTagRepo.find();
    if (existingTags.length > 0) {
      return existingTags;
    }

    const defaultTags: Partial<UserTag>[] = [
      { tagCode: 'age_young', tagName: '青年人群', tagCategory: 'basic', tagValueType: 'boolean', description: '年龄18-35岁' },
      { tagCode: 'age_middle', tagName: '中年人群', tagCategory: 'basic', tagValueType: 'boolean', description: '年龄36-55岁' },
      { tagCode: 'age_senior', tagName: '老年人群', tagCategory: 'basic', tagValueType: 'boolean', description: '年龄56岁以上' },
      { tagCode: 'has_children', tagName: '有子女', tagCategory: 'basic', tagValueType: 'boolean', description: '有子女的用户' },
      { tagCode: 'high_education', tagName: '高学历', tagCategory: 'basic', tagValueType: 'boolean', description: '本科及以上学历' },
      { tagCode: 'gov_worker', tagName: '公职人员', tagCategory: 'basic', tagValueType: 'boolean', description: '政府机关或事业单位人员' },
      { tagCode: 'high_income', tagName: '高收入', tagCategory: 'basic', tagValueType: 'boolean', description: '月收入2万以上' },
      { tagCode: 'house_owner', tagName: '有房产', tagCategory: 'basic', tagValueType: 'boolean', description: '自有住房' },
      { tagCode: 'car_owner', tagName: '有车族', tagCategory: 'basic', tagValueType: 'boolean', description: '拥有机动车' },
      { tagCode: 'retired', tagName: '退休人员', tagCategory: 'basic', tagValueType: 'boolean', description: '已退休' },
      { tagCode: 'chronic_patient', tagName: '慢性病患者', tagCategory: 'basic', tagValueType: 'boolean', description: '患有慢性病' },
      { tagCode: 'active_user', tagName: '活跃用户', tagCategory: 'behavior', tagValueType: 'boolean', description: '近7天访问5次以上' },
      { tagCode: 'service_searcher', tagName: '高频搜索', tagCategory: 'behavior', tagValueType: 'number', description: '搜索次数较多' },
      { tagCode: 'cert_follower', tagName: '证照关注者', tagCategory: 'preference', tagValueType: 'number', description: '关注证照服务' },
      { tagCode: 'policy_enthusiast', tagName: '政策爱好者', tagCategory: 'preference', tagValueType: 'number', description: '关注政策信息' },
    ];

    const created: UserTag[] = [];
    for (const tag of defaultTags) {
      const entity = this.userTagRepo.create(tag);
      created.push(await this.userTagRepo.save(entity));
    }
    this.logger.log(`标签库初始化完成，创建${created.length}个默认标签`);
    return created;
  }
}
