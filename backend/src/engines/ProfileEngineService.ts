import { Service } from 'typedi';
import logger, { auditLogger } from '../utils/logger';
import {
  CitizenProfile,
  BehaviorAction,
  BehaviorStats,
  CitizenTag,
  ReminderItem,
  ServiceCategory
} from '../../../shared/types';
import {
  generateCitizenTags,
  recommendPersonalizedServices,
  generateReminders,
  updateBehaviorStats
} from '../../../shared/utils/profile-engine';

interface BehaviorRecord {
  id: string;
  citizenId: string;
  action: BehaviorAction;
  serviceId?: string;
  serviceCategory?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

interface ProfileCacheEntry {
  profile: CitizenProfile;
  tags: CitizenTag[];
  recommendations: string[];
  reminders: ReminderItem[];
  lastUpdated: string;
  computationTime: number;
}

@Service()
export class ProfileEngineService {
  private static initialized = false;
  private static profileCache: Map<string, ProfileCacheEntry> = new Map();
  private static behaviorLogs: Map<string, BehaviorRecord[]> = new Map();
  private static profileComputationStats = {
    totalComputed: 0,
    avgComputationTime: 0,
    lastComputedAt: ''
  };

  static initialize(): void {
    if (this.initialized) return;

    logger.info('[ProfileEngine] 初始化市民画像引擎...');
    this.initialized = true;

    setInterval(() => {
      this.scheduledProfileRefresh().catch(err => {
        logger.error('[ProfileEngine] 定时刷新画像失败:', err);
      });
    }, 3600000);

    logger.info('[ProfileEngine] 市民画像引擎初始化完成');
  }

  static async getFullProfile(citizenId: string, forceRefresh = false): Promise<ProfileCacheEntry> {
    const cached = this.profileCache.get(citizenId);
    const shouldUseCache = cached && !forceRefresh &&
      (Date.now() - new Date(cached.lastUpdated).getTime() < 7200000);

    if (shouldUseCache) {
      logger.debug(`[ProfileEngine] 画像缓存命中: ${citizenId}`);
      return cached;
    }

    return this.computeAndCacheProfile(citizenId);
  }

  private static async computeAndCacheProfile(citizenId: string): Promise<ProfileCacheEntry> {
    const startTime = Date.now();
    logger.info(`[ProfileEngine] 开始计算用户画像: ${citizenId}`);

    const profile = await this.buildCitizenProfile(citizenId);
    const tags = generateCitizenTags(profile);
    const recommendations = recommendPersonalizedServices(profile);
    const reminders = generateReminders(profile);
    const computationTime = Date.now() - startTime;

    const entry: ProfileCacheEntry = {
      profile,
      tags,
      recommendations,
      reminders,
      lastUpdated: new Date().toISOString(),
      computationTime
    };

    this.profileCache.set(citizenId, entry);
    this.updateComputationStats(computationTime);

    auditLogger.systemEvent('profile_computed', {
      citizenId,
      tagCount: tags.length,
      recommendationCount: recommendations.length,
      reminderCount: reminders.length,
      computationTime: `${computationTime}ms`
    });

    logger.info(`[ProfileEngine] 画像计算完成`, {
      citizenId,
      tags: tags.length,
      recommendations: recommendations.length,
      computationTime: `${computationTime}ms`
    });

    return entry;
  }

  private static async buildCitizenProfile(citizenId: string): Promise<CitizenProfile> {
    const behaviorLogs = this.behaviorLogs.get(citizenId) || [];
    const recentBehavior = behaviorLogs.slice(-50);

    const behaviorStats: BehaviorStats = recentBehavior.reduce(
      (stats, record) => updateBehaviorStats(stats, record.action),
      {
        totalTransactions: 0,
        lastTransactionDate: '',
        categoryFrequency: {} as Record<ServiceCategory, number>,
        paymentFrequency: 0,
        averageRating: 4.5,
        searchKeywords: []
      }
    );

    const clickHeatmap = this.buildClickHeatmap(recentBehavior);

    return {
      id: citizenId,
      idCardNumber: '41010*********1234',
      name: this.generateMaskedName(citizenId),
      phone: '138****' + Math.floor(Math.random() * 9000 + 1000),
      age: 35,
      gender: 'male',
      district: 'zhengzhou',
      subDistrict: 'jinshui',
      householdType: 'local',
      familyStatus: 'with_children',
      employmentStatus: 'employed',
      educationLevel: 'bachelor',
      isRegistered: true,
      verifiedLevel: 'L3',
      behaviorStats,
      servicePreferences: {
        favoriteCategories: this.deriveFavoriteCategories(behaviorStats),
        clickHeatmap,
        usedServiceIds: recentBehavior
          .filter(r => r.serviceId)
          .map(r => r.serviceId as string),
        paymentHistory: [],
        preferredTimeSlot: this.derivePreferredTimeSlot(recentBehavior),
        notificationPreference: {
          pushEnabled: true,
          smsEnabled: true,
          categories: ['reminder', 'policy', 'payment']
        }
      },
      lifeEvents: this.deriveLifeEvents(citizenId, behaviorStats),
      tags: [],
      memberIds: [],
      createdAt: '2024-01-15T10:30:00Z',
      lastActiveAt: new Date().toISOString(),
      preferences: {
        highContrastMode: false,
        largeFontMode: false,
        voiceNavigation: false,
        notificationSettings: {
          pushEnabled: true,
          smsEnabled: true,
          emailEnabled: false,
          categories: []
        }
      }
    };
  }

  private static generateMaskedName(citizenId: string): string {
    const names = ['张**', '李**', '王**', '赵**', '陈**', '刘**', '杨**', '黄**', '周**', '吴**'];
    const index = Math.abs(citizenId.charCodeAt(0)) % names.length;
    return names[index];
  }

  private static buildClickHeatmap(behavior: BehaviorRecord[]): Record<string, number> {
    const heatmap: Record<string, number> = {};
    const hotZones = [
      'home_header', 'service_grid', 'reminder_zone',
      'policy_card', 'service_recommend', 'knowledge_entry',
      'tabbar_home', 'tabbar_service', 'tabbar_knowledge', 'tabbar_mine'
    ];

    for (const record of behavior) {
      const zone = (record.metadata?.zone as string) || 'service_grid';
      heatmap[zone] = (heatmap[zone] || 0) + 1;
    }

    if (Object.keys(heatmap).length === 0) {
      hotZones.forEach(zone => {
        heatmap[zone] = Math.floor(Math.random() * 100);
      });
    }

    return heatmap;
  }

  private static deriveFavoriteCategories(stats: BehaviorStats): ServiceCategory[] {
    const entries = Object.entries(stats.categoryFrequency) as [ServiceCategory, number][];
    entries.sort((a, b) => b[1] - a[1]);

    const favorites = entries.slice(0, 5).map(([cat]) => cat);

    if (favorites.length === 0) {
      return ['social_security', 'medical_insurance', 'housing_fund', 'education', 'household'];
    }
    return favorites;
  }

  private static derivePreferredTimeSlot(behavior: BehaviorRecord[]): 'morning' | 'afternoon' | 'evening' | 'weekend' {
    if (behavior.length === 0) return 'evening';

    const counts = { morning: 0, afternoon: 0, evening: 0, weekend: 0 };
    for (const record of behavior) {
      const date = new Date(record.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      if (day === 0 || day === 6) counts.weekend++;
      else if (hour < 12) counts.morning++;
      else if (hour < 18) counts.afternoon++;
      else counts.evening++;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0] as any;
  }

  private static deriveLifeEvents(citizenId: string, stats: BehaviorStats): string[] {
    const events: string[] = [];
    const hasMedical = (stats.categoryFrequency as any).medical_insurance > 0;
    const hasEdu = (stats.categoryFrequency as any).education > 0;
    const hasHouse = (stats.categoryFrequency as any).household > 0;

    if (Math.random() > 0.3 || hasMedical) events.push('newborn_registration');
    if (Math.random() > 0.4 || hasEdu) events.push('school_enrollment');
    if (Math.random() > 0.5 || hasHouse) events.push('house_purchase');
    if (Math.random() > 0.6) events.push('retirement_planning');
    if (Math.random() > 0.7) events.push('business_startup');

    return events;
  }

  static async recordBehavior(
    citizenId: string,
    action: BehaviorAction,
    options?: { serviceId?: string; serviceCategory?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    const record: BehaviorRecord = {
      id: `BEH-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      citizenId,
      action,
      serviceId: options?.serviceId,
      serviceCategory: options?.serviceCategory,
      metadata: options?.metadata || {},
      timestamp: new Date().toISOString()
    };

    if (!this.behaviorLogs.has(citizenId)) {
      this.behaviorLogs.set(citizenId, []);
    }
    this.behaviorLogs.get(citizenId)!.push(record);

    const logs = this.behaviorLogs.get(citizenId)!;
    const maxLogs = 1000;
    if (logs.length > maxLogs) {
      this.behaviorLogs.set(citizenId, logs.slice(-maxLogs));
    }

    const cached = this.profileCache.get(citizenId);
    if (cached) {
      cached.profile.lastActiveAt = new Date().toISOString();
    }

    auditLogger.citizenAction(citizenId, 'behavior_record', options?.serviceId || action);
  }

  static async getBehaviorTrend(
    citizenId: string,
    periodDays: number = 30
  ): Promise<{ date: string; actionCount: number; categoryBreakdown: Record<string, number> }[]> {
    const logs = this.behaviorLogs.get(citizenId) || [];
    const cutoff = Date.now() - periodDays * 86400000;

    const filtered = logs.filter(l => new Date(l.timestamp).getTime() >= cutoff);
    const dailyStats = new Map<string, { count: number; categories: Record<string, number> }>();

    for (const record of filtered) {
      const date = record.timestamp.substring(0, 10);
      const cat = record.serviceCategory || 'other';

      if (!dailyStats.has(date)) {
        dailyStats.set(date, { count: 0, categories: {} });
      }
      const day = dailyStats.get(date)!;
      day.count++;
      day.categories[cat] = (day.categories[cat] || 0) + 1;
    }

    const result: any[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const stat = dailyStats.get(dateStr) || { count: 0, categories: {} };
      result.push({ date: dateStr, actionCount: stat.count, categoryBreakdown: stat.categories });
    }

    return result;
  }

  static async getUserTags(citizenId: string): Promise<{ profile: CitizenProfile; tags: CitizenTag[] }> {
    const entry = await this.getFullProfile(citizenId);
    return { profile: entry.profile, tags: entry.tags };
  }

  static async getRecommendations(citizenId: string): Promise<{
    serviceIds: string[];
    reminders: ReminderItem[];
    matchedPolicies: { policyId: string; matchScore: number; reasons: string[] }[];
  }> {
    const entry = await this.getFullProfile(citizenId);
    return {
      serviceIds: entry.recommendations,
      reminders: entry.reminders,
      matchedPolicies: entry.tags
        .filter(t => t.category === 'preference')
        .slice(0, 3)
        .map((tag, i) => ({
          policyId: `POLICY-${1001 + i}`,
          matchScore: Math.round(0.7 + tag.weight * 0.25),
          reasons: [`画像标签匹配：${tag.name}`, `生活事件关联`, `近期行为高频访问`]
        }))
    };
  }

  static async dismissReminder(citizenId: string, reminderId: string): Promise<boolean> {
    const entry = this.profileCache.get(citizenId);
    if (!entry) return false;

    entry.reminders = entry.reminders.filter(r => r.id !== reminderId);
    auditLogger.citizenAction(citizenId, 'reminder_dismiss', reminderId);
    return true;
  }

  static async updateUserPreferences(
    citizenId: string,
    preferences: Partial<CitizenProfile['preferences']>
  ): Promise<ProfileCacheEntry> {
    const entry = await this.getFullProfile(citizenId);
    entry.profile.preferences = { ...entry.profile.preferences, ...preferences };
    entry.lastUpdated = new Date().toISOString();
    this.profileCache.set(citizenId, entry);
    return entry;
  }

  private static async scheduledProfileRefresh(): Promise<void> {
    logger.info('[ProfileEngine] 开始定时画像批量刷新...');
    const citizenIds = Array.from(this.profileCache.keys());
    let refreshed = 0;

    for (const citizenId of citizenIds) {
      try {
        await this.computeAndCacheProfile(citizenId);
        refreshed++;
      } catch (err) {
        logger.error(`[ProfileEngine] 刷新画像[${citizenId}]失败:`, (err as Error).message);
      }
    }

    logger.info(`[ProfileEngine] 定时刷新完成，共更新 ${refreshed}/${citizenIds.length} 份画像`);
  }

  private static updateComputationStats(computationTime: number): void {
    const { totalComputed, avgComputationTime } = this.profileComputationStats;
    const total = totalComputed + 1;
    this.profileComputationStats = {
      totalComputed: total,
      avgComputationTime: Math.round((avgComputationTime * totalComputed + computationTime) / total),
      lastComputedAt: new Date().toISOString()
    };
  }

  static getEngineStats() {
    return {
      ...this.profileComputationStats,
      cachedProfiles: this.profileCache.size,
      totalBehaviorRecords: Array.from(this.behaviorLogs.values()).reduce((s, a) => s + a.length, 0)
    };
  }
}

export default ProfileEngineService;
