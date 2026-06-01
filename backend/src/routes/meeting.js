const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticateToken } = require('../middleware/auth');

router.post('/quick', authenticateToken, meetingController.createQuickMeeting);
router.post('/schedule', authenticateToken, meetingController.scheduleMeeting);
router.get('/scheduled', authenticateToken, meetingController.getScheduledMeetings);
router.get('/history', authenticateToken, meetingController.getMeetingHistory);
router.post('/join', authenticateToken, meetingController.joinMeeting);
router.get('/:meetingId/participants', authenticateToken, meetingController.getParticipants);
router.put('/:meetingId/participants/:participantId', authenticateToken, meetingController.manageParticipant);
router.post('/:meetingId/mute-all', authenticateToken, meetingController.muteAll);
router.post('/:meetingId/end', authenticateToken, meetingController.endMeeting);
router.get('/:meetingId/settings', authenticateToken, meetingController.getMeetingSettings);
router.put('/:meetingId/settings', authenticateToken, meetingController.updateMeetingSettings);
router.post('/:meetingId/invite', authenticateToken, meetingController.inviteParticipant);

module.exports = router;
