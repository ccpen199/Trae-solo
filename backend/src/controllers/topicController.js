const db = require('../config/database');
const { success, fail } = require('../utils/response');

const topicController = {
  getAllTopics: (req, res) => {
    try {
      const topics = db.prepare('SELECT * FROM topics ORDER BY sort_order').all();
      res.json(success(topics));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取主题失败'));
    }
  },

  createTopic: (req, res) => {
    try {
      const { name, description, sort_order } = req.body;
      
      if (!name) {
        return res.status(400).json(fail('主题名称不能为空'));
      }

      const existing = db.prepare('SELECT id FROM topics WHERE name = ?').get(name);
      if (existing) {
        return res.status(400).json(fail('主题名称已存在'));
      }

      const stmt = db.prepare('INSERT INTO topics (name, description, sort_order) VALUES (?, ?, ?)');
      const result = stmt.run(name, description || '', sort_order || 0);

      const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
      res.json(success(topic, '创建成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('创建失败'));
    }
  }
};

module.exports = topicController;
