import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { submitVerification, getVerification } from '../services/riskControl.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = Router();

router.post('/:waybillId/verify', authMiddleware, roleMiddleware('admin', 'knight'), upload.single('photo'), (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);
  const { id_verified, verifier_note } = req.body;

  if (!waybillId) {
    return res.json({ code: -1, message: 'Waybill ID is required' });
  }

  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
  const idVerified = id_verified === 'true' || id_verified === true || id_verified === 1;

  const verification = submitVerification(waybillId, photoPath, idVerified, verifier_note);

  res.json({
    code: 0,
    data: verification,
    message: 'Verification submitted successfully',
  });
});

router.get('/:waybillId', authMiddleware, (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const verification = getVerification(waybillId);

  if (!verification) {
    return res.json({ code: -1, message: 'Verification record not found' });
  }

  res.json({
    code: 0,
    data: verification,
    message: 'Success',
  });
});

export default router;
