import { query, get } from '../config/database.js';
import type { StatisticsSummary, ConversionFunnelItem } from '../types/index.js';

export async function getSummary(): Promise<StatisticsSummary> {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM cars) as totalCars,
      (SELECT COUNT(*) FROM cars WHERE status = 'on_sale') as carsOnSale,
      (SELECT COUNT(*) FROM cars WHERE status = 'sold') as carsSold,
      (SELECT COUNT(*) FROM appointments) as totalAppointments,
      (SELECT COUNT(*) FROM deposits WHERE status IN ('paid', 'locked', 'released_to_seller', 'deducted')) as totalDeposits,
      (SELECT COUNT(*) FROM settlements) as totalSettlements,
      (SELECT COALESCE(SUM(platform_fee), 0) FROM settlements) as totalPlatformFee
  `;

  const result = get<Record<string, number>>(sql, []) || {};

  const totalCars = result.totalCars || 0;
  const carsSold = result.carsSold || 0;
  const conversionRate = totalCars > 0 ? Number(((carsSold / totalCars) * 100).toFixed(2)) : 0;

  return {
    totalCars: result.totalCars || 0,
    carsOnSale: result.carsOnSale || 0,
    carsSold: result.carsSold || 0,
    totalAppointments: result.totalAppointments || 0,
    totalDeposits: result.totalDeposits || 0,
    totalSettlements: result.totalSettlements || 0,
    totalPlatformFee: Number(result.totalPlatformFee?.toFixed(2) || 0),
    conversionRate
  };
}

export async function getConversionFunnel(): Promise<ConversionFunnelItem[]> {
  const stages = [
    { name: '车源发布', sql: "SELECT COUNT(*) as count FROM cars" },
    { name: '待检测', sql: "SELECT COUNT(*) as count FROM cars WHERE status IN ('pending_inspection', 'inspecting')" },
    { name: '检测通过', sql: "SELECT COUNT(*) as count FROM cars WHERE status IN ('pending_audit', 'on_sale', 'locked', 'sold')" },
    { name: '上架', sql: "SELECT COUNT(*) as count FROM cars WHERE status IN ('on_sale', 'locked', 'sold')" },
    { name: '预约', sql: "SELECT COUNT(DISTINCT car_id) as count FROM appointments" },
    { name: '订金', sql: "SELECT COUNT(DISTINCT car_id) as count FROM deposits WHERE status IN ('paid', 'locked', 'released_to_seller', 'deducted')" },
    { name: '签约', sql: "SELECT COUNT(DISTINCT car_id) as count FROM contracts WHERE status IN ('signed', 'pending_payment', 'paid', 'completed')" },
    { name: '过户', sql: "SELECT COUNT(DISTINCT car_id) as count FROM transfers WHERE status IN ('approved', 'completed')" },
    { name: '完成', sql: "SELECT COUNT(*) as count FROM cars WHERE status = 'sold'" }
  ];

  const funnel: ConversionFunnelItem[] = [];
  let previousCount = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const result = get<{ count: number }>(stage.sql, []) || { count: 0 };
    const count = result.count || 0;
    const rate = i === 0 ? 100 : previousCount > 0 ? Number(((count / previousCount) * 100).toFixed(2)) : 0;

    funnel.push({
      stage: stage.name,
      count,
      rate
    });

    previousCount = count;
  }

  return funnel;
}

export async function getPriceAdjustmentStats(): Promise<Record<string, unknown>[]> {
  const sql = `
    SELECT
      c.id as carId,
      c.vin,
      c.brand,
      c.model,
      c.original_price as originalPrice,
      c.price as currentPrice,
      (c.original_price - c.price) as adjustmentAmount,
      ROUND(((c.original_price - c.price) / c.original_price) * 100, 2) as adjustmentRate,
      c.created_at as createdAt
    FROM cars c
    WHERE c.original_price IS NOT NULL 
      AND c.price IS NOT NULL 
      AND c.original_price != c.price
    ORDER BY adjustmentAmount DESC
    LIMIT 50
  `;

  return query<Record<string, unknown>>(sql, []);
}

export async function getInspectionExceptionStats(): Promise<Record<string, unknown>[]> {
  const sql = `
    SELECT
      '事故车' as category,
      COUNT(*) as count
    FROM inspections i
    WHERE i.accident_json LIKE '%"result":"abnormal"%'
       OR i.accident_json LIKE '%"result": "abnormal"%'
    UNION ALL
    SELECT
      '水泡车' as category,
      COUNT(*) as count
    FROM inspections i
    WHERE i.water_damage_json LIKE '%"result":"abnormal"%'
       OR i.water_damage_json LIKE '%"result": "abnormal"%'
    UNION ALL
    SELECT
      '火烧车' as category,
      COUNT(*) as count
    FROM inspections i
    WHERE i.fire_damage_json LIKE '%"result":"abnormal"%'
       OR i.fire_damage_json LIKE '%"result": "abnormal"%'
    UNION ALL
    SELECT
      '可疑项' as category,
      COUNT(*) as count
    FROM inspections i
    WHERE i.accident_json LIKE '%"result":"suspicious"%'
       OR i.accident_json LIKE '%"result": "suspicious"%'
       OR i.water_damage_json LIKE '%"result":"suspicious"%'
       OR i.water_damage_json LIKE '%"result": "suspicious"%'
       OR i.fire_damage_json LIKE '%"result":"suspicious"%'
       OR i.fire_damage_json LIKE '%"result": "suspicious"%'
    UNION ALL
    SELECT
      '检测未通过' as category,
      COUNT(*) as count
    FROM inspections i
    WHERE i.status = 'rejected'
    UNION ALL
    SELECT
      '异常车源' as category,
      COUNT(*) as count
    FROM cars c
    WHERE c.status = 'exception'
  `;

  return query<Record<string, unknown>>(sql, []);
}

export async function getCancellationReasons(): Promise<Record<string, unknown>[]> {
  const sql = `
    SELECT
      d.refund_reason as reason,
      COUNT(*) as count
    FROM deposits d
    WHERE d.status IN ('refunded', 'refund_pending')
      AND d.refund_reason IS NOT NULL
      AND d.refund_reason != ''
    GROUP BY d.refund_reason
    ORDER BY count DESC
    LIMIT 20
  `;

  return query<Record<string, unknown>>(sql, []);
}

export async function getSalesEfficiency(): Promise<Record<string, unknown>[]> {
  const sql = `
    SELECT
      u.id as salesId,
      u.name as salesName,
      COUNT(DISTINCT a.id) as appointmentCount,
      COUNT(DISTINCT d.id) as depositCount,
      COUNT(DISTINCT c.id) as contractCount,
      ROUND(
        CASE WHEN COUNT(DISTINCT a.id) > 0 
          THEN (COUNT(DISTINCT d.id) * 100.0) / COUNT(DISTINCT a.id) 
          ELSE 0 
        END, 2
      ) as appointmentToDepositRate,
      ROUND(
        CASE WHEN COUNT(DISTINCT d.id) > 0 
          THEN (COUNT(DISTINCT c.id) * 100.0) / COUNT(DISTINCT d.id) 
          ELSE 0 
        END, 2
      ) as depositToContractRate
    FROM users u
    LEFT JOIN appointments a ON u.id = a.sales_id
    LEFT JOIN deposits d ON a.buyer_id = d.buyer_id
    LEFT JOIN contracts c ON d.buyer_id = c.buyer_id
    WHERE u.role = 'sales'
    GROUP BY u.id, u.name
    ORDER BY contractCount DESC, appointmentCount DESC
  `;

  return query<Record<string, unknown>>(sql, []);
}
