const { Book, User, Comment, Activity, UserFavorite, ChannelBook, LibraryBook } = require('../models');
const { Op } = require('sequelize');

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const getBooks = async (req, res) => {
  try {
    const { category, isFeatured, isHot, isNew, keyword, author, sort, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'active' };
    if (category) where.category = category;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (isHot !== undefined) where.isHot = isHot === 'true';
    if (isNew !== undefined) where.isNew = isNew === 'true';
    if (author) where.author = { [Op.iLike]: `%${author}%` };
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { subtitle: { [Op.iLike]: `%${keyword}%` } },
        { author: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { tags: { [Op.contains]: [keyword] } }
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'rating') order = [['rating', 'DESC']];
    if (sort === 'popular') order = [['readCount', 'DESC']];
    if (sort === 'new') order = [['publishDate', 'DESC']];
    if (sort === 'reviews') order = [['reviewCount', 'DESC']];

    const { count, rows } = await Book.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        books: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: '获取书籍列表失败'
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!book || book.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const isFavorited = req.user ? await UserFavorite.findOne({
      where: { userId: req.user.id, targetType: 'book', targetId: book.id }
    }) : false;

    await book.increment('readCount');

    res.json({
      success: true,
      data: {
        book: {
          ...book.toJSON(),
          isFavorited: !!isFavorited
        }
      }
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: '获取书籍详情失败'
    });
  }
};

const getBookBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const book = await Book.findOne({
      where: { slug, status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const isFavorited = req.user ? await UserFavorite.findOne({
      where: { userId: req.user.id, targetType: 'book', targetId: book.id }
    }) : false;

    await book.increment('readCount');

    res.json({
      success: true,
      data: {
        book: {
          ...book.toJSON(),
          isFavorited: !!isFavorited
        }
      }
    });
  } catch (error) {
    console.error('Get book by slug error:', error);
    res.status(500).json({
      success: false,
      message: '获取书籍详情失败'
    });
  }
};

const createBook = async (req, res) => {
  try {
    const {
      title, subtitle, author, translator, publisher,
      publishDate, isbn, pages, price, binding,
      coverImage, description, authorInfo, directory,
      tags, category
    } = req.body;

    let slug = slugify(title);
    let existing = await Book.findOne({ where: { slug } });
    let suffix = 1;
    while (existing) {
      slug = `${slugify(title)}-${suffix}`;
      existing = await Book.findOne({ where: { slug } });
      suffix++;
    }

    const book = await Book.create({
      title, slug, subtitle, author, translator, publisher,
      publishDate, isbn, pages, price, binding,
      coverImage, description, authorInfo, directory,
      tags: tags || [],
      category,
      source: 'user',
      creatorId: req.user.id
    });

    if (req.user) {
      await Activity.create({
        userId: req.user.id,
        action: 'create',
        targetType: 'book',
        targetId: book.id,
        content: `添加了书籍《${title}》`
      });
    }

    res.status(201).json({
      success: true,
      data: { book },
      message: '书籍创建成功'
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: '创建书籍失败'
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    if (req.user.role !== 'admin' && book.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改该书籍'
      });
    }

    if (updateData.title && updateData.title !== book.title) {
      let slug = slugify(updateData.title);
      let existing = await Book.findOne({ where: { slug, id: { [Op.ne]: id } } });
      let suffix = 1;
      while (existing) {
        slug = `${slugify(updateData.title)}-${suffix}`;
        existing = await Book.findOne({ where: { slug, id: { [Op.ne]: id } } });
        suffix++;
      }
      updateData.slug = slug;
    }

    await book.update(updateData);

    res.json({
      success: true,
      data: { book },
      message: '书籍更新成功'
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: '更新书籍失败'
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    if (req.user.role !== 'admin' && book.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除该书籍'
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: '书籍删除成功'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: '删除书籍失败'
    });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book || book.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const existing = await UserFavorite.findOne({
      where: { userId: req.user.id, targetType: 'book', targetId: id }
    });

    if (existing) {
      await existing.destroy();
      await book.decrement('collectCount');
      res.json({
        success: true,
        data: { isFavorited: false },
        message: '取消收藏成功'
      });
    } else {
      await UserFavorite.create({
        userId: req.user.id,
        targetType: 'book',
        targetId: id
      });
      await book.increment('collectCount');

      await Activity.create({
        userId: req.user.id,
        action: 'favorite',
        targetType: 'book',
        targetId: book.id,
        content: `收藏了《${book.title}》`
      });

      res.json({
        success: true,
        data: { isFavorited: true },
        message: '收藏成功'
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

const getBookChannels = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const channelBooks = await ChannelBook.findAll({
      where: { bookId: id },
      include: [{
        model: require('../models/Channel').default || require('../models/Channel'),
        where: { status: 'active' }
      }]
    });

    const channels = channelBooks.map(cb => cb.Channel);

    res.json({
      success: true,
      data: { channels }
    });
  } catch (error) {
    console.error('Get book channels error:', error);
    res.status(500).json({
      success: false,
      message: '获取书籍频道失败'
    });
  }
};

const getBookLibraries = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const libraryBooks = await LibraryBook.findAll({
      where: { bookId: id },
      include: [{
        model: require('../models/Library').default || require('../models/Library'),
        where: { status: 'active' }
      }]
    });

    const libraries = libraryBooks.map(lb => lb.Library);

    res.json({
      success: true,
      data: { libraries }
    });
  } catch (error) {
    console.error('Get book libraries error:', error);
    res.status(500).json({
      success: false,
      message: '获取书籍馆藏信息失败'
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  getBookBySlug,
  createBook,
  updateBook,
  deleteBook,
  toggleFavorite,
  getBookChannels,
  getBookLibraries
};
