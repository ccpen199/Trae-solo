import * as repositories from '../repositories/index.js'
import type {
  ApiResponse,
  ProvinceHeatmap,
  User,
  QAQuestion
} from '../types/index.js'

interface HeatmapData {
  province: string
  totalSearchCount: number
  totalApplicationCount: number
  universityBreakdown: Array<{
    universityId: number
    universityName: string
    searchCount: number
    applicationCount: number
  }>
}

interface PlatformStatistics {
  totalUsers: number
  totalPlans: number
  totalQuestions: number
  totalLiveSessions: number
  userRoleBreakdown: Record<string, number>
  recentActivity: {
    last7DaysNewUsers: number
    last7DaysNewPlans: number
    last7DaysNewQuestions: number
  }
}

interface MaskedUser extends Omit<User, 'phone'> {
  phone: string
}

const adminService = {
  getHeatmapData(date?: string): ApiResponse<HeatmapData[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const aggregatedData = repositories.heatmapRepository.getAggregatedByDate(targetDate)

      const universities = repositories.universityRepository.findAll()
      const universityMap = new Map(universities.map(u => [u.id, u.name]))

      const allHeatmapData = repositories.heatmapRepository.findByDate(targetDate)

      const heatmapData: HeatmapData[] = aggregatedData.map(item => {
        const provinceUniversityData = allHeatmapData.filter(
          h => h.province === item.province && h.universityId
        )

        const universityBreakdown = provinceUniversityData.map(h => ({
          universityId: h.universityId || 0,
          universityName: universityMap.get(h.universityId || 0) || '未知院校',
          searchCount: h.searchCount,
          applicationCount: h.applicationCount
        }))

        return {
          province: item.province,
          totalSearchCount: item.totalSearchCount,
          totalApplicationCount: item.totalApplicationCount,
          universityBreakdown
        }
      })

      return {
        success: true,
        data: heatmapData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取热力图数据失败'
      }
    }
  },

  approveQuestion(questionId: number): ApiResponse<QAQuestion> {
    try {
      const question = repositories.qaRepository.findQuestionById(questionId)
      if (!question) {
        return {
          success: false,
          error: '问题不存在'
        }
      }

      const updated = repositories.qaRepository.updateQuestion(questionId, {
        status: 'approved'
      })

      if (!updated) {
        return {
          success: false,
          error: '审核失败'
        }
      }

      const approvedQuestion = repositories.qaRepository.findQuestionById(questionId)

      return {
        success: true,
        data: approvedQuestion!,
        message: '问题审核通过'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '审核问题失败'
      }
    }
  },

  rejectQuestion(questionId: number): ApiResponse<QAQuestion> {
    try {
      const question = repositories.qaRepository.findQuestionById(questionId)
      if (!question) {
        return {
          success: false,
          error: '问题不存在'
        }
      }

      const updated = repositories.qaRepository.updateQuestion(questionId, {
        status: 'rejected'
      })

      if (!updated) {
        return {
          success: false,
          error: '拒绝失败'
        }
      }

      const rejectedQuestion = repositories.qaRepository.findQuestionById(questionId)

      return {
        success: true,
        data: rejectedQuestion!,
        message: '问题已拒绝'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '拒绝问题失败'
      }
    }
  },

  getStatistics(): ApiResponse<PlatformStatistics> {
    try {
      const allUsers = repositories.userRepository.findAll()
      const allPlans = repositories.volunteerPlanRepository.findAll()
      const allQuestions = repositories.qaRepository.findAllQuestions(1, 99999)
      const allLiveSessions = repositories.liveRepository.findAllSessions(1, 99999)

      const userRoleBreakdown: Record<string, number> = {}
      allUsers.forEach(user => {
        userRoleBreakdown[user.role] = (userRoleBreakdown[user.role] || 0) + 1
      })

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString()

      const last7DaysNewUsers = allUsers.filter(u => u.createdAt >= sevenDaysAgoStr).length
      const last7DaysNewPlans = allPlans.filter(p => p.createdAt >= sevenDaysAgoStr).length
      const last7DaysNewQuestions = allQuestions.items.filter(q => q.createdAt >= sevenDaysAgoStr).length

      const statistics: PlatformStatistics = {
        totalUsers: allUsers.length,
        totalPlans: allPlans.length,
        totalQuestions: allQuestions.total,
        totalLiveSessions: allLiveSessions.total,
        userRoleBreakdown,
        recentActivity: {
          last7DaysNewUsers,
          last7DaysNewPlans,
          last7DaysNewQuestions
        }
      }

      return {
        success: true,
        data: statistics
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取统计数据失败'
      }
    }
  },

  maskSensitiveData(): ApiResponse<{ maskedCount: number; types: string[] }> {
    try {
      const allUsers = repositories.userRepository.findAll()
      let maskedCount = 0

      for (const user of allUsers) {
        const maskedPhone = this.maskPhone(user.phone)
        if (maskedPhone !== user.phone) {
          repositories.userRepository.update(user.id, { phone: maskedPhone })
          maskedCount++
        }
      }

      const allQuestions = repositories.qaRepository.findAllQuestions(1, 99999)
      for (const question of allQuestions.items) {
        const maskedContent = this.maskSensitiveText(question.content)
        const maskedTitle = this.maskSensitiveText(question.title)
        if (maskedContent !== question.content || maskedTitle !== question.title) {
          repositories.qaRepository.updateQuestion(question.id, {
            content: maskedContent,
            title: maskedTitle
          })
          maskedCount++
        }
      }

      const allQuestions2 = repositories.qaRepository.findAllQuestions(1, 99999)
      for (const question of allQuestions2.items) {
        const answers = repositories.qaRepository.findAnswersByQuestionId(question.id)
        for (const answer of answers) {
          const maskedContent = this.maskSensitiveText(answer.content)
          if (maskedContent !== answer.content) {
            repositories.qaRepository.updateAnswer(answer.id, { content: maskedContent })
            maskedCount++
          }
        }
      }

      return {
        success: true,
        data: {
          maskedCount,
          types: ['用户手机号', '问题内容', '回答内容']
        },
        message: '数据脱敏处理完成'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '数据脱敏处理失败'
      }
    }
  },

  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  maskSensitiveText(text: string): string {
    if (!text) return text

    let result = text

    result = result.replace(/(手机号|电话|联系方式)[：:]\s*\d+/g, '$1: ***')
    result = result.replace(/(身份证|证件号)[：:]\s*\w+/g, '$1: ***')
    result = result.replace(/(微信|QQ|邮箱)[：:]\s*\S+/g, '$1: ***')
    result = result.replace(/1[3-9]\d{9}/g, '1**********')
    result = result.replace(/\d{17}[\dXx]/g, '******************')

    return result
  }
}

export default adminService
