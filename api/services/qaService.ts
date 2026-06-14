import * as repositories from '../repositories/index.js'
import type {
  ApiResponse,
  QAQuestion,
  QAAnswer,
  PaginatedResponse,
  QuestionStatus,
  User
} from '../types/index.js'

interface QuestionWithAnswers extends QAQuestion {
  answers: (QAAnswer & { user: User | null })[]
  user: User | null
}

const qaService = {
  getQuestions(params: {
    keyword?: string
    category?: string
    status?: string
    page: number
    pageSize: number
  }): ApiResponse<PaginatedResponse<QAQuestion & { user: User | null }>> {
    return this.getQuestionList(
      params.category,
      params.status as QuestionStatus,
      params.page,
      params.pageSize
    )
  },

  getQuestionById(questionId: number): ApiResponse<QuestionWithAnswers> {
    return this.getQuestionDetail(questionId)
  },

  createQuestion(userId: number, title: string, content: string, category?: string): ApiResponse<{ questionId: number }> {
    try {
      const user = repositories.userRepository.findById(userId)
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        }
      }

      const questionId = repositories.qaRepository.createQuestion({
        userId,
        title,
        content,
        category,
        status: 'pending'
      })

      return {
        success: true,
        data: { questionId },
        message: '问题创建成功，等待审核'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建问题失败'
      }
    }
  },

  createAnswer(questionId: number, userId: number, content: string): ApiResponse<{ answerId: number }> {
    try {
      const question = repositories.qaRepository.findQuestionById(questionId)
      if (!question) {
        return {
          success: false,
          error: '问题不存在'
        }
      }

      const user = repositories.userRepository.findById(userId)
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        }
      }

      const isExpert = user.expertCertified || user.role === 'expert' || user.role === 'teacher'

      const answerId = repositories.qaRepository.createAnswer({
        questionId,
        userId,
        content,
        isExpert
      })

      if (isExpert) {
        repositories.qaRepository.updateQuestion(questionId, { status: 'answered' })
      }

      return {
        success: true,
        data: { answerId },
        message: '回答发布成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '发布回答失败'
      }
    }
  },

  getQuestionList(
    category?: string,
    status?: QuestionStatus,
    page: number = 1,
    pageSize: number = 20
  ): ApiResponse<PaginatedResponse<QAQuestion & { user: User | null }>> {
    try {
      const result = repositories.qaRepository.searchQuestions(
        undefined,
        category,
        status,
        page,
        pageSize
      )

      const itemsWithUser = result.items.map(question => ({
        ...question,
        user: repositories.userRepository.findById(question.userId)
      }))

      return {
        success: true,
        data: {
          items: itemsWithUser,
          total: result.total,
          page,
          pageSize
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问题列表失败'
      }
    }
  },

  getQuestionDetail(questionId: number): ApiResponse<QuestionWithAnswers> {
    try {
      const question = repositories.qaRepository.findQuestionByIdWithAnswers(questionId)
      if (!question) {
        return {
          success: false,
          error: '问题不存在'
        }
      }

      repositories.qaRepository.incrementViewCount(questionId)

      const questionUser = repositories.userRepository.findById(question.userId)
      const answersWithUser = question.answers.map(answer => ({
        ...answer,
        user: repositories.userRepository.findById(answer.userId)
      }))

      const detail: QuestionWithAnswers = {
        ...question,
        user: questionUser,
        answers: answersWithUser
      }

      return {
        success: true,
        data: detail
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问题详情失败'
      }
    }
  },

  likeAnswer(answerId: number): ApiResponse<{ likeCount: number }> {
    try {
      const answer = repositories.qaRepository.findAnswerById(answerId)
      if (!answer) {
        return {
          success: false,
          error: '回答不存在'
        }
      }

      repositories.qaRepository.incrementLikeCount(answerId)

      const updatedAnswer = repositories.qaRepository.findAnswerById(answerId)

      return {
        success: true,
        data: { likeCount: updatedAnswer?.likeCount || answer.likeCount + 1 },
        message: '点赞成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '点赞失败'
      }
    }
  }
}

export default qaService
