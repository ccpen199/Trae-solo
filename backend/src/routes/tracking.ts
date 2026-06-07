import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';
import { addTrackingPoint, getTrackingHistory, getLatestPosition, calculateDistanceTraveled } from '../services/tracking.ts';

const router = Router();

function serializeTrackingPoint(row: any) {
  if (!row) return row;
  return {
    ...row,
    timestamp: row.created_at,
    knight: row.knight_id
      ? {
          id: row.knight_id,
          name: row.knight_name,
        }
      : null,
  };
}

router.post('/point', authMiddleware, (req: AuthRequest, res: Response) => {
  const { waybill_id, knight_id, lat, lng, speed, heading } = req.body;

  if (!waybill_id || !knight_id || lat === undefined || lng === undefined) {
    return res.json({ code: -1, message: 'Missing required fields' });
  }

  const result = addTrackingPoint(
    waybill_id,
    knight_id,
    parseFloat(lat),
    parseFloat(lng),
    speed ? parseFloat(speed) : 0,
    heading ? parseFloat(heading) : 0
  );

  res.json({
    code: 0,
    data: result,
    message: 'Tracking point recorded',
  });
});

router.get('/:waybillId', authMiddleware, (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const history = getTrackingHistory(waybillId).map(serializeTrackingPoint);
  const distance = calculateDistanceTraveled(waybillId);

  res.json({
    code: 0,
    data: {
      history,
      points: history,
      distance_traveled: distance,
    },
    message: 'Success',
  });
});

router.get('/:waybillId/latest', authMiddleware, (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const latest = serializeTrackingPoint(getLatestPosition(waybillId));

  if (!latest) {
    return res.json({ code: -1, message: 'No tracking data found' });
  }

  res.json({
    code: 0,
    data: latest,
    message: 'Success',
  });
});

export default router;
