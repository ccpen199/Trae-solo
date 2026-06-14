/**
 * 星程票务 StarPass API Server
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/db.js';
import {
  createIssue, createOrder, getCityFlows, getDashboard, getEventDetail,
  getIpGraph, getOrganizerReview, getPricingSeries, getProfile, getWallet,
  listEvents, listIssues, listOrders, listSchedule,
  listTerminals, updateIssue, verifyTicket,
} from './src/services.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

export const app: express.Application = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function ok(res: Response, data: unknown = null, extra?: Record<string, unknown>) {
  res.status(200).json({ success: true, data, ...extra });
}
function fail(res: Response, message: string, code = 400) {
  res.status(code).json({ success: false, error: message });
}

// ============ health ============
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'starpass-backend',
    timestamp: new Date().toISOString(),
    db: process.env.DB_PATH,
  });
});

// ============ dashboard ============
app.get('/api/dashboard', (_req, res) => {
  try {
    const d = getDashboard();
    ok(res, d);
  } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ events ============
app.get('/api/events', (req, res) => {
  try {
    const data = listEvents({
      region: req.query.region as string | undefined,
      type: req.query.type as string | undefined,
      keyword: req.query.keyword as string | undefined,
      currency: req.query.currency as string | undefined,
      sort: req.query.sort as string | undefined,
    });
    ok(res, data, { total: data.length });
  } catch (e) { fail(res, (e as Error).message, 500); }
});

app.get('/api/events/:id', (req, res) => {
  try {
    const d = getEventDetail(req.params.id);
    if (!d) return fail(res, 'event not found', 404);
    ok(res, d);
  } catch (e) { fail(res, (e as Error).message, 500); }
});

app.get('/api/events/:id/pricing', (req, res) => {
  try {
    const tierId = req.query.tier_id as string | undefined;
    const data = getPricingSeries(req.params.id, tierId);
    ok(res, data);
  } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ orders ============
app.get('/api/orders', (req, res) => {
  try {
    const userId = (req.query.user_id as string) || 'u-self';
    ok(res, listOrders(userId));
  } catch (e) { fail(res, (e as Error).message, 500); }
});
app.post('/api/orders', (req, res) => {
  try {
    const { eventId, tierId, quantity = 1, currency = 'CNY', channel = 'ALIPAY_PLUS', userId } = req.body || {};
    if (!eventId || !tierId) return fail(res, 'eventId and tierId required');
    const r = createOrder({ userId, eventId, tierId, quantity: Number(quantity), currency, channel });
    if (!r) return fail(res, 'failed to create order: sold out or invalid', 409);
    res.status(201).json({ success: true, data: r });
  } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ verify ============
app.post('/api/verify', (req, res) => {
  try {
    const { cryptoTag, terminalId } = req.body || {};
    if (!cryptoTag) return fail(res, 'cryptoTag required');
    ok(res, verifyTicket(cryptoTag, terminalId));
  } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ issues ============
app.get('/api/issues', (req, res) => {
  try {
    ok(res, listIssues({
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      keyword: req.query.keyword as string | undefined,
    }));
  } catch (e) { fail(res, (e as Error).message, 500); }
});
app.post('/api/issues', (req, res) => {
  try {
    const body = req.body || {};
    const type = body.type;
    // 兼容新旧字段
    const summary = body.summary || body.title;
    const evidence = body.evidence || body.description;
    const relatedOrderId = body.relatedOrderId || body.orderId;
    const reporter = body.reporter || body.owner;
    if (!type || !summary) return fail(res, 'type and summary required');
    const types = ['FAKE_TICKET', 'VERIFY_FAIL', 'NO_TICKET_COMP', 'PAYMENT_ANOMALY'] as const;
    if (!types.includes(type as any)) return fail(res, `invalid type, expected: ${types.join(',')}`);
    res.status(201).json({
      success: true,
      data: createIssue({
        type, summary, evidence, relatedOrderId,
        eventId: body.eventId,
        cryptoTag: body.cryptoTag,
        compensationAmount: Number(body.compensationAmount) || 0,
        reporter,
      }),
    });
  } catch (e) { fail(res, (e as Error).message, 500); }
});
app.patch('/api/issues/:id', (req, res) => {
  try {
    const body = req.body || {};
    const patch: any = {};
    if (body.status) patch.status = body.status;
    if (body.reporter) patch.reporter = body.reporter;
    if (body.owner) patch.reporter = body.owner;
    const ok2 = updateIssue(req.params.id, patch);
    ok(res, { updated: ok2 });
  } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ schedule / terminals ============
app.get('/api/schedule', (req, res) => {
  try { ok(res, listSchedule((req.query.month as string) || (req.query.ym as string) || '2026-07')); } catch (e) { fail(res, (e as Error).message, 500); }
});
app.get('/api/verify-terminals', (_req, res) => {
  try { ok(res, listTerminals()); } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ admin ============
app.get('/api/admin/ip-graph', (_req, res) => {
  try { ok(res, getIpGraph()); } catch (e) { fail(res, (e as Error).message, 500); }
});
app.get('/api/admin/city-flows', (req, res) => {
  try { ok(res, getCityFlows((req.query.event_id as string) || undefined)); } catch (e) { fail(res, (e as Error).message, 500); }
});
app.get('/api/admin/review/:organizerId?', (req, res) => {
  try { ok(res, getOrganizerReview(req.params.organizerId || 'org-sahara')); } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ profile / wallet ============
app.get('/api/profile', (_req, res) => {
  try { ok(res, getProfile()); } catch (e) { fail(res, (e as Error).message, 500); }
});
app.get('/api/profile/wallet', (_req, res) => {
  try { ok(res, getWallet()); } catch (e) { fail(res, (e as Error).message, 500); }
});

// ============ global handlers ============
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api error]', error);
  res.status(500).json({ success: false, error: 'Server internal error', detail: error.message });
});
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export default app;
