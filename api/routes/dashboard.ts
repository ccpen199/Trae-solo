import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';

router.get('/stats', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');

    const todayDate = new Date().toISOString().slice(0, 10);
    const todayStart = `${todayDate} 00:00:00`;

    const todayPickups = (db.prepare("SELECT COUNT(*) as count FROM pickup_appointments WHERE created_at >= ? AND status != 'cancelled'").get(todayStart) as any).count;
    const inTransitWaybills = (db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'in_transit'").get() as any).count;
    const pendingComplaints = (db.prepare("SELECT COUNT(*) as count FROM complaint_tickets WHERE status IN ('pending', 'assigned', 'processing')").get() as any).count;
    const membership = db.prepare('SELECT points FROM membership_info WHERE user_id = ?').get(CURRENT_USER_ID) as any;
    const pointsBalance = membership ? membership.points : 0;

    const todayRevenue = (db.prepare('SELECT COALESCE(SUM(fee), 0) as total FROM waybills WHERE created_at >= ?').get(todayStart) as any).total;
    const totalDelivered = (db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'delivered'").get() as any).count;
    const totalWaybills = (db.prepare('SELECT COUNT(*) as count FROM waybills').get() as any).count;
    const deliveryRate = totalWaybills > 0 ? +((totalDelivered / totalWaybills) * 100).toFixed(1) : 0;

    const scanTodayCount = (db.prepare("SELECT COUNT(*) as count FROM scan_records WHERE created_at >= ?").get(todayStart) as any).count;
    const scanPendingReview = (db.prepare("SELECT COUNT(*) as count FROM scan_records WHERE confidence < 0.85 AND created_at >= ?").get(todayStart) as any).count;

    const importProcessing = (db.prepare("SELECT COUNT(*) as count FROM import_batches WHERE status = 'processing'").get() as any).count;
    const importTodayFailed = (db.prepare("SELECT COALESCE(SUM(failed_count), 0) as total FROM import_batches WHERE created_at >= ?").get(todayStart) as any).total;

    const printPending = (db.prepare("SELECT COUNT(*) as count FROM print_batches WHERE status IN ('pending', 'printing')").get() as any).count;
    const printFailed = (db.prepare("SELECT COUNT(*) as count FROM print_batches WHERE status = 'failed'").get() as any).count;

    const pendingInvoices = (db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'").get() as any).count;
    const failedInvoices = (db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'failed'").get() as any).count;

    const svipLevel = membership?.svip_level || 0;

    res.json({
      todayPickups,
      inTransitWaybills,
      pendingComplaints,
      pointsBalance,
      todayRevenue,
      deliveryRate,
      scanTodayCount,
      scanPendingReview,
      importProcessing,
      importTodayFailed,
      printPending,
      printFailed,
      pendingInvoices,
      failedInvoices,
      svipLevel,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/todos', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const todos: any[] = [];

    const pendingPickups = db.prepare("SELECT * FROM pickup_appointments WHERE status = 'pending' ORDER BY pickup_date ASC LIMIT 3").all() as any[];
    for (const p of pendingPickups) {
      const slotMap: Record<string, string> = { morning: '上午 09:00-12:00', afternoon: '下午 13:00-17:00', evening: '晚上 18:00-21:00' };
      todos.push({
        id: `todo-pickup-${p.id}`,
        type: 'pickup',
        title: `待确认取件: ${p.sender_name} → ${p.receiver_name}`,
        description: `取件时间: ${p.pickup_date} ${slotMap[p.pickup_time_slot] || p.pickup_time_slot}`,
        deadline: `${p.pickup_date} 23:59:59`,
        meta: { phone: p.sender_phone, weight: p.weight },
        link: '/pickup',
        createdAt: p.created_at,
      });
    }

    const processingComplaints = db.prepare(`
      SELECT c.*, w.waybill_no FROM complaint_tickets c
      LEFT JOIN waybills w ON c.waybill_id = w.id
      WHERE c.status IN ('pending', 'assigned', 'processing')
      ORDER BY c.created_at ASC LIMIT 5
    `).all() as any[];
    for (const c of processingComplaints) {
      const statusLabel = c.status === 'pending' ? '待分派' : c.status === 'assigned' ? '待处理' : '处理中';
      todos.push({
        id: `todo-complaint-${c.id}`,
        type: 'complaint',
        title: `投诉${statusLabel}: ${c.waybill_no || c.waybill_id}`,
        description: c.description.slice(0, 50),
        deadline: c.sla_deadline,
        meta: { assignedBranch: c.assigned_branch || '待分派', type: c.type },
        link: '/complaint',
        createdAt: c.created_at,
      });
    }

    const pendingReviewScans = db.prepare(`
      SELECT * FROM scan_records
      WHERE confidence < 0.85 OR is_edited = 0
      ORDER BY created_at DESC LIMIT 5
    `).all() as any[];
    for (const s of pendingReviewScans) {
      const lowConf = s.confidence !== null && s.confidence < 0.85;
      const unconfirmed = s.is_edited === 0;
      todos.push({
        id: `todo-scan-${s.id}`,
        type: 'scan',
        title: lowConf ? `扫描待复核: ${s.waybill_no || '识别结果'}` : `扫描确认保存: ${s.waybill_no || '识别结果'}`,
        description: `${lowConf ? `低置信度 ${Math.round((s.confidence || 0) * 100)}%` : unconfirmed ? '识别结果未确认' : ''} · ${s.receiver_name || '收件人信息待补全'}`,
        deadline: '',
        meta: { confidence: s.confidence, scanType: s.scan_type },
        link: '/scan',
        createdAt: s.created_at,
      });
    }

    const processingImports = db.prepare("SELECT * FROM import_batches WHERE status = 'processing' OR failed_count > 0 ORDER BY created_at DESC LIMIT 3").all() as any[];
    for (const ib of processingImports) {
      const hasFailed = ib.failed_count > 0;
      todos.push({
        id: `todo-import-${ib.id}`,
        type: 'import',
        title: hasFailed ? `导入失败待处理: ${ib.file_name || '批次'}` : `导入处理中: ${ib.file_name || '批次'}`,
        description: `总计${ib.total_count}条 · 成功${ib.success_count}条 · 失败${ib.failed_count}条`,
        deadline: '',
        meta: { batchId: ib.id, failedCount: ib.failed_count },
        link: '/waybill',
        createdAt: ib.created_at,
      });
    }

    const pendingPrints = db.prepare("SELECT * FROM print_batches WHERE status IN ('pending', 'printing', 'failed') ORDER BY created_at DESC LIMIT 3").all() as any[];
    for (const pb of pendingPrints) {
      const statusLabel = pb.status === 'pending' ? '待打印' : pb.status === 'printing' ? '打印中' : '打印失败';
      todos.push({
        id: `todo-print-${pb.id}`,
        type: 'print',
        title: `面单${statusLabel}: ${pb.total_count}张`,
        description: pb.status === 'failed' ? `已打印${pb.printed_count}/${pb.total_count}张，部分失败需重试` : `已打印${pb.printed_count}/${pb.total_count}张`,
        deadline: '',
        meta: { template: pb.template, printedCount: pb.printed_count },
        link: '/waybill',
        createdAt: pb.created_at,
      });
    }

    const pendingInvoices = db.prepare(`
      SELECT inv.*, w.waybill_no FROM invoices inv
      LEFT JOIN waybills w ON inv.waybill_id = w.id
      WHERE inv.status IN ('pending', 'failed')
      ORDER BY inv.created_at ASC LIMIT 3
    `).all() as any[];
    for (const inv of pendingInvoices) {
      const statusLabel = inv.status === 'pending' ? '待开具' : '开票失败';
      todos.push({
        id: `todo-invoice-${inv.id}`,
        type: 'invoice',
        title: `发票${statusLabel}: ${inv.waybill_no || inv.waybill_id}`,
        description: inv.status === 'failed' ? `${inv.fail_reason || '未知原因'} · 金额 ¥${inv.amount}` : `金额: ¥${inv.amount} - 抬头: ${inv.title}`,
        deadline: '',
        meta: { amount: inv.amount, failReason: inv.fail_reason },
        link: '/invoice',
        createdAt: inv.created_at,
      });
    }

    todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

export default router;
