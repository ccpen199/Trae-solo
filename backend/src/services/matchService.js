import db from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class MatchService {
  static getConfig() {
    return {
      winRateLimit: parseFloat(process.env.MATCH_WIN_RATE_LIMIT || 5.0),
      powerDiffLimit: parseInt(process.env.MATCH_POWER_DIFF_LIMIT || 100),
      queueExpireSeconds: parseInt(process.env.MATCH_QUEUE_EXPIRE_SECONDS || 300),
    };
  }

  static addToQueue(player) {
    const queueId = uuidv4();
    const config = this.getConfig();
    const expireTime = new Date(Date.now() + config.queueExpireSeconds * 1000);

    const stmt = db.prepare(`
      INSERT INTO match_queue (id, player_id, tier, power, win_rate, status, expired_at)
      VALUES (?, ?, ?, ?, ?, 'waiting', ?)
    `);
    
    stmt.run(queueId, player.id, player.tier, player.power, player.winRate, expireTime.toISOString());
    
    return { queueId, playerId: player.id, status: 'waiting' };
  }

  static removeFromQueue(playerId) {
    const stmt = db.prepare(`
      UPDATE match_queue SET status = 'cancelled' WHERE player_id = ? AND status = 'waiting'
    `);
    
    const result = stmt.run(playerId);
    return result.changes > 0;
  }

  static getPlayerQueueStatus(playerId) {
    const stmt = db.prepare(`
      SELECT * FROM match_queue 
      WHERE player_id = ? AND status = 'waiting'
      ORDER BY joined_at DESC LIMIT 1
    `);
    
    return stmt.get(playerId);
  }

  static getWaitingPlayers() {
    const stmt = db.prepare(`
      SELECT * FROM match_queue 
      WHERE status = 'waiting' 
      ORDER BY joined_at ASC
    `);
    
    return stmt.all();
  }

  static isMatchable(p1, p2, config = null) {
    if (!config) config = this.getConfig();

    const tierDiff = Math.abs(p1.tier - p2.tier);
    if (tierDiff > 1) {
      return { matched: false, reason: '段位差过大', tierDiff };
    }

    const powerDiff = Math.abs(p1.power - p2.power);
    if (powerDiff > config.powerDiffLimit) {
      return {
        matched: false,
        reason: '战力差过大',
        powerDiff,
        limit: config.powerDiffLimit,
      };
    }

    const winRateDiff = Math.abs(p1.win_rate - p2.win_rate);
    if (winRateDiff > config.winRateLimit) {
      return {
        matched: false,
        reason: '胜率差过大',
        winRateDiff: winRateDiff.toFixed(2),
        limit: config.winRateLimit,
      };
    }

    return {
      matched: true,
      tierDiff,
      powerDiff,
      winRateDiff: winRateDiff.toFixed(2),
    };
  }

  static findMatches() {
    const waitingPlayers = this.getWaitingPlayers();
    const config = this.getConfig();
    const matchedPairs = [];
    const matchedPlayerIds = new Set();

    for (let i = 0; i < waitingPlayers.length; i++) {
      const p1 = waitingPlayers[i];
      if (matchedPlayerIds.has(p1.player_id)) continue;

      for (let j = i + 1; j < waitingPlayers.length; j++) {
        const p2 = waitingPlayers[j];
        if (matchedPlayerIds.has(p2.player_id)) continue;

        const result = this.isMatchable(p1, p2, config);
        if (result.matched) {
          matchedPairs.push({
            player1: p1,
            player2: p2,
            matchInfo: result,
          });
          matchedPlayerIds.add(p1.player_id);
          matchedPlayerIds.add(p2.player_id);
          break;
        }
      }
    }

    return matchedPairs;
  }

  static createBattle(player1, player2, matchInfo) {
    const battleId = uuidv4();
    const now = new Date().toISOString();

    const insertBattle = db.prepare(`
      INSERT INTO battles (
        id, player1_id, player2_id, player1_power, player2_power,
        player1_win_rate, player2_win_rate, power_diff, win_rate_diff,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)
    `);

    const updateQueue = db.prepare(`
      UPDATE match_queue SET status = 'matched', matched_at = ? 
      WHERE player_id IN (?, ?) AND status = 'waiting'
    `);

    const transaction = db.transaction(() => {
      insertBattle.run(
        battleId,
        player1.player_id,
        player2.player_id,
        player1.power,
        player2.power,
        player1.win_rate,
        player2.win_rate,
        matchInfo.powerDiff,
        parseFloat(matchInfo.winRateDiff),
        now
      );
      
      updateQueue.run(now, player1.player_id, player2.player_id);
    });

    transaction();

    return { battleId, player1, player2, matchInfo, status: 'ready' };
  }

  static processMatches() {
    const matchedPairs = this.findMatches();
    const results = [];

    for (const pair of matchedPairs) {
      try {
        const battle = this.createBattle(pair.player1, pair.player2, pair.matchInfo);
        results.push({
          success: true,
          battle,
        });
      } catch (error) {
        results.push({
          success: false,
          player1Id: pair.player1.player_id,
          player2Id: pair.player2.player_id,
          error: error.message,
        });
      }
    }

    return results;
  }

  static getBattleById(battleId) {
    const stmt = db.prepare('SELECT * FROM battles WHERE id = ?');
    return stmt.get(battleId);
  }

  static startBattle(battleId) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE battles SET status = 'playing', started_at = ? WHERE id = ? AND status = 'ready'
    `);
    const result = stmt.run(now, battleId);
    return result.changes > 0;
  }

  static endBattle(battleId, winnerId) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE battles SET status = 'finished', winner_id = ?, ended_at = ? WHERE id = ? AND status = 'playing'
    `);
    const result = stmt.run(winnerId, now, battleId);
    return result.changes > 0;
  }

  static getPlayerBattles(playerId, limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM battles 
      WHERE player1_id = ? OR player2_id = ? 
      ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(playerId, playerId, limit);
  }

  static expireOldQueues() {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE match_queue SET status = 'expired' 
      WHERE status = 'waiting' AND expired_at < ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }
}

export default MatchService;