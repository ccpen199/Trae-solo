import { Router } from 'express';
import * as governmentController from '../controllers/governmentController';

const router = Router();

router.get('/policies', governmentController.getPolicies);
router.get('/policies/push-records', governmentController.getPolicyPushRecords);
router.get('/policies/:id', governmentController.getPolicyDetail);
router.get('/policies/:id/interpret', governmentController.getPolicyInterpretation);
router.get('/policies/:id/related', governmentController.getRelatedPolicies);
router.post('/policies/:id/read', governmentController.markPolicyAsRead);
router.get('/services', governmentController.getGovernmentServices);
router.post('/services/:serviceId/apply', governmentController.submitApplication);
router.get('/atomic-services', governmentController.getAtomicServices);
router.get('/atomic-services/:id', governmentController.getAtomicServiceDetail);
router.get('/atomic-services/:id/stats', governmentController.getServiceStats);
router.get('/atomic-services/:id/calls', governmentController.getServiceCallRecords);
router.get('/atomic-services/:id/dependencies', governmentController.getServiceDependencies);
router.post('/flows', governmentController.createFlow);
router.get('/flows', governmentController.getFlows);
router.post('/flows/:id/execute', governmentController.executeFlow);
router.get('/flows/:flowId/releases', governmentController.getFlowReleaseRecords);
router.post('/flows/:flowId/rollback', governmentController.rollbackFlow);
router.get('/flows/:flowId/compare', governmentController.compareFlowVersions);
router.post('/flows/:flowId/publish', governmentController.publishFlow);
router.get('/designer/nodes/:nodeId/properties', governmentController.getNodeProperties);

export default router;
