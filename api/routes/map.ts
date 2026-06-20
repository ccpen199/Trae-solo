import { Router, type Request, type Response } from 'express';
import { mockMapLayers, xuzhouMapData } from '../data/mapData.js';
import type { MapLayerItem } from '../../shared/types.js';

const router = Router();

router.get('/layers', (req: Request, res: Response): void => {
  const { type, status } = req.query as {
    type?: string;
    status?: string;
  };

  let filtered = [...mockMapLayers];

  if (type) {
    const types = type.split(',');
    filtered = filtered.filter((item) => types.includes(item.type));
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }

  res.json({ success: true, data: filtered });
});

router.get('/layers/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const layer = mockMapLayers.find((l) => l.id === id);

  if (!layer) {
    res.status(404).json({ success: false, error: '图层信息不存在' });
    return;
  }

  res.json({ success: true, data: layer });
});

router.get('/map-info', (req: Request, res: Response): void => {
  res.json({ success: true, data: xuzhouMapData });
});

export default router;
