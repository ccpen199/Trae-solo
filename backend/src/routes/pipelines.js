const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (db, statusEngine, auditEngine) => {
  // 获取流水线列表
  router.get('/', (req, res) => {
    try {
      const { status, createdBy } = req.query;
      
      let query = `
        SELECT p.*, u.name as creator_name 
        FROM pipelines p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }
      if (createdBy) {
        query += ' AND p.created_by = ?';
        params.push(createdBy);
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      const pipelines = db.prepare(query).all(...params);
      
      res.json({ success: true, data: pipelines });
    } catch (error) {
      console.error('获取流水线列表错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取流水线详情
  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const pipeline = db.prepare(`
        SELECT p.*, u.name as creator_name 
        FROM pipelines p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `).get(id);
      
      if (!pipeline) {
        return res.status(404).json({ success: false, error: '流水线不存在' });
      }
      
      // 解析 stages
      if (pipeline.stages) {
        try {
          pipeline.stages = JSON.parse(pipeline.stages);
        } catch (e) {
          pipeline.stages = [];
        }
      }
      
      res.json({ success: true, data: pipeline });
    } catch (error) {
      console.error('获取流水线详情错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 创建流水线
  router.post('/', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      const { name, description, projectName, repoUrl, branch, stages } = req.body;
      
      if (!name || !projectName) {
        return res.status(400).json({ success: false, error: '名称和项目名为必填项' });
      }
      
      const pipelineId = uuidv4();
      const now = new Date().toISOString();
      
      const defaultStages = stages || [
        { name: '代码提交', stage_name: 'code_submit', order: 1, type: 'manual' },
        { name: '触发流水线', stage_name: 'trigger', order: 2, type: 'manual' },
        { name: '构建测试', stage_name: 'build_test', order: 3, type: 'auto' },
        { name: '部署', stage_name: 'deploy', order: 4, type: 'manual' },
        { name: '监控回滚', stage_name: 'monitor', order: 5, type: 'manual' }
      ];
      
      db.prepare(`
        INSERT INTO pipelines 
        (id, name, description, project_name, repo_url, branch, stages, created_by, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
      `).run(
        pipelineId,
        name,
        description,
        projectName,
        repoUrl,
        branch || 'main',
        JSON.stringify(defaultStages),
        userId,
        now,
        now
      );
      
      // 记录操作日志
      auditEngine.logOperation(
        userId,
        'create',
        'pipeline',
        pipelineId,
        null,
        { name, projectName },
        '创建流水线'
      );
      
      const newPipeline = db.prepare(`
        SELECT p.*, u.name as creator_name 
        FROM pipelines p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `).get(pipelineId);
      
      res.json({ success: true, data: newPipeline });
    } catch (error) {
      console.error('创建流水线错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 更新流水线
  router.put('/:id', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      const { id } = req.params;
      const { name, description, projectName, repoUrl, branch, stages, status } = req.body;
      
      const existing = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: '流水线不存在' });
      }
      
      const updateFields = ['updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [];
      
      if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
      if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
      if (projectName !== undefined) { updateFields.push('project_name = ?'); updateValues.push(projectName); }
      if (repoUrl !== undefined) { updateFields.push('repo_url = ?'); updateValues.push(repoUrl); }
      if (branch !== undefined) { updateFields.push('branch = ?'); updateValues.push(branch); }
      if (stages !== undefined) { updateFields.push('stages = ?'); updateValues.push(JSON.stringify(stages)); }
      if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
      
      updateValues.push(id);
      
      db.prepare(`UPDATE pipelines SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
      
      // 记录操作日志
      auditEngine.logOperation(
        userId,
        'update',
        'pipeline',
        id,
        existing,
        req.body,
        '更新流水线'
      );
      
      const updated = db.prepare(`
        SELECT p.*, u.name as creator_name 
        FROM pipelines p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `).get(id);
      
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('更新流水线错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 激活/停用流水线
  router.post('/:id/activate', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      const { id } = req.params;
      const { active } = req.body;
      
      const existing = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: '流水线不存在' });
      }
      
      const newStatus = active ? 'active' : 'paused';
      
      db.prepare(`
        UPDATE pipelines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(newStatus, id);
      
      auditEngine.logOperation(
        userId,
        'update',
        'pipeline',
        id,
        { status: existing.status },
        { status: newStatus },
        active ? '激活流水线' : '暂停流水线'
      );
      
      res.json({ success: true, data: { status: newStatus } });
    } catch (error) {
      console.error('激活流水线错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
