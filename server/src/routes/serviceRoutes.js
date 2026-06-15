import express from 'express';
import {
  getTransportServices,
  getCinemaServices,
  getJobServices,
  getGovernmentServices,
} from '../controllers/serviceController.js';

const router = express.Router();

router.get('/transport', getTransportServices);
router.get('/cinema', getCinemaServices);
router.get('/jobs', getJobServices);
router.get('/government', getGovernmentServices);

export default router;
