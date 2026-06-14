import { Router, type Request, type Response } from 'express'
import type { Property, SearchFilters, PriceTrendPoint, ApiResponse } from '../../shared/types.js'
import { searchService } from '../services/SearchService.js'
import { propertyService } from '../services/PropertyService.js'
import { PropertyRepository } from '../repositories/PropertyRepository.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const keyword = req.query.keyword as string

    const filters: SearchFilters = {
      type: req.query.type as Property['type'] | undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
      areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
      rooms: req.query.rooms ? (req.query.rooms as string).split(',').map(Number) : undefined,
      orientation: req.query.orientation ? (req.query.orientation as string).split(',') : undefined,
      decoration: req.query.decoration ? (req.query.decoration as string).split(',') : undefined,
      district: req.query.district ? (req.query.district as string).split(',') : undefined,
      nearMetro: req.query.nearMetro === 'true',
      schoolDistrict: req.query.schoolDistrict === 'true',
      hasVR: req.query.hasVR === 'true',
      verifiedOnly: req.query.verifiedOnly === 'true',
      sortBy: req.query.sortBy as SearchFilters['sortBy'] || undefined
    }

    let result

    if (keyword) {
      result = await propertyService.searchProperties(keyword, page, pageSize)
    } else {
      result = await searchService.multiDimensionalSearch(filters, page, pageSize)
    }

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json({
      success: true,
      data: {
        list: result.data?.list || [],
        total: result.data?.total || 0,
        page,
        pageSize
      }
    } as ApiResponse<{ list: Property[]; total: number; page: number; pageSize: number }>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '多维搜索失败'
    })
  }
})

router.get('/metro', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stationName, radius } = req.query

    if (!stationName) {
      res.status(400).json({
        success: false,
        error: '缺少地铁站名称参数'
      })
      return
    }

    const filters: SearchFilters = {
      type: req.query.type as Property['type'] | undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
      areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
      rooms: req.query.rooms ? (req.query.rooms as string).split(',').map(Number) : undefined
    }

    const result = await searchService.metroRadiusSearch({
      stationName: stationName as string,
      radius: radius ? parseFloat(radius as string) : 1000,
      filters
    })

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '地铁站搜索失败'
    })
  }
})

router.get('/school', async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolName } = req.query

    if (!schoolName) {
      res.status(400).json({
        success: false,
        error: '缺少学校名称参数'
      })
      return
    }

    const filters: SearchFilters = {
      type: req.query.type as Property['type'] | undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
      areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
      rooms: req.query.rooms ? (req.query.rooms as string).split(',').map(Number) : undefined
    }

    const result = await searchService.schoolDistrictMatch(schoolName as string, filters)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '学区匹配失败'
    })
  }
})

router.get('/price-trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { district, type, days = '90' } = req.query
    const numDays = parseInt(days as string) || 90

    const filters: SearchFilters = {}
    if (district) filters.district = [district as string]
    if (type) filters.type = type as Property['type']

    const allProperties = await PropertyRepository.findAll(filters, 1000, 0)
    let filtered = allProperties

    const trendData: PriceTrendPoint[] = []
    const now = new Date()

    for (let i = numDays; i >= 0; i -= 7) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const weekProperties = filtered.filter(p => {
        const publishDate = new Date(p.publishTime)
        const diffDays = Math.floor((date.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays < 7
      })

      const avgPrice = weekProperties.length > 0
        ? weekProperties.reduce((sum, p) => sum + (p.unitPrice || p.price / p.area), 0) / weekProperties.length
        : 0

      const prevWeekProperties = filtered.filter(p => {
        const publishDate = new Date(p.publishTime)
        const diffDays = Math.floor((date.getTime() - 7 * 24 * 60 * 60 * 1000 - publishDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays < 7
      })

      const prevAvgPrice = prevWeekProperties.length > 0
        ? prevWeekProperties.reduce((sum, p) => sum + (p.unitPrice || p.price / p.area), 0) / prevWeekProperties.length
        : avgPrice

      const changeRate = prevAvgPrice > 0 ? ((avgPrice - prevAvgPrice) / prevAvgPrice) * 100 : 0

      trendData.push({
        date: dateStr,
        avgPrice: Math.round(avgPrice),
        changeRate: Math.round(changeRate * 100) / 100,
        volume: weekProperties.length
      })
    }

    res.status(200).json({
      success: true,
      data: trendData
    } as ApiResponse<PriceTrendPoint[]>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取价格走势数据失败'
    })
  }
})

export default router
