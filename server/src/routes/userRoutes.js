const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isManager, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', isManager, userController.getUsers);
router.get('/:id', isManager, userController.getUserById);
router.post('/', isAdmin, userController.createUser);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);
router.put('/:id/toggle-status', isAdmin, userController.toggleUserStatus);

module.exports = router;
