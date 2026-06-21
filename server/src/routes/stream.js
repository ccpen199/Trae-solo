const express = require('express');
const router = express.Router();
const StreamController = require('../controllers/StreamController');
const AlertController = require('../controllers/AlertController');
const { authMiddleware, temporaryAuthMiddleware } = require('../middleware/auth');

router.get('/devices/:id/stream-info', authMiddleware(), (req, res) => StreamController.getStreamInfo(req, res));
router.get('/temporary-stream', temporaryAuthMiddleware(), (req, res) => StreamController.getTemporaryStream(req, res));

router.post('/devices/:id/record', authMiddleware(), (req, res) => StreamController.startRecording(req, res));
router.post('/record/stop', authMiddleware(), (req, res) => StreamController.stopRecording(req, res));
router.get('/recordings', authMiddleware(), (req, res) => StreamController.listRecordings(req, res));
router.get('/recordings/:id/playback', authMiddleware(), (req, res) => StreamController.getRecordingPlayback(req, res));
router.delete('/recordings/:id', authMiddleware(['owner']), (req, res) => StreamController.deleteRecording(req, res));

router.post('/devices/:id/audio', authMiddleware(), (req, res) => StreamController.sendAudio(req, res));

router.post('/storage-policies', authMiddleware(['owner']), (req, res) => AlertController.createStoragePolicy(req, res));
router.put('/storage-policies/:id', authMiddleware(['owner']), (req, res) => AlertController.updateStoragePolicy(req, res));
router.get('/storage-policies', authMiddleware(), (req, res) => AlertController.listStoragePolicies(req, res));
router.delete('/storage-policies/:id', authMiddleware(['owner']), (req, res) => AlertController.deleteStoragePolicy(req, res));

router.post('/ai-event/report', (req, res) => AlertController.reportAIEvent(req, res));
router.get('/events', authMiddleware(), (req, res) => AlertController.listEvents(req, res));

router.get('/alerts', authMiddleware(), (req, res) => AlertController.listAlerts(req, res));
router.put('/alerts/read', authMiddleware(), (req, res) => AlertController.markAlertRead(req, res));

router.post('/alert-audit', authMiddleware(), (req, res) => AlertController.createAuditLog(req, res));
router.get('/alert-audit', authMiddleware(), (req, res) => AlertController.listAuditLogs(req, res));

router.get('/statistics', authMiddleware(), (req, res) => AlertController.getStatistics(req, res));

module.exports = router;
