import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  createDepartment,
  getStatistics
} from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateJWT);

router.get('/users', authorizeRoles(UserRole.ADMIN, UserRole.GM), getUsers);
router.post('/users', authorizeRoles(UserRole.ADMIN), createUser);
router.put('/users/:id', authenticateJWT, updateUser);
router.delete('/users/:id', authorizeRoles(UserRole.ADMIN), deleteUser);

router.get('/departments', getDepartments);
router.post('/departments', authorizeRoles(UserRole.ADMIN), createDepartment);

router.get('/statistics', authorizeRoles(UserRole.ADMIN, UserRole.GM), getStatistics);

export default router;
