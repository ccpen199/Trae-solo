import * as repositories from '../repositories/index.js'
import type { ApiResponse, PaginatedResponse } from '../types/index.js'
import type { University, AdmissionScore } from '../../shared/types/index.js'

interface UniversitySearchParams {
  keyword?: string
  level?: string
  province?: string
  type?: string
  page?: number
  pageSize?: number
}

interface UniversityWithScores extends University {
  scores: AdmissionScore[]
}

interface ScoreSearchParams {
  year?: number
  province?: string
}

const universityService = {
  getUniversities(params: UniversitySearchParams): ApiResponse<PaginatedResponse<University>['data']> {
    try {
      const { keyword, level, province, type, page = 1, pageSize = 10 } = params
      const result = repositories.universityRepository.search(keyword, level, province, type, page, pageSize)
      
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
        error: error instanceof Error ? error.message : '获取院校列表失败'
      }
    }
  },

  getUniversityById(id: number): ApiResponse<University | null> {
    try {
      const university = repositories.universityRepository.findById(id)
      return {
        success: true,
        data: university
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取院校详情失败'
      }
    }
  },

  getUniversityScores(id: number, params: ScoreSearchParams): ApiResponse<AdmissionScore[]> {
    try {
      const { year, province } = params
      let scores: AdmissionScore[]
      
      if (province) {
        scores = repositories.admissionScoreRepository.getByUniversityAndProvince(id, province)
      } else {
        scores = repositories.admissionScoreRepository.search(id, undefined, undefined, year).items
      }
      
      return {
        success: true,
        data: scores
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取院校投档线失败'
      }
    }
  },

  compareUniversities(ids: number[]): ApiResponse<University[]> {
    try {
      const universities: University[] = []
      
      for (const id of ids) {
        const university = repositories.universityRepository.findById(id)
        if (university) {
          universities.push(university)
        }
      }
      
      return {
        success: true,
        data: universities
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '院校对比失败'
      }
    }
  }
}

export default universityService
