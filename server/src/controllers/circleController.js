import Circle from '../models/Circle.js';
import { addPoints } from '../services/pointService.js';

export const getCircles = async (req, res) => {
  try {
    const { category, page = 1, pageSize = 12 } = req.query;
    const query = {};
    if (category) query.category = category;
    
    const circles = await Circle.find(query)
      .sort({ memberCount: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    const total = await Circle.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        data: circles.map(c => ({ ...c.toObject(), id: c._id, isJoined: false })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCircleDetail = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return res.status(404).json({ success: false, error: '圈子不存在' });
    }
    
    let isJoined = false;
    if (req.user) {
      isJoined = circle.members.includes(req.user._id);
    }
    
    res.json({
      success: true,
      data: {
        ...circle.toObject(),
        id: circle._id,
        isJoined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const joinCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return res.status(404).json({ success: false, error: '圈子不存在' });
    }
    
    if (circle.members.includes(req.user._id)) {
      return res.json({ success: true, message: '已加入该圈子' });
    }
    
    circle.members.push(req.user._id);
    circle.memberCount = circle.members.length;
    await circle.save();
    
    res.json({ success: true, message: '加入成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const leaveCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return res.status(404).json({ success: false, error: '圈子不存在' });
    }
    
    circle.members = circle.members.filter(m => m.toString() !== req.user._id.toString());
    circle.memberCount = circle.members.length;
    await circle.save();
    
    res.json({ success: true, message: '已退出圈子' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCircle = async (req, res) => {
  try {
    const { name, category, description, avatar, coverImage } = req.body;
    
    const circle = new Circle({
      name,
      category,
      description,
      avatar,
      coverImage,
      adminIds: [req.user._id],
      members: [req.user._id],
      memberCount: 1,
    });
    await circle.save();
    
    await addPoints(req.user._id, 50, '创建圈子', circle._id, 'circle');
    
    res.json({ success: true, data: { ...circle.toObject(), id: circle._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
