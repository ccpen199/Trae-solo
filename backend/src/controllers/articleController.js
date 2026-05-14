const db = require('../config/database');
const { success, fail } = require('../utils/response');

const articleController = {
  getList: (req, res) => {
    try {
      const { topic_id, keyword, sort = 'latest', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let articles = db.getTable('articles').filter(a => a.status === 'published');
      
      if (topic_id) {
        articles = articles.filter(a => a.topic_id === parseInt(topic_id));
      }
      
      if (keyword) {
        const search = keyword.toLowerCase();
        articles = articles.filter(a => 
          a.title.toLowerCase().includes(search) || 
          (a.summary && a.summary.toLowerCase().includes(search)) ||
          (a.content && a.content.toLowerCase().includes(search))
        );
      }
      
      if (sort === 'hot') {
        articles.sort((a, b) => {
          const scoreA = (a.view_count || 0) + (a.like_count || 0) * 5 + (a.comment_count || 0) * 10;
          const scoreB = (b.view_count || 0) + (b.like_count || 0) * 5 + (b.comment_count || 0) * 10;
          return scoreB - scoreA;
        });
      } else {
        articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      const users = db.getTable('users');
      const topics = db.getTable('topics');
      
      articles = articles.map(a => {
        const user = users.find(u => u.id === a.user_id);
        const topic = topics.find(t => t.id === a.topic_id);
        return {
          ...a,
          nickname: user?.nickname || '匿名',
          avatar: user?.avatar || null,
          topic_name: topic?.name || null
        };
      });
      
      const total = articles.length;
      const paginated = articles.slice(offset, offset + parseInt(limit));
      
      res.json(success({
        list: paginated,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取文章列表失败'));
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      
      const article = db.findById('articles', parseInt(id));
      if (!article || article.status !== 'published') {
        return res.status(404).json(fail('文章不存在'));
      }
      
      db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(id);
      
      const users = db.getTable('users');
      const topics = db.getTable('topics');
      const user = users.find(u => u.id === article.user_id);
      const topic = topics.find(t => t.id === article.topic_id);
      
      article.nickname = user?.nickname || '匿名';
      article.avatar = user?.avatar || null;
      article.topic_name = topic?.name || null;
      
      const comments = db.getTable('comments')
        .filter(c => c.article_id === parseInt(id))
        .map(c => {
          const commentUser = users.find(u => u.id === c.user_id);
          return {
            ...c,
            nickname: commentUser?.nickname || '匿名',
            avatar: commentUser?.avatar || null
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json(success({ ...article, comments }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取文章详情失败'));
    }
  },

  create: (req, res) => {
    try {
      const { title, content, summary, topic_id } = req.body;
      
      if (!title || title.length < 5) {
        return res.status(400).json(fail('标题至少5个字符'));
      }
      
      const result = db.insert('articles', {
        user_id: req.user.id,
        title,
        content: content || '',
        summary: summary || '',
        topic_id: topic_id || null,
        status: 'published',
        view_count: 0,
        comment_count: 0,
        like_count: 0
      });
      
      res.json(success({ id: result.id }, '发布成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('发布失败'));
    }
  },

  like: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const articleId = parseInt(id);

      const existing = db.findOne('likes', l => l.user_id === userId && l.target_type === 'article' && l.target_id === articleId);

      if (existing) {
        db.remove('likes', l => l.user_id === userId && l.target_type === 'article' && l.target_id === articleId);
        db.prepare('UPDATE articles SET like_count = like_count - 1 WHERE id = ?').run(id);
        res.json(success({ liked: false }, '已取消点赞'));
      } else {
        db.insert('likes', { user_id: userId, target_type: 'article', target_id: articleId });
        db.prepare('UPDATE articles SET like_count = like_count + 1 WHERE id = ?').run(id);
        res.json(success({ liked: true }, '已点赞'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  },

  addComment: (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || content.length < 2) {
        return res.status(400).json(fail('评论至少2个字符'));
      }
      
      const result = db.insert('comments', {
        article_id: parseInt(id),
        user_id: req.user.id,
        content
      });
      
      db.prepare('UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?').run(id);
      
      const users = db.getTable('users');
      const user = users.find(u => u.id === req.user.id);
      
      const newComment = {
        id: result.id,
        article_id: parseInt(id),
        user_id: req.user.id,
        content,
        nickname: user?.nickname || '匿名',
        avatar: user?.avatar || null
      };
      
      res.json(success(newComment, '评论成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('评论失败'));
    }
  },

  toggleFavorite: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const articleId = parseInt(id);

      const existing = db.findOne('favorites', f => f.user_id === userId && f.article_id === articleId);

      if (existing) {
        db.remove('favorites', f => f.user_id === userId && f.article_id === articleId);
        res.json(success({ favorited: false }, '已取消收藏'));
      } else {
        db.insert('favorites', { user_id: userId, article_id: articleId });
        res.json(success({ favorited: true }, '已收藏'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  }
};

module.exports = articleController;
