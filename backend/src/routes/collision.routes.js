import express from 'express';
import collisionController from '../controllers/collision.controller.js';
import { signatureMiddleware, channelMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/access', signatureMiddleware, channelMiddleware, collisionController.validateAccess);
router.post('/collision', signatureMiddleware, channelMiddleware, collisionController.processCollision);
router.post('/register', signatureMiddleware, channelMiddleware, collisionController.jointRegister);
router.post('/full-process', signatureMiddleware, channelMiddleware, collisionController.fullProcess);

router.post('/test/access', channelMiddleware, collisionController.validateAccess);
router.post('/test/collision', channelMiddleware, collisionController.processCollision);
router.post('/test/register', channelMiddleware, collisionController.jointRegister);
router.post('/test/full-process', channelMiddleware, collisionController.fullProcess);

router.get('/signature-example', collisionController.getSignatureExample);
router.post('/md5', collisionController.generateMd5);

export default router;
