import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider, generateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { success, error } from '../utils/response';
import { AppDataSource } from '../config/database';
import { RiderEntity } from '../entities/Rider.entity';
import { RiderPreferenceEntity } from '../entities/RiderPreference.entity';
import bcrypt from 'bcryptjs';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { VehicleType } from '@shared/types';

const router = Router();

const registerSchema = Joi.object({
  phone: Joi.string().length(11).pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '请输入有效的手机号码',
  }),
  password: Joi.string().min(6).max(32).required(),
  code: Joi.string().length(6).required(),
  nickname: Joi.string().min(2).max(50).required(),
  vehicleType: Joi.string().valid('bike', 'electric_bike', 'motorcycle', 'car').required(),
});

const loginSchema = Joi.object({
  phone: Joi.string().length(11).pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().min(6).max(32).required(),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { phone, password, nickname, vehicleType } = req.body;
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);

    const existingRider = await riderRepo.findOne({ where: { phone } });
    if (existingRider) {
      return error(res, '该手机号已注册', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rider = riderRepo.create({
      phone,
      password: hashedPassword,
      nickname,
      vehicleType: vehicleType as VehicleType,
      creditScore: 100,
      isOnline: false,
      isFrozen: false,
      realNameVerified: false,
      qualificationVerified: false,
      auditStatus: 'pending',
      completedOrders: 0,
      totalDistance: 0,
      totalEarnings: 0,
    });

    await riderRepo.save(rider);

    const preference = prefRepo.create({
      riderId: rider.id,
      maxDistance: 5000,
      orderTypes: ['delivery', 'pickup', 'errands', 'shopping'],
      workingHours: [
        { start: '08:00', end: '12:00' },
        { start: '14:00', end: '22:00' },
      ],
      autoAccept: false,
      minOrderAmount: 5,
      preferredAreas: [],
    });

    await prefRepo.save(preference);

    const token = generateToken({
      riderId: rider.id,
      phone: rider.phone,
    });

    const { password: _, ...riderWithoutPassword } = rider;

    success(res, {
      token,
      rider: riderWithoutPassword,
    }, '注册成功');
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const rider = await riderRepo.findOne({ where: { phone } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    if (rider.isFrozen) {
      return error(res, `账户已被冻结: ${rider.frozenReason}`, 403);
    }

    const isValidPassword = await bcrypt.compare(password, rider.password);
    if (!isValidPassword) {
      throw new ValidationError('密码错误');
    }

    const token = generateToken({
      riderId: rider.id,
      phone: rider.phone,
    });

    const { password: _, ...riderWithoutPassword } = rider;

    success(res, {
      token,
      rider: riderWithoutPassword,
    }, '登录成功');
  } catch (err) {
    next(err);
  }
});

router.get('/profile', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const rider = await riderRepo.findOne({
      where: { id: riderId },
      relations: ['preference'],
    });

    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const { password: _, ...riderWithoutPassword } = rider;

    success(res, riderWithoutPassword);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    await riderRepo.update(riderId, { isOnline: false });

    success(res, null, '退出登录成功');
  } catch (err) {
    next(err);
  }
});

router.post('/send-code', async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return error(res, '请输入有效的手机号码', 400);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`发送验证码到 ${phone}: ${code}`);

    success(res, { sent: true }, '验证码已发送');
  } catch (err) {
    next(err);
  }
});

export default router;
