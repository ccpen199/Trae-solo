const { run, get, all } = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const book = await get('SELECT * FROM books WHERE id = ? AND status = 1', [bookId]);
    if (!book) {
      return error(res, '书籍不存在');
    }

    const existingBorrow = await get(
      'SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = 1',
      [userId, bookId]
    );

    if (existingBorrow) {
      return error(res, '您已借阅过此书');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    await run(
      'INSERT INTO borrow_records (user_id, book_id, due_date, status) VALUES (?, ?, ?, 1)',
      [userId, bookId, dueDate.toISOString()]
    );

    await run('UPDATE books SET borrow_count = borrow_count + 1 WHERE id = ?', [bookId]);

    success(res, null, '借阅成功');
  } catch (err) {
    console.error('借阅错误:', err);
    error(res, '借阅失败');
  }
};

const returnBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const borrow = await get(
      'SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = 1',
      [userId, bookId]
    );

    if (!borrow) {
      return error(res, '未找到借阅记录');
    }

    await run(
      'UPDATE borrow_records SET status = 0, return_date = CURRENT_TIMESTAMP WHERE id = ?',
      [borrow.id]
    );

    success(res, null, '归还成功');
  } catch (err) {
    console.error('归还错误:', err);
    error(res, '归还失败');
  }
};

const getBorrowRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE br.user_id = ?';
    const params = [userId];

    if (status !== undefined) {
      whereClause += ' AND br.status = ?';
      params.push(parseInt(status));
    }

    const countResult = await get(`SELECT COUNT(*) as total FROM borrow_records br ${whereClause}`, params);
    
    const records = await all(
      `SELECT br.*, b.title, b.author, b.cover 
       FROM borrow_records br 
       LEFT JOIN books b ON br.book_id = b.id 
       ${whereClause} 
       ORDER BY br.borrow_date DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    paginate(res, records, countResult.total, page, pageSize);
  } catch (err) {
    console.error('获取借阅记录错误:', err);
    error(res, '获取失败');
  }
};

const checkBorrowStatus = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return success(res, { isBorrowed: false }, '获取成功');
    }

    const borrow = await get(
      'SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = 1',
      [userId, bookId]
    );

    success(res, { isBorrowed: !!borrow }, '获取成功');
  } catch (err) {
    console.error('检查借阅状态错误:', err);
    error(res, '获取失败');
  }
};

module.exports = { borrowBook, returnBook, getBorrowRecords, checkBorrowStatus };
