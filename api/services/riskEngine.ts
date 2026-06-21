import type {
  User,
  DriverProfile,
  ShipperProfile,
  FreightOrder,
  PrepayOrder,
  RiskConfig,
  PrepayStatus,
} from '../../shared/types';
import { v4 as uuidv4 } from '../utils/uuid';

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  driverCreditWeight: 0.4,
  completionRateWeight: 0.3,
  orderRiskWeight: 0.2,
  shipperCreditWeight: 0.1,
  lowRiskThreshold: 85,
  mediumRiskThreshold: 70,
  highRiskThreshold: 55,
  prepayMaxRatio: 0.4,
};

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface RiskEvaluationResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'reject';
  factors: RiskFactor[];
  riskReasons: string[];
  suggestions: string[];
  approvedRatio: number;
  maxApprovedAmount: number;
  decision: 'auto_approve' | 'manual_review' | 'reject';
}

export function evaluateDriverCredit(
  driver: User,
  profile: DriverProfile,
  weight: number,
): RiskFactor {
  const creditScore = driver.creditScore;
  let score: number;
  let details: string;
  let impact: RiskFactor['impact'];

  if (creditScore >= 800) {
    score = 100;
    details = `信用分${creditScore}，优秀级别，历史履约记录极佳`;
    impact = 'positive';
  } else if (creditScore >= 750) {
    score = 90;
    details = `信用分${creditScore}，良好级别，履约记录稳定`;
    impact = 'positive';
  } else if (creditScore >= 700) {
    score = 75;
    details = `信用分${creditScore}，中等偏上，偶有小瑕疵`;
    impact = 'positive';
  } else if (creditScore >= 650) {
    score = 55;
    details = `信用分${creditScore}，一般水平，需关注履约情况`;
    impact = 'neutral';
  } else if (creditScore >= 600) {
    score = 35;
    details = `信用分${creditScore}，偏低，存在一定风险`;
    impact = 'negative';
  } else {
    score = 10;
    details = `信用分${creditScore}，过低，风险较高`;
    impact = 'negative';
  }

  if (profile.drivingYears >= 10) {
    score = Math.min(100, score + 5);
    details += `，${profile.drivingYears}年驾龄经验丰富`;
  } else if (profile.drivingYears >= 5) {
    details += `，${profile.drivingYears}年驾龄`;
  }

  if (profile.totalOrders >= 300) {
    score = Math.min(100, score + 3);
    details += `，累计完成${profile.totalOrders}单经验丰富`;
  }

  return {
    name: '司机信用评分',
    score,
    weight,
    details,
    impact,
  };
}

export function evaluateCompletionRate(
  profile: DriverProfile,
  weight: number,
): RiskFactor {
  const totalOrders = profile.totalOrders;
  const completedOrders = profile.completedOrders;
  const completionRate = totalOrders > 0 ? completedOrders / totalOrders : 0;
  const cancelRate = totalOrders > 0 ? (totalOrders - completedOrders) / totalOrders : 0;

  let score: number;
  let details: string;
  let impact: RiskFactor['impact'];

  if (completionRate >= 0.98 && totalOrders >= 50) {
    score = 100;
    details = `完成率${(completionRate * 100).toFixed(1)}%，累计${totalOrders}单，历史履约极佳`;
    impact = 'positive';
  } else if (completionRate >= 0.95 && totalOrders >= 30) {
    score = 90;
    details = `完成率${(completionRate * 100).toFixed(1)}%，累计${totalOrders}单，履约良好`;
    impact = 'positive';
  } else if (completionRate >= 0.92) {
    score = 78;
    details = `完成率${(completionRate * 100).toFixed(1)}%，履约稳定`;
    impact = 'positive';
  } else if (completionRate >= 0.88) {
    score = 60;
    details = `完成率${(completionRate * 100).toFixed(1)}%，基本合格`;
    impact = 'neutral';
  } else if (completionRate >= 0.8) {
    score = 40;
    details = `完成率${(completionRate * 100).toFixed(1)}%，偏低，存在取消风险`;
    impact = 'negative';
  } else {
    score = 15;
    details = `完成率${(completionRate * 100).toFixed(1)}%，过低，高风险`;
    impact = 'negative';
  }

  if (cancelRate > 0.1) {
    score = Math.max(0, score - 10);
    details += `，取消率${(cancelRate * 100).toFixed(1)}%偏高`;
  }

  if (profile.rating >= 4.8) {
    score = Math.min(100, score + 3);
    details += `，评分${profile.rating}分优秀`;
  }

  return {
    name: '历史完成率',
    score,
    weight,
    details,
    impact,
  };
}

export function evaluateOrderRisk(
  order: FreightOrder,
  weight: number,
): RiskFactor {
  const distance = order.distanceKm;
  const duration = order.estimatedDurationHours;
  const amount = order.freightAmount;
  const prepayRatio = order.prepayRatio;

  let baseScore = 80;
  let details: string[] = [];
  let hasNegative = false;
  let hasPositive = false;

  if (distance < 300) {
    baseScore += 10;
    details.push(`短途运输${distance}km，风险较低`);
    hasPositive = true;
  } else if (distance < 800) {
    details.push(`中距离运输${distance}km`);
  } else if (distance < 1500) {
    baseScore -= 8;
    details.push(`长途运输${distance}km，风险中等`);
    hasNegative = true;
  } else {
    baseScore -= 15;
    details.push(`超长途运输${distance}km，风险较高`);
    hasNegative = true;
  }

  if (duration < 8) {
    baseScore += 5;
    details.push(`预计时长${duration}h，短途可控`);
    hasPositive = true;
  } else if (duration > 24) {
    baseScore -= 8;
    details.push(`预计时长${duration}h，跨天运输需关注`);
    hasNegative = true;
  }

  if (amount < 5000) {
    details.push(`运费${amount.toFixed(2)}元，金额较低`);
  } else if (amount < 20000) {
    baseScore -= 3;
    details.push(`运费${amount.toFixed(2)}元，中等金额`);
  } else {
    baseScore -= 10;
    details.push(`运费${amount.toFixed(2)}元，大额需谨慎`);
    hasNegative = true;
  }

  if (prepayRatio <= 0.2) {
    baseScore += 8;
    details.push(`预支比例${(prepayRatio * 100).toFixed(0)}%，比例合理`);
    hasPositive = true;
  } else if (prepayRatio <= 0.3) {
    details.push(`预支比例${(prepayRatio * 100).toFixed(0)}%`);
  } else {
    baseScore -= 12;
    details.push(`预支比例${(prepayRatio * 100).toFixed(0)}%，偏高`);
    hasNegative = true;
  }

  if (order.insuranceRequired) {
    baseScore += 5;
    details.push('已投保货运险');
    hasPositive = true;
  } else {
    baseScore -= 5;
    details.push('未投保货运险');
    hasNegative = true;
  }

  const riskyCargos = ['化工原料', '医药冷链', '易燃易爆', '危险品'];
  if (riskyCargos.some((c) => order.cargoType.includes(c))) {
    baseScore -= 15;
    details.push(`货物类型${order.cargoType}需特殊资质`);
    hasNegative = true;
  }

  const score = Math.max(0, Math.min(100, baseScore));
  const impact: RiskFactor['impact'] = hasNegative
    ? 'negative'
    : hasPositive
      ? 'positive'
      : 'neutral';

  return {
    name: '运单风险评估',
    score,
    weight,
    details: details.join('；'),
    impact,
  };
}

export function evaluateShipperCredit(
  shipper: User,
  shipperProfile: ShipperProfile,
  weight: number,
): RiskFactor {
  const creditScore = shipper.creditScore;
  let score: number;
  let details: string;
  let impact: RiskFactor['impact'];

  if (creditScore >= 850) {
    score = 100;
    details = `货主信用分${creditScore}，AAA级优质客户`;
    impact = 'positive';
  } else if (creditScore >= 800) {
    score = 92;
    details = `货主信用分${creditScore}，AA级优质客户`;
    impact = 'positive';
  } else if (creditScore >= 750) {
    score = 80;
    details = `货主信用分${creditScore}，A级良好客户`;
    impact = 'positive';
  } else if (creditScore >= 700) {
    score = 65;
    details = `货主信用分${creditScore}，BBB级普通客户`;
    impact = 'neutral';
  } else if (creditScore >= 650) {
    score = 45;
    details = `货主信用分${creditScore}，BB级需关注`;
    impact = 'neutral';
  } else {
    score = 25;
    details = `货主信用分${creditScore}，偏低有风险`;
    impact = 'negative';
  }

  if (shipperProfile.totalOrders >= 500) {
    score = Math.min(100, score + 5);
    details += `，累计${shipperProfile.totalOrders}单，合作稳定`;
  }

  const contractStart = new Date(shipperProfile.contractStartDate);
  const contractEnd = new Date(shipperProfile.contractEndDate);
  const now = new Date();
  if (now >= contractStart && now <= contractEnd) {
    score = Math.min(100, score + 3);
    details += '，合同期内合作有保障';
  }

  if (shipperProfile.rating >= 4.7) {
    score = Math.min(100, score + 2);
    details += `，货主评分${shipperProfile.rating}分`;
  }

  return {
    name: '货主信用评分',
    score,
    weight,
    details,
    impact,
  };
}

export function evaluatePrepayRisk(
  order: FreightOrder,
  driver: User,
  driverProfile: DriverProfile,
  shipper: User,
  shipperProfile: ShipperProfile,
  config: Partial<RiskConfig> = {},
): RiskEvaluationResult {
  const fullConfig: RiskConfig = { ...DEFAULT_RISK_CONFIG, ...config };

  const driverFactor = evaluateDriverCredit(driver, driverProfile, fullConfig.driverCreditWeight);
  const completionFactor = evaluateCompletionRate(driverProfile, fullConfig.completionRateWeight);
  const orderFactor = evaluateOrderRisk(order, fullConfig.orderRiskWeight);
  const shipperFactor = evaluateShipperCredit(shipper, shipperProfile, fullConfig.shipperCreditWeight);

  const factors = [driverFactor, completionFactor, orderFactor, shipperFactor];

  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const normalizedScore = Math.round((weightedScore / totalWeight) * 100) / 100;
  const finalScore = Math.min(100, Math.max(0, Math.round(normalizedScore)));

  let riskLevel: RiskEvaluationResult['riskLevel'];
  let decision: RiskEvaluationResult['decision'];
  let approvedRatio: number;

  if (finalScore >= fullConfig.lowRiskThreshold) {
    riskLevel = 'low';
    decision = 'auto_approve';
    approvedRatio = Math.min(1.0, finalScore / 100);
  } else if (finalScore >= fullConfig.mediumRiskThreshold) {
    riskLevel = 'medium';
    decision = 'auto_approve';
    approvedRatio = Math.min(fullConfig.prepayMaxRatio, (finalScore / 100) * 0.9);
  } else if (finalScore >= fullConfig.highRiskThreshold) {
    riskLevel = 'high';
    decision = 'manual_review';
    approvedRatio = Math.min(fullConfig.prepayMaxRatio * 0.7, (finalScore / 100) * 0.7);
  } else {
    riskLevel = 'reject';
    decision = 'reject';
    approvedRatio = 0;
  }

  const maxApprovedAmount = Math.min(
    order.prepayMaxAmount,
    Math.round(order.freightAmount * approvedRatio * 100) / 100,
  );

  const riskReasons: string[] = [];
  const suggestions: string[] = [];

  for (const f of factors) {
    if (f.impact === 'negative') {
      riskReasons.push(f.details);
    }
  }

  if (riskLevel === 'low') {
    riskReasons.push('综合风险低，自动审批通过');
    suggestions.push('建议全额放款');
  } else if (riskLevel === 'medium') {
    riskReasons.push('综合风险中等，自动审批');
    suggestions.push('适当降低放款比例，持续监控履约进度');
  } else if (riskLevel === 'high') {
    riskReasons.push('综合风险较高，建议人工复核');
    suggestions.push('提交风控专员人工审核，核实司机近期记录，必要时要求追加担保');
  } else {
    riskReasons.push('综合评分不足，拒绝预支申请');
    suggestions.push('建议司机提升信用分后再申请，或降低预支比例重新提交');
  }

  return {
    riskScore: finalScore,
    riskLevel,
    factors,
    riskReasons,
    suggestions,
    approvedRatio: Math.round(approvedRatio * 10000) / 10000,
    maxApprovedAmount,
    decision,
  };
}

export function createPrepayOrder(
  order: FreightOrder,
  driverId: string,
  shipperId: string,
  requestedAmount: number,
  evaluation: RiskEvaluationResult,
  statusOverride?: PrepayStatus,
): PrepayOrder {
  const now = new Date().toISOString();
  const status: PrepayStatus =
    statusOverride ??
    (evaluation.decision === 'reject'
      ? 'rejected'
      : evaluation.decision === 'manual_review'
        ? 'pending'
        : 'risk_approved');

  const approved = status === 'rejected' ? 0 : Math.min(requestedAmount, evaluation.maxApprovedAmount);

  return {
    id: uuidv4(),
    prepayNo: `YZ${new Date().getFullYear()}${Math.floor(Math.random() * 90000000 + 10000000)}`,
    orderId: order.id,
    driverId,
    shipperId,
    requestedAmount: Math.round(requestedAmount * 100) / 100,
    approvedAmount: Math.round(approved * 100) / 100,
    disbursedAmount: 0,
    riskScore: evaluation.riskScore,
    riskLevel: evaluation.riskLevel,
    riskReasons: evaluation.riskReasons,
    status,
    requestedAt: now,
    riskEvaluatedAt: now,
    approvedAt: ['risk_approved', 'approved', 'disbursed', 'settled'].includes(status) ? now : undefined,
    rejectReason: status === 'rejected' ? evaluation.riskReasons.join('；') : undefined,
  };
}

export interface DisbursementResult {
  success: boolean;
  prepayOrderId: string;
  disbursedAmount: number;
  transactionId: string;
  disbursedAt: string;
  message: string;
}

export function executeDisbursement(prepayOrder: PrepayOrder): DisbursementResult {
  if (prepayOrder.status === 'rejected') {
    return {
      success: false,
      prepayOrderId: prepayOrder.id,
      disbursedAmount: 0,
      transactionId: '',
      disbursedAt: '',
      message: '预支单已被拒绝，无法放款',
    };
  }

  if (prepayOrder.status === 'disbursed' || prepayOrder.status === 'settled') {
    return {
      success: false,
      prepayOrderId: prepayOrder.id,
      disbursedAmount: 0,
      transactionId: '',
      disbursedAt: '',
      message: '预支单已完成放款',
    };
  }

  if (prepayOrder.approvedAmount <= 0) {
    return {
      success: false,
      prepayOrderId: prepayOrder.id,
      disbursedAmount: 0,
      transactionId: '',
      disbursedAt: '',
      message: '审批金额为0，无法放款',
    };
  }

  const now = new Date().toISOString();
  const txId = uuidv4();

  return {
    success: true,
    prepayOrderId: prepayOrder.id,
    disbursedAmount: prepayOrder.approvedAmount,
    transactionId: txId,
    disbursedAt: now,
    message: '放款成功',
  };
}
