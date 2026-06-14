import * as repositories from '../repositories/index.js'
import * as recommendEngine from '../engine/recommendEngine.js'
import type {
  ApiResponse,
  VolunteerPlan,
  PlanItem,
  StudentProfileInput,
  AnalyzePlanResponse
} from '../types/index.js'

interface CreatePlanRequest {
  userId: number
  name: string
  items: Array<Omit<PlanItem, 'id' | 'planId' | 'createdAt'>>
}

interface UpdatePlanRequest {
  planId: number
  data: Partial<Omit<VolunteerPlan, 'id' | 'createdAt' | 'userId' | 'items'>>
}

interface PlanWithItems extends VolunteerPlan {
  items: PlanItem[]
}

interface ExportReportData {
  plan: PlanWithItems
  analysis: AnalyzePlanResponse
  summary: {
    totalItems: number
    reachCount: number
    stableCount: number
    safeCount: number
    avgProbability: number
  }
}

const volunteerPlanService = {
  createPlan(userId: number, name: string, items: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>[]): ApiResponse<{ planId: number }> {
    try {
      const planId = repositories.volunteerPlanRepository.create({
        userId,
        name,
        slipRisk: undefined,
        adjustmentRisk: undefined,
        conflictWarnings: [],
        items
      })

      return {
        success: true,
        data: { planId },
        message: '志愿方案创建成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建志愿方案失败'
      }
    }
  },

  updatePlan(planId: number, data: Partial<Omit<VolunteerPlan, 'id' | 'createdAt' | 'userId' | 'items'>>): ApiResponse {
    try {
      const plan = repositories.volunteerPlanRepository.findById(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      const updated = repositories.volunteerPlanRepository.update(planId, data)
      if (!updated) {
        return {
          success: false,
          error: '更新志愿方案失败'
        }
      }

      return {
        success: true,
        message: '志愿方案更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新志愿方案失败'
      }
    }
  },

  analyzePlan(planId: number, studentProfile: StudentProfileInput): ApiResponse<AnalyzePlanResponse> {
    try {
      const plan = repositories.volunteerPlanRepository.findByIdWithItems(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      const planItems = plan.items.map(item => ({
        universityId: item.universityId,
        majorId: item.majorId,
        order: item.order
      }))

      const allScores = repositories.admissionScoreRepository.findAll()

      const analysis = recommendEngine.analyzePlanRisk(
        planItems,
        studentProfile,
        allScores
      )

      repositories.volunteerPlanRepository.update(planId, {
        slipRisk: analysis.slipRisk,
        adjustmentRisk: analysis.adjustmentRisk,
        conflictWarnings: analysis.conflicts
      })

      return {
        success: true,
        data: analysis
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析志愿方案失败'
      }
    }
  },

  savePlanItems(planId: number, items: Omit<PlanItem, 'id' | 'planId' | 'createdAt'>[]): ApiResponse {
    try {
      const plan = repositories.volunteerPlanRepository.findById(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      repositories.volunteerPlanRepository.updateItems(planId, items)

      return {
        success: true,
        message: '志愿项保存成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存志愿项失败'
      }
    }
  },

  getPlanById(planId: number): ApiResponse<PlanWithItems> {
    try {
      const plan = repositories.volunteerPlanRepository.findByIdWithItems(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      return {
        success: true,
        data: plan
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取志愿方案失败'
      }
    }
  },

  getUserPlans(userId: number): ApiResponse<VolunteerPlan[]> {
    try {
      const plans = repositories.volunteerPlanRepository.findByUserId(userId)

      return {
        success: true,
        data: plans
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户方案列表失败'
      }
    }
  },

  deletePlan(planId: number): ApiResponse {
    try {
      const plan = repositories.volunteerPlanRepository.findById(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      repositories.volunteerPlanRepository.delete(planId)

      return {
        success: true,
        message: '志愿方案删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除志愿方案失败'
      }
    }
  },

  exportReport(planId: number): ApiResponse<ExportReportData> {
    try {
      const plan = repositories.volunteerPlanRepository.findByIdWithItems(planId)
      if (!plan) {
        return {
          success: false,
          error: '志愿方案不存在'
        }
      }

      const profile = repositories.studentProfileRepository.findByUserId(plan.userId)
      if (!profile) {
        return {
          success: false,
          error: '未找到学生档案信息'
        }
      }

      const studentProfile: StudentProfileInput = {
        score: profile.score,
        rank: profile.rank,
        province: profile.province,
        subjects: profile.subjects,
        batch: profile.batch,
        targetCities: profile.targetCities
      }

      const planItems = plan.items.map(item => ({
        universityId: item.universityId,
        majorId: item.majorId,
        order: item.order
      }))

      const allScores = repositories.admissionScoreRepository.findAll()
      const analysis = recommendEngine.analyzePlanRisk(
        planItems,
        studentProfile,
        allScores
      )

      const reachCount = plan.items.filter(i => i.tier === 'reach').length
      const stableCount = plan.items.filter(i => i.tier === 'stable').length
      const safeCount = plan.items.filter(i => i.tier === 'safe').length
      const avgProbability = plan.items.length > 0
        ? Math.round(plan.items.reduce((sum, i) => sum + i.probability, 0) / plan.items.length)
        : 0

      const universityMap = new Map<number, typeof repositories.universityRepository.prototype>()
      const majorMap = new Map<number, typeof repositories.majorRepository.prototype>()

      const universities = repositories.universityRepository.findAll()
      const majors = repositories.majorRepository.findAll()

      universities.forEach(u => universityMap.set(u.id, u))
      majors.forEach(m => majorMap.set(m.id, m))

      const itemsWithDetails = plan.items.map(item => ({
        ...item,
        university: universityMap.get(item.universityId),
        major: majorMap.get(item.majorId)
      }))

      const reportData: ExportReportData = {
        plan: {
          ...plan,
          items: itemsWithDetails as unknown as PlanItem[]
        },
        analysis,
        summary: {
          totalItems: plan.items.length,
          reachCount,
          stableCount,
          safeCount,
          avgProbability
        }
      }

      return {
        success: true,
        data: reportData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成填报报告失败'
      }
    }
  }
}

export default volunteerPlanService
