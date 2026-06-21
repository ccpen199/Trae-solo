import type {
  SettlementBatch,
  SettlementDetail,
  SettlementCycle,
  SettlementStatus,
  FreightOrder,
  PrepayOrder,
  Transaction,
} from '../../shared/types';
import { v4 as uuidv4 } from '../utils/uuid';

export interface SettlementOrderItem {
  order: FreightOrder;
  prepay?: PrepayOrder;
  fuelAmount: number;
  etcAmount: number;
  insuranceAmount: number;
}

export interface SettlementCalculationResult {
  freightAmount: number;
  fuelAmount: number;
  etcAmount: number;
  prepayDeduction: number;
  insuranceAmount: number;
  platformFee: number;
  netAmount: number;
  feeRate: number;
}

export const DEFAULT_PLATFORM_FEE_RATE = 0.02;
export const DEFAULT_FUEL_RATIO_MIN = 0.15;
export const DEFAULT_FUEL_RATIO_MAX = 0.3;
export const DEFAULT_ETC_PER_KM = 0.45;

export function calculateSettlement(
  order: FreightOrder,
  prepay: PrepayOrder | undefined,
  feeRate: number = DEFAULT_PLATFORM_FEE_RATE,
  overrideFuelAmount?: number,
  overrideEtcAmount?: number,
  overrideInsuranceAmount?: number,
): SettlementCalculationResult {
  const freightAmount = order.freightAmount;

  const fuelAmount =
    overrideFuelAmount !== undefined
      ? overrideFuelAmount
      : calculateEstimatedFuelCost(order);

  const etcAmount =
    overrideEtcAmount !== undefined ? overrideEtcAmount : calculateEstimatedEtc(order);

  const prepayDeduction = prepay ? prepay.disbursedAmount : 0;

  const insuranceAmount =
    overrideInsuranceAmount !== undefined
      ? overrideInsuranceAmount
      : order.insuranceAmount || 0;

  const platformFee = Math.round(freightAmount * feeRate * 100) / 100;

  const netAmount =
    Math.round(
      (freightAmount - fuelAmount - etcAmount - prepayDeduction - insuranceAmount - platformFee) *
        100,
    ) / 100;

  return {
    freightAmount,
    fuelAmount,
    etcAmount,
    prepayDeduction,
    insuranceAmount,
    platformFee,
    netAmount,
    feeRate,
  };
}

export function calculateEstimatedFuelCost(order: FreightOrder): number {
  const distance = order.distanceKm;
  const vehicleFuelConsumptionMap: Record<string, number> = {
    truck_4_2: 14,
    truck_6_8: 18,
    truck_9_6: 24,
    truck_13: 32,
    truck_17_5: 38,
  };
  const litersPer100Km = vehicleFuelConsumptionMap[order.vehicleTypeRequired] ?? 25;
  const dieselPricePerLiter = 7.5;
  const totalLiters = (distance / 100) * litersPer100Km;
  return Math.round(totalLiters * dieselPricePerLiter * 100) / 100;
}

export function calculateEstimatedEtc(order: FreightOrder): number {
  const distance = order.distanceKm;
  const etc = distance * DEFAULT_ETC_PER_KM;
  return Math.round(etc * 100) / 100;
}

export function filterOrdersForSettlement(
  orders: FreightOrder[],
  cycle: SettlementCycle,
  cycleStartDate: string,
  cycleEndDate: string,
): FreightOrder[] {
  const start = new Date(cycleStartDate).getTime();
  const end = new Date(cycleEndDate).getTime();

  return orders.filter((order) => {
    if (order.status !== 'completed') {
      return false;
    }
    if (!order.completedAt) {
      return false;
    }
    const completedTime = new Date(order.completedAt).getTime();
    return completedTime >= start && completedTime <= end;
  });
}

export function getCycleDateRange(
  cycle: SettlementCycle,
  referenceDate: Date = new Date(),
): { start: Date; end: Date } {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);

  switch (cycle) {
    case 'daily':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      break;
    default:
      throw new Error(`Unknown settlement cycle: ${cycle}`);
  }

  return { start, end };
}

export interface BatchGenerationOptions {
  feeRate?: number;
  customFuelCosts?: Record<string, number>;
  customEtcCosts?: Record<string, number>;
  customInsurance?: Record<string, number>;
  processedBy?: string;
}

export interface GeneratedSettlement {
  batch: SettlementBatch;
  details: SettlementDetail[];
  summary: {
    totalOrders: number;
    totalDrivers: number;
    totalShippers: number;
    totalFreightAmount: number;
    totalFuelAmount: number;
    totalEtcAmount: number;
    totalPrepayDeduction: number;
    totalInsuranceAmount: number;
    totalPlatformFee: number;
    totalNetAmount: number;
    avgNetPerOrder: number;
  };
}

export function generateSettlementBatch(
  cycle: SettlementCycle,
  completedOrders: FreightOrder[],
  prepayOrders: PrepayOrder[],
  getDriverName: (driverId: string) => string,
  getShipperName: (shipperId: string) => string,
  options: BatchGenerationOptions = {},
): GeneratedSettlement {
  const { feeRate, customFuelCosts, customEtcCosts, customInsurance, processedBy } = {
    feeRate: DEFAULT_PLATFORM_FEE_RATE,
    ...options,
  };

  const { start, end } = getCycleDateRange(cycle);
  const eligibleOrders = filterOrdersForSettlement(
    completedOrders,
    cycle,
    start.toISOString(),
    end.toISOString(),
  );

  const batchId = uuidv4();
  const batchNo = generateBatchNo(cycle);
  const details: SettlementDetail[] = [];

  let totalFreightAmount = 0;
  let totalFuelAmount = 0;
  let totalEtcAmount = 0;
  let totalPrepayDeduction = 0;
  let totalInsuranceAmount = 0;
  let totalPlatformFee = 0;
  let totalNetAmount = 0;

  const uniqueDrivers = new Set<string>();
  const uniqueShippers = new Set<string>();

  for (const order of eligibleOrders) {
    const prepay = prepayOrders.find((p) => p.orderId === order.id);
    const calc = calculateSettlement(
      order,
      prepay,
      feeRate,
      customFuelCosts?.[order.id],
      customEtcCosts?.[order.id],
      customInsurance?.[order.id],
    );

    totalFreightAmount += calc.freightAmount;
    totalFuelAmount += calc.fuelAmount;
    totalEtcAmount += calc.etcAmount;
    totalPrepayDeduction += calc.prepayDeduction;
    totalInsuranceAmount += calc.insuranceAmount;
    totalPlatformFee += calc.platformFee;
    totalNetAmount += calc.netAmount;

    if (order.driverId) uniqueDrivers.add(order.driverId);
    uniqueShippers.add(order.shipperId);

    details.push({
      id: uuidv4(),
      batchId,
      orderId: order.id,
      orderNo: order.orderNo,
      driverId: order.driverId || '',
      driverName: order.driverId ? getDriverName(order.driverId) : '未匹配司机',
      shipperId: order.shipperId,
      shipperName: getShipperName(order.shipperId),
      freightAmount: calc.freightAmount,
      fuelAmount: calc.fuelAmount,
      etcAmount: calc.etcAmount,
      prepayDeduction: calc.prepayDeduction,
      insuranceAmount: calc.insuranceAmount,
      platformFee: calc.platformFee,
      netAmount: calc.netAmount,
      remark: prepay && prepay.disbursedAmount > 0 ? `已扣除预支${prepay.disbursedAmount.toFixed(2)}元` : undefined,
    });
  }

  const round = (n: number): number => Math.round(n * 100) / 100;

  const batch: SettlementBatch = {
    id: batchId,
    batchNo,
    cycle,
    cycleStartDate: start.toISOString(),
    cycleEndDate: end.toISOString(),
    status: 'draft',
    totalOrders: eligibleOrders.length,
    totalFreightAmount: round(totalFreightAmount),
    totalFuelAmount: round(totalFuelAmount),
    totalEtcAmount: round(totalEtcAmount),
    totalPrepayDeduction: round(totalPrepayDeduction),
    totalNetAmount: round(totalNetAmount),
    generatedAt: new Date().toISOString(),
    processedBy,
  };

  return {
    batch,
    details,
    summary: {
      totalOrders: eligibleOrders.length,
      totalDrivers: uniqueDrivers.size,
      totalShippers: uniqueShippers.size,
      totalFreightAmount: round(totalFreightAmount),
      totalFuelAmount: round(totalFuelAmount),
      totalEtcAmount: round(totalEtcAmount),
      totalPrepayDeduction: round(totalPrepayDeduction),
      totalInsuranceAmount: round(totalInsuranceAmount),
      totalPlatformFee: round(totalPlatformFee),
      totalNetAmount: round(totalNetAmount),
      avgNetPerOrder: eligibleOrders.length > 0 ? round(totalNetAmount / eligibleOrders.length) : 0,
    },
  };
}

export function generateBatchNo(cycle: SettlementCycle): string {
  const now = new Date();
  const cyclePrefix = cycle === 'daily' ? 'D' : cycle === 'weekly' ? 'W' : 'M';
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `JS${cyclePrefix}${timestamp}${random}`;
}

export function processBatch(batch: SettlementBatch, processedBy = 'system'): SettlementBatch {
  const now = new Date();
  return {
    ...batch,
    status: 'processing',
    processedAt: now.toISOString(),
    processedBy,
  };
}

export function completeBatch(
  batch: SettlementBatch,
  details: SettlementDetail[],
  wallets: { driverWallets: Array<{ userId: string; walletId: string }>; shipperWallets: Array<{ userId: string; walletId: string }> },
): {
  batch: SettlementBatch;
  transactions: Transaction[];
} {
  const now = new Date().toISOString();
  const transactions: Transaction[] = [];

  for (const detail of details) {
    if (detail.freightAmount > 0) {
      const shipperWallet = wallets.shipperWallets.find((w) => w.userId === detail.shipperId);
      transactions.push({
        id: uuidv4(),
        walletId: shipperWallet?.walletId || uuidv4(),
        userId: detail.shipperId,
        type: 'freight_payment',
        amount: -detail.freightAmount,
        balanceAfter: 0,
        counterpartyId: detail.driverId,
        counterpartyName: detail.driverName,
        relatedOrderId: detail.orderId,
        relatedSettlementId: batch.id,
        remark: `运单${detail.orderNo}运费支出`,
        createdAt: now,
      });
    }

    if (detail.netAmount > 0) {
      const driverWallet = wallets.driverWallets.find((w) => w.userId === detail.driverId);
      transactions.push({
        id: uuidv4(),
        walletId: driverWallet?.walletId || uuidv4(),
        userId: detail.driverId,
        type: 'settlement',
        amount: detail.netAmount,
        balanceAfter: 0,
        counterpartyId: detail.shipperId,
        counterpartyName: detail.shipperName,
        relatedOrderId: detail.orderId,
        relatedSettlementId: batch.id,
        remark: `运单${detail.orderNo}结算收入`,
        createdAt: now,
      });
    }

    if (detail.prepayDeduction > 0) {
      const driverWallet = wallets.driverWallets.find((w) => w.userId === detail.driverId);
      transactions.push({
        id: uuidv4(),
        walletId: driverWallet?.walletId || uuidv4(),
        userId: detail.driverId,
        type: 'prepay_deduction',
        amount: -detail.prepayDeduction,
        balanceAfter: 0,
        relatedOrderId: detail.orderId,
        relatedSettlementId: batch.id,
        remark: `运单${detail.orderNo}预支扣款`,
        createdAt: now,
      });
    }

    if (detail.insuranceAmount > 0) {
      transactions.push({
        id: uuidv4(),
        walletId: uuidv4(),
        userId: detail.shipperId,
        type: 'freight_payment',
        amount: -detail.insuranceAmount,
        balanceAfter: 0,
        relatedOrderId: detail.orderId,
        relatedSettlementId: batch.id,
        remark: `运单${detail.orderNo}保险费`,
        createdAt: now,
      });
    }

    if (detail.platformFee > 0) {
      transactions.push({
        id: uuidv4(),
        walletId: uuidv4(),
        userId: detail.driverId,
        type: 'freight_payment',
        amount: -detail.platformFee,
        balanceAfter: 0,
        relatedOrderId: detail.orderId,
        relatedSettlementId: batch.id,
        remark: `运单${detail.orderNo}平台服务费`,
        createdAt: now,
      });
    }
  }

  return {
    batch: {
      ...batch,
      status: 'completed',
      completedAt: now,
    },
    transactions,
  };
}

export function failBatch(batch: SettlementBatch, reason: string): SettlementBatch {
  return {
    ...batch,
    status: 'failed',
    completedAt: new Date().toISOString(),
  };
}

export interface SettlementDiff {
  orderId: string;
  orderNo: string;
  difference: number;
  description: string;
  detail: SettlementDetail;
}

export function reconcileBatch(
  details: SettlementDetail[],
  externalRecords: Array<{ orderId: string; amount: number }>,
): {
  matched: SettlementDetail[];
  mismatched: SettlementDiff[];
  missing: Array<{ orderId: string; amount: number }>;
  totalMatchedAmount: number;
  totalMismatchAmount: number;
} {
  const externalMap = new Map(externalRecords.map((r) => [r.orderId, r.amount]));
  const matched: SettlementDetail[] = [];
  const mismatched: SettlementDiff[] = [];
  const foundExternalIds = new Set<string>();
  let totalMatchedAmount = 0;
  let totalMismatchAmount = 0;

  for (const detail of details) {
    const external = externalMap.get(detail.orderId);
    if (external !== undefined) {
      foundExternalIds.add(detail.orderId);
      const diff = Math.abs(external - detail.netAmount);
      if (diff < 0.01) {
        matched.push(detail);
        totalMatchedAmount += detail.netAmount;
      } else {
        mismatched.push({
          orderId: detail.orderId,
          orderNo: detail.orderNo,
          difference: external - detail.netAmount,
          description: `系统计算${detail.netAmount.toFixed(2)}元，外部记录${external.toFixed(2)}元，差额${(external - detail.netAmount).toFixed(2)}元`,
          detail,
        });
        totalMismatchAmount += diff;
      }
    } else {
      mismatched.push({
        orderId: detail.orderId,
        orderNo: detail.orderNo,
        difference: -detail.netAmount,
        description: `外部对账系统缺少该运单记录`,
        detail,
      });
      totalMismatchAmount += detail.netAmount;
    }
  }

  const missing = externalRecords
    .filter((r) => !foundExternalIds.has(r.orderId))
    .map((r) => ({
      orderId: r.orderId,
      amount: r.amount,
    }));

  for (const m of missing) {
    totalMismatchAmount += m.amount;
  }

  return {
    matched,
    mismatched,
    missing,
    totalMatchedAmount: Math.round(totalMatchedAmount * 100) / 100,
    totalMismatchAmount: Math.round(totalMismatchAmount * 100) / 100,
  };
}

export interface GroupedByDriver {
  driverId: string;
  driverName: string;
  orderCount: number;
  totalFreight: number;
  totalDeductions: number;
  totalNet: number;
  details: SettlementDetail[];
}

export function groupDetailsByDriver(details: SettlementDetail[]): GroupedByDriver[] {
  const grouped = new Map<string, GroupedByDriver>();

  for (const detail of details) {
    let group = grouped.get(detail.driverId);
    if (!group) {
      group = {
        driverId: detail.driverId,
        driverName: detail.driverName,
        orderCount: 0,
        totalFreight: 0,
        totalDeductions: 0,
        totalNet: 0,
        details: [],
      };
      grouped.set(detail.driverId, group);
    }
    group.orderCount++;
    group.totalFreight += detail.freightAmount;
    group.totalDeductions += detail.fuelAmount + detail.etcAmount + detail.prepayDeduction + detail.insuranceAmount + detail.platformFee;
    group.totalNet += detail.netAmount;
    group.details.push(detail);
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalNet - a.totalNet);
}
