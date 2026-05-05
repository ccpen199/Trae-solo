import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalance {
  id: string;
  userId: string;
  available: number;
  frozen: number;
  totalIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundShare {
  id: string;
  userId: string;
  totalShares: number;
  availableShares: number;
  frozenShares: number;
  nav: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  orderNo?: string;
  type: string;
  channel?: string;
  amount: number;
  shares?: number;
  nav?: number;
  status: string;
  description?: string;
  failReason?: string;
  externalOrderNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  orderNo: string;
  type: string;
  amount: number;
  shares?: number;
  nav?: number;
  status: string;
  failReason?: string;
  externalOrderNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

function generateOrderNo(prefix: string = 'ORD'): string {
  const dateStr = format(new Date(), 'yyyyMMddHHmmss');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${dateStr}${randomStr}`;
}

const FUND_NAV = 1.0;

class SimpleStore {
  users: Map<string, User> = new Map();
  usersByUsername: Map<string, User> = new Map();
  accountBalances: Map<string, AccountBalance> = new Map();
  fundShares: Map<string, FundShare> = new Map();
  transactions: Transaction[] = [];
  orders: Order[] = [];

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.usersByUsername.get(username) || null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    this.usersByUsername.set(user.username, newUser);

    await this.createAccountBalance({
      userId: id,
      available: 10000,
      frozen: 0,
      totalIncome: 0,
    });

    await this.createFundShare({
      userId: id,
      totalShares: 5000,
      availableShares: 5000,
      frozenShares: 0,
      nav: FUND_NAV,
    });

    return newUser;
  }

  async createAccountBalance(data: Omit<AccountBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountBalance> {
    const id = uuidv4();
    const now = new Date();
    const balance: AccountBalance = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.accountBalances.set(data.userId, balance);
    return balance;
  }

  async createFundShare(data: Omit<FundShare, 'id' | 'createdAt' | 'updatedAt'>): Promise<FundShare> {
    const id = uuidv4();
    const now = new Date();
    const share: FundShare = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.fundShares.set(data.userId, share);
    return share;
  }

  async getAccountBalance(userId: string): Promise<AccountBalance | null> {
    return this.accountBalances.get(userId) || null;
  }

  async getFundShare(userId: string): Promise<FundShare | null> {
    return this.fundShares.get(userId) || null;
  }

  async updateAccountBalance(userId: string, amount: number): Promise<void> {
    const balance = this.accountBalances.get(userId);
    if (balance) {
      balance.available += amount;
      balance.updatedAt = new Date();
    }
  }

  async updateFundShare(userId: string, shares: number): Promise<void> {
    const share = this.fundShares.get(userId);
    if (share) {
      share.totalShares += shares;
      share.availableShares += shares;
      share.updatedAt = new Date();
    }
  }

  async addIncome(userId: string, amount: number): Promise<void> {
    const balance = this.accountBalances.get(userId);
    if (balance) {
      balance.available += amount;
      balance.totalIncome += amount;
      balance.updatedAt = new Date();
    }
  }

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const id = uuidv4();
    const now = new Date();
    const order: Order = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.orders.push(order);
    return order;
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date();
    const tx: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.push(tx);
    return tx;
  }

  async getTransactions(userId: string, limit: number = 20): Promise<Transaction[]> {
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTransferIn(userId: string, limit: number = 20): Promise<Transaction[]> {
    const inTypes = ['PURCHASE', 'TRANSFER_IN', 'INCOME', 'REFUND'];
    return this.transactions
      .filter(t => t.userId === userId && inTypes.includes(t.type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTransferOut(userId: string, limit: number = 20): Promise<Transaction[]> {
    const outTypes = ['REDEEM', 'TRANSFER_OUT', 'WITHDRAW', 'PAYMENT'];
    return this.transactions
      .filter(t => t.userId === userId && outTypes.includes(t.type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const simpleStore = new SimpleStore();
export { generateOrderNo, FUND_NAV };
