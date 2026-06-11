import type { User, Waybill, RiskAlert } from "../../../shared/types";

export function evaluateShipperCredit(shipper: User): {
  score: number;
  factors: Array<{ name: string; weight: number; value: number }>;
} {
  const factors = [
    { name: "历史交易次数", weight: 0.3, value: Math.min(100, 80) },
    { name: "按时付款率", weight: 0.3, value: 92 },
    { name: "纠纷率", weight: 0.2, value: 95 },
    { name: "企业认证等级", weight: 0.2, value: 85 },
  ];

  const score = Math.round(
    factors.reduce((acc, f) => acc + f.value * f.weight, 0)
  );

  return { score, factors };
}

export function detectTrackAnomaly(waybill: Waybill): {
  hasAnomaly: boolean;
  details?: {
    deviationDistance?: number;
    stopDuration?: number;
    speedAnomaly?: boolean;
  };
} {
  if (waybill.trackingPoints.length < 2) {
    return { hasAnomaly: false };
  }

  const hasDeviation = Math.random() > 0.85;
  if (hasDeviation) {
    return {
      hasAnomaly: true,
      details: {
        deviationDistance: Math.round(Math.random() * 5 + 1),
      },
    };
  }

  return { hasAnomaly: false };
}

export function generateBlockchainHash(waybillId: string): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function getRiskOverview(alerts: RiskAlert[]): {
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  unreadCount: number;
  trend: number[];
} {
  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const highCount = alerts.filter((a) => a.level === "high").length;
  const mediumCount = alerts.filter((a) => a.level === "medium").length;
  const lowCount = alerts.filter((a) => a.level === "low").length;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const trend: number[] = [];
  for (let i = 0; i < 7; i++) {
    trend.push(Math.floor(Math.random() * 15 + 5));
  }

  return {
    totalAlerts: alerts.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    unreadCount,
    trend,
  };
}
