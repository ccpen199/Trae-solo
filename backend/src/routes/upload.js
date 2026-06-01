const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

const uploadDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const interviewId = req.params.interviewId;
    const ext = path.extname(file.originalname);
    cb(null, `${interviewId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.mp4', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持音频文件'));
    }
  }
});

function mockTranscribe(audioPath, originalName) {
  const mockTranscripts = [
    {
      speaker: '客户',
      text: '我们现在的系统在处理大量数据的时候，经常会出现卡顿的情况，有时候甚至需要等好几分钟才能出结果。'
    },
    {
      speaker: '客户',
      text: '特别是在月底做报表的时候，用户反映最多的就是导出数据太慢了，有时候会超时。'
    },
    {
      speaker: '访谈者',
      text: '那您觉得主要是哪些功能模块影响比较大呢？'
    },
    {
      speaker: '客户',
      text: '主要是数据分析和报表导出这两块，还有就是批量处理任务的时候，系统响应明显变慢。'
    },
    {
      speaker: '客户',
      text: '另外，我们一线销售人员反映，移动端的体验也不太好，加载慢，有时候还会闪退。'
    },
    {
      speaker: '访谈者',
      text: '好的，那关于新功能方面，您有什么期望吗？'
    },
    {
      speaker: '客户',
      text: '希望能增加一些智能提醒功能，比如待办事项提醒，还有客户跟进的自动提醒。'
    },
    {
      speaker: '客户',
      text: '另外，数据分析这块希望能支持更多维度的自定义报表，现在的固定模板不太够用。'
    }
  ];

  const segments = mockTranscripts.map((item, index) => ({
    id: uuidv4(),
    start_time: index * 15.5,
    end_time: (index + 1) * 15.5,
    text: item.text,
    speaker_name: item.speaker,
    confidence: 0.85 + Math.random() * 0.1
  }));

  const fullText = segments.map(s => `${s.speaker_name}: ${s.text}`).join('\n\n');

  return {
    content: fullText,
    segments,
    duration: segments.length * 15.5,
    confidence: 0.88,
    language: 'zh-CN'
  };
}

router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    const interviewId = req.params.interviewId;
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件' });
    }

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId);
    if (!interview) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '访谈不存在' });
    }

    db.prepare(`
      UPDATE interviews 
      SET recording_path = ?, recording_duration = ?, status = 'transcribing', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(req.file.filename, null, interviewId);

    createAuditLog({
      interviewId,
      actionType: 'upload',
      objectType: 'recording',
      objectId: req.file.filename,
      actor: req.user,
      changeReason: `上传录音文件: ${req.file.originalname}`,
      affectedFields: ['recording_path', 'status'],
      newValues: { recording_path: req.file.filename, status: 'transcribing' }
    });

    setTimeout(async () => {
      const result = mockTranscribe(req.file.path, req.file.originalname);
      
      db.prepare(`DELETE FROM transcript_segments WHERE transcript_id IN (SELECT id FROM transcripts WHERE interview_id = ?)`).run(interviewId);
      db.prepare(`DELETE FROM transcripts WHERE interview_id = ?`).run(interviewId);
      db.prepare(`DELETE FROM speakers WHERE interview_id = ?`).run(interviewId);
      
      const transcriptId = uuidv4();
      db.prepare(`
        INSERT INTO transcripts (id, interview_id, content, language, confidence, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(transcriptId, interviewId, result.content, result.language, result.confidence, req.user.id);

      const speakerMap = {};
      for (const seg of result.segments) {
        if (!speakerMap[seg.speaker_name]) {
          const speakerId = uuidv4();
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
          speakerMap[seg.speaker_name] = speakerId;
          
          db.prepare(`
            INSERT INTO speakers (id, interview_id, name, color)
            VALUES (?, ?, ?, ?)
          `).run(speakerId, interviewId, seg.speaker_name, colors[Object.keys(speakerMap).length % colors.length]);
        }
      }

      const insertSegment = db.prepare(`
        INSERT INTO transcript_segments (id, transcript_id, speaker_id, start_time, end_time, text, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const seg of result.segments) {
        insertSegment.run(
          seg.id, transcriptId, speakerMap[seg.speaker_name], 
          seg.start_time, seg.end_time, seg.text, seg.confidence
        );
      }

      db.prepare(`
        UPDATE interviews 
        SET recording_duration = ?, status = 'transcribed', updated_at = strftime('%s', 'now')
        WHERE id = ?
      `).run(result.duration, interviewId);

      createAuditLog({
        interviewId,
        actionType: 'transcribe',
        objectType: 'transcript',
        objectId: transcriptId,
        actor: req.user,
        changeReason: '音频转写完成',
        affectedFields: ['content', 'segments'],
        newValues: { segment_count: result.segments.length }
      });
    }, 3000);

    res.json({
      success: true,
      message: '文件上传成功，正在转写中...',
      filename: req.file.filename,
      size: req.file.size
    });

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (req, res) => {
  const interviewId = req.params.interviewId;
  const interview = db.prepare('SELECT status, recording_duration FROM interviews WHERE id = ?').get(interviewId);
  
  if (!interview) {
    return res.status(404).json({ error: '访谈不存在' });
  }

  res.json({
    status: interview.status,
    hasRecording: !!interview.recording_duration
  });
});

module.exports = router;
