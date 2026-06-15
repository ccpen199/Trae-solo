import { Router } from 'express';
import * as identityController from '../controllers/identityController';

const router = Router();

router.get('/certificates', identityController.getCertificates);
router.get('/certificates/:type', identityController.getCertificateByType);
router.post('/certificates/:id/verify', identityController.verifyCertificate);

export default router;
