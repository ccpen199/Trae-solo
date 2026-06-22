import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { success } from '../utils/response.js';
import { AppDataSource } from '../config/database.js';
import { LocationReportEntity } from '../entities/LocationReport.entity.js';
import { OrderTrajectoryEntity } from '../entities/OrderTrajectory.entity.js';
import { getTimeoutService } from '../services/timeout.service.js';
import { LocationReport } from '@shared/types';

const router = Router();

const locationReportSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  speed: Joi.number().min(0).optional(),
  heading: Joi.number().min(0).max(360).optional(),
  accuracy: Joi.number().min(0).optional(),
  orderId: Joi.string().uuid().optional(),
  batteryLevel: Joi.number().min(0).max(100).optional(),
  timestamp: Joi.date().optional(),
});

const acknowledgeWarningSchema = Joi.object({
  warningId: Joi.string().uuid().required(),
});

router.post('/location', authenticateRider, validate(locationReportSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const data = req.body as LocationReport;
    const locationRepo = AppDataSource.getRepository(LocationReportEntity);
    const riderRepo = AppDataSource.getRepository('RiderEntity');

    const report = locationRepo.create({
      riderId,
      orderId: data.orderId,
      location: data.location,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      timestamp: data.timestamp || new Date(),
      isOnline: true,
      batteryLevel: data.batteryLevel,
    });

    await locationRepo.save(report);

    await riderRepo.update(riderId, {
      currentLocation: data.location,
      isOnline: true,
    });

    if (data.orderId) {
      const trajRepo = AppDataSource.getRepository(OrderTrajectoryEntity);
      let trajectory = await trajRepo.findOne({
        where: { orderId: data.orderId, riderId },
      });

      if (!trajectory) {
        trajectory = trajRepo.create({
          orderId: data.orderId,
          riderId,
          points: [],
          distance: 0,
          duration: 0,
        });
      }

      trajectory.points.push({
        location: data.location,
        timestamp: data.timestamp || new Date(),
        speed: data.speed,
      });

      if (trajectory.points.length >= 2) {
        const { calculateDistance } = await import('../utils/geolocation');
        const lastPoint = trajectory.points[trajectory.points.length - 2];
        const currentPoint = trajectory.points[trajectory.points.length - 1];
        trajectory.distance += calculateDistance(lastPoint.location, currentPoint.location);
        trajectory.duration =
          (currentPoint.timestamp.getTime() - trajectory.points[0].timestamp.getTime()) / 60000;
      }

      await trajRepo.save(trajectory);
    }

    success(res, { reportId: report.id }, '定位上报成功');
  } catch (err) {
    next(err);
  }
});

router.get('/warnings', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { all = 'false' } = req.query;

    const timeoutService = getTimeoutService();
    const warnings = await timeoutService.getRiderWarnings(riderId, all !== 'true');

    success(res, warnings);
  } catch (err) {
    next(err);
  }
});

router.post('/warnings/acknowledge', authenticateRider, validate(acknowledgeWarningSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { warningId } = req.body;

    const timeoutService = getTimeoutService();
    const result = await timeoutService.acknowledgeWarning(warningId, riderId);

    if (result) {
      success(res, null, '警告已确认');
    } else {
      success(res, null, '警告不存在或已确认');
    }
  } catch (err) {
    next(err);
  }
});

router.get('/trajectory/:orderId', authenticateRider, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user!.riderId;
    const trajRepo = AppDataSource.getRepository(OrderTrajectoryEntity);

    const trajectory = await trajRepo.findOne({
      where: { orderId, riderId },
    });

    success(res, trajectory || { orderId, riderId, points: [], distance: 0, duration: 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/batch-location', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { locations } = req.body;
    const locationRepo = AppDataSource.getRepository(LocationReportEntity);

    if (!Array.isArray(locations) || locations.length === 0) {
      return success(res, { saved: 0 }, '没有数据需要保存');
    }

    const reports = locations.map((loc: any) =>
      locationRepo.create({
        riderId,
        orderId: loc.orderId,
        location: loc.location,
        speed: loc.speed,
        heading: loc.heading,
        accuracy: loc.accuracy,
        timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date(),
        isOnline: true,
        batteryLevel: loc.batteryLevel,
      })
    );

    await locationRepo.save(reports);

    if (locations.length > 0) {
      const lastLoc = locations[locations.length - 1];
      const riderRepo = AppDataSource.getRepository('RiderEntity');
      await riderRepo.update(riderId, {
        currentLocation: lastLoc.location,
        isOnline: true,
      });
    }

    success(res, { saved: reports.length }, '批量定位上报成功');
  } catch (err) {
    next(err);
  }
});

export default router;
