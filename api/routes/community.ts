import { Router, type Request, type Response } from 'express'
import { mockCommunityPosts, mockOpinionDashboard } from '../data/mock.js'
import type { CommunityPost, OpinionDashboard } from '../../shared/types.js'

const router = Router()

router.get('/posts', (req: Request, res: Response): void => {
  try {
    const { sort } = req.query
    const sortType = sort === 'hot' || sort === 'time' ? sort : 'time'

    let posts = [...mockCommunityPosts] as CommunityPost[]

    if (sortType === 'hot') {
      posts.sort((a, b) => {
        const scoreA = a.viewCount * 1 + a.replyCount * 3 + a.likeCount * 5
        const scoreB = b.viewCount * 1 + b.replyCount * 3 + b.likeCount * 5
        return scoreB - scoreA
      })
    } else {
      posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    }

    res.json({
      success: true,
      data: posts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取社区帖子列表失败',
    })
  }
})

router.get('/dashboard', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockOpinionDashboard as OpinionDashboard,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取舆情看板数据失败',
    })
  }
})

export default router
