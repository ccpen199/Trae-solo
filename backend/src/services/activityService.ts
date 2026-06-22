import type {
  Activity,
  ActivityCreateInput,
  ActivityStatus,
  ActivityParticipant,
  User
} from '../types';
import { db } from '../data/database';
import { RiskControlEngine } from '../core/riskControlEngine';
import { MatchingAlgorithm } from '../core/matchingAlgorithm';

export class ActivityService {
  static create(creatorId: string, input: ActivityCreateInput): Activity | null {
    const creator = db.users.get(creatorId);
    if (!creator) return null;
    if (creator.creditScore < 600) return null;
    if (!creator.verification.verified) return null;

    const contentCheck = RiskControlEngine.evaluateContent(
      creatorId, `${input.title} ${input.description}`, 'activity'
    );
    if (!contentCheck.allowed) return null;

    const now = new Date();
    const startTime = typeof input.startTime === 'string' ? new Date(input.startTime) : input.startTime;
    const endTime = typeof input.endTime === 'string' ? new Date(input.endTime) : input.endTime;
    const meetingTime = typeof input.meetingTime === 'string' ? new Date(input.meetingTime) : input.meetingTime;

    const activity: Activity = {
      id: db.generateId(),
      creatorId,
      title: contentCheck.censoredContent.split(' ')[0] || input.title,
      description: contentCheck.censoredContent.split(' ').slice(1).join(' ') || input.description,
      category: input.category,
      tags: input.tags || [],
      location: input.location,
      startTime,
      endTime,
      meetingTime,
      maxParticipants: input.maxParticipants,
      minParticipants: input.minParticipants || 2,
      feePerPerson: input.feePerPerson || 0,
      genderPreference: input.genderPreference || 'any',
      ageRange: input.ageRange || { min: 18, max: 60 },
      minCreditScore: input.minCreditScore || 600,
      educationPreference: input.educationPreference,
      careerPreference: input.careerPreference,
      status: 'recruiting',
      participants: [{
        userId: creatorId,
        status: 'approved',
        appliedAt: now
      }],
      coverImage: input.coverImage,
      images: input.images || [],
      riskFlags: {
        flagged: contentCheck.riskLevel !== 'low',
        reason: contentCheck.hits.length > 0 ? '风控自动审核标记' : undefined,
        flaggedAt: contentCheck.hits.length > 0 ? now : undefined
      },
      createdAt: now,
      updatedAt: now
    };

    if (input.couponId) {
      const coupon = db.coupons.get(input.couponId);
      if (coupon) {
        activity.coupons = [{
          couponId: coupon.id,
          couponName: coupon.title,
          originalPrice: coupon.originalPrice,
          discountedPrice: coupon.discountedPrice,
          redemptionStatus: 'pending',
          provider: 'xiaohu_preferred'
        }];
      }
    }

    db.activities.set(activity.id, activity);
    return activity;
  }

  static getById(id: string): Activity | null {
    return db.activities.get(id) || null;
  }

  static list(options: {
    city?: string;
    category?: Activity['category'];
    status?: ActivityStatus;
    userId?: string;
    page?: number;
    pageSize?: number;
  } = {}): { items: Activity[]; total: number } {
    let activities = Array.from(db.activities.values());

    if (options.city) {
      activities = activities.filter(a => a.location.city === options.city);
    }
    if (options.category) {
      activities = activities.filter(a => a.category === options.category);
    }
    if (options.status) {
      activities = activities.filter(a => a.status === options.status);
    }
    if (options.userId) {
      activities = activities.filter(a =>
        a.creatorId === options.userId ||
        a.participants.some(p => p.userId === options.userId)
      );
    }

    activities.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const total = activities.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;

    return {
      items: activities.slice(start, start + pageSize),
      total
    };
  }

  static apply(activityId: string, userId: string): { success: boolean; message: string; participant?: ActivityParticipant } {
    const activity = db.activities.get(activityId);
    const user = db.users.get(userId);
    if (!activity || !user) return { success: false, message: '活动或用户不存在' };
    if (activity.status !== 'recruiting') return { success: false, message: '活动当前不接受报名' };
    if (user.creditScore < activity.minCreditScore) return { success: false, message: '信用分不足' };
    if (user.age < activity.ageRange.min || user.age > activity.ageRange.max) return { success: false, message: '年龄不符合要求' };

    if (activity.genderPreference === 'male_only' && user.gender !== 'male') return { success: false, message: '仅限男性参加' };
    if (activity.genderPreference === 'female_only' && user.gender !== 'female') return { success: false, message: '仅限女性参加' };

    const alreadyParticipant = activity.participants.find(p => p.userId === userId);
    if (alreadyParticipant && alreadyParticipant.status !== 'cancelled' && alreadyParticipant.status !== 'rejected') {
      return { success: false, message: '您已报名此活动' };
    }

    const freqCheck = RiskControlEngine.recordAndCheckHighFrequency(userId, 'match');
    if (!freqCheck.allowed) return { success: false, message: '操作过于频繁，请稍后再试' };

    const approvedCount = activity.participants.filter(p => p.status === 'approved').length;
    if (approvedCount >= activity.maxParticipants) return { success: false, message: '活动人数已满' };

    const participant: ActivityParticipant = {
      userId,
      status: approvedCount + 1 <= activity.maxParticipants ? 'approved' : 'pending',
      appliedAt: new Date()
    };

    if (alreadyParticipant) {
      Object.assign(alreadyParticipant, participant);
    } else {
      activity.participants.push(participant);
    }
    activity.updatedAt = new Date();

    return { success: true, message: '报名成功', participant };
  }

  static cancelApplication(activityId: string, userId: string): boolean {
    const activity = db.activities.get(activityId);
    if (!activity) return false;
    const participant = activity.participants.find(p => p.userId === userId);
    if (!participant || participant.status === 'attended') return false;
    participant.status = 'cancelled';
    activity.updatedAt = new Date();
    this.checkActivityStatus(activity);
    return true;
  }

  static checkActivityStatus(activity: Activity): void {
    const now = new Date();
    const approved = activity.participants.filter(p => p.status === 'approved').length;

    if (activity.status === 'recruiting' && approved >= activity.minParticipants) {
      activity.status = 'confirmed';
      activity.confirmedAt = now;
    }
    if (activity.startTime <= now && now < activity.endTime && approved > 0) {
      activity.status = 'ongoing';
    }
    if (activity.endTime <= now) {
      activity.status = 'completed';
      activity.completedAt = now;
    }
    activity.updatedAt = now;
  }

  static submitFeedback(
    activityId: string,
    fromUserId: string,
    toUserId: string,
    score: number,
    comment: string
  ): boolean {
    const activity = db.activities.get(activityId);
    if (!activity || activity.status !== 'completed') return false;
    if (score < 1 || score > 5) return false;

    const participant = activity.participants.find(p => p.userId === toUserId);
    if (!participant) return false;

    const contentCheck = RiskControlEngine.evaluateContent(fromUserId, comment, 'activity');
    participant.feedbackScore = score;
    participant.feedbackComment = contentCheck.censoredContent;
    participant.feedbackAt = new Date();

    if (score >= 4) {
      RiskControlEngine.addCreditScore(toUserId, 2, 'activity_feedback', `活动好评 +${score}星`);
    } else if (score <= 2) {
      RiskControlEngine.applyCreditDeduction(toUserId, 3, 'activity_feedback', activity.id);
    }
    activity.updatedAt = new Date();
    return true;
  }

  static markAttendance(activityId: string, userId: string, attended: boolean): boolean {
    const activity = db.activities.get(activityId);
    if (!activity || activity.status !== 'ongoing') return false;
    const participant = activity.participants.find(p => p.userId === userId);
    if (!participant) return false;
    participant.status = attended ? 'attended' : 'no_show';
    if (!attended) {
      RiskControlEngine.applyCreditDeduction(userId, 10, 'activity_feedback', activity.id);
    }
    activity.updatedAt = new Date();
    return true;
  }

  static getRecommendedMatches(activityId: string): { user: User; matchScore: number; reasons: string[] }[] {
    const activity = db.activities.get(activityId);
    if (!activity) return [];
    const criteria = MatchingAlgorithm.buildCriteriaFromActivity(activityId, activity.creatorId);
    if (!criteria) return [];
    const history = MatchingAlgorithm.findMatches(criteria);
    return history.results
      .filter(r => {
        const p = activity.participants.find(pp => pp.userId === r.targetUserId);
        return !p || p.status === 'cancelled' || p.status === 'rejected';
      })
      .map(r => ({
        user: db.users.get(r.targetUserId)!,
        matchScore: r.overallScore,
        reasons: r.reasons
      }))
      .filter(item => item.user);
  }
}
