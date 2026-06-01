import { TransactionRepository } from '../repositories/transaction.repository';
import { AccountRepository } from '../repositories/account.repository';
import type { Transaction, Transfer, Category, Tag } from '@shared/types';

export class TransactionService {
  private transactionRepository = new TransactionRepository();
  private accountRepository = new AccountRepository();

  getTransactions(userId: number, filters: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    accountId?: number;
    page?: number;
    pageSize?: number;
  }) {
    return this.transactionRepository.findTransactions(userId, filters);
  }

  createTransaction(userId: number, data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Transaction {
    const account = this.accountRepository.findById(data.accountId, userId);
    
    if (!account) {
      throw new Error('账户不存在');
    }

    return this.transactionRepository.createTransaction({
      ...data,
      userId,
    });
  }

  updateTransaction(id: number, userId: number, data: Partial<Transaction>): Transaction | null {
    return this.transactionRepository.updateTransaction(id, userId, data);
  }

  deleteTransaction(id: number, userId: number): boolean {
    return this.transactionRepository.deleteTransaction(id, userId);
  }

  getTransfers(userId: number, filters: {
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.transactionRepository.findTransfers(userId, filters);
  }

  createTransfer(userId: number, data: Omit<Transfer, 'id' | 'userId' | 'createdAt'>): Transfer {
    const fromAccount = this.accountRepository.findById(data.fromAccountId, userId);
    const toAccount = this.accountRepository.findById(data.toAccountId, userId);
    
    if (!fromAccount || !toAccount) {
      throw new Error('转出或转入账户不存在');
    }

    if (data.fromAccountId === data.toAccountId) {
      throw new Error('转出和转入账户不能相同');
    }

    return this.transactionRepository.createTransfer({
      ...data,
      userId,
    });
  }

  getCategories(type?: 'income' | 'expense'): Category[] {
    return this.transactionRepository.getCategories(type);
  }

  getTags(userId: number): Tag[] {
    return this.transactionRepository.getTags(userId);
  }

  createTag(userId: number, name: string, color?: string): Tag {
    const existingTags = this.transactionRepository.getTags(userId);
    
    if (existingTags.some(t => t.name === name)) {
      throw new Error('标签已存在');
    }

    return this.transactionRepository.createTag(userId, name, color);
  }

  getMonthlySummary(userId: number, year: number, month: number) {
    return this.transactionRepository.getMonthlySummary(userId, year, month);
  }
}
