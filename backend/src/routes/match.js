import express from 'express';
import Player from '../models/player.js';
import MatchService from '../services/matchService.js';
import TraceService from '../services/traceService.js';

const router = express.Router();

router.post('/queue', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'playerId 不能为空',
      });
    }

    const player = Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: '玩家不存在',
      });
    }

    const existingQueue = MatchService.getPlayerQueueStatus(playerId);
    if (existingQueue) {
      return res.status(400).json({
        success: false,
        error: '玩家已在匹配队列中',
        queue: existingQueue,
      });
    }

    const traceResult = TraceService.traceMatchRequest(player, 'join_queue', (requestId) => {
      const result = MatchService.addToQueue(player);
      return { ...result, requestId };
    });

    res.json({
      success: true,
      data: traceResult.result,
      requestId: traceResult.requestId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/queue', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'playerId 不能为空',
      });
    }

    const player = Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: '玩家不存在',
      });
    }

    const traceResult = TraceService.traceMatchRequest(player, 'leave_queue', (requestId) => {
      const removed = MatchService.removeFromQueue(playerId);
      return { removed, requestId };
    });

    res.json({
      success: true,
      data: traceResult.result,
      requestId: traceResult.requestId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/queue/status/:playerId', (req, res) => {
  try {
    const queueStatus = MatchService.getPlayerQueueStatus(req.params.playerId);
    const waitingPlayers = MatchService.getWaitingPlayers();

    res.json({
      success: true,
      data: {
        queueStatus,
        waitingCount: waitingPlayers.length,
        waitingPlayers: waitingPlayers.slice(0, 20),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/process', (req, res) => {
  try {
    const results = MatchService.processMatches();
    res.json({
      success: true,
      data: {
        matchedCount: results.filter((r) => r.success).length,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/battle/:battleId', (req, res) => {
  try {
    const battle = MatchService.getBattleById(req.params.battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: '对战不存在',
      });
    }

    const player1 = Player.findById(battle.player1_id);
    const player2 = Player.findById(battle.player2_id);

    res.json({
      success: true,
      data: {
        ...battle,
        player1: player1 ? player1.toJSON() : null,
        player2: player2 ? player2.toJSON() : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/battle/:battleId/start', (req, res) => {
  try {
    const started = MatchService.startBattle(req.params.battleId);
    if (!started) {
      return res.status(400).json({
        success: false,
        error: '对战无法开始（可能状态不对或不存在）',
      });
    }

    const battle = MatchService.getBattleById(req.params.battleId);
    res.json({
      success: true,
      data: battle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/battle/:battleId/end', (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) {
      return res.status(400).json({
        success: false,
        error: 'winnerId 不能为空',
      });
    }

    const battle = MatchService.getBattleById(req.params.battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: '对战不存在',
      });
    }

    if (battle.player1_id !== winnerId && battle.player2_id !== winnerId) {
      return res.status(400).json({
        success: false,
        error: 'winnerId 不是对战中的玩家',
      });
    }

    const ended = MatchService.endBattle(req.params.battleId, winnerId);
    if (!ended) {
      return res.status(400).json({
        success: false,
        error: '对战无法结束（可能状态不对）',
      });
    }

    const winner = Player.findById(winnerId);
    const loserId = winnerId === battle.player1_id ? battle.player2_id : battle.player1_id;
    const loser = Player.findById(loserId);

    if (winner) {
      winner.addWin();
      winner.updateScore(25);
    }
    if (loser) {
      loser.addLoss();
      loser.updateScore(-15);
    }

    const updatedBattle = MatchService.getBattleById(req.params.battleId);
    res.json({
      success: true,
      data: {
        ...updatedBattle,
        winner: winner ? winner.toJSON() : null,
        loser: loser ? loser.toJSON() : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/player/:playerId/battles', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const battles = MatchService.getPlayerBattles(req.params.playerId, limit);

    const battlesWithPlayers = [];
    for (const battle of battles) {
      const player1 = Player.findById(battle.player1_id);
      const player2 = Player.findById(battle.player2_id);
      battlesWithPlayers.push({
        ...battle,
        player1: player1 ? player1.toJSON() : null,
        player2: player2 ? player2.toJSON() : null,
      });
    }

    res.json({
      success: true,
      data: battlesWithPlayers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/config', (req, res) => {
  try {
    const config = MatchService.getConfig();
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