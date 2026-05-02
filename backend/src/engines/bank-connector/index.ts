import prisma from '../../utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface AccountSyncConfig {
  accountName: string;
  bankName: string;
  bankCode?: string;
  accountType?: string;
  currency?: string;
  balance?: number;
  availableBalance?: number;
}

export interface SyncResult {
  success: boolean;
  balanceUpdated: boolean;
  newTransactions: number;
  syncedAt: Date;
  errorMessage?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionRef?: string;
  bankReference?: string;
  receiptData?: string;
  completedAt: Date;
  errorMessage?: string;
}

interface RegisteredAccount {
  accountNumber: string;
  config: AccountSyncConfig;
  lastSyncTime?: Date;
}

class BankConnector {
  private registeredAccounts: Map<string, RegisteredAccount> = new Map();
  private syncInterval: number = 5;

  registerAccountForSync(accountNumber: string, config: AccountSyncConfig): void {
    this.registeredAccounts.set(accountNumber, {
      accountNumber,
      config,
      lastSyncTime: new Date(),
    });
  }

  async syncAllActiveAccounts(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const [accountNumber, _] of this.registeredAccounts) {
      const result = await this.syncAccount(accountNumber);
      results.push(result);
    }
    return results;
  }

  async syncAccount(accountNumber: string): Promise<SyncResult> {
    try {
      const account = await prisma.bankAccount.findUnique({
        where: { accountNumber },
      });

      if (!account) {
        return {
          success: false,
          balanceUpdated: false,
          newTransactions: 0,
          syncedAt: new Date(),
          errorMessage: '账户不存在',
        };
      }

      const balanceResult = await this.syncAccountBalance(account.id, accountNumber);
      const transactionResult = await this.syncAccountTransactions(account.id, accountNumber);

      return {
        success: true,
        balanceUpdated: balanceResult.balanceUpdated,
        newTransactions: transactionResult.newTransactions,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error('Sync account error:', error);
      return {
        success: false,
        balanceUpdated: false,
        newTransactions: 0,
        syncedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async syncAccountBalance(accountId: string, accountNumber: string): Promise<{ success: boolean; balanceUpdated: boolean; syncedAt: Date }> {
    const currentAccount = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    });

    if (!currentAccount) {
      return { success: false, balanceUpdated: false, syncedAt: new Date() };
    }

    const balanceChange = (Math.random() - 0.5) * 10000;
    const newBalance = Number(currentAccount.currentBalance) + balanceChange;
    const newAvailableBalance = newBalance * 0.95;

    await prisma.bankAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: Math.max(0, newBalance),
        availableBalance: Math.max(0, newAvailableBalance),
        lastSyncTime: new Date(),
      },
    });

    await prisma.balanceHistory.create({
      data: {
        bankAccountId: accountId,
        balance: Math.max(0, newBalance),
        availableBalance: Math.max(0, newAvailableBalance),
        recordTime: new Date(),
        source: 'BANK_SYNC',
        syncStatus: 'SUCCESS',
      },
    });

    return {
      success: true,
      balanceUpdated: true,
      syncedAt: new Date(),
    };
  }

  async syncAccountTransactions(accountId: string, accountNumber: string): Promise<{ success: boolean; newTransactions: number }> {
    const transactionCount = Math.floor(Math.random() * 3);
    const transactions: any[] = [];

    for (let i = 0; i < transactionCount; i++) {
      const isCredit = Math.random() > 0.5;
      const amount = Math.random() * 10000;
      
      transactions.push({
        bankAccountId: accountId,
        transactionDate: new Date(),
        transactionRef: `TRX-${uuidv4().slice(0, 8).toUpperCase()}`,
        counterParty: isCredit ? '客户付款' : '供应商',
        amount: isCredit ? amount : -amount,
        transactionType: isCredit ? 'CREDIT' : 'DEBIT',
        purpose: isCredit ? '销售回款' : '采购付款',
      });
    }

    if (transactions.length > 0) {
      await prisma.transaction.createMany({
        data: transactions,
      });
    }

    return {
      success: true,
      newTransactions: transactions.length,
    };
  }

  async simulatePayment(
    accountId: string,
    payeeName: string,
    payeeAccount: string,
    payeeBank: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return {
          success: false,
          completedAt: new Date(),
          errorMessage: '账户不存在',
        };
      }

      if (Number(account.availableBalance) < amount) {
        return {
          success: false,
          completedAt: new Date(),
          errorMessage: '余额不足',
        };
      }

      const newBalance = Number(account.currentBalance) - amount;
      const newAvailableBalance = Number(account.availableBalance) - amount;

      await prisma.bankAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: newBalance,
          availableBalance: newAvailableBalance,
        },
      });

      await prisma.transaction.create({
        data: {
          bankAccountId: accountId,
          transactionDate: new Date(),
          transactionRef: `TRX-${uuidv4().slice(0, 8).toUpperCase()}`,
          counterParty: payeeName,
          counterPartyAccount: payeeAccount,
          amount: -amount,
          transactionType: 'TRANSFER_OUT',
          purpose: '转账付款',
        },
      });

      return {
        success: true,
        transactionRef: `REF-${uuidv4().slice(0, 12).toUpperCase()}`,
        bankReference: `BNK-${Date.now().toString()}`,
        receiptData: JSON.stringify({
          payeeName,
          payeeAccount,
          payeeBank,
          amount,
          timestamp: new Date().toISOString(),
        }),
        completedAt: new Date(),
      };
    } catch (error) {
      console.error('Simulate payment error:', error);
      return {
        success: false,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : '付款失败',
      };
    }
  }

  setSyncInterval(minutes: number): void {
    this.syncInterval = minutes;
  }

  getRegisteredAccounts(): string[] {
    return Array.from(this.registeredAccounts.keys());
  }
}

const bankConnector = new BankConnector();
export default bankConnector;
