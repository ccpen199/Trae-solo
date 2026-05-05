const { Channel, ChannelFollow, ChannelBook, Book, User } = require('../models');
const { Op } = require('sequelize');

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const getChannels = async (req, res) => {
  try {
    const { type, isFeatured, isHot, keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'active' };
    if (type) where.type = type;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (isHot !== undefined) where.isHot = isHot === 'true';
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Channel.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [
        ['sortOrder', 'ASC'],
        ['isFeatured', 'DESC'],
        ['isHot', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        channels: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: '获取频道列表失败'
    });
  }
};

const getChannelById = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!channel || channel.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    const isFollowed = req.user ? await ChannelFollow.findOne({
      where: { userId: req.user.id, channelId: channel.id }
    }) : false;

    res.json({
      success: true,
      data: {
        channel: {
          ...channel.toJSON(),
          isFollowed: !!isFollowed
        }
      }
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: '获取频道详情失败'
    });
  }
};

const getChannelBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const channel = await Channel.findOne({
      where: { slug, status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    const isFollowed = req.user ? await ChannelFollow.findOne({
      where: { userId: req.user.id, channelId: channel.id }
    }) : false;

    res.json({
      success: true,
      data: {
        channel: {
          ...channel.toJSON(),
          isFollowed: !!isFollowed
        }
      }
    });
  } catch (error) {
    console.error('Get channel by slug error:', error);
    res.status(500).json({
      success: false,
      message: '获取频道详情失败'
    });
  }
};

const createChannel = async (req, res) => {
  try {
    const { name, description, coverImage, icon, type, tags } = req.body;

    let slug = slugify(name);
    let existing = await Channel.findOne({ where: { slug } });
    let suffix = 1;
    while (existing) {
      slug = `${slugify(name)}-${suffix}`;
      existing = await Channel.findOne({ where: { slug } });
      suffix++;
    }

    const channel = await Channel.create({
      name,
      slug,
      description,
      coverImage,
      icon,
      type: type || 'original',
      tags: tags || [],
      creatorId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { channel },
      message: '频道创建成功'
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: '创建频道失败'
    });
  }
};

const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, coverImage, icon, type, tags, sortOrder, isFeatured, isHot } = req.body;

    const channel = await Channel.findByPk(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    if (req.user.role !== 'admin' && channel.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改该频道'
      });
    }

    let updateData = {
      description,
      coverImage,
      icon,
      type,
      tags,
      sortOrder,
      isFeatured,
      isHot
    };

    if (name && name !== channel.name) {
      let slug = slugify(name);
      let existing = await Channel.findOne({ where: { slug, id: { [Op.ne]: id } } });
      let suffix = 1;
      while (existing) {
        slug = `${slugify(name)}-${suffix}`;
        existing = await Channel.findOne({ where: { slug, id: { [Op.ne]: id } } });
        suffix++;
      }
      updateData.name = name;
      updateData.slug = slug;
    }

    await channel.update(updateData);

    res.json({
      success: true,
      data: { channel },
      message: '频道更新成功'
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: '更新频道失败'
    });
  }
};

const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findByPk(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    if (req.user.role !== 'admin' && channel.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除该频道'
      });
    }

    await channel.destroy();

    res.json({
      success: true,
      message: '频道删除成功'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: '删除频道失败'
    });
  }
};

const followChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findByPk(id);
    if (!channel || channel.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    const existing = await ChannelFollow.findOne({
      where: { userId: req.user.id, channelId: id }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已经关注该频道'
      });
    }

    await ChannelFollow.create({
      userId: req.user.id,
      channelId: id
    });

    await channel.increment('followerCount');

    res.json({
      success: true,
      message: '关注成功'
    });
  } catch (error) {
    console.error('Follow channel error:', error);
    res.status(500).json({
      success: false,
      message: '关注失败'
    });
  }
};

const unfollowChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findByPk(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    const existing = await ChannelFollow.findOne({
      where: { userId: req.user.id, channelId: id }
    });

    if (!existing) {
      return res.status(400).json({
        success: false,
        message: '未关注该频道'
      });
    }

    await existing.destroy();
    await channel.decrement('followerCount');

    res.json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    console.error('Unfollow channel error:', error);
    res.status(500).json({
      success: false,
      message: '取消关注失败'
    });
  }
};

const getChannelBooks = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const channel = await Channel.findByPk(id);
    if (!channel || channel.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '频道不存在'
      });
    }

    const { count, rows } = await ChannelBook.findAndCountAll({
      where: { channelId: id },
      include: [{
        model: Book,
        where: { status: 'active' }
      }],
      order: [
        ['isFeatured', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const books = rows.map(cb => cb.Book);

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get channel books error:', error);
    res.status(500).json({
      success: false,
      message: '获取频道书籍失败'
    });
  }
};

const getChannelAggregator = async (req, res) => {
  try {
    const featuredChannels = await Channel.findAll({
      where: { status: 'active', isFeatured: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['sortOrder', 'ASC'], ['followerCount', 'DESC']],
      limit: 10
    });

    const hotChannels = await Channel.findAll({
      where: { status: 'active', isHot: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['followerCount', 'DESC'], ['createdAt', 'DESC']],
      limit: 10
    });

    const originalChannels = await Channel.findAll({
      where: { status: 'active', type: 'original' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      limit: 20
    });

    const allChannels = await Channel.findAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        featured: featuredChannels,
        hot: hotChannels,
        original: originalChannels,
        all: allChannels
      }
    });
  } catch (error) {
    console.error('Get channel aggregator error:', error);
    res.status(500).json({
      success: false,
      message: '获取频道聚合数据失败'
    });
  }
};

module.exports = {
  getChannels,
  getChannelById,
  getChannelBySlug,
  createChannel,
  updateChannel,
  deleteChannel,
  followChannel,
  unfollowChannel,
  getChannelBooks,
  getChannelAggregator
};
