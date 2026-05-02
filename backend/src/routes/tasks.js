const express = require('express');
const router = express.Router();
const { 
  generateId, 
  generateTaskNo,
  getNextStatus,
  getAvailableActions 
} = require('../utils');
const GateRuleEngine = require('../rules/gateRuleEngine');

module.exports = (db) => {
  const gateEngine = new GateRuleEngine(db);

  router.get('/', (req, res) => {
    try {
      const { status, assigned_to, task_type, vessel_plan_id } = req.query;
      
      let query = `
        SELECT t.*, u.name as assigned_to_name, 
               c.container_no,
               vp.plan_no, vp.vessel_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN containers c ON t.container_id = c.id
        LEFT JOIN vessel_plans vp ON t.vessel_plan_id = vp.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      if (assigned_to) {
        query += ' AND t.assigned_to = ?';
        params.push(assigned_to);
      }

      if (task_type) {
        query += ' AND t.task_type = ?';
        params.push(task_type);
      }

      if (vessel_plan_id) {
        query += ' AND t.vessel_plan_id = ?';
        params.push(vessel_plan_id);
      }

      query += ' ORDER BY t.created_at DESC';

      const tasks = db.prepare(query).all(...params);
      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const task = db.prepare(`
        SELECT t.*, u.name as assigned_to_name, 
               c.container_no,
               vp.plan_no, vp.vessel_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN containers c ON t.container_id = c.id
        LEFT JOIN vessel_plans vp ON t.vessel_plan_id = vp.id
        WHERE t.id = ?
      `).get(id);
      
      if (!task) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }

      const statusFlows = db.prepare(`
        SELECT sf.*, u.name as operator_name 
        FROM status_flows sf 
        LEFT JOIN users u ON sf.operator = u.id
        WHERE sf.task_id = ? 
        ORDER BY sf.created_at
      `).all(id);

      res.json({ 
        success: true, 
        data: { 
          ...task, 
          statusFlows
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { 
        vessel_plan_id, 
        container_id, 
        task_type, 
        description,
        assigned_to,
        priority,
        gate_no,
        created_by
      } = req.body;

      if (!task_type) {
        return res.status(400).json({ 
          success: false, 
          message: '任务类型为必填项' 
        });
      }

      const id = generateId();
      const taskNo = generateTaskNo();

      const insertTask = db.prepare(`
        INSERT INTO tasks (
          id, task_no, vessel_plan_id, container_id, task_type, 
          description, assigned_to, status, priority, gate_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertTask.run(
        id,
        taskNo,
        vessel_plan_id,
        container_id,
        task_type,
        description,
        assigned_to,
        'PENDING',
        priority || 'NORMAL',
        gate_no
      );

      const insertStatusFlow = db.prepare(`
        INSERT INTO status_flows (
          id, task_id, from_status, to_status, action, operator, operator_role, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStatusFlow.run(
        generateId(),
        id,
        null,
        'PENDING',
        'CREATE',
        created_by,
        'DISPATCHER',
        '创建任务'
      );

      if (assigned_to) {
        const insertMessage = db.prepare(`
          INSERT INTO messages (
            id, recipient_id, title, content, related_type, related_id
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const taskTypeNames = {
          'LOADING': '装卸作业',
          'UNLOADING': '卸船作业',
          'YARD_MOVE': '堆场移箱',
          'GATE_IN': '闸口进场',
          'GATE_OUT': '闸口出场'
        };

        insertMessage.run(
          generateId(),
          assigned_to,
          `新任务分配: ${taskTypeNames[task_type] || task_type}`,
          `任务 ${taskNo} 已分配给您，请及时处理`,
          'TASK',
          id
        );
      }

      res.status(201).json({ 
        success: true, 
        data: { id, task_no: taskNo } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { action, operator_id, operator_role, comment } = req.body;

      if (!action || !operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作类型和操作人为必填项' 
        });
      }

      const transaction = db.transaction(() => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        
        if (!task) {
          throw new Error('任务不存在');
        }

        const nextStatus = getNextStatus(task.status, action);
        
        if (!nextStatus) {
          throw new Error(`当前状态 ${task.status} 不支持操作 ${action}`);
        }

        const availableActions = getAvailableActions(task.status, operator_role);
        
        if (!availableActions.includes(action) && action !== 'VIEW') {
          throw new Error(`您没有权限执行操作 ${action}`);
        }

        db.prepare(`
          UPDATE tasks 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextStatus, id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, task_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          task.status,
          nextStatus,
          action,
          operator_id,
          operator_role,
          comment
        );

        db.prepare(`
          INSERT INTO operation_logs (
            id, user_id, user_role, operation, table_name, record_id, after_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          generateId(),
          operator_id,
          operator_role,
          `STATUS_${action}`,
          'tasks',
          id,
          JSON.stringify({ from: task.status, to: nextStatus })
        );

        return { fromStatus: task.status, toStatus: nextStatus };
      });

      const result = transaction();
      res.json({ 
        success: true, 
        data: { 
          from_status: result.fromStatus, 
          to_status: result.toStatus 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/start', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id, operator_role } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const transaction = db.transaction(() => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        
        if (!task) {
          throw new Error('任务不存在');
        }

        if (task.status !== 'PENDING') {
          throw new Error('当前状态不支持开始操作');
        }

        if (task.gate_no) {
          const lockResult = gateEngine.lockGate(task.gate_no, id, operator_id);
          if (lockResult.success === false) {
            throw new Error(lockResult.message);
          }
        }

        db.prepare(`
          UPDATE tasks 
          SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, task_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          'PENDING',
          'IN_PROGRESS',
          'START',
          operator_id,
          operator_role,
          '开始执行任务'
        );

        return { task, gateNo: task.gate_no };
      });

      const result = transaction();
      res.json({ 
        success: true, 
        data: { 
          task_id: id,
          gate_no: result.gateNo,
          status: 'IN_PROGRESS'
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/complete', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id, operator_role, comment } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const transaction = db.transaction(() => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        
        if (!task) {
          throw new Error('任务不存在');
        }

        if (task.status !== 'IN_PROGRESS') {
          throw new Error('当前状态不支持完成操作');
        }

        if (task.gate_no) {
          gateEngine.unlockGate(task.gate_no);
        }

        db.prepare(`
          UPDATE tasks 
          SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, task_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          'IN_PROGRESS',
          'COMPLETED',
          'COMPLETE',
          operator_id,
          operator_role,
          comment || '任务完成'
        );

        if (task.assigned_to) {
          const insertMessage = db.prepare(`
            INSERT INTO messages (
              id, recipient_id, title, content, related_type, related_id
            ) VALUES (?, ?, ?, ?, ?, ?)
          `);

          insertMessage.run(
            generateId(),
            task.assigned_to,
            `任务已完成`,
            `任务 ${task.task_no} 已完成`,
            'TASK',
            id
          );
        }

        return { task };
      });

      const result = transaction();
      res.json({ 
        success: true, 
        data: { 
          task_id: id,
          status: 'COMPLETED'
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/summary', (req, res) => {
    try {
      const { assigned_to } = req.query;
      
      let whereClause = '1=1';
      const params = [];

      if (assigned_to) {
        whereClause = 'assigned_to = ?';
        params.push(assigned_to);
      }

      const statistics = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM tasks
        WHERE ${whereClause}
        GROUP BY status
      `).all(...params);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE ${whereClause}
      `).get(...params);

      res.json({ 
        success: true, 
        data: { 
          total: total.count,
          by_status: statistics 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
