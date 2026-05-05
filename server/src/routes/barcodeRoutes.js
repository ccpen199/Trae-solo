const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');
const { authenticateToken, isManager, isOperator } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', isOperator, barcodeController.getBarcodes);
router.get('/code/:code', isOperator, barcodeController.getBarcodeByCode);
router.get('/:id', isOperator, barcodeController.getBarcodeById);
router.get('/:id/records', isOperator, barcodeController.getBarcodeRecords);
router.post('/', isManager, barcodeController.createBarcode);
router.post('/batch', isManager, barcodeController.batchCreateBarcodes);
router.put('/:id', isManager, barcodeController.updateBarcode);
router.delete('/:id', isManager, barcodeController.deleteBarcode);

module.exports = router;
