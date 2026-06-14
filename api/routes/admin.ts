import { Router, type Request, type Response } from 'express'
import { mockDesigners } from '../../src/mock/data.js'
import type { Designer, ApiResponse, PaginatedResponse } from '../../shared/types/index.js'

const router = Router()

interface PendingQuery {
  page?: string
  pageSize?: string
}

router.get(
  '/designers/pending',
  (req: Request<unknown, unknown, unknown, PendingQuery>, res: Response): void => {
    const { page = '1', pageSize = '10' } = req.query

    const pending = mockDesigners.filter((d) => d.status === 'pending')

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

  const designerIndex = mockDesigners.findIndex((d) => d.id === id)

  if (designerIndex === -1) {
    const response: ApiResponse = {
      success: false,
      error: '设计师申请不存在',
    }
    res.status(404).json(response)
    return
  }

  const designer = mockDesigners[designerIndex]

  if (designer.status !== 'pending') {
    const response: ApiResponse = {
      success: false,
      error: `当前状态为 ${designer.status}，无法重复审批`,
    }
    res.status(400).json(response)
    return
  }

  mockDesigners[designerIndex] = {
    ...designer,
    status: 'approved',
    reviewTime: new Date().toISOString(),
  }

  const response: ApiResponse = {
    success: true,
    message: '设计师已通过审核',
    data: mockDesigners[designerIndex],
  }

  res.status(200).json(response)
})

router.post(
  '/designers/:id/reject',
  (req: Request<{ id: string }, unknown, { reason?: string }>, res: Response): void => {
    const { id } = req.params
    const { reason } = req.body

    const designerIndex = mockDesigners.findIndex((d) => d.id === id)

    if (designerIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: '设计师申请不存在',
      }
      res.status(404).json(response)
      return
    }

    const designer = mockDesigners[designerIndex]

    if (designer.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        error: `当前状态为 ${designer.status}，无法重复审批`,
      }
      res.status(400).json(response)
      return
    }

    mockDesigners[designerIndex] = {
      ...designer,
      status: 'rejected',
      reviewTime: new Date().toISOString(),
    }

    const response: ApiResponse = {
      success: true,
      message: reason ? `已驳回，原因：${reason}` : '已驳回申请',
      data: mockDesigners[designerIndex],
    }

    res.status(200).json(response)
  },
)

export default router
