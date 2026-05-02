import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Alert from '../models/Alert.js';
import Log from '../models/Log.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type, level, status, page = 1, limit = 20 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (level) where.level = level;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: alerts } = await Alert.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      alerts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', [
  body('status').optional().isIn(['pending', 'processing', 'resolved']),
  body('assigned_to').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const alert = await Alert.findByPk(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const { status, assigned_to } = req.body;

    if (status) alert.status = status;
    if (assigned_to) alert.assigned_to = assigned_to;
    if (status === 'resolved') alert.resolved_at = new Date();

    await alert.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_alert',
      target: 'alert',
      target_id: alert.id,
      message: `Alert updated: ${alert.message.substring(0, 50)}...`,
      details: { status, assigned_to }
    });

    res.json({ alert });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/resolve', [
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    await alert.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'resolve_alert',
      target: 'alert',
      target_id: alert.id,
      message: `Alert resolved: ${alert.message.substring(0, 50)}...`,
      details: { notes: req.body.notes }
    });

    if (req.io) {
      req.io.to('user:operation').emit('alert:resolved', {
        alertId: alert.id
      });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;