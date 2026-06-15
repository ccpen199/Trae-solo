import { Router } from 'express';
import * as governmentController from '../controllers/governmentController';

const router = Router();

router.get('/policies', governmentController.getPolicies);
router.get('/policies/:id', governmentController.getPolicyDetail);
router.get('/policies/:id/interpret', governmentController.getPolicyInterpretation);
router.get('/services', governmentController.getGovernmentServices);
router.post('/services/:serviceId/apply', governmentController.submitApplication);
router.get('/atomic-services', governmentController.getAtomicServices);
router.get('/atomic-services/:id', governmentController.getAtomicServiceDetail);
router.post('/flows', governmentController.createFlow);
router.get('/flows', governmentController.getFlows);
router.post('/flows/:id/execute', governmentController.executeFlow);

export default router;
