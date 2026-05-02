const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, projectController.getProjects);
router.get('/:projectId', authenticate, projectController.getProjectById);
router.post('/', authenticate, authorize('tenderer', 'supervisor'), projectController.createProject);
router.post('/:projectId/publish', authenticate, authorize('tenderer', 'supervisor'), projectController.publishProject);
router.post('/:projectId/start-bidding', authenticate, authorize('tenderer', 'supervisor'), projectController.startBidding);
router.post('/:projectId/end-bidding', authenticate, authorize('tenderer', 'supervisor'), projectController.endBidding);
router.put('/:projectId/status', authenticate, authorize('tenderer', 'supervisor'), projectController.updateProjectStatus);

module.exports = router;
