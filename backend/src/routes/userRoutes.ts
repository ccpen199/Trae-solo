import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  userValidationRules
} from '../controllers/userController';

const router = Router();

router.post('/register', userValidationRules.register, register);
router.post('/login', userValidationRules.login, login);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.put('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

export default router;
