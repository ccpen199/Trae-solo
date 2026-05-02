import { Router } from 'express';
import * as knowledgePointController from '../controllers/knowledgePointController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.get('/', knowledgePointController.getKnowledgePoints);
router.get('/tree', knowledgePointController.getKnowledgePointTree);
router.get('/:id', knowledgePointController.getKnowledgePoint);

router.use(requireRole([UserRole.ADMIN, UserRole.QUESTION_SETTER]));

router.post('/', knowledgePointController.createKnowledgePoint);
router.put('/:id', knowledgePointController.updateKnowledgePoint);
router.delete('/:id', knowledgePointController.deleteKnowledgePoint);

export default router;
