import { lawyers, consultations, monitoringStats } from '@/mock/data'
import type { Lawyer, Consultation } from '@/types'

export interface PlatformStats {
  totalConsultations: number
  todayConsultations: number
  completedConsultations: number
  inProgressCount: number
  pendingCount: number
  totalLawyers: number
  activeLawyers: number
  frozenLawyers: number
  verifiedLawyers: number
  unverifiedLawyers: number
  avgResponseTime: number
  avgRating: number
  saturationPct: number
  totalFrozen: number
  verifiedPct: number
  satisfactionPct: number
  avgConsultationsPerLawyer: number
  creditInsufficientLawyers: number
}

export function computePlatformStats(): PlatformStats {
  const totalConsultations = monitoringStats.totalConsultations
  const todayConsultations = monitoringStats.todayConsultations
  const completedConsultations = consultations.filter(c => c.status === 'completed').length
  const inProgressCount = monitoringStats.inProgressCount
  const pendingCount = consultations.filter(c => c.status === 'pending').length

  const totalLawyers = lawyers.length
  const activeLawyers = lawyers.filter(l => l.status === 'active').length
  const frozenLawyers = lawyers.filter(l => l.status === 'frozen').length
  const verifiedLawyers = lawyers.filter(l => l.licenseVerified).length
  const unverifiedLawyers = lawyers.filter(l => !l.licenseVerified).length
  const creditInsufficientLawyers = lawyers.filter(l => (l.continuingEducationCredits || 0) < 40).length

  const avgResponseTime = monitoringStats.avgResponseTime
  const avgRating = monitoringStats.avgRating

  const saturationPct = Math.min(100, Math.round(
    inProgressCount / Math.max(activeLawyers * 5, 1) * 100
  ))
  const totalFrozen = frozenLawyers + monitoringStats.frozenLawyers
  const verifiedPct = totalLawyers > 0 ? Math.round(verifiedLawyers / totalLawyers * 100) : 0
  const satisfactionPct = Math.round(avgRating * 20)
  const avgConsultationsPerLawyer = activeLawyers > 0 
    ? Math.round((totalConsultations / activeLawyers) * 10) / 10 
    : 0

  return {
    totalConsultations,
    todayConsultations,
    completedConsultations,
    inProgressCount,
    pendingCount,
    totalLawyers,
    activeLawyers,
    frozenLawyers,
    verifiedLawyers,
    unverifiedLawyers,
    avgResponseTime,
    avgRating,
    saturationPct,
    totalFrozen,
    verifiedPct,
    satisfactionPct,
    avgConsultationsPerLawyer,
    creditInsufficientLawyers,
  }
}

export interface LawyerActivityExt extends Lawyer {
  todayConsultations: number
  avgResponseTime: number
  avgRating: number
  saturation: number
  lastActiveAt: number
  responseRate: number
}

export function computeLawyerActivities(): LawyerActivityExt[] {
  const uniqueLawyers = Array.from(
    new Map(lawyers.map(l => [l.id, l])).values()
  )

  return uniqueLawyers.map(lawyer => {
    const lawyerConsultations = consultations.filter(
      c => c.lawyerId === lawyer.id
    )
    const todayConsultations = lawyerConsultations.filter(
      c => c.createdAt > Date.now() - 24 * 60 * 60 * 1000
    ).length
    const completed = lawyerConsultations.filter(c => c.status === 'completed').length
    const total = lawyerConsultations.length
    const responseRate = total > 0 ? Math.round(completed / total * 100) : 0

    return {
      ...lawyer,
      todayConsultations: 2 + Math.floor(Math.random() * 4),
      avgResponseTime: 5 + Math.floor(Math.random() * 20),
      avgRating: 4.0 + Math.random() * 1.0,
      saturation: Math.min(100, 20 + Math.floor(Math.random() * 60)),
      lastActiveAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      responseRate,
    }
  })
}

export function getFrozenLawyers(): LawyerActivityExt[] {
  return computeLawyerActivities().filter(l => l.status === 'frozen')
}

export function getWarningLawyers(): LawyerActivityExt[] {
  return computeLawyerActivities().filter(
    l => l.status === 'active' && l.responseRate < 60
  )
}
