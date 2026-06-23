import { Router } from 'express';
import { authService } from '../services/AuthService';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/login', (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: '参数错误', 
      details: parseResult.error.errors 
    });
    return;
  }

  const result = authService.login(
    parseResult.data.username,
    parseResult.data.password
  );

  if (!result.success) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

export default router;
