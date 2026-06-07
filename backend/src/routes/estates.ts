import { Router } from 'express';
import {
  getEstates,
  getEstateById,
  createEstate,
  updateEstate,
} from '../controllers/estateController.js';

const router = Router();

router.get('/', getEstates);
router.get('/:id', getEstateById);
router.post('/', createEstate);
router.put('/:id', updateEstate);

export default router;
