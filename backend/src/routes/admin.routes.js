import express from 'express';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/system-info', adminController.getSystemInfo);

router.get('/access-config', adminController.getAccessConfig);
router.put('/access-config', adminController.updateAccessConfig);

router.get('/collision-config', adminController.getCollisionConfig);
router.put('/collision-config', adminController.updateCollisionConfig);

router.get('/channels', adminController.getChannels);
router.post('/channels', adminController.createChannel);
router.put('/channels/:id', adminController.updateChannel);
router.delete('/channels/:id', adminController.deleteChannel);

router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);

router.get('/records', adminController.getRecords);
router.get('/records/:id', adminController.getRecordDetail);
router.get('/stats', adminController.getStats);

router.get('/alerts', adminController.getAlerts);
router.post('/alerts/clear', adminController.clearAlerts);

router.get('/blacklist', adminController.getBlacklist);
router.post('/blacklist', adminController.addToBlacklist);
router.delete('/blacklist/:id', adminController.removeFromBlacklist);

export default router;
