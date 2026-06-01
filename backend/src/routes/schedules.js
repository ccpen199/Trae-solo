const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

function checkBerthConflict(berthId, startTime, endTime, excludeScheduleId = null) {
  let query = `
    SELECT * FROM schedules 
    WHERE berth_id = ? 
    AND status != 'cancelled'
    AND (
      (start_time < ? AND end_time > ?)
      OR (start_time < ? AND end_time > ?)
      OR (start_time >= ? AND end_time <= ?)
    )
  `;
  let params = [berthId, endTime, startTime, endTime, startTime, startTime, endTime];
  
  if (excludeScheduleId) {
    query += ' AND id != ?';
    params.push(excludeScheduleId);
  }
  
  return db.prepare(query).all(...params);
}

function checkTideWindow(draft, startTime, endTime) {
  const startDate = new Date(startTime).toISOString().split('T')[0];
  const endDate = new Date(endTime).toISOString().split('T')[0];
  
  const tides = db.prepare(`
    SELECT * FROM tides 
    WHERE date BETWEEN ? AND ?
    ORDER BY date, time
  `).all(startDate, endDate);
  
  let hasValidWindow = false;
  let minHeight = Infinity;
  
  for (const tide of tides) {
    if (tide.height >= draft) {
      hasValidWindow = true;
    }
    if (tide.height < minHeight) {
      minHeight = tide.height;
    }
  }
  
  return { valid: hasValidWindow, minHeight, requiredHeight: draft, tides };
}

function createNotification(role, message, relatedType, relatedId) {
  db.prepare(`
    INSERT INTO notifications (role, message, related_type, related_id)
    VALUES (?, ?, ?, ?)
  `).run(role, message, relatedType, relatedId);
}

router.get('/', (req, res) => {
  try {
    const schedules = db.prepare(`
      SELECT sc.*, 
             s.name as ship_name,
             s.voyage,
             s.draft,
             s.cargo_type,
             s.is_complete as data_complete,
             b.name as berth_name,
             b.length as berth_length,
             b.max_draft as draft_limit,
             b.allow_dangerous as dangerous_goods_allowed
      FROM schedules sc
      JOIN ships s ON sc.ship_id = s.id
      LEFT JOIN berths b ON sc.berth_id = b.id
      ORDER BY sc.start_time ASC
    `).all();
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gantt', (req, res) => {
  try {
    const berths = db.prepare('SELECT * FROM berths ORDER BY name').all();
    const schedules = db.prepare(`
      SELECT sc.*, 
             s.name as ship_name,
             s.voyage,
             s.priority,
             s.cargo_type,
             b.name as berth_name
      FROM schedules sc
      JOIN ships s ON sc.ship_id = s.id
      LEFT JOIN berths b ON sc.berth_id = b.id
      WHERE sc.status != 'cancelled'
      ORDER BY sc.start_time ASC
    `).all();
    
    res.json({ success: true, data: { berths, schedules } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/validate', (req, res) => {
  try {
    const { ship_id, berth_id, start_time, end_time, exclude_schedule_id } = req.body;
    
    const ship = db.prepare('SELECT * FROM ships WHERE id = ?').get(ship_id);
    if (!ship) {
      return res.json({ success: true, valid: false, conflicts: ['船舶不存在'] });
    }
    
    if (!ship.is_complete) {
      return res.json({ success: true, valid: false, conflicts: ['船舶资料不完整，无法锁定泊位'] });
    }
    
    const conflicts = [];
    
    if (berth_id) {
      const berth = db.prepare('SELECT * FROM berths WHERE id = ?').get(berth_id);
      if (!berth) {
        conflicts.push('泊位不存在');
      } else {
        if (ship.draft > berth.max_draft) {
          conflicts.push(`船舶吃水(${ship.draft}m)超过泊位吃水限制(${berth.max_draft}m)`);
        }
        
        if (!berth.allow_dangerous) {
          conflicts.push('该泊位不允许危险品作业');
        }
        
        const overlapping = checkBerthConflict(berth_id, start_time, end_time, exclude_schedule_id);
        if (overlapping.length > 0) {
          const conflictShips = overlapping.map(s => {
            const ship = db.prepare('SELECT name FROM ships WHERE id = ?').get(s.ship_id);
            return ship ? ship.name : '未知船舶';
          });
          conflicts.push(`与其他船舶作业时间冲突: ${conflictShips.join(', ')}`);
        }
      }
      
      const tideCheck = checkTideWindow(ship.draft, start_time, end_time);
      if (!tideCheck.valid) {
        conflicts.push(`潮汐高度不足: 最低潮高${tideCheck.minHeight}m，需要${tideCheck.requiredHeight}m`);
      }
    }
    
    res.json({ 
      success: true, 
      valid: conflicts.length === 0, 
      conflicts 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { ship_id, berth_id, start_time, end_time } = req.body;
    
    const validation = db.prepare(`
      SELECT is_complete as data_complete FROM ships WHERE id = ?
    `).get(ship_id);
    
    if (!validation) {
      return res.status(400).json({ success: false, error: '船舶不存在' });
    }
    
    if (!validation.data_complete) {
      return res.status(400).json({ success: false, error: '船舶资料不完整，无法锁定泊位' });
    }
    
    const result = db.prepare(`
      INSERT INTO schedules (ship_id, berth_id, start_time, end_time, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `).run(ship_id, berth_id, start_time, end_time);
    
    db.prepare('UPDATE ships SET status = ? WHERE id = ?').run('scheduled', ship_id);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: '排程不存在' });
    }
    
    const { berth_id, start_time, end_time, status, adjustment_reason } = req.body;
    
    const oldValues = {
      berth_id: schedule.berth_id,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      status: schedule.status
    };
    
    db.prepare(`
      UPDATE schedules 
      SET berth_id=?, start_time=?, end_time=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(berth_id, start_time, end_time, status, req.params.id);
    
    let adjustmentType = 'update';
    if (status === 'delayed') adjustmentType = 'delay';
    else if (status === 'cancelled') adjustmentType = 'cancel';
    else if (berth_id !== schedule.berth_id) adjustmentType = 'reassign';
    
    db.prepare(`
      INSERT INTO adjustments (schedule_id, adjustment_type, reason, old_value, new_value, notified_roles)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      adjustmentType,
      adjustment_reason || '',
      JSON.stringify(oldValues),
      JSON.stringify({ berth_id, start_time, end_time, status }),
      'dispatcher,agent,yard,terminal'
    );
    
    const roles = ['dispatcher', 'agent', 'yard', 'terminal'];
    const messages = {
      delay: '船舶作业时间已延迟',
      cancel: '船舶靠泊计划已取消',
      reassign: '船舶已改靠新泊位',
      update: '船舶排程已更新'
    };
    
    roles.forEach(role => {
      createNotification(role, messages[adjustmentType] || messages.update, 'schedule', req.params.id);
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('BEGIN').run();
    
    const schedule = db.prepare('SELECT ship_id FROM schedules WHERE id = ?').get(req.params.id);
    
    db.prepare('DELETE FROM assignments WHERE schedule_id = ?').run(req.params.id);
    db.prepare('DELETE FROM adjustments WHERE schedule_id = ?').run(req.params.id);
    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
    
    if (schedule) {
      db.prepare('UPDATE ships SET status = ? WHERE id = ?').run('planned', schedule.ship_id);
    }
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
