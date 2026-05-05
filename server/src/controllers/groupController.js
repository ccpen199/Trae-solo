const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Group, 
  GroupMember, 
  GroupPost, 
  User,
  Comment,
  ActivityLog 
} = require('../models');

const getGroups = async (req, res) => {
  try {
    const { keyword, category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'active' };
    
    if (category) {
      whereClause.category = category;
    }

    if (keyword) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.iLike]: `%${keyword}%` } },
          { description: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.contains]: [keyword] } }
        ]
      };
    }

    const { count, rows } = await Group.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['memberCount', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        groups: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取小组列表失败' 
    });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: '小组不存在' 
      });
    }

    let userRole = null;
    if (req.user) {
      const membership = await GroupMember.findOne({
        where: { groupId: id, userId: req.user.id }
      });
      if (membership) {
        userRole = membership.role;
      }
    }

    res.json({
      success: true,
      data: {
        group: {
          ...group.toJSON(),
          userRole
        }
      }
    });
  } catch (error) {
    console.error('Get group by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取小组详情失败' 
    });
  }
};

const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { name, description, category, isPublic, needApproval, tags } = req.body;
    const userId = req.user.id;

    const existingGroup = await Group.findOne({ where: { name } });
    if (existingGroup) {
      return res.status(400).json({ 
        success: false, 
        message: '小组名称已存在' 
      });
    }

    const slug = `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')}`;

    const group = await Group.create({
      name,
      slug,
      description,
      category,
      ownerId: userId,
      isPublic: isPublic !== undefined ? isPublic : true,
      needApproval: needApproval || false,
      tags: tags || [],
      status: 'active',
      memberCount: 1
    });

    await GroupMember.create({
      groupId: group.id,
      userId,
      role: 'owner',
      status: 'active'
    });

    await ActivityLog.create({
      userId,
      action: 'create_group',
      targetType: 'group',
      targetId: group.id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: '小组创建成功',
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建小组失败' 
    });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: '小组不存在' 
      });
    }

    if (group.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '小组已关闭或未通过审核' 
      });
    }

    const existingMember = await GroupMember.findOne({
      where: { groupId: id, userId }
    });

    if (existingMember) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经是小组成员' 
      });
    }

    const status = group.needApproval ? 'pending' : 'active';

    await GroupMember.create({
      groupId: id,
      userId,
      role: 'member',
      status
    });

    if (status === 'active') {
      group.memberCount += 1;
      await group.save();
    }

    await ActivityLog.create({
      userId,
      action: status === 'active' ? 'join_group' : 'request_join_group',
      targetType: 'group',
      targetId: id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: status === 'active' ? '已加入小组' : '已提交加入申请',
      data: { status }
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ 
      success: false, 
      message: '加入小组失败' 
    });
  }
};

const getGroupPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await GroupPost.findAndCountAll({
      where: { groupId: id, status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['isTop', 'DESC'],
        ['lastReplyAt', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      success: true,
      data: {
        posts: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get group posts error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取小组帖子失败' 
    });
  }
};

const createGroupPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { title, content, images } = req.body;
    const userId = req.user.id;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: '小组不存在' 
      });
    }

    const membership = await GroupMember.findOne({
      where: { groupId: id, userId, status: 'active' }
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: '您不是小组成员' 
      });
    }

    const post = await GroupPost.create({
      title,
      content,
      images: images || [],
      groupId: id,
      userId,
      status: 'published',
      lastReplyAt: new Date()
    });

    group.postCount += 1;
    await group.save();

    await ActivityLog.create({
      userId,
      action: 'create_group_post',
      targetType: 'group_post',
      targetId: post.id,
      ipAddress: req.ip,
    });

    const fullPost = await GroupPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '帖子发布成功',
      data: { post: fullPost }
    });
  } catch (error) {
    console.error('Create group post error:', error);
    res.status(500).json({ 
      success: false, 
      message: '发布帖子失败' 
    });
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  joinGroup,
  getGroupPosts,
  createGroupPost,
};
