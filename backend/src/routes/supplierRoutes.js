const express = require('express');
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/', supplierController.getSuppliers);

router.get('/all', supplierController.getAllSuppliers);

router.get('/export', 
  createLogMiddleware('export', 'supplier'),
  supplierController.exportSuppliers
);

router.get('/:id', supplierController.getSupplierById);

router.post(
  '/',
  [
    body('supplier_name').notEmpty().withMessage('供应商名称不能为空')
  ],
  createLogMiddleware('create_supplier', 'supplier'),
  supplierController.createSupplier
);

router.put(
  '/:id',
  [
    body('supplier_name').notEmpty().withMessage('供应商名称不能为空')
  ],
  createLogMiddleware('update_supplier', 'supplier'),
  supplierController.updateSupplier
);

router.delete(
  '/:id',
  createLogMiddleware('delete_supplier', 'supplier'),
  supplierController.deleteSupplier
);

module.exports = router;