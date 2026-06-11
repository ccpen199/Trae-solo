import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';
const VALID_SERVICE_LEVELS = new Set(['standard', 'express', 'same_day']);

function textOr(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeServiceLevel(value: unknown) {
  return typeof value === 'string' && VALID_SERVICE_LEVELS.has(value) ? value : 'standard';
}

function generateWaybillNo() {
  return `SF${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function mapWaybillRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    waybillNo: row.waybill_no,
    senderName: row.sender_name,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverAddress: row.receiver_address,
    status: row.status,
    serviceLevel: row.service_level,
    weight: row.weight,
    fee: row.fee,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapImportBatch(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    totalCount: row.total_count,
    successCount: row.success_count,
    failedCount: row.failed_count,
    status: row.status,
    fileName: row.file_name,
    template: row.template,
    failedReasons: row.failed_reasons ? JSON.parse(row.failed_reasons) : [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapPrintBatch(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    waybillIds: row.waybill_ids ? JSON.parse(row.waybill_ids) : [],
    template: row.template,
    status: row.status,
    totalCount: row.total_count,
    printedCount: row.printed_count,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

router.get('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { status = '', search = '', page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const params: unknown[] = [CURRENT_USER_ID];
    let whereClauses = ' WHERE user_id = ?';

    if (status) {
      whereClauses += ' AND status = ?';
      params.push(status as string);
    }
    if (search) {
      whereClauses += ' AND (waybill_no LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM waybills' + whereClauses).get(...params) as { total: number };

    const rows = db.prepare('SELECT * FROM waybills' + whereClauses + ' ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(...params, limitNum, offset) as any[];

    const records = rows.map(mapWaybillRow);

    res.json({
      data: records,
      records,
      total: totalResult.total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch waybills:', error);
    res.status(500).json({ error: 'Failed to fetch waybills' });
  }
});

router.get('/counts', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const rows = db.prepare('SELECT status, COUNT(*) as count FROM waybills WHERE user_id = ? GROUP BY status').all(CURRENT_USER_ID) as any[];
    const counts: Record<string, number> = { '': 0 };
    for (const row of rows) {
      counts[row.status] = row.count;
      counts[''] += row.count;
    }
    res.json(counts);
  } catch (error) {
    console.error('Failed to fetch waybill counts:', error);
    res.status(500).json({ error: 'Failed to fetch waybill counts' });
  }
});

router.get('/import-batches', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM import_batches WHERE user_id = ?')
      .get(CURRENT_USER_ID) as { total: number };
    const rows = db.prepare('SELECT * FROM import_batches WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(CURRENT_USER_ID, limitNum, offset) as any[];

    res.json({
      data: rows.map(mapImportBatch),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch import batches:', error);
    res.status(500).json({ error: 'Failed to fetch import batches' });
  }
});

router.get('/import-batches/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM import_batches WHERE id = ? AND user_id = ?')
      .get(req.params.id, CURRENT_USER_ID) as any;
    if (!row) {
      res.status(404).json({ error: 'Import batch not found' });
      return;
    }
    res.json(mapImportBatch(row));
  } catch (error) {
    console.error('Failed to fetch import batch:', error);
    res.status(500).json({ error: 'Failed to fetch import batch' });
  }
});

router.get('/print-batches', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM print_batches WHERE user_id = ?')
      .get(CURRENT_USER_ID) as { total: number };
    const rows = db.prepare('SELECT * FROM print_batches WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(CURRENT_USER_ID, limitNum, offset) as any[];

    res.json({
      data: rows.map(mapPrintBatch),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch print batches:', error);
    res.status(500).json({ error: 'Failed to fetch print batches' });
  }
});

router.get('/print-batches/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM print_batches WHERE id = ? AND user_id = ?')
      .get(req.params.id, CURRENT_USER_ID) as any;
    if (!row) {
      res.status(404).json({ error: 'Print batch not found' });
      return;
    }
    const batch = mapPrintBatch(row);
    const waybills = db.prepare(`SELECT * FROM waybills WHERE id IN (${batch.waybillIds.map(() => '?').join(',')})`)
      .all(...batch.waybillIds) as any[];
    res.json({ ...batch, waybills: waybills.map(mapWaybillRow) });
  } catch (error) {
    console.error('Failed to fetch print batch:', error);
    res.status(500).json({ error: 'Failed to fetch print batch' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM waybills WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!row) {
      res.status(404).json({ error: 'Waybill not found' });
      return;
    }
    res.json(mapWaybillRow(row));
  } catch (error) {
    console.error('Failed to fetch waybill:', error);
    res.status(500).json({ error: 'Failed to fetch waybill' });
  }
});

router.post('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const {
      waybillNo, senderName, senderPhone, senderAddress,
      receiverName, receiverPhone, receiverAddress,
      serviceLevel, weight, fee,
    } = req.body ?? {};

    const id = `w${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let safeWaybillNo = textOr(waybillNo, generateWaybillNo());
    const existing = db.prepare('SELECT COUNT(*) as count FROM waybills WHERE waybill_no = ?').get(safeWaybillNo) as { count: number };
    if (existing.count > 0) {
      safeWaybillNo = generateWaybillNo();
    }

    const safeSenderName = textOr(senderName, '张伟');
    const safeSenderPhone = textOr(senderPhone, '138****8888');
    const safeSenderAddress = textOr(senderAddress, '上海市浦东新区张江高科技园区博云路2号');
    const safeReceiverName = textOr(receiverName, '李娜');
    const safeReceiverPhone = textOr(receiverPhone, '139****6666');
    const safeReceiverAddress = textOr(receiverAddress, '北京市海淀区中关村大街27号中关村大厦');
    const safeWeight = numberOr(weight, 2);
    const safeFee = numberOr(fee, 18);
    const safeService = normalizeServiceLevel(serviceLevel);
    const serviceLabel = safeService === 'same_day' ? '当日达' : safeService === 'express' ? '次日达' : '标准快递';

    db.prepare(
      `INSERT INTO waybills (id, user_id, waybill_no, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, status, service_level, weight, fee, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?, ?)`
    ).run(
      id,
      CURRENT_USER_ID,
      safeWaybillNo,
      safeSenderName,
      safeSenderPhone,
      safeSenderAddress,
      safeReceiverName,
      safeReceiverPhone,
      safeReceiverAddress,
      safeService,
      safeWeight,
      safeFee,
      now,
      now
    );

    const trackingId = `tn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    db.prepare(
      `INSERT INTO tracking_nodes (id, waybill_id, time, location, status, description)
       VALUES (?, ?, ?, ?, 'created', ?)`
    ).run(
      trackingId, id, now,
      safeSenderAddress,
      `运单已创建 · ${serviceLabel} · 重量${safeWeight}kg · 运费¥${safeFee} · 寄件人:${safeSenderName}`
    );

    try {
      db.prepare(
        `INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, created_at)
         VALUES (?, ?, 'waybill_create', 'waybill', ?, ?, ?)`
      ).run(
        `al-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        CURRENT_USER_ID,
        id,
        JSON.stringify({ waybillNo: safeWaybillNo, serviceLevel: safeService, weight: safeWeight, fee: safeFee }),
        now
      );
    } catch (_) {}

    const row = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;
    res.status(201).json(mapWaybillRow(row));
  } catch (error) {
    console.error('Failed to create waybill:', error);
    res.status(500).json({ error: 'Failed to create waybill' });
  }
});

router.post('/batch', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { waybills, fileName = '批量导入', template = 'standard' } = req.body;
    const inputWaybills = Array.isArray(waybills) ? waybills : [];

    const batchId = `ib${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const failedReasons: { row: number; waybillNo?: string; reason: string }[] = [];
    let successCount = 0;

    const insert = db.prepare(
      `INSERT OR IGNORE INTO waybills (id, user_id, waybill_no, sender_name, sender_address, receiver_name, receiver_address, status, service_level, weight, fee, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?, ?)`
    );

    const checkWaybillNo = db.prepare('SELECT COUNT(*) as count FROM waybills WHERE waybill_no = ?');

    const transaction = db.transaction(() => {
      for (let i = 0; i < inputWaybills.length; i++) {
        const wb = inputWaybills[i];
        const rowNum = i + 1;

        if (!wb.waybillNo) {
          failedReasons.push({ row: rowNum, reason: '运单号不能为空' });
          continue;
        }
        if (!wb.receiverName) {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '收件人姓名为空' });
          continue;
        }
        if (!wb.receiverAddress) {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '收件地址不完整' });
          continue;
        }
        if (wb.receiverPhone && !/^1[3-9]\d{9}$/.test(wb.receiverPhone)) {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '收件人手机号格式错误' });
          continue;
        }
        if (wb.weight && wb.weight > 50) {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '重量超出范围（>50kg）' });
          continue;
        }

        const existing = checkWaybillNo.get(wb.waybillNo) as { count: number };
        if (existing.count > 0) {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '运单号已存在' });
          continue;
        }

        const id = `w${Date.now()}-${i}`;
        const result = insert.run(
          id, CURRENT_USER_ID, wb.waybillNo,
          wb.senderName || '未知',
          wb.senderAddress || '未知地址',
          wb.receiverName,
          wb.receiverAddress,
          wb.serviceLevel || 'standard',
          wb.weight || 1,
          wb.fee || 12,
          now, now
        );
        if (result.changes > 0) {
          successCount++;
        } else {
          failedReasons.push({ row: rowNum, waybillNo: wb.waybillNo, reason: '导入失败，请重试' });
        }
      }
    });

    transaction();

    db.prepare(
      `INSERT INTO import_batches (id, user_id, total_count, success_count, failed_count, status, file_name, template, failed_reasons, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)`
    ).run(
      batchId, CURRENT_USER_ID, inputWaybills.length, successCount, failedReasons.length,
      fileName, template, JSON.stringify(failedReasons), now, now
    );

    if (failedReasons.length > 0) {
      try {
        const todoId = `td-imp-${Date.now()}`;
        db.prepare(
          `INSERT OR IGNORE INTO todos (id, user_id, type, title, description, deadline, link, created_at)
           VALUES (?, ?, 'import', ?, ?, datetime('now', '+1 day'), ?, ?)`
        ).run(
          todoId, CURRENT_USER_ID,
          `导入批次${failedReasons.length}条失败需处理`,
          `文件: ${fileName} · 成功 ${successCount} / 失败 ${failedReasons.length} · 请核对 ${failedReasons[0].reason} 等${failedReasons.length}条记录`,
          `/waybill?batch=${batchId}`,
          now
        );
      } catch {}
    }
    if (successCount > 0) {
      try {
        const todoId = `td-prt-${Date.now()}-1`;
        db.prepare(
          `INSERT OR IGNORE INTO todos (id, user_id, type, title, description, deadline, link, created_at)
           VALUES (?, ?, 'print', ?, ?, datetime('now', '+4 hours'), ?, ?)`
        ).run(
          todoId, CURRENT_USER_ID,
          `${successCount}条运单待批量打印`,
          `批次: ${fileName} · 已成功导入 ${successCount} 条运单，请及时打印面单安排取件`,
          `/waybill?print=${batchId}`,
          now
        );
      } catch {}
    }

    try {
      const auditId = `al-import-${Date.now()}`;
      db.prepare(
        `INSERT INTO audit_logs (id, user_id, operator, action, target, detail, created_at)
         VALUES (?, ?, ?, 'batch_import', ?, ?, ?)`
      ).run(
        auditId, CURRENT_USER_ID, '当前用户',
        `import_batch/${batchId}`,
        `电商批量导入 | 文件:${fileName} | 模板:${template} | 总数:${inputWaybills.length} | 成功:${successCount} | 失败:${failedReasons.length}`,
        now
      );
    } catch {}

    const batch = db.prepare('SELECT * FROM import_batches WHERE id = ?').get(batchId);
    res.json(mapImportBatch(batch));
  } catch (error) {
    console.error('Batch import failed:', error);
    res.status(500).json({ error: 'Batch import failed' });
  }
});

router.post('/merchant-import', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { platform = 'taobao', count = 15, template = 'merchant' } = req.body ?? {};
    const safeCount = Math.min(Math.max(parseInt(count, 10) || 15, 3, 30), 50);

    const platformLabelMap: Record<string, string> = {
      taobao: '淘宝店铺', tmall: '天猫旗舰店', jd: '京东自营', pinduoduo: '拼多多店铺', douyin: '抖音小店',
    };
    const label = platformLabelMap[platform] || `电商(${platform})`;

    const cityMap = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆'];
    const streetMap = ['建国路88号', '陆家嘴环路100号', '珠江新城华夏路30号', '科技园路1号', '文三路478号', '天府大道999号', '中山大道200号', '中山路300号'];
    const firstNames = ['张', '李', '王', '赵', '孙', '周', '吴', '郑', '陈', '刘'];
    const lastNames = ['三', '明', '芳', '六', '七', '八', '九', '十', '伟', '丽'];
    const phoneTail = () => Math.floor(100000000 + Math.random() * 899999999).toString();

    const waybills = Array.from({ length: safeCount }, (_, i) => {
      const city = cityMap[Math.floor(Math.random() * cityMap.length)];
      const street = streetMap[Math.floor(Math.random() * streetMap.length)];
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const weight = +(0.5 + Math.random() * 3.5).toFixed(2);
      const slIdx = Math.random() > 0.7 ? 1 : Math.random() > 0.5 ? 2 : 0;
      const serviceLevels = ['standard', 'express', 'same_day'];
      const feeLevels = [12, 18, 28];
      return {
        waybillNo: `DS${Date.now().toString().slice(-6)}${String(i).padStart(3, '0')}`,
        senderName: label + '(商家发货)',
        senderAddress: `${cityMap[i % cityMap.length]}市高新区电商产业园A${i + 1}栋`,
        receiverName: fn + ln,
        receiverPhone: `138${phoneTail().slice(0, 8)}`,
        receiverAddress: `${city}市${street.slice(0, 2)}区${street} ${100 + i}号 ${101 + i}室`,
        serviceLevel: serviceLevels[slIdx],
        weight,
        fee: feeLevels[slIdx] + +((weight - 1) * 2.5).toFixed(2),
      };
    });

    req.body = {
      waybills,
      fileName: `${label}-${new Date().toISOString().slice(0, 10)}-${safeCount}单.xlsx`,
      template,
    };
    const batchRoute = router.stack.find((r: any) => r.route && r.route.path === '/batch' && r.route.methods.post);
    if (batchRoute && batchRoute.route && batchRoute.route.stack && batchRoute.route.stack[0]) {
      return batchRoute.route.stack[0].handle(req, res, () => {});
    }
    res.status(500).json({ error: 'Batch handler not found' });
  } catch (error) {
    console.error('Merchant import failed:', error);
    res.status(500).json({ error: 'Merchant import failed' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const {
      senderName, senderAddress, receiverName, receiverAddress, status, serviceLevel, weight, fee,
    } = req.body;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(
      `UPDATE waybills SET
        sender_name = COALESCE(?, sender_name),
        sender_address = COALESCE(?, sender_address),
        receiver_name = COALESCE(?, receiver_name),
        receiver_address = COALESCE(?, receiver_address),
        status = COALESCE(?, status),
        service_level = COALESCE(?, service_level),
        weight = COALESCE(?, weight),
        fee = COALESCE(?, fee),
        updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(
      senderName ?? null, senderAddress ?? null, receiverName ?? null, receiverAddress ?? null,
      status ?? null, serviceLevel ?? null, weight ?? null, fee ?? null,
      now, req.params.id, CURRENT_USER_ID
    );

    const row = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id) as any;
    res.json(mapWaybillRow(row));
  } catch (error) {
    console.error('Failed to update waybill:', error);
    res.status(500).json({ error: 'Failed to update waybill' });
  }
});

router.post('/print', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { waybillIds = [], template = 'standard' } = req.body;

    if (!Array.isArray(waybillIds) || waybillIds.length === 0) {
      res.status(400).json({ error: 'No waybills selected' });
      return;
    }

    const batchId = `pb${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(
      `INSERT INTO print_batches (id, user_id, waybill_ids, template, status, total_count, printed_count, created_at)
       VALUES (?, ?, ?, ?, 'printing', ?, 0, ?)`
    ).run(batchId, CURRENT_USER_ID, JSON.stringify(waybillIds), template, waybillIds.length, now);

    try {
      const auditId = `al-print-${Date.now()}`;
      db.prepare(
        `INSERT INTO audit_logs (id, user_id, operator, action, target, detail, created_at)
         VALUES (?, ?, ?, 'batch_print', ?, ?, ?)`
      ).run(
        auditId, CURRENT_USER_ID, '当前用户',
        `print_batch/${batchId}`,
        `批量打印任务创建 | 模板:${template} | 面单数量:${waybillIds.length}`,
        now
      );
    } catch {}

    setTimeout(() => {
      try {
        const printed = Math.max(0, waybillIds.length - (Math.random() > 0.55 ? Math.ceil(waybillIds.length * 0.15) : 0));
        const failed = waybillIds.length - printed;
        const status = failed > 0 && Math.random() > 0.5 ? 'failed' : 'completed';
        const completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        db.prepare(
          `UPDATE print_batches SET status = ?, printed_count = ?, completed_at = ? WHERE id = ?`
        ).run(status, printed, completedAt, batchId);

        if (failed > 0) {
          try {
            const todoId = `td-pf-${Date.now()}`;
            db.prepare(
              `INSERT OR IGNORE INTO todos (id, user_id, type, title, description, deadline, link, created_at)
               VALUES (?, ?, 'print', ?, ?, datetime('now', '+2 hours'), ?, ?)`
            ).run(
              todoId, CURRENT_USER_ID,
              `打印批次${failed}张面单失败`,
              `模板: ${template} · 打印 ${printed}/${waybillIds.length} · 请检查打印机连接后重试 ${failed} 张`,
              `/waybill?pbatch=${batchId}`,
              completedAt
            );
          } catch {}
        }
      } catch (e) { console.error('print completion error:', e); }
    }, 2000);

    const row = db.prepare('SELECT * FROM print_batches WHERE id = ?').get(batchId) as any;
    res.json(mapPrintBatch(row));
  } catch (error) {
    console.error('Print failed:', error);
    res.status(500).json({ error: 'Print failed' });
  }
});

export default router;
