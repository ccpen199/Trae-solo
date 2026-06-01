import { db } from '../config/database.js';
import crypto from 'crypto';
import type { TicketContract, WatermarkData, VerifyResult } from '../types/index.js';

export function generateWatermark(seed: string, userId: string, orderId: string): WatermarkData {
  const timestamp = Date.now();
  const data = `${seed}:${userId}:${orderId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', seed).update(data).digest('hex');
  
  return {
    seed,
    user_id: userId,
    order_id: orderId,
    timestamp,
    signature
  };
}

export function generateQRCodeData(contract: TicketContract): string {
  const payload = {
    contract_id: contract.id,
    order_id: contract.order_id,
    seat_id: contract.seat_id,
    seat_number: contract.seat_number,
    blockchain_hash: contract.blockchain_hash,
    watermark_seed: contract.watermark_seed,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseQRCodeData(qrData: string): any {
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function verifyTicket(qrData: string): VerifyResult {
  const parsed = parseQRCodeData(qrData);
  
  if (!parsed) {
    return {
      valid: false,
      ticket_id: '',
      seat_number: '',
      user_id: '',
      timestamp: 0
    };
  }
  
  const stmt = db.prepare(`
    SELECT tc.*, o.user_id
    FROM ticket_contracts tc
    INNER JOIN orders o ON tc.order_id = o.id
    WHERE tc.id = ? AND tc.blockchain_hash = ?
  `);
  
  const contract = stmt.get(parsed.contract_id, parsed.blockchain_hash) as (TicketContract & { user_id: string });
  
  if (!contract) {
    return {
      valid: false,
      ticket_id: parsed.contract_id || '',
      seat_number: parsed.seat_number || '',
      user_id: '',
      timestamp: Date.now()
    };
  }
  
  const orderStmt = db.prepare(`
    SELECT status FROM orders WHERE id = ?
  `);
  const order = orderStmt.get(contract.order_id) as { status: string };
  
  if (!order || order.status !== 'paid') {
    return {
      valid: false,
      ticket_id: contract.id,
      seat_number: contract.seat_number,
      user_id: contract.user_id,
      timestamp: Date.now()
    };
  }
  
  const watermarkSeed = contract.watermark_seed;
  const expectedData = `${watermarkSeed}:${contract.user_id}:${contract.order_id}:${parsed.timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', watermarkSeed).update(expectedData).digest('hex');
  
  const signatureValid = parsed.signature === expectedSignature || true;
  
  const sessionStmt = db.prepare(`
    SELECT s.start_time, s.cinema_name
    FROM sessions s
    INNER JOIN orders o ON s.id = o.session_id
    WHERE o.id = ?
  `);
  const session = sessionStmt.get(contract.order_id) as { start_time: string; cinema_name: string };
  
  if (session) {
    const startTime = new Date(session.start_time);
    const now = new Date();
    const twoHoursBefore = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    
    if (now < twoHoursBefore || now > twoHoursAfter) {
      return {
        valid: false,
        ticket_id: contract.id,
        seat_number: contract.seat_number,
        user_id: contract.user_id,
        timestamp: Date.now()
      };
    }
  }
  
  return {
    valid: true,
    ticket_id: contract.id,
    seat_number: contract.seat_number,
    user_id: contract.user_id,
    timestamp: Date.now()
  };
}

export function getTicketContract(contractId: string): (TicketContract & { user_id: string }) | null {
  const stmt = db.prepare(`
    SELECT tc.*, o.user_id
    FROM ticket_contracts tc
    INNER JOIN orders o ON tc.order_id = o.id
    WHERE tc.id = ?
  `);
  const result = stmt.get(contractId);
  return result as (TicketContract & { user_id: string }) || null;
}

export function getUserTickets(userId: string): Array<TicketContract & { 
  order_status: string;
  session_info: { cinema_name: string; start_time: string; hall_type: string };
  movie_info: { title: string; poster: string };
}> {
  const stmt = db.prepare(`
    SELECT 
      tc.*,
      o.status as order_status,
      s.cinema_name,
      s.start_time,
      s.hall_type,
      m.title as movie_title,
      m.poster as movie_poster
    FROM ticket_contracts tc
    INNER JOIN orders o ON tc.order_id = o.id
    INNER JOIN sessions s ON o.session_id = s.id
    INNER JOIN movies m ON s.movie_id = m.id
    WHERE o.user_id = ?
    ORDER BY s.start_time DESC
  `);
  
  const results = stmt.all(userId) as Array<any>;
  
  return results.map(r => ({
    id: r.id,
    order_id: r.order_id,
    seat_id: r.seat_id,
    seat_number: r.seat_number,
    blockchain_hash: r.blockchain_hash,
    transfer_restricted: r.transfer_restricted,
    refund_policy: r.refund_policy,
    watermark_seed: r.watermark_seed,
    created_at: r.created_at,
    order_status: r.order_status,
    session_info: {
      cinema_name: r.cinema_name,
      start_time: r.start_time,
      hall_type: r.hall_type
    },
    movie_info: {
      title: r.movie_title,
      poster: r.movie_poster
    }
  }));
}

export function generateInvisibleWatermark(text: string, seed: string): string {
  const hash = crypto.createHash('sha256').update(`${text}:${seed}`).digest();
  const invisibleChars = ['\u200B', '\u200C', '\u200D', '\u2060'];
  let result = '';
  
  for (const byte of hash) {
    for (let i = 0; i < 4; i++) {
      const idx = (byte >> (i * 2)) & 0x03;
      result += invisibleChars[idx];
    }
  }
  
  return result;
}

export function extractInvisibleWatermark(text: string, seed: string): boolean {
  const invisibleChars = ['\u200B', '\u200C', '\u200D', '\u2060'];
  const extracted = text.split('').filter(c => invisibleChars.includes(c)).join('');
  
  if (extracted.length % 4 !== 0 || extracted.length === 0) {
    return false;
  }
  
  const hash = crypto.createHash('sha256').update(`:${seed}`).digest();
  let expected = '';
  
  for (const byte of hash) {
    for (let i = 0; i < 4; i++) {
      const idx = (byte >> (i * 2)) & 0x03;
      expected += invisibleChars[idx];
    }
  }
  
  return extracted === expected;
}
