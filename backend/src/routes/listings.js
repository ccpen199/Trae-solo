const express = require('express');
const { authenticate } = require('../middleware/auth');
const listingController = require('../controllers/listingController');

const router = express.Router();

router.get('/', listingController.getListings);
router.get('/my', authenticate, listingController.getMyListings);
router.get('/history', authenticate, listingController.getBrowseHistory);
router.get('/:id', listingController.getListing);
router.post('/', authenticate, listingController.createListing);
router.put('/:id', authenticate, listingController.updateListing);
router.delete('/:id', authenticate, listingController.deleteListing);

module.exports = router;
