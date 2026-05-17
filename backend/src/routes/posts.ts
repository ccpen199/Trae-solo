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
        { content: { contains: String(search) } },
        { topics: { contains: String(search) } }
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
          _count: { select: { comments: true, likes: true } },
          likes: req.user ? { where: { userId: req.user.id } } : false,
          favorites: req.user ? { where: { userId: req.user.id } } : false
        }
      }),
      prisma.post.count({ where })
    ])

    const formattedPosts = posts.map(post => ({
      ...post,
      images: post.images ? post.images.split(',') : [],
      isLiked: post.likes?.length > 0,
      isFavorited: post.favorites?.length > 0,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likes: undefined,
      favorites: undefined,
      _count: undefined
    }))

    res.json({
      success: true,
      data: {
        list: formattedPosts,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    console.error('获取动态列表错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true, bio: true } },
        _count: { select: { comments: true, likes: true } },
        likes: req.user ? { where: { userId: req.user.id } } : false,
        favorites: req.user ? { where: { userId: req.user.id } } : false
      }
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      })
    }

    const comments = await prisma.comment.findMany({
      where: { postId: Number(id) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({
      success: true,
      data: {
        ...post,
        images: post.images ? post.images.split(',') : [],
        topics: post.topics ? post.topics.split(',') : [],
        isLiked: post.likes?.length > 0,
        isFavorited: post.favorites?.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        comments,
        likes: undefined,
        favorites: undefined,
        _count: undefined
      }
    })
  } catch (error) {
    console.error('获取动态详情错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content, images, video, location, topics } = req.body

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '内容不能为空'
      })
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user!.id,
        content,
        images: Array.isArray(images) ? images.join(',') : images,
        video,
        location,
        topics: Array.isArray(topics) ? topics.join(',') : topics
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({
      success: true,
      data: {
        ...post,
        images: post.images ? post.images.split(',') : []
      },
      message: '发布成功'
    })
  } catch (error) {
    console.error('发布动态错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const existingLike = await prisma.like.findFirst({
      where: { userId, postId: Number(id) }
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })
      return res.json({ success: true, data: { isLiked: false }, message: '取消点赞' })
    }

    await prisma.like.create({
      data: { userId, postId: Number(id) }
    })

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
      where: { userId, postId: Number(id) }
    })

    if (existingFavorite) {
      await prisma.favorite.delete({ where: { id: existingFavorite.id } })
      return res.json({ success: true, data: { isFavorited: false }, message: '取消收藏' })
    }

    await prisma.favorite.create({
      data: { userId, postId: Number(id) }
    })

    res.json({ success: true, data: { isFavorited: true }, message: '收藏成功' })
  } catch (error) {
    console.error('收藏错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      })
    }

    const comment = await prisma.comment.create({
      data: {
        postId: Number(id),
        userId: req.user!.id,
        content
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({
      success: true,
      data: comment,
      message: '评论成功'
    })
  } catch (error) {
    console.error('评论错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
