const db = require('../config/database');

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id } = req.body;

    if (!target_type || !target_id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const existing = db.prepare(`
      SELECT * FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?
    `).get(userId, target_type, target_id);

    if (existing) {
      db.prepare(`
        DELETE FROM favorites WHERE id = ?
      `).run(existing.id);

      if (target_type === 'furniture') {
        db.prepare('UPDATE furniture SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?').run(target_id);
      } else if (target_type === 'article') {
        db.prepare('UPDATE articles SET likes = MAX(0, likes - 1) WHERE id = ?').run(target_id);
      }

      res.json({
        success: true,
        message: '已取消收藏',
        data: { is_favorited: false }
      });
    } else {
      db.prepare(`
        INSERT INTO favorites (user_id, target_type, target_id)
        VALUES (?, ?, ?)
      `).run(userId, target_type, target_id);

      if (target_type === 'furniture') {
        db.prepare('UPDATE furniture SET favorite_count = favorite_count + 1 WHERE id = ?').run(target_id);
      } else if (target_type === 'article') {
        db.prepare('UPDATE articles SET likes = likes + 1 WHERE id = ?').run(target_id);
      }

      res.json({
        success: true,
        message: '收藏成功',
        data: { is_favorited: true }
      });
    }
  } catch (error) {
    console.error('切换收藏状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, page = 1, page_size = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(page_size);

    let sql = `
      SELECT f.*, 
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.name
          WHEN f.target_type = 'article' THEN a.title
          ELSE NULL
        END as target_name,
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.images
          WHEN f.target_type = 'article' THEN a.cover_image
          ELSE NULL
        END as target_image,
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.price
          ELSE NULL
        END as target_price
      FROM favorites f
      LEFT JOIN furniture fr ON f.target_type = 'furniture' AND f.target_id = fr.id
      LEFT JOIN articles a ON f.target_type = 'article' AND f.target_id = a.id
      WHERE f.user_id = ?
    `;

    const params = [userId];

    if (target_type) {
      sql += ` AND f.target_type = ?`;
      params.push(target_type);
    }

    const countSql = sql.replace(
      `SELECT f.*, 
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.name
          WHEN f.target_type = 'article' THEN a.title
          ELSE NULL
        END as target_name,
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.images
          WHEN f.target_type = 'article' THEN a.cover_image
          ELSE NULL
        END as target_image,
        CASE 
          WHEN f.target_type = 'furniture' THEN fr.price
          ELSE NULL
        END as target_price`,
      `SELECT COUNT(*) as total`
    );

    sql += ` ORDER BY f.created_at DESC`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(page_size), offset);

    const favorites = db.prepare(sql).all(...params);
    const countResult = db.prepare(countSql).get(...params.slice(0, params.length - 2));

    const parsedFavorites = favorites.map(item => ({
      ...item,
      target_image: item.target_image ? 
        (item.target_type === 'furniture' ? JSON.parse(item.target_image)[0] : item.target_image) 
        : null
    }));

    res.json({
      success: true,
      data: {
        list: parsedFavorites,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败'
    });
  }
};

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { following_id } = req.body;

    if (!following_id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (followerId === following_id) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const existing = db.prepare(`
      SELECT * FROM follows WHERE follower_id = ? AND following_id = ?
    `).get(followerId, following_id);

    if (existing) {
      db.prepare(`DELETE FROM follows WHERE id = ?`).run(existing.id);

      res.json({
        success: true,
        message: '已取消关注',
        data: { is_following: false }
      });
    } else {
      db.prepare(`
        INSERT INTO follows (follower_id, following_id)
        VALUES (?, ?)
      `).run(followerId, following_id);

      res.json({
        success: true,
        message: '关注成功',
        data: { is_following: true }
      });
    }
  } catch (error) {
    console.error('切换关注状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, page_size = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(page_size);

    const messages = db.prepare(`
      SELECT m.*, 
        fu.username as from_user_name, fu.avatar as from_user_avatar,
        tu.username as to_user_name, tu.avatar as to_user_avatar
      FROM messages m
      LEFT JOIN users fu ON m.from_user_id = fu.id
      LEFT JOIN users tu ON m.to_user_id = tu.id
      WHERE m.from_user_id = ? OR m.to_user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, parseInt(page_size), offset);

    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE from_user_id = ? OR to_user_id = ?
    `).get(userId, userId);

    res.json({
      success: true,
      data: {
        list: messages,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { to_user_id, content } = req.body;

    if (!to_user_id || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (fromUserId === to_user_id) {
      return res.status(400).json({
        success: false,
        message: '不能给自己发消息'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (from_user_id, to_user_id, content)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(fromUserId, to_user_id, content.trim());

    const message = db.prepare(`
      SELECT m.*, 
        fu.username as from_user_name, fu.avatar as from_user_avatar,
        tu.username as to_user_name, tu.avatar as to_user_avatar
      FROM messages m
      LEFT JOIN users fu ON m.from_user_id = fu.id
      LEFT JOIN users tu ON m.to_user_id = tu.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '发送成功',
      data: message
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      message: '发送失败'
    });
  }
};

const getQuestions = async (req, res) => {
  try {
    const { page = 1, page_size = 20, category, keyword } = req.query;
    const userId = req.user?.id;

    const offset = (parseInt(page) - 1) * parseInt(page_size);

    let sql = `
      SELECT q.*, u.username as user_name, u.avatar as user_avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.status = 'active'
    `;

    let countSql = `
      SELECT COUNT(*) as total
      FROM questions q
      WHERE q.status = 'active'
    `;

    const conditions = [];
    const params = [];
    const countParams = [];

    if (category) {
      conditions.push(`q.category = ?`);
      params.push(category);
      countParams.push(category);
    }

    if (keyword) {
      conditions.push(`(q.title LIKE ? OR q.content LIKE ?)`);
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
      countParams.push(keywordPattern, keywordPattern);
    }

    if (conditions.length > 0) {
      const whereClause = ` AND ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY q.created_at DESC`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(page_size), offset);

    const questions = db.prepare(sql).all(...params);
    const countResult = db.prepare(countSql).get(...countParams);

    const parsedQuestions = questions.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : []
    }));

    res.json({
      success: true,
      data: {
        list: parsedQuestions,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取问答列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取问答列表失败'
    });
  }
};

const getQuestionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('UPDATE questions SET views = views + 1 WHERE id = ?').run(id);

    const question = db.prepare(`
      SELECT q.*, u.username as user_name, u.avatar as user_avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ? AND q.status = 'active'
    `).get(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const answers = db.prepare(`
      SELECT a.*, u.username as user_name, u.avatar as user_avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ? AND a.status = 'active'
      ORDER BY a.is_accepted DESC, a.created_at DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...question,
        tags: question.tags ? JSON.parse(question.tags) : [],
        answers
      }
    });
  } catch (error) {
    console.error('获取问题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取问题详情失败'
    });
  }
};

const createQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, category, tags } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '问题标题不能为空'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO questions (title, content, user_id, category, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title.trim(),
      content || null,
      userId,
      category || null,
      tags ? JSON.stringify(tags) : null
    );

    const question = db.prepare(`
      SELECT q.*, u.username as user_name, u.avatar as user_avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '提问成功',
      data: question
    });
  } catch (error) {
    console.error('创建问题错误:', error);
    res.status(500).json({
      success: false,
      message: '提问失败'
    });
  }
};

const createAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question_id, content } = req.body;

    if (!question_id || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO answers (content, question_id, user_id)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(content.trim(), question_id, userId);

    db.prepare('UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?').run(question_id);

    const answer = db.prepare(`
      SELECT a.*, u.username as user_name, u.avatar as user_avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '回答成功',
      data: answer
    });
  } catch (error) {
    console.error('创建答案错误:', error);
    res.status(500).json({
      success: false,
      message: '回答失败'
    });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
  toggleFollow,
  getMessages,
  sendMessage,
  getQuestions,
  getQuestionDetail,
  createQuestion,
  createAnswer
};
