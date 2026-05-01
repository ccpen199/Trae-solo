import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  TagConditionOperator, 
  AudienceFilter, 
  FilterCondition 
} from './user-profile.engine';

export enum FilterGroupOperator {
  AND = 'AND',
  OR = 'OR',
}

export interface FilterRule {
  id: string;
  type: 'attribute' | 'tag' | 'engagement' | 'activity' | 'demographic' | 'custom';
  field: string;
  operator: TagConditionOperator;
  value: unknown;
  label?: string;
}

export interface FilterGroup {
  id: string;
  operator: FilterGroupOperator;
  rules: FilterRule[];
  groups: FilterGroup[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  filterGroup: FilterGroup;
  isDynamic: boolean;
  lastCalculatedAt?: Date;
  estimatedCount: number;
  actualCount: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentEvaluationResult {
  success: boolean;
  memberIds: string[];
  count: number;
  explanation: string;
  statistics: {
    totalEvaluated: number;
    totalMatched: number;
    ruleBreakdown: Array<{
      rule: string;
      matched: number;
      percentage: number;
    }>;
  };
}

export const FIELD_METADATA: Record<string, {
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  category: string;
  options?: Array<{ value: string; label: string }>;
  supportedOperators: TagConditionOperator[];
}> = {
  email: {
    label: '邮箱',
    type: 'string',
    category: '基础信息',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.CONTAINS,
      TagConditionOperator.NOT_CONTAINS,
      TagConditionOperator.STARTS_WITH,
      TagConditionOperator.ENDS_WITH,
    ],
  },
  name: {
    label: '姓名',
    type: 'string',
    category: '基础信息',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.CONTAINS,
      TagConditionOperator.NOT_CONTAINS,
    ],
  },
  company: {
    label: '公司',
    type: 'string',
    category: '基础信息',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.CONTAINS,
    ],
  },
  country: {
    label: '国家',
    type: 'string',
    category: '地理信息',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.IN,
    ],
  },
  city: {
    label: '城市',
    type: 'string',
    category: '地理信息',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.CONTAINS,
    ],
  },
  isSubscribed: {
    label: '订阅状态',
    type: 'boolean',
    category: '订阅状态',
    supportedOperators: [
      TagConditionOperator.EQUALS,
    ],
  },
  totalSent: {
    label: '发送总数',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  totalOpens: {
    label: '打开总数',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  totalClicks: {
    label: '点击总数',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.EQUALS,
      TagConditionOperator.NOT_EQUALS,
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  openRate: {
    label: '打开率',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  clickRate: {
    label: '点击率',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  daysSinceLastActivity: {
    label: '距最后活跃天数',
    type: 'number',
    category: '互动数据',
    supportedOperators: [
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  daysSinceSubscribed: {
    label: '距订阅天数',
    type: 'number',
    category: '订阅状态',
    supportedOperators: [
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
  subscribedAt: {
    label: '订阅时间',
    type: 'date',
    category: '订阅状态',
    supportedOperators: [
      TagConditionOperator.GREATER_THAN,
      TagConditionOperator.LESS_THAN,
      TagConditionOperator.GREATER_THAN_OR_EQUAL,
      TagConditionOperator.LESS_THAN_OR_EQUAL,
    ],
  },
};

export const TAG_OPERATORS: TagConditionOperator[] = [
  TagConditionOperator.EQUALS,
  TagConditionOperator.NOT_EQUALS,
];

class AudienceSegmentationEngine {
  
  getAvailableFields() {
    return Object.entries(FIELD_METADATA).map(([key, meta]) => ({
      key,
      ...meta,
    }));
  }
  
  getOperatorsForFieldType(type: string): TagConditionOperator[] {
    switch (type) {
      case 'string':
        return [
          TagConditionOperator.EQUALS,
          TagConditionOperator.NOT_EQUALS,
          TagConditionOperator.CONTAINS,
          TagConditionOperator.NOT_CONTAINS,
          TagConditionOperator.STARTS_WITH,
          TagConditionOperator.ENDS_WITH,
        ];
      case 'number':
        return [
          TagConditionOperator.EQUALS,
          TagConditionOperator.NOT_EQUALS,
          TagConditionOperator.GREATER_THAN,
          TagConditionOperator.LESS_THAN,
          TagConditionOperator.GREATER_THAN_OR_EQUAL,
          TagConditionOperator.LESS_THAN_OR_EQUAL,
        ];
      case 'date':
        return [
          TagConditionOperator.GREATER_THAN,
          TagConditionOperator.LESS_THAN,
          TagConditionOperator.GREATER_THAN_OR_EQUAL,
          TagConditionOperator.LESS_THAN_OR_EQUAL,
        ];
      case 'boolean':
        return [
          TagConditionOperator.EQUALS,
        ];
      case 'select':
        return [
          TagConditionOperator.EQUALS,
          TagConditionOperator.NOT_EQUALS,
          TagConditionOperator.IN,
          TagConditionOperator.NOT_IN,
        ];
      default:
        return [TagConditionOperator.EQUALS, TagConditionOperator.NOT_EQUALS];
    }
  }
  
  getOperatorLabel(operator: TagConditionOperator): string {
    const labels: Record<TagConditionOperator, string> = {
      [TagConditionOperator.EQUALS]: '等于',
      [TagConditionOperator.NOT_EQUALS]: '不等于',
      [TagConditionOperator.CONTAINS]: '包含',
      [TagConditionOperator.NOT_CONTAINS]: '不包含',
      [TagConditionOperator.GREATER_THAN]: '大于',
      [TagConditionOperator.LESS_THAN]: '小于',
      [TagConditionOperator.GREATER_THAN_OR_EQUAL]: '大于等于',
      [TagConditionOperator.LESS_THAN_OR_EQUAL]: '小于等于',
      [TagConditionOperator.STARTS_WITH]: '以...开头',
      [TagConditionOperator.ENDS_WITH]: '以...结尾',
      [TagConditionOperator.IS_NULL]: '为空',
      [TagConditionOperator.IS_NOT_NULL]: '不为空',
      [TagConditionOperator.IN]: '在列表中',
      [TagConditionOperator.NOT_IN]: '不在列表中',
    };
    return labels[operator] || operator;
  }
  
  async createSegment(data: {
    name: string;
    description?: string;
    filterGroup: FilterGroup;
    isDynamic?: boolean;
    creatorId: string;
  }): Promise<AudienceSegment> {
    const id = uuidv4();
    
    const evaluation = await this.evaluateSegment(data.filterGroup);
    
    await prisma.$executeRaw`
      INSERT INTO "audienceSegments" (
        id, name, description, "filterGroup", "isDynamic", "estimatedCount", "actualCount", "creatorId", "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${data.name},
        ${data.description || null},
        ${JSON.stringify(data.filterGroup)}::jsonb,
        ${data.isDynamic !== false},
        ${evaluation.count},
        ${evaluation.count},
        ${data.creatorId},
        NOW(),
        NOW()
      )
    `;
    
    return this.getSegmentById(id) as Promise<AudienceSegment>;
  }
  
  async getSegmentById(segmentId: string): Promise<AudienceSegment | null> {
    const results = await prisma.$queryRaw`
      SELECT * FROM "audienceSegments" WHERE id = ${segmentId}
    ` as Array<AudienceSegment>;
    
    return results.length > 0 ? results[0] : null;
  }
  
  async getSegments(filters?: {
    search?: string;
    isDynamic?: boolean;
    creatorId?: string;
  }): Promise<AudienceSegment[]> {
    let query = 'SELECT * FROM "audienceSegments" WHERE 1=1';
    const params: unknown[] = [];
    
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    if (filters?.isDynamic !== undefined) {
      params.push(filters.isDynamic);
      query += ` AND "isDynamic" = $${params.length}`;
    }
    
    if (filters?.creatorId) {
      params.push(filters.creatorId);
      query += ` AND "creatorId" = $${params.length}`;
    }
    
    query += ' ORDER BY "createdAt" DESC';
    
    const results = await prisma.$queryRawUnsafe(query, ...params) as Array<AudienceSegment>;
    
    return results;
  }
  
  async evaluateSegment(filterGroup: FilterGroup): Promise<SegmentEvaluationResult> {
    const explanations: string[] = [];
    explanations.push('【受众筛选引擎 - 计算依据说明】');
    explanations.push('');
    explanations.push(`评估时间: ${new Date().toISOString()}`);
    explanations.push('');
    
    const allMembers = await prisma.$queryRaw`
      SELECT 
        am.*,
        (SELECT COUNT(*) FROM "sendLogs" sl WHERE sl."memberId" = am.id AND sl.status = 'OPENED') as open_count,
        (SELECT COUNT(*) FROM "sendLogs" sl WHERE sl."memberId" = am.id AND sl.status = 'CLICKED') as click_count,
        (SELECT jsonb_agg(t."tagId") FROM "tagMemberships" t WHERE t."memberId" = am.id) as tag_ids
      FROM "audienceMembers" am
    ` as Array<{
      id: string;
      email: string;
      name?: string;
      company?: string;
      country?: string;
      city?: string;
      position?: string;
      isSubscribed: boolean;
      subscribedAt?: Date;
      totalSent: number;
      totalOpens: number;
      totalClicks: number;
      lastActivityAt?: Date;
      profileData: Record<string, unknown>;
      open_count: number;
      click_count: number;
      tag_ids?: string[];
    }>;
    
    explanations.push(`总评估用户数: ${allMembers.length}`);
    explanations.push('');
    
    const ruleBreakdown: SegmentEvaluationResult['statistics']['ruleBreakdown'] = [];
    
    const matchedIds = allMembers.filter(member => {
      return this.evaluateFilterGroup(filterGroup, member, ruleBreakdown);
    }).map(m => m.id);
    
    explanations.push('');
    explanations.push('=== 规则匹配详情 ===');
    
    for (const breakdown of ruleBreakdown) {
      explanations.push(`  ${breakdown.rule}: ${breakdown.matched} 个用户 (${breakdown.percentage.toFixed(1)}%)`);
    }
    
    explanations.push('');
    explanations.push(`=== 最终结果 ===`);
    explanations.push(`匹配用户数: ${matchedIds.length}`);
    explanations.push(`匹配率: ${allMembers.length > 0 ? ((matchedIds.length / allMembers.length) * 100).toFixed(1) : 0}%`);
    
    if (matchedIds.length > 0) {
      explanations.push('');
      explanations.push('匹配用户示例:');
      const sampleMembers = allMembers.filter(m => matchedIds.includes(m.id)).slice(0, 10);
      sampleMembers.forEach((m, i) => {
        explanations.push(`  ${i + 1}. ${m.email}${m.name ? ` (${m.name})` : ''}`);
      });
      if (matchedIds.length > 10) {
        explanations.push(`  ... 还有 ${matchedIds.length - 10} 个用户`);
      }
    }
    
    return {
      success: true,
      memberIds: matchedIds,
      count: matchedIds.length,
      explanation: explanations.join('\n'),
      statistics: {
        totalEvaluated: allMembers.length,
        totalMatched: matchedIds.length,
        ruleBreakdown,
      },
    };
  }
  
  private evaluateFilterGroup(
    group: FilterGroup, 
    member: {
      id: string;
      email: string;
      name?: string;
      company?: string;
      country?: string;
      city?: string;
      position?: string;
      isSubscribed: boolean;
      subscribedAt?: Date;
      totalSent: number;
      totalOpens: number;
      totalClicks: number;
      lastActivityAt?: Date;
      profileData: Record<string, unknown>;
      open_count: number;
      click_count: number;
      tag_ids?: string[];
    },
    ruleBreakdown: SegmentEvaluationResult['statistics']['ruleBreakdown']
  ): boolean {
    const results: boolean[] = [];
    
    for (const rule of group.rules) {
      const ruleResult = this.evaluateRule(rule, member);
      results.push(ruleResult);
      
      const existingBreakdown = ruleBreakdown.find(b => b.rule === this.getRuleLabel(rule));
      if (!existingBreakdown) {
        ruleBreakdown.push({
          rule: this.getRuleLabel(rule),
          matched: ruleResult ? 1 : 0,
          percentage: 0,
        });
      } else {
        if (ruleResult) existingBreakdown.matched++;
      }
    }
    
    for (const nestedGroup of group.groups) {
      results.push(this.evaluateFilterGroup(nestedGroup, member, ruleBreakdown));
    }
    
    if (group.operator === FilterGroupOperator.AND) {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }
  
  private evaluateRule(
    rule: FilterRule,
    member: {
      id: string;
      email: string;
      name?: string;
      company?: string;
      country?: string;
      city?: string;
      position?: string;
      isSubscribed: boolean;
      subscribedAt?: Date;
      totalSent: number;
      totalOpens: number;
      totalClicks: number;
      lastActivityAt?: Date;
      profileData: Record<string, unknown>;
      open_count: number;
      click_count: number;
      tag_ids?: string[];
    }
  ): boolean {
    let actualValue: unknown;
    
    if (rule.type === 'tag') {
      const tagIds = member.tag_ids || [];
      if (rule.operator === TagConditionOperator.EQUALS) {
        return tagIds.includes(rule.value as string);
      } else if (rule.operator === TagConditionOperator.NOT_EQUALS) {
        return !tagIds.includes(rule.value as string);
      }
      return false;
    }
    
    switch (rule.field) {
      case 'email':
        actualValue = member.email;
        break;
      case 'name':
        actualValue = member.name;
        break;
      case 'company':
        actualValue = member.company;
        break;
      case 'country':
        actualValue = member.country;
        break;
      case 'city':
        actualValue = member.city;
        break;
      case 'isSubscribed':
        actualValue = member.isSubscribed;
        break;
      case 'totalSent':
        actualValue = member.totalSent;
        break;
      case 'totalOpens':
        actualValue = member.totalOpens;
        break;
      case 'totalClicks':
        actualValue = member.totalClicks;
        break;
      case 'openRate':
        actualValue = member.totalSent > 0 ? (member.open_count / member.totalSent) * 100 : 0;
        break;
      case 'clickRate':
        actualValue = member.totalOpens > 0 ? (member.click_count / member.totalOpens) * 100 : 0;
        break;
      case 'daysSinceLastActivity':
        actualValue = member.lastActivityAt 
          ? Math.floor((Date.now() - new Date(member.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        break;
      case 'daysSinceSubscribed':
        actualValue = member.subscribedAt
          ? Math.floor((Date.now() - new Date(member.subscribedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        break;
      case 'subscribedAt':
        actualValue = member.subscribedAt;
        break;
      default:
        actualValue = member.profileData[rule.field];
    }
    
    return this.compareValues(actualValue, rule.operator, rule.value);
  }
  
  private compareValues(
    actualValue: unknown,
    operator: TagConditionOperator,
    compareValue: unknown
  ): boolean {
    const actual = actualValue;
    const compare = compareValue;
    
    switch (operator) {
      case TagConditionOperator.EQUALS:
        return actual === compare;
      case TagConditionOperator.NOT_EQUALS:
        return actual !== compare;
      case TagConditionOperator.CONTAINS:
        if (typeof actual === 'string' && typeof compare === 'string') {
          return actual.toLowerCase().includes(compare.toLowerCase());
        }
        return false;
      case TagConditionOperator.NOT_CONTAINS:
        if (typeof actual === 'string' && typeof compare === 'string') {
          return !actual.toLowerCase().includes(compare.toLowerCase());
        }
        return true;
      case TagConditionOperator.GREATER_THAN:
        return Number(actual) > Number(compare);
      case TagConditionOperator.LESS_THAN:
        return Number(actual) < Number(compare);
      case TagConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(actual) >= Number(compare);
      case TagConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(actual) <= Number(compare);
      case TagConditionOperator.STARTS_WITH:
        if (typeof actual === 'string' && typeof compare === 'string') {
          return actual.toLowerCase().startsWith(compare.toLowerCase());
        }
        return false;
      case TagConditionOperator.ENDS_WITH:
        if (typeof actual === 'string' && typeof compare === 'string') {
          return actual.toLowerCase().endsWith(compare.toLowerCase());
        }
        return false;
      case TagConditionOperator.IS_NULL:
        return actual === null || actual === undefined;
      case TagConditionOperator.IS_NOT_NULL:
        return actual !== null && actual !== undefined;
      case TagConditionOperator.IN:
        if (Array.isArray(compare)) {
          return compare.includes(actual);
        }
        return false;
      case TagConditionOperator.NOT_IN:
        if (Array.isArray(compare)) {
          return !compare.includes(actual);
        }
        return true;
      default:
        return actual === compare;
    }
  }
  
  private getRuleLabel(rule: FilterRule): string {
    const fieldMeta = FIELD_METADATA[rule.field];
    const fieldLabel = fieldMeta?.label || rule.field;
    const operatorLabel = this.getOperatorLabel(rule.operator);
    
    if (rule.type === 'tag') {
      return `标签 ${operatorLabel} ${rule.value}`;
    }
    
    return `${fieldLabel} ${operatorLabel} ${rule.value}`;
  }
  
  async updateSegment(segmentId: string, data: {
    name?: string;
    description?: string;
    filterGroup?: FilterGroup;
    isDynamic?: boolean;
  }): Promise<AudienceSegment | null> {
    const existing = await this.getSegmentById(segmentId);
    if (!existing) return null;
    
    let count = existing.actualCount;
    if (data.filterGroup) {
      const evaluation = await this.evaluateSegment(data.filterGroup);
      count = evaluation.count;
    }
    
    await prisma.$executeRaw`
      UPDATE "audienceSegments"
      SET 
        name = COALESCE(${data.name || null}, name),
        description = COALESCE(${data.description || null}, description),
        "filterGroup" = COALESCE(${data.filterGroup ? JSON.stringify(data.filterGroup) : null}::jsonb, "filterGroup"),
        "isDynamic" = COALESCE(${data.isDynamic}, "isDynamic"),
        "estimatedCount" = ${count},
        "actualCount" = ${count},
        "updatedAt" = NOW()
      WHERE id = ${segmentId}
    `;
    
    return this.getSegmentById(segmentId);
  }
  
  async deleteSegment(segmentId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM "audienceSegments" WHERE id = ${segmentId}
    `;
    
    return result > 0;
  }
  
  async refreshSegment(segmentId: string): Promise<{ count: number; explanation: string } | null> {
    const segment = await this.getSegmentById(segmentId);
    if (!segment) return null;
    
    const evaluation = await this.evaluateSegment(segment.filterGroup);
    
    await prisma.$executeRaw`
      UPDATE "audienceSegments"
      SET 
        "actualCount" = ${evaluation.count},
        "estimatedCount" = ${evaluation.count},
        "lastCalculatedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE id = ${segmentId}
    `;
    
    return {
      count: evaluation.count,
      explanation: evaluation.explanation,
    };
  }
}

export const audienceSegmentationEngine = new AudienceSegmentationEngine();
export default audienceSegmentationEngine;
