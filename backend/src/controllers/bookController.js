const { run, get, all } = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

const getBooks = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, keyword, sort = 'borrow_count' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE status = 1';
    const params = [];

    if (category) {
      whereClause += ' AND category_id = ?';
      params.push(category);
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    let orderBy = 'ORDER BY borrow_count DESC';
    if (sort === 'newest') {
      orderBy = 'ORDER BY created_at DESC';
    } else if (sort === 'name') {
      orderBy = 'ORDER BY title ASC';
    }

    const countResult = await get(`SELECT COUNT(*) as total FROM books ${whereClause}`, params);
    const books = await all(
      `SELECT id, title, author, cover, description, category_id, is_free, borrow_count FROM books ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, books, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取书籍列表错误:', err);
    error(res, '获取失败');
  }
};

const getBookDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await get('SELECT * FROM books WHERE id = ? AND status = 1', [id]);

    if (!book) {
      return error(res, '书籍不存在', 404);
    }

    let chapters = await all('SELECT id, title, chapter_order, word_count FROM chapters WHERE book_id = ? ORDER BY chapter_order ASC', [id]);

    if (chapters.length === 0) {
      chapters = generateSampleChapters(id, book.title);
    }

    success(res, { ...book, chapters }, '获取成功');
  } catch (err) {
    console.error('获取书籍详情错误:', err);
    error(res, '获取失败');
  }
};

function generateSampleChapters(bookId, bookTitle) {
  const chapters = [];
  const chapterTitles = ['第一章 开篇', '第二章 发展', '第三章 高潮', '第四章 结局'];
  
  chapterTitles.forEach((title, index) => {
    chapters.push({
      id: bookId * 100 + index,
      book_id: bookId,
      title: title,
      chapter_order: index + 1,
      word_count: Math.floor(Math.random() * 5000) + 2000
    });
  });
  
  return chapters;
}

const getChapterContent = async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    let chapter = await get('SELECT * FROM chapters WHERE id = ? AND book_id = ?', [chapterId, bookId]);

    if (!chapter) {
      chapter = {
        id: chapterId,
        book_id: bookId,
        title: '示例章节',
        chapter_order: 1,
        content: generateSampleContent(),
        word_count: 3000
      };
    }

    if (!chapter.content) {
      chapter.content = generateSampleContent();
    }

    success(res, chapter, '获取成功');
  } catch (err) {
    console.error('获取章节内容错误:', err);
    error(res, '获取失败');
  }
};

function generateSampleContent() {
  return `
    <p>这是一段示例文本内容。在实际应用中，这里会显示真实的书籍内容。</p>
    <p>春去秋来，岁月如梭。时光荏苒，白驹过隙。</p>
    <p>青山不改，绿水长流。后会有期，江湖再见。</p>
    <p>那是一个阳光明媚的早晨，微风轻轻拂过窗台，带来了远方的花香。窗外的梧桐树叶沙沙作响，仿佛在诉说着古老的故事。</p>
    <p>主人公站在窗前，望着远方连绵起伏的山峦，心中涌起了无限的感慨。这么多年过去了，他依然记得当初那个年少轻狂的自己，怀揣着梦想踏上了未知的旅程。</p>
    <p>一路走来，有欢笑，有泪水，有成功的喜悦，也有失败的痛苦。但他从未后悔过自己的选择，因为这就是人生，充满了未知与挑战。</p>
    <p>夕阳西下，余晖洒落在大地上，给一切都镀上了一层金色的光晕。主人公深吸一口气，转身走向了新的生活。</p>
    <p>夜幕降临，繁星点点。月光如水，倾泻在静谧的大地上。远处传来几声犬吠，打破了这夜的宁静，却也增添了几分生活的气息。</p>
    <p>新的一天即将开始，新的故事正在等待着被书写。</p>
  `;
}

const getCategories = async (req, res) => {
  try {
    const categories = await all('SELECT id, name, parent_id FROM categories ORDER BY sort_order ASC');
    success(res, { categories }, '获取成功');
  } catch (err) {
    console.error('获取分类错误:', err);
    error(res, '获取失败');
  }
};

const getRecommendBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await all(
      'SELECT id, title, author, cover, description, category_id, is_free, borrow_count FROM books WHERE status = 1 ORDER BY borrow_count DESC LIMIT ?',
      [parseInt(limit)]
    );
    success(res, { books }, '获取成功');
  } catch (err) {
    console.error('获取推荐书籍错误:', err);
    error(res, '获取失败');
  }
};

const getTopics = async (req, res) => {
  try {
    const topics = await all('SELECT * FROM topics ORDER BY sort_order ASC');
    success(res, { topics }, '获取成功');
  } catch (err) {
    console.error('获取专题错误:', err);
    error(res, '获取失败');
  }
};

const getAdvertisements = async (req, res) => {
  try {
    const ads = await all('SELECT * FROM advertisements WHERE status = 1 ORDER BY sort_order ASC');
    success(res, { advertisements: ads }, '获取成功');
  } catch (err) {
    console.error('获取广告错误:', err);
    error(res, '获取失败');
  }
};

const saveSearchHistory = async (req, res) => {
  try {
    const { keyword } = req.body;
    const userId = req.user?.id;

    if (keyword && userId) {
      await run('INSERT INTO search_history (user_id, keyword) VALUES (?, ?)', [userId, keyword]);
    }

    success(res, null, '保存成功');
  } catch (err) {
    console.error('保存搜索历史错误:', err);
    error(res, '保存失败');
  }
};

const getSearchHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return success(res, { history: [] }, '获取成功');
    }

    const history = await all(
      'SELECT DISTINCT keyword FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );

    success(res, { history: history.map(h => h.keyword) }, '获取成功');
  } catch (err) {
    console.error('获取搜索历史错误:', err);
    error(res, '获取失败');
  }
};

const clearSearchHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await run('DELETE FROM search_history WHERE user_id = ?', [userId]);
    }
    success(res, null, '清空成功');
  } catch (err) {
    console.error('清空搜索历史错误:', err);
    error(res, '清空失败');
  }
};

module.exports = {
  getBooks,
  getBookDetail,
  getChapterContent,
  getCategories,
  getRecommendBooks,
  getTopics,
  getAdvertisements,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory
};
