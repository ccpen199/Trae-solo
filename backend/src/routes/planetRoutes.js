const express = require('express');
const { body } = require('express-validator');
const {
  createPlanet,
  getPlanets,
  getPlanetById,
  joinPlanet,
  createInviteCode,
  searchPlanets
} = require('../controllers/planetController');
const { authenticate, authenticateOptional } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, [
  body('name').notEmpty().withMessage('星球名称不能为空')
], createPlanet);

router.get('/', authenticateOptional, getPlanets);
router.get('/search', authenticateOptional, searchPlanets);
router.get('/:id', authenticateOptional, getPlanetById);
router.post('/join', authenticate, joinPlanet);
router.post('/invite', authenticate, createInviteCode);

module.exports = router;
