import type { User, MatchCriteria, MatchResult, MatchHistory } from '../types';
import { db } from '../data/database';

interface ScoreBreakdown {
  location: number;
  education: number;
  career: number;
  interests: number;
  credit: number;
  custom: number;
}

export class MatchingAlgorithm {
  private static readonly WEIGHTS = {
    location: 0.20,
    education: 0.20,
    career: 0.15,
    interests: 0.25,
    credit: 0.15,
    custom: 0.05
  };

  static calculateDistanceKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static scoreLocation(user: User, criteria: MatchCriteria): number {
    if (!criteria.location) return 0.7;
    const target = db.users.get(criteria.userId);
    if (!target) return 0.7;
    if (user.location.city !== target.location.city) {
      return user.location.city === criteria.location.city ? 0.4 : 0.1;
    }
    const distance = this.calculateDistanceKm(
      target.location.latitude, target.location.longitude,
      user.location.latitude, user.location.longitude
    );
    const radius = criteria.location.radiusKm || 50;
    if (distance <= 5) return 1.0;
    if (distance <= 15) return 0.85;
    if (distance <= radius) return 0.7 - (distance / radius) * 0.3;
    return Math.max(0, 0.4 - (distance / (radius * 2)) * 0.4);
  }

  private static scoreEducation(user: User, criteria: MatchCriteria): number {
    let score = 0.5;
    if (criteria.educationLevels && criteria.educationLevels.length > 0) {
      if (criteria.educationLevels.includes(user.education.school) ||
          criteria.educationLevels.includes(user.education.level)) {
        score = 1.0;
      } else {
        score = 0.3;
      }
    } else {
      const levelScores: Record<string, number> = { phd: 1.0, master: 0.85, bachelor: 0.7, other: 0.5 };
      score = levelScores[user.education.level] || 0.5;
    }
    if (user.education.verified) score += 0.1;
    return Math.min(1.0, score);
  }

  private static scoreCareer(user: User, criteria: MatchCriteria): number {
    let score = 0.5;
    if (criteria.industries && criteria.industries.length > 0) {
      score = criteria.industries.includes(user.career.industry) ? 1.0 : 0.3;
    }
    if (user.career.verified) score += 0.15;
    const expBonus = Math.min(0.1, user.career.yearsOfExperience * 0.02);
    return Math.min(1.0, score + expBonus);
  }

  private static scoreInterests(user: User, criteria: MatchCriteria): number {
    const targetTags = criteria.interestTags || [];
    if (targetTags.length === 0) return 0.6;
    const set1 = new Set(user.interestTags);
    let matches = 0;
    for (const tag of targetTags) {
      if (set1.has(tag)) matches++;
    }
    const jaccard = matches / (set1.size + targetTags.length - matches);
    return Math.min(1.0, jaccard * 1.2 + 0.2);
  }

  private static scoreCredit(user: User, criteria: MatchCriteria): number {
    const minScore = criteria.minCreditScore || 600;
    if (user.creditScore < minScore) return 0;
    const normalized = Math.min(1.0, (user.creditScore - minScore) / (850 - minScore));
    if (criteria.verifiedOnly && !user.verification.verified) {
      return Math.max(0, normalized * 0.5);
    }
    if (user.verification.verified) return Math.min(1.0, normalized + 0.1);
    return normalized;
  }

  private static scoreCustom(user: User, criteria: MatchCriteria): number {
    let score = 0.5;
    if (criteria.ageRange) {
      if (user.age >= criteria.ageRange.min && user.age <= criteria.ageRange.max) {
        score += 0.2;
      } else {
        return 0;
      }
    }
    if (criteria.gender && criteria.gender !== 'any') {
      if (user.gender === criteria.gender) {
        score += 0.2;
      } else {
        return 0;
      }
    }
    if (!user.privacySettings.allowMatch) return 0;
    return Math.min(1.0, score);
  }

  static findMatchingTags(user: User, criteria: MatchCriteria): string[] {
    const targetTags = criteria.interestTags || [];
    const userSet = new Set(user.interestTags);
    const matched: string[] = [];
    for (const tag of targetTags) {
      if (userSet.has(tag)) matched.push(tag);
    }
    return matched;
  }

  static generateReasons(user: User, breakdown: ScoreBreakdown, matchingTags: string[]): string[] {
    const reasons: string[] = [];
    if (breakdown.location >= 0.85) reasons.push('你们住在同一区域，见面很方便');
    else if (breakdown.location >= 0.5) reasons.push('地理位置相近');
    if (breakdown.education >= 0.85) reasons.push('教育背景优秀且已认证');
    else if (user.education.verified) reasons.push('学历已认证');
    if (breakdown.career >= 0.8) reasons.push('职业背景匹配度高');
    if (matchingTags.length > 0) {
      reasons.push(`有 ${matchingTags.length} 个共同爱好：${matchingTags.slice(0, 3).join('、')}`);
    }
    if (breakdown.credit >= 0.8) reasons.push('信用分优秀，值得信赖');
    if (user.verification.faceVerified) reasons.push('已完成人脸实名认证');
    return reasons.slice(0, 5);
  }

  static match(user: User, criteria: MatchCriteria): MatchResult | null {
    if (user.id === criteria.userId) return null;
    const breakdown: ScoreBreakdown = {
      location: this.scoreLocation(user, criteria),
      education: this.scoreEducation(user, criteria),
      career: this.scoreCareer(user, criteria),
      interests: this.scoreInterests(user, criteria),
      credit: this.scoreCredit(user, criteria),
      custom: this.scoreCustom(user, criteria)
    };
    if (breakdown.custom === 0 || breakdown.credit === 0) return null;

    const overall =
      breakdown.location * this.WEIGHTS.location +
      breakdown.education * this.WEIGHTS.education +
      breakdown.career * this.WEIGHTS.career +
      breakdown.interests * this.WEIGHTS.interests +
      breakdown.credit * this.WEIGHTS.credit +
      breakdown.custom * this.WEIGHTS.custom;

    const matchingTags = this.findMatchingTags(user, criteria);
    const reasons = this.generateReasons(user, breakdown, matchingTags);

    return {
      targetUserId: user.id,
      overallScore: Math.round(overall * 1000) / 10,
      scoreBreakdown: {
        location: Math.round(breakdown.location * 100) / 100,
        education: Math.round(breakdown.education * 100) / 100,
        career: Math.round(breakdown.career * 100) / 100,
        interests: Math.round(breakdown.interests * 100) / 100,
        credit: Math.round(breakdown.credit * 100) / 100,
        custom: Math.round(breakdown.custom * 100) / 100
      },
      matchingTags,
      reasons,
      matchedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000)
    };
  }

  static findMatches(criteria: MatchCriteria): MatchHistory {
    const allUsers = Array.from(db.users.values());
    const results: MatchResult[] = [];

    for (const user of allUsers) {
      const result = this.match(user, criteria);
      if (result) results.push(result);
    }

    results.sort((a, b) => b.overallScore - a.overallScore);
    const topResults = results.slice(0, criteria.maxMatches || 20);

    const history: MatchHistory = {
      id: db.generateId(),
      userId: criteria.userId,
      criteria,
      results: topResults,
      createdAt: new Date()
    };
    db.matchHistories.set(history.id, history);
    return history;
  }

  static buildCriteriaFromActivity(activityId: string, userId: string): MatchCriteria | null {
    const activity = db.activities.get(activityId);
    if (!activity) return null;
    return {
      userId,
      location: {
        city: activity.location.city,
        radiusKm: 30
      },
      ageRange: activity.ageRange,
      gender: activity.genderPreference === 'any' ? 'any' :
              activity.genderPreference === 'male_only' ? 'male' :
              activity.genderPreference === 'female_only' ? 'female' : 'any',
      minCreditScore: activity.minCreditScore,
      educationLevels: activity.educationPreference,
      industries: activity.careerPreference,
      interestTags: activity.tags,
      maxMatches: activity.maxParticipants * 2,
      activityId
    };
  }
}
