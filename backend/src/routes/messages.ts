import { Router } from 'express'
import prisma from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/conversations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, nickname: true, avatar: true } },
        receiver: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    const conversations = new Map()
    messages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: msg.senderId === userId ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0
        })
      }
      if (msg.receiverId === userId && !msg.isRead) {
        conversations.get(otherUserId).unreadCount++
      }
    })

    res.json({ success: true, data: Array.from(conversations.values()) })
  } catch (error) {
    console.error('获取会话列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user!.id

    await prisma.message.updateMany({
      where: {
        senderId: Number(userId),
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    })

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: Number(userId) },
          { senderId: Number(userId), receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({ success: true, data: messages })
  } catch (error) {
    console.error('获取消息列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' })
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId: Number(userId),
        content
      },
      include: {
        sender: { select: { id: true, username: true, nickname: true, avatar: true } }
      }
    })

    res.json({ success: true, data: message, message: '发送成功' })
  } catch (error) {
    console.error('发送消息错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
