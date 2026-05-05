const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/roles', userController.getRoles);

router.get('/', authorize('user:read'), userController.getUsers);
router.get('/:id', authorize('user:read'), userController.getUserById);
router.post('/', authorize('user:write'), userController.createUser);
router.put('/:id', authorize('user:write'), userController.updateUser);
router.post('/:id/reset-password', authorize('user:write'), userController.resetPassword);
router.delete('/:id', authorize('user:delete'), userController.deleteUser);

module.exports = router;
