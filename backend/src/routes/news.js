const express = require('express');
const router = express.Router();

const mockNews = [
  {
    id: 1,
    title: '2024年新商业趋势：数字化转型加速',
    summary: '随着AI技术的快速发展，企业数字化转型进入加速期...',
    content: '随着人工智能、大数据、云计算等技术的快速发展，企业数字化转型进入了全新的加速期。各行业都在积极探索新的商业模式和运营方式。',
    author: '商业研究院',
    publishTime: '2024-01-15 10:30',
    category: '行业动态',
    views: 12580,
    likes: 328
  },
  {
    id: 2,
    title: '新零售模式下的消费者行为分析',
    summary: '线上线下融合成为新零售的核心特征...',
    content: '新零售模式正在重塑消费者的购物习惯。线上线下融合、个性化推荐、社交购物等新特征不断涌现。',
    author: '消费研究中心',
    publishTime: '2024-01-14 15:20',
    category: '零售观察',
    views: 8920,
    likes: 215
  },
  {
    id: 3,
    title: '人工智能在金融领域的应用前景',
    summary: 'AI技术正在深刻改变金融服务的方式...',
    content: '人工智能技术在风控、客服、投资顾问等金融领域的应用越来越广泛，智能金融成为行业发展的重要方向。',
    author: '金融科技周刊',
    publishTime: '2024-01-13 09:00',
    category: '金融科技',
    views: 15680,
    likes: 456
  }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      list: mockNews,
      total: mockNews.length
    }
  });
});

router.get('/:id', (req, res) => {
  const news = mockNews.find(n => n.id === parseInt(req.params.id));
  if (!news) {
    return res.status(404).json({ success: false, message: '资讯不存在' });
  }
  res.json({ success: true, data: news });
});

router.post('/:id/like', (req, res) => {
  res.json({ success: true, message: '点赞成功' });
});

router.post('/:id/favorite', (req, res) => {
  res.json({ success: true, message: '收藏成功' });
});

router.post('/:id/comment', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: '评论内容不能为空' });
  }
  res.json({ success: true, message: '评论成功', data: { id: Date.now(), content } });
});

module.exports = router;
