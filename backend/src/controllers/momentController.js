const { db } = require('../models/database');

const getMoments = (req, res) => {
  const { page = 1, limit = 20, topic } = req.query;
  const offset = (page - 1) * limit;

  let moments = [...db.moments];
  
  if (topic) {
    moments = moments.filter(m => m.topic === topic);
  }
  
  moments = moments
    .sort((a, b) => b.created_at - a.created_at)
    .slice(offset, offset + limit)
    .map(moment => {
      const user = db.users.find(u => u.id === moment.user_id);
      return {
        ...moment,
        nickname: user?.nickname || '用户',
        avatar: user?.avatar || '',
        vip_level: user?.vip_level || 0
      };
    });

  res.json({ success: true, data: moments });
};

const createMoment = (req, res) => {
  const { content, media_type, media_url, location, topic } = req.body;
  const userId = req.user.id;

  if (!content && !media_url) {
    return res.status(400).json({ success: false, message: '内容不能为空' });
  }

  const newMoment = {
    id: db.moments.length + 1,
    user_id: userId,
    content: content || '',
    media_type: media_type || 'text',
    media_url: media_url || '',
    location: location || '',
    topic: topic || '',
    likes: 0,
    comments: 0,
    shares: 0,
    created_at: Date.now()
  };

  db.moments.push(newMoment);

  const user = db.users.find(u => u.id === userId);
  const momentWithUser = {
    ...newMoment,
    nickname: user?.nickname || '用户',
    avatar: user?.avatar || '',
    vip_level: user?.vip_level || 0
  };

  res.json({ success: true, data: momentWithUser });
};

const likeMoment = (req, res) => {
  const { moment_id } = req.body;
  const userId = req.user.id;

  const moment = db.moments.find(m => m.id === moment_id);
  if (moment) {
    moment.likes++;
  }
  
  res.json({ success: true, data: { liked: true } });
};

const unlikeMoment = (req, res) => {
  const { moment_id } = req.body;
  const userId = req.user.id;

  const moment = db.moments.find(m => m.id === moment_id);
  if (moment && moment.likes > 0) {
    moment.likes--;
  }
  
  res.json({ success: true, data: { liked: false } });
};

const addComment = (req, res) => {
  const { moment_id, content } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ success: false, message: '内容不能为空' });
  }

  const moment = db.moments.find(m => m.id === moment_id);
  if (moment) {
    moment.comments++;
  }

  res.json({ success: true, data: { message: '评论成功' } });
};

const getMomentComments = (req, res) => {
  const { moment_id } = req.params;
  res.json({ success: true, data: [] });
};

module.exports = { getMoments, createMoment, likeMoment, unlikeMoment, addComment, getMomentComments };
