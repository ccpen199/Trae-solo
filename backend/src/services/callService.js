import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { CALL_STATUS, MAX_CALL_RECORDS, RELATION_SOURCES } from '../utils/constants.js';
import { contactService } from './contactService.js';
import { messageCenterService } from './messageCenterService.js';

class CallService {
  createSession(callerId, calleeId, callType = 'video') {
    const sessionId = uuidv4();

    const insertStmt = db.prepare(`
      INSERT INTO call_sessions (session_id, caller_id, callee_id, status, call_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(sessionId, callerId, calleeId, CALL_STATUS.DIALING, callType);

    this.cleanupOldRecords(callerId);
    this.cleanupOldRecords(calleeId);

    return {
      success: true,
      data: {
        sessionId,
        id: result.lastInsertRowid,
        status: CALL_STATUS.DIALING
      }
    };
  }

  cleanupOldRecords(userId) {
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM call_sessions 
      WHERE caller_id = ? OR callee_id = ?
    `);
    const result = countStmt.get(userId, userId);

    if (result.count > MAX_CALL_RECORDS) {
      const deleteStmt = db.prepare(`
        DELETE FROM call_sessions 
        WHERE id IN (
          SELECT id FROM call_sessions 
          WHERE caller_id = ? OR callee_id = ?
          ORDER BY created_at ASC 
          LIMIT ?
        )
      `);
      deleteStmt.run(userId, userId, result.count - MAX_CALL_RECORDS);
    }
  }

  updateSessionStatus(sessionId, status, startTime = null, endTime = null, duration = null) {
    const updates = ['status = ?'];
    const values = [status];

    if (startTime) {
      updates.push('start_time = ?');
      values.push(startTime);
    }
    if (endTime) {
      updates.push('end_time = ?');
      values.push(endTime);
    }
    if (duration !== null) {
      updates.push('duration = ?');
      values.push(duration);
    }

    values.push(sessionId);

    const query = `UPDATE call_sessions SET ${updates.join(', ')} WHERE session_id = ?`;
    db.prepare(query).run(...values);

    return this.getSessionBySessionId(sessionId);
  }

  getSessionBySessionId(sessionId) {
    return db.prepare(`
      SELECT cs.*, 
        caller.cid as caller_cid, caller.username as caller_name, caller.avatar as caller_avatar,
        callee.cid as callee_cid, callee.username as callee_name, callee.avatar as callee_avatar
      FROM call_sessions cs
      JOIN accounts caller ON cs.caller_id = caller.id
      JOIN accounts callee ON cs.callee_id = callee.id
      WHERE cs.session_id = ?
    `).get(sessionId);
  }

  getSessionById(id) {
    return db.prepare(`
      SELECT cs.*, 
        caller.cid as caller_cid, caller.username as caller_name,
        callee.cid as callee_cid, callee.username as callee_name
      FROM call_sessions cs
      JOIN accounts caller ON cs.caller_id = caller.id
      JOIN accounts callee ON cs.callee_id = callee.id
      WHERE cs.id = ?
    `).get(id);
  }

  handleCallEnd(sessionId, finalStatus) {
    const session = this.getSessionBySessionId(sessionId);
    if (!session) return null;

    let duration = 0;
    if (session.start_time && finalStatus === CALL_STATUS.ENDED) {
      const start = new Date(session.start_time);
      const end = new Date();
      duration = Math.floor((end - start) / 1000);
    }

    const updatedSession = this.updateSessionStatus(
      sessionId, 
      finalStatus, 
      null, 
      new Date().toISOString(), 
      duration
    );

    if (finalStatus === CALL_STATUS.ANSWERED || finalStatus === CALL_STATUS.ENDED) {
      const callerResult = contactService.tryAutoAddContact(
        session.caller_id, 
        session.callee_id, 
        RELATION_SOURCES.VIDEO_CALL
      );
      const calleeResult = contactService.tryAutoAddContact(
        session.callee_id, 
        session.caller_id, 
        RELATION_SOURCES.VIDEO_CALL
      );
    }

    messageCenterService.addCallRecordNotification(session.caller_id, {
      ...session,
      callee_name: session.callee_name,
      status: finalStatus
    }, true);

    messageCenterService.addCallRecordNotification(session.callee_id, {
      ...session,
      caller_name: session.caller_name,
      status: finalStatus
    }, false);

    return updatedSession;
  }

  getCallHistory(userId, limit = 50) {
    const calls = db.prepare(`
      SELECT 
        cs.id, cs.session_id, cs.caller_id, cs.callee_id, cs.status, 
        cs.start_time, cs.end_time, cs.duration, cs.call_type, cs.created_at,
        CASE 
          WHEN cs.caller_id = ? THEN callee.cid
          ELSE caller.cid
        END as other_cid,
        CASE 
          WHEN cs.caller_id = ? THEN callee.username
          ELSE caller.username
        END as other_name,
        CASE 
          WHEN cs.caller_id = ? THEN callee.avatar
          ELSE caller.avatar
        END as other_avatar,
        cs.caller_id = ? as is_outgoing
      FROM call_sessions cs
      JOIN accounts caller ON cs.caller_id = caller.id
      JOIN accounts callee ON cs.callee_id = callee.id
      WHERE cs.caller_id = ? OR cs.callee_id = ?
      ORDER BY cs.created_at DESC
      LIMIT ?
    `).all(userId, userId, userId, userId, userId, userId, limit);

    return { success: true, data: calls };
  }

  getActiveCall(userId) {
    const call = db.prepare(`
      SELECT cs.*,
        caller.cid as caller_cid, caller.username as caller_name, caller.avatar as caller_avatar,
        callee.cid as callee_cid, callee.username as callee_name, callee.avatar as callee_avatar
      FROM call_sessions cs
      JOIN accounts caller ON cs.caller_id = caller.id
      JOIN accounts callee ON cs.callee_id = callee.id
      WHERE (cs.caller_id = ? OR cs.callee_id = ?)
        AND cs.status IN ('dialing', 'ringing', 'connected')
      ORDER BY cs.created_at DESC
      LIMIT 1
    `).get(userId, userId);

    return call;
  }
}

export const callService = new CallService();
