const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/auth');

const userController = new UserController();

router.post('/register', (req, res) => userController.register(req, res));

router.post('/login', (req, res) => userController.login(req, res));

router.get('/me', authenticateToken, (req, res) => userController.getCurrentUser(req, res));

router.put('/profile', authenticateToken, (req, res) => userController.updateProfile(req, res));

router.put('/expertise', authenticateToken, (req, res) => userController.updateExpertise(req, res));

router.get('/credit/history', authenticateToken, (req, res) => userController.getCreditHistory(req, res));

router.get('/credit/summary', authenticateToken, (req, res) => userController.getCreditSummary(req, res));

router.get('/balance', authenticateToken, (req, res) => userController.getBalance(req, res));

router.get('/transactions', authenticateToken, (req, res) => userController.getTransactions(req, res));

router.post('/withdraw', authenticateToken, (req, res) => userController.withdraw(req, res));

router.get('/transactions/stats', authenticateToken, (req, res) => userController.getTransactionStats(req, res));

module.exports = router;
