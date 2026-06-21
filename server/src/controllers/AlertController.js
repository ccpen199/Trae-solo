const db = require('../config/database');
const config = require('../config');
const { validateDevicePermission } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class AlertController {
  async createStoragePolicy(req, res) {
    try {
      const {
        name, deviceId, groupId, policyType = 'schedule',
        retentionDays = 7, scheduleConfig, smartTags
      } = req.body;

      if (!name) return res.status(400).json({ code: 400, message: '策略名称不能为空' });
      if (!['event', 'schedule', 'smart'].includes(policyType)) {
        return res.status(400).json({ code: 400, message: '无效的策略类型' });
      }

      const result = db.prepare(`
        INSERT INTO storage_policies (
          name, owner_id, device_id, group_id,
          policy_type, retention_days,
          schedule_config, smart_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, req.user.id,
        deviceId || null,
        groupId || null,
        policyType,
        retentionDays,
        scheduleConfig ? JSON.stringify(scheduleConfig) : null,
        smartTags ? JSON.stringify(smartTags) : null
      );

      const policy = db.prepare('SELECT * FROM storage_policies WHERE id = ?').get(result.lastInsertRowid);
      res.json({ code: 200, message: '创建成功', data: policy });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateStoragePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = db.prepare('SELECT * FROM storage_policies WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!policy) return res.status(404).json({ code: 404, message: '策略不存在' });

      const {
        name, deviceId, groupId, policyType,
        retentionDays, scheduleConfig, smartTags, status
      } = req.body;

      db.prepare(`
        UPDATE storage_policies SET
          name = COALESCE(?, name),
          device_id = ?,
          group_id = ?,
          policy_type = COALESCE(?, policy_type),
          retention_days = COALESCE(?, retention_days),
          schedule_config = ?,
          smart_tags = ?,
          status = COALESCE(?, status)
        WHERE id = ?
      `).run(
        name || null,
        deviceId === undefined ? null : deviceId,
        groupId === undefined ? null : groupId,
        policyType || null,
        retentionDays !== undefined ? retentionDays : null,
        scheduleConfig ? JSON.stringify(scheduleConfig) : null,
        smartTags ? JSON.stringify(smartTags) : null,
        status !== undefined ? status : null,
        id
      );

      res.json({ code: 200, message: '更新成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listStoragePolicies(req, res) {
    try {
      const policies = db.prepare(`
        SELECT sp.*, d.name as device_name, dg.name as group_name
        FROM storage_policies sp
        LEFT JOIN devices d ON sp.device_id = d.id
        LEFT JOIN device_groups dg ON sp.group_id = dg.id
        WHERE sp.owner_id = ?
        ORDER BY sp.created_at DESC
      `).all(req.user.id);

      res.json({ code: 200, data: policies });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteStoragePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = db.prepare('SELECT * FROM storage_policies WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!policy) return res.status(404).json({ code: 404, message: '策略不存在' });

      db.prepare('DELETE FROM storage_policies WHERE id = ?').run(id);
      res.json({ code: 200, message: '删除成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async reportAIEvent(req, res) {
    try {
      const {
        deviceSN, eventType, eventLevel = 'normal',
        confidence, snapshot, videoData,
        location, description, smartTags
      } = req.body;

      if (!deviceSN || !eventType) {
        return res.status(400).json({ code: 400, message: '必要参数缺失' });
      }

      const device = db.prepare('SELECT * FROM devices WHERE device_sn = ?').get(deviceSN);
      if (!device) return res.status(404).json({ code: 404, message: '设备未注册' });

      const snapshotDir = path.join(config.uploadPath, 'snapshots', String(device.owner_id));
      if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
      }

      let snapshotPath = null;
      if (snapshot) {
        const timestamp = Date.now();
        snapshotPath = path.join(snapshotDir, `${device.id}_${timestamp}.jpg`);
        try {
          if (snapshot.startsWith('data:image')) {
            const base64Data = snapshot.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(snapshotPath, Buffer.from(base64Data, 'base64'));
          } else {
            fs.writeFileSync(snapshotPath, Buffer.from(snapshot, 'base64'));
          }
        } catch (e) {
          console.error('Save snapshot error:', e);
          snapshotPath = null;
        }
      }

      const result = db.prepare(`
        INSERT INTO ai_events (
          device_id, event_type, event_level, confidence,
          snapshot_path,
          location_x, location_y, location_w, location_h,
          description, smart_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        device.id,
        eventType,
        eventLevel,
        confidence || 0,
        snapshotPath,
        location?.x || null,
        location?.y || null,
        location?.w || null,
        location?.h || null,
        description || null,
        smartTags ? JSON.stringify(smartTags) : null
      );

      const eventId = result.lastInsertRowid;

      await this.triggerAlerts(eventId, device, eventType, eventLevel, description, snapshotPath);

      const recordDir = path.join(config.recordPath, String(device.owner_id), String(device.id));
      if (!fs.existsSync(recordDir)) {
        fs.mkdirSync(recordDir, { recursive: true });
      }

      const policies = db.prepare(`
        SELECT * FROM storage_policies
        WHERE owner_id = ? AND status = 1
          AND (device_id = ? OR group_id = ? OR (device_id IS NULL AND group_id IS NULL))
          AND policy_type IN ('event', 'smart')
      `).all(device.owner_id, device.id, device.group_id);

      if (policies.length > 0) {
        const startTime = new Date();
        const fileName = `${device.id}_event_${eventId}_${startTime.getTime()}.mp4`;
        const filePath = path.join(recordDir, fileName);

        db.prepare(`
          INSERT INTO recordings (
            device_id, file_path, file_name, start_time,
            record_type, event_id, duration
          ) VALUES (?, ?, ?, ?, 'event', ?, 30)
        `).run(device.id, filePath, fileName, startTime.toISOString(), eventId);
      }

      const wss = require('../websocket/streamServer');
      wss.broadcastEvent(device.owner_id, {
        type: 'ai_event',
        eventId,
        eventType,
        eventLevel,
        deviceId: device.id,
        deviceName: device.name,
        confidence,
        snapshotPath,
        createdAt: new Date().toISOString()
      });

      res.json({ code: 200, message: '事件已上报', data: { eventId } });
    } catch (e) {
      console.error('Report AI event error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async triggerAlerts(eventId, device, eventType, eventLevel, description, snapshotPath) {
    try {
      const userId = device.owner_id;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) return;

      const titleMap = {
        'person_detect': '人形侦测告警',
        'motion_detect': '移动侦测告警',
        'face_recognize': '人脸识别告警',
        'vehicle_detect': '车辆检测告警',
        'intrusion': '区域入侵告警',
        'line_cross': '越界侦测告警',
        'offline': '设备离线告警'
      };

      const title = titleMap[eventType] || '智能侦测告警';

      const channels = ['inapp'];
      if (user.phone && ['high', 'critical'].includes(eventLevel)) channels.push('sms');
      channels.push('wechat');

      const alertResult = db.prepare(`
        INSERT INTO alerts (
          event_id, device_id, user_id, alert_type,
          title, content, channels
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId, device.id, userId,
        eventType,
        title,
        description || `${device.name} 触发了${title}`,
        JSON.stringify(channels)
      );

      const alertId = alertResult.lastInsertRowid;
      const sentChannels = [];
      sentChannels.push('inapp');

      if (channels.includes('sms') && user.phone) {
        try {
          await this.sendSMS(user.phone, `${title}：${device.name} 检测到异常，请及时查看。`);
          sentChannels.push('sms');
        } catch (e) {
          console.error('SMS send failed:', e);
        }
      }

      if (channels.includes('wechat')) {
        try {
          await this.sendWechatTemplate(user.id, {
            deviceName: device.name,
            eventType: title,
            time: new Date().toLocaleString('zh-CN'),
            description: description || '请及时查看监控画面'
          });
          sentChannels.push('wechat');
        } catch (e) {
          console.error('WeChat send failed:', e);
        }
      }

      db.prepare('UPDATE alerts SET sent_channels = ?, status = 1 WHERE id = ?').run(
        JSON.stringify(sentChannels), alertId
      );

      const familyMembers = db.prepare('SELECT id FROM users WHERE parent_id = ?').all(userId);
      for (const member of familyMembers) {
        db.prepare(`
          INSERT INTO alerts (
            event_id, device_id, user_id, alert_type,
            title, content, channels, status, sent_channels
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, '["inapp"]')
        `).run(
          eventId, device.id, member.id, eventType,
          title,
          description || `${device.name} 触发了${title}`,
          '["inapp"]'
        );
      }
    } catch (e) {
      console.error('Trigger alerts error:', e);
    }
  }

  async sendSMS(phone, content) {
    if (!config.sms.apiKey || config.sms.apiKey === 'your_sms_api_key') {
      console.log('[SMS Mock]', phone, content);
      return true;
    }

    return true;
  }

  async sendWechatTemplate(userId, data) {
    if (!config.wechat.appid || config.wechat.appid === 'your_wechat_appid') {
      console.log('[WeChat Mock]', userId, data);
      return true;
    }
    return true;
  }

  async listEvents(req, res) {
    try {
      const {
        deviceId, eventType, eventLevel,
        startTime, endTime, processed,
        page = 1, pageSize = 30
      } = req.query;
      const offset = (page - 1) * pageSize;

      const conditions = ['d.owner_id = ?'];
      const params = [req.user.id];

      if (deviceId) {
        conditions.push('e.device_id = ?');
        params.push(deviceId);
      }
      if (eventType) {
        conditions.push('e.event_type = ?');
        params.push(eventType);
      }
      if (eventLevel) {
        conditions.push('e.event_level = ?');
        params.push(eventLevel);
      }
      if (startTime) {
        conditions.push('e.created_at >= ?');
        params.push(startTime);
      }
      if (endTime) {
        conditions.push('e.created_at <= ?');
        params.push(endTime);
      }
      if (processed !== undefined) {
        conditions.push('e.processed = ?');
        params.push(+processed);
      }

      const where = 'WHERE ' + conditions.join(' AND ');
      const events = db.prepare(`
        SELECT e.*, d.name as device_name, d.device_sn
        FROM ai_events e
        JOIN devices d ON e.device_id = d.id
        ${where}
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM ai_events e JOIN devices d ON e.device_id = d.id ${where}`).get(...params).count;

      res.json({
        code: 200,
        data: { list: events, total, page: +page, pageSize: +pageSize }
      });
    } catch (e) {
      console.error('List events error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listAlerts(req, res) {
    try {
      const {
        deviceId, alertType, readStatus,
        startTime, endTime,
        page = 1, pageSize = 30
      } = req.query;
      const offset = (page - 1) * pageSize;

      const conditions = ['a.user_id = ?'];
      const params = [req.user.id];

      if (deviceId) {
        conditions.push('a.device_id = ?');
        params.push(deviceId);
      }
      if (alertType) {
        conditions.push('a.alert_type = ?');
        params.push(alertType);
      }
      if (readStatus !== undefined) {
        conditions.push('a.read_status = ?');
        params.push(+readStatus);
      }
      if (startTime) {
        conditions.push('a.created_at >= ?');
        params.push(startTime);
      }
      if (endTime) {
        conditions.push('a.created_at <= ?');
        params.push(endTime);
      }

      const where = 'WHERE ' + conditions.join(' AND ');
      const alerts = db.prepare(`
        SELECT a.*, d.name as device_name,
          e.snapshot_path, e.event_level, e.confidence
        FROM alerts a
        JOIN devices d ON a.device_id = d.id
        LEFT JOIN ai_events e ON a.event_id = e.id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM alerts a ${where}`).get(...params).count;
      const unreadCount = db.prepare(`SELECT COUNT(*) as count FROM alerts a WHERE user_id = ? AND read_status = 0`).get(req.user.id).count;

      res.json({
        code: 200,
        data: { list: alerts, total, unreadCount, page: +page, pageSize: +pageSize }
      });
    } catch (e) {
      console.error('List alerts error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async markAlertRead(req, res) {
    try {
      const { ids = [] } = req.body;
      if (ids.length === 0) {
        db.prepare('UPDATE alerts SET read_status = 1 WHERE user_id = ? AND read_status = 0').run(req.user.id);
      } else {
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`UPDATE alerts SET read_status = 1 WHERE user_id = ? AND id IN (${placeholders})`).run(req.user.id, ...ids);
      }

      db.prepare(`
        INSERT INTO alert_audit_logs (alert_id, user_id, action, action_detail)
        VALUES (?, ?, 'read', '标记为已读')
      `).run(ids[0] || 0, req.user.id);

      res.json({ code: 200, message: '操作成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async createAuditLog(req, res) {
    try {
      const { alertId, action, detail } = req.body;
      const { getClientIp } = require('../utils/common');

      db.prepare(`
        INSERT INTO alert_audit_logs (alert_id, user_id, action, action_detail, ip)
        VALUES (?, ?, ?, ?, ?)
      `).run(alertId, req.user.id, action, detail || '', getClientIp(req));

      res.json({ code: 200, message: '记录成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listAuditLogs(req, res) {
    try {
      const { alertId, page = 1, pageSize = 50 } = req.query;
      const offset = (page - 1) * pageSize;

      let where = 'WHERE a.alert_id IN (SELECT id FROM alerts WHERE user_id = ?)';
      const params = [req.user.id];

      if (alertId) {
        where += ' AND a.alert_id = ?';
        params.push(alertId);
      }

      const logs = db.prepare(`
        SELECT a.*, u.username, u.nickname,
          al.title as alert_title
        FROM alert_audit_logs a
        JOIN users u ON a.user_id = u.id
        JOIN alerts al ON a.alert_id = al.id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM alert_audit_logs a ${where}`).get(...params).count;

      res.json({
        code: 200,
        data: { list: logs, total, page: +page, pageSize: +pageSize }
      });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE owner_id = ?').get(userId).count;
      const onlineCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE owner_id = ? AND online_status = 1').get(userId).count;
      const today = new Date().toISOString().split('T')[0];

      const todayEventCount = db.prepare(`
        SELECT COUNT(*) as count FROM ai_events e
        JOIN devices d ON e.device_id = d.id
        WHERE d.owner_id = ? AND DATE(e.created_at) = ?
      `).get(userId, today).count;

      const eventTypeStats = db.prepare(`
        SELECT e.event_type, COUNT(*) as count
        FROM ai_events e
        JOIN devices d ON e.device_id = d.id
        WHERE d.owner_id = ? AND e.created_at >= DATE('now', '-7 days')
        GROUP BY e.event_type
      `).all(userId);

      const alertLevelStats = db.prepare(`
        SELECT 
          SUM(CASE WHEN e.event_level = 'low' THEN 1 ELSE 0 END) as low,
          SUM(CASE WHEN e.event_level = 'normal' THEN 1 ELSE 0 END) as normal,
          SUM(CASE WHEN e.event_level = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN e.event_level = 'critical' THEN 1 ELSE 0 END) as critical
        FROM ai_events e
        JOIN devices d ON e.device_id = d.id
        WHERE d.owner_id = ? AND e.created_at >= DATE('now', '-7 days')
      `).get(userId);

      const recordingCount = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
        FROM recordings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.owner_id = ?
      `).get(userId);

      res.json({
        code: 200,
        data: {
          deviceCount,
          onlineCount,
          offlineCount: deviceCount - onlineCount,
          onlineRate: deviceCount > 0 ? Math.round(onlineCount / deviceCount * 100) : 0,
          todayEventCount,
          eventTypeStats,
          alertLevelStats,
          recordingCount
        }
      });
    } catch (e) {
      console.error('Statistics error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
}

module.exports = new AlertController();
