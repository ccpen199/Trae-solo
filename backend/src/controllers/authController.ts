import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { success, error } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'erp-system-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, realName, email, phone } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json(error('Username already exists', 400));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json(success(user, 'User registered successfully'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json(error('Invalid username or password', 401));
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json(error('User account is not active', 403));
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json(error('Invalid username or password', 401));
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json(
      success({
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Unauthorized', 401));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json(error('User not found', 404));
      return;
    }

    const permissions =
      user.role?.permissions?.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        module: rp.permission.module,
      })) || [];

    res.json(
      success({
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
              code: user.role.code,
              type: user.role.type,
            }
          : null,
        permissions,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Unauthorized', 401));
      return;
    }

    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json(error('User not found', 404));
      return;
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      res.status(400).json(error('Old password is incorrect', 400));
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json(success(null, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
};
