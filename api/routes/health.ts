import { Router, type Request, type Response } from 'express'
import { ApiResponse, HealthContent, ContentReview } from '../../shared/types'
import {
  createContent,
  getContentById,
  getContents,
  updateContent,
  deleteContent,
  filterByTags,
  getRecommendedContent,
  reviewContent,
  getContentReviews,
  ContentQueryOptions,
  PaginatedResult
} from '../services/healthContent'

const router = Router()

router.get('/', async (req: Request, res: Response<ApiResponse<PaginatedResult<HealthContent>>>): Promise<void> => {
  try {
    const { type, status, ageGroup, chronicDisease, page, pageSize } = req.query

    const options: ContentQueryOptions = {
      type: type as HealthContent['type'] | undefined,
      status: status as HealthContent['status'] | undefined,
      ageGroup: ageGroup as string | undefined,
      chronicDisease: chronicDisease as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined
    }

    const result = getContents(options)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取健康内容失败'
    })
  }
})

router.get('/recommended/:userId', async (req: Request, res: Response<ApiResponse<HealthContent[]>>): Promise<void> => {
  try {
    const { userId } = req.params
    const { limit } = req.query

    const { userDB } = await import('../db/index')
    const user = userDB.findById(userId)

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    const limitNum = limit ? parseInt(limit as string) : 5
    const contents = getRecommendedContent(user.age, user.chronicDiseases, limitNum)

    res.json({
      success: true,
      data: contents
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取推荐内容失败'
    })
  }
})

router.get('/filter', async (req: Request, res: Response<ApiResponse<PaginatedResult<HealthContent>>>): Promise<void> => {
  try {
    const { tags, type, status, page, pageSize } = req.query

    const tagArray = tags ? (tags as string).split(',') : []

    const result = filterByTags(tagArray, {
      type: type as HealthContent['type'] | undefined,
      status: status as HealthContent['status'] | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '筛选内容失败'
    })
  }
})

router.get('/:id', async (req: Request, res: Response<ApiResponse<HealthContent>>): Promise<void> => {
  try {
    const { id } = req.params
    const content = getContentById(id)

    if (!content) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    res.json({
      success: true,
      data: content
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取内容详情失败'
    })
  }
})

router.post('/', async (req: Request, res: Response<ApiResponse<HealthContent>>): Promise<void> => {
  try {
    const { type, title, description, imageUrl, ageGroups, chronicDiseases, content, audioUrl, accessibilityLevel } = req.body

    if (!type || !title || !description || !imageUrl || !ageGroups || !chronicDiseases || !content) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const newContent = createContent({
      type,
      title,
      description,
      imageUrl,
      ageGroups,
      chronicDiseases,
      content,
      audioUrl: audioUrl || null,
      status: 'pending',
      accessibilityLevel: accessibilityLevel || 1
    })

    res.status(201).json({
      success: true,
      data: newContent,
      message: '内容创建成功，等待审核'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建内容失败'
    })
  }
})

router.put('/:id', async (req: Request, res: Response<ApiResponse<HealthContent>>): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    const existingContent = getContentById(id)
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    const updatedContent = updateContent(id, updates)

    if (!updatedContent) {
      res.status(404).json({
        success: false,
        error: '更新内容失败'
      })
      return
    }

    res.json({
      success: true,
      data: updatedContent,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新内容失败'
    })
  }
})

router.delete('/:id', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params

    const existingContent = getContentById(id)
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    const deleted = deleteContent(id)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除内容失败'
      })
      return
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除内容失败'
    })
  }
})

router.post('/:id/review', async (req: Request, res: Response<ApiResponse<ContentReview>>): Promise<void> => {
  try {
    const { id } = req.params
    const { reviewerId, status, comment, accessibilityLevel } = req.body

    if (!reviewerId || !status || accessibilityLevel === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const review = reviewContent(id, reviewerId, status, comment || '', accessibilityLevel)

    if (!review) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    res.json({
      success: true,
      data: review,
      message: '审核完成'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '审核失败'
    })
  }
})

router.get('/:id/reviews', async (req: Request, res: Response<ApiResponse<ContentReview[]>>): Promise<void> => {
  try {
    const { id } = req.params
    const reviews = getContentReviews(id)

    res.json({
      success: true,
      data: reviews
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审核记录失败'
    })
  }
})

export default router
