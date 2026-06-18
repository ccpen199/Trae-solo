import type { AmlCheckResult, RiskAlert } from '@neighborhood/shared';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

export async function checkWithdrawRisk(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  const dailyLimit = (tenant?.settings as Record<string, unknown>)?.dailyWithdrawLimit as number ?? config.risk.dailyWithdrawLimit;
  const singleLimit = (tenant?.settings as Record<string, unknown>)?.singleWithdrawLimit as number ?? config.risk.singleWithdrawLimit;

  if (amount > singleLimit) {
    await generateRiskAlert('withdraw_limit', 'high', 'Single withdrawal limit exceeded', `User ${userId} attempted to withdraw ${amount}, exceeding single limit of ${singleLimit}`, { userId, amount, singleLimit });
    return { allowed: false, reason: `Single withdrawal limit is ${singleLimit}` };
  }

  const dailyTotal = await calculateDailyWithdrawTotal(userId);
  if (dailyTotal + amount > dailyLimit) {
    await generateRiskAlert('withdraw_limit', 'high', 'Daily withdrawal limit exceeded', `User ${userId} daily total ${dailyTotal + amount} exceeds limit ${dailyLimit}`, { userId, amount, dailyTotal, dailyLimit });
    return { allowed: false, reason: `Daily withdrawal limit is ${dailyLimit}, remaining: ${dailyLimit - dailyTotal}` };
  }

  const amlResult = await checkAmlRules(userId, amount);
  if (!amlResult.passed) {
    await generateRiskAlert('aml', 'critical', 'AML check failed', `User ${userId} failed AML check: ${amlResult.triggers.join(', ')}`, { userId, amount, amlResult });
    return { allowed: false, reason: 'AML check failed: ' + amlResult.triggers.join(', ') };
  }

  return { allowed: true };
}

export async function checkAmlRules(userId: string, amount: number): Promise<AmlCheckResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { passed: false, riskLevel: 'high', triggers: ['User not found'] };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  const amlThreshold = (tenant?.settings as Record<string, unknown>)?.amlTransactionThreshold as number ?? config.risk.amlTransactionThreshold;

  const triggers: string[] = [];
  let riskLevel: AmlCheckResult['riskLevel'] = 'low';

  const monthlyWithdrawals = await prisma.withdrawRecord.aggregate({
    where: {
      userId,
      status: { in: ['success', 'processing'] },
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
    _sum: { amount: true },
  });

  const monthlyTotal = monthlyWithdrawals._sum.amount ?? 0;

  if (monthlyTotal + amount > amlThreshold) {
    triggers.push('Monthly transaction threshold exceeded');
    riskLevel = 'high';
  }

  const recentWithdrawals = await prisma.withdrawRecord.count({
    where: {
      userId,
      status: { in: ['success', 'processing'] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recentWithdrawals >= 5) {
    triggers.push('High frequency withdrawals');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  const wallet = await prisma.userWallet.findUnique({ where: { userId } });
  if (wallet && amount > wallet.balance * 0.8) {
    triggers.push('Withdrawal amount exceeds 80% of balance');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  return {
    passed: triggers.length === 0,
    riskLevel,
    triggers,
    dailyTotal: await calculateDailyWithdrawTotal(userId),
    monthlyTotal,
  };
}

export async function recordSensitiveWordHit(
  topicId: string | null,
  commentId: string | null,
  userId: string,
  matchedWords: string[],
  score: number,
  isBlocked: boolean,
) {
  const contentSnippet = matchedWords.join(', ');

  await prisma.sensitiveWordHitLog.create({
    data: {
      topicId: topicId ?? undefined,
      commentId: commentId ?? undefined,
      userId,
      matchedWords,
      contentSnippet,
      riskScore: score,
      isBlocked,
    },
  });

  if (score >= 80) {
    await generateRiskAlert(
      'sensitive_topic',
      score >= 90 ? 'critical' : 'high',
      'Sensitive word detected',
      `Sensitive words detected: ${matchedWords.join(', ')}`,
      { topicId, commentId, userId, matchedWords, score, isBlocked },
    );
  }
}

export async function generateRiskAlert(
  type: RiskAlert['type'],
  severity: RiskAlert['severity'],
  title: string,
  description: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await prisma.riskAlert.create({
    data: {
      type,
      severity,
      title,
      description,
      data: data as Record<string, unknown> | undefined,
      isHandled: false,
    },
  });
}

export async function calculateDailyWithdrawTotal(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.withdrawRecord.aggregate({
    where: {
      userId,
      status: { in: ['success', 'processing', 'pending'] },
      createdAt: { gte: today },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}
