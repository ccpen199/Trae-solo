import db from '../db/database.js';
import { WaterTransaction, SemesterSummary } from '../../shared/types.js';
import { generateId, generateTransactionHash } from '../utils/hash.js';
import { updateStudentBalance } from './studentService.js';

function rowToTransaction(row: {
  id: string; student_id: string; device_id: string; start_time: number;
  end_time: number | null; volume: number; amount: number;
  hash: string; prev_hash: string | null; synced_to_campus: number;
  created_at: number; device_name?: string; device_location?: string;
}): WaterTransaction {
  return {
    id: row.id,
    studentId: row.student_id,
    deviceId: row.device_id,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    volume: row.volume,
    amount: row.amount,
    hash: row.hash,
    prevHash: row.prev_hash,
    syncedToCampus: row.synced_to_campus === 1,
    deviceName: row.device_name,
    deviceLocation: row.device_location,
  };
}

export function getLastTransactionHash(): string | null {
  const row = db.prepare(`
    SELECT hash FROM water_transactions ORDER BY start_time DESC LIMIT 1
  `).get() as { hash: string } | undefined;
  return row?.hash || null;
}

export function startTransaction(studentId: string, deviceId: string): WaterTransaction {
  const txId = generateId('tx');
  const startTime = Date.now();
  const prevHash = getLastTransactionHash();
  const hash = generateTransactionHash(txId, studentId, deviceId, startTime, 0, 0, prevHash);

  db.prepare(`
    INSERT INTO water_transactions (id, student_id, device_id, start_time, volume, amount, hash, prev_hash, synced_to_campus, created_at)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?, 0, ?)
  `).run(txId, studentId, deviceId, startTime, hash, prevHash, startTime);

  db.prepare('UPDATE devices SET last_online = ? WHERE id = ?').run(startTime, deviceId);

  const device = db.prepare('SELECT name, location FROM devices WHERE id = ?').get(deviceId) as { name: string; location: string } | undefined;

  return {
    id: txId,
    studentId,
    deviceId,
    startTime,
    volume: 0,
    amount: 0,
    hash,
    prevHash,
    syncedToCampus: false,
    deviceName: device?.name,
    deviceLocation: device?.location,
  };
}

const WATER_PRICE_PER_LITER = 0.08;

export function updateTransactionVolume(transactionId: string, volume: number): WaterTransaction | null {
  const amount = Number((volume * WATER_PRICE_PER_LITER).toFixed(2));
  const tx = db.prepare('SELECT * FROM water_transactions WHERE id = ?').get(transactionId) as {
    id: string; student_id: string; device_id: string; start_time: number; prev_hash: string | null;
  } | undefined;

  if (!tx) return null;

  const newHash = generateTransactionHash(tx.id, tx.student_id, tx.device_id, tx.start_time, volume, amount, tx.prev_hash);
  
  db.prepare(`
    UPDATE water_transactions SET volume = ?, amount = ?, hash = ? WHERE id = ?
  `).run(volume, amount, newHash, transactionId);

  const result = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.id = ?
  `).get(transactionId) as any;

  return rowToTransaction(result);
}

export function endTransaction(transactionId: string, finalVolume: number): WaterTransaction | null {
  const tx = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.id = ?
  `).get(transactionId) as any;

  if (!tx) return null;

  const amount = Number((finalVolume * WATER_PRICE_PER_LITER).toFixed(2));
  const newHash = generateTransactionHash(tx.id, tx.student_id, tx.device_id, tx.start_time, finalVolume, amount, tx.prev_hash);
  const endTime = Date.now();

  db.prepare(`
    UPDATE water_transactions SET 
      volume = ?, amount = ?, hash = ?, end_time = ?, synced_to_campus = 1
    WHERE id = ?
  `).run(finalVolume, amount, newHash, endTime, transactionId);

  updateStudentBalance(tx.student_id, -amount);

  db.prepare(`
    UPDATE devices SET 
      today_water_usage = today_water_usage + ?,
      today_revenue = today_revenue + ?,
      total_water_usage = total_water_usage + ?,
      total_revenue = total_revenue + ?
    WHERE id = ?
  `).run(finalVolume, amount, finalVolume, amount, tx.device_id);

  const result = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.id = ?
  `).get(transactionId) as any;

  return rowToTransaction(result);
}

export function getStudentTransactions(
  studentId: string,
  limit = 50,
  offset = 0
): { transactions: WaterTransaction[]; total: number } {
  const rows = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.student_id = ?
    ORDER BY wt.start_time DESC
    LIMIT ? OFFSET ?
  `).all(studentId, limit, offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM water_transactions WHERE student_id = ?
  `).get(studentId) as { count: number };

  return {
    transactions: rows.map(rowToTransaction),
    total: total.count,
  };
}

export function getTransactionById(transactionId: string): WaterTransaction | null {
  const row = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.id = ?
  `).get(transactionId) as any;
  return row ? rowToTransaction(row) : null;
}

function getSemester(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 2 && month <= 7) {
    return `${year}-春季学期`;
  }
  return `${year}-${year + 1}-秋季学期`;
}

export function getSemesterSummary(studentId: string, semester?: string): SemesterSummary {
  const now = new Date();
  const targetSemester = semester || getSemester(now);

  let startDate: Date;
  let endDate: Date;
  const parts = targetSemester.split('-');
  
  if (targetSemester.includes('春季')) {
    const year = parseInt(parts[0]);
    startDate = new Date(year, 1, 15);
    endDate = new Date(year, 6, 20);
  } else {
    const year = parseInt(parts[0]);
    startDate = new Date(year, 7, 25);
    endDate = new Date(year + 1, 0, 20);
  }

  const rows = db.prepare(`
    SELECT wt.*, d.name as device_name, d.location as device_location
    FROM water_transactions wt
    LEFT JOIN devices d ON wt.device_id = d.id
    WHERE wt.student_id = ? AND wt.start_time >= ? AND wt.start_time <= ? AND wt.end_time IS NOT NULL
    ORDER BY wt.start_time ASC
  `).all(studentId, startDate.getTime(), endDate.getTime()) as any[];

  const totalVolume = rows.reduce((sum, r) => sum + r.volume, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  const monthlyMap = new Map<string, { volume: number; amount: number }>();
  for (const row of rows) {
    const d = new Date(row.start_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(key) || { volume: 0, amount: 0 };
    existing.volume += row.volume;
    existing.amount += row.amount;
    monthlyMap.set(key, existing);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }));

  return {
    semester: targetSemester,
    totalVolume: Number(totalVolume.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    transactionCount: rows.length,
    averagePerTransaction: rows.length > 0 ? Number((totalAmount / rows.length).toFixed(2)) : 0,
    monthlyBreakdown,
  };
}

export function getAvailableSemesters(studentId: string): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT start_time FROM water_transactions 
    WHERE student_id = ? AND end_time IS NOT NULL
    ORDER BY start_time DESC
  `).all(studentId) as { start_time: number }[];

  const semesters = new Set<string>();
  for (const row of rows) {
    semesters.add(getSemester(new Date(row.start_time)));
  }
  return Array.from(semesters).sort().reverse();
}
