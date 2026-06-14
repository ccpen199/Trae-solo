const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { auth } = require('../middleware/auth');

router.get('/records', auth, blockchainController.getRecords);
router.get('/:hash', blockchainController.getByHash);
router.post('/verify', blockchainController.verify);
router.post('/create', auth, blockchainController.create);

module.exports = router;
