import { Router, type Request, type Response } from 'express';
import * as propertyService from '../services/propertyService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      community: req.query.community as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    };
    const result = propertyService.listProperties(filters, page, limit);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = propertyService.getPropertyDetail(parseInt(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: '房源不存在' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = propertyService.createProperty(req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = propertyService.updateProperty(parseInt(req.params.id), req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = propertyService.deleteProperty(parseInt(req.params.id));
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/valuation', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = propertyService.estimateValue(parseInt(req.params.id));
    res.json({ success: true, valuation: result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/contract', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateType } = req.body;
    const result = propertyService.createContract(parseInt(req.params.id), templateType || 'sale_commission');
    res.json({ success: true, contractId: result.id, signHash: result.signHash, signedAt: result.signedAt });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
