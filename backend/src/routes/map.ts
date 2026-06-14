import { Router } from 'express';
import {
  getPOIs,
  getMetroLines,
  getSchoolDistricts,
  calculateCommute,
  getCommutePolygon,
  getEstatesByMetro,
  getMapTiles,
  getNearbyEverything,
} from '../controllers/mapController.js';

const router = Router();

router.get('/pois', getPOIs);
router.get('/metro-lines', getMetroLines);
router.get('/school-districts', getSchoolDistricts);
router.get('/tiles', getMapTiles);
router.get('/nearby', getNearbyEverything);
router.get('/estates-by-metro', getEstatesByMetro);
router.get('/commute-polygon', getCommutePolygon);
router.post('/calculate-commute', calculateCommute);

export default router;
