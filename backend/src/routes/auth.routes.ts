import express from 'express';
import { login, register, getCurrentUser } from '../controllers/auth.controller';
import auth from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', auth, getCurrentUser);

export default router;
