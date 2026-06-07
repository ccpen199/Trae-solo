import { Router } from 'express';
import {
  getBrokers,
  getBrokerById,
  getBrokerWorkbench,
  createCustomerFollow,
  createAppointment,
  getFreeSlots,
  getTrainingProgress,
  updateTrainingProgress,
} from '../controllers/brokerController.js';

const router = Router();

router.get('/', getBrokers);
router.get('/:id', getBrokerById);
router.get('/:id/workbench', getBrokerWorkbench);
router.get('/:brokerId/free-slots', getFreeSlots);
router.get('/:brokerId/training', getTrainingProgress);
router.put('/training/:id/progress', updateTrainingProgress);
router.post('/follows', createCustomerFollow);
router.post('/appointments', createAppointment);

export default router;
