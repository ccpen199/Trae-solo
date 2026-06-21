const db = require('../config/database');
const { validateDevicePermission } = require('../middleware/auth');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const { generateUUID, calculateFileSize } = require('../utils/common');

class StreamController {
  async getStreamInfo(req, res) {
    try {
      const { id } = req.params;
      const permission = validateDevicePermission(req.user.id, id, 'view');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      const sessionId = generateUUID();

      const wss = require('../websocket/streamServer');
      wss.registerStreamSession(sessionId, id, req.user.id, permission.permission);

      res.json({
        code: 200,
        data: {
          sessionId,
          wsUrl: `ws://${req.headers.host.replace(':' + config.port, ':' + config.wsPort)}/stream?session=${sessionId}`,
          wsSecureUrl: `wss://${req.headers.host.replace(':' + config.port, ':' + config.wsPort)}/stream?session=${sessionId}`,
          device: {
            id: device.id,
            name: device.name,
            videoCodec: device.video_codec,
            audioCodec: device.audio_codec,
            resolution: device.resolution,
            protocol: device.protocol,
            streamUrl: device.stream_url,
            rtspUrl: device.rtsp_url,
            supportPTZ: device.support_ptz,
            supportAudio: device.support_audio
          }
        }
      });
    } catch (e) {
      console.error('Get stream info error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getTemporaryStream(req, res) {
    try {
      const tempToken = req.headers['x-temp-token'] || req.query.temp_token;
      if (!tempToken) return res.status(400).json({ code: 400, message: '缺少临时令牌' });

      const share = db.prepare(`
        SELECT ds.*, d.*
        FROM device_shares ds 
        JOIN devices d ON ds.device_id = d.id
        WHERE ds.temporary_token = ? AND ds.status = 1
          AND (ds.temporary_token_expire IS NULL OR ds.temporary_token_expire > CURRENT_TIMESTAMP)
      `).get(tempToken);

      if (!share) return res.status(401).json({ code: 401, message: '临时令牌无效或已过期' });

      const sessionId = generateUUID();
      const wss = require('../websocket/streamServer');
      wss.registerStreamSession(sessionId, share.device_id, 'temporary_' + share.id, share.permission_level);

      res.json({
        code: 200,
        data: {
          sessionId,
          wsUrl: `ws://${req.headers.host.replace(':' + config.port, ':' + config.wsPort)}/stream?session=${sessionId}`,
          permission: share.permission_level,
          expireAt: share.temporary_token_expire,
          device: {
            id: share.device_id,
            name: share.device_name,
            videoCodec: share.video_codec,
            audioCodec: share.audio_codec,
            resolution: share.resolution
          }
        }
      });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async startRecording(req, res) {
    try {
      const { id } = req.params;
      const { duration = 300, recordType = 'manual' } = req.body;
      const permission = validateDevicePermission(req.user.id, id, 'config');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
      const recordDir = path.join(config.recordPath, String(req.user.id), String(id));
      if (!fs.existsSync(recordDir)) {
        fs.mkdirSync(recordDir, { recursive: true });
      }

      const startTime = new Date();
      const fileName = `${id}_${startTime.getTime()}.mp4`;
      const filePath = path.join(recordDir, fileName);

      const wss = require('../websocket/streamServer');
      wss.startRecording(id, filePath, duration);

      const result = db.prepare(`
        INSERT INTO recordings (
          device_id, file_path, file_name, start_time,
          record_type, duration
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id, filePath, fileName,
        startTime.toISOString(),
        recordType,
        duration
      );

      res.json({
        code: 200,
        message: '已开始录制',
        data: {
          recordingId: result.lastInsertRowid,
          duration,
          recordType
        }
      });
    } catch (e) {
      console.error('Start recording error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async stopRecording(req, res) {
    try {
      const { recordingId } = req.body;
      const recording = db.prepare('SELECT r.*, d.owner_id FROM recordings r JOIN devices d ON r.device_id = d.id WHERE r.id = ?').get(recordingId);
      if (!recording) return res.status(404).json({ code: 404, message: '录制记录不存在' });
      if (recording.owner_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权限' });

      const wss = require('../websocket/streamServer');
      wss.stopRecording(recording.device_id);

      const endTime = new Date();
      let fileSize = 0;
      try {
        if (fs.existsSync(recording.file_path)) {
          fileSize = fs.statSync(recording.file_path).size;
        }
      } catch (e) {}

      const actualDuration = Math.floor((endTime - new Date(recording.start_time)) / 1000);

      db.prepare(`
        UPDATE recordings SET
          end_time = ?,
          duration = COALESCE(?, duration),
          file_size = ?,
          status = 1
        WHERE id = ?
      `).run(endTime.toISOString(), actualDuration, fileSize, recordingId);

      res.json({
        code: 200,
        message: '录制已停止',
        data: {
          actualDuration,
          fileSize: calculateFileSize(fileSize)
        }
      });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listRecordings(req, res) {
    try {
      const {
        deviceId, startTime, endTime,
        recordType, smartTag,
        page = 1, pageSize = 20
      } = req.query;
      const offset = (page - 1) * pageSize;

      const conditions = ['d.owner_id = ?'];
      const params = [req.user.id];

      if (deviceId) {
        conditions.push('r.device_id = ?');
        params.push(deviceId);
      }
      if (startTime) {
        conditions.push('r.start_time >= ?');
        params.push(startTime);
      }
      if (endTime) {
        conditions.push('r.start_time <= ?');
        params.push(endTime);
      }
      if (recordType) {
        conditions.push('r.record_type = ?');
        params.push(recordType);
      }

      const where = 'WHERE ' + conditions.join(' AND ');
      const recordings = db.prepare(`
        SELECT r.*, d.name as device_name, d.device_sn
        FROM recordings r
        JOIN devices d ON r.device_id = d.id
        ${where}
        ORDER BY r.start_time DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM recordings r JOIN devices d ON r.device_id = d.id ${where}`).get(...params).count;

      res.json({
        code: 200,
        data: {
          list: recordings.map(r => ({
            ...r,
            fileSizeFormatted: calculateFileSize(r.file_size || 0)
          })),
          total,
          page: +page,
          pageSize: +pageSize
        }
      });
    } catch (e) {
      console.error('List recordings error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getRecordingPlayback(req, res) {
    try {
      const { id } = req.params;
      const recording = db.prepare('SELECT r.*, d.owner_id FROM recordings r JOIN devices d ON r.device_id = d.id WHERE r.id = ?').get(id);
      if (!recording) return res.status(404).json({ code: 404, message: '录像不存在' });

      const permission = validateDevicePermission(req.user.id, recording.device_id, 'view');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      if (!fs.existsSync(recording.file_path)) {
        return res.status(404).json({ code: 404, message: '录像文件不存在' });
      }

      const stat = fs.statSync(recording.file_path);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(recording.file_path, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4'
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4'
        };
        res.writeHead(200, head);
        fs.createReadStream(recording.file_path).pipe(res);
      }
    } catch (e) {
      console.error('Playback error:', e);
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteRecording(req, res) {
    try {
      const { id } = req.params;
      const recording = db.prepare('SELECT r.*, d.owner_id FROM recordings r JOIN devices d ON r.device_id = d.id WHERE r.id = ?').get(id);
      if (!recording) return res.status(404).json({ code: 404, message: '录像不存在' });
      if (recording.owner_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权限' });

      try {
        if (fs.existsSync(recording.file_path)) {
          fs.unlinkSync(recording.file_path);
        }
      } catch (e) {
        console.error('Delete file error:', e);
      }

      db.prepare('DELETE FROM recordings WHERE id = ?').run(id);
      res.json({ code: 200, message: '删除成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async sendAudio(req, res) {
    try {
      const { id } = req.params;
      const permission = validateDevicePermission(req.user.id, id, 'talk');
      if (!permission.allowed) return res.status(403).json({ code: 403, message: permission.message });

      const { audioData, format = 'pcm' } = req.body;
      if (!audioData) return res.status(400).json({ code: 400, message: '缺少音频数据' });

      const wss = require('../websocket/streamServer');
      wss.sendAudioToDevice(id, audioData, format);

      res.json({ code: 200, message: '音频已发送' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
}

module.exports = new StreamController();
