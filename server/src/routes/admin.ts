import { Router, Response } from 'express';
import { RoleCode, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, validatePassword } from '../utils/password';
import { success, error, notFound } from '../utils/response';
import { createUserValidation, updateUserValidation } from '../utils/validation';
import { logOperation, getClientIp, getUserAgent } from '../utils/operationLog';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireRole([RoleCode.ADMIN]));

router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return success(res, roles);
  } catch (err) {
    console.error('获取角色列表错误:', err);
    return error(res, '获取角色列表失败');
  }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      keyword,
      status,
      roleId,
    } = req.query as {
      page?: string;
      pageSize?: string;
      keyword?: string;
      status?: string;
      roleId?: string;
    };

    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.UserWhereInput = {};

    if (keyword) {
      where.OR = [
        { account: { contains: keyword } },
        { nickname: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    if (status) {
      where.status = status as UserStatus;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const userList = users.map(user => ({
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    }));

    return success(res, {
      list: userList,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (err) {
    console.error('获取用户列表错误:', err);
    return error(res, '获取用户列表失败');
  }
});

router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    return success(res, {
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    console.error('获取用户详情错误:', err);
    return error(res, '获取用户详情失败');
  }
});

router.post('/users', createUserValidation, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { account, password, nickname, email, phone, roleId, status } = req.body;

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return error(res, passwordValidation.errors.join('; '));
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { account },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.account === account) {
        return error(res, '账号已存在');
      }
      if (email && existingUser.email === email) {
        return error(res, '邮箱已被使用');
      }
      if (phone && existingUser.phone === phone) {
        return error(res, '手机号已被使用');
      }
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return error(res, '角色不存在');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        account,
        passwordHash,
        nickname,
        email: email || null,
        phone: phone || null,
        status: status || UserStatus.ACTIVE,
        roleId,
      },
      include: { role: true },
    });

    await logOperation({
      userId: adminId,
      operation: '创建用户',
      module: '管理员',
      targetId: user.id,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `管理员创建了用户 ${account}`,
    });

    return success(res, {
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.role,
    }, '用户创建成功');
  } catch (err) {
    console.error('创建用户错误:', err);
    return error(res, '创建用户失败');
  }
});

router.put('/users/:id', updateUserValidation, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;
    const { nickname, email, phone, status, roleId, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existingByEmail) {
        return error(res, '邮箱已被其他账号使用');
      }
    }

    if (phone) {
      const existingByPhone = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id },
        },
      });

      if (existingByPhone) {
        return error(res, '手机号已被其他账号使用');
      }
    }

    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return error(res, '角色不存在');
      }
    }

    let passwordHash = undefined;
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return error(res, passwordValidation.errors.join('; '));
      }
      passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nickname: nickname ?? user.nickname,
        email: email !== undefined ? email : user.email,
        phone: phone !== undefined ? phone : user.phone,
        status: status ?? user.status,
        roleId: roleId ?? user.roleId,
        passwordHash,
      },
      include: { role: true },
    });

    await logOperation({
      userId: adminId,
      operation: '更新用户',
      module: '管理员',
      targetId: id,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `管理员更新了用户 ${user.account} 的信息`,
    });

    return success(res, {
      id: updatedUser.id,
      account: updatedUser.account,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      phone: updatedUser.phone,
      status: updatedUser.status,
      role: updatedUser.role,
    }, '用户更新成功');
  } catch (err) {
    console.error('更新用户错误:', err);
    return error(res, '更新用户失败');
  }
});

router.put('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;
    const { status } = req.body as { status: UserStatus };

    if (!Object.values(UserStatus).includes(status)) {
      return error(res, '无效的状态值');
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      include: { role: true },
    });

    await logOperation({
      userId: adminId,
      operation: '调整用户状态',
      module: '管理员',
      targetId: id,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `管理员将用户 ${user.account} 的状态调整为 ${status}`,
    });

    return success(res, {
      id: updatedUser.id,
      status: updatedUser.status,
    }, '状态更新成功');
  } catch (err) {
    console.error('更新用户状态错误:', err);
    return error(res, '更新状态失败');
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    if (user.role.code === RoleCode.ADMIN) {
      const adminCount = await prisma.user.count({
        where: {
          role: { code: RoleCode.ADMIN },
          NOT: { id },
        },
      });

      if (adminCount === 0) {
        return error(res, '不能删除最后一个管理员账号');
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    await logOperation({
      userId: adminId,
      operation: '删除用户',
      module: '管理员',
      targetId: id,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `管理员删除了用户 ${user.account}`,
    });

    return success(res, null, '用户删除成功');
  } catch (err) {
    console.error('删除用户错误:', err);
    return error(res, '删除用户失败');
  }
});

router.get('/operation-logs', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      userId,
      module,
      operation,
    } = req.query as {
      page?: string;
      pageSize?: string;
      userId?: string;
      module?: string;
      operation?: string;
    };

    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.OperationLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (module) {
      where.module = module;
    }

    if (operation) {
      where.operation = operation;
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              account: true,
              nickname: true,
            },
          },
        },
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return success(res, {
      list: logs,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (err) {
    console.error('获取操作日志错误:', err);
    return error(res, '获取操作日志失败');
  }
});

export { router as adminRouter };
