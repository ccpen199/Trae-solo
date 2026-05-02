import prisma from '../../utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface ReconciliationResult {
  reconId: string;
  totalTransactions: number;
  totalErpRecords: number;
  matchedCount: number;
  unmatchedCount: number;
  exceptionCount: number;
  reconDate: Date;
  status: string;
  matchedItems: any[];
  unmatchedItems: any[];
  exceptionItems: any[];
}

export interface MatchRule {
  id: string;
  name: string;
  description: string;
  fields: string[];
  tolerancePercent: number;
  isActive: boolean;
  priority: number;
}

const DEFAULT_MATCH_RULES: MatchRule[] = [
  {
    id: uuidv4(),
    name: '精确匹配',
    description: '基于金额和对方账户的精确匹配',
    fields: ['amount', 'counterPartyAccount'],
    tolerancePercent: 0,
    isActive: true,
    priority: 1,
  },
  {
    id: uuidv4(),
    name: '金额模糊匹配',
    description: '允许小额差异的金额匹配',
    fields: ['amount'],
    tolerancePercent: 0.01,
    isActive: true,
    priority: 2,
  },
  {
    id: uuidv4(),
    name: '金额范围匹配',
    description: '基于金额范围的匹配',
    fields: ['amount'],
    tolerancePercent: 5,
    isActive: true,
    priority: 3,
  },
];

class CashReconcile {
  private matchRules: MatchRule[];

  constructor() {
    this.matchRules = DEFAULT_MATCH_RULES;
  }

  async performReconciliation(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccountId: accountId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { transactionDate: 'asc' },
    });

    const erpRecords = await prisma.erpDocument.findMany({
      where: {
        bankAccountId: accountId,
        documentDate: {
          gte: startDate,
          lte: endDate,
        },
        reconcileStatus: {
          not: 'MATCHED',
        },
      },
      orderBy: { documentDate: 'asc' },
    });

    const matchedItems: any[] = [];
    const unmatchedItems: any[] = [];
    const exceptionItems: any[] = [];

    const matchedTransactionIds = new Set<string>();
    const matchedErpIds = new Set<string>();

    for (const rule of this.matchRules) {
      if (!rule.isActive) continue;

      for (const transaction of transactions) {
        if (matchedTransactionIds.has(transaction.id)) continue;

        for (const erpRecord of erpRecords) {
          if (matchedErpIds.has(erpRecord.id)) continue;

          const matchResult = this.evaluateMatch(transaction, erpRecord, rule);

          if (matchResult.isMatch) {
            matchedItems.push({
              transactionId: transaction.id,
              erpDocumentId: erpRecord.id,
              matchRule: rule.name,
              matchScore: matchResult.score,
              tolerance: matchResult.tolerance,
              matchedAmount: transaction.amount,
              erpAmount: erpRecord.amount,
              difference: Number(transaction.amount) - Number(erpRecord.amount),
            });

            matchedTransactionIds.add(transaction.id);
            matchedErpIds.add(erpRecord.id);
            break;
          }
        }
      }
    }

    for (const transaction of transactions) {
      if (!matchedTransactionIds.has(transaction.id)) {
        const isException = this.detectException(transaction);
        
        if (isException) {
          exceptionItems.push({
            transactionId: transaction.id,
            transactionRef: transaction.transactionRef,
            transactionDate: transaction.transactionDate,
            counterParty: transaction.counterParty,
            amount: transaction.amount,
            exceptionType: this.classifyException(transaction),
            description: '银行端异常',
          });
        } else {
          unmatchedItems.push({
            source: 'BANK',
            transactionId: transaction.id,
            transactionRef: transaction.transactionRef,
            transactionDate: transaction.transactionDate,
            counterParty: transaction.counterParty,
            amount: transaction.amount,
            description: '银行端未匹配',
          });
        }
      }
    }

    for (const erpRecord of erpRecords) {
      if (!matchedErpIds.has(erpRecord.id)) {
        unmatchedItems.push({
          source: 'ERP',
          erpDocumentId: erpRecord.id,
          erpNumber: erpRecord.erpNumber,
          documentDate: erpRecord.documentDate,
          counterParty: erpRecord.counterParty,
          amount: erpRecord.amount,
          documentType: erpRecord.documentType,
          description: 'ERP端未匹配',
        });
      }
    }

    const reconciliation = await prisma.reconciliation.create({
      data: {
        bankAccountId: accountId,
        reconDate: new Date(),
        reconNumber: `RC-${Date.now().toString()}`,
        periodStart: startDate,
        periodEnd: endDate,
        totalTransactions: transactions.length,
        totalErpRecords: erpRecords.length,
        matchedCount: matchedItems.length,
        unmatchedCount: unmatchedItems.length,
        exceptionCount: exceptionItems.length,
        status: 'COMPLETED',
      },
    });

    for (const item of matchedItems) {
      await prisma.reconciliationItem.create({
        data: {
          reconciliationId: reconciliation.id,
          itemType: 'MATCHED',
          transactionId: item.transactionId,
          erpDocumentId: item.erpDocumentId,
          matchRule: item.matchRule,
          matchScore: item.matchScore,
          matchedAmount: item.matchedAmount,
          difference: item.difference,
        },
      });

      await prisma.transaction.update({
        where: { id: item.transactionId },
        data: { isReconciled: true, reconciledAt: new Date() },
      });

      await prisma.erpDocument.update({
        where: { id: item.erpDocumentId },
        data: { reconcileStatus: 'MATCHED', reconciledAt: new Date() },
      });
    }

    for (const item of unmatchedItems) {
      await prisma.reconciliationItem.create({
        data: {
          reconciliationId: reconciliation.id,
          itemType: 'UNMATCHED',
          transactionId: item.transactionId,
          erpDocumentId: item.erpDocumentId,
          source: item.source,
          matchedAmount: item.amount,
          description: item.description,
        },
      });
    }

    for (const item of exceptionItems) {
      const exceptionReport = await prisma.exceptionReport.create({
        data: {
          reconciliationId: reconciliation.id,
          transactionId: item.transactionId,
          exceptionType: item.exceptionType,
          severity: 'MEDIUM',
          status: 'PENDING',
          description: item.description,
        },
      });

      await prisma.reconciliationItem.create({
        data: {
          reconciliationId: reconciliation.id,
          itemType: 'EXCEPTION',
          transactionId: item.transactionId,
          exceptionReportId: exceptionReport.id,
          matchedAmount: item.amount,
          description: item.description,
        },
      });
    }

    return {
      reconId: reconciliation.id,
      totalTransactions: transactions.length,
      totalErpRecords: erpRecords.length,
      matchedCount: matchedItems.length,
      unmatchedCount: unmatchedItems.length,
      exceptionCount: exceptionItems.length,
      reconDate: reconciliation.reconDate,
      status: reconciliation.status,
      matchedItems,
      unmatchedItems,
      exceptionItems,
    };
  }

  private evaluateMatch(
    transaction: any,
    erpRecord: any,
    rule: MatchRule
  ): { isMatch: boolean; score: number; tolerance: number } {
    let score = 0;
    let matchedFields = 0;

    const transactionAmount = Number(transaction.amount);
    const erpAmount = Number(erpRecord.amount);
    const amountDiff = Math.abs(transactionAmount - erpAmount);
    const toleranceAmount = (rule.tolerancePercent / 100) * Math.abs(erpAmount);

    if (rule.fields.includes('amount')) {
      if (amountDiff <= toleranceAmount) {
        score += 50;
        matchedFields++;
      }
    } else {
      if (Math.abs(transactionAmount) === Math.abs(erpAmount)) {
        score += 50;
        matchedFields++;
      }
    }

    if (rule.fields.includes('counterPartyAccount')) {
      if (
        transaction.counterPartyAccount &&
        transaction.counterPartyAccount === erpRecord.counterPartyAccount
      ) {
        score += 30;
        matchedFields++;
      }
    }

    const transactionDate = transaction.transactionDate as Date;
    const erpDate = erpRecord.documentDate as Date;
    const daysDiff = Math.abs(
      (transactionDate.getTime() - erpDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff <= 3) {
      score += 20;
      matchedFields++;
    }

    const isMatch = score >= 70;

    return {
      isMatch,
      score,
      tolerance: amountDiff,
    };
  }

  private detectException(transaction: any): boolean {
    const amount = Number(transaction.amount);
    
    if (Math.abs(amount) > 1000000) {
      return true;
    }

    const transactionRef = transaction.transactionRef || '';
    if (!transactionRef || transactionRef.length < 5) {
      return true;
    }

    return false;
  }

  private classifyException(transaction: any): string {
    const amount = Number(transaction.amount);
    
    if (Math.abs(amount) > 1000000) {
      return 'LARGE_AMOUNT';
    }

    return 'UNKNOWN_EXCEPTION';
  }

  getMatchRules(): MatchRule[] {
    return this.matchRules;
  }
}

const cashReconcile = new CashReconcile();
export default cashReconcile;
