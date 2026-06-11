import type { Lawyer, LegalCaseType } from '@/types'
import { lawyers } from '@/mock/data'

export interface DispatchMatchResult {
  lawyerId: string
  score: number
  details: {
    expertiseScore: number
    regionScore: number
    creditScore: number
    ratingScore: number
    responseRateScore: number
    loadScore: number
    activityScore: number
  }
}

interface DispatchOptions {
  caseType: LegalCaseType
  region: string
  limit?: number
  includeInactive?: boolean
}

const EXPERTISE_MATCH_WEIGHT = 30
const REGION_MATCH_WEIGHT = 20
const CREDIT_SCORE_WEIGHT = 15
const RATING_WEIGHT = 15
const RESPONSE_RATE_WEIGHT = 10
const LOAD_BALANCE_WEIGHT = 5
const ACTIVITY_WEIGHT = 5

function calculateExpertiseScore(lawyer: Lawyer, caseType: LegalCaseType): number {
  if (lawyer.expertise.includes(caseType)) {
    return 100
  }
  const overlapCount = lawyer.expertise.filter(e => {
    const relatedGroups: Record<string, string[]> = {
      marriage: ['property', 'contract'],
      labor: ['contract', 'debt'],
      debt: ['contract', 'labor'],
      property: ['marriage', 'contract'],
      contract: ['debt', 'property', 'labor'],
      traffic: ['debt', 'criminal'],
      criminal: ['traffic']
    }
    return relatedGroups[caseType]?.includes(e) || relatedGroups[e]?.includes(caseType)
  }).length
  return overlapCount > 0 ? 50 : 10
}

function calculateRegionScore(lawyer: Lawyer, region: string): number {
  if (lawyer.regions.includes(region)) {
    return 100
  }
  const provinceMatch = lawyer.regions.some(r => {
    return region.includes(r) || r.includes(region)
  })
  if (provinceMatch) return 60
  return 20
}

function calculateCreditScore(lawyer: Lawyer): number {
  return Math.min(100, Math.floor((lawyer.creditScore / 1000) * 100))
}

function calculateRatingScore(lawyer: Lawyer): number {
  return Math.min(100, Math.floor((lawyer.avgRating / 5) * 100))
}

function calculateResponseRateScore(lawyer: Lawyer): number {
  return lawyer.responseRate
}

function calculateLoadScore(lawyer: Lawyer): number {
  const pendingCases = lawyer.totalCases - lawyer.completedCases
  if (pendingCases === 0) return 100
  if (pendingCases <= 3) return 80
  if (pendingCases <= 5) return 60
  if (pendingCases <= 10) return 40
  return 20
}

function calculateActivityScore(lawyer: Lawyer): number {
  const now = Date.now()
  const hoursSinceActive = (now - lawyer.lastActiveAt) / (1000 * 60 * 60)
  if (hoursSinceActive < 1) return 100
  if (hoursSinceActive < 4) return 85
  if (hoursSinceActive < 12) return 70
  if (hoursSinceActive < 24) return 50
  if (hoursSinceActive < 72) return 30
  return 10
}

export function matchLawyers(options: DispatchOptions): DispatchMatchResult[] {
  const { caseType, region, limit = 10, includeInactive = false } = options

  const eligibleLawyers = lawyers.filter(lawyer => {
    if (!includeInactive && lawyer.status !== 'active') {
      return false
    }
    if (lawyer.status === 'frozen') {
      return false
    }
    return true
  })

  const results: DispatchMatchResult[] = eligibleLawyers.map(lawyer => {
    const expertiseScore = calculateExpertiseScore(lawyer, caseType)
    const regionScore = calculateRegionScore(lawyer, region)
    const creditScore = calculateCreditScore(lawyer)
    const ratingScore = calculateRatingScore(lawyer)
    const responseRateScore = calculateResponseRateScore(lawyer)
    const loadScore = calculateLoadScore(lawyer)
    const activityScore = calculateActivityScore(lawyer)

    const totalScore =
      expertiseScore * EXPERTISE_MATCH_WEIGHT / 100 +
      regionScore * REGION_MATCH_WEIGHT / 100 +
      creditScore * CREDIT_SCORE_WEIGHT / 100 +
      ratingScore * RATING_WEIGHT / 100 +
      responseRateScore * RESPONSE_RATE_WEIGHT / 100 +
      loadScore * LOAD_BALANCE_WEIGHT / 100 +
      activityScore * ACTIVITY_WEIGHT / 100

    return {
      lawyerId: lawyer.id,
      score: Math.round(totalScore * 100) / 100,
      details: {
        expertiseScore,
        regionScore,
        creditScore,
        ratingScore,
        responseRateScore,
        loadScore,
        activityScore
      }
    }
  })

  results.sort((a, b) => b.score - a.score)

  return limit ? results.slice(0, limit) : results
}

export function getTopMatchedLawyerIds(
  caseType: LegalCaseType,
  region: string,
  count: number = 5
): string[] {
  const results = matchLawyers({ caseType, region, limit: count })
  return results.map(r => r.lawyerId)
}
