const db = require('../config/database');
const { success, fail } = require('../utils/response');

const questionController = {
  getList: (req, res) => {
    try {
      const { topic_id, keyword, sort = 'latest', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let questions = db.getTable('questions').filter(q => q.status === 'published');
      
      if (topic_id) {
        questions = questions.filter(q => q.topic_id === parseInt(topic_id));
      }
      
      if (keyword) {
        const search = keyword.toLowerCase();
        questions = questions.filter(q => 
          q.title.toLowerCase().includes(search) || 
          (q.content && q.content.toLowerCase().includes(search))
        );
      }
      
      if (sort === 'hot') {
        questions.sort((a, b) => {
          const scoreA = (a.view_count || 0) + (a.like_count || 0) * 5 + (a.answer_count || 0) * 10;
          const scoreB = (b.view_count || 0) + (b.like_count || 0) * 5 + (b.answer_count || 0) * 10;
          return scoreB - scoreA;
        });
      } else if (sort === 'most_answers') {
        questions.sort((a, b) => (b.answer_count || 0) - (a.answer_count || 0));
      } else {
        questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      const users = db.getTable('users');
      const topics = db.getTable('topics');
      
      questions = questions.map(q => {
        const user = users.find(u => u.id === q.user_id);
        const topic = topics.find(t => t.id === q.topic_id);
        return {
          ...q,
          nickname: user?.nickname || '匿名',
          avatar: user?.avatar || null,
          topic_name: topic?.name || null
        };
      });
      
      const total = questions.length;
      const paginated = questions.slice(offset, offset + parseInt(limit));
      
      res.json(success({
        list: paginated,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取问题列表失败'));
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      
      const question = db.findById('questions', parseInt(id));
      if (!question || question.status !== 'published') {
        return res.status(404).json(fail('问题不存在'));
      }
      
      db.prepare('UPDATE questions SET view_count = view_count + 1 WHERE id = ?').run(id);
      
      const users = db.getTable('users');
      const topics = db.getTable('topics');
      const user = users.find(u => u.id === question.user_id);
      const topic = topics.find(t => t.id === question.topic_id);
      
      question.nickname = user?.nickname || '匿名';
      question.avatar = user?.avatar || null;
      question.topic_name = topic?.name || null;
      
      let is_followed = false;
      if (req.user) {
        const follow = db.findOne('question_follows', f => f.user_id === req.user.id && f.question_id === parseInt(id));
        is_followed = !!follow;
      }
      question.is_followed = is_followed;
      
      const answers = db.getTable('answers')
        .filter(a => a.question_id === parseInt(id))
        .map(a => {
          const answerUser = users.find(u => u.id === a.user_id);
          return {
            ...a,
            nickname: answerUser?.nickname || '匿名',
            avatar: answerUser?.avatar || null
          };
        })
        .sort((a, b) => {
          if (b.is_accepted !== a.is_accepted) return (b.is_accepted || 0) - (a.is_accepted || 0);
          const scoreA = (b.like_count || 0) * 1000000 - new Date(b.created_at).getTime();
          const scoreB = (a.like_count || 0) * 1000000 - new Date(a.created_at).getTime();
          return scoreA - scoreB;
        });
      
      res.json(success({ ...question, answers }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取问题详情失败'));
    }
  },

  saveDraft: (req, res) => {
    try {
      const { title, content, topic_id } = req.body;
      
      const existing = db.findOne('draft_questions', d => d.user_id === req.user.id);
      
      if (existing) {
        db.update('draft_questions', existing.id, { title, content, topic_id });
      } else {
        db.insert('draft_questions', { user_id: req.user.id, title, content, topic_id });
      }
      
      const draft = db.findOne('draft_questions', d => d.user_id === req.user.id);
      res.json(success(draft, '草稿已保存'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('保存草稿失败'));
    }
  },

  getDraft: (req, res) => {
    try {
      const draft = db.findOne('draft_questions', d => d.user_id === req.user.id);
      res.json(success(draft || null));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取草稿失败'));
    }
  },

  clearDraft: (req, res) => {
    try {
      db.remove('draft_questions', d => d.user_id === req.user.id);
      res.json(success(null, '草稿已清除'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('清除草稿失败'));
    }
  },

  create: (req, res) => {
    try {
      const { title, content, topic_id } = req.body;
      
      if (!title || title.length < 5) {
        return res.status(400).json(fail('标题至少5个字符'));
      }
      
      const result = db.insert('questions', {
        user_id: req.user.id,
        title,
        content: content || '',
        topic_id: topic_id || null,
        status: 'published',
        view_count: 0,
        answer_count: 0,
        like_count: 0,
        follow_count: 0
      });
      
      db.remove('draft_questions', d => d.user_id === req.user.id);
      
      res.json(success({ id: result.id }, '发布成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('发布失败'));
    }
  },

  toggleFollow: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const questionId = parseInt(id);

      const existing = db.findOne('question_follows', f => f.user_id === userId && f.question_id === questionId);

      if (existing) {
        db.remove('question_follows', f => f.user_id === userId && f.question_id === questionId);
        db.prepare('UPDATE questions SET follow_count = follow_count - 1 WHERE id = ?').run(id);
        res.json(success({ followed: false }, '已取消关注'));
      } else {
        db.insert('question_follows', { user_id: userId, question_id: questionId });
        db.prepare('UPDATE questions SET follow_count = follow_count + 1 WHERE id = ?').run(id);
        res.json(success({ followed: true }, '已关注'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  },

  like: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const questionId = parseInt(id);

      const existing = db.findOne('likes', l => l.user_id === userId && l.target_type === 'question' && l.target_id === questionId);

      if (existing) {
        db.remove('likes', l => l.user_id === userId && l.target_type === 'question' && l.target_id === questionId);
        db.prepare('UPDATE questions SET like_count = like_count - 1 WHERE id = ?').run(id);
        res.json(success({ liked: false }, '已取消点赞'));
      } else {
        db.insert('likes', { user_id: userId, target_type: 'question', target_id: questionId });
        db.prepare('UPDATE questions SET like_count = like_count + 1 WHERE id = ?').run(id);
        res.json(success({ liked: true }, '已点赞'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  }
};

module.exports = questionController;
