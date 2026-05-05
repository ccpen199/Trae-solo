const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminMiddleware, readerMiddleware } = require('../middleware/auth');

const router = express.Router();

const BORROW_DAYS = 30;
const RENEW_DAYS = 15;
const FINE_PER_DAY = 0.5;

const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const calculateFine = (dueDate, returnDate) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate || getToday());
  const diffDays = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return diffDays * FINE_PER_DAY;
  }
  return 0;
};

router.get('/my-records', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const reader = db.get('SELECT * FROM readers WHERE user_id = ?', [req.user.id]);
    if (!reader) {
      return res.status(404).json({ message: '读者信息不存在' });
    }

    let sql = `SELECT br.*, b.title, b.author, b.isbn, b.location 
               FROM borrow_records br 
               LEFT JOIN books b ON br.book_id = b.id 
               WHERE br.reader_id = ?`;
    let countSql = 'SELECT COUNT(*) as total FROM borrow_records WHERE reader_id = ?';
    const params = [reader.id];
    const countParams = [reader.id];

    if (status) {
      sql += ' AND br.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY br.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const records = db.all(sql, params);
    const countResult = db.get(countSql, countParams);

    res.json({
      data: records,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取借阅记录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/all-records', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { readerName, bookTitle, status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `SELECT br.*, 
                      b.title, b.author, b.isbn,
                      r.name as reader_name, r.phone as reader_phone
               FROM borrow_records br 
               LEFT JOIN books b ON br.book_id = b.id 
               LEFT JOIN readers r ON br.reader_id = r.id
               WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total 
                    FROM borrow_records br 
                    LEFT JOIN readers r ON br.reader_id = r.id
                    WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (readerName) {
      sql += ' AND r.name LIKE ?';
      countSql += ' AND r.name LIKE ?';
      const likeName = `%${readerName}%`;
      params.push(likeName);
      countParams.push(likeName);
    }

    if (bookTitle) {
      sql += ' AND b.title LIKE ?';
      countSql += ' AND b.title LIKE ?';
      const likeTitle = `%${bookTitle}%`;
      params.push(likeTitle);
      countParams.push(likeTitle);
    }

    if (status) {
      sql += ' AND br.status = ?';
      countSql += ' AND br.status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY br.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const records = db.all(sql, params);
    const countResult = db.get(countSql, countParams);

    res.json({
      data: records,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取所有借阅记录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/borrow', authMiddleware, async (req, res) => {
  try {
    const { bookId, readerId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: '请选择图书' });
    }

    let targetReaderId;

    if (req.user.role === 'admin') {
      if (!readerId) {
        return res.status(400).json({ message: '请选择读者' });
      }
      targetReaderId = readerId;
    } else {
      const reader = db.get('SELECT * FROM readers WHERE user_id = ?', [req.user.id]);
      if (!reader) {
        return res.status(404).json({ message: '读者信息不存在' });
      }
      if (reader.status !== 'active') {
        return res.status(400).json({ message: '您的账户已被禁用，无法借书' });
      }
      targetReaderId = reader.id;
    }

    const book = db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({ message: '图书不存在' });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({ message: '该图书已无库存' });
    }

    const existingBorrow = db.get(
      'SELECT * FROM borrow_records WHERE reader_id = ? AND book_id = ? AND status = ?',
      [targetReaderId, bookId, 'borrowed']
    );
    if (existingBorrow) {
      return res.status(400).json({ message: '您已借阅过此图书且尚未归还' });
    }

    const today = getToday();
    const dueDate = addDays(today, BORROW_DAYS);
    const recordId = uuidv4();

    db.run(
      `INSERT INTO borrow_records (id, reader_id, book_id, borrow_date, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recordId, targetReaderId, bookId, today, dueDate, 'borrowed']
    );

    db.run(
      'UPDATE books SET available_copies = available_copies - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [bookId]
    );

    const newRecord = db.get(
      `SELECT br.*, b.title, b.author, b.isbn 
       FROM borrow_records br 
       LEFT JOIN books b ON br.book_id = b.id 
       WHERE br.id = ?`,
      [recordId]
    );

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('借书错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/return', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({ message: '请选择借阅记录' });
    }

    const record = db.get('SELECT * FROM borrow_records WHERE id = ?', [recordId]);
    if (!record) {
      return res.status(404).json({ message: '借阅记录不存在' });
    }

    if (record.status === 'returned') {
      return res.status(400).json({ message: '该图书已归还' });
    }

    if (req.user.role !== 'admin') {
      const reader = db.get('SELECT * FROM readers WHERE user_id = ?', [req.user.id]);
      if (!reader || reader.id !== record.reader_id) {
        return res.status(403).json({ message: '无权操作此记录' });
      }
    }

    const today = getToday();
    const fineAmount = calculateFine(record.due_date, today);

    db.run(
      `UPDATE borrow_records 
       SET return_date = ?, status = ?, fine_amount = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [today, 'returned', fineAmount, recordId]
    );

    db.run(
      'UPDATE books SET available_copies = available_copies + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [record.book_id]
    );

    const updatedRecord = db.get(
      `SELECT br.*, b.title, b.author, b.isbn 
       FROM borrow_records br 
       LEFT JOIN books b ON br.book_id = b.id 
       WHERE br.id = ?`,
      [recordId]
    );

    res.json(updatedRecord);
  } catch (error) {
    console.error('还书错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/renew', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({ message: '请选择借阅记录' });
    }

    const record = db.get('SELECT * FROM borrow_records WHERE id = ?', [recordId]);
    if (!record) {
      return res.status(404).json({ message: '借阅记录不存在' });
    }

    if (record.status !== 'borrowed') {
      return res.status(400).json({ message: '只能续借借阅中的图书' });
    }

    if (req.user.role !== 'admin') {
      const reader = db.get('SELECT * FROM readers WHERE user_id = ?', [req.user.id]);
      if (!reader || reader.id !== record.reader_id) {
        return res.status(403).json({ message: '无权操作此记录' });
      }
    }

    const today = getToday();
    if (new Date(record.due_date) < new Date(today)) {
      return res.status(400).json({ message: '该书已逾期，请先归还并缴纳罚款' });
    }

    const newDueDate = addDays(record.due_date, RENEW_DAYS);

    db.run(
      `UPDATE borrow_records 
       SET due_date = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newDueDate, recordId]
    );

    const updatedRecord = db.get(
      `SELECT br.*, b.title, b.author, b.isbn 
       FROM borrow_records br 
       LEFT JOIN books b ON br.book_id = b.id 
       WHERE br.id = ?`,
      [recordId]
    );

    res.json(updatedRecord);
  } catch (error) {
    console.error('续借错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/statistics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalBooks = db.get('SELECT COUNT(*) as count FROM books');
    const totalCopies = db.get('SELECT SUM(total_copies) as total FROM books');
    const availableCopies = db.get('SELECT SUM(available_copies) as total FROM books');
    const totalReaders = db.get('SELECT COUNT(*) as count FROM readers WHERE status = ?', ['active']);
    const borrowedCount = db.get('SELECT COUNT(*) as count FROM borrow_records WHERE status = ?', ['borrowed']);
    const overdueCount = db.get('SELECT COUNT(*) as count FROM borrow_records WHERE status = ?', ['overdue']);

    res.json({
      totalBooks: totalBooks.count,
      totalCopies: totalCopies.total || 0,
      availableCopies: availableCopies.total || 0,
      borrowedCopies: (totalCopies.total || 0) - (availableCopies.total || 0),
      totalReaders: totalReaders.count,
      borrowedRecords: borrowedCount.count,
      overdueRecords: overdueCount.count,
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
