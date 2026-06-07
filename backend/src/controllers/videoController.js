const path = require('path');
const fs = require('fs');
const { db } = require('../models/database');

function uploadVideo(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: '未上传视频文件' });
  }

  const { title, description, type, videoType } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  if (!['job', 'resume', 'message'].includes(type)) {
    return res.status(400).json({ error: '无效的视频类型' });
  }

  const validVideoTypes = ['environment', 'work_live', 'team_interview', 'intro', 'other'];
  const finalVideoType = videoType && validVideoTypes.includes(videoType) ? videoType : 'intro';

  const filePath = req.file.path;
  const thumbnail = null;

  const insertVideo = db.prepare(`
    INSERT INTO videos (user_id, type, title, description, file_path, thumbnail, status, video_type)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `);

  const result = insertVideo.run(req.user.id, type, title, description || '', filePath, thumbnail, finalVideoType);

  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid);

  res.json({ video });
}

function getVideo(req, res) {
  const videoId = req.params.id;
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);

  if (!video) {
    return res.status(404).json({ error: '视频不存在' });
  }

  if (video.status !== 'approved' && video.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限访问此视频' });
  }

  const absolutePath = path.resolve(video.file_path);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: '视频文件不存在' });
  }

  const stat = fs.statSync(absolutePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(absolutePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(absolutePath).pipe(res);
  }
}

function getUserVideos(req, res) {
  const videos = db.prepare(`
    SELECT * FROM videos 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ videos });
}

function reviewVideo(req, res) {
  const videoId = req.params.id;
  const { status, rejectReason, reviewNote } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }

  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
  if (!video) {
    return res.status(404).json({ error: '视频不存在' });
  }

  const updateVideo = db.prepare(`
    UPDATE videos 
    SET status = ?, reject_reason = ?, review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateVideo.run(status, rejectReason || '', reviewNote || '', req.user.id, videoId);

  db.prepare(`
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, note)
    VALUES (?, ?, 'video', ?, ?)
  `).run(req.user.id, status === 'approved' ? 'video_approve' : 'video_reject', videoId, reviewNote || '');

  const updatedVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
  res.json({ video: updatedVideo });
}

function getPendingVideos(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const videos = db.prepare(`
    SELECT v.*, u.username as uploader_name, u.email as uploader_email
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.status = 'pending'
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), parseInt(offset));

  const { total } = db.prepare('SELECT COUNT(*) as total FROM videos WHERE status = ?').get('pending');

  res.json({ videos, total, page: parseInt(page), limit: parseInt(limit) });
}

module.exports = { uploadVideo, getVideo, getUserVideos, reviewVideo, getPendingVideos };
