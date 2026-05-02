const express = require('express');
const { AuthController } = require('../controllers/authController');
const { TaskController } = require('../controllers/taskController');
const { ProgressController, RewardController, AchievementController } = require('../controllers/gameController');
const { ReportController } = require('../controllers/reportController');

const router = express.Router();

const authController = new AuthController();
const taskController = new TaskController();
const progressController = new ProgressController();
const rewardController = new RewardController();
const achievementController = new AchievementController();
const reportController = new ReportController();

router.post('/auth/login', (req, res) => authController.login(req, res));
router.get('/auth/me', (req, res) => authController.getCurrentUser(req, res));
router.get('/auth/roles', (req, res) => authController.getRoles(req, res));

router.get('/tasks/states', (req, res) => taskController.getTaskStates(req, res));
router.get('/tasks', (req, res) => taskController.getTasks(req, res));
router.get('/tasks/:taskUuid', (req, res) => taskController.getTask(req, res));
router.post('/tasks', (req, res) => taskController.createTask(req, res));
router.put('/tasks/:taskUuid', (req, res) => taskController.updateTask(req, res));
router.post('/tasks/:taskUuid/configure', (req, res) => taskController.configureTask(req, res));
router.post('/tasks/:taskUuid/publish', (req, res) => taskController.publishTask(req, res));
router.post('/tasks/:taskUuid/rewards', (req, res) => taskController.addTaskReward(req, res));

router.post('/events/trigger', (req, res) => progressController.triggerEvent(req, res));
router.get('/events/triggers', (req, res) => progressController.getTriggerEvents(req, res));
router.get('/progress', (req, res) => progressController.getUserProgress(req, res));
router.get('/progress/:progressUuid', (req, res) => progressController.getProgressDetail(req, res));

router.get('/rewards', (req, res) => rewardController.getRewards(req, res));
router.post('/rewards', (req, res) => rewardController.createReward(req, res));
router.get('/rewards/user', (req, res) => rewardController.getUserRewards(req, res));
router.post('/rewards/grant', (req, res) => rewardController.grantTaskRewards(req, res));
router.post('/rewards/:userRewardUuid/deliver', (req, res) => rewardController.deliverReward(req, res));

router.get('/achievements', (req, res) => achievementController.getAchievements(req, res));
router.post('/achievements', (req, res) => achievementController.createAchievement(req, res));
router.get('/achievements/user', (req, res) => achievementController.getUserAchievements(req, res));
router.post('/achievements/:achievementUuid/rewards', (req, res) => achievementController.addAchievementReward(req, res));

router.get('/reports/dashboard', (req, res) => reportController.getDashboard(req, res));
router.get('/reports/task-stats', (req, res) => reportController.getTaskStatistics(req, res));
router.get('/reports/progress-stats', (req, res) => reportController.getProgressStatistics(req, res));
router.get('/reports/reward-stats', (req, res) => reportController.getRewardStatistics(req, res));
router.get('/reports/conversion-funnel', (req, res) => reportController.getConversionFunnel(req, res));
router.get('/reports/processing-time', (req, res) => reportController.getProcessingTimeAnalysis(req, res));
router.get('/reports/exceptions', (req, res) => reportController.getExceptionAnalysis(req, res));
router.get('/reports/revenue', (req, res) => reportController.getRevenueAnalysis(req, res));
router.get('/reports/audit-trails', (req, res) => reportController.getAllAuditLogs(req, res));
router.get('/reports/audit-trails/:target_type/:target_uuid', (req, res) => reportController.getAuditTrail(req, res));
router.get('/reports/cross-reference/:source_type/:source_uuid', (req, res) => reportController.getCrossReference(req, res));

module.exports = router;
