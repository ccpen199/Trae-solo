const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, isManager } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', isManager, departmentController.createDepartment);
router.put('/:id', isManager, departmentController.updateDepartment);
router.delete('/:id', isManager, departmentController.deleteDepartment);
router.put('/:id/toggle-status', isManager, departmentController.toggleDepartmentStatus);

module.exports = router;
