import { getDb } from '../db/database';
import { User, Vehicle, ChargingSession } from '../types/models';
import { v4 as uuidv4 } from 'uuid';
import { stationService } from './stationService';

export const userService = {
  getUserById(userId: string): User | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  },

  getUserByPhone(phone: string): User | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as User | undefined;
  },

  createUser(phone: string, nickname?: string): User {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, phone, nickname)
      VALUES (?, ?, ?)
    `).run(id, phone, nickname || null);
    return this.getUserById(id)!;
  },

  getVehiclesByUserId(userId: string): Vehicle[] {
    const db = getDb();
    return db.prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId) as Vehicle[];
  },

  getVehicleById(vehicleId: string): Vehicle | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId) as Vehicle | undefined;
  },

  addVehicle(userId: string, vehicleData: Partial<Vehicle>): Vehicle {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO vehicles (id, user_id, plate_number, brand, model, battery_capacity, current_soc, current_mileage, energy_consumption, fault_codes, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      vehicleData.plate_number!,
      vehicleData.brand || null,
      vehicleData.model || null,
      vehicleData.battery_capacity || 60,
      vehicleData.current_soc || 50,
      vehicleData.current_mileage || 10000,
      vehicleData.energy_consumption || 15,
      vehicleData.fault_codes || '[]',
      vehicleData.is_default || 0
    );
    return this.getVehicleById(id)!;
  },

  updateVehicleSoc(vehicleId: string, soc: number, mileage?: number, energyConsumption?: number) {
    const db = getDb();
    db.prepare(`
      UPDATE vehicles
      SET current_soc = ?,
          current_mileage = COALESCE(?, current_mileage),
          energy_consumption = COALESCE(?, energy_consumption)
      WHERE id = ?
    `).run(soc, mileage ?? null, energyConsumption ?? null, vehicleId);
  },

  updateVehicleFaultCodes(vehicleId: string, faultCodes: string) {
    const db = getDb();
    db.prepare('UPDATE vehicles SET fault_codes = ? WHERE id = ?').run(faultCodes, vehicleId);
  },
};

export const chargingService = {
  createSession(userId: string, pileId: string, vehicleId?: string): ChargingSession {
    const db = getDb();
    const pile = stationService.getPileById(pileId);
    if (!pile) throw new Error('充电桩不存在');
    if (pile.status !== 'available') throw new Error('充电桩不可用');

    const id = uuidv4();
    const vehicle = vehicleId ? userService.getVehicleById(vehicleId) : null;

    db.prepare(`
      INSERT INTO charging_sessions (id, user_id, pile_id, station_id, vehicle_id, start_time, start_soc, status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?, 'charging')
    `).run(id, userId, pileId, pile.station_id, vehicleId || null, vehicle?.current_soc || null);

    stationService.updatePileStatus(pileId, 'charging', 0);

    return this.getSessionById(id)!;
  },

  getSessionById(sessionId: string): ChargingSession | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM charging_sessions WHERE id = ?').get(sessionId) as ChargingSession | undefined;
  },

  getUserActiveSessions(userId: string): ChargingSession[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM charging_sessions
      WHERE user_id = ? AND status = 'charging'
      ORDER BY start_time DESC
    `).all(userId) as ChargingSession[];
  },

  getUserSessions(userId: string, limit: number = 20): ChargingSession[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM charging_sessions
      WHERE user_id = ?
      ORDER BY start_time DESC
      LIMIT ?
    `).all(userId, limit) as ChargingSession[];
  },

  updateSessionProgress(sessionId: string, energy: number, power: number) {
    const db = getDb();
    const session = this.getSessionById(sessionId);
    if (!session || session.status !== 'charging') return;

    const amount = energy * 1.5;
    db.prepare(`
      UPDATE charging_sessions
      SET energy_charged = ?, amount = ?, end_soc = ?
      WHERE id = ?
    `).run(energy, amount, session.start_soc ? Math.min(100, session.start_soc + (energy / (session.start_soc > 0 ? 0.6 : 1))) : null, sessionId);

    if (session.vehicle_id) {
      const pile = stationService.getPileById(session.pile_id);
      if (pile) {
        stationService.updatePileStatus(session.pile_id, 'charging', power);
      }
    }
  },

  stopSession(sessionId: string, reason: 'completed' | 'stopped' = 'stopped'): ChargingSession {
    const db = getDb();
    const session = this.getSessionById(sessionId);
    if (!session) throw new Error('充电会话不存在');

    db.prepare(`
      UPDATE charging_sessions
      SET status = ?, end_time = datetime('now')
      WHERE id = ?
    `).run(reason, sessionId);

    stationService.updatePileStatus(session.pile_id, 'available', 0);

    if (session.vehicle_id && session.energy_charged > 0) {
      const vehicle = userService.getVehicleById(session.vehicle_id);
      if (vehicle) {
        const estimatedSoc = Math.min(100, (vehicle.current_soc || 0) + (session.energy_charged / vehicle.battery_capacity) * 100 * 0.9);
        userService.updateVehicleSoc(session.vehicle_id, estimatedSoc);
      }
    }

    return this.getSessionById(sessionId)!;
  },
};
