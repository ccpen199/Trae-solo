import express from 'express';
import {
  getExpenseTypes,
  getProjects,
  getUsers,
  getStatistics,
  getDepartments
} from '../controllers/commonController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/expense-types', authenticate, getExpenseTypes);
router.get('/projects', authenticate, getProjects);
router.get('/users', authenticate, getUsers);
router.get('/statistics', authenticate, getStatistics);
router.get('/departments', authenticate, getDepartments);

export default router;
