import type { Property, PropertyType, MapSearchParams, ApiResponse } from '../../shared/types.js'
import { PropertyRepository } from '../repositories/PropertyRepository.js'

export class PropertyService {
  async getPropertyList(
    page: number = 1,
    pageSize: number = 20,
    type?: PropertyType
  ): Promise<ApiResponse<{ list: Property[]; total: number; page: number; pageSize: number }>> {
    try {
      const filters = type ? { type } : {}
      const offset = (page - 1) * pageSize
      const [list, total] = await Promise.all([
        PropertyRepository.findAll(filters, pageSize, offset),
        PropertyRepository.count(filters)
      ])

      return {
        success: true,
        data: {
          list,
          total,
          page,
          pageSize
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取房源列表失败'
      }
    }
  }

  async getPropertyDetail(id: string): Promise<ApiResponse<Property>> {
    try {
      const property = await PropertyRepository.findById(id)

      if (!property) {
        return {
          success: false,
          error: '房源不存在'
        }
      }

      return {
        success: true,
        data: property
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取房源详情失败'
      }
    }
  }

  async searchProperties(
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<{ list: Property[]; total: number; matchedKeyword?: string; fallback?: boolean }>> {
    try {
      const lowerKeyword = keyword.toLowerCase()
      const allProperties = await PropertyRepository.findAll({}, 1000, 0)
      
      const filtered = allProperties.filter(p =>
        p.title.toLowerCase().includes(lowerKeyword) ||
        p.address.toLowerCase().includes(lowerKeyword) ||
        p.district.toLowerCase().includes(lowerKeyword) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      )

      const searchable = filtered.length > 0
        ? filtered
        : allProperties
            .filter((p) => p.verification.antiFraudPassed || p.metroInfo || p.schoolDistrict)
            .sort((a, b) => b.listingWeight - a.listingWeight)

      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = searchable.slice(start, end)

      return {
        success: true,
        data: {
          list,
          total: searchable.length,
          matchedKeyword: keyword,
          fallback: filtered.length === 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索房源失败'
      }
    }
  }

  async mapSearch(params: MapSearchParams): Promise<ApiResponse<Property[]>> {
    try {
      const result = await PropertyRepository.searchByMapBounds(params)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '地图搜索失败'
      }
    }
  }

  async addProperty(property: Property): Promise<void> {
    await PropertyRepository.create(property)
  }
}

export const propertyService = new PropertyService()
