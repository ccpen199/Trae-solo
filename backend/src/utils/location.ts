export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function normalizeLocationScore(distance: number, maxDistance = 50): number {
  if (distance <= 0) return 100
  if (distance >= maxDistance) return 0
  return Math.max(0, Math.min(100, 100 * (1 - distance / maxDistance)))
}

export function normalizePerformanceScore(score: number): number {
  return Math.max(0, Math.min(100, score * 20))
}

export function calculateMatchScore(
  skillScore: number,
  locationScore: number,
  performanceScore: number,
  weights = { skill: 0.4, location: 0.3, performance: 0.3 }
): number {
  return Math.round(
    skillScore * weights.skill +
    locationScore * weights.location +
    performanceScore * weights.performance
  )
}

export function calculateSkillMatchScore(
  workerTradeIds: number[],
  jobTradeId: number,
  workerCertificates: { certificateType: string; verified: boolean }[],
  qualificationRequired: string
): number {
  let score = 0

  if (workerTradeIds.includes(jobTradeId)) {
    score += 50
  }

  const certTypes = workerCertificates
    .filter(c => c.verified)
    .map(c => c.certificateType)

  if (qualificationRequired && certTypes.includes(qualificationRequired)) {
    score += 30
  } else if (certTypes.length > 0) {
    score += 15
  }

  if (workerCertificates.some(c => c.verified)) {
    score += 20
  }

  return Math.min(100, score)
}
