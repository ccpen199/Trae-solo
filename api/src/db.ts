import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type {
  Artist,
  Venue,
  Organizer,
  Agent,
  EventType,
  EventStatus,
  Region,
  TicketGrade,
} from './shared/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const DB_PATH =
  process.env.DB_PATH && path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(ROOT, process.env.DB_PATH || './api/src/db/starpass.db');

const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const DB_FILE = DB_PATH;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL, name_en TEXT NOT NULL, name_ja TEXT, name_ko TEXT,
  avatar TEXT, heat_index INTEGER NOT NULL DEFAULT 0,
  genre TEXT, region TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL, name_en TEXT NOT NULL, name_ja TEXT, name_ko TEXT,
  city_zh TEXT NOT NULL, city_en TEXT NOT NULL,
  region TEXT NOT NULL, capacity INTEGER NOT NULL,
  lng REAL, lat REAL
);

CREATE TABLE IF NOT EXISTS organizers (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL, name_en TEXT NOT NULL, name_ja TEXT, name_ko TEXT,
  logo TEXT, region TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL, name_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title_zh TEXT, title_en TEXT, title_ja TEXT, title_ko TEXT,
  poster TEXT,
  venue_id TEXT, organizer_id TEXT, agent_id TEXT,
  region TEXT NOT NULL,
  start_time TEXT NOT NULL, end_time TEXT,
  languages TEXT NOT NULL, currencies TEXT NOT NULL,
  type TEXT NOT NULL, status TEXT NOT NULL,
  hot_index INTEGER NOT NULL DEFAULT 0,
  desc_zh TEXT, desc_en TEXT, desc_ja TEXT, desc_ko TEXT,
  notice_zh TEXT, notice_en TEXT, notice_ja TEXT, notice_ko TEXT
);

CREATE TABLE IF NOT EXISTS event_artists (
  event_id TEXT, artist_id TEXT, seq INTEGER,
  PRIMARY KEY (event_id, artist_id)
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL, grade TEXT NOT NULL,
  base_price INTEGER NOT NULL, current_price INTEGER NOT NULL, delta_pct REAL NOT NULL,
  total_seats INTEGER NOT NULL, sold_seats INTEGER NOT NULL DEFAULT 0,
  hot_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL, tier_id TEXT NOT NULL,
  seats TEXT NOT NULL, quantity INTEGER NOT NULL,
  currency TEXT NOT NULL, channel TEXT NOT NULL, status TEXT NOT NULL,
  amount_currency INTEGER NOT NULL, amount_cny INTEGER NOT NULL,
  crypto_tag TEXT UNIQUE NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  comp_flight INTEGER, comp_hotel INTEGER, comp_total INTEGER, comp_status TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_issues (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  order_id TEXT, event_id TEXT, crypto_tag TEXT,
  title TEXT NOT NULL, description TEXT NOT NULL,
  priority TEXT NOT NULL, status TEXT NOT NULL, owner TEXT NOT NULL,
  sla_deadline TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verify_terminals (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL, online INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0, errors INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verify_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  terminal_id TEXT, crypto_tag TEXT, pass INTEGER, ts TEXT
);

CREATE TABLE IF NOT EXISTS pricing_ticks (
  event_id TEXT, tier_id TEXT, ts TEXT,
  price INTEGER, remaining INTEGER, heat INTEGER
);

CREATE TABLE IF NOT EXISTS city_flows (
  event_id TEXT, from_city TEXT, to_city TEXT, audience_count INTEGER,
  PRIMARY KEY (event_id, from_city, to_city)
);

CREATE TABLE IF NOT EXISTS ip_relations (
  id TEXT PRIMARY KEY, source TEXT, target TEXT, kind TEXT, weight INTEGER
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh',
  currency TEXT NOT NULL DEFAULT 'CNY',
  region TEXT NOT NULL DEFAULT 'mainland',
  phone TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tiers_event ON ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_type ON ticket_issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_status ON ticket_issues(status);
CREATE INDEX IF NOT EXISTS idx_ticks_evt ON pricing_ticks(event_id);
`;

db.exec(SCHEMA);

// ============================================================
// ALTER TABLE migrations (silent no-op for SQLite if cols exist)
// ============================================================
(function migrate() {
  const Pragma = (table: string) => db.pragma(`table_info("${table}")`) as { name: string; type: string }[];
  const addColIfMissing = (table: string, col: string, def: string) => {
    const cols = Pragma(table).map(r => r.name);
    if (!cols.includes(col)) {
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch (e) { /* ignore */ }
    }
  };
  addColIfMissing('ticket_issues', 'compensation_amount', 'INTEGER DEFAULT 0');
  addColIfMissing('ticket_issues', 'summary', 'TEXT');
  addColIfMissing('ticket_issues', 'evidence', 'TEXT');
  addColIfMissing('ticket_issues', 'reporter', 'TEXT');
  addColIfMissing('ticket_issues', 'updated_at', 'TEXT');
  addColIfMissing('organizers', 'name_ja', 'TEXT');
  addColIfMissing('organizers', 'name_ko', 'TEXT');
  addColIfMissing('verify_terminals', 'terminal_type', 'TEXT DEFAULT "HANDHELD"');
  addColIfMissing('verify_terminals', 'gate_no', 'TEXT');
  addColIfMissing('verify_terminals', 'sign_key', 'TEXT');
  addColIfMissing('verify_terminals', 'today_scans', 'INTEGER DEFAULT 0');
  addColIfMissing('verify_terminals', 'today_anomalies', 'INTEGER DEFAULT 0');
})();

// ============================================================
// Seed data (only if empty)
// ============================================================
const count = db.prepare('SELECT COUNT(*) AS c FROM events').get() as { c: number };
if (count.c === 0) {
  try {
    db.transaction(seed)();
  } catch (e) {
    console.error('seed error, rolling back', e);
  }
}

function seed() {
  const insertArtist = db.prepare(
    'INSERT INTO artists (id,name_zh,name_en,name_ja,name_ko,avatar,heat_index,genre,region) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  const artists: (Artist & { _id: string })[] = [
    mkArtist('a-001', { zh: '星海', en: 'Xinghai', ja: 'シンハイ', ko: '씽하이' }, '流行', 'mainland', 98),
    mkArtist('a-002', { zh: '林夕梦', en: 'Lin Xi Meng', ja: 'リン・シーメン', ko: '린시멍' }, '民谣', 'mainland', 86),
    mkArtist('a-003', { zh: '陳凱', en: 'Chan Hoi', ja: 'チャン・ホイ', ko: '천카이' }, '摇滚', 'HKMT', 92),
    mkArtist('a-004', { zh: '사하라', en: 'Sahara', ja: 'サハラ', ko: '사하라' }, 'K-Pop', 'JP_KR', 99),
    mkArtist('a-005', { zh: 'YUME', en: 'YUME', ja: 'ユメ', ko: '유메' }, 'J-Pop', 'JP_KR', 91),
    mkArtist('a-006', { zh: 'Luna Bay', en: 'Luna Bay', ja: 'ルナベイ', ko: '루나베이' }, '独立', 'SEA', 78),
    mkArtist('a-007', { zh: '风见和真', en: 'Kazami Kazuma', ja: '風見和真', ko: '카자미 카즈마' }, '演歌', 'JP_KR', 72),
    mkArtist('a-008', { zh: '苏若', en: 'Su Ruo', ja: 'スールオ', ko: '수뤄' }, '古典', 'mainland', 69),
  ];
  for (const a of artists) insertArtist.run(a.id, a.name.zh, a.name.en, a.name.ja || null, a.name.ko || null, a.avatar, a.heatIndex, a.genre, a.region);

  const insertVenue = db.prepare(
    'INSERT INTO venues (id,name_zh,name_en,name_ja,name_ko,city_zh,city_en,region,capacity,lng,lat) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
  );
  const venues: Venue[] = [
    mkVenue('v-bj', { zh: '国家体育场（鸟巢）', en: 'National Stadium (Bird\'s Nest)' }, { zh: '北京', en: 'Beijing' }, 'mainland', 91000, 116.396, 39.993),
    mkVenue('v-sh', { zh: '梅赛德斯-奔驰文化中心', en: 'Mercedes-Benz Arena' }, { zh: '上海', en: 'Shanghai' }, 'mainland', 18000, 121.499, 31.188),
    mkVenue('v-gz', { zh: '天河体育中心', en: 'Tianhe Stadium' }, { zh: '广州', en: 'Guangzhou' }, 'mainland', 54000, 113.325, 23.137),
    mkVenue('v-hk', { zh: '亞洲國際博覽館', en: 'AsiaWorld-Expo' }, { zh: '香港', en: 'Hong Kong' }, 'HKMT', 14000, 113.946, 22.322),
    mkVenue('v-tp', { zh: '台北小巨蛋', en: 'Taipei Arena' }, { zh: '台北', en: 'Taipei' }, 'HKMT', 15082, 121.550, 25.052),
    mkVenue('v-tokyo', { zh: '東京ドーム', en: 'Tokyo Dome' }, { zh: '东京', en: 'Tokyo' }, 'JP_KR', 55000, 139.752, 35.706),
    mkVenue('v-seoul', { zh: '고척스카이돔', en: 'Gocheok Sky Dome' }, { zh: '首尔', en: 'Seoul' }, 'JP_KR', 25000, 126.867, 37.498),
    mkVenue('v-osaka', { zh: '京セラドーム大阪', en: 'Kyocera Dome Osaka' }, { zh: '大阪', en: 'Osaka' }, 'JP_KR', 40000, 135.473, 34.669),
    mkVenue('v-sg', { zh: 'National Stadium Singapore', en: 'National Stadium Singapore' }, { zh: '新加坡', en: 'Singapore' }, 'SEA', 55000, 103.872, 1.300),
    mkVenue('v-bkk', { zh: 'ราชมังคลากีฬาสถาน', en: 'Rajamangala Stadium' }, { zh: '曼谷', en: 'Bangkok' }, 'SEA', 49722, 100.623, 13.752),
  ];
  for (const v of venues) insertVenue.run(v.id, v.name.zh, v.name.en, v.name.ja || null, v.name.ko || null, v.city.zh, v.city.en, v.region, v.capacity, v.lng, v.lat);

  const insertOrganizer = db.prepare(
    'INSERT INTO organizers (id,name_zh,name_en,logo,region) VALUES (?,?,?,?,?)',
  );
  const organizers: Organizer[] = [
    mkOrg('o-001', { zh: '星灿文化', en: 'StarCan Culture' }, '🌐', 'mainland'),
    mkOrg('o-002', { zh: '環球娛樂 HK', en: 'Universe HK' }, '🎪', 'HKMT'),
    mkOrg('o-003', { zh: 'Avex Asia', en: 'Avex Asia' }, '🎼', 'JP_KR'),
    mkOrg('o-004', { zh: 'LIVE NATION SG', en: 'Live Nation SG' }, '🎤', 'SEA'),
  ];
  for (const o of organizers) insertOrganizer.run(o.id, o.name.zh, o.name.en, o.logo, o.region);

  const insertAgent = db.prepare('INSERT INTO agents (id,name_zh,name_en) VALUES (?,?,?)');
  const agents: Agent[] = [
    { id: 'ag-001', name: { zh: '银河经纪', en: 'Galaxy Agency' } },
    { id: 'ag-002', name: { zh: 'CAA 亚洲', en: 'CAA Asia' } },
  ];
  for (const a of agents) insertAgent.run(a.id, a.name.zh, a.name.en);

  // ============ Events ============
  const insertEvent = db.prepare(
    `INSERT INTO events (id,title_zh,title_en,title_ja,title_ko,poster,venue_id,organizer_id,agent_id,region,start_time,end_time,languages,currencies,type,status,hot_index,desc_zh,desc_en,desc_ja,desc_ko,notice_zh,notice_en,notice_ja,notice_ko) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insertEA = db.prepare('INSERT INTO event_artists (event_id, artist_id, seq) VALUES (?,?,?)');

  const eventDefs: EventDef[] = [
    {
      id: 'ev-star-x',
      title: { zh: '星海 · 无尽夏巡迴北京站', en: 'Xinghai: Endless Summer Tour · Beijing', ja: '星海：エンドレスサマー北京', ko: '씽하이: 엔드리스 섬머 북경' },
      poster: '🎤🌸',
      region: 'mainland', venue: 'v-bj', org: 'o-001', agent: 'ag-001',
      start: '2026-07-12T19:30:00+08:00', end: '2026-07-12T22:30:00+08:00',
      langs: ['zh', 'en'], currs: ['CNY', 'HKD', 'USD'], type: 'concert', status: 'on_sale', hot: 95,
      artists: ['a-001'],
      desc: {
        zh: '星海五周年世界巡演启幕，3小时极致视听体验，首次呈现全景沉浸式舞美。',
        en: 'Xinghai\'s 5th anniversary world tour kicks off with a 3-hour immersive audiovisual show.',
        ja: '星海5周年ワールドツアー、3時間の完全没入型演出。',
        ko: '씽하이 5주년 월드투어, 3시간 몰입형 오디오비주얼.',
      },
      notice: {
        zh: '1.2 米以下儿童谢绝入场；禁止携带专业摄像设备。',
        en: 'No children under 1.2m. Professional cameras are not allowed.',
        ja: '身長1.2m未満の入場不可。プロ用カメラ不可。',
        ko: '1.2m 미만 어린이 입장 불가. 전문 카메라 반입 금지.',
      },
    },
    {
      id: 'ev-lxm-sh',
      title: { zh: '林夕梦 · 上海不眠夜', en: 'Lin Xi Meng · Sleepless in Shanghai', ja: '林夕夢：上海の眠れぬ夜', ko: '린시멍: 상하이의 잠못 이루는 밤' },
      poster: '🎸🌆',
      region: 'mainland', venue: 'v-sh', org: 'o-001', agent: 'ag-001',
      start: '2026-08-02T20:00:00+08:00', end: '2026-08-02T22:45:00+08:00',
      langs: ['zh', 'en'], currs: ['CNY'], type: 'concert', status: 'on_sale', hot: 82,
      artists: ['a-002'],
      desc: { zh: '林夕梦城市民谣之夜，携手爵士大乐队重现经典。', en: 'City folk night with jazz big band arrangements.' },
      notice: { zh: '现场提供有偿饮品吧。', en: 'Paid beverage bar on site.' },
    },
    {
      id: 'ev-chan-hk',
      title: { zh: '陳凱 2026 維港之夜', en: 'Chan Hoi · Harbour Nights HK 2026', ja: 'チャン・ホイ 2026 香港ハーバーナイツ', ko: '천카이 2026 홍콩 하버 나이츠' },
      poster: '🎭🌊',
      region: 'HKMT', venue: 'v-hk', org: 'o-002', agent: 'ag-002',
      start: '2026-06-28T20:00:00+08:00', end: '2026-06-28T23:00:00+08:00',
      langs: ['zh', 'en', 'ja'], currs: ['HKD', 'CNY', 'TWD'], type: 'concert', status: 'on_sale', hot: 90,
      artists: ['a-003'],
      desc: { zh: '粤语摇滚传奇陈凯，阔别八年再次唱响维港。', en: 'Cantonese rock legend returns after 8 years.' },
      notice: { zh: '跨境观众可申请无票赔付保障。', en: 'Cross-border travelers: no-ticket compensation available.' },
    },
    {
      id: 'ev-sahara-seoul',
      title: { zh: '사하라 [MIRAGE] 首尔站', en: 'Sahara [MIRAGE] in Seoul', ja: 'サハラ [MIRAGE] in ソウル', ko: '사하라 [MIRAGE] in 서울' },
      poster: '💎🎶',
      region: 'JP_KR', venue: 'v-seoul', org: 'o-003', agent: 'ag-002',
      start: '2026-09-18T19:00:00+09:00', end: '2026-09-18T22:00:00+09:00',
      langs: ['ko', 'en', 'ja', 'zh'], currs: ['KRW', 'JPY', 'USD'], type: 'concert', status: 'on_sale', hot: 99,
      artists: ['a-004'],
      desc: { zh: 'K-Pop 女王 Sahara 携新专《MIRAGE》首度开唱。', en: 'K-Pop queen Sahara premieres "MIRAGE".' },
      notice: { zh: '现场提供中英日韩四语字幕。', en: 'Subtitles in 4 languages on stage screens.' },
    },
    {
      id: 'ev-yume-tokyo',
      title: { zh: 'YUME 东京ドーム 星降る夜', en: 'YUME Tokyo Dome · Starfall Night', ja: 'YUME 東京ドーム 星降る夜', ko: '유메 도쿄돔 스타폴 나이트' },
      poster: '🌠🎤',
      region: 'JP_KR', venue: 'v-tokyo', org: 'o-003', agent: 'ag-002',
      start: '2026-11-09T18:30:00+09:00', end: '2026-11-09T21:50:00+09:00',
      langs: ['ja', 'en', 'zh', 'ko'], currs: ['JPY', 'USD', 'CNY'], type: 'concert', status: 'upcoming', hot: 88,
      artists: ['a-005'],
      desc: { zh: 'J-Pop 新声代 YUME 首次登陸東京巨蛋。', en: 'Rising J-Pop star YUME\'s Tokyo Dome debut.' },
      notice: { zh: '门票开售：2026/07/15 12:00 JST。', en: 'Sale starts 2026-07-15 12:00 JST.' },
    },
    {
      id: 'ev-luna-sg',
      title: { zh: 'Luna Bay 新加坡独立之夜', en: 'Luna Bay · Indie Night SG', ja: 'Luna Bay インディーナイトSG', ko: '루나베이 인디 나이트 SG' },
      poster: '🎧🌴',
      region: 'SEA', venue: 'v-sg', org: 'o-004', agent: null,
      start: '2026-10-04T19:30:00+08:00', end: '2026-10-04T22:30:00+08:00',
      langs: ['en', 'zh'], currs: ['SGD', 'USD', 'MYR'], type: 'festival', status: 'on_sale', hot: 72,
      artists: ['a-006'],
      desc: { zh: '独立乐队 Luna Bay 新加坡首演，开放站区。', en: 'Luna Bay\'s Singapore premiere with standing pit.' },
      notice: { zh: '站区请佩戴防噪耳塞。', en: 'Earplugs recommended for standing area.' },
    },
    {
      id: 'ev-kazuma-osaka',
      title: { zh: '风见和真 · 大阪演歌祭', en: 'Kazami Kazuma · Osaka Enka Festival', ja: '風見和真 大阪演歌祭', ko: '카자미 카즈마 오사카 엔카 페스티벌' },
      poster: '🎐🗾',
      region: 'JP_KR', venue: 'v-osaka', org: 'o-003', agent: null,
      start: '2026-12-14T18:00:00+09:00', end: '2026-12-14T21:00:00+09:00',
      langs: ['ja', 'en'], currs: ['JPY'], type: 'concert', status: 'upcoming', hot: 65,
      artists: ['a-007'],
      desc: { zh: '演歌名门风见和真年度盛典。', en: 'Enka master\'s annual festival.' },
      notice: { zh: '建议正装出席。', en: 'Formal attire is recommended.' },
    },
    {
      id: 'ev-bkk-rock',
      title: { zh: '曼谷夏夜摇滚音乐节', en: 'Bangkok Summer Rock Festival', ja: 'バンコク サマーロック', ko: '방콕 썸머 락 페스티벌' },
      poster: '🔥🎸',
      region: 'SEA', venue: 'v-bkk', org: 'o-004', agent: 'ag-002',
      start: '2026-05-20T16:00:00+07:00', end: '2026-05-20T23:30:00+07:00',
      langs: ['en', 'zh', 'ja'], currs: ['THB', 'SGD', 'USD'], type: 'festival', status: 'ended', hot: 80,
      artists: ['a-003', 'a-006'],
      desc: { zh: '泰国年度摇滚盛宴，12 小时 8 支乐队。', en: '12 hours, 8 bands, Thailand\'s annual rock feast.' },
      notice: { zh: '已结束，查看复盘。', en: 'Past event — view review report.' },
    },
    {
      id: 'ev-sruo-gz',
      title: { zh: '苏若 · 广州古典之夜', en: 'Su Ruo · Classical Night GZ', ja: '蘇若 クラシカルナイト広州', ko: '수뤄 클래식 나이트 광저우' },
      poster: '🎻✨',
      region: 'mainland', venue: 'v-gz', org: 'o-001', agent: null,
      start: '2026-09-21T19:30:00+08:00', end: '2026-09-21T21:30:00+08:00',
      langs: ['zh', 'en'], currs: ['CNY'], type: 'concert', status: 'on_sale', hot: 68,
      artists: ['a-008'],
      desc: { zh: '青年钢琴家苏若携手广州交响乐团。', en: 'Pianist Su Ruo with Guangzhou Symphony Orchestra.' },
      notice: { zh: '演出期间请关闭手机铃声。', en: 'Silence your phones during performance.' },
    },
    {
      id: 'ev-sahara-tp',
      title: { zh: '사하라 [MIRAGE] 台北小巨蛋', en: 'Sahara [MIRAGE] in Taipei', ja: 'サハラ [MIRAGE] in 台北', ko: '사하라 [MIRAGE] in 타이페이' },
      poster: '💜💫',
      region: 'HKMT', venue: 'v-tp', org: 'o-002', agent: 'ag-002',
      start: '2026-10-12T19:30:00+08:00', end: '2026-10-12T22:30:00+08:00',
      langs: ['zh', 'ko', 'en', 'ja'], currs: ['TWD', 'CNY', 'HKD', 'USD'], type: 'concert', status: 'on_sale', hot: 97,
      artists: ['a-004'],
      desc: { zh: '撒哈拉首度征服台北小巨蛋，三安可保证。', en: 'Sahara\'s Taipei Arena debut, 3 encores guaranteed.' },
      notice: { zh: '每人限购 4 张，需实名绑定。', en: '4 tickets max per person. ID required.' },
    },
  ];

  for (let i = 0; i < eventDefs.length; i++) {
    const e = eventDefs[i];
    insertEvent.run(
      e.id,
      e.title.zh, e.title.en, e.title.ja ?? null, e.title.ko ?? null,
      e.poster, e.venue, e.org, e.agent, e.region, e.start, e.end,
      JSON.stringify(e.langs), JSON.stringify(e.currs),
      e.type, e.status, e.hot,
      e.desc.zh, e.desc.en, e.desc.ja ?? null, e.desc.ko ?? null,
      e.notice.zh, e.notice.en, e.notice.ja ?? null, e.notice.ko ?? null,
    );
    e.artists.forEach((aid, seq) => insertEA.run(e.id, aid, seq));
  }

  // ============ Tiers ============
  const insertTier = db.prepare(
    'INSERT INTO ticket_tiers (id, event_id, grade, base_price, current_price, delta_pct, total_seats, sold_seats, hot_index) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  const tierConfigs: { ev: string; base: number[] }[] = [
    { ev: 'ev-star-x', base: [2280, 1680, 1080, 580] },
    { ev: 'ev-lxm-sh', base: [1280, 880, 580, 280] },
    { ev: 'ev-chan-hk', base: [1680, 1180, 780, 380] },
    { ev: 'ev-sahara-seoul', base: [1980, 1480, 980, 480] },
    { ev: 'ev-yume-tokyo', base: [15800, 11800, 7800, 3800] },
    { ev: 'ev-luna-sg', base: [228, 168, 108, 68] },
    { ev: 'ev-kazuma-osaka', base: [12800, 8800, 5800, 2800] },
    { ev: 'ev-bkk-rock', base: [1880, 1280, 680, 380] },
    { ev: 'ev-sruo-gz', base: [1280, 880, 480, 180] },
    { ev: 'ev-sahara-tp', base: [6880, 5280, 3680, 1880] },
  ];
  const grades: TicketGrade[] = ['VIP', 'A', 'B', 'C'];
  const tiersForEvent: Record<string, { id: string; grade: TicketGrade; total: number; sold: number; base: number; cur: number; pct: number; hot: number }[]> = {};

  for (const tc of tierConfigs) {
    tiersForEvent[tc.ev] = [];
    for (let g = 0; g < grades.length; g++) {
      const base = tc.base[g];
      const heat = [92, 78, 60, 40][g] + Math.round(Math.random() * 12);
      const total = [600, 1800, 3600, 6000][g];
      const soldRatio = 0.25 + Math.random() * 0.65;
      const sold = Math.round(total * soldRatio);
      // 动态定价：热度 + 剩余率
      const deltaPct = Math.round((heat - 65) * 0.4 + (sold / total - 0.5) * 18 + (Math.random() * 6 - 3));
      const current = Math.round(base * (1 + deltaPct / 100));
      const id = `${tc.ev}-${grades[g]}`;
      insertTier.run(id, tc.ev, grades[g], base, current, deltaPct, total, sold, heat);
      tiersForEvent[tc.ev].push({ id, grade: grades[g], total, sold, base, cur: current, pct: deltaPct, hot: heat });
    }
  }

  // ============ Orders (fake current user) ============
  const insertOrder = db.prepare(
    'INSERT INTO orders (id,user_id,event_id,tier_id,seats,quantity,currency,channel,status,amount_currency,amount_cny,crypto_tag,verified,comp_flight,comp_hotel,comp_total,comp_status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  );
  const FX: Record<string, number> = { CNY: 1, HKD: 0.92, TWD: 0.22, JPY: 0.047, KRW: 0.0054, USD: 7.18, SGD: 5.3, MYR: 1.53, THB: 0.2 };
  const orders: unknown[][] = [
    mkOrder('o-u1', 'u-self', 'ev-star-x', tiersForEvent['ev-star-x'][0], 2, 'CNY', 'ALIPAY_PLUS', 'paid', FX, false),
    mkOrder('o-u2', 'u-self', 'ev-sahara-tp', tiersForEvent['ev-sahara-tp'][1], 2, 'TWD', 'LINEPAY', 'paid', FX, false),
    mkOrder('o-u3', 'u-self', 'ev-chan-hk', tiersForEvent['ev-chan-hk'][2], 1, 'HKD', 'PAYME', 'compensated', FX, true),
    mkOrder('o-u4', 'u-self', 'ev-sahara-seoul', tiersForEvent['ev-sahara-seoul'][0], 2, 'KRW', 'VISA', 'paid', FX, false),
    mkOrder('o-u5', 'u-self', 'ev-bkk-rock', tiersForEvent['ev-bkk-rock'][1], 3, 'THB', 'MASTERCARD', 'paid', FX, true),
    mkOrder('o-u6', 'u-self', 'ev-yume-tokyo', tiersForEvent['ev-yume-tokyo'][1], 2, 'JPY', 'VISA', 'pending', FX, false),
  ];
  for (const o of orders) insertOrder.run(...o);

  // ============ Issues ============
  const insertIssue = db.prepare(
    'INSERT INTO ticket_issues (id,type,order_id,event_id,crypto_tag,title,description,priority,status,owner,sla_deadline,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
  );
  const issuesDef: { id: string; type: string; orderId: string | null; eventId: string; cryptoTag: string | null; title: string; desc: string; pri: string; st: string; own: string; sla: string }[] = [
    { id: 'iss-001', type: 'FAKE_TICKET', orderId: 'o-u2', eventId: 'ev-sahara-tp', cryptoTag: (orders[1] as any)[11] as string, title: '加密串与官方签名不符', desc: '观众持非平台渠道购票入场失败，加密串疑似伪造，需要沿链路倒查来源。', pri: 'P0', st: 'INVESTIGATING', own: '风控组·郑南', sla: addHours(12) },
    { id: 'iss-002', type: 'VERIFY_FAIL', orderId: 'o-u5', eventId: 'ev-bkk-rock', cryptoTag: (orders[4] as any)[11] as string, title: '终端 T-BKK-07 验签超时', desc: '当晚 20:32 共 14 笔验签请求超时，疑似 4G 信号不稳，需补录并同步给观众。', pri: 'P1', st: 'OPEN', own: '现场组·林楠', sla: addHours(24) },
    { id: 'iss-003', type: 'NO_TICKET_COMP', orderId: 'o-u3', eventId: 'ev-chan-hk', cryptoTag: (orders[2] as any)[11] as string, title: '无票赔付已触发 · 机票酒店报销', desc: '观众从上海飞往香港但演出临时取消，已自动触发赔付工单，报销凭证待审核。', pri: 'P0', st: 'INVESTIGATING', own: '赔付组·何溪', sla: addHours(48) },
    { id: 'iss-004', type: 'PAYMENT_ANOMALY', orderId: 'o-u6', eventId: 'ev-yume-tokyo', cryptoTag: null, title: 'Visa 3DS 鉴权失败', desc: '跨境支付 3DS 通道返回 issuer timeout，建议切换 Alipay+ 重试。', pri: 'P2', st: 'OPEN', own: '支付组·星野', sla: addHours(6) },
    { id: 'iss-005', type: 'FAKE_TICKET', orderId: null, eventId: 'ev-star-x', cryptoTag: 'FAKE-7F9A2C1D-XINGHAI-BJ-0612', title: '闲鱼发现疑似伪造加密串', desc: '风控爬虫扫描到未出现在官方数据库的加密串对外售卖，需封禁并溯源。', pri: 'P0', st: 'OPEN', own: '风控组·郑南', sla: addHours(4) },
    { id: 'iss-006', type: 'NO_TICKET_COMP', orderId: null, eventId: 'ev-kazuma-osaka', cryptoTag: null, title: '台风 26 号 · 大阪场取消预案', desc: '提前为跨境观众开启赔付预登记，支持机票改签与酒店取消险。', pri: 'P1', st: 'INVESTIGATING', own: '赔付组·何溪', sla: addDays(3) },
  ];
  for (const it of issuesDef) {
    insertIssue.run(it.id, it.type, it.orderId, it.eventId, it.cryptoTag, it.title, it.desc, it.pri, it.st, it.own, it.sla, itSla(it.sla));
  }

  // ============ Verify terminals ============
  const insertTerminal = db.prepare(
    'INSERT INTO verify_terminals (id, venue_id, online, verified, errors, last_heartbeat) VALUES (?,?,?,?,?,?)',
  );
  const terms = [
    ['T-BJ-01', 'v-bj', 1, 1128, 7, nowISO()],
    ['T-BJ-02', 'v-bj', 1, 1210, 3, nowISO()],
    ['T-BJ-03', 'v-bj', 0, 980, 12, hoursAgo(3)],
    ['T-HK-01', 'v-hk', 1, 842, 2, nowISO()],
    ['T-HK-02', 'v-hk', 1, 790, 5, nowISO()],
    ['T-TPE-01', 'v-tp', 1, 1360, 4, nowISO()],
    ['T-TPE-02', 'v-tp', 1, 1288, 8, nowISO()],
    ['T-SEL-01', 'v-seoul', 1, 1520, 6, nowISO()],
    ['T-SEL-02', 'v-seoul', 1, 1488, 2, nowISO()],
    ['T-TYO-01', 'v-tokyo', 1, 640, 1, nowISO()],
    ['T-OSA-01', 'v-osaka', 0, 310, 0, hoursAgo(5)],
    ['T-SG-01', 'v-sg', 1, 480, 3, nowISO()],
    ['T-BKK-07', 'v-bkk', 1, 1880, 14, nowISO()],
  ];
  for (const t of terms) insertTerminal.run(...t);

  // ============ Pricing ticks ============
  const insertTick = db.prepare(
    'INSERT INTO pricing_ticks (event_id, tier_id, ts, price, remaining, heat) VALUES (?,?,?,?,?,?)',
  );
  const tickEvents = ['ev-star-x', 'ev-sahara-tp', 'ev-chan-hk', 'ev-sahara-seoul'];
  for (const evid of tickEvents) {
    const tiers = tiersForEvent[evid];
    if (!tiers) continue;
    for (const t of tiers) {
      const hours = 72;
      for (let h = 0; h <= hours; h += 2) {
        const ratio = h / hours;
        const soldRatio = Math.min(0.95, 0.05 + ratio * 0.9 + (Math.sin(ratio * 6) * 0.04));
        const remaining = Math.max(0, Math.round(t.total * (1 - soldRatio)));
        const heat = Math.round(40 + soldRatio * 55 + (Math.random() * 10 - 5));
        const price = Math.round(t.base * (1 + (heat - 65) * 0.0035 + (soldRatio - 0.5) * 0.25));
        const ts = `${2026}-06-${String(1 + Math.floor(h / 24)).padStart(2, '0')}T${String((h % 24)).padStart(2, '0')}:00:00`;
        insertTick.run(evid, t.id, ts, price, remaining, heat);
      }
    }
  }

  // ============ City flows ============
  const insertFlow = db.prepare(
    'INSERT INTO city_flows (event_id, from_city, to_city, audience_count) VALUES (?,?,?,?)',
  );
  const flowData: [string, [string, number][]][] = [
    ['ev-star-x', [['上海', 2380], ['广州', 1820], ['深圳', 1460], ['成都', 980], ['杭州', 840], ['武汉', 620], ['西安', 510], ['长沙', 420]]],
    ['ev-chan-hk', [['广州', 3120], ['深圳', 2780], ['上海', 960], ['北京', 720], ['澳门', 540], ['珠海', 410]]],
    ['ev-sahara-seoul', [['首尔本地', 14200], ['釜山', 1240], ['北京', 880], ['上海', 760], ['东京', 520], ['大阪', 310], ['香港', 280]]],
    ['ev-sahara-tp', [['台北本地', 9800], ['新北', 1120], ['台中', 860], ['高雄', 720], ['香港', 540], ['上海', 420], ['东京', 380], ['首尔', 210]]],
    ['ev-bkk-rock', [['曼谷本地', 22000], ['清迈', 1680], ['上海', 820], ['北京', 610], ['广州', 580], ['新加坡', 410], ['吉隆坡', 320]]],
    ['ev-yume-tokyo', [['东京本地', 32000], ['大阪', 2180], ['京都', 1460], ['上海', 880], ['首尔', 640], ['台北', 520]]],
  ];
  const toCity: Record<string, string> = {
    'ev-star-x': '北京',
    'ev-chan-hk': '香港',
    'ev-sahara-seoul': '首尔',
    'ev-sahara-tp': '台北',
    'ev-bkk-rock': '曼谷',
    'ev-yume-tokyo': '东京',
  };
  for (const [ev, flows] of flowData) {
    for (const [from, n] of flows) insertFlow.run(ev, from, toCity[ev], n);
  }

  // ============ IP relations ============
  const insertRel = db.prepare(
    'INSERT INTO ip_relations (id, source, target, kind, weight) VALUES (?,?,?,?,?)',
  );
  const rels: [string, string, string, number][] = [
    ['a-001', 'o-001', 'A_O', 95], ['a-001', 'ag-001', 'A_Agt', 100], ['a-001', 'v-bj', 'A_V', 85], ['a-001', 'v-sh', 'A_V', 62],
    ['a-002', 'o-001', 'A_O', 82], ['a-002', 'ag-001', 'A_Agt', 90], ['a-002', 'v-sh', 'A_V', 88],
    ['a-003', 'o-002', 'A_O', 94], ['a-003', 'ag-002', 'A_Agt', 88], ['a-003', 'v-hk', 'A_V', 96],
    ['a-004', 'o-003', 'A_O', 98], ['a-004', 'ag-002', 'A_Agt', 99], ['a-004', 'v-seoul', 'A_V', 94], ['a-004', 'v-tp', 'A_V', 86],
    ['a-005', 'o-003', 'A_O', 88], ['a-005', 'v-tokyo', 'A_V', 82], ['a-005', 'v-osaka', 'A_V', 64],
    ['a-006', 'o-004', 'A_O', 72], ['a-006', 'v-sg', 'A_V', 80],
    ['a-007', 'o-003', 'A_O', 68], ['a-007', 'v-osaka', 'A_V', 74],
    ['a-008', 'o-001', 'A_O', 58], ['a-008', 'v-gz', 'A_V', 70],
    ['o-001', 'v-bj', 'O_V', 88], ['o-001', 'v-sh', 'O_V', 76], ['o-001', 'v-gz', 'O_V', 60],
    ['o-002', 'v-hk', 'O_V', 92], ['o-002', 'v-tp', 'O_V', 74],
    ['o-003', 'v-tokyo', 'O_V', 86], ['o-003', 'v-seoul', 'O_V', 90], ['o-003', 'v-osaka', 'O_V', 78],
    ['o-004', 'v-sg', 'O_V', 84], ['o-004', 'v-bkk', 'O_V', 70],
  ];
  let rid = 1;
  for (const [s, t, k, w] of rels) insertRel.run(`r-${String(rid++).padStart(4, '0')}`, s, t, k, w);

  // ============ Profile ============
  db.prepare(
    'INSERT INTO profile (id,name,role,language,currency,region,phone,updated_at) VALUES (?,?,?,?,?,?,?,?)',
  ).run('u-self', '星野真希', '全球观众会员', 'zh', 'CNY', 'mainland', '+86 138****8919', nowISO());

  console.log('[seed] 星程票务 StarPass 数据库初始化完成。');
}

// ============================================================
// helpers
// ============================================================
interface EventDef {
  id: string;
  title: { zh: string; en: string; ja?: string; ko?: string };
  poster: string;
  region: Region;
  venue: string; org: string; agent: string | null;
  start: string; end: string;
  langs: string[]; currs: string[];
  type: EventType; status: EventStatus; hot: number;
  artists: string[];
  desc: { zh: string; en: string; ja?: string; ko?: string };
  notice: { zh: string; en: string; ja?: string; ko?: string };
}

function mkArtist(id: string, name: Artist['name'], genre: string, region: Region, heat: number): Artist & { _id: string } {
  const color = ['#FF2E88', '#F5B544', '#2DD4BF', '#8B5CF6', '#EF4444', '#10B981'][Math.floor(Math.random() * 6)];
  const initial = name.zh.slice(0, 1);
  const avatar =
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${color}'/><stop offset='1' stop-color='#0B1A3A'/></linearGradient></defs><rect width='120' height='120' rx='24' fill='url(%23g)'/><text x='50%' y='54%' text-anchor='middle' font-family='PingFang SC, sans-serif' font-size='58' font-weight='700' fill='white' dominant-baseline='middle'>${initial}</text></svg>`,
    )}`;
  return { id, name, avatar, genre, region, heatIndex: heat, _id: id };
}

function mkVenue(id: string, name: Venue['name'], city: Venue['city'], region: Region, capacity: number, lng: number, lat: number): Venue {
  return { id, name, city, region, capacity, lng, lat };
}
function mkOrg(id: string, name: Organizer['name'], logo: string, region: Region): Organizer {
  return { id, name, logo, region };
}

function itSla(sla: string) {
  return sla;
}
function nowISO() {
  return new Date().toISOString();
}
function hoursAgo(h: number) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}
function addHours(h: number) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}
function addDays(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString();
}

function mkOrder(
  id: string, userId: string, eventId: string,
  tier: { id: string; grade: TicketGrade; total: number; sold: number; base: number; cur: number },
  quantity: number, currency: string, channel: string, status: string,
  FX: Record<string, number>, verified: boolean,
): any[] {
  const seats = Array.from({ length: quantity }, (_, i) => `${tier.grade}-${String(100 + Math.floor(Math.random() * 400))}-${String(i + 1)}`);
  const fx = FX[currency] ?? 1;
  const amountCny = tier.cur * quantity;
  const amountCurrency = Math.round(amountCny / fx);
  const cryptoTag = `SP-${id.toUpperCase()}-${Buffer.from(`${eventId}-${tier.id}-${Date.now()}-${Math.random()}`).toString('base64url').slice(0, 18)}`;
  const created = hoursAgo(Math.floor(Math.random() * 240));
  const compTotal = status === 'compensated' ? 4800 : null;
  return [
    id, userId, eventId, tier.id,
    JSON.stringify(seats), quantity, currency, channel, status,
    amountCurrency, amountCny, cryptoTag,
    verified ? 1 : 0,
    status === 'compensated' ? 2800 : null,
    status === 'compensated' ? 2000 : null,
    compTotal,
    status === 'compensated' ? 'approved' : null,
    created,
  ];
}
