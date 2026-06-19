import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { UserProfile } from '../entities/UserProfile.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import type { RecommendedCoupon, CouponActivity as CouponActivityType } from '../../../shared/types/index.js'

export interface RecommendationRequest {
  userId: string
  limit?: number
  userLocation?: { latitude: number; longitude: number }
  category?: string
}

export class RecommendationService {
  private activityRepository: Repository<CouponActivity>
  private profileRepository: Repository<UserProfile>
  private verificationRepository: Repository<VerificationRecord>

  constructor() {
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
    this.profileRepository = AppDataSource.getRepository(UserProfile)
    this.verificationRepository = AppDataSource.getRepository(VerificationRecord)
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendedCoupon[]> {
    const { userId, limit = 5, category } = request

    const profile = await this.profileRepository.findOne({ where: { userId } })
    if (!profile) {
      return this.getTrendingCoupons(limit)
    }

    const activeActivities = await this.activityRepository.find({
      where: { status: 'active' },
      relations: ['distributionStrategy'],
    })

    const now = new Date()
    const validActivities = activeActivities.filter(
      activity => activity.startTime <= now && activity.endTime >= now,
    )

    const userCouponIds = await this.getUserCouponIds(userId)

    const recommendations: RecommendedCoupon[] = []

    for (const activity of validActivities) {
      if (userCouponIds.includes(activity.id)) {
        continue
      }

      const { score, reason, matchType } = await this.calculateMatchScore(
        activity,
        profile,
        category,
      )

      if (score > 0) {
        recommendations.push({
          activityId: activity.id,
          activity: activity as unknown as CouponActivityType,
          score,
          reason,
          matchType,
        })
      }
    }

    recommendations.sort((a, b) => b.score - a.score)

    if (recommendations.length < limit) {
      const trending = await this.getTrendingCoupons(limit - recommendations.length)
      const existingIds = recommendations.map(r => r.activityId)
      trending.forEach(t => {
        if (!existingIds.includes(t.activityId)) {
          recommendations.push(t)
        }
      })
    }

    return recommendations.slice(0, limit)
  }

  private async calculateMatchScore(
    activity: CouponActivity,
    profile: UserProfile,
    requestedCategory?: string,
  ): Promise<{ score: number; reason: string; matchType: RecommendedCoupon['matchType'] }> {
    let score = 0
    const reasons: string[] = []
    let matchType: RecommendedCoupon['matchType'] = 'trending'

    if (activity.applicableMerchantIds && activity.applicableMerchantIds.length > 0) {
      score += 10
      reasons.push('适用于您关注的商户')
    }

    if (requestedCategory && activity.description?.includes(requestedCategory)) {
      score += 30
      reasons.push(`符合您选择的${requestedCategory}分类`)
      matchType = 'category'
    }

    if (profile.preferredCategories.some(cat => activity.description?.includes(cat))) {
      score += 25
      const matchingCategories = profile.preferredCategories.filter(cat => 
        activity.description?.includes(cat)
      )
      reasons.push(`基于您偏好的分类: ${matchingCategories.join(', ')}`)
      if (score > 30) matchType = 'category'
    }

    if (profile.preferredDistricts.some(district => activity.description?.includes(district))) {
      score += 20
      const matchingDistricts = profile.preferredDistricts.filter(district => 
        activity.description?.includes(district)
      )
      reasons.push(`位于您偏好的区域: ${matchingDistricts.join(', ')}`)
      matchType = 'district'
    }

    if (profile.consumptionTier === 'high' && activity.value >= 50) {
      score += 15
      reasons.push('符合您的高消费层级')
      matchType = 'tier'
    } else if (profile.consumptionTier === 'medium' && activity.value >= 20) {
      score += 10
      reasons.push('符合您的中消费层级')
      matchType = 'tier'
    } else if (profile.consumptionTier === 'low' && activity.value < 30) {
      score += 10
      reasons.push('符合您的经济实惠偏好')
      matchType = 'tier'
    }

    if (profile.historicalVerificationCount > 10) {
      score += 5
      reasons.push('基于您的活跃消费行为')
    }

    const popularityScore = await this.getPopularityScore(activity.id)
    score += Math.min(popularityScore, 20)
    if (popularityScore >= 15) {
      reasons.push('热门活动')
    }

    if (score === 0) {
      return { score: 0, reason: '', matchType: 'trending' }
    }

    return {
      score: Math.min(score, 100),
      reason: reasons.join('；'),
      matchType,
    }
  }

  private async getPopularityScore(activityId: string): Promise<number> {
    const count = await this.verificationRepository.count({
      where: { activityId, status: 'success' },
    })

    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity || activity.totalQuantity === 0) return 0

    const verificationRate = count / activity.totalQuantity
    return verificationRate * 20
  }

  private async getUserCouponIds(userId: string): Promise<string[]> {
    const records = await this.verificationRepository.find({
      where: { userId },
      select: ['activityId'],
    })
    return [...new Set(records.map(r => r.activityId))]
  }

  async getTrendingCoupons(limit: number = 5): Promise<RecommendedCoupon[]> {
    const now = new Date()
    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.status = :status', { status: 'active' })
      .andWhere('activity.startTime <= :now', { now })
      .andWhere('activity.endTime >= :now', { now })
      .orderBy('activity.usedQuantity / activity.totalQuantity', 'DESC')
      .take(limit)
      .getMany()

    return activities.map(activity => ({
      activityId: activity.id,
      activity: activity as unknown as CouponActivityType,
      score: 50,
      reason: '热门推荐',
      matchType: 'trending' as const,
    }))
  }

  async getPersonalizedStats(userId: string): Promise<{
    totalRecommendations: number
    redeemedCount: number
    redemptionRate: number
    favoriteCategory: string
    favoriteDistrict: string
  }> {
    const profile = await this.profileRepository.findOne({ where: { userId } })
    if (!profile) {
      return {
        totalRecommendations: 0,
        redeemedCount: 0,
        redemptionRate: 0,
        favoriteCategory: '餐饮',
        favoriteDistrict: '和平区',
      }
    }

    const redeemedCount = await this.verificationRepository.count({
      where: { userId, status: 'success' },
    })

    const totalRecommendations = 50
    const redemptionRate = totalRecommendations > 0 ? redeemedCount / totalRecommendations : 0

    return {
      totalRecommendations,
      redeemedCount,
      redemptionRate,
      favoriteCategory: profile.preferredCategories[0] || '餐饮',
      favoriteDistrict: profile.preferredDistricts[0] || '和平区',
    }
  }
}

export const recommendationService = new RecommendationService()