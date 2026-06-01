import { AccountRepository } from '../repositories/account.repository';
import type { Account, Valuation } from '@shared/types';

export class AccountService {
  private accountRepository = new AccountRepository();

  getAccounts(userId: number): Account[] {
    return this.accountRepository.findByUserId(userId);
  }

  getAccountById(id: number, userId: number): Account | null {
    return this.accountRepository.findById(id, userId);
  }

  createAccount(userId: number, data: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentValue'>): Account {
    return this.accountRepository.create({
      ...data,
      userId,
    });
  }

  updateAccount(id: number, userId: number, data: Partial<Account>): Account | null {
    return this.accountRepository.update(id, userId, data);
  }

  deleteAccount(id: number, userId: number): boolean {
    return this.accountRepository.delete(id, userId);
  }

  getValuations(accountId: number, userId: number): Valuation[] {
    return this.accountRepository.findValuations(accountId, userId);
  }

  addValuation(userId: number, accountId: number, data: Omit<Valuation, 'id' | 'accountId' | 'createdAt'>): Valuation {
    const account = this.accountRepository.findById(accountId, userId);
    
    if (!account) {
      throw new Error('账户不存在');
    }

    return this.accountRepository.addValuation({
      ...data,
      accountId,
    });
  }
}
