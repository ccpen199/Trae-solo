import { Router, type Request, type Response } from 'express';
import { DiagnosisEngineService } from '../services/DiagnosisEngineService.js';
import type { SelfAssessment } from '../../shared/types/index.js';

const router = Router();

router.post('/assess', (req: Request, res: Response) => {
  try {
    const assessment = req.body as SelfAssessment;
    if (!assessment.targetJobId) {
      return res.status(400).json({ success: false, error: 'targetJobId is required' });
    }
    const report = DiagnosisEngineService.assess(assessment);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/history', (req: Request, res: Response) => {
  try {
    const data = DiagnosisEngineService.getHistory();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
