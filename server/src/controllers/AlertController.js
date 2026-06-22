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

      const result = await db.run(`
        INSERT INTO storage_policies (
          name, owner_id, device_id, group_id,
          policy_type, retention_days,
          schedule_config, smart_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        name, req.user.id,
        deviceId || null,
        groupId || null,
        policyType,
        retentionDays,
        scheduleConfig ? JSON.stringify(scheduleConfig) : null,
        smartTags ? JSON.stringify(smartTags) : null
      );

      const policy = await db.get('SELECT * FROM storage_policies WHERE id = ?', result.lastID);
      res.json({ code: 200, message: '创建成功', data: policy });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateStoragePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = await db.get('SELECT * FROM storage_policies WHERE id = ? AND owner_id = ?', id, req.user.id);
      if (!policy) return res.status(404).json({ code: 404, message: '策略不存在' });

      const {
        name, deviceId, groupId, policyType,
        retentionDays, scheduleConfig, smartTags, status
      } = req.body;

      await db.run(`
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
      `,
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
      const policies = await db.all(`
        SELECT sp.*, d.name as device_name, dg.name as group_name
        FROM storage_policies sp
        LEFT JOIN devices d ON sp.device_id = d.id
        LEFT JOIN device_groups dg ON sp.group_id = dg.id
        WHERE sp.owner_id = ?
        ORDER BY sp.created_at DESC
      `, req.user.id);

      res.json({ code: 200, data: policies });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteStoragePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = await db.get('SELECT * FROM storage_policies WHERE id = ? AND owner_id = ?', id, req.user.id);
      if (!policy) return res.status(404).json({ code: 404, message: '策略不存在' });

      await db.run('DELETE FROM storage_policies WHERE id = ?', id);
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

      const device = await db.get('SELECT * FROM devices WHERE device_sn = ?', deviceSN);
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

      const result = await db.run(`
        INSERT INTO ai_events (
          device_id, event_type, event_level, confidence,
          snapshot_path,
          location_x, location_y, location_w, location_h,
          description, smart_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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

      const eventId = result.lastID;

      await this.triggerAlerts(eventId, device, eventType, eventLevel, description, snapshotPath);

      const recordDir = path.join(config.recordPath, String(device.owner_id), String(device.id));
      if (!fs.existsSync(recordDir)) {
        fs.mkdirSync(recordDir, { recursive: true });
      }

      const policies = await db.all(`
        SELECT * FROM storage_policies
        WHERE owner_id = ? AND status = 1
          AND (device_id = ? OR group_id = ? OR (device_id IS NULL AND group_id IS NULL))
          AND policy_type IN ('event', 'smart')
      `, device.owner_id, device.id, device.group_id);

      if (policies.length > 0) {
        const startTime = new Date();
        const fileName = `${device.id}_event_${eventId}_${startTime.getTime()}.mp4`;
        const filePath = path.join(recordDir, fileName);

        await db.run(`
          INSERT INTO recordings (
            device_id, file_path, file_name, start_time,
            record_type, event_id, duration
          ) VALUES (?, ?, ?, ?, 'event', ?, 30)
        `, device.id, filePath, fileName, startTime.toISOString(), eventId);
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
      const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
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

      const alertResult = await db.run(`
        INSERT INTO alerts (
          event_id, device_id, user_id, alert_type,
          title, content, channels
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        eventId, device.id, userId,
        eventType,
        title,
        description || `${device.name} 触发了${title}`,
        JSON.stringify(channels)
      );

      const alertId = alertResult.lastID;
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

      await db.run('UPDATE alerts SET sent_channels = ?, status = 1 WHERE id = ?',
        JSON.stringify(sentChannels), alertId
      );

      const familyMembers = await db.all('SELECT id FROM users WHERE parent_id = ?', userId);
      for (const member of familyMembers) {
        await db.run(`
          INSERT INTO alerts (
            event_id, device_id, user_id, alert_type,
            title, content, channels, status, sent_channels
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, '["inapp"]')
        `,
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

      const events = db.getTable('ai_events');
      const devices = db.getTable('devices');
      const shares = db.getTable('device_shares');
      const userId = req.user.id;

      const allowedDeviceIds = new Set();
      devices.forEach(d => {
        if (d.owner_id === userId) allowedDeviceIds.add(d.id);
      });
      shares.forEach(s => {
        if (s.share_to_user_id === userId && s.status === 1) {
          allowedDeviceIds.add(s.device_id);
        }
      });

      const deviceMap = {};
      devices.forEach(d => { deviceMap[d.id] = d; });

      let filtered = events.filter(e => {
        if (!allowedDeviceIds.has(e.device_id)) return false;
        if (deviceId && e.device_id !== +deviceId && e.device_id !== deviceId) return false;
        if (eventType && e.event_type !== eventType) return false;
        if (eventLevel && e.event_level !== eventLevel) return false;
        if (startTime && e.created_at < startTime) return false;
        if (endTime && e.created_at > endTime) return false;
        if (processed !== undefined && e.processed !== +processed) return false;
        return true;
      });

      filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      const total = filtered.length;
      const pageNum = +page;
      const pageSizeNum = +pageSize;
      const start = (pageNum - 1) * pageSizeNum;
      const paged = filtered.slice(start, start + pageSizeNum);

      const list = paged.map(e => {
        const device = deviceMap[e.device_id];
        return {
          ...e,
          device_name: device ? device.name : null,
          device_sn: device ? device.device_sn : null
        };
      });

      res.json({
        code: 200,
        data: { list, total, page: pageNum, pageSize: pageSizeNum }
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

      const alerts = db.getTable('alerts');
      const devices = db.getTable('devices');
      const events = db.getTable('ai_events');
      const userId = req.user.id;

      const deviceMap = {};
      devices.forEach(d => { deviceMap[d.id] = d; });

      const eventMap = {};
      events.forEach(e => { eventMap[e.id] = e; });

      let filtered = alerts.filter(a => {
        if (a.user_id !== userId) return false;
        if (deviceId && a.device_id !== +deviceId && a.device_id !== deviceId) return false;
        if (alertType && a.alert_type !== alertType) return false;
        if (readStatus !== undefined && a.read_status !== +readStatus) return false;
        if (startTime && a.created_at < startTime) return false;
        if (endTime && a.created_at > endTime) return false;
        return true;
      });

      filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      const total = filtered.length;
      const unreadCount = alerts.filter(a => a.user_id === userId && a.read_status === 0).length;

      const pageNum = +page;
      const pageSizeNum = +pageSize;
      const start = (pageNum - 1) * pageSizeNum;
      const paged = filtered.slice(start, start + pageSizeNum);

      const list = paged.map(a => {
        const device = deviceMap[a.device_id];
        const event = eventMap[a.event_id];
        return {
          ...a,
          device_name: device ? device.name : null,
          snapshot_path: event ? event.snapshot_path : null,
          event_level: event ? event.event_level : null,
          confidence: event ? event.confidence : null
        };
      });

      res.json({
        code: 200,
        data: { list, total, unreadCount, page: pageNum, pageSize: pageSizeNum }
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
        await db.run('UPDATE alerts SET read_status = 1 WHERE user_id = ? AND read_status = 0', req.user.id);
      } else {
        const placeholders = ids.map(() => '?').join(',');
        await db.run(`UPDATE alerts SET read_status = 1 WHERE user_id = ? AND id IN (${placeholders})`, req.user.id, ...ids);
      }

      await db.run(`
        INSERT INTO alert_audit_logs (alert_id, user_id, action, action_detail)
        VALUES (?, ?, 'read', '标记为已读')
      `, ids[0] || 0, req.user.id);

      res.json({ code: 200, message: '操作成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async createAuditLog(req, res) {
    try {
      const { alertId, action, detail } = req.body;
      const { getClientIp } = require('../utils/common');

      await db.run(`
        INSERT INTO alert_audit_logs (alert_id, user_id, action, action_detail, ip)
        VALUES (?, ?, ?, ?, ?)
      `, alertId, req.user.id, action, detail || '', getClientIp(req));

      res.json({ code: 200, message: '记录成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listAuditLogs(req, res) {
    try {
      const {
        alertId, action,
        startDate, endDate,
        startTime, endTime,
        page = 1, pageSize = 50
      } = req.query;

      const logs = db.getTable('alert_audit_logs');
      const alerts = db.getTable('alerts');
      const users = db.getTable('users');
      const userId = req.user.id;

      const userAlertIds = new Set();
      alerts.forEach(a => {
        if (a.user_id === userId) userAlertIds.add(a.id);
      });

      const userMap = {};
      users.forEach(u => { userMap[u.id] = u; });

      const alertMap = {};
      alerts.forEach(a => { alertMap[a.id] = a; });

      const start = startDate || startTime;
      const end = endDate || endTime;

      let filtered = logs.filter(log => {
        if (!userAlertIds.has(log.alert_id)) return false;
        if (alertId && log.alert_id !== +alertId && log.alert_id !== alertId) return false;
        if (action && log.action !== action) return false;
        if (start && log.created_at < start) return false;
        if (end && log.created_at > end) return false;
        return true;
      });

      filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      const total = filtered.length;
      const pageNum = +page;
      const pageSizeNum = +pageSize;
      const startIdx = (pageNum - 1) * pageSizeNum;
      const paged = filtered.slice(startIdx, startIdx + pageSizeNum);

      const list = paged.map(log => {
        const user = userMap[log.user_id];
        const alert = alertMap[log.alert_id];
        return {
          ...log,
          username: user ? user.username : null,
          nickname: user ? user.nickname : null,
          alert_title: alert ? alert.title : null
        };
      });

      res.json({
        code: 200,
        data: { list, total, page: pageNum, pageSize: pageSizeNum }
      });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      const devices = db.getTable('devices');
      const shares = db.getTable('device_shares');
      const events = db.getTable('ai_events');
      const recordings = db.getTable('recordings');

      const allowedDeviceIds = new Set();
      devices.forEach(d => {
        if (d.owner_id === userId) allowedDeviceIds.add(d.id);
      });
      shares.forEach(s => {
        if (s.share_to_user_id === userId && s.status === 1) {
          allowedDeviceIds.add(s.device_id);
        }
      });

      const allowedDevices = devices.filter(d => allowedDeviceIds.has(d.id));
      const deviceCount = allowedDevices.length;
      const onlineCount = allowedDevices.filter(d => d.online_status === 1).length;

      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => {
        if (!allowedDeviceIds.has(e.device_id)) return false;
        return e.created_at && e.created_at.split('T')[0] === today;
      });
      const todayEventCount = todayEvents.length;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentEvents = events.filter(e => {
        if (!allowedDeviceIds.has(e.device_id)) return false;
        return e.created_at >= sevenDaysAgo;
      });

      const eventTypeMap = {};
      recentEvents.forEach(e => {
        if (!eventTypeMap[e.event_type]) eventTypeMap[e.event_type] = 0;
        eventTypeMap[e.event_type]++;
      });
      const eventTypeStats = Object.entries(eventTypeMap).map(([event_type, count]) => ({ event_type, count }));

      const alertLevelStats = { low: 0, normal: 0, high: 0, critical: 0 };
      recentEvents.forEach(e => {
        if (alertLevelStats.hasOwnProperty(e.event_level)) {
          alertLevelStats[e.event_level]++;
        }
      });

      const allowedRecordings = recordings.filter(r => allowedDeviceIds.has(r.device_id));
      const recordingCount = {
        count: allowedRecordings.length,
        total_size: allowedRecordings.reduce((sum, r) => sum + (r.file_size || 0), 0)
      };

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
