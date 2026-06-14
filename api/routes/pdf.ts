import { Router, type Request, type Response } from 'express'
import { mockCases } from '../../src/mock/data.js'
import type { ApiResponse } from '../../shared/types/index.js'

const router = Router()

interface GeneratePdfRequest {
  caseId: string
  includeMaterials?: boolean
  includeFloorplan?: boolean
  format?: 'A4' | 'A3'
}

router.post(
  '/generate',
  (req: Request<unknown, unknown, GeneratePdfRequest>, res: Response): void => {
    const { caseId, includeMaterials = true, includeFloorplan = true, format = 'A4' } = req.body

    if (!caseId) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数：caseId',
      }
      res.status(400).json(response)
      return
    }

    const caseItem = mockCases.find((c) => c.id === caseId)

    if (!caseItem) {
      const response: ApiResponse = {
        success: false,
        error: '案例不存在',
      }
      res.status(404).json(response)
      return
    }

    const pages: string[] = ['封面', '设计说明']

    if (includeFloorplan && caseItem.floorPlanSvg) {
      pages.push('户型平面图')
    }

    if (caseItem.acceptancePhotos && caseItem.acceptancePhotos.length > 0) {
      const stages = Array.from(new Set(caseItem.acceptancePhotos.map((p) => p.stage)))
      const stageNames: Record<string, string> = {
        concealed: '隐蔽工程验收',
        'mud-wood': '泥木工程验收',
        paint: '油漆工程验收',
      }
      stages.forEach((s) => pages.push(stageNames[s] || '施工验收'))
    }

    if (includeMaterials && caseItem.materials.length > 0) {
      pages.push('材料清单')
    }

    pages.push('设计师介绍')

    const response: ApiResponse = {
      success: true,
      message: 'PDF 生成成功',
      data: {
        caseId,
        title: `${caseItem.title} - 设计方案`,
        format,
        pageCount: pages.length,
        pages,
        estimatedSize: `${Math.round(2 + pages.length * 0.8)}MB`,
        downloadUrl: `/api/pdf/download/${caseId}-${Date.now()}.pdf`,
        caseData: {
          title: caseItem.title,
          designerId: caseItem.designerId,
          style: caseItem.style,
          area: caseItem.area,
          budget: caseItem.budget,
          rooms: caseItem.rooms ?? caseItem.bedrooms,
          bathrooms: caseItem.bathrooms,
          city: caseItem.city,
          houseType: caseItem.houseType,
          materials: includeMaterials ? caseItem.materials : [],
        },
        generatedAt: new Date().toISOString(),
      },
    }

    res.status(200).json(response)
  },
)

export default router
