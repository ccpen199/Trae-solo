const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');
const { authenticate } = require('../middleware/auth');

router.get('/pregnancy', authenticate, toolController.getPregnancyRecords);
router.post('/pregnancy', authenticate, toolController.createPregnancyRecord);
router.get('/pregnancy/:id', authenticate, toolController.getPregnancyRecordDetail);
router.put('/pregnancy/:id', authenticate, toolController.updatePregnancyRecord);
router.delete('/pregnancy/:id', authenticate, toolController.deletePregnancyRecord);

router.get('/fetal-movement', authenticate, toolController.getFetalMovements);
router.get('/fetal-movement/stats', authenticate, toolController.getFetalMovementStats);
router.post('/fetal-movement', authenticate, toolController.createFetalMovement);

module.exports = router;
