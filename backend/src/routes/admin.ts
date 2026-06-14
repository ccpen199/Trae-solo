import { Router } from 'express';
import {
  getDashboardStats,
  getFakeProperties,
  getEstateDictionary,
  syncEstateDictionary,
  markFakeProperty,
  getStores,
  getUsers,
  getTrainingCourses,
  createTrainingCourse,
  getCommissionStats,
} from '../controllers/adminController.js';

const router = Router();

router.get('/dashboard', getDashboardStats);
router.get('/fake-properties', getFakeProperties);
router.get('/estate-dictionary', getEstateDictionary);
router.post('/estate-dictionary/sync', syncEstateDictionary);
router.put('/properties/:id/fake', markFakeProperty);
router.get('/stores', getStores);
router.get('/users', getUsers);
router.get('/courses', getTrainingCourses);
router.post('/courses', createTrainingCourse);
router.get('/commissions', getCommissionStats);

export default router;
