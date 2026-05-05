const db = require('../config/database');

const getArticleList = async (req, res) => {
  try {
    const { 
      category, 
      keyword, 
      page = 1,
      page_size = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user?.id;

    let sql = `
      SELECT a.*, u.username as author_name, u.avatar as author_avatar
    `;
    
    if (userId) {
      sql += `, (SELECT 1 FROM favorites WHERE user_id = ? AND target_type = 'article' AND target_id = a.id) as is_favorited`;
    }
    
    sql += ` FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
    `;
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      WHERE a.status = 'published'
    `;
    
    const conditions = [];
    const params = userId ? [userId] : [];
    const countParams = [];

    if (category) {
      conditions.push(`a.category = ?`);
      params.push(category);
      countParams.push(category);
    }

    if (keyword) {
      conditions.push(`(a.title LIKE ? OR a.content LIKE ?)`);
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
      countParams.push(keywordPattern, keywordPattern);
    }

    if (conditions.length > 0) {
      const whereClause = ` AND ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }

    const validSortColumns = ['created_at', 'views', 'likes', 'comment_count'];
    const validSortOrders = ['asc', 'desc'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order : 'desc';

    sql += ` ORDER BY a.${sortColumn} ${order}`;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(page_size), offset);

    const articles = db.prepare(sql).all(...params);
    const countResult = db.prepare(countSql).get(...countParams);

    const parsedArticles = articles.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      is_favorited: item.is_favorited === 1
    }));

    res.json({
      success: true,
      data: {
        list: parsedArticles,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    });
  }
};

const getArticleDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);

    let sql = `
      SELECT a.*, u.username as author_name, u.avatar as author_avatar
    `;
    
    if (userId) {
      sql += `, (SELECT 1 FROM favorites WHERE user_id = ? AND target_type = 'article' AND target_id = a.id) as is_favorited`;
    }
    
    sql += ` FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ? AND a.status = 'published'
    `;

    const article = userId 
      ? db.prepare(sql).get(userId, id)
      : db.prepare(sql).get(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    const parsedArticle = {
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
      is_favorited: article.is_favorited === 1
    };

    res.json({
      success: true,
      data: parsedArticle
    });
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败'
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { target_type, target_id } = req.params;
    const { page = 1, page_size = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(page_size);

    const comments = db.prepare(`
      SELECT c.*, u.username as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.target_type = ? AND c.target_id = ? AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(target_type, target_id, parseInt(page_size), offset);

    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM comments
      WHERE target_type = ? AND target_id = ? AND status = 'active'
    `).get(target_type, target_id);

    const replies = db.prepare(`
      SELECT c.*, u.username as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ? AND c.status = 'active'
      ORDER BY c.created_at ASC
    `);

    const parsedComments = comments.map(comment => ({
      ...comment,
      replies: replies.all(comment.id)
    }));

    res.json({
      success: true,
      data: {
        list: parsedComments,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id, content, parent_id } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (content, user_id, target_type, target_id, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(content.trim(), userId, target_type, target_id, parent_id || null);

    if (target_type === 'article') {
      db.prepare('UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?').run(target_id);
    }

    const comment = db.prepare(`
      SELECT c.*, u.username as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '评论成功',
      data: comment
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      message: '评论失败'
    });
  }
};

module.exports = {
  getArticleList,
  getArticleDetail,
  getComments,
  addComment
};
