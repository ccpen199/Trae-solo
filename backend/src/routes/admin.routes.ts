import express from 'express';
import { getStats, getUsers, deleteUser, getCourses, createCourse } from '../controllers/admin.controller';
import auth from '../middleware/auth';

const router = express.Router();

router.get('/stats', auth, getStats);
router.get('/users', auth, getUsers);
router.delete('/users/:id', auth, deleteUser);
router.get('/courses', auth, getCourses);
router.post('/courses', auth, createCourse);

export default router;
