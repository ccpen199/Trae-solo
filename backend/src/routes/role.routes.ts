import { Response, Router } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error, pagination } from '../utils/response'
import { authMiddleware } from '../middleware/auth'

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
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ]
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        include: {
          roleMenus: {
            include: {
              menu: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.role.count({ where }),
    ])

    pagination(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get roles error:', err)
    error(res, '获取角色列表失败')
  }
})

router.get('/all', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await prisma.role.findMany({
      where: { status: 1 },
      orderBy: [{ createdAt: 'asc' }],
    })

    success(res, list)
  } catch (err) {
    console.error('Get all roles error:', err)
    error(res, '获取全部角色失败')
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        roleMenus: {
          include: {
            menu: true,
          },
        },
      },
    })

    if (!role) {
      error(res, '角色不存在', 404)
      return
    }

    success(res, role)
  } catch (err) {
    console.error('Get role error:', err)
    error(res, '获取角色信息失败')
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, status = 1, menuIds } = req.body

    if (!name) {
      error(res, '角色名称不能为空', 400)
      return
    }

    const existing = await prisma.role.findUnique({
      where: { name },
    })

    if (existing) {
      error(res, '角色名称已存在', 400)
      return
    }

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name,
          description,
          status,
        },
      })

      if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map((menuId: string) => ({
            roleId: newRole.id,
            menuId,
          })),
        })
      }

      return newRole
    })

    success(res, { id: role.id, name: role.name }, '创建角色成功')
  } catch (err) {
    console.error('Create role error:', err)
    error(res, '创建角色失败')
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description, status, menuIds } = req.body

    const existing = await prisma.role.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '角色不存在', 404)
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name, description, status },
      })

      if (menuIds !== undefined) {
        await tx.roleMenu.deleteMany({
          where: { roleId: id },
        })

        if (Array.isArray(menuIds) && menuIds.length > 0) {
          await tx.roleMenu.createMany({
            data: menuIds.map((menuId: string) => ({
              roleId: id,
              menuId,
            })),
          })
        }
      }
    })

    success(res, null, '更新角色成功')
  } catch (err) {
    console.error('Update role error:', err)
    error(res, '更新角色失败')
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const userRoles = await prisma.userRole.findMany({
      where: { roleId: id },
    })

    if (userRoles.length > 0) {
      error(res, '该角色下还有用户，请先移除用户', 400)
      return
    }

    const existing = await prisma.role.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '角色不存在', 404)
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleMenu.deleteMany({
        where: { roleId: id },
      })
      await tx.role.delete({
        where: { id },
      })
    })

    success(res, null, '删除角色成功')
  } catch (err) {
    console.error('Delete role error:', err)
    error(res, '删除角色失败')
  }
})

export default router
