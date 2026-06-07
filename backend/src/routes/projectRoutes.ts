import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  createProject,
  getProjects,
  getMyProjects,
  getProjectDetail,
  updateProjectStatus,
  updateProject
} from '../controllers/projectController';

const router = Router();

router.get('/projects', authenticateToken, getProjects);
router.get('/projects/my', authenticateToken, requireRole('enterprise'), getMyProjects);
router.get('/projects/:id', authenticateToken, getProjectDetail);
router.post('/projects', authenticateToken, requireRole('enterprise'), auditLog('create_project', 'construction_projects'), createProject);
router.put('/projects/:id', authenticateToken, auditLog('update_project', 'construction_projects'), updateProject);
router.put('/projects/:id/status', authenticateToken, auditLog('update_project_status', 'construction_projects'), updateProjectStatus);

export default router;
