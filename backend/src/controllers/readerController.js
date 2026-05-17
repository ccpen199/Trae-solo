const { run, get, all } = require('../utils/db');
const { success, error } = require('../utils/response');

const saveReadingProgress = async (req, res) => {
  try {
    const { bookId, chapterId, progress } = req.body;
    const userId = req.user.id;

    const existing = await get(
      'SELECT id FROM reading_progress WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing) {
      await run(
        'UPDATE reading_progress SET chapter_id = ?, progress = ?, last_read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND book_id = ?',
        [chapterId, progress, userId, bookId]
      );
    } else {
      await run(
        'INSERT INTO reading_progress (user_id, book_id, chapter_id, progress) VALUES (?, ?, ?, ?)',
        [userId, bookId, chapterId, progress]
      );
    }

    success(res, null, '保存成功');
  } catch (err) {
    console.error('保存阅读进度错误:', err);
    error(res, '保存失败');
  }
};

const getReadingProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const progress = await get(
      'SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    success(res, { progress }, '获取成功');
  } catch (err) {
    console.error('获取阅读进度错误:', err);
    error(res, '获取失败');
  }
};

const addBookmark = async (req, res) => {
  try {
    const { bookId, chapterId, progress, note } = req.body;
    const userId = req.user.id;

    const result = await run(
      'INSERT INTO bookmarks (user_id, book_id, chapter_id, progress, note) VALUES (?, ?, ?, ?, ?)',
      [userId, bookId, chapterId, progress || 0, note || '']
    );

    success(res, { id: result.lastID }, '添加成功');
  } catch (err) {
    console.error('添加书签错误:', err);
    error(res, '添加失败');
  }
};

const getBookmarks = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const bookmarks = await all(
      `SELECT bm.*, c.title as chapter_title 
       FROM bookmarks bm
       LEFT JOIN chapters c ON bm.chapter_id = c.id
       WHERE bm.user_id = ? AND bm.book_id = ?
       ORDER BY bm.created_at DESC`,
      [userId, bookId]
    );

    success(res, { bookmarks }, '获取成功');
  } catch (err) {
    console.error('获取书签错误:', err);
    error(res, '获取失败');
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await run('DELETE FROM bookmarks WHERE id = ? AND user_id = ?', [id, userId]);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除书签错误:', err);
    error(res, '删除失败');
  }
};

const addNote = async (req, res) => {
  try {
    const { bookId, chapterId, content, highlight_text, progress } = req.body;
    const userId = req.user.id;

    const result = await run(
      'INSERT INTO notes (user_id, book_id, chapter_id, content, highlight_text, progress) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, bookId, chapterId, content, highlight_text || '', progress || 0]
    );

    success(res, { id: result.lastID }, '添加成功');
  } catch (err) {
    console.error('添加笔记错误:', err);
    error(res, '添加失败');
  }
};

const getNotes = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const notes = await all(
      `SELECT n.*, c.title as chapter_title 
       FROM notes n
       LEFT JOIN chapters c ON n.chapter_id = c.id
       WHERE n.user_id = ? AND n.book_id = ?
       ORDER BY n.created_at DESC`,
      [userId, bookId]
    );

    success(res, { notes }, '获取成功');
  } catch (err) {
    console.error('获取笔记错误:', err);
    error(res, '获取失败');
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    await run(
      'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [content, id, userId]
    );

    success(res, null, '更新成功');
  } catch (err) {
    console.error('更新笔记错误:', err);
    error(res, '更新失败');
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除笔记错误:', err);
    error(res, '删除失败');
  }
};

module.exports = {
  saveReadingProgress,
  getReadingProgress,
  addBookmark,
  getBookmarks,
  deleteBookmark,
  addNote,
  getNotes,
  updateNote,
  deleteNote
};
