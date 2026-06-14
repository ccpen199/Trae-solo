import * as repositories from '../repositories/index.js'
import * as recommendEngine from '../engine/recommendEngine.js'
import type {
  ApiResponse,
  GenerateRecommendRequest,
  GenerateRecommendResponse,
  StudentProfileInput,
  University,
  Major,
  AdmissionScore
} from '../types/index.js'

interface AdmissionScoresResponse {
  university: University
  scores: Array<{
    year: number
    major: Major
    minScore: number
    minRank?: number
  }>
}

interface ProbabilitySimulationResponse {
  probability: number
  tier: string
  scoreDeviation: number
  rankDeviation: number
  yearBreakdown: Array<{
    year: number
    probability: number
    minScore: number
    minRank?: number
  }>
  recommendations: string[]
}

interface UniversityComparison {
  university: University
  scores: {
    level: number
    research: number
    employment: number
    city: number
    overall: number
  }
}

interface MajorComparison {
  major: Major
  scores: {
    category: number
    employment: number
    salary: number
    overall: number
  }
}

const recommendService = {
  async generateRecommendations(
    userId: number,
    request: GenerateRecommendRequest
  ): Promise<ApiResponse<GenerateRecommendResponse>> {
    try {
      const profile: StudentProfileInput = {
        score: request.profile.score,
        rank: request.profile.rank,
        province: request.profile.province,
        subjects: request.profile.subjects || request.profile.subjectCombination || [],
        batch: request.profile.batch || '本科批',
        targetCities: request.profile.targetCities || request.profile.preferredProvinces || []
      }

      repositories.studentProfileRepository.create({
        userId,
        score: profile.score,
        rank: profile.rank,
        province: profile.province,
        subjects: profile.subjects,
        batch: profile.batch,
        targetCities: profile.targetCities || []
      })

      repositories.assessmentRepository.create({
        userId,
        holland: request.assessment.holland,
        mbti: request.assessment.mbti
      })

      const universities = repositories.universityRepository.findAll()
      const majors = repositories.majorRepository.findAll()
      const admissionScores = repositories.admissionScoreRepository.getByUniversityAndProvince(
        0,
        profile.province
      )

      const allScores = repositories.admissionScoreRepository.findAll()

      const result = recommendEngine.generateRecommendations({
        profile,
        assessment: request.assessment,
        preferences: request.preferences,
        universities,
        majors,
        admissionScores: allScores
      })

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成推荐失败'
      }
    }
  },

  getAdmissionScores(
    universityId: number,
    province: string
  ): ApiResponse<AdmissionScoresResponse> {
    try {
      const university = repositories.universityRepository.findById(universityId)
      if (!university) {
        return {
          success: false,
          error: '院校不存在'
        }
      }

      const scores = repositories.admissionScoreRepository.getByUniversityAndProvince(
        universityId,
        province
      )

      const majorsMap = new Map<number, Major>()
      const majors = repositories.majorRepository.findAll()
      majors.forEach(m => majorsMap.set(m.id, m))

      const formattedScores = scores.map(score => ({
        year: score.year,
        major: majorsMap.get(score.majorId) || {
          id: score.majorId,
          name: '未知专业',
          code: '',
          category: undefined,
          subjectRequirements: undefined,
          employmentRate: undefined,
          avgSalary: undefined,
          courses: undefined,
          description: undefined,
          createdAt: ''
        },
        minScore: score.minScore,
        minRank: score.minRank
      }))

      return {
        success: true,
        data: {
          university,
          scores: formattedScores
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取投档线失败'
      }
    }
  },

  getProbabilitySimulation(
    universityId: number,
    majorId: number,
    studentScore: number,
    studentRank: number,
    province: string
  ): ApiResponse<ProbabilitySimulationResponse> {
    try {
      const scores = repositories.admissionScoreRepository.getByUniversityMajorAndProvince(
        universityId,
        majorId,
        province
      )

      if (scores.length === 0) {
        return {
          success: false,
          error: '未找到该院校专业的历年投档数据'
        }
      }

      const overallProbability = recommendEngine.calculateAdmissionProbability(
        studentScore,
        studentRank,
        scores as unknown as AdmissionScore[]
      )

      const yearBreakdown = scores.map(score => {
        const yearScores = [score]
        const probability = recommendEngine.calculateAdmissionProbability(
          studentScore,
          studentRank,
          yearScores as unknown as AdmissionScore[]
        )
        return {
          year: score.year,
          probability,
          minScore: score.minScore,
          minRank: score.minRank
        }
      })

      let tier = 'reach'
      if (overallProbability >= 85) tier = 'safe'
      else if (overallProbability >= 60) tier = 'stable'

      const avgScore = scores.reduce((sum, s) => sum + s.minScore, 0) / scores.length
      const avgRank = scores.filter(s => s.minRank).reduce((sum, s) => sum + (s.minRank || 0), 0) / 
        (scores.filter(s => s.minRank).length || 1)

      const recommendations: string[] = []
      if (overallProbability >= 85) {
        recommendations.push('录取概率很高，可作为保底院校')
      } else if (overallProbability >= 60) {
        recommendations.push('录取概率适中，可作为稳妥院校')
      } else {
        recommendations.push('录取概率较低，可作为冲刺院校')
      }

      if (studentScore < avgScore - 30) {
        recommendations.push('分数与历年投档线差距较大，建议慎重考虑')
      } else if (studentScore > avgScore + 20) {
        recommendations.push('分数优势明显，录取把握较大')
      }

      return {
        success: true,
        data: {
          probability: overallProbability,
          tier,
          scoreDeviation: Math.round(studentScore - avgScore),
          rankDeviation: avgRank > 0 ? Math.round((studentRank - avgRank) / avgRank * 100) : 0,
          yearBreakdown,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '录取概率模拟失败'
      }
    }
  },

  compareUniversities(universityIds: number[]): ApiResponse<UniversityComparison[]> {
    try {
      const comparisons: UniversityComparison[] = []

      for (const id of universityIds) {
        const university = repositories.universityRepository.findById(id)
        if (!university) continue

        const levelScore = university.level === '985' ? 100 :
          university.level === '211' ? 90 :
          university.level === '双一流' ? 85 :
          university.level === '普通本科' ? 70 : 50

        const researchScore = Math.min(100, 
          (university.masterPoints || 0) * 0.5 + (university.doctorPoints || 0) * 0.5
        )

        const employmentScore = university.employmentRate || 75

        const cityWeights: Record<string, number> = {
          '北京': 100, '上海': 98, '广州': 90, '深圳': 92,
          '杭州': 88, '南京': 85, '成都': 82, '武汉': 82,
          '西安': 80, '重庆': 80, '天津': 78, '苏州': 85
        }
        const cityScore = cityWeights[university.city] || 70

        const overall = Math.round(
          levelScore * 0.35 + researchScore * 0.25 + employmentScore * 0.25 + cityScore * 0.15
        )

        comparisons.push({
          university,
          scores: {
            level: levelScore,
            research: Math.round(researchScore),
            employment: employmentScore,
            city: cityScore,
            overall
          }
        })
      }

      return {
        success: true,
        data: comparisons
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '院校对比失败'
      }
    }
  },

  compareMajors(majorIds: number[]): ApiResponse<MajorComparison[]> {
    try {
      const comparisons: MajorComparison[] = []

      const categoryScores: Record<string, number> = {
        '工学': 90, '理学': 85, '医学': 92, '文学': 75,
        '经济学': 88, '管理学': 82, '法学': 80, '教育学': 78,
        '历史学': 70, '哲学': 68, '农学': 75, '艺术学': 80
      }

      for (const id of majorIds) {
        const major = repositories.majorRepository.findById(id)
        if (!major) continue

        const categoryScore = categoryScores[major.category || ''] || 75
        const employmentScore = major.employmentRate || 75
        const salaryScore = major.avgSalary 
          ? Math.max(0, Math.min(100, ((major.avgSalary - 3000) / 17000) * 100))
          : 70

        const overall = Math.round(
          categoryScore * 0.35 + employmentScore * 0.35 + salaryScore * 0.3
        )

        comparisons.push({
          major,
          scores: {
            category: categoryScore,
            employment: employmentScore,
            salary: Math.round(salaryScore),
            overall
          }
        })
      }

      return {
        success: true,
        data: comparisons
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '专业对比失败'
      }
    }
  }
}

export default recommendService
