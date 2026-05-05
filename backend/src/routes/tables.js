const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/areas', authorize('table:read'), tableController.getAreas);

router.get('/', authorize('table:read'), tableController.getTables);
router.get('/:id', authorize('table:read'), tableController.getTableById);
router.post('/', authorize('table:write'), tableController.createTable);
router.put('/:id', authorize('table:write'), tableController.updateTable);
router.patch('/:id/status', authorize('table:write'), tableController.updateTableStatus);
router.delete('/:id', authorize('table:delete'), tableController.deleteTable);

module.exports = router;
