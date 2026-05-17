import { Router } from 'express'
import prisma from '../utils/prisma'
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { page = 1, pageSize = 10, search } = req.query
    const skip = (Number(page) - 1) * Number(pageSize)
    
    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { content: { contains: String(search) } }
      ]
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
          _count: { select: { answers: true, likes: true } },
          likes: req.user ? { where: { userId: req.user.id } } : false,
          favorites: req.user ? { where: { userId: req.user.id } } : false
        }
      }),
      prisma.question.count({ where })
    ])

    const formattedQuestions = questions.map(q => ({
      ...q,
      images: q.images ? q.images.split(',') : [],
      topics: q.topics ? q.topics.split(',') : [],
      isLiked: q.likes?.length > 0,
      isFavorited: q.favorites?.length > 0,
      likeCount: q._count.likes,
      answerCount: q._count.answers,
      likes: undefined,
      favorites: undefined,
      _count: undefined
    }))

    res.json({
      success: true,
      data: {
        list: formattedQuestions,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    console.error('获取问题列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const question = await prisma.question.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
        _count: { select: { answers: true, likes: true } },
        likes: req.user ? { where: { userId: req.user.id } } : false,
        favorites: req.user ? { where: { userId: req.user.id } } : false
      }
    })

    if (!question) {
      return res.status(404).json({ success: false, message: '问题不存在' })
    }

    const answers = await prisma.answer.findMany({
      where: { questionId: Number(id) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
        _count: { select: { comments: true, likes: true } },
        likes: req.user ? { where: { userId: req.user.id } } : false
      }
    })

    const formattedAnswers = answers.map(answer => ({
      ...answer,
      images: answer.images ? answer.images.split(',') : [],
      isLiked: answer.likes?.length > 0,
      likeCount: answer._count.likes,
      commentCount: answer._count.comments,
      likes: undefined,
      _count: undefined
    }))

    res.json({
      success: true,
      data: {
        ...question,
        images: question.images ? question.images.split(',') : [],
        topics: question.topics ? question.topics.split(',') : [],
        isLiked: question.likes?.length > 0,
        isFavorited: question.favorites?.length > 0,
        likeCount: question._count.likes,
        answerCount: question._count.answers,
        answers: formattedAnswers,
        likes: undefined,
        favorites: undefined,
        _count: undefined
      }
    })
  } catch (error) {
    console.error('获取问题详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content, images, topics } = req.body

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' })
    }

    const question = await prisma.question.create({
      data: {
        userId: req.user!.id,
        title,
        content,
        images: Array.isArray(images) ? images.join(',') : images,
        topics: Array.isArray(topics) ? topics.join(',') : topics
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({
      success: true,
      data: { ...question, images: question.images ? question.images.split(',') : [] },
      message: '提问成功'
    })
  } catch (error) {
    console.error('提问错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/answer', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { content, images } = req.body

    if (!content) {
      return res.status(400).json({ success: false, message: '回答内容不能为空' })
    }

    const answer = await prisma.answer.create({
      data: {
        questionId: Number(id),
        userId: req.user!.id,
        content,
        images: Array.isArray(images) ? images.join(',') : images
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({
      success: true,
      data: { ...answer, images: answer.images ? answer.images.split(',') : [] },
      message: '回答成功'
    })
  } catch (error) {
    console.error('回答错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const existingLike = await prisma.like.findFirst({
      where: { userId, questionId: Number(id) }
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })
      return res.json({ success: true, data: { isLiked: false }, message: '取消点赞' })
    }

    await prisma.like.create({ data: { userId, questionId: Number(id) } })
    res.json({ success: true, data: { isLiked: true }, message: '点赞成功' })
  } catch (error) {
    console.error('点赞错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const existingFavorite = await prisma.favorite.findFirst({
      where: { userId, questionId: Number(id) }
    })

    if (existingFavorite) {
      await prisma.favorite.delete({ where: { id: existingFavorite.id } })
      return res.json({ success: true, data: { isFavorited: false }, message: '取消收藏' })
    }

    await prisma.favorite.create({ data: { userId, questionId: Number(id) } })
    res.json({ success: true, data: { isFavorited: true }, message: '收藏成功' })
  } catch (error) {
    console.error('收藏错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/answer/:id/comment', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' })
    }

    const comment = await prisma.comment.create({
      data: { answerId: Number(id), userId: req.user!.id, content },
      include: { user: { select: { id: true, username: true, nickname: true, avatar: true } } }
    })

    res.json({ success: true, data: comment, message: '评论成功' })
  } catch (error) {
    console.error('评论错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
