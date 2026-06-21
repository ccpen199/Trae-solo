const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware, riskControlMiddleware } = require('../middleware/auth');

router.post('/login', riskControlMiddleware(), (req, res) => UserController.login(req, res));
router.post('/register', (req, res) => UserController.register(req, res));
router.post('/logout', authMiddleware(), (req, res) => UserController.logout(req, res));

router.get('/me', authMiddleware(), (req, res) => UserController.getCurrentUser(req, res));
router.put('/me', authMiddleware(), (req, res) => UserController.updateProfile(req, res));
router.put('/password', authMiddleware(), (req, res) => UserController.changePassword(req, res));

router.post('/sub-accounts', authMiddleware(['owner']), (req, res) => UserController.createSubAccount(req, res));
router.get('/sub-accounts', authMiddleware(['owner']), (req, res) => UserController.listSubAccounts(req, res));
router.put('/sub-accounts/:id', authMiddleware(['owner']), (req, res) => UserController.updateSubAccount(req, res));
router.delete('/sub-accounts/:id', authMiddleware(['owner']), (req, res) => UserController.deleteSubAccount(req, res));

router.get('/login-logs', authMiddleware(), (req, res) => UserController.listLoginLogs(req, res));
router.get('/trusted-devices', authMiddleware(), (req, res) => UserController.listTrustedDevices(req, res));
router.put('/trusted-devices/verify', authMiddleware(), (req, res) => UserController.verifyTrustedDevice(req, res));

module.exports = router;
