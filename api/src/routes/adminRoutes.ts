import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUserList);
router.put('/users/:userId/vip', adminController.updateUserVip);
router.get('/orders', adminController.getOrderList);
router.post('/movies', adminController.manageMovie);
router.put('/movies/:id', adminController.manageMovie);
router.delete('/movies/:id', adminController.deleteMovie);

export default router;
