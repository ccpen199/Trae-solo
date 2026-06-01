import { Router } from 'express';
import * as artFilmController from '../controllers/artFilmController.js';

const router = Router();

router.get('/festivals', artFilmController.getFestivals);
router.get('/festivals/:id', artFilmController.getFestivalDetail);
router.get('/festivals/:festivalId/schedule', artFilmController.getFestivalSchedule);
router.get('/interviews', artFilmController.getDirectorInterviews);
router.get('/interviews/:id', artFilmController.getInterviewDetail);
router.get('/art-films', artFilmController.getArtFilms);

export default router;
