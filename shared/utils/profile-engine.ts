import type { CitizenProfile, CitizenTag, BehaviorStats, ServicePreferences } from '../types';

const TAG_RULES = [
  {
    id: 'age-youth',
    name: '青年群体',
    category: 'demographic' as const,
    condition: (p: CitizenProfile) => p.age >= 18 && p.age <= 35,
    weight: 0.8,
    source: '人口基础数据'
  },
  {
    id: 'age-middle',
    name: '中年群体',
    category: 'demographic' as const,
    condition: (p: CitizenProfile) => p.age >= 36 && p.age <= 55,
    weight: 0.8,
    source: '人口基础数据'
  },
  {
    id: 'age-senior',
    name: '老年群体',
    category: 'demographic' as const,
    condition: (p: CitizenProfile) => p.age >= 56,
    weight: 0.9,
    source: '人口基础数据'
  },
  {
    id: 'new-parent',
    name: '新手父母',
    category: 'life-event' as const,
    condition: (p: CitizenProfile) => {
      return p.familyMembers?.some(f => f.relation === '子女' && calculateAge(f.idCard) <= 3);
    },
    weight: 0.95,
    source: '户籍关联数据'
  },
  {
    id: 'home-buyer',
    name: '购房群体',
    category: 'behavior' as const,
    condition: (p: CitizenProfile) => {
      const stats = p.behaviorStats;
      return (stats.serviceFrequency['housing-fund-extraction'] || 0) > 0 ||
             (stats.serviceFrequency['house-purchase-qualification'] || 0) > 0;
    },
    weight: 0.7,
    source: '办事行为分析'
  },
  {
    id: 'frequent-payer',
    name: '高频缴费用户',
    category: 'behavior' as const,
    condition: (p: CitizenProfile) => {
      const total = Object.values(p.behaviorStats.paymentFrequency).reduce((a, b) => a + b, 0);
      return total >= 12;
    },
    weight: 0.6,
    source: '缴费行为分析'
  },
  {
    id: 'education-focused',
    name: '教育关注者',
    category: 'preference' as const,
    condition: (p: CitizenProfile) => {
      return (p.behaviorStats.clickHotspots['education'] || 0) >= 5;
    },
    weight: 0.65,
    source: '点击偏好分析'
  },
  {
    id: 'medical-user',
    name: '医疗服务高频用户',
    category: 'behavior' as const,
    condition: (p: CitizenProfile) => {
      const stats = p.behaviorStats;
      return (stats.serviceFrequency['medical-appointment'] || 0) >= 4 ||
             (stats.serviceFrequency['prescription-renewal'] || 0) >= 3;
    },
    weight: 0.75,
    source: '办事行为分析'
  },
  {
    id: 'business-owner',
    name: '企业主/创业者',
    category: 'demographic' as const,
    condition: (p: CitizenProfile) => {
      const stats = p.behaviorStats;
      return (stats.serviceFrequency['business-registration'] || 0) > 0 ||
             (stats.serviceFrequency['tax-declaration'] || 0) >= 4;
    },
    weight: 0.8,
    source: '工商税务数据'
  },
  {
    id: 'tech-savvy',
    name: '线上办理偏好',
    category: 'preference' as const,
    condition: (p: CitizenProfile) => {
      const stats = p.behaviorStats;
      return stats.totalServiceCount >= 5 && stats.successRate >= 0.9;
    },
    weight: 0.7,
    source: '办事行为分析'
  },
  {
    id: 'needs-assistance',
    name: '需要协助用户',
    category: 'preference' as const,
    condition: (p: CitizenProfile) => {
      return p.preferences.accessibilityMode.enabled || p.age >= 65;
    },
    weight: 0.9,
    source: '无障碍设置/年龄分析'
  },
  {
    id: 'zhengzhou-native',
    name: '郑州常住居民',
    category: 'demographic' as const,
    condition: (p: CitizenProfile) => {
      return p.address.city === '郑州市' && p.idCard.startsWith('4101');
    },
    weight: 0.95,
    source: '户籍地址数据'
  }
];

function calculateAge(idCard: string): number {
  if (!idCard || idCard.length < 14) return 0;
  const birthStr = idCard.substring(6, 14);
  const birthYear = parseInt(birthStr.substring(0, 4));
  const birthMonth = parseInt(birthStr.substring(4, 6));
  const birthDay = parseInt(birthStr.substring(6, 8));
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const monthDiff = today.getMonth() + 1 - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age;
}

export function generateCitizenTags(profile: CitizenProfile): CitizenTag[] {
  const tags: CitizenTag[] = [];
  const now = new Date().toISOString();

  for (const rule of TAG_RULES) {
    try {
      if (rule.condition(profile)) {
        tags.push({
          id: rule.id,
          name: rule.name,
          category: rule.category,
          weight: rule.weight,
          source: rule.source,
          createTime: now
        });
      }
    } catch (e) {
      console.error(`Tag rule ${rule.id} execution error:`, e);
    }
  }

  return tags.sort((a, b) => b.weight - a.weight);
}

export function recommendPersonalizedServices(profile: CitizenProfile): string[] {
  const recommended: string[] = [];
  const tagIds = profile.tags.map(t => t.id);

  if (tagIds.includes('new-parent')) {
    recommended.push('birth-certificate', 'newborn-household', 'newborn-medical-insurance', 'childcare-subsidy');
  }
  if (tagIds.includes('age-senior')) {
    recommended.push('pension-certification', 'elderly-card', 'medical-appointment', 'prescription-renewal');
  }
  if (tagIds.includes('home-buyer')) {
    recommended.push('housing-fund-extraction', 'housing-fund-loan', 'house-purchase-qualification', 'property-certificate');
  }
  if (tagIds.includes('education-focused') || tagIds.includes('new-parent')) {
    recommended.push('school-enrollment', 'student-subsidy', 'education-fee-payment');
  }
  if (tagIds.includes('business-owner')) {
    recommended.push('business-registration', 'tax-declaration', 'business-license-change', 'social-security-payment');
  }
  if (tagIds.includes('medical-user') || tagIds.includes('age-senior')) {
    recommended.push('medical-appointment', 'medical-insurance-reimbursement', 'prescription-renewal', 'health-record');
  }
  if (tagIds.includes('zhengzhou-native')) {
    recommended.push('traffic-violation', 'driver-license-renewal', 'vehicle-registration');
  }
  if (tagIds.includes('needs-assistance')) {
    recommended.push('elderly-card', 'disability-benefits', 'community-service', 'home-care-service');
  }

  const common = profile.preferences.commonServices || [];
  const combined = [...new Set([...recommended, ...common])];

  return combined.slice(0, 12);
}

export function generateReminders(profile: CitizenProfile): { type: string; title: string; content: string; priority: string }[] {
  const reminders: { type: string; title: string; content: string; priority: string }[] = [];
  const age = profile.age;
  const now = new Date();

  if (age >= 60 && age <= 80) {
    const certMonth = (now.getMonth() + 3) % 12;
    if (certMonth < 3) {
      reminders.push({
        type: 'pension-certification',
        title: '养老金领取资格认证提醒',
        content: '您的养老金领取资格认证即将到期，请及时完成线上认证，避免影响待遇发放。',
        priority: 'high'
      });
    }
  }

  if (profile.idCard) {
    const cardAge = calculateAge(profile.idCard);
    if (cardAge >= 16) {
      const expiryYears = cardAge <= 25 ? 10 : cardAge <= 45 ? 20 : 999;
      if (expiryYears < 999 && expiryYears <= 1) {
        reminders.push({
          type: 'id-card-expiry',
          title: '身份证即将到期',
          content: '您的居民身份证有效期即将届满，请提前预约办理换领手续。',
          priority: 'urgent'
        });
      }
    }
  }

  reminders.push({
    type: 'social-security-payment',
    title: '社保缴费提醒',
    content: `${now.getMonth() + 1}月社会保险缴费已启动，请确保账户余额充足，缴费截止日为${now.getMonth() + 1}月25日。`,
    priority: 'normal'
  });

  const hasChildren = profile.familyMembers?.some(f => {
    if (f.relation === '子女') {
      const childAge = calculateAge(f.idCard);
      return childAge >= 3 && childAge <= 6;
    }
    return false;
  });

  if (hasChildren && now.getMonth() >= 4 && now.getMonth() <= 5) {
    reminders.push({
      type: 'child-education',
      title: '幼儿园报名提醒',
      content: '郑州市2026年幼儿园招生报名即将开始，请关注所在区教育局发布的报名通知。',
      priority: 'high'
    });
  }

  return reminders;
}

export function updateBehaviorStats(
  current: BehaviorStats,
  action: { type: 'service' | 'click' | 'payment'; key: string; success?: boolean }
): BehaviorStats {
  const stats = { ...current };
  const now = new Date().toISOString();

  stats.totalServiceCount = stats.totalServiceCount || 0;
  stats.serviceFrequency = { ...stats.serviceFrequency };
  stats.clickHotspots = { ...stats.clickHotspots };
  stats.paymentFrequency = { ...stats.paymentFrequency };

  switch (action.type) {
    case 'service':
      stats.totalServiceCount++;
      stats.lastServiceTime = now;
      stats.serviceFrequency[action.key] = (stats.serviceFrequency[action.key] || 0) + 1;
      if (action.success !== undefined) {
        const successCount = Math.round(stats.successRate * (stats.totalServiceCount - 1)) + (action.success ? 1 : 0);
        stats.successRate = successCount / stats.totalServiceCount;
      }
      break;
    case 'click':
      stats.clickHotspots[action.key] = (stats.clickHotspots[action.key] || 0) + 1;
      break;
    case 'payment':
      stats.paymentFrequency[action.key] = (stats.paymentFrequency[action.key] || 0) + 1;
      break;
  }

  return stats;
}

export function mergePreferences(current: ServicePreferences, updates: Partial<ServicePreferences>): ServicePreferences {
  return {
    ...current,
    ...updates,
    accessibilityMode: {
      ...current.accessibilityMode,
      ...updates.accessibilityMode
    }
  };
}
