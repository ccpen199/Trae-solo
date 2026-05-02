import { Router } from 'express';
import * as todoController from '../controllers/todoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, todoController.getTodoStats);
router.get('/', authMiddleware, todoController.getTodosValidation, todoController.getTodos);
router.get('/:id', authMiddleware, todoController.getTodoById);

router.post('/', authMiddleware, todoController.createTodoValidation, todoController.createTodo);
router.put('/:id', authMiddleware, todoController.updateTodo);
router.delete('/:id', authMiddleware, todoController.deleteTodo);

export default router;
