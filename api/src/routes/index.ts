import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.js';
import * as authController from '@/controllers/authController.js';
import * as membershipController from '@/controllers/membershipController.js';
import * as legalAidController from '@/controllers/legalAidController.js';
import * as assistanceController from '@/controllers/assistanceController.js';
import * as academyController from '@/controllers/academyController.js';
import * as datingController from '@/controllers/datingController.js';
import * as psychologyController from '@/controllers/psychologyController.js';
import * as mallController from '@/controllers/mallController.js';
import * as adminController from '@/controllers/adminController.js';

const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

router.post('/membership/apply', authMiddleware, membershipController.apply);
router.post('/membership/verify-police', authMiddleware, membershipController.verifyPolice);
router.post('/membership/verify-social', authMiddleware, membershipController.verifySocial);
router.get('/membership/status', authMiddleware, membershipController.getStatus);

router.post('/legal-aid/apply', authMiddleware, legalAidController.apply);
router.get('/legal-aid/match/:caseId', authMiddleware, legalAidController.matchLawyers);
router.get('/legal-aid/cases', authMiddleware, legalAidController.getCases);
router.get('/legal-aid/cases/:caseId', authMiddleware, legalAidController.getCaseDetail);

router.post('/assistance/apply', authMiddleware, assistanceController.apply);
router.post('/assistance/auto-review', authMiddleware, assistanceController.autoReview);
router.get('/assistance/status', authMiddleware, assistanceController.getStatus);

router.get('/academy/courses', authMiddleware, academyController.getCourses);
router.post('/academy/progress', authMiddleware, academyController.updateProgress);
router.get('/academy/certificates', authMiddleware, academyController.getCertificates);

router.get('/dating/profiles', authMiddleware, datingController.getProfiles);
router.get('/dating/profiles/:profileId', authMiddleware, datingController.getMaskedProfile);
router.post('/dating/profile', authMiddleware, datingController.updateProfile);

router.post('/psychology/chat', authMiddleware, psychologyController.chat);
router.get('/psychology/report/:sessionId', authMiddleware, psychologyController.getReport);

router.get('/mall/products', authMiddleware, mallController.getProducts);
router.get('/mall/products/:productId', authMiddleware, mallController.getProductDetail);
router.get('/mall/supply-chain/:productId', authMiddleware, mallController.getSupplyChain);
router.get('/mall/orders', authMiddleware, mallController.getOrders);
router.post('/mall/orders', authMiddleware, mallController.createOrder);

router.get('/admin/org-chart', authMiddleware, adminController.getOrgChart);
router.get('/admin/sentiment-analysis', authMiddleware, adminController.getSentimentAnalysis);
router.get('/admin/fund-audit', authMiddleware, adminController.getFundAudit);

export default router;
