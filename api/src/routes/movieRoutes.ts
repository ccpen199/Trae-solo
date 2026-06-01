import { Router } from 'express';
import * as movieController from '../controllers/movieController.js';

const router = Router();

router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieDetail);
router.get('/:id/scores', movieController.getMovieScores);
router.get('/:id/heat', movieController.getHeatTrend);
router.get('/:id/sessions', movieController.getMovieSessions);

export default router;
