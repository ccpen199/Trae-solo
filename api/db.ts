import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CITIES,
  mockProducts,
  mockCityMetrics,
  mockCrossCityFlows,
  mockMerchants,
  mockMember,
  mockPointRecords,
  mockSettlementConfigs,
  mockAuditRecords,
} from '../shared/data'
import type { Product, City, CrossCityFlow, CityMetrics, Merchant, PointRecord, SettlementConfig, AuditRecord } from '../shared/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'data.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS cities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  memberCount INTEGER NOT NULL DEFAULT 0,
  merchantCount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('movie','ecommerce','local_life')),
  city TEXT NOT NULL,
  price REAL NOT NULL,
  originalPrice REAL,
  image TEXT,
  cpsRate REAL,
  externalUrl TEXT,
  cinemaName TEXT,
  cinemaHall TEXT,
  cinemaShowtime TEXT,
  merchantId TEXT,
  rating REAL,
  distance REAL,
  category TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS city_metrics (
  city TEXT PRIMARY KEY,
  gmv REAL NOT NULL DEFAULT 0,
  gmvTrendJson TEXT NOT NULL,
  repurchaseRate REAL NOT NULL DEFAULT 0,
  repurchaseTrendJson TEXT NOT NULL,
  couponRedemptionRate REAL NOT NULL DEFAULT 0,
  couponTrendJson TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cross_city_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromCity TEXT NOT NULL,
  toCity TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  transactions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  auditStatus TEXT NOT NULL CHECK(auditStatus IN ('pending_ocr','pending_review','pending_deposit','active','rejected')),
  settlementCycle TEXT NOT NULL CHECK(settlementCycle IN ('T+1','T+3','T+7')),
  deposit REAL NOT NULL DEFAULT 0,
  qBusinessLicense TEXT,
  qLegalPerson TEXT,
  qRegisteredCapital TEXT
);

CREATE TABLE IF NOT EXISTS audit_records (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  step TEXT NOT NULL CHECK(step IN ('ocr','review','deposit')),
  status TEXT NOT NULL CHECK(status IN ('pending','passed','rejected')),
  datetime TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS settlement_configs (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  cycle TEXT NOT NULL CHECK(cycle IN ('T+1','T+3','T+7')),
  minAmount REAL NOT NULL DEFAULT 0,
  lastSettlement TEXT NOT NULL
);
`)

function seed() {
  const citiesCount = db.prepare('SELECT COUNT(*) AS c FROM cities').get() as { c: number }
  if (citiesCount.c > 0) return

  const insertCity = db.prepare('INSERT INTO cities (code, name, memberCount, merchantCount) VALUES (?, ?, ?, ?)')
  const txCities = db.transaction((items: City[]) => { for (const c of items) insertCity.run(c.code, c.name, c.memberCount, c.merchantCount) })
  txCities(CITIES)

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, type, city, price, originalPrice, image, cpsRate, externalUrl,
      cinemaName, cinemaHall, cinemaShowtime, merchantId, rating, distance, category, description)
    VALUES (@id, @name, @type, @city, @price, @originalPrice, @image, @cpsRate, @externalUrl,
      @cinemaName, @cinemaHall, @cinemaShowtime, @merchantId, @rating, @distance, @category, @description)
  `)
  const txProducts = db.transaction((items: Product[]) => {
    for (const p of items) {
      insertProduct.run({
        id: p.id,
        name: p.name,
        type: p.type,
        city: p.city,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        image: p.image ?? null,
        cpsRate: p.cpsRate ?? null,
        externalUrl: p.externalUrl ?? null,
        cinemaName: p.cinema?.name ?? null,
        cinemaHall: p.cinema?.hall ?? null,
        cinemaShowtime: p.cinema?.showtime ?? null,
        merchantId: p.merchant ?? null,
        rating: p.rating ?? null,
        distance: p.distance ?? null,
        category: p.category ?? null,
        description: p.description ?? null,
      })
    }
  })
  txProducts(mockProducts)

  const insertMetric = db.prepare(`INSERT INTO city_metrics (city, gmv, gmvTrendJson, repurchaseRate, repurchaseTrendJson, couponRedemptionRate, couponTrendJson) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  const txMetrics = db.transaction((items: CityMetrics[]) => {
    for (const m of items) {
      insertMetric.run(
        m.city,
        m.gmv,
        JSON.stringify(m.gmvTrend),
        m.repurchaseRate,
        JSON.stringify(m.repurchaseTrend),
        m.couponRedemptionRate,
        JSON.stringify(m.couponTrend),
      )
    }
  })
  txMetrics(mockCityMetrics)

  const insertFlow = db.prepare('INSERT INTO cross_city_flows (fromCity, toCity, amount, transactions) VALUES (?, ?, ?, ?)')
  const txFlows = db.transaction((items: CrossCityFlow[]) => { for (const f of items) insertFlow.run(f.fromCity, f.toCity, f.amount, f.transactions) })
  txFlows(mockCrossCityFlows)

  const insertMerchant = db.prepare(`INSERT INTO merchants (id, name, category, city, auditStatus, settlementCycle, deposit, qBusinessLicense, qLegalPerson, qRegisteredCapital) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const txMerchants = db.transaction((items: Merchant[]) => {
    for (const m of items) {
      insertMerchant.run(
        m.id, m.name, m.category, m.city,
        m.auditStatus, m.settlementCycle, m.deposit,
        m.qualification?.businessLicense ?? null,
        m.qualification?.legalPerson ?? null,
        m.qualification?.registeredCapital ?? null,
      )
    }
  })
  txMerchants(mockMerchants)

  const insertAudit = db.prepare('INSERT INTO audit_records (id, merchantId, step, status, datetime, note) VALUES (?, ?, ?, ?, ?, ?)')
  const txAudit = db.transaction((items: AuditRecord[]) => { for (const a of items) insertAudit.run(a.id, a.merchantId, a.step, a.status, a.datetime, a.note ?? null) })
  txAudit(mockAuditRecords)

  const insertSettlement = db.prepare('INSERT INTO settlement_configs (id, merchantId, cycle, minAmount, lastSettlement) VALUES (?, ?, ?, ?, ?)')
  const txSettlement = db.transaction((items: SettlementConfig[]) => { for (const s of items) insertSettlement.run(s.id, s.merchantId, s.cycle, s.minAmount, s.lastSettlement) })
  txSettlement(mockSettlementConfigs)
}

seed()

function parseProducts(rows: any[]): Product[] {
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as any,
    city: r.city,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    image: r.image ?? undefined,
    cpsRate: r.cpsRate ?? undefined,
    externalUrl: r.externalUrl ?? undefined,
    cinema: r.cinemaName ? { name: r.cinemaName, hall: r.cinemaHall ?? undefined, showtime: r.cinemaShowtime ?? undefined } : undefined,
    merchant: r.merchantId ?? undefined,
    rating: r.rating ?? undefined,
    distance: r.distance ?? undefined,
    category: r.category ?? undefined,
    description: r.description ?? undefined,
  }))
}

function parseMetrics(rows: any[]): CityMetrics[] {
  return rows.map(r => ({
    city: r.city,
    gmv: r.gmv,
    gmvTrend: JSON.parse(r.gmvTrendJson),
    repurchaseRate: r.repurchaseRate,
    repurchaseTrend: JSON.parse(r.repurchaseTrendJson),
    couponRedemptionRate: r.couponRedemptionRate,
    couponTrend: JSON.parse(r.couponTrendJson),
  }))
}

function parseMerchants(rows: any[]): Merchant[] {
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category as any,
    city: r.city,
    auditStatus: r.auditStatus as any,
    settlementCycle: r.settlementCycle as any,
    deposit: r.deposit,
    qualification: {
      businessLicense: r.qBusinessLicense ?? '',
      legalPerson: r.qLegalPerson ?? '',
      registeredCapital: r.qRegisteredCapital ?? '',
    },
  }))
}

export default db
export { CITIES, mockMember, mockPointRecords, parseProducts, parseMetrics, parseMerchants }
