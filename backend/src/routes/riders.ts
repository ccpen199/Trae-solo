import { Router } from 'express';
import {
  getRiderList,
  getRiderById,
  getRiderLocation,
  getRiderLocations,
  updateRiderStatus,
  reportRiderLocation,
  createRider,
  getAllOnlineRiders,
  getRiderOfflineCache,
  getRiderLocationReportStatus,
  getRiderAssignments,
  getRiderAnomalyRecords,
} from '../services/riderService';
import { nowTimestamp } from '../utils';

const router = Router();

router.get('/', (req, res) => {
  const { status, type, page, pageSize } = req.query;
  const result = getRiderList({
    status: status as any,
    type: type as string,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.json({ code: 0, data: result });
});

router.get('/online', (req, res) => {
  const riders = getAllOnlineRiders();
  res.json({ code: 0, data: riders });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const rider = getRiderById(id);
  if (!rider) {
    res.status(404).json({ code: 1, message: '骑士不存在' });
    return;
  }
  res.json({ code: 0, data: rider });
});

router.get('/:id/location', (req, res) => {
  const id = parseInt(req.params.id);
  const location = getRiderLocation(id);
  res.json({ code: 0, data: location || null });
});

router.get('/:id/track', (req, res) => {
  const id = parseInt(req.params.id);
  const hours = req.query.hours ? parseInt(req.query.hours as string) : 1;
  const locations = getRiderLocations(id, hours);
  res.json({ code: 0, data: locations });
});

router.get('/:id/report-status', (req, res) => {
  const id = parseInt(req.params.id);
  const status = getRiderLocationReportStatus(id);
  res.json({ code: 0, data: status });
});

router.get('/:id/offline-cache', (req, res) => {
  const id = parseInt(req.params.id);
  const cache = getRiderOfflineCache(id);
  res.json({ code: 0, data: cache });
});

router.get('/:id/assignments', (req, res) => {
  const id = parseInt(req.params.id);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const assignments = getRiderAssignments(id, limit);
  res.json({ code: 0, data: assignments });
});

router.get('/:id/anomaly-records', (req, res) => {
  const id = parseInt(req.params.id);
  const records = getRiderAnomalyRecords(id);
  res.json({ code: 0, data: records });
});

router.post('/', (req, res) => {
  const { name, phone, type, vehicle_type } = req.body;
  if (!name || !phone) {
    res.status(400).json({ code: 1, message: '参数不完整' });
    return;
  }
  const rider = createRider({ name, phone, type, vehicle_type });
  res.json({ code: 0, data: rider });
});

router.put('/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const success = updateRiderStatus(id, status);
  res.json({ code: success ? 0 : 1, data: { success } });
});

router.post('/:id/location', (req, res) => {
  const id = parseInt(req.params.id);
  const { lat, lng, speed, heading, accuracy } = req.body;
  if (lat === undefined || lng === undefined) {
    res.status(400).json({ code: 1, message: '经纬度参数缺失' });
    return;
  }
  const location = reportRiderLocation(id, lat, lng, speed, heading, accuracy);
  res.json({ code: 0, data: location });
});

export default router;
