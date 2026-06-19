import { Router, Request, Response } from 'express';
import { success, error } from '../utils/response';
import { getAdConfigs, reportAdImpression, reportAdClick } from '../services/adService';

const router = Router();

router.get('/configs', (req: Request, res: Response) => {
  try {
    const configs = getAdConfigs();
    res.json(success(configs));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/:id/impression', (req: Request, res: Response) => {
  try {
    const adId = parseInt(req.params.id);
    reportAdImpression(adId);
    res.json(success());
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/:id/click', (req: Request, res: Response) => {
  try {
    const adId = parseInt(req.params.id);
    const { revenue } = req.body;
    reportAdClick(adId, revenue);
    res.json(success());
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
