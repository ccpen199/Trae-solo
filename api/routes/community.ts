import { Router, type Request, type Response } from 'express'
import { mockCommunityPosts, mockOpinionDashboard } from '../data/mock.js'
import type { CommunityPost, OpinionDashboard, NlpAnalysis, DisposalStatus } from '../../shared/types.js'

const router = Router()

function generateNlpAnalysis(post: CommunityPost): NlpAnalysis {
  const sentimentLabels: Record<string, string> = {
    positive: '正面',
    neutral: '中性',
    negative: '负面',
  }
  
  const confidence = 0.75 + Math.random() * 0.2
  const sentimentLabel = sentimentLabels[post.sentiment] || '中性'
  
  const keywordsWithWeight = post.keywords.map((word, idx) => ({
    word,
    weight: Math.round((0.95 - idx * 0.15) * 100) / 100,
  }))
  
  const sensitiveWords = ['投诉', '不作为', '垃圾', '坑', '难', '乱', '差']
  const foundSensitive = sensitiveWords.filter(w => 
    post.content.includes(w) || post.title.includes(w)
  )
  
  let opinionBasis = ''
  if (post.sentiment === 'negative') {
    opinionBasis = `含${foundSensitive.slice(0, 3).map(w => `'${w}'`).join('')}等敏感词×${foundSensitive.length || Math.ceil(Math.random() * 3) + 1}，情绪得分${(post.sentimentScore > 0 ? -post.sentimentScore : -post.sentimentScore).toFixed(2)}`
  } else if (post.sentiment === 'positive') {
    opinionBasis = `含赞美类词汇×${Math.ceil(Math.random() * 3) + 1}，情绪得分${post.sentimentScore.toFixed(2)}`
  } else {
    opinionBasis = `情感倾向不明显，情绪得分${post.sentimentScore.toFixed(2)}`
  }
  
  return {
    sentimentConfidence: Math.round(confidence * 1000) / 10,
    sentimentLabel,
    keywords: keywordsWithWeight,
    opinionBasis,
    engine: '青岛政务NLP平台 V3.2',
    annotatedAt: new Date().toISOString(),
  }
}

function generateDisposalStatus(opinionLevel: number): { status: DisposalStatus; transferredTo?: string } {
  if (opinionLevel >= 4) {
    const statuses: DisposalStatus[] = ['processing', 'replied']
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      transferredTo: '青岛市互联网信息办公室',
    }
  } else if (opinionLevel === 3) {
    const statuses: DisposalStatus[] = ['pending', 'processing', 'replied']
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
    }
  } else {
    const statuses: DisposalStatus[] = ['replied', 'closed']
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
    }
  }
}

function enrichPost(post: CommunityPost): CommunityPost {
  const disposal = generateDisposalStatus(post.opinionLevel)
  return {
    ...post,
    nlpAnalysis: generateNlpAnalysis(post),
    disposalStatus: disposal.status,
    transferredTo: disposal.transferredTo,
  }
}

router.get('/posts', (req: Request, res: Response): void => {
  try {
    const { sort } = req.query
    const sortType = sort === 'hot' || sort === 'time' ? sort : 'time'

    let posts = [...mockCommunityPosts].map(enrichPost) as CommunityPost[]

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
