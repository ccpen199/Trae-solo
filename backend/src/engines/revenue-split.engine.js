const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { SettlementStatus } = require('../config/enums');
const NotificationService = require('../services/notification.service');

const ELECTRICITY_PRICES = {
  default: 0.45,
  peak: 0.85,
  off_peak: 0.30,
  subsidy: 0.05
};

class RevenueSplitEngine {
  static calculateDailyGeneration(stationId, settlementDate) {
    const dateStr = moment(settlementDate).format('YYYY-MM-DD');
    
    const generation = db.prepare(`
      SELECT 
        SUM(id.daily_generation_kwh) as total_generation,
        AVG(id.efficiency) as avg_efficiency
      FROM inverter_data id
      WHERE id.station_id = ?
        AND date(id.collect_time) = ?
      GROUP BY id.station_id
    `).get(stationId, dateStr);

    const generationRecord = db.prepare(`
      SELECT actual_generation_kwh, expected_generation_kwh, pr_value
      FROM generation_records
      WHERE station_id = ? AND record_date = ?
    `).get(stationId, dateStr);

    return {
      date: dateStr,
      station_id: stationId,
      total_generation_kwh: generation?.total_generation || generationRecord?.actual_generation_kwh || 0,
      expected_generation_kwh: generationRecord?.expected_generation_kwh || 0,
      pr_value: generationRecord?.pr_value || 0,
      avg_efficiency: generation?.avg_efficiency || 0.95
    };
  }

  static calculateRevenue(generationKwh, stationId, settlementDate) {
    const hour = moment(settlementDate).hour();
    let gridPrice;
    
    if (hour >= 8 && hour < 12) {
      gridPrice = ELECTRICITY_PRICES.peak;
    } else if (hour >= 18 && hour < 22) {
      gridPrice = ELECTRICITY_PRICES.peak;
    } else if (hour >= 0 && hour < 6) {
      gridPrice = ELECTRICITY_PRICES.off_peak;
    } else {
      gridPrice = ELECTRICITY_PRICES.default;
    }

    const subsidyPrice = ELECTRICITY_PRICES.subsidy;

    const station = db.prepare(`
      SELECT investor_share_percent, owner_share_percent
      FROM stations
      WHERE id = ?
    `).get(stationId);

    const investorShare = station?.investor_share_percent || 0.7;
    const ownerShare = station?.owner_share_percent || 0.3;

    const gridRevenue = generationKwh * gridPrice;
    const subsidyRevenue = generationKwh * subsidyPrice;
    const totalRevenue = gridRevenue + subsidyRevenue;

    const investorRevenue = totalRevenue * investorShare;
    const ownerRevenue = totalRevenue * ownerShare;

    return {
      grid_price_per_kwh: gridPrice,
      subsidy_price_per_kwh: subsidyPrice,
      grid_revenue: gridRevenue,
      subsidy_revenue: subsidyRevenue,
      total_revenue: totalRevenue,
      investor_share_percent: investorShare,
      owner_share_percent: ownerShare,
      investor_revenue: investorRevenue,
      owner_revenue: ownerRevenue
    };
  }

  static createDailySettlement(stationId, settlementDate) {
    const dateStr = moment(settlementDate).format('YYYY-MM-DD');
    
    const existing = db.prepare(`
      SELECT id FROM daily_settlements 
      WHERE station_id = ? AND settlement_date = ?
    `).get(stationId, dateStr);

    if (existing) {
      return this.recalculateSettlement(existing.id);
    }

    const generation = this.calculateDailyGeneration(stationId, settlementDate);
    const revenue = this.calculateRevenue(generation.total_generation_kwh, stationId, settlementDate);

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO daily_settlements (
        id, station_id, settlement_date,
        grid_generation_kwh, self_consumption_kwh, feed_in_kwh,
        grid_price_per_kwh, subsidy_price_per_kwh,
        grid_revenue, subsidy_revenue, total_revenue,
        investor_share_percent, owner_share_percent,
        investor_revenue, owner_revenue,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, stationId, dateStr,
      generation.total_generation_kwh, generation.total_generation_kwh * 0.1, generation.total_generation_kwh * 0.9,
      revenue.grid_price_per_kwh, revenue.subsidy_price_per_kwh,
      revenue.grid_revenue, revenue.subsidy_revenue, revenue.total_revenue,
      revenue.investor_share_percent, revenue.owner_share_percent,
      revenue.investor_revenue, revenue.owner_revenue,
      SettlementStatus.PENDING, now
    );

    return db.prepare('SELECT * FROM daily_settlements WHERE id = ?').get(id);
  }

  static recalculateSettlement(settlementId) {
    const settlement = db.prepare(`
      SELECT * FROM daily_settlements WHERE id = ?
    `).get(settlementId);

    if (!settlement) throw new Error('结算记录不存在');
    if (settlement.status === SettlementStatus.CONFIRMED || 
        settlement.status === SettlementStatus.PAID) {
      throw new Error('已确认或已支付的结算不可重新计算');
    }

    const generation = this.calculateDailyGeneration(settlement.station_id, settlement.settlement_date);
    const revenue = this.calculateRevenue(
      generation.total_generation_kwh || settlement.grid_generation_kwh,
      settlement.station_id, settlement.settlement_date
    );

    db.prepare(`
      UPDATE daily_settlements SET
        grid_generation_kwh = ?,
        grid_price_per_kwh = ?,
        subsidy_price_per_kwh = ?,
        grid_revenue = ?,
        subsidy_revenue = ?,
        total_revenue = ?,
        investor_revenue = ?,
        owner_revenue = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      generation.total_generation_kwh,
      revenue.grid_price_per_kwh,
      revenue.subsidy_price_per_kwh,
      revenue.grid_revenue,
      revenue.subsidy_revenue,
      revenue.total_revenue,
      revenue.investor_revenue,
      revenue.owner_revenue,
      settlementId
    );

    return db.prepare('SELECT * FROM daily_settlements WHERE id = ?').get(settlementId);
  }

  static confirmSettlement(settlementId) {
    const settlement = db.prepare(`
      SELECT * FROM daily_settlements WHERE id = ?
    `).get(settlementId);

    if (!settlement) throw new Error('结算记录不存在');
    if (settlement.status !== SettlementStatus.PENDING) {
      throw new Error('只能确认待处理的结算');
    }

    db.prepare(`
      UPDATE daily_settlements SET
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(SettlementStatus.CONFIRMED, settlementId);

    const updated = db.prepare('SELECT * FROM daily_settlements WHERE id = ?').get(settlementId);
    NotificationService.sendSettlementCompleted(settlement.station_id, updated);

    return updated;
  }

  static getInvestorRevenueSummary(investorId, startDate, endDate, periodType = 'monthly') {
    const settlements = db.prepare(`
      SELECT 
        ds.settlement_date,
        ds.grid_generation_kwh,
        ds.total_revenue,
        ds.investor_revenue,
        s.name as station_name,
        s.id as station_id
      FROM daily_settlements ds
      JOIN stations s ON ds.station_id = s.id
      WHERE s.investor_id = ?
        AND ds.settlement_date >= ?
        AND ds.settlement_date <= ?
        AND ds.status IN ('confirmed', 'paid')
      ORDER BY ds.settlement_date
    `).all(investorId, startDate, endDate);

    const totalGeneration = settlements.reduce((sum, s) => sum + s.grid_generation_kwh, 0);
    const totalRevenue = settlements.reduce((sum, s) => sum + s.total_revenue, 0);
    const totalInvestorShare = settlements.reduce((sum, s) => sum + s.investor_revenue, 0);

    return {
      investor_id: investorId,
      period_start: startDate,
      period_end: endDate,
      period_type: periodType,
      summary: {
        total_generation_kwh: totalGeneration,
        total_revenue: totalRevenue,
        investor_share: totalInvestorShare
      },
      details: settlements
    };
  }

  static calculateIRR(stationId) {
    const station = db.prepare(`
      SELECT s.*,
             (SELECT SUM(total_revenue) FROM daily_settlements WHERE station_id = s.id) as total_earned_revenue
      FROM stations s WHERE s.id = ?
    `).get(stationId);

    if (!station) throw new Error('电站不存在');

    const investmentCost = station.capacity_kw * 4500;
    const earnedRevenue = station.total_earned_revenue || 0;

    const dailyRecords = db.prepare(`
      SELECT AVG(total_revenue) as avg_daily_revenue
      FROM daily_settlements
      WHERE station_id = ? AND status IN ('confirmed', 'paid')
    `).get(stationId);

    const avgDailyRevenue = dailyRecords?.avg_daily_revenue || (station.capacity_kw * 4 * 0.75 * 0.5);
    const estimatedAnnualRevenue = avgDailyRevenue * 365;
    const remainingYears = 25;
    const estimatedFutureRevenue = estimatedAnnualRevenue * remainingYears;

    const totalExpectedRevenue = earnedRevenue + estimatedFutureRevenue;
    const estimatedReturn = totalExpectedRevenue - investmentCost;
    const irr = investmentCost > 0 ? (estimatedReturn / investmentCost / remainingYears) * 100 : 0;
    
    const paybackPeriod = estimatedAnnualRevenue > 0 ? investmentCost / estimatedAnnualRevenue / 12 : 999;

    return {
      station_id: stationId,
      investment_cost: investmentCost,
      earned_revenue: earnedRevenue,
      estimated_annual_revenue: estimatedAnnualRevenue,
      estimated_future_revenue: estimatedFutureRevenue,
      total_expected_revenue: totalExpectedRevenue,
      estimated_return: estimatedReturn,
      irr_percent: Math.min(50, irr),
      payback_period_months: paybackPeriod
    };
  }

  static getIRRTrend(stationId, months = 12) {
    const trend = [];
    const today = moment();

    for (let i = 0; i < months; i++) {
      const monthDate = moment(today).subtract(i, 'months');
      const startDate = monthDate.startOf('month').format('YYYY-MM-DD');
      const endDate = monthDate.endOf('month').format('YYYY-MM-DD');

      const monthData = db.prepare(`
        SELECT 
          SUM(ds.grid_generation_kwh) as generation,
          SUM(ds.total_revenue) as revenue
        FROM daily_settlements ds
        WHERE ds.station_id = ?
          AND ds.settlement_date >= ?
          AND ds.settlement_date <= ?
      `).get(stationId, startDate, endDate);

      const station = db.prepare('SELECT capacity_kw FROM stations WHERE id = ?').get(stationId);
      const investmentCost = station?.capacity_kw * 4500 || 1;
      const estimatedAnnual = (monthData?.revenue || 0) * 12;
      const irr = investmentCost > 0 ? (estimatedAnnual / investmentCost) * 100 : 0;

      trend.push({
        month: startDate.substring(0, 7),
        generation_kwh: monthData?.generation || 0,
        revenue: monthData?.revenue || 0,
        estimated_irr_percent: Math.min(50, irr)
      });
    }

    return trend.reverse();
  }

  static runDailySettlementBatch() {
    const stations = db.prepare('SELECT id FROM stations WHERE status = ?').all('operating');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const results = [];

    for (const station of stations) {
      try {
        const settlement = this.createDailySettlement(station.id, yesterday);
        const confirmed = this.confirmSettlement(settlement.id);
        results.push(confirmed);
      } catch (err) {
        console.error(`结算失败 - 电站 ${station.id}:`, err.message);
      }
    }

    return results;
  }
}

module.exports = RevenueSplitEngine;
