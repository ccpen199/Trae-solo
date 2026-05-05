const { Book, Channel, Comment, Activity, User, Library } = require('../models');
const { Op } = require('sequelize');

const getSquareData = async (req, res) => {
  try {
    const hotBooks = await Book.findAll({
      where: { status: 'active', isHot: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['readCount', 'DESC'], ['rating', 'DESC']],
      limit: 10
    });

    const featuredBooks = await Book.findAll({
      where: { status: 'active', isFeatured: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const newBooks = await Book.findAll({
      where: { status: 'active', isNew: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['publishDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 10
    });

    const topRatedBooks = await Book.findAll({
      where: { status: 'active', ratingCount: { [Op.gt]: 0 } },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['rating', 'DESC'], ['ratingCount', 'DESC']],
      limit: 10
    });

    const hotChannels = await Channel.findAll({
      where: { status: 'active', isHot: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['followerCount', 'DESC']],
      limit: 8
    });

    const featuredChannels = await Channel.findAll({
      where: { status: 'active', isFeatured: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      limit: 8
    });

    const recentComments = await Comment.findAll({
      where: { status: 'active', parentId: null },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const featuredComments = await Comment.findAll({
      where: { status: 'active', isFeatured: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['likeCount', 'DESC'], ['createdAt', 'DESC']],
      limit: 10
    });

    const activities = await Activity.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    const hotLibraries = await Library.findAll({
      where: { status: 'active', isHot: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['followerCount', 'DESC']],
      limit: 8
    });

    const featuredLibraries = await Library.findAll({
      where: { status: 'active', isFeatured: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [['bookCount', 'DESC']],
      limit: 8
    });

    const categories = await Book.findAll({
      where: { status: 'active', category: { [Op.not]: null } },
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);

    res.json({
      success: true,
      data: {
        books: {
          hot: hotBooks,
          featured: featuredBooks,
          new: newBooks,
          topRated: topRatedBooks
        },
        channels: {
          hot: hotChannels,
          featured: featuredChannels
        },
        comments: {
          recent: recentComments,
          featured: featuredComments
        },
        activities,
        libraries: {
          hot: hotLibraries,
          featured: featuredLibraries
        },
        categories: categoryList
      }
    });
  } catch (error) {
    console.error('Get square data error:', error);
    res.status(500).json({
      success: false,
      message: '获取读书广场数据失败'
    });
  }
};

const search = async (req, res) => {
  try {
    const { keyword, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }

    const searchWhere = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { author: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { tags: { [Op.contains]: [keyword] } }
      ],
      status: 'active'
    };

    const channelSearchWhere = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { tags: { [Op.contains]: [keyword] } }
      ],
      status: 'active'
    };

    const librarySearchWhere = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { city: { [Op.iLike]: `%${keyword}%` } },
        { tags: { [Op.contains]: [keyword] } }
      ],
      status: 'active'
    };

    const commentSearchWhere = {
      content: { [Op.iLike]: `%${keyword}%` },
      status: 'active'
    };

    let results = {
      books: [],
      channels: [],
      libraries: [],
      comments: []
    };

    if (!type || type === 'book' || type === 'all') {
      const { count, rows } = await Book.findAndCountAll({
        where: searchWhere,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nickname', 'avatar']
        }],
        order: [['readCount', 'DESC'], ['rating', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      results.books = rows;
      results.booksCount = count;
    }

    if (!type || type === 'channel' || type === 'all') {
      const { count, rows } = await Channel.findAndCountAll({
        where: channelSearchWhere,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nickname', 'avatar']
        }],
        order: [['followerCount', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      results.channels = rows;
      results.channelsCount = count;
    }

    if (!type || type === 'library' || type === 'all') {
      const { count, rows } = await Library.findAndCountAll({
        where: librarySearchWhere,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'nickname', 'avatar']
        }],
        order: [['followerCount', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      results.libraries = rows;
      results.librariesCount = count;
    }

    if (!type || type === 'comment' || type === 'all') {
      const { count, rows } = await Comment.findAndCountAll({
        where: commentSearchWhere,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }
        ],
        order: [['likeCount', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      results.comments = rows;
      results.commentsCount = count;
    }

    res.json({
      success: true,
      data: {
        ...results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
};

const getTrendingTopics = async (req, res) => {
  try {
    const trendingTopics = [
      { id: 'topic-1', name: '#经典文学#', count: 1256, hot: true },
      { id: 'topic-2', name: '#科幻小说#', count: 987, hot: true },
      { id: 'topic-3', name: '#历史书籍#', count: 765, hot: true },
      { id: 'topic-4', name: '#读书心得#', count: 654, hot: false },
      { id: 'topic-5', name: '#书评分享#', count: 543, hot: false },
      { id: 'topic-6', name: '#新书推荐#', count: 432, hot: true },
      { id: 'topic-7', name: '#书单整理#', count: 321, hot: false },
      { id: 'topic-8', name: '#阅读打卡#', count: 210, hot: false }
    ];

    res.json({
      success: true,
      data: {
        topics: trendingTopics
      }
    });
  } catch (error) {
    console.error('Get trending topics error:', error);
    res.status(500).json({
      success: false,
      message: '获取热门话题失败'
    });
  }
};

module.exports = {
  getSquareData,
  search,
  getTrendingTopics
};
