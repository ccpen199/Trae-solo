import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';

const mockAddresses = [
  '北京市朝阳区建国路88号',
  '上海市浦东新区陆家嘴环路100号',
  '广州市天河区珠江新城华夏路30号',
  '深圳市南山区科技园路1号',
  '杭州市西湖区文三路478号',
  '成都市武侯区天府大道999号',
  '武汉市江汉区中山大道200号',
  '南京市鼓楼区中山路300号',
];
const mockNames = ['张三', '李明', '王芳', '赵六', '孙七', '周八', '吴九', '郑十'];
const mockPhones = ['13800138001', '13900139001', '13700137001', '13600136001', '13500135001'];

function generateWaybillNo() {
  const seq = String(Math.floor(Math.random() * 9999999)).padStart(7, '0');
  return `SF${new Date().getFullYear()}${seq}`;
}

const REVIEW_STATUS = {
  AUTO_PASS: 'auto_pass',
  MANUAL_EDITED: 'manual_edited',
  PENDING_REVIEW: 'pending_review',
  REVIEW_PASSED: 'review_passed',
} as const;

function mapRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    waybillNo: row.waybill_no,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    scanType: row.scan_type,
    confidence: row.confidence,
    isEdited: !!row.is_edited,
    reviewStatus: row.review_status || (row.confidence >= 0.85 ? REVIEW_STATUS.AUTO_PASS : REVIEW_STATUS.PENDING_REVIEW),
    reviewConclusion: row.review_conclusion || '',
    reviewer: row.reviewer || '',
    reviewedAt: row.reviewed_at || undefined,
    syncedWaybillId: row.synced_waybill_id || undefined,
    syncedTracking: !!row.synced_tracking,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateScanResult(scanType: 'barcode' | 'ocr') {
  const confidence = scanType === 'barcode'
    ? +(0.95 + Math.random() * 0.05).toFixed(2)
    : +(0.6 + Math.random() * 0.3).toFixed(2);
  return {
    waybillNo: generateWaybillNo(),
    senderName: mockNames[Math.floor(Math.random() * mockNames.length)],
    senderPhone: mockPhones[Math.floor(Math.random() * mockPhones.length)],
    senderAddress: mockAddresses[Math.floor(Math.random() * mockAddresses.length)],
    receiverName: mockNames[Math.floor(Math.random() * mockNames.length)],
    receiverPhone: mockPhones[Math.floor(Math.random() * mockPhones.length)],
    receiverAddress: mockAddresses[Math.floor(Math.random() * mockAddresses.length)],
    scanType,
    confidence,
  };
}

router.post('/barcode', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const result = generateScanResult('barcode');
    const id = `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      `INSERT INTO scan_records (id, user_id, waybill_no, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, scan_type, confidence, is_edited, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(
      id, CURRENT_USER_ID, result.waybillNo,
      result.senderName, result.senderPhone, result.senderAddress,
      result.receiverName, result.receiverPhone, result.receiverAddress,
      result.scanType, result.confidence, now, now
    );
    const row = db.prepare('SELECT * FROM scan_records WHERE id = ?').get(id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('Barcode scan failed:', error);
    res.status(500).json({ error: 'Barcode scan failed' });
  }
});

router.post('/ocr', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const result = generateScanResult('ocr');
    const id = `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      `INSERT INTO scan_records (id, user_id, waybill_no, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, scan_type, confidence, is_edited, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(
      id, CURRENT_USER_ID, result.waybillNo,
      result.senderName, result.senderPhone, result.senderAddress,
      result.receiverName, result.receiverPhone, result.receiverAddress,
      result.scanType, result.confidence, now, now
    );
    const row = db.prepare('SELECT * FROM scan_records WHERE id = ?').get(id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('OCR scan failed:', error);
    res.status(500).json({ error: 'OCR scan failed' });
  }
});

router.get('/history', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { page = '1', limit = '20', scanType } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ' WHERE user_id = ?';
    const params: unknown[] = [CURRENT_USER_ID];

    if (scanType) {
      whereClauses += ' AND scan_type = ?';
      params.push(scanType as string);
    }

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM scan_records' + whereClauses).get(...params) as { total: number };
    const rows = db.prepare('SELECT * FROM scan_records' + whereClauses + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').all(...params, limitNum, offset) as any[];

    res.json({
      data: rows.map(mapRow),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch scan history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM scan_records WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!row) {
      res.status(404).json({ error: 'Scan record not found' });
      return;
    }
    res.json(mapRow(row));
  } catch (error) {
    console.error('Failed to fetch scan record:', error);
    res.status(500).json({ error: 'Failed to fetch scan record' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM scan_records WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!existing) {
      res.status(404).json({ error: 'Scan record not found' });
      return;
    }

    const {
      waybillNo, senderName, senderPhone, senderAddress,
      receiverName, receiverPhone, receiverAddress,
      reviewer, manualReview,
    } = req.body;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const hasManualEdits = !!(
      (waybillNo && waybillNo !== existing.waybill_no) ||
      (senderName && senderName !== existing.sender_name) ||
      (senderPhone && senderPhone !== existing.sender_phone) ||
      (senderAddress && senderAddress !== existing.sender_address) ||
      (receiverName && receiverName !== existing.receiver_name) ||
      (receiverPhone && receiverPhone !== existing.receiver_phone) ||
      (receiverAddress && receiverAddress !== existing.receiver_address)
    );

    const finalConfidence = existing.confidence;
    let reviewStatus: string;
    let reviewConclusion: string;
    let reviewerName = reviewer || '';

    if (manualReview) {
      reviewStatus = REVIEW_STATUS.REVIEW_PASSED;
      reviewConclusion = `人工复核通过 · ${hasManualEdits ? '已修正寄收件信息' : '信息完整无误'}`;
      reviewerName = reviewerName || '人工复核员';
    } else if (hasManualEdits) {
      reviewStatus = REVIEW_STATUS.MANUAL_EDITED;
      reviewConclusion = `用户编辑保存 · ${finalConfidence >= 0.85 ? '原置信度达标' : '原置信度不足(' + Math.round(finalConfidence * 100) + '%)'}`;
      reviewerName = reviewerName || '当前用户';
    } else if (finalConfidence >= 0.85) {
      reviewStatus = REVIEW_STATUS.AUTO_PASS;
      reviewConclusion = '系统自动复核通过 · 字段置信度达标';
      reviewerName = reviewerName || '系统自动';
    } else {
      reviewStatus = REVIEW_STATUS.PENDING_REVIEW;
      reviewConclusion = '待人工复核 · 低置信度字段需确认';
      reviewerName = '';
    }

    const finalWaybillNo = waybillNo || existing.waybill_no;

    db.prepare(
      `UPDATE scan_records SET
        waybill_no = COALESCE(?, waybill_no),
        sender_name = COALESCE(?, sender_name),
        sender_phone = COALESCE(?, sender_phone),
        sender_address = COALESCE(?, sender_address),
        receiver_name = COALESCE(?, receiver_name),
        receiver_phone = COALESCE(?, receiver_phone),
        receiver_address = COALESCE(?, receiver_address),
        is_edited = CASE WHEN ? = 1 THEN 1 ELSE is_edited END,
        review_status = ?,
        review_conclusion = ?,
        reviewer = ?,
        reviewed_at = ?,
        updated_at = ?
       WHERE id = ?`
    ).run(
      waybillNo ?? null,
      senderName ?? null,
      senderPhone ?? null,
      senderAddress ?? null,
      receiverName ?? null,
      receiverPhone ?? null,
      receiverAddress ?? null,
      hasManualEdits ? 1 : 0,
      reviewStatus,
      reviewConclusion,
      reviewerName,
      reviewStatus !== REVIEW_STATUS.PENDING_REVIEW ? now : null,
      now,
      req.params.id
    );

    let syncedWaybillId = existing.synced_waybill_id;

    if (reviewStatus !== REVIEW_STATUS.PENDING_REVIEW && !syncedWaybillId) {
      const weight = +(0.5 + Math.random() * 4.5).toFixed(2);
      const feeLevels = [12, 18, 28];
      const serviceLevels = ['standard', 'express', 'same_day'];
      const svcIdx = Math.floor(Math.random() * 3);
      const baseFee = feeLevels[svcIdx];
      const fee = +(baseFee + (weight - 1) * 3).toFixed(2);

      syncedWaybillId = `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      db.prepare(
        `INSERT INTO waybills (id, user_id, waybill_no, sender_name, sender_address, receiver_name, receiver_address, status, service_level, weight, fee, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?, ?)`
      ).run(
        syncedWaybillId, CURRENT_USER_ID,
        finalWaybillNo,
        senderName || existing.sender_name,
        senderAddress || existing.sender_address,
        receiverName || existing.receiver_name,
        receiverAddress || existing.receiver_address,
        serviceLevels[svcIdx], weight, fee,
        now, now
      );

      const trackingId = `tn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      db.prepare(
        `INSERT INTO tracking_nodes (id, waybill_id, time, location, status, description)
         VALUES (?, ?, ?, ?, 'created', ?)`
      ).run(
        trackingId, syncedWaybillId, now,
        senderAddress || existing.sender_address,
        `运单已创建 · 来源:面单${existing.scan_type === 'barcode' ? '扫码' : 'OCR'}识别 (${reviewConclusion})`
      );

      db.prepare(
        `UPDATE scan_records SET synced_waybill_id = ?, synced_tracking = 1 WHERE id = ?`
      ).run(syncedWaybillId, req.params.id);

      const auditId = `al${Date.now()}`;
      db.prepare(
        `INSERT INTO audit_logs (id, user_id, operator, action, target, detail, created_at)
         VALUES (?, ?, ?, 'scan_sync', ?, ?, ?)`
      ).run(
        auditId, CURRENT_USER_ID, reviewerName || '系统自动',
        `waybill/${syncedWaybillId}`,
        `面单识别同步运单 | 运单号: ${finalWaybillNo} | 复核: ${reviewConclusion} | 置信度: ${Math.round(finalConfidence * 100)}% | 服务: ${serviceLevels[svcIdx]} | 费用: ¥${fee} | 审核人: ${reviewerName || '系统自动'}`,
        now
      );
    }

    const row = db.prepare('SELECT * FROM scan_records WHERE id = ?').get(req.params.id) as any;
    const merged = mapRow(row);
    (merged as any).syncedFee = syncedWaybillId ? (db.prepare('SELECT fee FROM waybills WHERE id = ?').get(syncedWaybillId) as any)?.fee : undefined;

    res.json(merged);
  } catch (error) {
    console.error('Failed to update scan record:', error);
    res.status(500).json({ error: 'Failed to update scan record' });
  }
});

router.post('/:id/review', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM scan_records WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!existing) {
      res.status(404).json({ error: 'Scan record not found' });
      return;
    }
    const { passed, note, reviewer = '复核员' } = req.body;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const reviewStatus = passed ? REVIEW_STATUS.REVIEW_PASSED : REVIEW_STATUS.PENDING_REVIEW;
    const reviewConclusion = passed
      ? `人工复核通过 · ${note || '信息无误'}`
      : `复核需补充 · ${note || '请核对寄收件信息'}`;

    db.prepare(
      `UPDATE scan_records SET review_status = ?, review_conclusion = ?, reviewer = ?, reviewed_at = ?, updated_at = ? WHERE id = ?`
    ).run(reviewStatus, reviewConclusion, reviewer, now, now, req.params.id);

    const row = db.prepare('SELECT * FROM scan_records WHERE id = ?').get(req.params.id) as any;
    res.json(mapRow(row));
  } catch (error) {
    console.error('Scan review failed:', error);
    res.status(500).json({ error: 'Scan review failed' });
  }
});

export default router;
