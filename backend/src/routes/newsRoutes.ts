import { Router } from 'express';
import {
  getNews,
  getNewsById
} from '../controllers/newsController';

const router = Router();

router.get('/', getNews);
router.get('/:id', getNewsById);

export default router;
