const express = require('express');
const router = express.Router();
const engineerController = require('../controllers/engineerController');

router.get('/', engineerController.getAllEngineers);
router.get('/dispatch', engineerController.dispatchEngineers);
router.get('/:id', engineerController.getEngineer);
router.get('/:id/skills', engineerController.getSkills);
router.post('/', engineerController.createEngineer);
router.put('/:id', engineerController.updateEngineer);
router.put('/:id/location', engineerController.updateLocation);
router.post('/skills', engineerController.addSkill);

module.exports = router;
