import { Router } from 'express';
import * as accountController from '../controllers/accountController';
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { UserRole } from '../types/prisma';

const router = Router();

router.get('/game-names', accountController.getGameNames);
router.get('/my', authMiddleware, accountController.getMyAccounts);
router.get('/:id', accountController.getAccountById);
router.get('/', accountController.getAccountsValidation, accountController.getAccounts);

router.post('/', authMiddleware, accountController.createAccountValidation, accountController.createAccount);
router.put('/:id', authMiddleware, accountController.updateAccount);
router.delete('/:id', authMiddleware, accountController.deleteAccount);

router.post('/:id/review', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.CUSTOMER_SERVICE), accountController.reviewAccount);

export default router;
