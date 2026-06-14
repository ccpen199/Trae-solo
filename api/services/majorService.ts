import * as repositories from '../repositories/index.js'
import type { ApiResponse, PaginatedResponse } from '../types/index.js'
import type { Major } from '../../shared/types/index.js'

interface MajorSearchParams {
  keyword?: string
  category?: string
  page?: number
  pageSize?: number
}

const majorService = {
  getMajors(params: MajorSearchParams): ApiResponse<PaginatedResponse<Major>['data']> {
    try {
      const { keyword, category, page = 1, pageSize = 10 } = params
      const result = repositories.majorRepository.search(keyword, category, page, pageSize)
      
      return {
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page,
          pageSize
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取专业列表失败'
      }
    }
  },

  getMajorById(id: number): ApiResponse<Major | null> {
    try {
      const major = repositories.majorRepository.findById(id)
      return {
        success: true,
        data: major
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取专业详情失败'
      }
    }
  },

  compareMajors(ids: number[]): ApiResponse<Major[]> {
    try {
      const majors: Major[] = []
      
      for (const id of ids) {
        const major = repositories.majorRepository.findById(id)
        if (major) {
          majors.push(major)
        }
      }
      
      return {
        success: true,
        data: majors
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '专业对比失败'
      }
    }
  },

  getMajorsByUniversity(universityId: number): ApiResponse<Major[]> {
    try {
      const majors = repositories.majorRepository.findByUniversityId(universityId)
      return {
        success: true,
        data: majors
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取院校专业列表失败'
      }
    }
  }
}

export default majorService
