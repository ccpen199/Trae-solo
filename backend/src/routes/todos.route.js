const express = require('express');
const todoService = require('../services/todo.service');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const user = req.user;
    const { status, step, limit = 100, offset = 0 } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (status) options.status = status;
    if (step) options.step = step;

    const todos = todoService.getTodos(user.id, options);

    res.json({
      success: true,
      data: todos,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/count', (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;

    const totalCount = todoService.getTodoCount(user.id);
    const pendingCount = todoService.getTodoCount(user.id, { status: 'pending' });
    const completedCount = todoService.getTodoCount(user.id, { status: 'completed' });

    res.json({
      success: true,
      data: {
        total: totalCount,
        pending: pendingCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/complete', (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = todoService.completeTodo(id, user.id);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
