const db = require('../config/database');
const { generateDeviceSN, generateTemporaryToken, validateIMEI } = require('../utils/common');
const { validateDevicePermission } = require('../middleware/auth');

class DeviceController {
  async createGroup(req, res) {
    try {
      const { name, description, sortOrder = 0 } = req.body;
      if (!name) return res.status(400).json({ code: 400, message: '分组名称不能为空' });

      const result = db.prepare(`
        INSERT INTO device_groups (name, owner_id, description, sort_order)
        VALUES (?, ?, ?, ?)
      `).run(name, req.user.id, description || null, sortOrder);

      const group = db.prepare('SELECT * FROM device_groups WHERE id = ?').get(result.lastInsertRowid);
      res.json({ code: 200, message: '创建成功', data: group });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const { name, description, sortOrder } = req.body;
      const group = db.prepare('SELECT * FROM device_groups WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!group) return res.status(404).json({ code: 404, message: '分组不存在' });

      db.prepare(`
        UPDATE device_groups SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order)
        WHERE id = ?
      `).run(name || null, description || null, sortOrder !== undefined ? sortOrder : null, id);

      res.json({ code: 200, message: '更新成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const group = db.prepare('SELECT * FROM device_groups WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!group) return res.status(404).json({ code: 404, message: '分组不存在' });

      db.prepare('UPDATE devices SET group_id = NULL WHERE group_id = ?').run(id);
      db.prepare('DELETE FROM device_groups WHERE id = ?').run(id);
      res.json({ code: 200, message: '删除成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listGroups(req, res) {
    try {
      const groups = db.prepare(`
        SELECT dg.*, 
        (SELECT COUNT(*) FROM devices WHERE group_id = dg.id AND owner_id = ?) as device_count
        FROM device_groups dg
        WHERE dg.owner_id = ?
        ORDER BY dg.sort_order ASC, dg.created_at DESC
      `).all(req.user.id, req.user.id);

      const ungroupedCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE owner_id = ? AND group_id IS NULL').get(req.user.id).count;

      res.json({
        code: 200,
        data: [
          { id: null, name: '未分组', device_count: ungroupedCount, sort_order: -1 },
          ...groups
        ]
      });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async createDevice(req, res) {
    try {
      const {
        name, model, firmwareVersion, protocol = 'ONVIF', streamUrl, rtspUrl,
        rtmpUrl, videoCodec = 'H.264', audioCodec = 'G.711A', resolution,
        groupId, imei, ipAddress, macAddress, supportPTZ = 0, supportAudio = 1,
        deviceSN
      } = req.body;

      if (!name) return res.status(400).json({ code: 400, message: '设备名称不能为空' });

      let sn = deviceSN || generateDeviceSN();
      const exists = db.prepare('SELECT id FROM devices WHERE device_sn = ?').get(sn);
      if (exists) return res.status(400).json({ code: 400, message: '设备SN已存在' });

      if (imei && !validateIMEI(imei)) {
        return res.status(400).json({ code: 400, message: 'IMEI格式无效' });
      }

      if (groupId) {
        const group = db.prepare('SELECT id FROM device_groups WHERE id = ? AND owner_id = ?').get(groupId, req.user.id);
        if (!group) return res.status(400).json({ code: 400, message: '分组不存在' });
      }

      const result = db.prepare(`
        INSERT INTO devices (
          device_sn, name, model, firmware_version, protocol,
          stream_url, rtsp_url, rtmp_url,
          video_codec, audio_codec, resolution,
          owner_id, group_id, imei,
          ip_address, mac_address,
          support_ptz, support_audio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sn, name, model || null, firmwareVersion || null, protocol,
        streamUrl || null, rtspUrl || null, rtmpUrl || null,
        videoCodec, audioCodec, resolution || null,
        req.user.id, groupId || null, imei || null,
        ipAddress || null, macAddress || null,
        supportPTZ ? 1 : 0, supportAudio ? 1 : 0
      );

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
      res.json({ code: 200, message: '添加成功', data: device });
    } catch (e) {
      console.error('Create device error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const permission = validateDevicePermission(req.user.id, id, 'config');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const {
        name, model, firmwareVersion, protocol, streamUrl, rtspUrl,
        rtmpUrl, videoCodec, audioCodec, resolution,
        groupId, imei, ipAddress, macAddress,
        supportPTZ, supportAudio, status
      } = req.body;

      if (imei && !validateIMEI(imei)) {
        return res.status(400).json({ code: 400, message: 'IMEI格式无效' });
      }

      db.prepare(`
        UPDATE devices SET
          name = COALESCE(?, name),
          model = COALESCE(?, model),
          firmware_version = COALESCE(?, firmware_version),
          protocol = COALESCE(?, protocol),
          stream_url = COALESCE(?, stream_url),
          rtsp_url = COALESCE(?, rtsp_url),
          rtmp_url = COALESCE(?, rtmp_url),
          video_codec = COALESCE(?, video_codec),
          audio_codec = COALESCE(?, audio_codec),
          resolution = COALESCE(?, resolution),
          group_id = ?,
          imei = COALESCE(?, imei),
          ip_address = COALESCE(?, ip_address),
          mac_address = COALESCE(?, mac_address),
          support_ptz = COALESCE(?, support_ptz),
          support_audio = COALESCE(?, support_audio),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name || null, model || null, firmwareVersion || null, protocol || null,
        streamUrl || null, rtspUrl || null, rtmpUrl || null,
        videoCodec || null, audioCodec || null, resolution || null,
        groupId === undefined ? null : groupId,
        imei || null, ipAddress || null, macAddress || null,
        supportPTZ !== undefined ? (supportPTZ ? 1 : 0) : null,
        supportAudio !== undefined ? (supportAudio ? 1 : 0) : null,
        status !== undefined ? status : null,
        id
      );

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      res.json({ code: 200, message: '更新成功', data: device });
    } catch (e) {
      console.error('Update device error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const device = db.prepare('SELECT * FROM devices WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!device) return res.status(404).json({ code: 404, message: '设备不存在' });

      db.prepare('DELETE FROM devices WHERE id = ?').run(id);
      db.prepare('DELETE FROM device_shares WHERE device_id = ?').run(id);
      db.prepare('DELETE FROM ai_events WHERE device_id = ?').run(id);
      db.prepare('DELETE FROM alerts WHERE device_id = ?').run(id);
      db.prepare('DELETE FROM recordings WHERE device_id = ?').run(id);

      res.json({ code: 200, message: '删除成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listDevices(req, res) {
    try {
      const { groupId, status, keyword, page = 1, pageSize = 50 } = req.query;
      const offset = (page - 1) * pageSize;

      const conditions = ['(owner_id = ? OR id IN (SELECT device_id FROM device_shares WHERE share_to_user_id = ? AND status = 1))'];
      const params = [req.user.id, req.user.id];

      if (groupId !== undefined) {
        if (groupId === 'null' || groupId === '') {
          conditions.push('group_id IS NULL');
        } else {
          conditions.push('group_id = ?');
          params.push(groupId);
        }
      }
      if (status !== undefined) {
        conditions.push('status = ?');
        params.push(+status);
      }
      if (keyword) {
        conditions.push('(name LIKE ? OR device_sn LIKE ? OR model LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      const where = 'WHERE ' + conditions.join(' AND ');
      const devices = db.prepare(`
        SELECT d.*, dg.name as group_name,
          CASE WHEN d.owner_id = ? THEN 'owner' ELSE (
            SELECT permission_level FROM device_shares WHERE device_id = d.id AND share_to_user_id = ? AND status = 1 LIMIT 1
          END as my_permission
        FROM devices d
        LEFT JOIN device_groups dg ON d.group_id = dg.id
        ${where}
        ORDER BY d.created_at DESC LIMIT ? OFFSET ?
      `).all(req.user.id, req.user.id, ...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM devices d ${where}`).get(...params).count;

      const onlineCount = db.prepare(`SELECT COUNT(*) as count FROM devices d ${where} AND online_status = 1`).get(...params).count;

      res.json({
        code: 200,
        data: {
          list: devices,
          total,
          onlineCount,
          page: +page,
          pageSize: +pageSize
        }
      });
    } catch (e) {
      console.error('List devices error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const permission = validateDevicePermission(req.user.id, id, 'view');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const device = db.prepare(`
        SELECT d.*, dg.name as group_name
        FROM devices d
        LEFT JOIN device_groups dg ON d.group_id = dg.id
        WHERE d.id = ?
      `).get(id);

      device.my_permission = permission.permission;
      res.json({ code: 200, data: device });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async controlPTZ(req, res) {
    try {
      const { id } = req.params;
      const { command, speed = 1 } = req.body;
      const permission = validateDevicePermission(req.user.id, id, 'config');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      if (!device.support_ptz !== 1) {
        return res.status(400).json({ code: 400, message: '该设备不支持云台控制' });
      }

      const validCommands = ['up', 'down', 'left', 'right', 'zoomIn', 'zoomOut', 'stop', 'preset'];
      if (!validCommands.includes(command)) {
        return res.status(400).json({ code: 400, message: '无效的控制命令' });
      }

      const wss = require('../websocket/streamServer');
      wss.sendToDevice(id, JSON.stringify({
        type: 'ptz',
        command,
        speed
      }));

      res.json({ code: 200, message: '控制命令已发送', data: { command, speed } });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async shareDevice(req, res) {
    try {
      const { id } = req.params;
      const { toUserId, toPhone, permissionLevel = 'view', expireHours, temporary = false } = req.body;

      const device = db.prepare('SELECT * FROM devices WHERE id = ? AND owner_id = ?').get(id, req.user.id);
      if (!device) return res.status(404).json({ code: 404, message: '设备不存在或无权限分享权限' });

      if (!['view', 'talk', 'config'].includes(permissionLevel)) {
        return res.status(400).json({ code: 400, message: '无效的权限等级' });
      }

      let shareToUserId = toUserId;
      if (toPhone && !toUserId) {
        const targetUser = db.prepare('SELECT id FROM users WHERE phone = ? OR username = ?').get(toPhone, toPhone);
        if (targetUser) shareToUserId = targetUser.id;
      }

      let expireAt = null;
      let tempToken = null;
      let tempTokenExpire = null;

      if (expireHours) {
        expireAt = new Date(Date.now() + expireHours * 60 * 60 * 1000).toISOString();
      }

      if (temporary) {
        tempToken = generateTemporaryToken();
        tempTokenExpire = expireAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const result = db.prepare(`
        INSERT INTO device_shares (
          device_id, share_from_user_id, share_to_user_id,
          share_to_phone, permission_level, expire_at,
          temporary_token, temporary_token_expire
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.user.id,
        shareToUserId || null,
        toPhone || null,
        permissionLevel,
        expireAt,
        tempToken,
        tempTokenExpire
      );

      const share = db.prepare('SELECT * FROM device_shares WHERE id = ?').get(result.lastInsertRowid);
      res.json({
        code: 200,
        message: temporary ? '临时分享链接已生成' : '设备已分享',
        data: {
          ...share,
          shareLink: temporary ? `/api/stream/temporary?temp_token=${tempToken}` : null
        }
      });
    } catch (e) {
      console.error('Share error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listShares(req, res) {
    try {
      const { page = 1, pageSize = 50 } = req.query;
      const offset = (page - 1) * pageSize;

      const shares = db.prepare(`
        SELECT ds.*, d.name as device_name, d.device_sn,
          u.username as to_username, u.nickname as to_nickname
        FROM device_shares ds
        JOIN devices d ON ds.device_id = d.id
        LEFT JOIN users u ON ds.share_to_user_id = u.id
        WHERE ds.share_from_user_id = ?
        ORDER BY ds.created_at DESC LIMIT ? OFFSET ?
      `).all(req.user.id, pageSize, offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM device_shares WHERE share_from_user_id = ?').get(req.user.id).count;

      res.json({ code: 200, data: { list: shares, total, page: +page, pageSize: +pageSize } });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async revokeShare(req, res) {
    try {
      const { id } = req.params;
      const share = db.prepare('SELECT * FROM device_shares WHERE id = ? AND share_from_user_id = ?').get(id, req.user.id);
      if (!share) return res.status(404).json({ code: 404, message: '分享记录不存在' });

      db.prepare('UPDATE device_shares SET status = 0 WHERE id = ?').run(id);
      res.json({ code: 200, message: '已撤销分享' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listReceivedShares(req, res) {
    try {
      const shares = db.prepare(`
        SELECT ds.*, d.name as device_name, d.device_sn, d.stream_url, d.rtsp_url,
          u.username as from_username, u.nickname as from_nickname
        FROM device_shares ds
        JOIN devices d ON ds.device_id = d.id
        JOIN users u ON ds.share_from_user_id = u.id
        WHERE ds.share_to_user_id = ? AND ds.status = 1
          AND (ds.expire_at IS NULL OR ds.expire_at > CURRENT_TIMESTAMP
        ORDER BY ds.created_at DESC
      `).all(req.user.id);

      res.json({ code: 200, data: shares });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deviceHeartbeat(req, res) {
    try {
      const { deviceSN, status, ipAddress } = req.body;
      if (!deviceSN) return res.status(400).json({ code: 400, message: '设备SN不能为空' });

      const device = db.prepare('SELECT * FROM devices WHERE device_sn = ?').get(deviceSN);
      if (!device) return res.status(404).json({ code: 404, message: '设备未注册' });

      db.prepare(`
        UPDATE devices SET
          online_status = ?,
          last_heartbeat_at = CURRENT_TIMESTAMP,
          last_online_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE last_online_at END,
          ip_address = COALESCE(?, ip_address)
        WHERE device_sn = ?
      `).run(status ? 1 : 0, status ? 1 : 0, ipAddress || null, deviceSN);

      res.json({ code: 200, message: '心跳已记录', data: { serverTime: Date.now() } });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async checkOfflineDevices(req, res) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const offlineDevices = db.prepare(`
        SELECT d.*, dg.name as group_name
        FROM devices d
        LEFT JOIN device_groups dg ON d.group_id = dg.id
        WHERE d.owner_id = ? AND d.status = 1
          AND (d.last_heartbeat_at IS NULL OR d.last_heartbeat_at < ?)
      `).all(req.user.id, fiveMinutesAgo);

      res.json({ code: 200, data: offlineDevices });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
}

module.exports = new DeviceController();
