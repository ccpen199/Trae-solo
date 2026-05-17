import express from 'express';
import { getBabies, createBaby, updateBaby, deleteBaby, getBabyDetail } from '../controllers/baby.controller';
import auth from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getBabies);
router.post('/', auth, createBaby);
router.get('/:id', auth, getBabyDetail);
router.put('/:id', auth, updateBaby);
router.delete('/:id', auth, deleteBaby);

export default router;
