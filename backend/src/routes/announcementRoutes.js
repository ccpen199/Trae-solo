const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);

router.post('/', authenticateToken, requireAdmin, announcementController.createAnnouncement);
router.put('/:id', authenticateToken, requireAdmin, announcementController.updateAnnouncement);
router.delete('/:id', authenticateToken, requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;
