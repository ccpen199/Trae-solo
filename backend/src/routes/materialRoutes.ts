import { Router } from 'express';
import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories,
  createMaterialCategory,
} from '../controllers/materialController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/categories', getMaterialCategories);
router.post('/categories', createMaterialCategory);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.get('/:id', getMaterialById);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
