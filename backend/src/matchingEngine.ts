import { db } from './database';
import { CargoBooking, Voyage, Vessel, MatchResult } from './types';

function parseJSONField<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateCarbonEmission(distanceKm: number, teu: number): number {
  const co2PerTeuKm = 0.0156;
  return distanceKm * teu * co2PerTeuKm;
}

export function findMatchingVoyages(booking: CargoBooking): Promise<MatchResult['voyages']> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT v.*, ves.name as vessel_name, ves.type as vessel_type, ves.teu as vessel_teu,
             ves.dwt as vessel_dwt, ves.status as vessel_status, ves.flag, ves.speed,
             ves.latitude, ves.longitude
      FROM voyages v
      JOIN vessels ves ON v.vessel_id = ves.id
      WHERE v.status IN ('published', 'loading')
        AND v.available_teu >= ?
        AND v.origin_port = ?
        AND v.destination_port = ?
        AND v.etd >= ?
        AND v.eta <= ?
      ORDER BY v.base_rate ASC
    `;

    db.all(query, [
      booking.teu,
      booking.origin_port,
      booking.destination_port,
      booking.earliest_departure || new Date().toISOString(),
      booking.latest_arrival || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    ], (err, rows: any[]) => {
      if (err) return reject(err);

      const results = rows.map(row => {
        const vessel: Vessel = {
          id: row.vessel_id,
          name: row.vessel_name,
          type: row.vessel_type,
          teu: row.vessel_teu,
          dwt: row.vessel_dwt,
          status: row.vessel_status,
          flag: row.flag,
          speed: row.speed,
          latitude: row.latitude,
          longitude: row.longitude
        };

        const voyage: Voyage = {
          id: row.id,
          vessel_id: row.vessel_id,
          voyage_number: row.voyage_number,
          origin_port: row.origin_port,
          destination_port: row.destination_port,
          etd: row.etd,
          eta: row.eta,
          status: row.status,
          available_teu: row.available_teu,
          available_weight: row.available_weight,
          container_types: parseJSONField(row.container_types, []),
          base_rate: row.base_rate,
          carbon_estimate: row.carbon_estimate,
          compliance_certificates: parseJSONField(row.compliance_certificates, [])
        };

        const distance = 12000; 
        const carbon = calculateCarbonEmission(distance, booking.teu);
        
        const baseRate = row.base_rate || 1500;
        const estimatedRate = baseRate * booking.teu * (1 + (Math.random() * 0.2 - 0.1));

        let score = 0;
        const reasons: string[] = [];

        if (row.available_teu && row.available_teu >= booking.teu * 1.5) {
          score += 30;
          reasons.push('舱位充足');
        } else {
          score += 15;
          reasons.push('舱位基本满足');
        }

        const etdDate = new Date(row.etd);
        const earliestDate = new Date(booking.earliest_departure || Date.now());
        const daysDiff = Math.abs((etdDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 3) {
          score += 25;
          reasons.push('出发时间匹配度高');
        } else if (daysDiff <= 7) {
          score += 15;
          reasons.push('出发时间可接受');
        }

        if (baseRate <= (booking.budget_rate || 2000)) {
          score += 20;
          reasons.push('价格在预算内');
        } else if (baseRate <= (booking.budget_rate || 2000) * 1.1) {
          score += 10;
          reasons.push('价格略高于预算');
        }

        if (row.carbon_estimate && row.carbon_estimate < 1.5) {
          score += 15;
          reasons.push('碳排放低');
        }

        const complianceCerts = parseJSONField(row.compliance_certificates, []);
        if (complianceCerts.length >= 3) {
          score += 10;
          reasons.push('合规资质齐全');
        }

        score = Math.min(100, score);

        return {
          voyage,
          vessel,
          score: Math.round(score),
          reasons,
          estimated_rate: Math.round(estimatedRate * 100) / 100,
          carbon_estimate: Math.round(carbon * 100) / 100
        };
      });

      results.sort((a, b) => b.score - a.score);
      resolve(results.slice(0, 10));
    });
  });
}

export function findMatchingCargos(voyage: Voyage): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT cb.*, u.name as owner_name, u.company as owner_company
      FROM cargo_bookings cb
      JOIN users u ON cb.cargo_owner_id = u.id
      WHERE cb.status IN ('inquiry', 'quoted')
        AND cb.origin_port = ?
        AND cb.destination_port = ?
        AND cb.teu <= ?
      ORDER BY cb.created_at DESC
    `;

    db.all(query, [
      voyage.origin_port,
      voyage.destination_port,
      voyage.available_teu || 1000
    ], (err, rows: any[]) => {
      if (err) return reject(err);

      const results = rows.map(row => {
        const booking: CargoBooking = {
          id: row.id,
          cargo_owner_id: row.cargo_owner_id,
          cargo_type: row.cargo_type,
          weight: row.weight,
          teu: row.teu,
          origin_port: row.origin_port,
          destination_port: row.destination_port,
          earliest_departure: row.earliest_departure,
          latest_arrival: row.latest_arrival,
          budget_rate: row.budget_rate,
          status: row.status,
          special_requirements: parseJSONField(row.special_requirements, []),
          compliance_docs: parseJSONField(row.compliance_docs, [])
        };

        let score = 0;
        const reasons: string[] = [];

        if (voyage.available_teu && booking.teu <= voyage.available_teu * 0.8) {
          score += 35;
          reasons.push('货物量适合');
        }

        if (booking.budget_rate && voyage.base_rate) {
          const ratio = voyage.base_rate / booking.budget_rate;
          if (ratio <= 0.9) {
            score += 30;
            reasons.push('价格优势明显');
          } else if (ratio <= 1) {
            score += 20;
            reasons.push('价格匹配');
          }
        }

        const etdDate = new Date(voyage.etd);
        const earliestDate = new Date(booking.earliest_departure || Date.now());
        const latestDate = new Date(booking.latest_arrival || Date.now() + 90 * 86400000);
        
        if (etdDate >= earliestDate) {
          score += 25;
          reasons.push('时间窗口匹配');
        }

        score = Math.min(100, score);

        return {
          booking,
          owner_name: row.owner_name,
          owner_company: row.owner_company,
          score: Math.round(score),
          reasons
        };
      });

      results.sort((a, b) => b.score - a.score);
      resolve(results.slice(0, 10));
    });
  });
}

export function predictEmptyRate(voyageId: string): Promise<{ predictedEmptyRate: number; confidence: number; factors: string[] }> {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM voyages WHERE id = ?';
    db.get(query, [voyageId], (err, row: any) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Voyage not found'));

      const baseEmptyRate = 0.15;
      let predictedRate = baseEmptyRate;
      const factors: string[] = [];

      if (row.available_teu && row.available_teu > 1000) {
        predictedRate += 0.1;
        factors.push('剩余舱位较多');
      }

      const daysToDeparture = (new Date(row.etd).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToDeparture > 30) {
        predictedRate += 0.05;
        factors.push('距开航时间较长');
      } else if (daysToDeparture < 7) {
        predictedRate -= 0.05;
        factors.push('临近开航，订舱率高');
      }

      predictedRate = Math.max(0.05, Math.min(0.4, predictedRate));

      resolve({
        predictedEmptyRate: Math.round(predictedRate * 100) / 100,
        confidence: 0.78,
        factors
      });
    });
  });
}

export function getFreightIndexTrend(route: string): Promise<{ date: string; value: number }[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT date, index_value
      FROM freight_index
      WHERE route = ?
      ORDER BY date ASC
      LIMIT 30
    `;
    db.all(query, [route], (err, rows: any[]) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({ date: r.date, value: r.index_value })));
    });
  });
}
