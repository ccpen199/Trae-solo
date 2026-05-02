import prisma from '../config/database.js'

export const userService = {
  async getUsers(params = {}) {
    const { role, search, page = 1, pageSize = 20 } = params

    const where = {}
    if (role) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          department: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    }
  },

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })
  },

  async createUser(data) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    })

    if (existing) {
      return { success: false, errors: ['用户名已存在'] }
    }

    const bcrypt = (await import('bcryptjs')).default
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        department: data.department,
        email: data.email,
        phone: data.phone,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    return { success: true, data: user }
  },

  async getTodoItems(userId, params = {}) {
    const { status, page = 1, pageSize = 20 } = params

    const where = { assigneeId: userId }
    if (status) {
      where.status = status
    }

    const [total, items] = await Promise.all([
      prisma.todoItem.count({ where }),
      prisma.todoItem.findMany({
        where,
        include: {
          declaration: {
            select: {
              id: true,
              mainOrderNo: true,
              status: true,
              shipper: true,
              consignee: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    }
  },

  async getMessages(userId, params = {}) {
    const { isRead, page = 1, pageSize = 20 } = params

    const where = { receiverId: userId }
    if (isRead !== undefined) {
      where.isRead = isRead
    }

    const [total, items] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        include: {
          declaration: {
            select: {
              id: true,
              mainOrderNo: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    }
  },

  async markMessageAsRead(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message || message.receiverId !== userId) {
      return { success: false, errors: ['消息不存在或无权限'] }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() },
    })

    return { success: true }
  },
}

export default userService
