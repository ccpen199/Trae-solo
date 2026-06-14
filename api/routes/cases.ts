import { Router, type Request, type Response } from 'express'
import { mockCases } from '../../src/mock/data.js'
import type {
  Case,
  FloorplanMatchRequest,
  PaginatedResponse,
  ApiResponse,
} from '../../shared/types/index.js'

const router = Router()

interface CaseFilterQuery {
  style?: string
  minArea?: string
  maxArea?: string
  minBudget?: string
  maxBudget?: string
  bedrooms?: string
  city?: string
  keyword?: string
  page?: string
  pageSize?: string
}

router.get('/', (req: Request<unknown, unknown, unknown, CaseFilterQuery>, res: Response): void => {
  const {
    style,
    minArea,
    maxArea,
    minBudget,
    maxBudget,
    bedrooms,
    city,
    keyword,
    page = '1',
    pageSize = '10',
  } = req.query

  let filtered = [...mockCases]

  if (style) {
    filtered = filtered.filter((c) => c.style === style)
  }
  if (minArea) {
    filtered = filtered.filter((c) => c.area >= Number(minArea))
  }
  if (maxArea) {
    filtered = filtered.filter((c) => c.area <= Number(maxArea))
  }
  if (minBudget) {
    filtered = filtered.filter((c) => c.budget >= Number(minBudget))
  }
  if (maxBudget) {
    filtered = filtered.filter((c) => c.budget <= Number(maxBudget))
  }
  if (bedrooms) {
    filtered = filtered.filter((c) => (c.rooms ?? c.bedrooms) === Number(bedrooms))
  }
  if (city) {
    filtered = filtered.filter((c) => c.city === city)
  }
  if (keyword) {
    const kw = keyword.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(kw) ||
        (c.description && c.description.toLowerCase().includes(kw)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(kw))),
    )
  }

  const pageNum = Math.max(1, Number(page))
  const pageSizeNum = Math.max(1, Math.min(50, Number(pageSize)))
  const start = (pageNum - 1) * pageSizeNum
  const paginatedItems = filtered.slice(start, start + pageSizeNum)

  const response: ApiResponse<PaginatedResponse<Case>> = {
    success: true,
    data: {
      items: paginatedItems,
      total: filtered.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(filtered.length / pageSizeNum),
    },
  }

  res.status(200).json(response)
})

router.get('/:id', (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params
  const caseItem = mockCases.find((c) => c.id === id)

  if (!caseItem) {
    const response: ApiResponse = {
      success: false,
      error: '案例不存在',
    }
    res.status(404).json(response)
    return
  }

  const response: ApiResponse<Case> = {
    success: true,
    data: caseItem,
  }
  res.status(200).json(response)
})

router.post(
  '/floorplan-match',
  (req: Request<unknown, unknown, FloorplanMatchRequest>, res: Response): void => {
    const { area, bedrooms, bathrooms, layout, style, budgetMin, budgetMax } = req.body

    if (!area || !bedrooms || !bathrooms) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数：area, bedrooms, bathrooms',
      }
      res.status(400).json(response)
      return
    }

    const scored = mockCases
      .map((c) => {
        let score = 0

        const areaDiff = Math.abs(c.area - area)
        if (areaDiff <= 10) score += 30
        else if (areaDiff <= 20) score += 20
        else if (areaDiff <= 30) score += 10

        const caseBedrooms = c.rooms ?? c.bedrooms ?? 0
        if (caseBedrooms === bedrooms) score += 25
        else if (Math.abs(caseBedrooms - bedrooms) <= 1) score += 10

        if (c.bathrooms === bathrooms) score += 15
        else if (Math.abs(c.bathrooms - bathrooms) <= 1) score += 5

        if (style && c.style === style) score += 15
        if (layout && c.houseType === layout) score += 10

        if (budgetMin && c.budget >= budgetMin) score += 5
        if (budgetMax && c.budget <= budgetMax) score += 5

        return { case: c, score }
      })
      .sort((a, b) => b.score - a.score)
      .filter((x) => x.score > 0)
      .slice(0, 5)
      .map((x) => ({
        ...x.case,
        matchScore: x.score,
      }))

    const response: ApiResponse = {
      success: true,
      data: {
        request: { area, bedrooms, bathrooms, layout, style, budgetMin, budgetMax },
        matches: scored,
      },
    }

    res.status(200).json(response)
  },
)

export default router
