import { Response, Router } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error, pagination } from '../utils/response'
import { authMiddleware } from '../middleware/auth'
import { hashPassword } from '../utils/bcrypt'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query

    const where: any = {}

    if (status !== undefined) {
      where.status = Number(status)
    }

    if (keyword && typeof keyword === 'string') {
      where.OR = [
        { username: { contains: keyword } },
        { realName: { contains: keyword } },
        { phone: { contains: keyword } },
      ]
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          status: true,
          departmentId: true,
          createdAt: true,
          lastLoginAt: true,
          userRoles: {
            include: {
              role: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.user.count({ where }),
    ])

    pagination(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get users error:', err)
    error(res, '获取用户列表失败')
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        status: true,
        departmentId: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      error(res, '用户不存在', 404)
      return
    }

    success(res, user)
  } catch (err) {
    console.error('Get user error:', err)
    error(res, '获取用户信息失败')
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, realName, phone, email, status = 1, roleIds } = req.body

    if (!username || !password) {
      error(res, '用户名和密码不能为空', 400)
      return
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    })

    if (existing) {
      error(res, '用户名已存在', 400)
      return
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          realName,
          phone,
          email,
          status,
        },
      })

      if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: newUser.id,
            roleId,
          })),
        })
      }

      return newUser
    })

    success(res, { id: user.id, username: user.username }, '创建用户成功')
  } catch (err) {
    console.error('Create user error:', err)
    error(res, '创建用户失败')
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { password, realName, phone, email, status, roleIds } = req.body

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '用户不存在', 404)
      return
    }

    const updateData: any = {
      realName,
      phone,
      email,
      status,
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: updateData,
      })

      if (roleIds !== undefined) {
        await tx.userRole.deleteMany({
          where: { userId: id },
        })

        if (Array.isArray(roleIds) && roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId: string) => ({
              userId: id,
              roleId,
            })),
          })
        }
      }
    })

    success(res, null, '更新用户成功')
  } catch (err) {
    console.error('Update user error:', err)
    error(res, '更新用户失败')
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    if (req.user?.userId === id) {
      error(res, '不能删除当前登录用户', 400)
      return
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '用户不存在', 404)
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: id },
      })
      await tx.user.delete({
        where: { id },
      })
    })

    success(res, null, '删除用户成功')
  } catch (err) {
    console.error('Delete user error:', err)
    error(res, '删除用户失败')
  }
})

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (req.user?.userId === id && status !== 1) {
      error(res, '不能禁用当前登录用户', 400)
      return
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '用户不存在', 404)
      return
    }

    await prisma.user.update({
      where: { id },
      data: { status },
    })

    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('Toggle user status error:', err)
    error(res, '状态更新失败')
  }
})

export default router
