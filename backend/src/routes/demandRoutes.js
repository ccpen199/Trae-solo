const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');
const { authenticate, requireRole } = require('../middleware/auth');
const { createDemandValidator, idParamValidator } = require('../middleware/validators');

router.get('/', demandController.getDemandList);

router.get('/my', authenticate, demandController.getMyDemands);

router.post('/', authenticate, createDemandValidator, demandController.createDemand);

router.get('/:id', idParamValidator, demandController.getDemandDetail);

router.put('/:id/status', authenticate, idParamValidator, demandController.updateDemandStatus);

module.exports = router;
