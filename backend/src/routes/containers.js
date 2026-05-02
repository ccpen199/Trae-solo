const express = require('express');
const router = express.Router();
const { 
  generateId, 
  validateContainerNo,
  getNextStatus,
  getAvailableActions 
} = require('../utils');
const YardRuleEngine = require('../rules/yardRuleEngine');
const GateRuleEngine = require('../rules/gateRuleEngine');

module.exports = (db) => {
  const yardEngine = new YardRuleEngine(db);
  const gateEngine = new GateRuleEngine(db);

  router.get('/', (req, res) => {
    try {
      const { status, vessel_plan_id, container_no } = req.query;
      
      let query = 'SELECT * FROM containers WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (vessel_plan_id) {
        query += ' AND vessel_plan_id = ?';
        params.push(vessel_plan_id);
      }

      if (container_no) {
        query += ' AND container_no LIKE ?';
        params.push(`%${container_no}%`);
      }

      query += ' ORDER BY created_at DESC';

      const containers = db.prepare(query).all(...params);
      res.json({ success: true, data: containers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
      
      if (!container) {
        return res.status(404).json({ success: false, message: '集装箱不存在' });
      }

      const yardLocation = db.prepare(
        'SELECT * FROM yard_locations WHERE container_id = ?'
      ).get(id);

      const statusFlows = db.prepare(`
        SELECT sf.*, u.name as operator_name 
        FROM status_flows sf 
        LEFT JOIN users u ON sf.operator = u.id
        WHERE sf.container_id = ? 
        ORDER BY sf.created_at
      `).all(id);

      const tasks = db.prepare(
        'SELECT * FROM tasks WHERE container_id = ? ORDER BY created_at'
      ).all(id);

      const gateAppointments = db.prepare(
        'SELECT * FROM gate_appointments WHERE container_id = ? ORDER BY created_at'
      ).all(id);

      res.json({ 
        success: true, 
        data: { 
          ...container, 
          yardLocation,
          statusFlows,
          tasks,
          gateAppointments
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { 
        container_no, 
        size_type, 
        weight, 
        seal_no, 
        vessel_plan_id,
        created_by
      } = req.body;

      if (!container_no) {
        return res.status(400).json({ 
          success: false, 
          message: '箱号为必填项' 
        });
      }

      const validation = validateContainerNo(container_no);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          message: validation.message 
        });
      }

      const existingContainer = db.prepare(
        'SELECT * FROM containers WHERE container_no = ?'
      ).get(container_no);

      if (existingContainer) {
        return res.status(400).json({ 
          success: false, 
          message: '该箱号已存在' 
        });
      }

      const id = generateId();

      const insertContainer = db.prepare(`
        INSERT INTO containers (
          id, container_no, size_type, weight, seal_no, vessel_plan_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertContainer.run(
        id,
        container_no,
        size_type,
        weight,
        seal_no,
        vessel_plan_id,
        'PENDING_ARRIVAL'
      );

      const insertStatusFlow = db.prepare(`
        INSERT INTO status_flows (
          id, container_id, from_status, to_status, action, operator, operator_role, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStatusFlow.run(
        generateId(),
        id,
        null,
        'PENDING_ARRIVAL',
        'CREATE',
        created_by,
        'DISPATCHER',
        '创建集装箱记录'
      );

      res.status(201).json({ 
        success: true, 
        data: { id, container_no } 
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
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
        
        if (!container) {
          throw new Error('集装箱不存在');
        }

        const nextStatus = getNextStatus(container.status, action);
        
        if (!nextStatus) {
          throw new Error(`当前状态 ${container.status} 不支持操作 ${action}`);
        }

        const availableActions = getAvailableActions(container.status, operator_role);
        
        if (!availableActions.includes(action) && action !== 'VIEW') {
          throw new Error(`您没有权限执行操作 ${action}`);
        }

        db.prepare(`
          UPDATE containers 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextStatus, id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, container_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          container.status,
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
          'containers',
          id,
          JSON.stringify({ from: container.status, to: nextStatus })
        );

        return { fromStatus: container.status, toStatus: nextStatus };
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

  router.post('/:id/arrival', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id, operator_role, gate_no, check_result } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const transaction = db.transaction(() => {
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
        
        if (!container) {
          throw new Error('集装箱不存在');
        }

        if (container.status !== 'PENDING_ARRIVAL') {
          throw new Error('当前状态不支持进场操作');
        }

        let newStatus;
        let action;
        let comment;

        if (check_result === 'APPROVE') {
          newStatus = 'ARRIVED';
          action = 'APPROVE';
          comment = '进场审核通过';
        } else if (check_result === 'REJECT') {
          newStatus = 'REJECTED';
          action = 'REJECT';
          comment = req.body.comment || '进场审核驳回';
        } else if (check_result === 'REQUEST_SUPPLEMENT') {
          newStatus = 'PENDING_SUPPLEMENT';
          action = 'REQUEST_SUPPLEMENT';
          comment = req.body.comment || '需要补充资料';
        } else if (check_result === 'REASSIGN') {
          newStatus = 'PENDING_ARRIVAL';
          action = 'REASSIGN';
          comment = req.body.comment || '转派处理';
        } else {
          throw new Error('无效的审核结果');
        }

        db.prepare(`
          UPDATE containers 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStatus, id);

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, container_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          container.status,
          newStatus,
          action,
          operator_id,
          operator_role,
          comment
        );

        return { oldStatus: container.status, newStatus, action };
      });

      const result = transaction();
      res.json({ 
        success: true, 
        data: { 
          from_status: result.oldStatus, 
          to_status: result.newStatus,
          action: result.action
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/allocate-yard', (req, res) => {
    try {
      const { id } = req.params;
      const { operator_id, operator_role, yard_location_id } = req.body;

      if (!operator_id) {
        return res.status(400).json({ 
          success: false, 
          message: '操作人为必填项' 
        });
      }

      const transaction = db.transaction(() => {
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
        
        if (!container) {
          throw new Error('集装箱不存在');
        }

        if (container.status !== 'ARRIVED') {
          throw new Error('当前状态不支持堆场分配');
        }

        let targetLocation;

        if (yard_location_id) {
          targetLocation = db.prepare(
            'SELECT * FROM yard_locations WHERE id = ?'
          ).get(yard_location_id);

          if (!targetLocation) {
            throw new Error('指定的堆场位置不存在');
          }

          const validation = yardEngine.validateYardAllocation(container, targetLocation);
          if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
          }
        } else {
          targetLocation = yardEngine.findAvailableYardLocation(container);
          if (!targetLocation) {
            throw new Error('没有可用的堆场位置');
          }
        }

        const success = yardEngine.allocateContainer(id, targetLocation.id);
        
        if (!success) {
          throw new Error('堆场分配失败');
        }

        const insertStatusFlow = db.prepare(`
          INSERT INTO status_flows (
            id, container_id, from_status, to_status, action, operator, operator_role, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStatusFlow.run(
          generateId(),
          id,
          container.status,
          'IN_YARD',
          'ALLOCATE_YARD',
          operator_id,
          operator_role,
          `分配至堆场位置: ${targetLocation.yard_code}-${targetLocation.bay}-${targetLocation.row}-${targetLocation.tier}`
        );

        return { 
          containerId: id,
          yardLocation: targetLocation
        };
      });

      const result = transaction();
      res.json({ 
        success: true, 
        data: { 
          container_id: result.containerId,
          yard_location: result.yardLocation
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/validate/:container_no', (req, res) => {
    try {
      const { container_no } = req.params;
      const validation = validateContainerNo(container_no);
      
      res.json({ 
        success: true, 
        data: { 
          valid: validation.valid,
          message: validation.message
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
