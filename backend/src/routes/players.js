import express from 'express';
import Player from '../models/player.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const players = Player.list(limit, offset);
    res.json({
      success: true,
      data: players.map((p) => p.toJSON()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const player = Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: '玩家不存在',
      });
    }
    res.json({
      success: true,
      data: player.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '玩家名称不能为空',
      });
    }

    const existingPlayer = Player.findByName(name.trim());
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: '玩家名称已存在',
      });
    }

    const player = Player.create(name.trim(), avatar);
    res.json({
      success: true,
      data: player.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/score', (req, res) => {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'delta 必须是数字',
      });
    }

    const player = Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: '玩家不存在',
      });
    }

    player.updateScore(delta);
    res.json({
      success: true,
      data: player.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/config/tier', (req, res) => {
  try {
    const config = Player.getTierConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;