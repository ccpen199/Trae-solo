const express = require('express');
const propertyController = require('../controllers/propertyController');
const { authenticateToken, requireVerified, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);
router.get('/:propertyId/verification', authenticateToken, propertyController.getVerificationStatus);

router.post('/', authenticateToken, requireVerified, requireRole('landlord'), propertyController.createProperty);
router.put('/:id', authenticateToken, propertyController.updateProperty);
router.get('/my/properties', authenticateToken, propertyController.getMyProperties);

router.post('/:propertyId/favorite', authenticateToken, propertyController.toggleFavorite);
router.get('/my/favorites', authenticateToken, propertyController.getFavorites);

router.post('/ai/match', authenticateToken, propertyController.aiMatchProperties);

module.exports = router;
