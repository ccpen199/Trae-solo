import type {
  Artist,
  Currency,
  DashboardKpi,
  EventDetail,
  EventScheduleSummary,
  EventSummary,
  IpGraph,
  IpGraphEdge,
  IpGraphNode,
  Language,
  MultiLang,
  Order,
  OrganizerReview,
  PricingTierSeries,
  PricingTick,
  TicketGrade,
  TicketIssue,
  TicketTier,
  Venue,
  VerifyTerminal,
  CityFlow,
  Profile,
  Wallet,
  WalletTx,
  UserTicket,
  ClaimRecord,
  PaymentChannel,
  IssueType,
  IssueStatus,
} from './shared/types.js';
import { db } from './db.js';
import type { Statement } from 'better-sqlite3';

export const ml = (
  zh: string, en: string, ja: string | null | undefined, ko: string | null | undefined,
): MultiLang => ({ zh, en, ja: ja || undefined, ko: ko || undefined });

const FX: Record<Currency, number> = { CNY: 1, HKD: 0.92, TWD: 0.22, JPY: 0.047, KRW: 0.0054, USD: 7.18, SGD: 5.3 };
const CURRENCY_SYMBOL: Record<Currency, string> = {
  CNY: '¥', HKD: 'HK$', TWD: 'NT$', JPY: '¥', KRW: '₩', USD: '$', SGD: 'S$',
};
export function formatCurrency(amount: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOL[currency];
  const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  return `${sym} ${n}`;
}

const CITY_DIST: Record<string, Record<string, number>> = {
  北京: { 上海: 1318, 深圳: 2160, 广州: 2120, 香港: 2130, 台北: 2090, 东京: 2090, 大阪: 1930, 首尔: 950, 新加坡: 4480, 曼谷: 3290, 吉隆坡: 4360 },
  上海: { 北京: 1318, 深圳: 1440, 香港: 1410, 台北: 990, 东京: 1790, 大阪: 1620, 首尔: 870, 新加坡: 3790, 曼谷: 2880 },
  广州: { 北京: 2120, 香港: 180, 深圳: 140, 台北: 1070, 东京: 2940, 曼谷: 1710, 新加坡: 2620 },
  深圳: { 香港: 50, 台北: 970, 新加坡: 2580, 曼谷: 1730 },
  香港: { 台北: 890, 东京: 2980, 大阪: 2530, 首尔: 2100, 新加坡: 2590, 曼谷: 1690 },
  台北: { 东京: 2830, 首尔: 1480 },
  东京: { 大阪: 515, 首尔: 1160 },
  首尔: { 大阪: 830 },
  新加坡: { 曼谷: 1420, 吉隆坡: 350 },
};

function distKm(a: string, b: string): number {
  if (a === b) return 0;
  const d = CITY_DIST[a]?.[b] ?? CITY_DIST[b]?.[a];
  if (d) return d;
  return 500 + (Math.abs(a.length - b.length) * 300);
}

function loadArtistsById(): Record<string, Artist> {
  const rows = db.prepare('SELECT * FROM artists').all() as any[];
  return Object.fromEntries(rows.map((r) => [r.id, {
    id: r.id,
    name: ml(r.name_zh, r.name_en, r.name_ja, r.name_ko),
    avatar: r.avatar, heatIndex: r.heat_index, genre: r.genre, region: r.region,
  } as Artist]));
}

function loadVenuesById(): Record<string, Venue> {
  const rows = db.prepare('SELECT * FROM venues').all() as any[];
  return Object.fromEntries(rows.map((r) => [r.id, {
    id: r.id,
    name: ml(r.name_zh, r.name_en, r.name_ja, r.name_ko),
    city: ml(r.city_zh, r.city_en, r.city_jp ?? null, r.city_ko ?? null),
    region: r.region, capacity: r.capacity, lng: r.lng, lat: r.lat,
  } as Venue]));
}

export function getEventSummary(row: any, venues: Record<string, Venue>, artists: Record<string, Artist>): EventSummary {
  const venue = venues[row.venue_id];
  const aids = (db.prepare('SELECT artist_id FROM event_artists WHERE event_id=? ORDER BY seq').all(row.id) as any[]).map((x) => x.artist_id);
  const artistNames = aids.map((id) => artists[id]?.name).filter(Boolean);
  const tiers = db.prepare('SELECT MIN(current_price) AS mn, MAX(current_price) AS mx FROM ticket_tiers WHERE event_id=?').get(row.id) as any;
  return {
    id: row.id,
    title: ml(row.title_zh, row.title_en, row.title_ja, row.title_ko),
    poster: row.poster,
    region: row.region,
    venueName: venue?.name ?? ml('-', '-', null, null),
    city: venue?.city ?? ml('-', '-', null, null),
    startTime: row.start_time,
    type: row.type,
    status: row.status,
    artistNames,
    priceMin: tiers?.mn ?? 0,
    priceMax: tiers?.mx ?? 0,
    languages: JSON.parse(row.languages || '["zh"]'),
    currencies: JSON.parse(row.currencies || '["CNY"]'),
    hotIndex: row.hot_index,
  };
}

export function getEventDetail(id: string): EventDetail | null {
  const venues = loadVenuesById();
  const artists = loadArtistsById();
  const row = db.prepare('SELECT * FROM events WHERE id=?').get(id) as any;
  if (!row) return null;
  const venue = venues[row.venue_id];
  const sum = getEventSummary(row, venues, artists);
  const orgRow = db.prepare('SELECT name_zh, name_en, name_ja, name_ko FROM organizers WHERE id=?').get(row.organizer_id) as any;
  const tiers = db.prepare("SELECT * FROM ticket_tiers WHERE event_id=? ORDER BY CASE grade WHEN 'VIP' THEN 0 WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 ELSE 4 END").all(row.id) as any[];
  return {
    ...sum,
    organizerId: row.organizer_id,
    organizerName: orgRow ? ml(orgRow.name_zh, orgRow.name_en, orgRow.name_ja, orgRow.name_ko) : ml('-', '-', null, null),
    agentId: row.agent_id ?? undefined,
    endTime: row.end_time,
    description: ml(row.desc_zh, row.desc_en, row.desc_ja, row.desc_ko),
    notice: ml(row.notice_zh, row.notice_en, row.notice_ja, row.notice_ko),
    tiers: tiers.map((t) => ({
      id: t.id, eventId: t.event_id, grade: t.grade,
      basePrice: t.base_price, currentPrice: t.current_price, deltaPct: t.delta_pct,
      totalSeats: t.total_seats, soldSeats: t.sold_seats, hotIndex: t.hot_index,
    } as TicketTier)),
  };
}

// ============ Dashboard ============
export function getDashboard(): DashboardKpi {
  const events = db.prepare("SELECT * FROM events WHERE status IN ('on_sale','upcoming')").all() as any[];
  const venues = loadVenuesById();
  const artists = loadArtistsById();

  const tierRows = db.prepare('SELECT * FROM ticket_tiers').all() as any[];
  const activeTiers = tierRows.filter((t) => events.some((x) => x.id === t.event_id));
  const crossGMV = db.prepare(
    "SELECT COALESCE(SUM(amount_cny),0) AS s FROM orders WHERE status IN ('paid','compensated')",
  ).get() as { s: number };
  const seatsSold = db.prepare(
    "SELECT COALESCE(SUM(quantity),0) AS s FROM orders WHERE status IN ('paid','compensated')",
  ).get() as { s: number };
  const comp = db.prepare('SELECT COALESCE(SUM(comp_total),0) AS s FROM orders WHERE comp_total IS NOT NULL').get() as { s: number };
  const verified = db.prepare('SELECT COALESCE(SUM(verified),0) AS s FROM orders WHERE verified=1').get() as { s: number };

  const cb = db.prepare("SELECT currency, SUM(amount_currency) AS a FROM orders WHERE status IN ('paid','compensated') GROUP BY currency").all() as { currency: Currency; a: number }[];
  const currencyBreakdown = cb.map((r) => ({ c: r.currency, amount: r.a }));

  const pricingHeat = events.slice(0, 6).map((e) => {
    const tiers = db.prepare('SELECT AVG(delta_pct) AS dp, AVG(hot_index) AS hi, SUM(total_seats) AS tot, SUM(sold_seats) AS sold FROM ticket_tiers WHERE event_id=?').get(e.id) as any;
    return {
      eventId: e.id,
      title: ml(e.title_zh, e.title_en, e.title_ja, e.title_ko),
      deltaPct: Math.round((tiers.dp ?? 0) * 10) / 10,
      heatIndex: Math.round(tiers.hi ?? 50),
      remainingPct: tiers.tot ? Math.round(((tiers.tot - tiers.sold) / tiers.tot) * 100) : 0,
    };
  });

  const artistRows = db.prepare('SELECT * FROM artists ORDER BY heat_index DESC LIMIT 6').all() as any[];
  const trendingArtists = artistRows.map((a, idx) => ({
    id: a.id,
    name: ml(a.name_zh, a.name_en, a.name_ja, a.name_ko),
    heatIndex: a.heat_index,
    delta: idx < 2 ? 12 : idx < 4 ? 5 : -3,
  }));

  const topEvents = events
    .map((e) => getEventSummary(e, venues, artists))
    .sort((a, b) => b.hotIndex - a.hotIndex)
    .slice(0, 8);

  return {
    onSaleEvents: events.filter((e) => e.status === 'on_sale').length,
    activeTiers: activeTiers.length,
    crossGMV: crossGMV.s,
    seatsSold: seatsSold.s,
    compensation: comp.s,
    verifiedEntries: verified.s,
    currencyBreakdown,
    pricingHeat,
    trendingArtists,
    topEvents,
  };
}

// ============ Events list ============
export function listEvents(q: {
  region?: string; type?: string; keyword?: string; currency?: string; sort?: string;
} = {}): EventSummary[] {
  const venues = loadVenuesById();
  const artists = loadArtistsById();
  const wh: string[] = [];
  const args: any[] = [];
  if (q.region) { wh.push('region=?'); args.push(q.region); }
  if (q.type) { wh.push('type=?'); args.push(q.type); }
  if (q.keyword) {
    const k = `%${q.keyword}%`;
    wh.push('(title_zh LIKE ? OR title_en LIKE ? OR title_ja LIKE ? OR title_ko LIKE ? OR EXISTS (SELECT 1 FROM venues v WHERE v.id=events.venue_id AND (v.name_zh LIKE ? OR v.name_en LIKE ?)))');
    args.push(k, k, k, k, k, k);
  }
  if (q.currency) {
    wh.push('currencies LIKE ?');
    args.push(`%${q.currency}%`);
  }
  let order = "ORDER BY CASE status WHEN 'on_sale' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END, hot_index DESC";
  if (q.sort === 'price_asc') order = 'ORDER BY (SELECT MIN(current_price) FROM ticket_tiers t WHERE t.event_id=events.id) ASC';
  if (q.sort === 'price_desc') order = 'ORDER BY (SELECT MAX(current_price) FROM ticket_tiers t WHERE t.event_id=events.id) DESC';
  if (q.sort === 'date_asc') order = 'ORDER BY start_time ASC';
  const sql = `SELECT * FROM events${wh.length ? ' WHERE ' + wh.join(' AND ') : ''} ${order} LIMIT 50`;
  const rows = db.prepare(sql).all(...args) as any[];
  return rows.map((r) => getEventSummary(r, venues, artists));
}

// ============ Pricing series ============
export function getPricingSeries(eventId: string, tierId?: string): PricingTierSeries[] {
  const sql = tierId
    ? "SELECT tier_id, ts, price, remaining, heat FROM pricing_ticks WHERE event_id=? AND tier_id=? ORDER BY ts"
    : "SELECT tier_id, ts, price, remaining, heat FROM pricing_ticks WHERE event_id=? ORDER BY tier_id, ts";
  const rows = db.prepare(sql).all(eventId, tierId ?? []) as any[];
  const byTier = new Map<string, PricingTick[]>();
  for (const r of rows) {
    if (!byTier.has(r.tier_id)) byTier.set(r.tier_id, []);
    byTier.get(r.tier_id)!.push({ ts: r.ts, price: r.price, remaining: r.remaining, heat: r.heat });
  }
  const tierMap = new Map<string, TicketGrade>();
  (db.prepare('SELECT id, grade FROM ticket_tiers WHERE event_id=?').all(eventId) as any[])
    .forEach((t) => tierMap.set(t.id, t.grade));
  return [...byTier.entries()].map(([tid, ticks]) => ({ tierId: tid, grade: (tierMap.get(tid) ?? 'A') as TicketGrade, ticks }));
}

// ============ Orders ============
export function listOrders(userId = 'u-self'): Order[] {
  const rows = db.prepare("SELECT o.*, e.title_zh, e.title_en, e.title_ja, e.title_ko, e.start_time, v.name_zh AS vn_zh, v.name_en AS vn_en, t.grade FROM orders o JOIN events e ON e.id=o.event_id JOIN venues v ON v.id=e.venue_id JOIN ticket_tiers t ON t.id=o.tier_id WHERE o.user_id=? ORDER BY o.created_at DESC").all(userId) as any[];
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, eventId: r.event_id,
    eventTitle: ml(r.title_zh, r.title_en, r.title_ja, r.title_ko),
    venueName: ml(r.vn_zh, r.vn_en, null, null),
    startTime: r.start_time,
    tierId: r.tier_id, tierGrade: r.grade,
    seats: JSON.parse(r.seats || '[]'),
    quantity: r.quantity,
    currency: r.currency, channel: r.channel, status: r.status,
    amountInCurrency: r.amount_currency, amountInCny: r.amount_cny,
    cryptoTag: r.crypto_tag,
    createdAt: r.created_at,
    verified: !!r.verified,
    compensation: r.comp_total != null ? {
      flight: r.comp_flight ?? undefined, hotel: r.comp_hotel ?? undefined,
      total: r.comp_total, status: r.comp_status ?? 'approved',
    } : undefined,
  } as Order));
}

export function createOrder(payload: {
  userId?: string; eventId: string; tierId: string; quantity: number;
  currency: Currency; channel: string;
}): { id: string; cryptoTag: string } | null {
  const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id=?').get(payload.tierId) as any;
  if (!tier) return null;
  if (tier.sold_seats + payload.quantity > tier.total_seats) return null;
  const id = `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const seats = Array.from({ length: payload.quantity }, (_, i) => `${tier.grade}-${tier.sold_seats + i + 1}`);
  const cryptoTag = `SP-${id.toUpperCase()}-${Buffer.from(`${payload.eventId}-${tier.id}-${Date.now()}-${Math.random()}`).toString('base64url').slice(0, 18)}`;
  const fx = FX[payload.currency] ?? 1;
  const amountCny = tier.current_price * payload.quantity;
  const amountCurrency = Math.round(amountCny / fx);
  const statusChs: Record<string, Order['status']> = { ALIPAY_PLUS: 'paid', VISA: 'paid', MASTERCARD: 'paid', GCASH: 'paid', PAYME: 'paid', LINEPAY: 'paid', PAYNOW: 'paid', PROMPTPAY: 'paid' };
  const status = statusChs[payload.channel] ?? 'pending';
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO orders (id,user_id,event_id,tier_id,seats,quantity,currency,channel,status,amount_currency,amount_cny,crypto_tag,verified,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?)",
    ).run(id, payload.userId ?? 'u-self', payload.eventId, payload.tierId, JSON.stringify(seats), payload.quantity, payload.currency, payload.channel, status, amountCurrency, amountCny, cryptoTag, new Date().toISOString());
    db.prepare('UPDATE ticket_tiers SET sold_seats=sold_seats+? WHERE id=?').run(payload.quantity, payload.tierId);
  });
  tx();
  return { id, cryptoTag };
}

export function verifyTicket(cryptoTag: string, terminalId = 'T-WEB-001'): { pass: boolean; order?: Order; reason?: string } {
  const row = db.prepare("SELECT o.*, e.title_zh, e.title_en, e.title_ja, e.title_ko, e.start_time, v.name_zh AS vn_zh, v.name_en AS vn_en, t.grade FROM orders o JOIN events e ON e.id=o.event_id JOIN venues v ON v.id=e.venue_id JOIN ticket_tiers t ON t.id=o.tier_id WHERE o.crypto_tag=?").get(cryptoTag) as any;
  db.prepare('INSERT INTO verify_logs (terminal_id, crypto_tag, pass, ts) VALUES (?,?,?,?)').run(terminalId, cryptoTag, row ? 1 : 0, new Date().toISOString());
  if (!row) return { pass: false, reason: '加密串未在官方数据库找到 → 疑似假票' };
  if (row.verified) return { pass: false, reason: '该加密串已被核验过 → 疑似重复入场' };
  db.prepare('UPDATE orders SET verified=1 WHERE id=?').run(row.id);
  db.prepare("UPDATE verify_terminals SET today_scans=today_scans+1 WHERE id=?").run(terminalId);
  return {
    pass: true,
    order: {
      id: row.id, userId: row.user_id, eventId: row.event_id,
      eventTitle: ml(row.title_zh, row.title_en, row.title_ja, row.title_ko),
      venueName: ml(row.vn_zh, row.vn_en, null, null),
      startTime: row.start_time,
      tierId: row.tier_id, tierGrade: row.grade,
      seats: JSON.parse(row.seats || '[]'), quantity: row.quantity,
      currency: row.currency, channel: row.channel, status: row.status,
      amountInCurrency: row.amount_currency, amountInCny: row.amount_cny,
      cryptoTag: row.crypto_tag, createdAt: row.created_at, verified: true,
    },
  };
}

// ============ Issues ============
const typeMap: Record<string, { owner: string; comp: boolean }> = {
  FAKE_TICKET: { owner: '风控组·郑南', comp: false },
  VERIFY_FAIL: { owner: '现场组·林楠', comp: false },
  NO_TICKET_COMP: { owner: '赔付组·何溪', comp: true },
  PAYMENT_ANOMALY: { owner: '支付组·星野', comp: false },
};

function toIssueRow(r: any): TicketIssue {
  const ev = r.event_id ? db.prepare('SELECT e.title_zh, e.title_en, e.title_ja, e.title_ko, e.region, t.grade FROM events e LEFT JOIN ticket_tiers t ON t.event_id=e.id WHERE e.id=? LIMIT 1').get(r.event_id) as any : null;
  const compAmt = Number(r.compensation_amount || 0) || (typeMap[r.type]?.comp ? 3500 : 0);
  const st: IssueStatus = (r.status || 'OPEN').toUpperCase() as any;
  return {
    id: r.id,
    type: r.type as IssueType,
    summary: r.title,
    evidence: r.description,
    relatedOrderId: r.order_id ?? undefined,
    cryptoTag: r.crypto_tag ?? null,
    status: st,
    eventId: r.event_id ?? undefined,
    eventTitle: ev ? ml(ev.title_zh, ev.title_en, ev.title_ja, ev.title_ko) : ml('—', '—', null, null),
    tierGrade: ev?.grade ?? undefined,
    region: ev?.region ?? undefined,
    compensationAmount: compAmt,
    reporter: r.owner,
    createdAt: r.created_at,
    slaDeadline: r.sla_deadline ?? undefined,
  };
}

export function listIssues(filter: { type?: string; status?: string; keyword?: string } = {}): TicketIssue[] {
  const wh: string[] = []; const args: any[] = [];
  if (filter.type) { wh.push('type=?'); args.push(filter.type); }
  if (filter.status) { wh.push('UPPER(status)=?'); args.push(filter.status.toUpperCase()); }
  if (filter.keyword) {
    wh.push('(title LIKE ? OR description LIKE ? OR crypto_tag LIKE ? OR order_id LIKE ?)');
    const k = `%${filter.keyword}%`;
    args.push(k, k, k, k);
  }
  const sql = `SELECT * FROM ticket_issues${wh.length ? ' WHERE ' + wh.join(' AND ') : ''} ORDER BY CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END, created_at DESC LIMIT 100`;
  const rows = db.prepare(sql).all(...args) as any[];
  return rows.map(toIssueRow);
}

export function createIssue(payload: Partial<TicketIssue> & { type: TicketIssue['type']; summary: string; evidence?: string }): TicketIssue {
  const id = `iss-${Date.now().toString(36)}`;
  const slaMap: Record<string, number> = { P0: 4, P1: 24, P2: 72, P3: 168 };
  const pri = 'P1' as const;
  const sla = new Date(Date.now() + slaMap[pri] * 3600 * 1000).toISOString();
  const cfg = typeMap[payload.type] ?? { owner: '运营组', comp: false };
  const owner = payload.reporter ?? cfg.owner;
  const comp = Number(payload.compensationAmount) || (cfg.comp ? 2500 : 0);
  db.prepare(
    "INSERT INTO ticket_issues (id,type,order_id,event_id,crypto_tag,title,description,priority,status,owner,sla_deadline,created_at,compensation_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
  ).run(id, payload.type, payload.relatedOrderId ?? null, payload.eventId ?? null, payload.cryptoTag ?? null, payload.summary, payload.evidence ?? '', pri, 'OPEN', owner, sla, new Date().toISOString(), comp);
  return listIssues({ keyword: id })[0];
}

export function updateIssue(id: string, patch: Partial<Pick<TicketIssue, 'status' | 'reporter'>>): boolean {
  const fields: string[] = []; const args: any[] = [];
  if (patch.status) { fields.push('status=?'); args.push(patch.status); }
  if (patch.reporter) { fields.push('owner=?'); args.push(patch.reporter); }
  if (!fields.length) return false;
  args.push(id);
  const info = db.prepare(`UPDATE ticket_issues SET ${fields.join(',')} WHERE id=?`).run(...args);
  return info.changes > 0;
}

// ============ Schedule & Terminals ============
export function listSchedule(ym = '2026-07'): EventScheduleSummary[] {
  const venues = loadVenuesById();
  const prefix = ym.slice(0, 7);
  let rows = db.prepare("SELECT * FROM events WHERE substr(start_time, 1, 7)=? ORDER BY start_time").all(prefix) as any[];
  if (!rows.length) {
    rows = db.prepare("SELECT * FROM events ORDER BY start_time").all() as any[];
  }
  return rows.map((r) => {
    const v = venues[r.venue_id];
    const tiers = db.prepare('SELECT SUM(total_seats) AS tot, SUM(sold_seats) AS sold FROM ticket_tiers WHERE event_id=?').get(r.id) as any;
    return {
      id: r.id,
      title: ml(r.title_zh, r.title_en, r.title_ja, r.title_ko),
      poster: r.poster,
      region: r.region,
      venueName: v?.name ?? ml('-', '-', null, null),
      city: v?.city ?? ml('-', '-', null, null),
      startTime: r.start_time,
      endTime: r.end_time || r.start_time,
      soldSeats: Math.round(tiers.sold || 0),
      totalSeats: Math.round(tiers.tot || 0),
      hotIndex: r.hot_index,
    } as EventScheduleSummary;
  });
}

export function listTerminals(): VerifyTerminal[] {
  const rows = db.prepare("SELECT t.*, v.name_zh, v.name_en, v.name_ja, v.name_ko FROM verify_terminals t LEFT JOIN venues v ON v.id=t.venue_id ORDER BY t.id").all() as any[];
  const types = ['手持终端', '闸机集成', '工作台', '手机App', '手持终端', '闸机集成'];
  return rows.map((r, i) => ({
    id: r.id, venueId: r.venue_id,
    venueName: ml(r.name_zh ?? '—', r.name_en ?? '—', r.name_ja, r.name_ko),
    terminalType: types[i % types.length],
    gateNo: String.fromCharCode(65 + (i % 6)) + '-' + (10 + i),
    online: !!r.online,
    signKey: 'SIG-' + Buffer.from(r.id + '::starpass::' + (i + 1)).toString('base64').slice(0, 22),
    todayScans: Number(r.today_scans ?? r.verified ?? (500 + i * 180)),
    todayAnomalies: Number(r.today_anomalies ?? r.errors ?? Math.max(1, i * 3)),
    lastHeartbeat: r.last_heartbeat,
  } as VerifyTerminal));
}

// ============ Admin: IP graph, city flows, review ============
export function getIpGraph(): IpGraph {
  const aRows = db.prepare('SELECT * FROM artists').all() as any[];
  const vRows = db.prepare('SELECT * FROM venues').all() as any[];
  const oRows = db.prepare('SELECT * FROM organizers').all() as any[];
  const eaRows = db.prepare('SELECT event_id, artist_id FROM event_artists').all() as any[];
  const evMap = new Map<string, any>();
  (db.prepare('SELECT id, organizer_id, venue_id FROM events').all() as any[]).forEach((e) => evMap.set(e.id, e));
  const orgGmvSql = db.prepare("SELECT organizer_id, COALESCE(SUM(o.amount_cny),0) AS gmv FROM events e JOIN orders o ON o.event_id=e.id WHERE o.status IN ('paid','compensated') GROUP BY organizer_id");
  const orgGmv = new Map<string, number>();
  (orgGmvSql.all() as any[]).forEach((r) => orgGmv.set(r.organizer_id, r.gmv));
  const aHeatAvg = db.prepare("SELECT AVG(heat_index) AS hi FROM artists").get() as any;
  const heatAvg = aHeatAvg.hi || 60;

  const artists: IpGraphNode[] = aRows.map((r) => {
    const linkedOs = new Set<string>();
    const linkedVs = new Set<string>();
    for (const ea of eaRows.filter((x) => x.artist_id === r.id)) {
      const ev = evMap.get(ea.event_id);
      if (ev?.organizer_id) linkedOs.add(ev.organizer_id);
      if (ev?.venue_id) linkedVs.add(ev.venue_id);
    }
    return {
      id: r.id,
      name: ml(r.name_zh, r.name_en, r.name_ja, r.name_ko),
      kind: 'artist',
      avgHotIndex: r.heat_index,
      totalGmv: Math.round(r.heat_index * 50000),
      linkedOrganizers: [...linkedOs],
      linkedVenues: [...linkedVs],
      region: r.region,
    };
  });

  const venues: IpGraphNode[] = vRows.map((r) => {
    const linkedAs = new Set<string>();
    const linkedOs = new Set<string>();
    for (const [evId, ev] of evMap) {
      if (ev.venue_id === r.id) {
        if (ev.organizer_id) linkedOs.add(ev.organizer_id);
        eaRows.filter((x) => x.event_id === evId).forEach((x) => linkedAs.add(x.artist_id));
      }
    }
    return {
      id: r.id,
      name: ml(r.name_zh, r.name_en, r.name_ja, r.name_ko),
      kind: 'venue',
      totalAttendance: r.capacity * 4,
      linkedArtists: [...linkedAs],
      linkedOrganizers: [...linkedOs],
      region: r.region,
    };
  });

  const organizers: IpGraphNode[] = oRows.map((r) => {
    const linkedAs = new Set<string>();
    const linkedVs = new Set<string>();
    let heatAcc = 0, heatN = 0;
    for (const [evId, ev] of evMap) {
      if (ev.organizer_id === r.id) {
        if (ev.venue_id) linkedVs.add(ev.venue_id);
        eaRows.filter((x) => x.event_id === evId).forEach((x) => {
          linkedAs.add(x.artist_id);
        });
        const evHeat = aRows.find((y) => linkedAs.has(y.id));
        if (evHeat) { heatAcc += evHeat.heat_index; heatN++; }
      }
    }
    return {
      id: r.id,
      name: ml(r.name_zh, r.name_en, r.name_ja, r.name_ko),
      kind: 'organizer',
      avgHotIndex: heatN ? Math.round(heatAcc / heatN) : heatAvg,
      totalGmv: orgGmv.get(r.id) ?? Math.round(5_000_000 + Math.random() * 20_000_000),
      linkedArtists: [...linkedAs],
      linkedVenues: [...linkedVs],
      region: r.region,
    };
  });

  const edges: IpGraphEdge[] = [];
  let edgeCounter = 0;
  const pushEdge = (e: Omit<IpGraphEdge, 'edgeId'>) => {
    edgeCounter++;
    edges.push({ ...e, edgeId: `E${String(edgeCounter).padStart(4, '0')}` });
  };
  for (const a of artists) {
    for (const oid of a.linkedOrganizers ?? []) {
      pushEdge({ sourceKind: 'artist', targetKind: 'organizer', sourceId: a.id, targetId: oid, kind: 'A_O', strength: 3 + Math.floor((a.avgHotIndex || 70) / 20) });
    }
    for (const vid of a.linkedVenues ?? []) {
      pushEdge({ sourceKind: 'artist', targetKind: 'venue', sourceId: a.id, targetId: vid, kind: 'A_V', strength: 2 + Math.floor((a.avgHotIndex || 70) / 25) });
    }
  }
  for (const o of organizers) {
    for (const vid of o.linkedVenues ?? []) {
      pushEdge({ sourceKind: 'organizer', targetKind: 'venue', sourceId: o.id, targetId: vid, kind: 'O_V', strength: 4 });
    }
  }
  edges.sort((a, b) => b.strength - a.strength);

  return { artists, venues, organizers, edges };
}

export function getCityFlows(eventId?: string): CityFlow[] {
  const cRows = db.prepare('SELECT * FROM city_flows').all() as any[];
  const evById = new Map<string, any>();
  (db.prepare('SELECT id, title_zh, title_en, title_ja, title_ko, poster FROM events').all() as any[]).forEach((r) => evById.set(r.id, r));
  const rows = eventId ? cRows.filter((r) => r.event_id === eventId) : cRows;
  let i = 0;
  return rows.map((r) => {
    const ev = evById.get(r.event_id);
    i++;
    return {
      id: `CF-${String(i).padStart(4, '0')}`,
      fromCity: r.from_city,
      toCity: r.to_city,
      count: Number(r.audience_count),
      distanceKm: distKm(r.from_city, r.to_city),
      eventId: r.event_id,
      eventTitle: ev ? ml(ev.title_zh, ev.title_en, ev.title_ja, ev.title_ko) : ml('—', '—', null, null),
      eventPoster: ev?.poster ?? '🎶',
    } as CityFlow;
  });
}

export function getOrganizerReview(organizerId: string): OrganizerReview {
  const org = db.prepare('SELECT * FROM organizers WHERE id=?').get(organizerId) as any
    || { id: organizerId, name_zh: '主办方', name_en: 'Organizer', name_ja: '主催者', name_ko: '주최측' };
  const events = db.prepare("SELECT e.*, COALESCE(SUM(o.quantity),0) AS sold, (SELECT SUM(total_seats) FROM ticket_tiers WHERE event_id=e.id) AS cap FROM events e LEFT JOIN orders o ON o.event_id=e.id AND o.status IN ('paid','compensated') WHERE e.organizer_id=? GROUP BY e.id ORDER BY start_time DESC").all(organizerId) as any[];
  if (!events.length) {
    events.push(...db.prepare("SELECT e.*, COALESCE(SUM(o.quantity),0) AS sold, (SELECT SUM(total_seats) FROM ticket_tiers WHERE event_id=e.id) AS cap FROM events e LEFT JOIN orders o ON o.event_id=e.id AND o.status IN ('paid','compensated') GROUP BY e.id ORDER BY start_time DESC LIMIT 4").all() as any[]);
  }

  const totalTickets = events.reduce((s, e) => s + Number(e.sold || 0), 0);
  const totalCapacity = events.reduce((s, e) => s + Number(e.cap || 0), 0);
  const gmv = db.prepare(`SELECT COALESCE(SUM(o.amount_cny),0) AS s FROM orders o JOIN events e ON e.id=o.event_id WHERE o.status IN ('paid','compensated') AND e.organizer_id=?`).get(organizerId) as { s: number };

  const revPerShow = events.map((e) => {
    const tiers = db.prepare("SELECT grade, COALESCE(SUM(current_price*sold_seats),0) AS rev FROM ticket_tiers WHERE event_id=? GROUP BY grade").all(e.id) as any[];
    const map: any = { VIP: 0, A: 0, B: 0, C: 0 };
    for (const t of tiers) if (map[t.grade] !== undefined) map[t.grade] = t.rev; else map.A += t.rev;
    return { show: `${(e.title_zh || 'Show').slice(0, 7)}`, ...map, _total: (tiers as any[]).reduce((s, t) => s + t.rev, 0), _heat: e.hot_index, _date: e.start_time?.slice(0, 10), _sold: e.sold, _cap: e.cap, _poster: e.poster, _titleZh: e.title_zh, _titleEn: e.title_en, _titleJa: e.title_ja, _titleKo: e.title_ko };
  });

  const revSummary = revPerShow.map((r) => ({ show: r.show, VIP: r.VIP, A: r.A, B: r.B, C: r.C }));
  const showsList = revPerShow.slice(0, 8).map((r) => ({
    poster: r._poster ?? '🎵',
    title: ml(r._titleZh ?? r.show, r._titleEn ?? r.show, r._titleJa, r._titleKo),
    date: r._date,
    sold: Number(r._sold), total: Number(r._cap),
    revenue: Number(r._total),
    heat: Number(r._heat),
  }));

  const dims: [string, number, number][] = [
    ['售罄速度', 88, 72],
    ['跨城拉动', 76, 60],
    ['用户复购', 72, 58],
    ['满意度', 94, 86],
    ['营销效率', 80, 70],
    ['溢价空间', 66, 55],
  ];
  const radar = dims.map(([dim, cur, base]) => ({ dim, current: cur, baseline: base }));

  const seriesKeys = revPerShow.slice(0, Math.min(5, revPerShow.length)).map((r) => r.show);
  const series: Record<string, number>[] = Array.from({ length: 12 }, (_, h) => {
    const hr = h * 8;
    const row: any = { x: `T+${hr}h` };
    seriesKeys.forEach((k, i) => {
      row[k] = Math.min(100, Math.round((1 - Math.exp(-h * (0.1 + i * 0.03))) * 100 + (i * 3)));
    });
    return row;
  });

  const totalGMV = revPerShow.reduce((s, r) => s + r._total, 0) || gmv.s || 12_350_000;

  return {
    organizerId,
    organizerName: ml(org.name_zh, org.name_en, org.name_ja, org.name_ko),
    period: '2026 Q1 / 全周期',
    shows: events.length,
    ticketsTotal: totalTickets,
    selloutRate: totalCapacity ? Math.round((totalTickets / totalCapacity) * 1000) / 10 : 83.5,
    gmv: totalGMV,
    complaintRate: 0.0034,
    radar,
    series,
    revenue: revSummary,
    showsList,
  };
}

// ============ Profile ============
export function getProfile(userId = 'u-self'): Profile {
  const tickets: UserTicket[] = listOrders(userId).slice(0, 5).map((o) => ({
    id: o.id,
    eventTitle: o.eventTitle.zh,
    eventPoster: '🎵',
    venue: o.venueName.zh,
    time: o.startTime.slice(0, 16).replace('T', ' '),
    tierGrade: o.tierGrade,
    section: o.tierGrade,
    row: String(1 + Math.floor(Math.random() * 20)),
    seat: o.seats[0]?.split('-').slice(-1)[0] || String(1 + Math.floor(Math.random() * 30)),
    status: o.status,
    cryptoTag: o.cryptoTag,
    issueTime: o.createdAt.slice(0, 10),
  }));
  const claims: ClaimRecord[] = listOrders(userId)
    .filter((o) => o.compensation)
    .slice(0, 3)
    .map((o) => ({
      id: 'CL-' + o.id.slice(-6).toUpperCase(),
      reason: o.compensation!.status === 'paid' ? '演出取消赔付' : '无票赔付审核中',
      eventName: o.eventTitle.zh,
      flightAmount: o.compensation!.flight ?? 1800,
      hotelAmount: o.compensation!.hotel ?? 900,
      amount: o.compensation!.total,
      status: (o.compensation!.status === 'paid' ? 'paid' : o.compensation!.status === 'approved' ? 'approved' : 'processing') as any,
      createdAt: o.createdAt,
    }));

  return {
    id: userId,
    displayName: '星河客',
    email: 'starpass@example.com',
    phone: '+86 138****8818',
    memberLevel: userId.length > 4 ? 'gold' : 'platinum',
    memberPoints: 128500,
    totalSpent: 188560,
    kycStatus: 'passed',
    joinedAt: '2024-08-15T10:23:00Z',
    tickets,
    claims,
  };
}

export function getWallet(userId = 'u-self'): Wallet {
  const orders = listOrders(userId);
  const totalSpent = orders.reduce((s, o) => s + o.amountInCny, 0);
  const balances: Wallet['balances'] = (Object.keys(FX) as Currency[]).map((c) => ({
    currency: c,
    amount: c === 'CNY' ? 3688 : Math.round(5000 / FX[c]),
    cnyEquivalent: c === 'CNY' ? 3688 : 5000,
  }));
  const channels: PaymentChannel[] = ['ALIPAY_PLUS', 'VISA', 'MASTERCARD', 'LINEPAY', 'PAYME', 'GCASH'];
  const tx: WalletTx[] = orders.slice(0, 6).map((o, i) => ({
    txId: 'TX-' + o.id.slice(-6).toUpperCase() + '-' + (i + 1),
    type: 'purchase',
    desc: o.eventTitle.zh,
    amount: o.amountInCurrency,
    positive: false,
    currency: o.currency,
    channel: channels[i % channels.length],
    date: o.createdAt.slice(0, 10),
  }));
  // 加两笔赔付/退款
  tx.splice(2, 0, {
    txId: 'TX-COMP-A3B2', type: 'compensation', desc: '演出取消赔付',
    amount: 3200, positive: true, currency: 'CNY', channel: 'ALIPAY_PLUS', date: '2026-05-02',
  });
  tx.push({
    txId: 'TX-WD-C9E1', type: 'deposit', desc: '充值 · 支付宝',
    amount: 5000, positive: true, currency: 'CNY', channel: 'ALIPAY_PLUS', date: '2026-05-10',
  });

  return { walletId: 'WA-' + userId.toUpperCase() + '-7E3F', balances, tx };
}

export type _Stmt = Statement;
export const _fx = FX;
