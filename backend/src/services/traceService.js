import db from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class TraceService {
  static createRequest(playerId, action, requestData = {}) {
    const requestId = uuidv4();
    const requestDataStr = JSON.stringify(requestData);

    const stmt = db.prepare(`
      INSERT INTO match_requests (id, player_id, action, status, request_data)
      VALUES (?, ?, ?, 'pending', ?)
    `);
    
    stmt.run(requestId, playerId, action, requestDataStr);
    return requestId;
  }

  static addLog(requestId, step, stepOrder, status, details = {}) {
    const logId = uuidv4();
    const detailsStr = JSON.stringify(details);

    const stmt = db.prepare(`
      INSERT INTO process_logs (id, request_id, step, step_order, status, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(logId, requestId, step, stepOrder, status, detailsStr);
    return logId;
  }

  static updateRequestStatus(requestId, status, responseData = {}, errorMessage = null, battleId = null, queueId = null) {
    const responseDataStr = JSON.stringify(responseData);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE match_requests 
      SET status = ?, response_data = ?, error_message = ?, battle_id = ?, queue_id = ?, processed_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(status, responseDataStr, errorMessage, battleId, queueId, now, requestId);
    return result.changes > 0;
  }

  static getRequestById(requestId) {
    const stmt = db.prepare('SELECT * FROM match_requests WHERE id = ?');
    const row = stmt.get(requestId);
    return row ? this.parseRequest(row) : null;
  }

  static getRequestLogs(requestId) {
    const stmt = db.prepare(`
      SELECT * FROM process_logs WHERE request_id = ? ORDER BY step_order ASC, created_at ASC
    `);
    const rows = stmt.all(requestId);
    return rows.map((row) => this.parseLog(row));
  }

  static getPlayerRequests(playerId, limit = 50, offset = 0) {
    const stmt = db.prepare(`
      SELECT * FROM match_requests 
      WHERE player_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(playerId, limit, offset);
    return rows.map((row) => this.parseRequest(row));
  }

  static listRequests(limit = 100, offset = 0, status = null) {
    let query = `SELECT * FROM match_requests `;
    const params = [];

    if (status) {
      query += `WHERE status = ? `;
      params.push(status);
    }

    query += `ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map((row) => this.parseRequest(row));
  }

  static getRequestWithDetails(requestId) {
    const request = this.getRequestById(requestId);
    if (!request) return null;

    const logs = this.getRequestLogs(requestId);
    return {
      ...request,
      logs,
    };
  }

  static parseRequest(row) {
    return {
      id: row.id,
      player_id: row.player_id,
      action: row.action,
      status: row.status,
      battle_id: row.battle_id,
      queue_id: row.queue_id,
      request_data: row.request_data ? JSON.parse(row.request_data) : {},
      response_data: row.response_data ? JSON.parse(row.response_data) : {},
      error_message: row.error_message,
      created_at: row.created_at,
      processed_at: row.processed_at,
    };
  }

  static parseLog(row) {
    return {
      id: row.id,
      request_id: row.request_id,
      step: row.step,
      step_order: row.step_order,
      status: row.status,
      details: row.details ? JSON.parse(row.details) : {},
      created_at: row.created_at,
    };
  }

  static traceMatchRequest(player, action, executeFn) {
    const requestId = this.createRequest(player.id, action, {
      playerId: player.id,
      playerName: player.name,
      tier: player.tier,
      tierName: player.tier_name,
      power: player.power,
      winRate: player.winRate,
    });

    let stepOrder = 1;

    try {
      this.addLog(requestId, '开始处理请求', stepOrder++, 'start', {
        timestamp: new Date().toISOString(),
      });

      this.addLog(requestId, '验证玩家状态', stepOrder++, 'running', {
        playerId: player.id,
        isActive: true,
      });

      const result = executeFn(requestId);

      this.addLog(requestId, '执行成功', stepOrder++, 'success', {
        result: typeof result === 'object' ? result : { value: result },
      });

      this.updateRequestStatus(
        requestId,
        'success',
        result,
        null,
        result.battleId || null,
        result.queueId || null
      );

      return { success: true, requestId, result };
    } catch (error) {
      this.addLog(requestId, '执行失败', stepOrder++, 'error', {
        error: error.message,
        stack: error.stack,
      });

      this.updateRequestStatus(requestId, 'failed', {}, error.message);

      throw error;
    }
  }
}

export default TraceService;