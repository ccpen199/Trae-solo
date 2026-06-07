import { Router } from 'express';
import { 
  getPropertyList, 
  getPropertyDetail, 
  getPriceSchedule, 
  getPriceChangeLogs,
  getPropertyFilters,
  getRegionalInventory,
  getCityStrategies,
  getFollowUpRecords,
  getCustomerTags,
  getReminders
} from '../controllers/propertyController.js';

const router = Router();

router.get('/', getPropertyList);
router.get('/filters', getPropertyFilters);
router.get('/inventory', getRegionalInventory);
router.get('/strategies', getCityStrategies);
router.get('/users/:id/follow-ups', getFollowUpRecords);
router.get('/users/:id/tags', getCustomerTags);
router.get('/users/:id/reminders', getReminders);
router.get('/:id', getPropertyDetail);
router.get('/:id/price', getPriceSchedule);
router.get('/:id/price-logs', getPriceChangeLogs);

export default router;
