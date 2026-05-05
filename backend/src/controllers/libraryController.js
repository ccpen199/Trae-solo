const { Library, LibraryBook, LibraryFollow, Book, User, Activity } = require('../models');
const { Op } = require('sequelize');

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const getLibraries = async (req, res) => {
  try {
    const { type, city, isFeatured, isHot, keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'active' };
    if (type) where.type = type;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (isHot !== undefined) where.isHot = isHot === 'true';
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { city: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Library.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order: [
        ['isFeatured', 'DESC'],
        ['isHot', 'DESC'],
        ['followerCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        libraries: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get libraries error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书馆列表失败'
    });
  }
};

const getLibraryById = async (req, res) => {
  try {
    const { id } = req.params;

    const library = await Library.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!library || library.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const isFollowed = req.user ? await LibraryFollow.findOne({
      where: { userId: req.user.id, libraryId: library.id }
    }) : false;

    res.json({
      success: true,
      data: {
        library: {
          ...library.toJSON(),
          isFollowed: !!isFollowed
        }
      }
    });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书馆详情失败'
    });
  }
};

const getLibraryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const library = await Library.findOne({
      where: { slug, status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const isFollowed = req.user ? await LibraryFollow.findOne({
      where: { userId: req.user.id, libraryId: library.id }
    }) : false;

    res.json({
      success: true,
      data: {
        library: {
          ...library.toJSON(),
          isFollowed: !!isFollowed
        }
      }
    });
  } catch (error) {
    console.error('Get library by slug error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书馆详情失败'
    });
  }
};

const createLibrary = async (req, res) => {
  try {
    const {
      name, type, description, coverImage, images,
      address, city, province, country, latitude, longitude,
      phone, email, website, openingHours, facilities, tags
    } = req.body;

    let slug = slugify(name);
    let existing = await Library.findOne({ where: { slug } });
    let suffix = 1;
    while (existing) {
      slug = `${slugify(name)}-${suffix}`;
      existing = await Library.findOne({ where: { slug } });
      suffix++;
    }

    const library = await Library.create({
      name, slug, type, description, coverImage, images: images || [],
      address, city, province, country, latitude, longitude,
      phone, email, website, openingHours, facilities: facilities || [],
      tags: tags || [],
      creatorId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { library },
      message: '图书馆创建成功'
    });
  } catch (error) {
    console.error('Create library error:', error);
    res.status(500).json({
      success: false,
      message: '创建图书馆失败'
    });
  }
};

const updateLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const library = await Library.findByPk(id);
    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    if (req.user.role !== 'admin' && library.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改该图书馆'
      });
    }

    if (updateData.name && updateData.name !== library.name) {
      let slug = slugify(updateData.name);
      let existing = await Library.findOne({ where: { slug, id: { [Op.ne]: id } } });
      let suffix = 1;
      while (existing) {
        slug = `${slugify(updateData.name)}-${suffix}`;
        existing = await Library.findOne({ where: { slug, id: { [Op.ne]: id } } });
        suffix++;
      }
      updateData.slug = slug;
    }

    await library.update(updateData);

    res.json({
      success: true,
      data: { library },
      message: '图书馆更新成功'
    });
  } catch (error) {
    console.error('Update library error:', error);
    res.status(500).json({
      success: false,
      message: '更新图书馆失败'
    });
  }
};

const deleteLibrary = async (req, res) => {
  try {
    const { id } = req.params;

    const library = await Library.findByPk(id);
    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    if (req.user.role !== 'admin' && library.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除该图书馆'
      });
    }

    await library.destroy();

    res.json({
      success: true,
      message: '图书馆删除成功'
    });
  } catch (error) {
    console.error('Delete library error:', error);
    res.status(500).json({
      success: false,
      message: '删除图书馆失败'
    });
  }
};

const followLibrary = async (req, res) => {
  try {
    const { id } = req.params;

    const library = await Library.findByPk(id);
    if (!library || library.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const existing = await LibraryFollow.findOne({
      where: { userId: req.user.id, libraryId: id }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已经关注该图书馆'
      });
    }

    await LibraryFollow.create({
      userId: req.user.id,
      libraryId: id
    });

    await library.increment('followerCount');

    await Activity.create({
      userId: req.user.id,
      action: 'follow',
      targetType: 'library',
      targetId: library.id,
      content: `关注了图书馆《${library.name}》`
    });

    res.json({
      success: true,
      message: '关注成功'
    });
  } catch (error) {
    console.error('Follow library error:', error);
    res.status(500).json({
      success: false,
      message: '关注失败'
    });
  }
};

const unfollowLibrary = async (req, res) => {
  try {
    const { id } = req.params;

    const library = await Library.findByPk(id);
    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const existing = await LibraryFollow.findOne({
      where: { userId: req.user.id, libraryId: id }
    });

    if (!existing) {
      return res.status(400).json({
        success: false,
        message: '未关注该图书馆'
      });
    }

    await existing.destroy();
    await library.decrement('followerCount');

    res.json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    console.error('Unfollow library error:', error);
    res.status(500).json({
      success: false,
      message: '取消关注失败'
    });
  }
};

const getLibraryBooks = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const library = await Library.findByPk(id);
    if (!library || library.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const bookWhere = { status: 'active' };
    if (keyword) {
      bookWhere[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { author: { [Op.iLike]: `%${keyword}%` } }
      ];
    }
    if (category) bookWhere.category = category;

    const { count, rows } = await LibraryBook.findAndCountAll({
      where: { libraryId: id },
      include: [{
        model: Book,
        where: bookWhere
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const books = rows.map(lb => ({
      ...lb.Book.toJSON(),
      shelfLocation: lb.shelfLocation,
      availableCount: lb.availableCount,
      totalCount: lb.totalCount
    }));

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
    console.error('Get library books error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书馆书籍失败'
    });
  }
};

const addBookToLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId, shelfLocation, availableCount = 1, totalCount = 1 } = req.body;

    const library = await Library.findByPk(id);
    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const existing = await LibraryBook.findOne({
      where: { libraryId: id, bookId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该书籍已在图书馆中'
      });
    }

    await LibraryBook.create({
      libraryId: id,
      bookId,
      shelfLocation,
      availableCount,
      totalCount
    });

    await library.increment('bookCount');

    res.json({
      success: true,
      message: '书籍添加成功'
    });
  } catch (error) {
    console.error('Add book to library error:', error);
    res.status(500).json({
      success: false,
      message: '添加书籍失败'
    });
  }
};

const removeBookFromLibrary = async (req, res) => {
  try {
    const { id, bookId } = req.params;

    const library = await Library.findByPk(id);
    if (!library) {
      return res.status(404).json({
        success: false,
        message: '图书馆不存在'
      });
    }

    const existing = await LibraryBook.findOne({
      where: { libraryId: id, bookId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '该书籍不在图书馆中'
      });
    }

    await existing.destroy();
    await library.decrement('bookCount');

    res.json({
      success: true,
      message: '书籍移除成功'
    });
  } catch (error) {
    console.error('Remove book from library error:', error);
    res.status(500).json({
      success: false,
      message: '移除书籍失败'
    });
  }
};

module.exports = {
  getLibraries,
  getLibraryById,
  getLibraryBySlug,
  createLibrary,
  updateLibrary,
  deleteLibrary,
  followLibrary,
  unfollowLibrary,
  getLibraryBooks,
  addBookToLibrary,
  removeBookFromLibrary
};
