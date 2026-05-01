import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export enum TagType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  SYSTEM = 'SYSTEM',
}

export enum TagCategory {
  DEMOGRAPHIC = 'DEMOGRAPHIC',
  BEHAVIORAL = 'BEHAVIORAL',
  PREFERENCE = 'PREFERENCE',
  ENGAGEMENT = 'ENGAGEMENT',
  PURCHASE = 'PURCHASE',
  CUSTOM = 'CUSTOM',
}

export enum AttributeType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
  ARRAY = 'ARRAY',
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  type: TagType;
  category: TagCategory;
  color?: string;
  isActive: boolean;
  autoRule?: AutoTagRule;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoTagRule {
  conditions: TagCondition[];
  operator: 'AND' | 'OR';
  removeWhenNoLongerMatch: boolean;
}

export interface TagCondition {
  field: string;
  operator: TagConditionOperator;
  value: unknown;
}

export enum TagConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IN = 'in',
  NOT_IN = 'not_in',
}

export interface ProfileAttribute {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: AttributeType;
  enumValues?: string[];
  isSystem: boolean;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  defaultValue?: unknown;
  category: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudienceFilter {
  id: string;
  name: string;
  description?: string;
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
  isDynamic: boolean;
  lastCalculatedAt?: Date;
  estimatedCount: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterCondition {
  type: 'attribute' | 'tag' | 'engagement' | 'custom';
  field?: string;
  tagId?: string;
  operator: TagConditionOperator;
  value: unknown;
}

export interface ProfileEngagementMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  bounceRate: number;
  
  lastOpenAt?: Date;
  lastClickAt?: Date;
  lastSendAt?: Date;
  
  engagementScore: number;
  engagementCategory: 'high' | 'medium' | 'low' | 'inactive';
  
  daysSinceLastActivity: number;
  averageOpenInterval: number;
  preferredOpenHour: number;
}

export interface ProfileDetail {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  country?: string;
  city?: string;
  
  isSubscribed: boolean;
  subscribedAt?: Date;
  unsubscribedAt?: Date;
  
  tags: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    color?: string;
    assignedAt: Date;
  }>;
  
  attributes: Record<string, {
    value: unknown;
    type: string;
    lastUpdatedAt: Date;
    source?: string;
  }>;
  
  engagement: ProfileEngagementMetrics;
  
  customFields: Record<string, unknown>;
  
  activityTimeline: Array<{
    id: string;
    type: string;
    subject?: string;
    campaignId?: string;
    campaignName?: string;
    timestamp: Date;
    details?: Record<string, unknown>;
  }>;
  
  audienceMemberships: Array<{
    audienceId: string;
    audienceName: string;
    joinedAt: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

class UserProfileEngine {
  
  private readonly SYSTEM_TAGS = [
    { key: 'active_subscriber', name: '活跃订阅者', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '在过去30天内有打开或点击行为的订阅者' },
    { key: 'inactive_subscriber', name: '不活跃订阅者', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '超过90天没有打开或点击行为的订阅者' },
    { key: 'high_engager', name: '高活跃用户', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '打开率超过40%的用户' },
    { key: 'clicker', name: '点击者', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '有点击行为的用户' },
    { key: 'new_subscriber', name: '新订阅者', category: TagCategory.DEMOGRAPHIC, type: TagType.SYSTEM, description: '过去7天内订阅的用户' },
    { key: 'unsubscribed', name: '已退订', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '已退订的用户' },
    { key: 'bounced', name: '退信用户', category: TagCategory.ENGAGEMENT, type: TagType.SYSTEM, description: '有硬退信记录的用户' },
  ];
  
  private readonly SYSTEM_ATTRIBUTES = [
    { key: 'gender', name: '性别', type: AttributeType.ENUM, enumValues: ['male', 'female', 'unknown'], category: '人口统计' },
    { key: 'age_group', name: '年龄段', type: AttributeType.ENUM, enumValues: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'], category: '人口统计' },
    { key: 'income_level', name: '收入水平', type: AttributeType.ENUM, enumValues: ['low', 'medium', 'high'], category: '人口统计' },
    { key: 'member_level', name: '会员等级', type: AttributeType.ENUM, enumValues: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], category: '购买' },
    { key: 'lifetime_value', name: '终身价值', type: AttributeType.NUMBER, category: '购买' },
    { key: 'purchase_count', name: '购买次数', type: AttributeType.NUMBER, category: '购买' },
    { key: 'last_purchase_at', name: '最后购买时间', type: AttributeType.DATE, category: '购买' },
    { key: 'preferred_category', name: '偏好品类', type: AttributeType.STRING, category: '偏好' },
    { key: 'preferred_brand', name: '偏好品牌', type: AttributeType.STRING, category: '偏好' },
    { key: 'marketing_consent', name: '营销许可', type: AttributeType.BOOLEAN, category: '系统' },
    { key: 'source_channel', name: '来源渠道', type: AttributeType.ENUM, enumValues: ['website', 'social', 'referral', 'import', 'api', 'other'], category: '系统' },
    { key: 'language', name: '语言', type: AttributeType.ENUM, enumValues: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], category: '系统' },
  ];
  
  async initSystemTags(): Promise<void> {
    for (const tag of this.SYSTEM_TAGS) {
      const existing = await prisma.$queryRaw`
        SELECT id FROM tags WHERE key = ${tag.key} AND type = 'SYSTEM'::tag_type
      ` as Array<{ id: string }>;
      
      if (existing.length === 0) {
        try {
          await prisma.$executeRaw`
            INSERT INTO tags (id, key, name, description, type, category, "isActive", "createdAt", "updatedAt")
            VALUES (
              ${uuidv4()},
              ${tag.key},
              ${tag.name},
              ${tag.description || null},
              ${tag.type}::tag_type,
              ${tag.category}::tag_category,
              true,
              NOW(),
              NOW()
            )
          `;
          logger.info(`Created system tag: ${tag.name}`);
        } catch (error) {
          logger.error(`Failed to create system tag ${tag.name}:`, error);
        }
      }
    }
  }
  
  async getTagById(tagId: string): Promise<Tag | null> {
    const results = await prisma.$queryRaw`
      SELECT t.*, COUNT(DISTINCT tm."memberId") as "memberCount"
      FROM tags t
      LEFT JOIN "tagMemberships" tm ON t.id = tm."tagId"
      WHERE t.id = ${tagId}
      GROUP BY t.id
    ` as Array<Tag & { memberCount: number }>;
    
    if (results.length === 0) return null;
    
    return {
      ...results[0],
      memberCount: Number(results[0].memberCount || 0),
    };
  }
  
  async getTags(filters?: {
    category?: TagCategory;
    type?: TagType;
    search?: string;
    isActive?: boolean;
  }): Promise<Tag[]> {
    let query = `
      SELECT t.*, COUNT(DISTINCT tm."memberId") as "memberCount"
      FROM tags t
      LEFT JOIN "tagMemberships" tm ON t.id = tm."tagId"
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (filters?.category) {
      params.push(filters.category);
      query += ` AND t.category = $${params.length}::tag_category`;
    }
    
    if (filters?.type) {
      params.push(filters.type);
      query += ` AND t.type = $${params.length}::tag_type`;
    }
    
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }
    
    if (filters?.isActive !== undefined) {
      params.push(filters.isActive);
      query += ` AND t."isActive" = $${params.length}`;
    }
    
    query += ` GROUP BY t.id ORDER BY t."createdAt" DESC`;
    
    const results = await prisma.$queryRawUnsafe(query, ...params) as Array<Tag & { memberCount: number }>;
    
    return results.map(r => ({
      ...r,
      memberCount: Number(r.memberCount || 0),
    }));
  }
  
  async createTag(data: {
    name: string;
    description?: string;
    type: TagType;
    category: TagCategory;
    color?: string;
    autoRule?: AutoTagRule;
  }): Promise<Tag> {
    const id = uuidv4();
    
    await prisma.$executeRaw`
      INSERT INTO tags (id, name, description, type, category, color, "autoRule", "isActive", "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${data.name},
        ${data.description || null},
        ${data.type}::tag_type,
        ${data.category}::tag_category,
        ${data.color || null},
        ${data.autoRule ? JSON.stringify(data.autoRule) : null}::jsonb,
        true,
        NOW(),
        NOW()
      )
    `;
    
    return this.getTagById(id) as Promise<Tag>;
  }
  
  async assignTagToMember(tagId: string, memberId: string, source: string = 'manual'): Promise<void> {
    const existing = await prisma.$queryRaw`
      SELECT id FROM "tagMemberships" WHERE "tagId" = ${tagId} AND "memberId" = ${memberId}
    ` as Array<{ id: string }>;
    
    if (existing.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO "tagMemberships" (id, "tagId", "memberId", source, "createdAt", "updatedAt")
        VALUES (${uuidv4()}, ${tagId}, ${memberId}, ${source}, NOW(), NOW())
      `;
      
      await this.updateSystemTagsForMember(memberId);
    }
  }
  
  async removeTagFromMember(tagId: string, memberId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM "tagMemberships" WHERE "tagId" = ${tagId} AND "memberId" = ${memberId}
    `;
    
    await this.updateSystemTagsForMember(memberId);
  }
  
  private async updateSystemTagsForMember(memberId: string): Promise<void> {
    const memberResults = await prisma.$queryRaw`
      SELECT am.*, 
             (SELECT COUNT(*) FROM "sendLogs" sl WHERE sl."memberId" = am.id AND sl.status = 'OPENED') as open_count,
             (SELECT COUNT(*) FROM "sendLogs" sl WHERE sl."memberId" = am.id AND sl.status = 'CLICKED') as click_count,
             (SELECT COUNT(*) FROM "sendLogs" sl WHERE sl."memberId" = am.id) as send_count,
             (SELECT MAX("createdAt") FROM "sendLogs" sl WHERE sl."memberId" = am.id AND sl.status IN ('OPENED', 'CLICKED')) as last_activity_at
      FROM "audienceMembers" am
      WHERE am.id = ${memberId}
    ` as Array<{
      id: string;
      isSubscribed: boolean;
      subscribedAt?: Date;
      open_count: number;
      click_count: number;
      send_count: number;
      last_activity_at?: Date;
    }>;
    
    if (memberResults.length === 0) return;
    
    const member = memberResults[0];
    const openRate = member.send_count > 0 ? (member.open_count / member.send_count) * 100 : 0;
    const daysSinceActivity = member.last_activity_at 
      ? Math.floor((Date.now() - new Date(member.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const daysSinceSubscribed = member.subscribedAt
      ? Math.floor((Date.now() - new Date(member.subscribedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const tagsToAssign: string[] = [];
    const tagsToRemove: string[] = [];
    
    if (member.isSubscribed) {
      if (daysSinceActivity <= 30) {
        tagsToAssign.push('active_subscriber');
        tagsToRemove.push('inactive_subscriber');
      } else if (daysSinceActivity > 90) {
        tagsToAssign.push('inactive_subscriber');
        tagsToRemove.push('active_subscriber');
      }
      
      if (openRate > 40) {
        tagsToAssign.push('high_engager');
      }
      
      if (member.click_count > 0) {
        tagsToAssign.push('clicker');
      }
      
      if (daysSinceSubscribed <= 7) {
        tagsToAssign.push('new_subscriber');
      }
      
      tagsToRemove.push('unsubscribed');
    } else {
      tagsToAssign.push('unsubscribed');
      tagsToRemove.push('active_subscriber', 'inactive_subscriber', 'high_engager', 'clicker', 'new_subscriber');
    }
    
    for (const tagKey of tagsToAssign) {
      const tagResults = await prisma.$queryRaw`
        SELECT id FROM tags WHERE key = ${tagKey} AND type = 'SYSTEM'::tag_type
      ` as Array<{ id: string }>;
      
      if (tagResults.length > 0) {
        await this.assignTagToMember(tagResults[0].id, memberId, 'system');
      }
    }
    
    for (const tagKey of tagsToRemove) {
      const tagResults = await prisma.$queryRaw`
        SELECT id FROM tags WHERE key = ${tagKey} AND type = 'SYSTEM'::tag_type
      ` as Array<{ id: string }>;
      
      if (tagResults.length > 0) {
        await this.removeTagFromMember(tagResults[0].id, memberId);
      }
    }
  }
  
  async getProfileDetail(memberId: string): Promise<ProfileDetail | null> {
    const memberResults = await prisma.$queryRaw`
      SELECT * FROM "audienceMembers" WHERE id = ${memberId}
    ` as Array<{
      id: string;
      email: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
      position?: string;
      country?: string;
      city?: string;
      isSubscribed: boolean;
      subscribedAt?: Date;
      unsubscribedAt?: Date;
      tags: unknown;
      profileData: Record<string, unknown>;
      customFields: Record<string, unknown>;
      totalOpens: number;
      totalClicks: number;
      totalSent: number;
      lastActivityAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }>;
    
    if (memberResults.length === 0) return null;
    
    const member = memberResults[0];
    
    const tagResults = await prisma.$queryRaw`
      SELECT t.id, t.name, t.category, t.type, t.color, tm."createdAt" as "assignedAt"
      FROM "tagMemberships" tm
      JOIN tags t ON tm."tagId" = t.id
      WHERE tm."memberId" = ${memberId}
      ORDER BY tm."createdAt" DESC
    ` as Array<{
      id: string;
      name: string;
      category: string;
      type: string;
      color?: string;
      assignedAt: Date;
    }>;
    
    const sendLogs = await prisma.$queryRaw`
      SELECT sl.*, c.name as "campaignName"
      FROM "sendLogs" sl
      LEFT JOIN campaigns c ON sl."campaignId" = c.id
      WHERE sl."memberId" = ${memberId}
      ORDER BY sl."createdAt" DESC
      LIMIT 100
    ` as Array<{
      id: string;
      status: string;
      subject?: string;
      campaignId?: string;
      campaignName?: string;
      createdAt: Date;
      sentAt?: Date;
      openedAt?: Date;
      clickedAt?: Date;
      bouncedAt?: Date;
      unsubscribedAt?: Date;
    }>;
    
    const totalDelivered = sendLogs.filter(l => l.status === 'DELIVERED' || l.status === 'OPENED' || l.status === 'CLICKED').length;
    const totalOpened = sendLogs.filter(l => l.openedAt).length;
    const totalClicked = sendLogs.filter(l => l.clickedAt).length;
    const totalBounced = sendLogs.filter(l => l.bouncedAt).length;
    const totalUnsubscribed = sendLogs.filter(l => l.unsubscribedAt).length;
    
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    const deliveryRate = member.totalSent > 0 ? (totalDelivered / member.totalSent) * 100 : 0;
    const bounceRate = member.totalSent > 0 ? (totalBounced / member.totalSent) * 100 : 0;
    
    const lastOpen = sendLogs.find(l => l.openedAt);
    const lastClick = sendLogs.find(l => l.clickedAt);
    const lastSend = sendLogs[0];
    
    const openHours = sendLogs
      .filter(l => l.openedAt)
      .map(l => new Date(l.openedAt!).getHours());
    
    const preferredOpenHour = openHours.length > 0
      ? openHours.reduce((a, b, i, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      : 10;
    
    let engagementScore = 0;
    engagementScore += Math.min(openRate * 0.4, 40);
    engagementScore += Math.min(clickRate * 0.6, 30);
    
    const daysSinceActivity = member.lastActivityAt
      ? Math.floor((Date.now() - new Date(member.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceActivity <= 7) engagementScore += 20;
    else if (daysSinceActivity <= 30) engagementScore += 15;
    else if (daysSinceActivity <= 60) engagementScore += 10;
    else engagementScore += 5;
    
    if (member.totalSent > 5) engagementScore += 10;
    else if (member.totalSent > 0) engagementScore += 5;
    
    let engagementCategory: 'high' | 'medium' | 'low' | 'inactive' = 'low';
    if (engagementScore >= 70) engagementCategory = 'high';
    else if (engagementScore >= 40) engagementCategory = 'medium';
    else if (engagementScore >= 20) engagementCategory = 'low';
    else engagementCategory = 'inactive';
    
    const activityTimeline: ProfileDetail['activityTimeline'] = [];
    
    for (const log of sendLogs) {
      if (log.unsubscribedAt) {
        activityTimeline.push({
          id: log.id,
          type: 'unsubscribe',
          subject: log.subject,
          campaignId: log.campaignId,
          campaignName: log.campaignName,
          timestamp: log.unsubscribedAt,
        });
      }
      if (log.clickedAt) {
        activityTimeline.push({
          id: log.id,
          type: 'click',
          subject: log.subject,
          campaignId: log.campaignId,
          campaignName: log.campaignName,
          timestamp: log.clickedAt,
        });
      }
      if (log.openedAt) {
        activityTimeline.push({
          id: log.id,
          type: 'open',
          subject: log.subject,
          campaignId: log.campaignId,
          campaignName: log.campaignName,
          timestamp: log.openedAt,
        });
      }
      if (log.sentAt) {
        activityTimeline.push({
          id: log.id,
          type: 'send',
          subject: log.subject,
          campaignId: log.campaignId,
          campaignName: log.campaignName,
          timestamp: log.sentAt,
        });
      }
    }
    
    activityTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const audienceMemberships = await prisma.$queryRaw`
      SELECT a.id, a.name, am."createdAt" as "joinedAt"
      FROM "audienceMembers" am
      JOIN audiences a ON am."audienceId" = a.id
      WHERE am.id = ${memberId}
    ` as Array<{
      audienceId: string;
      audienceName: string;
      joinedAt: Date;
    }>;
    
    const attributes: ProfileDetail['attributes'] = {};
    const profileData = member.profileData || {};
    for (const [key, value] of Object.entries(profileData)) {
      attributes[key] = {
        value,
        type: typeof value,
        lastUpdatedAt: member.updatedAt,
        source: 'profile_data',
      };
    }
    
    return {
      id: member.id,
      email: member.email,
      name: member.name,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      company: member.company,
      position: member.position,
      country: member.country,
      city: member.city,
      
      isSubscribed: member.isSubscribed,
      subscribedAt: member.subscribedAt,
      unsubscribedAt: member.unsubscribedAt,
      
      tags: tagResults.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        type: t.type,
        color: t.color || undefined,
        assignedAt: t.assignedAt,
      })),
      
      attributes,
      
      engagement: {
        totalSent: member.totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        totalUnsubscribed,
        
        openRate,
        clickRate,
        deliveryRate,
        bounceRate,
        
        lastOpenAt: lastOpen?.openedAt,
        lastClickAt: lastClick?.clickedAt,
        lastSendAt: lastSend?.sentAt,
        
        engagementScore: Math.round(engagementScore),
        engagementCategory,
        
        daysSinceLastActivity: daysSinceActivity,
        averageOpenInterval: 0,
        preferredOpenHour,
      },
      
      customFields: member.customFields || {},
      
      activityTimeline: activityTimeline.slice(0, 50),
      
      audienceMemberships: audienceMemberships.map(a => ({
        audienceId: a.audienceId,
        audienceName: a.audienceName,
        joinedAt: a.joinedAt,
      })),
      
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
  
  async getMemberTags(memberId: string): Promise<Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    color?: string;
    assignedAt: Date;
    source?: string;
  }>> {
    const results = await prisma.$queryRaw`
      SELECT t.id, t.name, t.category, t.type, t.color, tm."createdAt" as "assignedAt", tm.source
      FROM "tagMemberships" tm
      JOIN tags t ON tm."tagId" = t.id
      WHERE tm."memberId" = ${memberId}
      ORDER BY tm."createdAt" DESC
    `;
    
    return results as Array<{
      id: string;
      name: string;
      category: string;
      type: string;
      color?: string;
      assignedAt: Date;
      source?: string;
    }>;
  }
  
  async getProfileAttribute(attributeId: string): Promise<ProfileAttribute | null> {
    const results = await prisma.$queryRaw`
      SELECT pa.*, COUNT(DISTINCT am.id) as "memberCount"
      FROM "profileAttributes" pa
      LEFT JOIN "audienceMembers" am ON am."profileData" @> jsonb_build_object(pa.key, '{}'::jsonb)
      WHERE pa.id = ${attributeId}
      GROUP BY pa.id
    ` as Array<ProfileAttribute & { memberCount: number }>;
    
    if (results.length === 0) return null;
    
    return {
      ...results[0],
      memberCount: Number(results[0].memberCount || 0),
    };
  }
  
  async createProfileAttribute(data: {
    key: string;
    name: string;
    description?: string;
    type: AttributeType;
    enumValues?: string[];
    isRequired?: boolean;
    isSearchable?: boolean;
    isFilterable?: boolean;
    defaultValue?: unknown;
    category?: string;
  }): Promise<ProfileAttribute> {
    const id = uuidv4();
    
    await prisma.$executeRaw`
      INSERT INTO "profileAttributes" (
        id, key, name, description, type, "enumValues", "isSystem", "isRequired", 
        "isSearchable", "isFilterable", "defaultValue", category, "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${data.key},
        ${data.name},
        ${data.description || null},
        ${data.type}::attribute_type,
        ${data.enumValues ? JSON.stringify(data.enumValues) : null}::jsonb,
        false,
        ${data.isRequired || false},
        ${data.isSearchable !== false},
        ${data.isFilterable !== false},
        ${data.defaultValue ? JSON.stringify(data.defaultValue) : null}::jsonb,
        ${data.category || '自定义'},
        NOW(),
        NOW()
      )
    `;
    
    return this.getProfileAttribute(id) as Promise<ProfileAttribute>;
  }
  
  async updateMemberAttribute(memberId: string, key: string, value: unknown, source: string = 'manual'): Promise<void> {
    const member = await prisma.$queryRaw`
      SELECT "profileData" FROM "audienceMembers" WHERE id = ${memberId}
    ` as Array<{ profileData: Record<string, unknown> }>;
    
    if (member.length === 0) return;
    
    const currentProfile = member[0].profileData || {};
    const updatedProfile = {
      ...currentProfile,
      [key]: value,
    };
    
    await prisma.$executeRaw`
      UPDATE "audienceMembers" 
      SET "profileData" = ${JSON.stringify(updatedProfile)}::jsonb, "updatedAt" = NOW()
      WHERE id = ${memberId}
    `;
    
    await this.updateSystemTagsForMember(memberId);
  }
  
  async evaluateFilter(filter: AudienceFilter): Promise<{
    matches: string[];
    count: number;
    explanation: string;
  }> {
    const explanations: string[] = [];
    explanations.push('【受众筛选引擎 - 计算依据说明】');
    explanations.push('');
    explanations.push(`筛选条件: ${filter.name}`);
    explanations.push(`逻辑运算符: ${filter.operator}`);
    explanations.push(`是否动态: ${filter.isDynamic ? '是' : '否'}`);
    explanations.push('');
    
    let baseQuery = `
      SELECT DISTINCT am.id, am.email, am.name, am."isSubscribed", am."totalSent", am."totalOpens", am."totalClicks", am."lastActivityAt"
      FROM "audienceMembers" am
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let conditionIndex = 1;
    
    for (const condition of filter.conditions) {
      let conditionSql = '';
      
      switch (condition.type) {
        case 'tag': {
          const logic = filter.operator === 'AND' ? 'AND' : 'OR';
          if (condition.operator === TagConditionOperator.EQUALS) {
            params.push(condition.tagId);
            conditionSql = ` ${logic} EXISTS (
              SELECT 1 FROM "tagMemberships" tm WHERE tm."memberId" = am.id AND tm."tagId" = $${params.length}
            )`;
            explanations.push(`  - 条件: 标签 = ${condition.tagId}`);
          } else if (condition.operator === TagConditionOperator.NOT_EQUALS) {
            params.push(condition.tagId);
            conditionSql = ` ${logic} NOT EXISTS (
              SELECT 1 FROM "tagMemberships" tm WHERE tm."memberId" = am.id AND tm."tagId" = $${params.length}
            )`;
            explanations.push(`  - 条件: 标签 != ${condition.tagId}`);
          }
          break;
        }
        
        case 'engagement': {
          const logic = filter.operator === 'AND' ? 'AND' : 'OR';
          const field = condition.field || '';
          
          switch (field) {
            case 'totalSent':
              params.push(condition.value);
              conditionSql = ` ${logic} am."totalSent" ${this.getOperatorSql(condition.operator)} $${params.length}`;
              break;
            case 'totalOpens':
              params.push(condition.value);
              conditionSql = ` ${logic} am."totalOpens" ${this.getOperatorSql(condition.operator)} $${params.length}`;
              break;
            case 'totalClicks':
              params.push(condition.value);
              conditionSql = ` ${logic} am."totalClicks" ${this.getOperatorSql(condition.operator)} $${params.length}`;
              break;
            case 'openRate': {
              const rateValue = Number(condition.value);
              params.push(rateValue);
              if (condition.operator === TagConditionOperator.GREATER_THAN) {
                conditionSql = ` ${logic} (am."totalOpens"::decimal / NULLIF(am."totalSent", 0)) * 100 > $${params.length}`;
              } else if (condition.operator === TagConditionOperator.LESS_THAN) {
                conditionSql = ` ${logic} (am."totalOpens"::decimal / NULLIF(am."totalSent", 0)) * 100 < $${params.length}`;
              }
              break;
            }
            case 'clickRate': {
              const rateValue = Number(condition.value);
              params.push(rateValue);
              if (condition.operator === TagConditionOperator.GREATER_THAN) {
                conditionSql = ` ${logic} (am."totalClicks"::decimal / NULLIF(am."totalOpens", 0)) * 100 > $${params.length}`;
              } else if (condition.operator === TagConditionOperator.LESS_THAN) {
                conditionSql = ` ${logic} (am."totalClicks"::decimal / NULLIF(am."totalOpens", 0)) * 100 < $${params.length}`;
              }
              break;
            }
            case 'daysSinceLastActivity': {
              const days = Number(condition.value);
              if (condition.operator === TagConditionOperator.GREATER_THAN) {
                conditionSql = ` ${logic} (am."lastActivityAt" IS NULL OR EXTRACT(DAY FROM NOW() - am."lastActivityAt") > ${days})`;
              } else if (condition.operator === TagConditionOperator.LESS_THAN) {
                conditionSql = ` ${logic} (am."lastActivityAt" IS NOT NULL AND EXTRACT(DAY FROM NOW() - am."lastActivityAt") < ${days})`;
              }
              break;
            }
            case 'isSubscribed':
              conditionSql = ` ${logic} am."isSubscribed" = ${Boolean(condition.value)}`;
              break;
          }
          
          if (conditionSql) {
            explanations.push(`  - 条件: 互动属性 ${field} ${condition.operator} ${condition.value}`);
          }
          break;
        }
        
        case 'attribute': {
          const logic = filter.operator === 'AND' ? 'AND' : 'OR';
          const key = condition.field || '';
          
          params.push(key);
          
          if (condition.operator === TagConditionOperator.EQUALS) {
            params.push(JSON.stringify(condition.value));
            conditionSql = ` ${logic} am."profileData" @> jsonb_build_object($${params.length - 1}, $${params.length}::jsonb)`;
          } else if (condition.operator === TagConditionOperator.CONTAINS) {
            conditionSql = ` ${logic} am."profileData" ? $${params.length}`;
          }
          
          if (conditionSql) {
            explanations.push(`  - 条件: 画像属性 ${key} ${condition.operator} ${condition.value}`);
          }
          break;
        }
      }
      
      if (conditionSql && conditionIndex > 0) {
        baseQuery += conditionSql;
      }
      conditionIndex++;
    }
    
    baseQuery += ' ORDER BY am."createdAt" DESC';
    
    explanations.push('');
    explanations.push(`执行查询时间: ${new Date().toISOString()}`);
    
    try {
      const results = await prisma.$queryRawUnsafe(baseQuery, ...params) as Array<{ id: string; email: string }>;
      
      explanations.push('');
      explanations.push(`匹配结果: ${results.length} 个用户`);
      
      if (results.length > 0) {
        explanations.push('');
        explanations.push('匹配用户示例:');
        results.slice(0, 10).forEach((r, i) => {
          explanations.push(`  ${i + 1}. ${r.email}`);
        });
        if (results.length > 10) {
          explanations.push(`  ... 还有 ${results.length - 10} 个用户`);
        }
      }
      
      return {
        matches: results.map(r => r.id),
        count: results.length,
        explanation: explanations.join('\n'),
      };
    } catch (error) {
      logger.error('Filter evaluation failed:', error);
      explanations.push('');
      explanations.push(`错误: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        matches: [],
        count: 0,
        explanation: explanations.join('\n'),
      };
    }
  }
  
  private getOperatorSql(operator: TagConditionOperator): string {
    switch (operator) {
      case TagConditionOperator.EQUALS: return '=';
      case TagConditionOperator.NOT_EQUALS: return '!=';
      case TagConditionOperator.GREATER_THAN: return '>';
      case TagConditionOperator.LESS_THAN: return '<';
      case TagConditionOperator.GREATER_THAN_OR_EQUAL: return '>=';
      case TagConditionOperator.LESS_THAN_OR_EQUAL: return '<=';
      default: return '=';
    }
  }
}

export const userProfileEngine = new UserProfileEngine();
export default userProfileEngine;
