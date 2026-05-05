const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { keyword, category, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM books WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM books WHERE 1=1';
    const params = [];
    const countParams = [];

    if (keyword) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR publisher LIKE ? OR isbn LIKE ?)';
      countSql += ' AND (title LIKE ? OR author LIKE ? OR publisher LIKE ? OR isbn LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
      countParams.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [books, countResult] = await Promise.all([
      db.all(sql, params),
      db.get(countSql, countParams)
    ]);

    res.json({
      data: books,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取图书列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category');
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('获取图书分类错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);

    if (!book) {
      return res.status(404).json({ message: '图书不存在' });
    }

    res.json(book);
  } catch (error) {
    console.error('获取图书详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publish_date,
      category,
      description,
      total_copies = 1,
      location,
      price
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: '书名不能为空' });
    }

    const id = uuidv4();
    const result = await db.run(
      `INSERT INTO books (id, isbn, title, author, publisher, publish_date, category, description, total_copies, available_copies, location, price) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, isbn, title, author, publisher, publish_date, category, description, total_copies, total_copies, location, price]
    );

    const newBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('添加图书错误:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'ISBN已存在' });
    }
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isbn,
      title,
      author,
      publisher,
      publish_date,
      category,
      description,
      total_copies,
      location,
      price
    } = req.body;

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({ message: '图书不存在' });
    }

    const updates = [];
    const params = [];

    if (isbn !== undefined) { updates.push('isbn = ?'); params.push(isbn); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (author !== undefined) { updates.push('author = ?'); params.push(author); }
    if (publisher !== undefined) { updates.push('publisher = ?'); params.push(publisher); }
    if (publish_date !== undefined) { updates.push('publish_date = ?'); params.push(publish_date); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (total_copies !== undefined) {
      const diff = total_copies - existingBook.total_copies;
      updates.push('total_copies = ?');
      updates.push('available_copies = ?');
      params.push(total_copies, existingBook.available_copies + diff);
    }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }

    if (updates.length === 0) {
      return res.json(existingBook);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    res.json(updatedBook);
  } catch (error) {
    console.error('更新图书错误:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'ISBN已存在' });
    }
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({ message: '图书不存在' });
    }

    const borrowRecords = await db.get('SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status = ?', [id, 'borrowed']);
    if (borrowRecords.count > 0) {
      return res.status(400).json({ message: '该图书有未归还的借阅记录，无法删除' });
    }

    await db.run('DELETE FROM books WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除图书错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
