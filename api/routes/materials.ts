import { Router, type Request, type Response } from 'express'
import { mockMaterials } from '../../src/mock/data.js'
import type { Material, ApiResponse, PaginatedResponse } from '../../shared/types/index.js'

const router = Router()

interface MaterialFilterQuery {
  category?: string
  brand?: string
  keyword?: string
  page?: string
  pageSize?: string
}

router.get('/', (req: Request<unknown, unknown, unknown, MaterialFilterQuery>, res: Response): void => {
  const { category, brand, keyword, page = '1', pageSize = '10' } = req.query

  let filtered = [...mockMaterials]

  if (category) {
    filtered = filtered.filter((m) => m.category === category)
  }
  if (brand) {
    filtered = filtered.filter((m) => m.brand === brand)
  }
  if (keyword) {
    const kw = keyword.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(kw)) ||
        (m.model && m.model.toLowerCase().includes(kw)) ||
        (m.brand && m.brand.toLowerCase().includes(kw)),
    )
  }

  const pageNum = Math.max(1, Number(page))
  const pageSizeNum = Math.max(1, Math.min(50, Number(pageSize)))
  const start = (pageNum - 1) * pageSizeNum
  const paginatedItems = filtered.slice(start, start + pageSizeNum)

  const response: ApiResponse<PaginatedResponse<Material>> = {
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

router.get('/:id/prices', (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params

  const material = mockMaterials.find((m) => m.id === id)
  if (!material) {
    const response: ApiResponse = {
      success: false,
      error: '材料不存在',
    }
    res.status(404).json(response)
    return
  }

  const localSuppliers = material.localSuppliers || []

  const allPrices: number[] = []
  if (material.jdPrice) allPrices.push(material.jdPrice)
  if (material.tmallPrice) allPrices.push(material.tmallPrice)
  localSuppliers.forEach((s) => allPrices.push(s.price))

  const avgPrice =
    allPrices.length > 0
      ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
      : 0

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0

  const response: ApiResponse = {
    success: true,
    data: {
      material,
      onlinePrices: {
        jd: material.jdPrice ?? null,
        tmall: material.tmallPrice ?? null,
      },
      localSuppliers,
      statistics: {
        average: Math.round(avgPrice * 100) / 100,
        min: minPrice,
        max: maxPrice,
        count: allPrices.length,
      },
    },
  }

  res.status(200).json(response)
})

export default router
