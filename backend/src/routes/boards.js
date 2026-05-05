const express = require('express');
const { body } = require('express-validator');
const boardController = require('../controllers/boardController');
const { authMiddleware, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', boardController.getAllBoards);
router.get('/:id', boardController.getBoardById);

router.post('/', [
  authMiddleware,
  isAdmin(),
  body('name').notEmpty().withMessage('版块名称不能为空')
], boardController.createBoard);

module.exports = router;
