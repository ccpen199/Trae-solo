import { Router } from 'express';
import { stationController } from '../controllers';

const router = Router();

router.get('/', stationController.getStationList);
router.get('/:id', stationController.getStationDetail);
router.get('/:id/piles', stationController.getStationPiles);
router.get('/piles/:pileId', stationController.getPileDetail);

export default router;
