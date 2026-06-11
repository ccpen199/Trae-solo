import { Router } from 'express';
import { stationService } from '../services/stationService';
import { userService, chargingService } from '../services/userService';
import { settlementService } from '../services/settlementService';
import { workOrderService } from '../services/workOrderService';
import { reviewService } from '../services/reviewService';
import { statsService } from '../services/statsService';
import { getConnectedChargers } from '../services/ocppGateway';

const router = Router();

router.get('/stations', (req, res) => {
  const { city } = req.query;
  const stations = stationService.getAllStations(city as string);
  res.json(stations);
});

router.get('/stations/:id', (req, res) => {
  const station = stationService.getStationById(req.params.id);
  if (!station) return res.status(404).json({ error: '场站不存在' });

  const piles = stationService.getPilesByStationId(req.params.id);
  const reviews = reviewService.getReviewsByStation(req.params.id);
  res.json({ ...station, piles, reviews });
});

router.get('/stations/:id/piles', (req, res) => {
  const piles = stationService.getPilesByStationId(req.params.id);
  res.json(piles);
});

router.get('/piles/:id', (req, res) => {
  const pile = stationService.getPileById(req.params.id);
  if (!pile) return res.status(404).json({ error: '充电桩不存在' });
  res.json(pile);
});

router.get('/piles/code/:code', (req, res) => {
  const pile = stationService.getPileByCode(req.params.code);
  if (!pile) return res.status(404).json({ error: '充电桩不存在' });
  res.json(pile);
});

router.get('/cities', (req, res) => {
  const cities = stationService.getCities();
  res.json(cities);
});

router.get('/city-stats', (req, res) => {
  const stats = stationService.getCityStats();
  res.json(stats);
});

router.post('/charging/start', (req, res) => {
  try {
    const { userId, pileId, vehicleId } = req.body;
    const session = chargingService.createSession(userId, pileId, vehicleId);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/charging/stop/:sessionId', (req, res) => {
  try {
    const session = chargingService.stopSession(req.params.sessionId, 'stopped');
    settlementService.createSettlement(session.id);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/charging/sessions/user/:userId', (req, res) => {
  const sessions = chargingService.getUserSessions(req.params.userId);
  res.json(sessions);
});

router.get('/charging/sessions/active/:userId', (req, res) => {
  const sessions = chargingService.getUserActiveSessions(req.params.userId);
  res.json(sessions);
});

router.get('/charging/sessions/:id', (req, res) => {
  const session = chargingService.getSessionById(req.params.id);
  if (!session) return res.status(404).json({ error: '会话不存在' });
  res.json(session);
});

router.get('/users/:id', (req, res) => {
  const user = userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

router.get('/users/:id/vehicles', (req, res) => {
  const vehicles = userService.getVehiclesByUserId(req.params.id);
  res.json(vehicles);
});

router.post('/users/:id/vehicles', (req, res) => {
  const vehicle = userService.addVehicle(req.params.id, req.body);
  res.json(vehicle);
});

router.get('/vehicles/:id', (req, res) => {
  const vehicle = userService.getVehicleById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  res.json(vehicle);
});

router.get('/vehicles/:id/status', (req, res) => {
  const vehicle = userService.getVehicleById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });

  const soc = vehicle.current_soc + (Math.random() - 0.5) * 2;
  const mileage = vehicle.current_mileage + Math.random() * 0.5;

  userService.updateVehicleSoc(req.params.id, Math.max(0, Math.min(100, soc)), mileage);

  res.json({
    ...vehicle,
    current_soc: Math.max(0, Math.min(100, soc)),
    current_mileage: mileage,
    fault_codes: JSON.parse(vehicle.fault_codes),
  });
});

router.get('/work-orders', (req, res) => {
  const { status, stationId } = req.query;
  if (status) {
    res.json(workOrderService.getWorkOrdersByStatus(status as any));
  } else if (stationId) {
    res.json(workOrderService.getWorkOrdersByStation(stationId as string));
  } else {
    res.json(workOrderService.getAllWorkOrders());
  }
});

router.post('/work-orders', (req, res) => {
  const { stationId, type, title, description, priority, pileId } = req.body;
  const order = workOrderService.createWorkOrder(stationId, type, title, description, priority, pileId);
  res.json(order);
});

router.post('/work-orders/:id/assign', (req, res) => {
  const { assignee } = req.body;
  const order = workOrderService.assignWorkOrder(req.params.id, assignee);
  res.json(order);
});

router.post('/work-orders/:id/start', (req, res) => {
  const order = workOrderService.startWorkOrder(req.params.id);
  res.json(order);
});

router.post('/work-orders/:id/complete', (req, res) => {
  const order = workOrderService.completeWorkOrder(req.params.id);
  res.json(order);
});

router.get('/work-orders/stats/summary', (req, res) => {
  res.json(workOrderService.getWorkOrderStats());
});

router.post('/work-orders/auto-dispatch', (req, res) => {
  const count = workOrderService.autoDispatchFaultOrders();
  res.json({ created: count });
});

router.post('/reviews', (req, res) => {
  const { userId, stationId, sessionId, rating, content } = req.body;
  const review = reviewService.createReview(userId, stationId, sessionId, rating, content);
  res.json(review);
});

router.get('/reviews/station/:stationId', (req, res) => {
  const reviews = reviewService.getReviewsByStation(req.params.stationId);
  res.json(reviews);
});

router.get('/reviews/pending', (req, res) => {
  res.json(reviewService.getPendingReviews());
});

router.post('/reviews/:id/approve', (req, res) => {
  const review = reviewService.approveReview(req.params.id);
  res.json(review);
});

router.post('/reviews/:id/reject', (req, res) => {
  const review = reviewService.rejectReview(req.params.id);
  res.json(review);
});

router.get('/reviews/sentiment/stats', (req, res) => {
  const { stationId } = req.query;
  res.json(reviewService.getSentimentStats(stationId as string | undefined));
});

router.get('/reviews/trend', (req, res) => {
  const { days } = req.query;
  res.json(reviewService.getReviewTrend(parseInt(days as string) || 7));
});

router.get('/stats/heatmap', (req, res) => {
  const { date } = req.query;
  res.json(statsService.getCityHeatMapData(date as string | undefined));
});

router.get('/stats/failure-ranking', (req, res) => {
  const { limit, byCity } = req.query;
  if (byCity === 'true') {
    res.json(statsService.getCityFailureRateRanking(parseInt(limit as string) || 10));
  } else {
    res.json(statsService.getFailureRateRanking(parseInt(limit as string) || 10));
  }
});

router.get('/stats/recharge-funnel', (req, res) => {
  res.json(statsService.getRechargeFunnel());
});

router.get('/stats/daily', (req, res) => {
  const { days } = req.query;
  res.json(statsService.getDailyStats(parseInt(days as string) || 7));
});

router.get('/stats/hourly', (req, res) => {
  res.json(statsService.getHourlyDistribution());
});

router.get('/stats/national-report', (req, res) => {
  res.json(statsService.generateNationalReport());
});

router.get('/ocpp/connected', (req, res) => {
  res.json(getConnectedChargers());
});

router.get('/settlements/operator/:operatorId', (req, res) => {
  const { startDate, endDate } = req.query;
  res.json(settlementService.getSettlementsByOperator(
    req.params.operatorId,
    startDate as string | undefined,
    endDate as string | undefined
  ));
});

router.get('/settlements/summary/:operatorId', (req, res) => {
  res.json(settlementService.getOperatorSettlementSummary(req.params.operatorId));
});

export default router;
