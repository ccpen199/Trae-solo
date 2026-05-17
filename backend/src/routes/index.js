const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const whitelistController = require('../controllers/whitelistController');
const userController = require('../controllers/userController');
const commissionController = require('../controllers/commissionController');
const creditController = require('../controllers/creditController');
const bankCardController = require('../controllers/bankCardController');
const advanceController = require('../controllers/advanceController');

router.post('/whitelist/check', whitelistController.checkWhitelist);
router.post('/user/register', userController.register);

router.use(auth);

router.get('/user/info', userController.getUserInfo);
router.get('/commission/list', commissionController.getCommissionList);
router.get('/commission/:id', commissionController.getCommissionDetail);
router.get('/credit/info', creditController.getCreditInfo);
router.post('/credit/submit', creditController.submitCreditApplication);
router.get('/bankcard/list', bankCardController.getBankCardList);
router.post('/bankcard/send-code', bankCardController.sendVerifyCode);
router.post('/bankcard/bind', bankCardController.bindBankCard);
router.get('/advance/list', advanceController.getAdvanceList);
router.get('/advance/precheck', advanceController.getAdvancePreCheck);
router.post('/advance/submit', advanceController.submitAdvanceApplication);

module.exports = router;
