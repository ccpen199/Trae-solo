import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  evaluatePrice,
  getSimilarProperties,
  getRecommendations,
  checkFakeProperty,
} from '../controllers/propertyController.js';

const router = Router();

router.get('/', getProperties);
router.get('/recommendations', getRecommendations);
router.get('/:id', getPropertyById);
router.get('/:id/similar', getSimilarProperties);
router.get('/:id/check-fake', checkFakeProperty);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.post('/evaluate', evaluatePrice);

export default router;
