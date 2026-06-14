import type { Property, SearchFilters, MetroSearchParams, ApiResponse } from '../../shared/types.js'
import { PropertyRepository } from '../repositories/PropertyRepository.js'

export class SearchService {
  async multiDimensionalSearch(
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<{ list: Property[]; total: number }>> {
    try {
      const offset = (page - 1) * pageSize
      const [list, total] = await Promise.all([
        PropertyRepository.findAll(filters, pageSize, offset),
        PropertyRepository.count(filters)
      ])

      const processedList = this.postFilter(list, filters)
      const sortedList = this.applySorting(processedList, filters.sortBy)

      return {
        success: true,
        data: {
          list: sortedList,
          total
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '多维搜索失败'
      }
    }
  }

  private postFilter(properties: Property[], filters: SearchFilters): Property[] {
    let filtered = [...properties]

    if (filters.nearMetro) {
      filtered = filtered.filter(p => p.metroInfo && p.metroInfo.distance <= 1000)
    }

    if (filters.schoolDistrict) {
      filtered = filtered.filter(p => p.schoolDistrict !== undefined)
    }

    if (filters.hasVR) {
      filtered = filtered.filter(p => p.vrUrl !== undefined)
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter(p => p.verification.ownerVerified && p.verification.antiFraudPassed)
    }

    return filtered
  }

  private applySorting(properties: Property[], sortBy?: SearchFilters['sortBy']): Property[] {
    const sorted = [...properties]

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'area':
        sorted.sort((a, b) => b.area - a.area)
        break
      case 'time':
        sorted.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
        break
      case 'weight':
        sorted.sort((a, b) => b.listingWeight - a.listingWeight)
        break
      default:
        break
    }

    return sorted
  }

  async metroRadiusSearch(params: MetroSearchParams): Promise<ApiResponse<Property[]>> {
    try {
      const result = await PropertyRepository.searchByMetroStation(params)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '地铁站半径搜索失败'
      }
    }
  }

  async schoolDistrictMatch(
    schoolName: string,
    filters?: SearchFilters
  ): Promise<ApiResponse<Property[]>> {
    try {
      const allProperties = await PropertyRepository.findAll(filters || {}, 1000, 0)
      const lowerSchoolName = schoolName.toLowerCase()

      const filtered = allProperties.filter(
        p => p.schoolDistrict && p.schoolDistrict.name.toLowerCase().includes(lowerSchoolName)
      )

      return {
        success: true,
        data: filtered
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '学区匹配失败'
      }
    }
  }
}

export const searchService = new SearchService()
