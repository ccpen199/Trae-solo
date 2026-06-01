const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.get('/', teamController.getAllTeams);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

router.get('/:teamId/reservations', teamController.getTeamReservations);
router.post('/reservations', teamController.createReservation);
router.post('/reservations/:id/cancel', teamController.cancelReservation);

router.get('/:teamId/tourists', teamController.getTourists);
router.post('/tourists', teamController.addTourist);
router.put('/tourists/:id', teamController.updateTourist);
router.delete('/tourists/:id', teamController.deleteTourist);

module.exports = router;
