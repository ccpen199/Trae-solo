import type {
  AdmissionScore,
  Major,
  University,
  HollandScores,
  StudentProfileInput,
  RecommendItemResult,
  GenerateRecommendResponse,
  AnalyzePlanResponse,
  PlanTier,
} from '../types'

interface GenerateRecommendParams {
  profile: StudentProfileInput
  assessment: {
    holland: HollandScores
    mbti: string
  }
  preferences: {
    universityWeight: number
    majorWeight: number
    cityWeight: number
    employmentWeight: number
    familyWishes?: string
  }
  universities: University[]
  majors: Major[]
  admissionScores: AdmissionScore[]
}

interface PlanItemInput {
  universityId: number
  majorId: number
  order: number
}

const YEAR_WEIGHTS: Record<number, number> = {
  2025: 0.5,
  2024: 0.35,
  2023: 0.15,
}

const SCORE_DEVIATION = 30
const RANK_DEVIATION = 0.2

const HOLLAND_CATEGORY_MAP: Record<string, string[]> = {
  R: ['工学', '农学', '理学'],
  I: ['理学', '工学', '医学'],
  A: ['文学', '艺术学', '哲学'],
  S: ['教育学', '医学', '法学'],
  E: ['经济学', '管理学', '法学'],
  C: ['管理学', '经济学', '法学'],
}

const MBTI_DIMENSION_MAP: Record<string, Record<string, number>> = {
  INTJ: { 工学: 85, 理学: 80, 经济学: 70, 管理学: 65 },
  INTP: { 理学: 90, 工学: 85, 哲学: 75 },
  ENTJ: { 管理学: 90, 经济学: 85, 法学: 80 },
  ENTP: { 经济学: 85, 管理学: 80, 工学: 75 },
  INFJ: { 教育学: 90, 文学: 85, 心理学: 80 },
  INFP: { 文学: 90, 艺术学: 85, 教育学: 75 },
  ENFJ: { 教育学: 95, 文学: 85, 管理学: 80 },
  ENFP: { 艺术学: 90, 文学: 85, 教育学: 80 },
  ISTJ: { 管理学: 85, 法学: 80, 工学: 75 },
  ISFJ: { 医学: 90, 教育学: 85, 管理学: 75 },
  ESTJ: { 管理学: 90, 法学: 85, 经济学: 80 },
  ESFJ: { 教育学: 90, 医学: 85, 管理学: 80 },
  ISTP: { 工学: 90, 理学: 80, 农学: 75 },
  ISFP: { 艺术学: 90, 文学: 80, 农学: 70 },
  ESTP: { 经济学: 85, 管理学: 80, 体育学: 75 },
  ESFP: { 艺术学: 90, 教育学: 80, 管理学: 70 },
}

const UNIVERSITY_LEVEL_SCORE: Record<string, number> = {
  '985': 100,
  '211': 90,
  '双一流': 85,
  '普通本科': 70,
  '专科': 50,
}

function normalizeScore(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

function calculateYearWeight(year: number): number {
  return YEAR_WEIGHTS[year] || 0.1
}

function parseSubjectRequirement(requirement: string): string[] {
  if (requirement === '不限' || requirement === '无') {
    return []
  }
  return requirement.split(/[+、，,]/).filter(Boolean)
}

export function calculateAdmissionProbability(
  studentScore: number,
  studentRank: number,
  scores: AdmissionScore[]
): number {
  if (!scores || scores.length === 0) {
    return 0
  }

  const validScores = scores.filter((s) => s.min_score > 0)
  if (validScores.length === 0) {
    return 0
  }

  let totalWeight = 0
  let weightedProbability = 0

  for (const scoreData of validScores) {
    const yearWeight = calculateYearWeight(scoreData.year)
    if (yearWeight === 0) continue

    let yearProbability = 0

    const scoreDiff = studentScore - scoreData.min_score

    if (scoreDiff >= SCORE_DEVIATION) {
      yearProbability = 98
    } else if (scoreDiff <= -SCORE_DEVIATION) {
      yearProbability = 5
    } else {
      yearProbability = 50 + (scoreDiff / SCORE_DEVIATION) * 45
    }

    if (scoreData.min_rank && studentRank > 0) {
      const rankRatio = studentRank / scoreData.min_rank
      let rankProbability: number

      if (rankRatio <= 1 - RANK_DEVIATION) {
        rankProbability = 98
      } else if (rankRatio >= 1 + RANK_DEVIATION) {
        rankProbability = 5
      } else {
        rankProbability = 50 - ((rankRatio - 1) / RANK_DEVIATION) * 45
      }

      yearProbability = yearProbability * 0.6 + rankProbability * 0.4
    }

    totalWeight += yearWeight
    weightedProbability += yearProbability * yearWeight
  }

  if (totalWeight === 0) {
    return 50
  }

  const finalProbability = weightedProbability / totalWeight

  return Math.max(0, Math.min(100, Math.round(finalProbability)))
}

export function matchSubjectRequirements(
  studentSubjects: string[],
  majorRequirements: string[] | string
): { matched: boolean; reason?: string } {
  const requirements =
    typeof majorRequirements === 'string'
      ? parseSubjectRequirement(majorRequirements)
      : majorRequirements

  if (requirements.length === 0) {
    return { matched: true, reason: '专业无选科限制' }
  }

  const studentSet = new Set(studentSubjects.map((s) => s.trim()))
  const requiredSet = new Set(requirements.map((r) => r.trim()))

  for (const req of requiredSet) {
    if (!studentSet.has(req)) {
      return {
        matched: false,
        reason: `缺少必选科目: ${req}，需要 ${requirements.join('+')}`,
      }
    }
  }

  return {
    matched: true,
    reason: `选科匹配: ${studentSubjects.join('+')} 满足 ${requirements.join('+')}`,
  }
}

export function calculateInterestMatch(
  hollandScores: HollandScores,
  mbtiType: string,
  majorCategory: string
): number {
  let hollandMatch = 0
  let mbtiMatch = 0

  const hollandDimensions = ['R', 'I', 'A', 'S', 'E', 'C'] as const
  const totalHolland = hollandDimensions.reduce(
    (sum, dim) => sum + (hollandScores[dim] || 0),
    0
  )

  if (totalHolland > 0) {
    let weightedMatch = 0
    let totalWeight = 0

    for (const dim of hollandDimensions) {
      const score = hollandScores[dim] || 0
      const weight = score / totalHolland
      const categories = HOLLAND_CATEGORY_MAP[dim] || []

      if (categories.includes(majorCategory)) {
        weightedMatch += weight * 100
      } else {
        weightedMatch += weight * 40
      }
      totalWeight += weight
    }

    hollandMatch = totalWeight > 0 ? weightedMatch / totalWeight : 50
  } else {
    hollandMatch = 50
  }

  const mbtiUpper = mbtiType.toUpperCase()
  if (MBTI_DIMENSION_MAP[mbtiUpper]) {
    mbtiMatch = MBTI_DIMENSION_MAP[mbtiUpper][majorCategory] || 50
  } else {
    const ei = mbtiUpper.includes('E') ? 1 : 0
    const sn = mbtiUpper.includes('S') ? 1 : 0
    const tf = mbtiUpper.includes('T') ? 1 : 0
    const jp = mbtiUpper.includes('J') ? 1 : 0

    let baseScore = 50
    if (['工学', '理学'].includes(majorCategory)) {
      baseScore += tf * 20 + sn * 10 + (1 - ei) * 10
    } else if (['文学', '艺术学'].includes(majorCategory)) {
      baseScore += (1 - tf) * 15 + (1 - sn) * 15 + ei * 10
    } else if (['经济学', '管理学'].includes(majorCategory)) {
      baseScore += jp * 15 + tf * 10 + ei * 15
    } else if (['教育学', '医学'].includes(majorCategory)) {
      baseScore += (1 - tf) * 20 + ei * 15 + sn * 10
    }
    mbtiMatch = Math.max(30, Math.min(95, baseScore))
  }

  return Math.round(hollandMatch * 0.6 + mbtiMatch * 0.4)
}

function calculateUniversityScore(university: University): number {
  let score = 0

  if (university.level) {
    score += UNIVERSITY_LEVEL_SCORE[university.level] || 60
  } else {
    score += 60
  }

  const researchScore = Math.min(
    100,
    (university.master_points || 0) * 0.5 + (university.doctor_points || 0) * 0.5
  )
  score = score * 0.7 + researchScore * 0.3

  return Math.round(score)
}

function calculateMajorScore(major: Major): number {
  if (!major.category && !major.employment_rate && !major.avg_salary) {
    return 70
  }

  let score = 70

  if (major.employment_rate) {
    score += major.employment_rate * 0.2
  }

  if (major.avg_salary) {
    score += normalizeScore(major.avg_salary, 3000, 20000) * 0.15
  }

  return Math.round(Math.max(30, Math.min(100, score)))
}

function calculateCityScore(city: string, targetCities: string[]): number {
  if (!targetCities || targetCities.length === 0) {
    return 70
  }

  const cityLower = city.toLowerCase()
  const targetsLower = targetCities.map((c) => c.toLowerCase())

  if (targetsLower.includes(cityLower)) {
    return 100
  }

  const provinceMap: Record<string, string[]> = {
    北京: ['北京'],
    上海: ['上海'],
    广东: ['广州', '深圳', '珠海', '佛山', '东莞'],
    江苏: ['南京', '苏州', '无锡', '常州', '南通'],
    浙江: ['杭州', '宁波', '温州', '绍兴', '嘉兴'],
    四川: ['成都', '绵阳', '德阳'],
    湖北: ['武汉', '宜昌', '襄阳'],
    陕西: ['西安', '咸阳'],
    山东: ['济南', '青岛', '烟台', '威海'],
    辽宁: ['沈阳', '大连'],
    福建: ['福州', '厦门', '泉州'],
    湖南: ['长沙', '株洲', '湘潭'],
    安徽: ['合肥', '芜湖'],
    重庆: ['重庆'],
    天津: ['天津'],
  }

  for (const [province, cities] of Object.entries(provinceMap)) {
    if (cities.map((c) => c.toLowerCase()).includes(cityLower)) {
      for (const target of targetsLower) {
        if (target.includes(province.toLowerCase())) {
          return 85
        }
      }
    }
  }

  const eastCities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '宁波', '无锡', '常州']
  if (eastCities.map((c) => c.toLowerCase()).includes(cityLower)) {
    return 75
  }

  return 50
}

function calculateEmploymentScore(
  university: University,
  major: Major
): number {
  const uniEmployment = university.employment_rate || 85
  const majorEmployment = major.employment_rate || 85
  const avgSalary = major.avg_salary || 6000

  const salaryScore = normalizeScore(avgSalary, 3000, 20000)

  return Math.round(uniEmployment * 0.3 + majorEmployment * 0.4 + salaryScore * 0.3)
}

function getTierByProbability(probability: number): PlanTier {
  if (probability >= 85) return 'safe'
  if (probability >= 60) return 'stable'
  return 'reach'
}

function detectConflicts(
  items: Array<{
    universityId: number
    majorId: number
    probability: number
    subjectMatched: boolean
  }>
): string[] {
  const warnings: string[] = []

  const universityCount = new Map<number, number>()
  for (const item of items) {
    universityCount.set(
      item.universityId,
      (universityCount.get(item.universityId) || 0) + 1
    )
  }

  for (const [uniId, count] of universityCount.entries()) {
    if (count > 3) {
      warnings.push(`院校 ID ${uniId} 出现 ${count} 次，建议控制在 3 次以内`)
    }
  }

  for (let i = 0; i < items.length; i++) {
    if (!items[i].subjectMatched) {
      warnings.push(`第 ${i + 1} 个志愿选科不匹配，存在退档风险`)
    }
  }

  if (items.length >= 5) {
    let hasReach = false
    let hasStable = false
    let hasSafe = false

    for (const item of items) {
      if (item.probability >= 85) hasSafe = true
      else if (item.probability >= 60) hasStable = true
      else hasReach = true
    }

    if (!hasReach) {
      warnings.push('志愿方案中缺少冲刺型院校，可适当增加冲高机会')
    }
    if (!hasStable) {
      warnings.push('志愿方案中缺少稳妥型院校，建议补充')
    }
    if (!hasSafe) {
      warnings.push('志愿方案中缺少保底型院校，存在滑档风险')
    }

    for (let i = 1; i < items.length; i++) {
      if (items[i].probability < items[i - 1].probability - 15) {
        warnings.push(
          `第 ${i} 和 ${i + 1} 志愿间概率差过大（${items[i - 1].probability}% → ${items[i].probability}%），志愿梯度不合理`
        )
      }
    }
  }

  return warnings
}

export function generateRecommendations(
  params: GenerateRecommendParams
): GenerateRecommendResponse {
  const { profile, assessment, preferences, universities, majors, admissionScores } =
    params

  const { universityWeight, majorWeight, cityWeight, employmentWeight } =
    preferences

  const totalWeight = universityWeight + majorWeight + cityWeight + employmentWeight
  const normalizedUniW = universityWeight / totalWeight
  const normalizedMajorW = majorWeight / totalWeight
  const normalizedCityW = cityWeight / totalWeight
  const normalizedEmploymentW = employmentWeight / totalWeight

  const scoreCache = new Map<string, AdmissionScore[]>()
  for (const score of admissionScores) {
    const key = `${score.university_id}_${score.major_id}`
    if (!scoreCache.has(key)) {
      scoreCache.set(key, [])
    }
    scoreCache.get(key)!.push(score)
  }

  const candidateItems: Array<{
    universityId: number
    universityName: string
    majorId: number
    majorName: string
    probability: number
    tier: PlanTier
    score: number
    matchReasons: string[]
    subjectMatched: boolean
  }> = []

  for (const university of universities) {
    const uniScore = calculateUniversityScore(university)
    const cityScore = calculateCityScore(university.city, profile.targetCities || [])

    for (const major of majors) {
      const subjectMatch = matchSubjectRequirements(
        profile.subjects,
        major.subject_requirements || '不限'
      )

      if (!subjectMatch.matched) {
        continue
      }

      const key = `${university.id}_${major.id}`
      const scores = scoreCache.get(key) || []
      const probability = calculateAdmissionProbability(
        profile.score,
        profile.rank,
        scores
      )

      const majorScore = calculateMajorScore(major)
      const employmentScore = calculateEmploymentScore(university, major)
      const interestMatch = calculateInterestMatch(
        assessment.holland,
        assessment.mbti,
        major.category || ''
      )

      const finalScore =
        uniScore * normalizedUniW +
        majorScore * normalizedMajorW +
        cityScore * normalizedCityW +
        employmentScore * normalizedEmploymentW

      const adjustedScore = finalScore * 0.7 + interestMatch * 0.3

      const matchReasons: string[] = []
      matchReasons.push(subjectMatch.reason || '选科符合要求')
      matchReasons.push(`兴趣匹配度 ${interestMatch}%`)
      if (cityScore >= 85) {
        matchReasons.push(`城市偏好匹配: ${university.city}`)
      }
      if (uniScore >= 85) {
        matchReasons.push(`院校层次: ${university.level || '优质院校'}`)
      }
      if (employmentScore >= 80) {
        matchReasons.push(`就业前景良好`)
      }

      candidateItems.push({
        universityId: university.id,
        universityName: university.name,
        majorId: major.id,
        majorName: major.name,
        probability,
        tier: getTierByProbability(probability),
        score: Math.round(adjustedScore),
        matchReasons,
        subjectMatched: true,
      })
    }
  }

  candidateItems.sort((a, b) => b.score - a.score)

  const reach: RecommendItemResult[] = []
  const stable: RecommendItemResult[] = []
  const safe: RecommendItemResult[] = []

  for (const item of candidateItems) {
    const resultItem: RecommendItemResult = {
      universityId: item.universityId,
      universityName: item.universityName,
      majorId: item.majorId,
      majorName: item.majorName,
      probability: item.probability,
      tier: item.tier,
      score: item.score,
      matchReasons: item.matchReasons,
    }

    if (item.tier === 'reach' && reach.length < 10) {
      reach.push(resultItem)
    } else if (item.tier === 'stable' && stable.length < 10) {
      stable.push(resultItem)
    } else if (item.tier === 'safe' && safe.length < 10) {
      safe.push(resultItem)
    }
  }

  const conflictWarnings = detectConflicts(
    [...reach, ...stable, ...safe].map((item) => ({
      universityId: item.universityId,
      majorId: item.majorId,
      probability: item.probability,
      subjectMatched: true,
    }))
  )

  return {
    reach,
    stable,
    safe,
    conflictWarnings,
  }
}

export function analyzePlanRisk(
  planItems: PlanItemInput[],
  studentProfile: StudentProfileInput,
  admissionScores: AdmissionScore[]
): AnalyzePlanResponse {
  const sortedItems = [...planItems].sort((a, b) => a.order - b.order)

  const scoreCache = new Map<string, AdmissionScore[]>()
  for (const score of admissionScores) {
    const key = `${score.university_id}_${score.major_id}`
    if (!scoreCache.has(key)) {
      scoreCache.set(key, [])
    }
    scoreCache.get(key)!.push(score)
  }

  const probabilities: number[] = []
  const conflicts: string[] = []
  const suggestions: string[] = []

  const universityCount = new Map<number, number>()

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    universityCount.set(
      item.universityId,
      (universityCount.get(item.universityId) || 0) + 1
    )

    const key = `${item.universityId}_${item.majorId}`
    const scores = scoreCache.get(key) || []

    const probability = calculateAdmissionProbability(
      studentProfile.score,
      studentProfile.rank,
      scores
    )
    probabilities.push(probability)

    if (probability < 30) {
      conflicts.push(
        `第 ${i + 1} 志愿录取概率仅 ${probability}%，冲刺风险过高`
      )
    }
  }

  for (const [uniId, count] of universityCount.entries()) {
    if (count > 3) {
      conflicts.push(`院校 ID ${uniId} 重复填报 ${count} 次，建议分散志愿`)
    }
  }

  const overallProbability =
    probabilities.length > 0
      ? Math.round(
          probabilities.reduce((sum, p) => sum + (100 - (100 - p) / probabilities.length), 0)
        )
      : 0

  let slipRisk = 0
  if (probabilities.length >= 3) {
    const minProbability = Math.min(...probabilities)
    if (minProbability >= 90) {
      slipRisk = 10
    } else if (minProbability >= 70) {
      slipRisk = 25
    } else if (minProbability >= 50) {
      slipRisk = 45
    } else if (minProbability >= 30) {
      slipRisk = 65
    } else {
      slipRisk = 85
    }

    let gradientScore = 0
    for (let i = 1; i < probabilities.length; i++) {
      const diff = probabilities[i - 1] - probabilities[i]
      if (diff > 20) {
        gradientScore += 20
        conflicts.push(
          `第 ${i} 和 ${i + 1} 志愿间概率差过大（${probabilities[i - 1]}% → ${probabilities[i]}%）`
        )
      } else if (diff > 10) {
        gradientScore += 5
      } else if (diff < -5) {
        gradientScore += 15
        conflicts.push(
          `第 ${i} 和 ${i + 1} 志愿顺序倒置，概率递增（${probabilities[i - 1]}% → ${probabilities[i]}%）`
        )
      }
    }
    slipRisk = Math.min(100, slipRisk + gradientScore / probabilities.length)
  } else {
    slipRisk = 60
    suggestions.push('志愿数量较少，建议增加更多志愿以降低滑档风险')
  }

  let adjustmentRisk = 0
  for (const prob of probabilities) {
    if (prob < 60) {
      adjustmentRisk += 20
    } else if (prob < 75) {
      adjustmentRisk += 10
    } else if (prob < 85) {
      adjustmentRisk += 3
    }
  }
  adjustmentRisk = Math.min(
    100,
    probabilities.length > 0 ? (adjustmentRisk / probabilities.length) * 3 : 50
  )

  if (overallProbability < 50) {
    suggestions.push('整体录取概率偏低，建议增加保底院校')
  }
  if (slipRisk > 50) {
    suggestions.push('滑档风险较高，建议补充 2-3 所稳妥/保底院校')
  }
  if (adjustmentRisk > 40) {
    suggestions.push('调剂风险较高，建议勾选专业服从调剂')
  }

  const hasSafe = probabilities.some((p) => p >= 85)
  if (!hasSafe && probabilities.length >= 3) {
    suggestions.push('缺少录取概率 85% 以上的保底院校，建议补充')
  }

  return {
    overallProbability: Math.max(0, Math.min(100, Math.round(overallProbability))),
    slipRisk: Math.round(slipRisk),
    adjustmentRisk: Math.round(adjustmentRisk),
    conflicts,
    suggestions,
  }
}
