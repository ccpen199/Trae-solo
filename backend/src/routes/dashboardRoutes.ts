import { Router } from 'express';
import { getFulfillmentMetrics, getTrendsData, getSupplyDemand, getEarlyWarnings } from '../controllers/dashboardController';

const router = Router();

router.get('/fulfillment', getFulfillmentMetrics);
router.get('/trends', getTrendsData);
router.get('/supply-demand', getSupplyDemand);
router.get('/early-warnings', getEarlyWarnings);

export default router;
