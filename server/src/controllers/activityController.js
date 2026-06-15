import Activity from '../models/Activity.js';
import Circle from '../models/Circle.js';
import { addPoints } from '../services/pointService.js';

export const getActivities = async (req, res) => {
  try {
    const { circleId, status, page = 1, pageSize = 10 } = req.query;
    const query = {};
    if (circleId) query.circleId = circleId;
    if (status) query.status = status;
    
    const activities = await Activity.find(query)
      .sort({ startTime: 1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .populate('circleId', 'name avatar')
      .populate('organizerId', 'nickname avatar');
    
    const total = await Activity.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        data: activities.map(a => ({
          ...a.toObject(),
          id: a._id,
          circle: a.circleId ? { id: a.circleId._id, name: a.circleId.name, avatar: a.circleId.avatar } : null,
          organizer: a.organizerId ? { id: a.organizerId._id, nickname: a.organizerId.nickname, avatar: a.organizerId.avatar } : null,
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

export const getActivityDetail = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('circleId', 'name avatar')
      .populate('organizerId', 'nickname avatar')
      .populate('participants', 'nickname avatar');
    
    if (!activity) {
      return res.status(404).json({ success: false, error: '活动不存在' });
    }
    
    const isParticipant = req.user 
      ? activity.participants.some(p => p._id.toString() === req.user._id.toString())
      : false;
    
    res.json({
      success: true,
      data: {
        ...activity.toObject(),
        id: activity._id,
        circle: activity.circleId ? { id: activity.circleId._id, name: activity.circleId.name, avatar: activity.circleId.avatar } : null,
        organizer: activity.organizerId ? { id: activity.organizerId._id, nickname: activity.organizerId.nickname, avatar: activity.organizerId.avatar } : null,
        participants: activity.participants.map(p => ({ id: p._id, nickname: p.nickname, avatar: p.avatar })),
        isParticipant,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { circleId, title, description, coverImage, location, startTime, endTime, maxParticipants, fee } = req.body;
    
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ success: false, error: '圈子不存在' });
    }
    
    const activity = new Activity({
      circleId,
      title,
      description,
      coverImage,
      location,
      startTime,
      endTime,
      maxParticipants,
      fee,
      organizerId: req.user._id,
      participants: [req.user._id],
      participantCount: 1,
    });
    await activity.save();
    
    await addPoints(req.user._id, 20, '发起活动', activity._id, 'activity');
    
    res.json({ success: true, data: { ...activity.toObject(), id: activity._id }, message: '活动创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const joinActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: '活动不存在' });
    }
    
    if (activity.participantCount >= activity.maxParticipants) {
      return res.status(400).json({ success: false, error: '活动名额已满' });
    }
    
    if (activity.participants.includes(req.user._id)) {
      return res.json({ success: true, message: '已报名该活动' });
    }
    
    activity.participants.push(req.user._id);
    activity.participantCount = activity.participants.length;
    await activity.save();
    
    await addPoints(req.user._id, 5, '参加活动', activity._id, 'activity');
    
    res.json({ success: true, message: '报名成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const leaveActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: '活动不存在' });
    }
    
    activity.participants = activity.participants.filter(p => p.toString() !== req.user._id.toString());
    activity.participantCount = activity.participants.length;
    await activity.save();
    
    res.json({ success: true, message: '已取消报名' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyActivities = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const activities = await Activity.find({ participants: req.user._id })
      .sort({ startTime: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .populate('circleId', 'name');
    
    const total = await Activity.countDocuments({ participants: req.user._id });
    
    res.json({
      success: true,
      data: {
        data: activities.map(a => ({
          ...a.toObject(),
          id: a._id,
          circleName: a.circleId?.name,
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
