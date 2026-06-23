import { Router } from 'express';
import { upload } from '../utils/upload';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth(), upload.array('files', 9), (req, res) => {
  const files = req.files as Express.Multer.File[];
  const urls = files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

export default router;
