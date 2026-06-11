import db from '../database.js'
import { getCounselors, getTimeSlots } from './counselorService.js'
import { getProfile } from './profileService.js'

interface MatchResult {
  counselor: any
  score: number
  breakdown: {
    expertise_score: number
    schedule_score: number
    preference_score: number
  }
}

export function matchCounselors(profileId: string): MatchResult[] {
  const profile = getProfile(profileId)
  if (!profile) return []

  const counselors = getCounselors()
  const results: MatchResult[] = []

  for (const counselor of counselors) {
    const expertiseScore = calcExpertiseScore(profile, counselor)
    const scheduleScore = calcScheduleScore(counselor.id)
    const preferenceScore = calcPreferenceScore(profile, counselor)

    const composite = expertiseScore * 0.6 + scheduleScore * 0.25 + preferenceScore * 0.15
    const toPercent = (score: number) => Math.round(score * 100)

    results.push({
      counselor,
      score: toPercent(composite),
      breakdown: {
        expertise_score: toPercent(expertiseScore),
        schedule_score: toPercent(scheduleScore),
        preference_score: toPercent(preferenceScore),
      },
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

function calcExpertiseScore(profile: any, counselor: any): number {
  const profileTags: string[] = profile.life_event_tags ?? []
  const counselorTags: string[] = counselor.expertise_tags ?? []

  if (profileTags.length === 0 || counselorTags.length === 0) return 0.5

  const matchCount = profileTags.filter(tag => counselorTags.includes(tag)).length
  return matchCount / profileTags.length
}

function calcScheduleScore(counselorId: string): number {
  const slots = getTimeSlots(counselorId) as any[]
  if (slots.length === 0) return 0

  const availableCount = slots.filter(s => s.is_available === 1).length
  return Math.min(availableCount / 10, 1)
}

function calcPreferenceScore(profile: any, counselor: any): number {
  let score = 0.5

  if (counselor.rating >= 4.7) score += 0.3
  else if (counselor.rating >= 4.5) score += 0.15

  if (counselor.credential_type === '二级' || counselor.credential_type === '一级') score += 0.2

  if (profile.risk_level === 'high' || profile.risk_level === 'critical') {
    if (counselor.session_count > 50) score += 0.1
  }

  return Math.min(score, 1)
}
