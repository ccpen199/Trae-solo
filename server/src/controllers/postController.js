import Post from '../models/Post.js';
import User from '../models/User.js';
import { addPoints } from '../services/pointService.js';

const analyzeSentiment = (content) => {
  const positiveWords = ['好', '棒', '赞', '喜欢', '感谢', '满意', '优秀', '美好', '开心', '支持'];
  const negativeWords = ['差', '糟', '坏', '不满', '投诉', '问题', '麻烦', '恶劣', '危险', '脏'];
  
  let positive = 0;
  let negative = 0;
  
  positiveWords.forEach(word => {
    if (content.includes(word)) positive++;
  });
  negativeWords.forEach(word => {
    if (content.includes(word)) negative++;
  });
  
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
};

export const createPost = async (req, res) => {
  try {
    const { title, content, category, location, media } = req.body;
    const sentiment = analyzeSentiment(content + title);
    
    const post = new Post({
      userId: req.user._id,
      title,
      content,
      category,
      location,
      media: media || [],
      sentiment,
    });
    await post.save();
    
    await addPoints(req.user._id, 10, '发布爆料', post._id, 'post');
    
    res.json({ success: true, data: post, message: '爆料发布成功，等待审核' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getApprovedPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, district } = req.query;
    const query = { status: 'approved' };
    
    if (category) query.category = category;
    if (district) query['location.district'] = district;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .populate('userId', 'nickname avatar');
    
    const total = await Post.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        data: posts.map(p => ({
          ...p.toObject(),
          id: p._id,
          user: {
            id: p.userId._id,
            nickname: p.userId.nickname,
            avatar: p.userId.avatar,
          },
        })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPostDetail = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'nickname avatar');
    
    if (!post) {
      return res.status(404).json({ success: false, error: '帖子不存在' });
    }
    
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    res.json({
      success: true,
      data: {
        ...post.toObject(),
        id: post._id,
        user: {
          id: post.userId._id,
          nickname: post.userId.nickname,
          avatar: post.userId.avatar,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const posts = await Post.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    const total = await Post.countDocuments({ userId: req.user._id });
    
    res.json({
      success: true,
      data: {
        data: posts.map(p => ({ ...p.toObject(), id: p._id })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
