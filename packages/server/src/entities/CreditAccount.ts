import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { RetailStore } from './RetailStore.js';
import { CreditRecord } from './CreditRecord.js';
import { CreditApplication } from './CreditApplication.js';
import { Order } from './Order.js';
import { CreditAccountStatus } from '../types/common.js';

export enum CreditAccountType {
  RETAIL_STORE = 'retail_store',
  FARMER = 'farmer',
}

@Entity('credit_accounts')
export class CreditAccount extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  accountNumber: string;

  @Column({
    type: 'enum',
    enum: CreditAccountType,
  })
  accountType: CreditAccountType;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalCreditLimit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  usedCreditLimit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableCreditLimit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  outstandingBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  overdueAmount: number;

  @Column({ type: 'integer', default: 30 })
  creditTermsDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overduePenaltyRate: number;

  @Column({
    type: 'enum',
    enum: CreditAccountStatus,
    default: CreditAccountStatus.ACTIVE,
  })
  status: CreditAccountStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastReviewDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date | null;

  @Column({ type: 'integer', default: 0 })
  onTimePaymentCount: number;

  @Column({ type: 'integer', default: 0 })
  latePaymentCount: number;

  @Column({ type: 'integer', default: 0 })
  defaultCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
  creditScore: number;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  retailStoreId: string | null;

  @ManyToOne(() => RetailStore, (retailStore) => retailStore.creditAccounts, { nullable: true })
  retailStore: RetailStore | null;

  @Column({ type: 'uuid', nullable: true })
  farmerId: string | null;

  @OneToMany(() => CreditRecord, (creditRecord) => creditRecord.creditAccount)
  creditRecords: CreditRecord[];

  @OneToMany(() => CreditApplication, (creditApplication) => creditApplication.creditAccount)
  creditApplications: CreditApplication[];

  @OneToMany(() => Order, (order) => order.creditAccount)
  orders: Order[];

  checkCreditAvailability(amount: number): { available: boolean; reason?: string } {
    if (this.status !== CreditAccountStatus.ACTIVE) {
      return { available: false, reason: `信用账户状态为 ${this.status}，无法使用` };
    }

    if (this.overdueAmount > 0) {
      return { available: false, reason: `存在逾期金额 ${this.overdueAmount}，请先还清` };
    }

    if (amount > this.availableCreditLimit) {
      return { 
        available: false, 
        reason: `信用额度不足。可用额度: ${this.availableCreditLimit}, 申请金额: ${amount}` 
      };
    }

    return { available: true };
  }

  updateAvailableLimit(): void {
    this.availableCreditLimit = this.totalCreditLimit - this.usedCreditLimit;
  }
}
