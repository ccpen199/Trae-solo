import { Response, Router } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    const buildTree = (items: typeof menus, parentId?: string): typeof menus => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }))
    }

    const tree = buildTree(menus)

    success(res, tree)
  } catch (err) {
    console.error('Get menus error:', err)
    error(res, '获取菜单列表失败')
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const menu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!menu) {
      error(res, '菜单不存在', 404)
      return
    }

    success(res, menu)
  } catch (err) {
    console.error('Get menu error:', err)
    error(res, '获取菜单信息失败')
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, path, icon, sortOrder = 0, type, permission, parentId, status = 1 } = req.body

    if (!name) {
      error(res, '菜单名称不能为空', 400)
      return
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        path,
        icon,
        sortOrder,
        type,
        permission,
        parentId,
        status,
      },
    })

    success(res, { id: menu.id, name: menu.name }, '创建菜单成功')
  } catch (err) {
    console.error('Create menu error:', err)
    error(res, '创建菜单失败')
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, path, icon, sortOrder, type, permission, parentId, status } = req.body

    if (parentId === id) {
      error(res, '不能将自己设为父级菜单', 400)
      return
    }

    const existing = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '菜单不存在', 404)
      return
    }

    await prisma.menu.update({
      where: { id },
      data: { name, path, icon, sortOrder, type, permission, parentId, status },
    })

    success(res, null, '更新菜单成功')
  } catch (err) {
    console.error('Update menu error:', err)
    error(res, '更新菜单失败')
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const children = await prisma.menu.findMany({
      where: { parentId: id },
    })

    if (children.length > 0) {
      error(res, '该菜单下还有子菜单，请先删除子菜单', 400)
      return
    }

    const existing = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '菜单不存在', 404)
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleMenu.deleteMany({
        where: { menuId: id },
      })
      await tx.menu.delete({
        where: { id },
      })
    })

    success(res, null, '删除菜单成功')
  } catch (err) {
    console.error('Delete menu error:', err)
    error(res, '删除菜单失败')
  }
})

export default router
