const express = require('express');
const db = require('../database');
const { authMiddleware, optionalAuth, verifiedUserOnly } = require('../middleware/auth');

const router = express.Router();

const ensureSampleVideos = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM videos').get();
  if (count.count > 0) return;

  const products = db.prepare('SELECT id FROM products LIMIT 10').all();
  
  const sampleVideos = [
    { title: '番茄炒蛋家常做法', description: '简单美味，十分钟上桌', user_id: 1 },
    { title: '清蒸鲈鱼怎么做', description: '鲜嫩多汁，营养丰富', user_id: 1 },
    { title: '红烧肉家常版', description: '肥而不腻，入口即化', user_id: 1 },
    { title: '蒜蓉粉丝蒸虾', description: '海鲜美味，简单易学', user_id: 1 },
    { title: '糖醋里脊做法', description: '外酥里嫩，酸甜可口', user_id: 1 },
    { title: '宫保鸡丁家常', description: '麻辣鲜香，下饭神器', user_id: 1 },
  ];

  const insertVideo = db.prepare(`
    INSERT INTO videos (user_id, title, description, cover, video_url, likes, views)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVideoProduct = db.prepare(`
    INSERT INTO video_products (video_id, product_id)
    VALUES (?, ?)
  `);

  sampleVideos.forEach((video, index) => {
    const cover = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20food%20video%20cover%20delicious%20meal&id=${index + 100}&image_size=square_hd`;
    const videoUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20video%20demo&id=${index + 200}&image_size=square_hd`;
    
    const result = insertVideo.run(
      video.user_id,
      video.title,
      video.description,
      cover,
      videoUrl,
      Math.floor(Math.random() * 1000) + 100,
      Math.floor(Math.random() * 5000) + 500
    );
    
    const videoId = result.lastInsertRowid;
    if (products[index]) {
      insertVideoProduct.run(videoId, products[index].id);
    }
    if (products[index + 1] && index + 1 < products.length) {
      insertVideoProduct.run(videoId, products[index + 1].id);
    }
  });
};

ensureSampleVideos();

router.get('/list', optionalAuth, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    const firstThree = db.prepare(`
      SELECT v.*, u.nickname as author_name, u.avatar as author_avatar
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.status = 1
      ORDER BY v.created_at DESC
      LIMIT 3
    `).all();
    
    const remainingVideos = db.prepare(`
      SELECT v.*, u.nickname as author_name, u.avatar as author_avatar
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.status = 1
      ORDER BY v.likes DESC, v.created_at DESC
      LIMIT ? OFFSET 0
    `).all(parseInt(page_size) + 10);
    
    const firstThreeIds = new Set(firstThree.map(v => v.id));
    const filteredRemaining = remainingVideos.filter(v => !firstThreeIds.has(v.id));
    
    let videos = [...firstThree];
    const startIndex = Math.max(0, (page - 1) * page_size - 3);
    
    if (page === 1) {
      videos = [...firstThree, ...filteredRemaining.slice(0, Math.max(0, page_size - 3))];
    } else {
      videos = filteredRemaining.slice(startIndex, startIndex + parseInt(page_size));
    }
    
    const videoIds = videos.map(v => v.id);
    let likedIds = new Set();
    let favoriteIds = new Set();
    
    if (req.user && videoIds.length > 0) {
      const placeholders = videoIds.map(() => '?').join(',');
      const liked = db.prepare(`SELECT video_id FROM video_likes WHERE user_id = ? AND video_id IN (${placeholders})`).all(req.user.id, ...videoIds);
      const favorited = db.prepare(`SELECT video_id FROM video_favorites WHERE user_id = ? AND video_id IN (${placeholders})`).all(req.user.id, ...videoIds);
      
      likedIds = new Set(liked.map(l => l.video_id));
      favoriteIds = new Set(favorited.map(f => f.video_id));
    }
    
    const processedVideos = videos.map(v => ({
      ...v,
      is_liked: likedIds.has(v.id),
      is_favorited: favoriteIds.has(v.id)
    }));
    
    const totalCount = db.prepare('SELECT COUNT(*) as total FROM videos WHERE status = 1').get();
    
    res.json({
      success: true,
      data: {
        list: processedVideos,
        total: totalCount.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ success: false, message: '获取视频列表失败' });
  }
});

router.get('/detail/:videoId', optionalAuth, (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = db.prepare(`
      SELECT v.*, u.nickname as author_name, u.avatar as author_avatar
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ? AND v.status = 1
    `).get(videoId);
    
    if (!video) {
      return res.status(404).json({ success: false, message: '视频不存在' });
    }
    
    db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(videoId);
    video.views += 1;
    
    const videoProducts = db.prepare(`
      SELECT vp.*, p.name, p.price, p.member_price, p.image, p.unit
      FROM video_products vp
      JOIN products p ON vp.product_id = p.id
      WHERE vp.video_id = ?
    `).all(videoId);
    
    let isLiked = false;
    let isFavorited = false;
    
    if (req.user) {
      const like = db.prepare('SELECT id FROM video_likes WHERE video_id = ? AND user_id = ?').get(videoId, req.user.id);
      const favorite = db.prepare('SELECT id FROM video_favorites WHERE video_id = ? AND user_id = ?').get(videoId, req.user.id);
      isLiked = !!like;
      isFavorited = !!favorite;
    }
    
    res.json({
      success: true,
      data: {
        ...video,
        is_liked: isLiked,
        is_favorited: isFavorited,
        products: videoProducts
      }
    });
  } catch (error) {
    console.error('获取视频详情失败:', error);
    res.status(500).json({ success: false, message: '获取视频详情失败' });
  }
});

router.post('/like', authMiddleware, (req, res) => {
  try {
    const { video_id } = req.body;
    
    const video = db.prepare('SELECT id FROM videos WHERE id = ? AND status = 1').get(video_id);
    if (!video) {
      return res.status(404).json({ success: false, message: '视频不存在' });
    }
    
    const existingLike = db.prepare('SELECT id FROM video_likes WHERE video_id = ? AND user_id = ?').get(video_id, req.user.id);
    
    if (existingLike) {
      db.prepare('DELETE FROM video_likes WHERE video_id = ? AND user_id = ?').run(video_id, req.user.id);
      db.prepare('UPDATE videos SET likes = likes - 1 WHERE id = ?').run(video_id);
      res.json({ success: true, message: '已取消点赞', data: { is_liked: false } });
    } else {
      db.prepare('INSERT INTO video_likes (video_id, user_id) VALUES (?, ?)').run(video_id, req.user.id);
      db.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?').run(video_id);
      res.json({ success: true, message: '点赞成功', data: { is_liked: true } });
    }
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

router.post('/favorite', authMiddleware, (req, res) => {
  try {
    const { video_id } = req.body;
    
    const video = db.prepare('SELECT id FROM videos WHERE id = ? AND status = 1').get(video_id);
    if (!video) {
      return res.status(404).json({ success: false, message: '视频不存在' });
    }
    
    const existingFavorite = db.prepare('SELECT id FROM video_favorites WHERE video_id = ? AND user_id = ?').get(video_id, req.user.id);
    
    if (existingFavorite) {
      db.prepare('DELETE FROM video_favorites WHERE video_id = ? AND user_id = ?').run(video_id, req.user.id);
      res.json({ success: true, message: '已取消收藏', data: { is_favorited: false } });
    } else {
      db.prepare('INSERT INTO video_favorites (video_id, user_id) VALUES (?, ?)').run(video_id, req.user.id);
      res.json({ success: true, message: '收藏成功', data: { is_favorited: true } });
    }
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({ success: false, message: '收藏失败' });
  }
});

router.get('/my-videos', authMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    const countResult = db.prepare('SELECT COUNT(*) as total FROM videos WHERE user_id = ? AND status = 1').get(req.user.id);
    
    const videos = db.prepare(`
      SELECT v.*, 
             (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as like_count,
             (SELECT COUNT(*) FROM video_favorites WHERE video_id = v.id) as favorite_count
      FROM videos v
      WHERE v.user_id = ? AND v.status = 1
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(page_size), offset);
    
    res.json({
      success: true,
      data: {
        list: videos,
        total: countResult.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });
  } catch (error) {
    console.error('获取我的视频失败:', error);
    res.status(500).json({ success: false, message: '获取我的视频失败' });
  }
});

router.get('/my-favorites', authMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM video_favorites vf
      JOIN videos v ON vf.video_id = v.id
      WHERE vf.user_id = ? AND v.status = 1
    `).get(req.user.id);
    
    const videos = db.prepare(`
      SELECT v.*, u.nickname as author_name
      FROM video_favorites vf
      JOIN videos v ON vf.video_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE vf.user_id = ? AND v.status = 1
      ORDER BY vf.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(page_size), offset);
    
    res.json({
      success: true,
      data: {
        list: videos,
        total: countResult.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });
  } catch (error) {
    console.error('获取我的收藏失败:', error);
    res.status(500).json({ success: false, message: '获取我的收藏失败' });
  }
});

router.post('/create', verifiedUserOnly, (req, res) => {
  try {
    const { title, description, cover, video_url, product_ids = [] } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: '标题不能为空' });
    }
    
    const result = db.prepare(`
      INSERT INTO videos (user_id, title, description, cover, video_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, title, description, cover || null, video_url || null);
    
    const videoId = result.lastInsertRowid;
    
    if (product_ids && product_ids.length > 0) {
      const insertProduct = db.prepare('INSERT INTO video_products (video_id, product_id) VALUES (?, ?)');
      product_ids.forEach(pid => {
        insertProduct.run(videoId, pid);
      });
    }
    
    res.json({
      success: true,
      message: '视频发布成功',
      data: { video_id: videoId }
    });
  } catch (error) {
    console.error('发布视频失败:', error);
    res.status(500).json({ success: false, message: '发布视频失败' });
  }
});

module.exports = router;
