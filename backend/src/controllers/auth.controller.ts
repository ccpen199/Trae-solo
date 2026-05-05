import { Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error } from '../utils/response'
import { generateToken } from '../utils/jwt'
import { comparePassword, hashPassword } from '../utils/bcrypt'

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      error(res, '用户名和密码不能为空', 400)
      return
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      error(res, '用户不存在', 401)
      return
    }

    if (user.status !== 1) {
      error(res, '用户已被禁用', 403)
      return
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      error(res, '密码错误', 401)
      return
    }

    const roles = user.userRoles.map((ur) => ur.role.name)
    const permissions: string[] = []
    user.userRoles.forEach((ur) => {
      ur.role.roleMenus.forEach((rm) => {
        if (rm.menu.permission) {
          permissions.push(rm.menu.permission)
        }
      })
    })

    const token = generateToken({
      userId: user.id,
      username: user.username,
      roles,
      permissions: [...new Set(permissions)],
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.socket.remoteAddress,
      },
    })

    const userMenus: Array<Record<string, unknown>> = []
    const menuMap = new Map<string, Record<string, unknown>>()

    const allMenus = await prisma.menu.findMany({
      where: { status: 1 },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    const allowedMenuIds = new Set<string>()
    user.userRoles.forEach((ur) => {
      ur.role.roleMenus.forEach((rm) => {
        allowedMenuIds.add(rm.menuId)
      })
    })

    allMenus.forEach((menu) => {
      if (allowedMenuIds.has(menu.id) || menu.type === 1) {
        const menuItem: Record<string, unknown> = {
          id: menu.id,
          parentId: menu.parentId,
          name: menu.name,
          path: menu.path,
          icon: menu.icon,
          sortOrder: menu.sortOrder,
          type: menu.type,
          permission: menu.permission,
          children: [],
        }
        menuMap.set(menu.id, menuItem)
      }
    })

    menuMap.forEach((menu) => {
      if (menu.parentId && menuMap.get(menu.parentId as string)) {
        ;(menuMap.get(menu.parentId as string)?.children as Array<Record<string, unknown>>).push(menu)
      } else if (!menu.parentId) {
        userMenus.push(menu)
      }
    })

    const finalMenus = userMenus.filter(
      (m) => m.type === 1 || (m.type === 2 && allowedMenuIds.has(m.id as string))
    )

    success(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          email: user.email,
          departmentId: user.departmentId,
        },
        roles,
        permissions: [...new Set(permissions)],
        menus: finalMenus,
      },
      '登录成功'
    )
  } catch (err) {
    console.error('Login error:', err)
    error(res, '登录失败')
  }
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, password, realName, phone, email } = req.body

    if (!username || !password) {
      error(res, '用户名和密码不能为空', 400)
      return
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      error(res, '用户名已存在', 400)
      return
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        phone,
        email,
      },
    })

    success(
      res,
      {
        id: user.id,
        username: user.username,
        realName: user.realName,
      },
      '注册成功'
    )
  } catch (err) {
    console.error('Register error:', err)
    error(res, '注册失败')
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, '未登录', 401)
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      error(res, '用户不存在', 404)
      return
    }

    const roles = user.userRoles.map((ur) => ur.role.name)
    const permissions: string[] = []
    user.userRoles.forEach((ur) => {
      ur.role.roleMenus.forEach((rm) => {
        if (rm.menu.permission) {
          permissions.push(rm.menu.permission)
        }
      })
    })

    const userMenus: Array<Record<string, unknown>> = []
    const menuMap = new Map<string, Record<string, unknown>>()

    const allMenus = await prisma.menu.findMany({
      where: { status: 1 },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    const allowedMenuIds = new Set<string>()
    user.userRoles.forEach((ur) => {
      ur.role.roleMenus.forEach((rm) => {
        allowedMenuIds.add(rm.menuId)
      })
    })

    allMenus.forEach((menu) => {
      if (allowedMenuIds.has(menu.id) || menu.type === 1) {
        const menuItem: Record<string, unknown> = {
          id: menu.id,
          parentId: menu.parentId,
          name: menu.name,
          path: menu.path,
          icon: menu.icon,
          sortOrder: menu.sortOrder,
          type: menu.type,
          permission: menu.permission,
          children: [],
        }
        menuMap.set(menu.id, menuItem)
      }
    })

    menuMap.forEach((menu) => {
      if (menu.parentId && menuMap.get(menu.parentId as string)) {
        ;(menuMap.get(menu.parentId as string)?.children as Array<Record<string, unknown>>).push(menu)
      } else if (!menu.parentId) {
        userMenus.push(menu)
      }
    })

    success(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          email: user.email,
          departmentId: user.departmentId,
        },
        roles,
        permissions: [...new Set(permissions)],
        menus: userMenus.filter(
          (m) => m.type === 1 || (m.type === 2 && allowedMenuIds.has(m.id as string))
        ),
      },
      '获取成功'
    )
  } catch (err) {
    console.error('Get current user error:', err)
    error(res, '获取用户信息失败')
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, '未登录', 401)
      return
    }

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      error(res, '旧密码和新密码不能为空', 400)
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user) {
      error(res, '用户不存在', 404)
      return
    }

    const isPasswordValid = await comparePassword(oldPassword, user.password)
    if (!isPasswordValid) {
      error(res, '旧密码错误', 400)
      return
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    success(res, null, '密码修改成功')
  } catch (err) {
    console.error('Change password error:', err)
    error(res, '密码修改失败')
  }
}
