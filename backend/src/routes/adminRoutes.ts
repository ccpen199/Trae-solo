import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  adminLogin,
  adminValidationRules,
  getAllBooks,
  createBook,
  updateBook,
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
  getAllUsers,
  getUserOrders,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/adminController';

const router = Router();

router.post('/login', adminValidationRules.login, adminLogin);

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/books', getAllBooks);
router.post('/books', createBook);
router.put('/books/:id', updateBook);

router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/users', getAllUsers);
router.get('/users/:userId/orders', getUserOrders);

router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
