import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const vehiclePlate = req.query.vehiclePlate || '';
    const gantryId = req.query.gantryId || '';
    const stationId = req.query.stationId || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND t.exit_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND t.exit_time <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (vehiclePlate) {
      where += ' AND t.vehicle_plate = ?';
      params.push(vehiclePlate);
    }
    if (gantryId) {
      where += ' AND t.gantry_id = ?';
      params.push(gantryId);
    }
    if (stationId) {
      where += ' AND t.toll_station_id = ?';
      params.push(stationId);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM toll_records t ${where}`).get(...params).count;
    const list = db.prepare(`
      SELECT t.*,
        a.account_no, u.real_name AS user_name, u.vehicle_plate AS account_plate,
        e.id AS exception_id, e.type AS exception_type, e.status AS exception_status,
        d.id AS dispute_id, d.status AS dispute_status,
        s.id AS settlement_id, s.status AS settlement_status,
        CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS has_exception,
        CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END AS has_dispute
      FROM toll_records t
      LEFT JOIN etc_accounts a ON t.account_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN exception_events e ON e.id = (
        SELECT ee.id FROM exception_events ee
        WHERE ee.toll_record_id = t.id
        ORDER BY ee.id DESC LIMIT 1
      )
      LEFT JOIN disputes d ON d.id = (
        SELECT dd.id FROM disputes dd
        WHERE dd.exception_event_id = e.id
        ORDER BY dd.id DESC LIMIT 1
      )
      LEFT JOIN settlements s ON s.id = (
        SELECT ss.id FROM settlements ss
        WHERE DATE(t.exit_time) BETWEEN ss.period_start AND ss.period_end
        ORDER BY ss.id DESC LIMIT 1
      )
      ${where}
      ORDER BY t.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trajectory', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { vehicle_plate, startDate, endDate } = req.query;

    if (!vehicle_plate) {
      return res.status(400).json({ error: '车牌号不能为空' });
    }

    let where = 'WHERE vehicle_plate = ?';
    const params = [vehicle_plate];

    if (startDate) {
      where += ' AND exit_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND exit_time <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const records = db.prepare(`SELECT * FROM toll_records ${where} ORDER BY exit_time ASC`).all(...params);

    const trajectory = records.map(r => ({
      gantry_id: r.gantry_id,
      gantry_name: r.gantry_name,
      toll_station_id: r.toll_station_id,
      toll_station_name: r.toll_station_name,
      entry_time: r.entry_time,
      exit_time: r.exit_time,
      fee: r.fee,
      road_segment: r.road_segment
    }));

    res.json({ vehicle_plate, total: records.length, trajectory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const record = db.prepare(`
      SELECT t.*, a.account_no
      FROM toll_records t
      LEFT JOIN etc_accounts a ON t.account_id = a.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: '通行记录不存在' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { account_id, gantry_id, gantry_name, toll_station_id, toll_station_name, entry_time, exit_time, fee, vehicle_plate, road_segment, evidence_urls } = req.body;

    const validationErrors = [];

    if (!account_id) {
      validationErrors.push('账户ID不能为空');
    }
    if (!gantry_id && !toll_station_id) {
      validationErrors.push('门架ID和收费站ID至少填写一个');
    }
    if (!entry_time && !exit_time) {
      validationErrors.push('入口时间和出口时间至少填写一个');
    }
    if (entry_time && exit_time && new Date(exit_time) < new Date(entry_time)) {
      validationErrors.push('出口时间不能早于入口时间');
    }
    if (fee != null && fee < 0) {
      validationErrors.push('费用不能为负数');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: '数据校验失败', errors: validationErrors });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(account_id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const warnings = [];
    let autoException = null;

    if (entry_time && exit_time) {
      const entry = new Date(entry_time);
      const exit = new Date(exit_time);
      const durationMs = exit - entry;
      const durationMin = durationMs / 60000;
      if (durationMin < 1) {
        warnings.push('通行时间异常短，可能存在路径缺失');
      }
      if (durationMin > 480) {
        warnings.push('通行时间异常长（超过8小时）');
      }
    }

    if (fee != null && fee > 500) {
      warnings.push('费用超过500元，建议复核');
    }

    if (!gantry_id || !toll_station_id) {
      warnings.push('门架或收费站信息不完整，可能影响路径还原');
    }

    const result = db.prepare(`
      INSERT INTO toll_records (account_id, gantry_id, gantry_name, toll_station_id, toll_station_name, entry_time, exit_time, fee, vehicle_plate, road_segment, evidence_urls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      account_id, gantry_id || null, gantry_name || null, toll_station_id || null, toll_station_name || null,
      entry_time || null, exit_time || null, fee || 0, vehicle_plate || null, road_segment || null,
      evidence_urls ? JSON.stringify(evidence_urls) : null
    );

    if (warnings.length > 0) {
      const exceptionType = warnings.some(w => w.includes('路径缺失')) ? 'path_missing'
        : warnings.some(w => w.includes('费用超过')) ? 'deduction_failed'
        : 'deduction_failed';

      const excResult = db.prepare(`
        INSERT INTO exception_events (type, toll_record_id, account_id, description, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(exceptionType, result.lastInsertRowid, account_id, warnings.join('；'));
      autoException = { id: excResult.lastInsertRowid, type: exceptionType, warnings };
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_toll_record', 'toll_record', result.lastInsertRowid,
        JSON.stringify({ account_id, fee, warnings, auto_exception: autoException }), req.ip);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: autoException ? '通行记录已创建，系统自动检测到异常并生成事件' : '通行记录创建成功',
      warnings,
      auto_exception: autoException
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
