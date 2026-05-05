import { Router } from 'express';
import {
  getBooks,
  getBookById,
  getNewBooks,
  getCategories,
  getAuthors,
  getPublishers
} from '../controllers/bookController';

const router = Router();

router.get('/', getBooks);
router.get('/new', getNewBooks);
router.get('/categories', getCategories);
router.get('/authors', getAuthors);
router.get('/publishers', getPublishers);
router.get('/:id', getBookById);

export default router;
