const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/categories', authorize('category:read'), dishController.getCategories);
router.post('/categories', authorize('category:write'), dishController.createCategory);
router.put('/categories/:id', authorize('category:write'), dishController.updateCategory);
router.delete('/categories/:id', authorize('category:delete'), dishController.deleteCategory);

router.get('/menu', dishController.getMenu);

router.get('/', authorize('dish:read'), dishController.getDishes);
router.get('/:id', authorize('dish:read'), dishController.getDishById);
router.post('/', authorize('dish:write'), dishController.createDish);
router.put('/:id', authorize('dish:write'), dishController.updateDish);
router.patch('/:id/status', authorize('dish:write'), dishController.updateDishStatus);
router.delete('/:id', authorize('dish:delete'), dishController.deleteDish);

module.exports = router;
