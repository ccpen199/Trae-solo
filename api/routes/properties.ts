import { Router, type Request, type Response } from 'express'
import type { Property, SearchFilters, MapBounds, ApiResponse } from '../../shared/types.js'
import { propertyService } from '../services/PropertyService.js'
import { searchService } from '../services/SearchService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const type = req.query.type as Property['type'] | undefined

    const filters: SearchFilters = {
      type,
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

    const result = await searchService.multiDimensionalSearch(filters, page, pageSize)

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
      error: error instanceof Error ? error.message : '获取房源列表失败'
    })
  }
})

router.get('/map', async (req: Request, res: Response): Promise<void> => {
  try {
    const { southWestLat, southWestLng, northEastLat, northEastLng } = req.query

    if (!southWestLat || !southWestLng || !northEastLat || !northEastLng) {
      res.status(400).json({
        success: false,
        error: '缺少地图边界参数'
      })
      return
    }

    const bounds: MapBounds = {
      southWest: {
        lat: parseFloat(southWestLat as string),
        lng: parseFloat(southWestLng as string)
      },
      northEast: {
        lat: parseFloat(northEastLat as string),
        lng: parseFloat(northEastLng as string)
      }
    }

    const filters: SearchFilters = {
      type: req.query.type as Property['type'] | undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
      areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
      rooms: req.query.rooms ? (req.query.rooms as string).split(',').map(Number) : undefined,
      nearMetro: req.query.nearMetro === 'true',
      schoolDistrict: req.query.schoolDistrict === 'true',
      verifiedOnly: req.query.verifiedOnly === 'true'
    }

    const result = await propertyService.mapSearch({ bounds, filters })

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '地图范围查询失败'
    })
  }
})

router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
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
      error: error instanceof Error ? error.message : '地铁站半径检索失败'
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = await propertyService.getPropertyDetail(id)

    if (!result.success) {
      res.status(404).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取房源详情失败'
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyData = req.body as Omit<Property, 'id' | 'verification' | 'listingWeight' | 'publishTime'>

    const newProperty: Property = {
      ...propertyData,
      id: crypto.randomUUID(),
      publishTime: new Date().toISOString(),
      listingWeight: 50,
      verification: {
        ownerVerified: false,
        agentVerified: false,
        antiFraudPassed: false,
        verifyTime: new Date().toISOString(),
        listingDays: 0,
        decayWeight: 1.0
      }
    }

    propertyService.addProperty(newProperty)

    res.status(201).json({
      success: true,
      data: newProperty,
      message: '房源发布成功'
    } as ApiResponse<Property>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '发布房源失败'
    })
  }
})

export default router
