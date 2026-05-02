const express = require('express');
const router = express.Router();
const { 
  generateId, 
  generatePlanNo, 
  generateTaskNo,
  getNextStatus,
  getAvailableActions 
} = require('../utils');

module.exports = (db) => {
  router.get('/', (req, res) => {
    try {
      const { status, created_by } = req.query;
      
      let query = 'SELECT * FROM vessel_plans WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (created_by) {
        query += ' AND created_by = ?';
        params.push(created_by);
      }

      query += ' ORDER BY created_at DESC';

      const plans = db.prepare(query).all(...params);
      res.json({ success: true, data: plans });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const plan = db.prepare('SELECT * FROM vessel_plans WHERE id = ?').get(id);
      
      if (!plan) {
        return res.status(404).json({ success: false, message: '船舶计划不存在' });
      }

      const containers = db.prepare(
        'SELECT * FROM containers WHERE vessel_plan_id = ? ORDER BY created_at'
      ).all(id);

      const statusFlows = db.prepare(`
        SELECT sf.*, u.name as operator_name 
        FROM status_flows sf 
        LEFT JOIN users u ON sf.operator = u.id
        WHERE sf.vessel_plan_id = ? 
        ORDER BY sf.created_at
      `).all(id);

      const messages = db.prepare(
        'SELECT * FROM messages WHERE related_type = ? AND related_id = ? ORDER BY created_at'
      ).all('VESSEL_PLAN', id);

      res.json({ 
        success: true, 
        data: { 
          ...plan, 
          containers, 
          statusFlows,
          messages 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { 
        vessel_name, 
        voyage_no, 
        arrival_time, 
        departure_time, 
        expected_completion_time,
        responsible_person,
        description,
        created_by,
        containers
      } = req.body;

      if (!vessel_name || !voyage_no) {
        return res.status(400).json({ 
          success: false, 
          message: '船名和航次号为必填项' 
        });
      }

      const existingPlan = db.prepare(
        'SELECT * FROM vessel_plans WHERE vessel_name = ? AND voyage_no = ?'
      ).get(vessel_name, voyage_no);

      if (existingPlan) {
        return res.status(400).json({ 
          success: false, 
          message: '该船舶航次计划已存在' 
        });
      }

      const transaction = db.transaction(() => {
        const id = generateId();
        const planNo = generatePlanNo();

        const insertPlan = db.prepare(`
          INSERT INTO vessel_plans (
            id, plan_no, vessel_name, voyage_no, arrival_time, 
            departure_time, expected_completion_time, responsible_person, 
            status, current_node, description, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertPlan.run(
          id,
          planNo,
          vessel_name,
          voyage_no,
          arrival_time,
          departure_time,
          expected_completion_time,
          responsible_person,
          'DRAFT',
          'VESSEL_PLAN',
          description,
          created_by
        );

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, vessel_plan_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          null,
          'DRAFT',
          'CREATE',
          created_by,
          'DISPATCHER',
          '创建船舶计划'
        );

        if (containers && containers.length > 0) {
          const insertContainer = db.prepare(`
            INSERT INTO containers (
              id, container_no, size_type, weight, seal_no, vessel_plan_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          for (const container of containers) {
            const containerId = generateId();
            insertContainer.run(
              containerId,
              container.container_no,
              container.size_type,
              container.weight,
              container.seal_no,
              id,
              'PENDING_ARRIVAL'
            );
          }
        }

        if (created_by) {
          const insertMessage = db.prepare(`
            INSERT INTO messages (
              id, recipient_id, title, content, related_type, related_id
            ) VALUES (?, ?, ?, ?, ?, ?)
          `);

          insertMessage.run(
            generateId(),
            created_by,
            '新建船舶计划',
            `船舶计划 ${planNo} 已创建，请提交审批`,
            'VESSEL_PLAN',
            id
          );
        }

        return { id, planNo };
      });

      const result = transaction();
      res.status(201).json({ 
        success: true, 
        data: { 
          id: result.id, 
          plan_no: result.planNo 
        } 
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
        const plan = db.prepare('SELECT * FROM vessel_plans WHERE id = ?').get(id);
        
        if (!plan) {
          throw new Error('船舶计划不存在');
        }

        const nextStatus = getNextStatus(plan.status, action);
        
        if (!nextStatus) {
          throw new Error(`当前状态 ${plan.status} 不支持操作 ${action}`);
        }

        const availableActions = getAvailableActions(plan.status, operator_role);
        
        if (!availableActions.includes(action) && action !== 'VIEW') {
          throw new Error(`您没有权限执行操作 ${action}`);
        }

        db.prepare(`
          UPDATE vessel_plans 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextStatus, id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, vessel_plan_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          plan.status,
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
          'vessel_plans',
          id,
          JSON.stringify({ from: plan.status, to: nextStatus })
        );

        return { fromStatus: plan.status, toStatus: nextStatus };
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

  router.get('/:id/available-actions', (req, res) => {
    try {
      const { id } = req.params;
      const { user_role } = req.query;

      const plan = db.prepare('SELECT * FROM vessel_plans WHERE id = ?').get(id);
      
      if (!plan) {
        return res.status(404).json({ success: false, message: '船舶计划不存在' });
      }

      const actions = getAvailableActions(plan.status, user_role);
      
      res.json({ 
        success: true, 
        data: { 
          current_status: plan.status,
          available_actions: actions
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/summary', (req, res) => {
    try {
      const statistics = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM vessel_plans
        GROUP BY status
      `).all();

      const total = db.prepare(
        'SELECT COUNT(*) as count FROM vessel_plans'
      ).get();

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
