import { Router, type Request, type Response } from 'express'
import { mockCases, mockDesigners, mockMaterials, mockUsers } from '../../src/mock/data.js'
import type { Designer, ApiResponse, PaginatedResponse } from '../../shared/types/index.js'

const router = Router()

const pendingDesignerApplications: Designer[] = [
  {
    id: 'pending-designer-001',
    userId: 'pending-user-001',
    name: '李明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming',
    certificationNo: 'CERT20240101',
    yearsOfExperience: 6,
    status: 'pending',
    title: '资深设计师',
    company: '创艺装饰',
    experience: 6,
    rating: 4.5,
    completedCases: 18,
    specialties: ['现代简约', '北欧风格'],
    styleTags: ['现代简约', '北欧风格'],
    bio: '专注真实施工案例交付与小户型收纳优化。',
    portfolio: [
      'https://picsum.photos/seed/port1a/120/90',
      'https://picsum.photos/seed/port1b/120/90',
    ],
    applyTime: '2026-06-12 10:30',
    createdAt: '2026-06-12T10:30:00.000Z',
  },
  {
    id: 'pending-designer-002',
    userId: 'pending-user-002',
    name: '陈静',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing',
    certificationNo: 'CERT20240105',
    yearsOfExperience: 3,
    status: 'pending',
    title: '设计师',
    company: '青年设计',
    experience: 3,
    rating: 3.9,
    completedCases: 7,
    specialties: ['ins风', '小户型改造'],
    styleTags: ['ins风', '小户型改造'],
    bio: '擅长预算可控的年轻家庭装修方案。',
    portfolio: [
      'https://picsum.photos/seed/port5a/120/90',
      'https://picsum.photos/seed/port5b/120/90',
    ],
    applyTime: '2026-06-10 11:00',
    createdAt: '2026-06-10T11:00:00.000Z',
  },
]

function allDesignersForAdmin(): Designer[] {
  return [...mockDesigners, ...pendingDesignerApplications]
}

function adminStatsPayload() {
  const designers = allDesignersForAdmin()
  const pendingDesigners = designers.filter((d) => d.status === 'pending')
  const publishedCases = mockCases.filter((c) => c.status === 'published')
  const cities = new Set(mockCases.map((c) => c.city))

  return {
    users: mockUsers.length,
    designers: designers.length,
    pendingDesigners: pendingDesigners.length,
    cases: mockCases.length,
    pendingCases: mockCases.filter((c) => c.status && c.status !== 'published').length,
    publishedCases: publishedCases.length,
    materials: mockMaterials.length,
    cities: cities.size,
    averageQualityScore:
      Math.round(
        (mockCases.reduce((sum, c) => sum + (c.qualityScore ?? 0), 0) / Math.max(1, mockCases.length)) * 100,
      ) / 100,
    topCities: Array.from(cities).map((city) => ({
      city,
      cases: mockCases.filter((c) => c.city === city).length,
    })),
  }
}

function findDesignerForReview(id: string): { designer: Designer; list: Designer[]; index: number } | null {
  const mockIndex = mockDesigners.findIndex((d) => d.id === id)
  if (mockIndex !== -1) return { designer: mockDesigners[mockIndex], list: mockDesigners, index: mockIndex }

  const pendingIndex = pendingDesignerApplications.findIndex((d) => d.id === id)
  if (pendingIndex !== -1) {
    return {
      designer: pendingDesignerApplications[pendingIndex],
      list: pendingDesignerApplications,
      index: pendingIndex,
    }
  }

  return null
}

router.get('/stats', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: adminStatsPayload(),
  })
})

router.get('/dashboard', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: adminStatsPayload(),
  })
})

interface PendingQuery {
  page?: string
  pageSize?: string
}

router.get(
  '/designers/pending',
  (req: Request<unknown, unknown, unknown, PendingQuery>, res: Response): void => {
    const { page = '1', pageSize = '10' } = req.query

    const pending = allDesignersForAdmin().filter((d) => d.status === 'pending')

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(50, Number(pageSize)))
    const start = (pageNum - 1) * pageSizeNum
    const paginatedItems = pending.slice(start, start + pageSizeNum)

    const response: ApiResponse<PaginatedResponse<Designer>> = {
      success: true,
      data: {
        items: paginatedItems,
        total: pending.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(pending.length / pageSizeNum),
      },
    }

    res.status(200).json(response)
  },
)

router.post('/designers/:id/approve', (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params

  const match = findDesignerForReview(id)

  if (!match) {
    const response: ApiResponse = {
      success: false,
      error: '设计师申请不存在',
    }
    res.status(404).json(response)
    return
  }

  const { designer, list, index } = match

  if (designer.status !== 'pending') {
    const response: ApiResponse = {
      success: false,
      error: `当前状态为 ${designer.status}，无法重复审批`,
    }
    res.status(400).json(response)
    return
  }

  list[index] = {
    ...designer,
    status: 'approved',
    reviewTime: new Date().toISOString(),
  }

  const response: ApiResponse = {
    success: true,
    message: '设计师已通过审核',
    data: list[index],
  }

  res.status(200).json(response)
})

router.post(
  '/designers/:id/reject',
  (req: Request<{ id: string }, unknown, { reason?: string }>, res: Response): void => {
    const { id } = req.params
    const { reason } = req.body

    const match = findDesignerForReview(id)

    if (!match) {
      const response: ApiResponse = {
        success: false,
        error: '设计师申请不存在',
      }
      res.status(404).json(response)
      return
    }

    const { designer, list, index } = match

    if (designer.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        error: `当前状态为 ${designer.status}，无法重复审批`,
      }
      res.status(400).json(response)
      return
    }

    list[index] = {
      ...designer,
      status: 'rejected',
      reviewTime: new Date().toISOString(),
    }

  const response: ApiResponse = {
    success: true,
    message: reason ? `已驳回，原因：${reason}` : '已驳回申请',
      data: list[index],
    }

    res.status(200).json(response)
  },
)

export default router
