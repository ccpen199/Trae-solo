const { db, all } = require('../models/database');

const getLiveList = (req, res) => {
  const { page = 1, limit = 20, category, keyword } = req.query;
  const offset = (page - 1) * limit;

  let rooms = [...db.live_rooms].filter(r => r.status === 1);
  
  if (category) {
    rooms = rooms.filter(r => r.category === category);
  }
  
  if (keyword) {
    rooms = rooms.filter(r => 
      r.title.includes(keyword) || 
      (db.users.find(u => u.id === r.user_id)?.nickname || '').includes(keyword)
    );
  }
  
  rooms = rooms.sort((a, b) => b.viewers - a.viewers).slice(offset, offset + limit);
  
  const roomsWithUser = rooms.map(room => {
    const user = db.users.find(u => u.id === room.user_id);
    return {
      ...room,
      nickname: user?.nickname || '主播',
      avatar: user?.avatar || '',
      vip_level: user?.vip_level || 0
    };
  });

  const banners = [...db.banners].filter(b => b.status === 1).sort((a, b) => a.sort - b.sort);
  const channels = [...db.channels].filter(c => c.status === 1).sort((a, b) => a.sort - b.sort);

  res.json({ success: true, data: { rooms: roomsWithUser, banners, channels } });
};

const getLiveRoom = (req, res) => {
  const { id } = req.params;

  const room = db.live_rooms.find(r => r.id === parseInt(id));
  if (!room) {
    return res.status(404).json({ success: false, message: '直播间不存在' });
  }

  const user = db.users.find(u => u.id === room.user_id);
  const roomWithUser = {
    ...room,
    nickname: user?.nickname || '主播',
    avatar: user?.avatar || '',
    vip_level: user?.vip_level || 0,
    followers: user?.followers || 0
  };

  const comments = db.comments
    .filter(c => c.room_id === parseInt(id))
    .slice(-50)
    .map(comment => {
      const commentUser = db.users.find(u => u.id === comment.user_id);
      return {
        ...comment,
        nickname: commentUser?.nickname || '用户',
        avatar: commentUser?.avatar || '',
        vip_level: commentUser?.vip_level || 0
      };
    });

  const gifts = [...db.gifts].sort((a, b) => a.price - b.price);

  res.json({ success: true, data: { room: roomWithUser, comments, gifts } });
};

const createLiveRoom = (req, res) => {
  const { title, category, location, cover } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ success: false, message: '请输入直播标题' });
  }

  const newRoom = {
    id: db.live_rooms.length + 1,
    user_id: userId,
    title,
    category: category || '',
    location: location || '',
    cover: cover || '',
    viewers: 0,
    likes: 0,
    status: 1
  };
  
  db.live_rooms.push(newRoom);
  res.json({ success: true, data: newRoom });
};

const closeLiveRoom = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const room = db.live_rooms.find(r => r.id === parseInt(id));
  if (!room) {
    return res.status(404).json({ success: false, message: '直播间不存在' });
  }

  if (room.user_id !== userId) {
    return res.status(403).json({ success: false, message: '无权限' });
  }

  room.status = 0;
  room.end_time = Date.now();
  res.json({ success: true, data: { message: '直播已结束' } });
};

const sendComment = (req, res) => {
  const { room_id, content } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ success: false, message: '内容不能为空' });
  }

  const newComment = {
    id: db.comments.length + 1,
    room_id: parseInt(room_id),
    user_id: userId,
    content,
    created_at: Date.now()
  };
  
  db.comments.push(newComment);
  
  const user = db.users.find(u => u.id === userId);
  const commentWithUser = {
    ...newComment,
    nickname: user?.nickname || '用户',
    avatar: user?.avatar || '',
    vip_level: user?.vip_level || 0
  };
  
  res.json({ success: true, data: commentWithUser });
};

const sendGift = (req, res) => {
  const { room_id, gift_id, quantity = 1 } = req.body;
  const senderId = req.user.id;

  const gift = db.gifts.find(g => g.id === parseInt(gift_id));
  if (!gift) {
    return res.status(404).json({ success: false, message: '礼物不存在' });
  }

  if (gift.is_vip && req.user.vip_level < 1) {
    return res.status(403).json({ success: false, message: 'VIP专属礼物' });
  }

  const totalPrice = gift.price * quantity;
  if (req.user.coins < totalPrice) {
    return res.status(400).json({ success: false, message: '余额不足' });
  }

  const room = db.live_rooms.find(r => r.id === parseInt(room_id));
  if (!room) {
    return res.status(404).json({ success: false, message: '直播间不存在' });
  }

  const sender = db.users.find(u => u.id === senderId);
  const receiver = db.users.find(u => u.id === room.user_id);
  
  if (sender) sender.coins -= totalPrice;
  if (receiver) receiver.coins += Math.floor(totalPrice * 0.5);
  room.likes += quantity;

  res.json({ success: true, data: { gift, quantity, remaining: sender ? sender.coins : 0 } });
};

module.exports = { getLiveList, getLiveRoom, createLiveRoom, closeLiveRoom, sendComment, sendGift };
