import * as repositories from '../repositories/index.js'
import type { ApiResponse } from '../types/index.js'
import type { Major } from '../../shared/types/index.js'

interface TrendResult {
  year: number
  major: Major
  minScore: number
  minRank?: number
}

const admissionScoreService = {
  getTrend(universityId: number, majorId?: number, province?: string): ApiResponse<TrendResult[]> {
    try {
      const trend = repositories.admissionScoreRepository.getTrend(universityId, majorId, province)
      return {
        success: true,
        data: trend
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取投档线趋势失败'
      }
    }
  }
}

export default admissionScoreService
