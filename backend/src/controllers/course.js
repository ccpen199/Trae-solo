const { db } = require('../models/database');

const getCategories = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM course_categories ORDER BY sort_order').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
};

const getCourses = (req, res) => {
  try {
    const { categoryId, page = 1, pageSize = 10, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT c.*, cat.name as category_name FROM courses c LEFT JOIN course_categories cat ON c.category_id = cat.id WHERE c.status = ?';
    const params = ['published'];

    if (categoryId) {
      query += ' AND c.category_id = ?';
      params.push(categoryId);
    }

    if (keyword) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countQuery = query.replace('SELECT c.*, cat.name as category_name', 'SELECT COUNT(*) as count');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const courses = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: courses,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: '获取课程列表失败' });
  }
};

const getCourseDetail = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const course = db.prepare('SELECT c.*, cat.name as category_name FROM courses c LEFT JOIN course_categories cat ON c.category_id = cat.id WHERE c.id = ?').get(id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }

    db.prepare('UPDATE courses SET view_count = view_count + 1 WHERE id = ?').run(id);

    let userCourse = null;
    if (userId) {
      userCourse = db.prepare('SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?').get(userId, id);
    }

    const chapters = db.prepare('SELECT * FROM course_chapters WHERE course_id = ? ORDER BY sort_order').all(id);
    
    for (const chapter of chapters) {
      chapter.lessons = db.prepare('SELECT * FROM course_lessons WHERE chapter_id = ? ORDER BY sort_order').all(chapter.id);
    }

    const materials = db.prepare('SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC').all(id);

    res.json({
      success: true,
      data: {
        course: { ...course, view_count: course.view_count + 1 },
        chapters,
        materials,
        isEnrolled: !!userCourse,
        progress: userCourse?.progress || 0
      }
    });
  } catch (error) {
    console.error('Get course detail error:', error);
    res.status(500).json({ success: false, message: '获取课程详情失败' });
  }
};

const enrollCourse = (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }

    if (!course.is_free) {
      return res.status(400).json({ success: false, message: '付费课程请先购买' });
    }

    const existing = db.prepare('SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (existing) {
      return res.json({ success: true, message: '已加入学习', data: existing });
    }

    db.prepare('INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)').run(userId, courseId);
    db.prepare('UPDATE courses SET buy_count = buy_count + 1 WHERE id = ?').run(courseId);

    res.json({ success: true, message: '成功加入学习' });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ success: false, message: '加入学习失败' });
  }
};

const getMyCourses = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) as count FROM user_courses WHERE user_id = ?').get(userId).count;

    const courses = db.prepare(`
      SELECT uc.*, c.title, c.cover, c.instructor, c.duration
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = ?
      ORDER BY uc.last_study_at DESC, uc.enrolled_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: courses,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ success: false, message: '获取我的课程失败' });
  }
};

const createOrder = (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }

    if (course.is_free) {
      return res.status(400).json({ success: false, message: '免费课程无需购买' });
    }

    const existing = db.prepare('SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (existing) {
      return res.status(400).json({ success: false, message: '已购买该课程' });
    }

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    db.prepare('INSERT INTO orders (user_id, course_id, order_no, amount, status) VALUES (?, ?, ?, ?, ?)')
      .run(userId, courseId, orderNo, course.price, 'paid');
    
    db.prepare('INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)').run(userId, courseId);
    db.prepare('UPDATE courses SET buy_count = buy_count + 1 WHERE id = ?').run(courseId);

    res.json({ success: true, message: '购买成功', data: { orderNo } });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: '购买失败' });
  }
};

const getDiscussions = (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT d.*, u.nickname, u.avatar
      FROM course_discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.course_id = ?
    `;
    const params = [courseId];

    if (keyword) {
      query += ' AND (d.title LIKE ? OR d.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countQuery = query.replace('SELECT d.*, u.nickname, u.avatar', 'SELECT COUNT(*) as count');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY d.is_pinned DESC, d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const discussions = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: discussions,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ success: false, message: '获取讨论列表失败' });
  }
};

const createDiscussion = (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, title, content, lessonId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: '请输入标题' });
    }

    const result = db.prepare(`
      INSERT INTO course_discussions (course_id, user_id, title, content, lesson_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(courseId, userId, title, content || '', lessonId || null);

    res.json({ success: true, message: '发布成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
};

const getDiscussionReplies = (req, res) => {
  try {
    const { discussionId } = req.params;

    const replies = db.prepare(`
      SELECT r.*, u.nickname, u.avatar
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.discussion_id = ?
      ORDER BY r.created_at ASC
    `).all(discussionId);

    res.json({ success: true, data: replies });
  } catch (error) {
    console.error('Get discussion replies error:', error);
    res.status(500).json({ success: false, message: '获取回复失败' });
  }
};

const createReply = (req, res) => {
  try {
    const userId = req.user.userId;
    const { discussionId, content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入回复内容' });
    }

    db.prepare(`
      INSERT INTO discussion_replies (discussion_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `).run(discussionId, userId, content, parentId || null);

    db.prepare('UPDATE course_discussions SET reply_count = reply_count + 1 WHERE id = ?').run(discussionId);

    res.json({ success: true, message: '回复成功' });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ success: false, message: '回复失败' });
  }
};

const likeDiscussion = (req, res) => {
  try {
    const userId = req.user.userId;
    const { discussionId } = req.body;

    const existing = db.prepare('SELECT * FROM discussion_likes WHERE user_id = ? AND discussion_id = ?').get(userId, discussionId);
    
    if (existing) {
      db.prepare('DELETE FROM discussion_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE course_discussions SET like_count = like_count - 1 WHERE id = ?').run(discussionId);
      res.json({ success: true, message: '取消点赞', data: { liked: false } });
    } else {
      db.prepare('INSERT INTO discussion_likes (user_id, discussion_id) VALUES (?, ?)').run(userId, discussionId);
      db.prepare('UPDATE course_discussions SET like_count = like_count + 1 WHERE id = ?').run(discussionId);
      res.json({ success: true, message: '点赞成功', data: { liked: true } });
    }
  } catch (error) {
    console.error('Like discussion error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

module.exports = {
  getCategories,
  getCourses,
  getCourseDetail,
  enrollCourse,
  getMyCourses,
  createOrder,
  getDiscussions,
  createDiscussion,
  getDiscussionReplies,
  createReply,
  likeDiscussion
};
