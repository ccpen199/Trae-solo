import { Router } from 'express';
import { body, param } from 'express-validator';
import propertyController from '../controllers/PropertyController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../constants/enums';

const router = Router();

router.get('/', propertyController.getProperties);

router.get('/my', authenticate, requireRole(UserRole.LANDLORD), propertyController.getMyProperties);

router.get('/:id', propertyController.getProperty);

router.post(
  '/',
  authenticate,
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  [
    body('name').notEmpty().withMessage('房源名称不能为空'),
    body('address').notEmpty().withMessage('地址不能为空'),
    body('propertyType').notEmpty().withMessage('房源类型不能为空'),
    body('pricePerNight').isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
  ],
  propertyController.createProperty
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('房源ID不能为空'),
  ],
  propertyController.updateProperty
);

router.delete(
  '/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('房源ID不能为空'),
  ],
  propertyController.deleteProperty
);

export default router;
