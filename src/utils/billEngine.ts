import dayjs from 'dayjs';
import type { Bill, BillingCycleType, FeeItem, Property, Tenant } from '@/types';
import { uid } from '@/types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function genBillNo(propertyId: string, periodStart: string): string {
  const ym = dayjs(periodStart).format('YYYYMM');
  const suffix = propertyId.slice(-4).toUpperCase();
  return `BL${ym}${suffix}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export interface GenerateBillParams {
  property: Property;
  tenant: Tenant;
  periodStart: string;
  cycleType: BillingCycleType;
  autoRenew?: boolean;
  includeUtilities?: boolean;
}

export function generateBill(params: GenerateBillParams): Bill {
  const { property, tenant, periodStart, cycleType, autoRenew = true } = params;
  const start = dayjs(periodStart);
  const end = start.add(1, 'month').subtract(1, 'day');
  const dueDate = start.add(10, 'day');

  const items: FeeItem[] = [
    {
      id: uid('fee_'),
      type: 'rent',
      name: `房屋租金 (${start.format('YYYY-MM')})`,
      amount: round2(property.monthlyRent),
      calculation: `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')} 月租金`,
    },
  ];

  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  return {
    id: uid('bill_'),
    billNo: genBillNo(property.id, periodStart),
    propertyId: property.id,
    tenantId: tenant.id,
    periodStart: start.format('YYYY-MM-DD'),
    periodEnd: end.format('YYYY-MM-DD'),
    dueDate: dueDate.format('YYYY-MM-DD'),
    cycleType,
    autoRenew,
    items,
    totalAmount: round2(totalAmount),
    paidAmount: 0,
    status: 'pending',
    payments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function computeNextPeriodStart(currentEnd: string, cycleType: BillingCycleType): string {
  const end = dayjs(currentEnd);
  switch (cycleType) {
    case 'monthly':
      return end.add(1, 'day').format('YYYY-MM-DD');
    case 'fixed_day':
      return end.add(1, 'day').format('YYYY-MM-DD');
    case 'custom':
      return end.add(1, 'day').format('YYYY-MM-DD');
    default:
      return end.add(1, 'day').format('YYYY-MM-DD');
  }
}

export function shouldAutoRenew(bill: Bill, today: string | Date = new Date()): boolean {
  if (!bill.autoRenew) return false;
  const t = dayjs(today);
  const due = dayjs(bill.dueDate);
  return t.isAfter(due.subtract(3, 'day')) && t.isBefore(due.add(15, 'day'));
}

export type BillStatusJudgement = 'normal' | 'approaching' | 'overdue' | 'paid' | 'partial';

export function judgeBillStatus(bill: Bill, today: string | Date = new Date()): BillStatusJudgement {
  if (bill.status === 'paid') return 'paid';
  if (bill.status === 'cancelled') return 'normal';
  if (bill.paidAmount > 0 && bill.paidAmount < bill.totalAmount) return 'partial';
  const t = dayjs(today);
  const due = dayjs(bill.dueDate);
  if (t.isAfter(due)) return 'overdue';
  if (due.diff(t, 'day') <= 3) return 'approaching';
  return 'normal';
}

export function buildRentFeeItem(
  monthlyRent: number,
  periodStart: string,
  periodEnd: string
): FeeItem {
  return {
    id: uid('fee_'),
    type: 'rent',
    name: `房屋租金 (${dayjs(periodStart).format('YYYY-MM')})`,
    amount: round2(monthlyRent),
    calculation: `${periodStart} ~ ${periodEnd} 月租金标准`,
  };
}

export function buildDepositFeeItem(monthlyRent: number, rate = 0.2): FeeItem {
  const deposit = round2(monthlyRent * rate);
  return {
    id: uid('fee_'),
    type: 'deposit',
    name: '履约押金（月租金20%，民法典上限）',
    amount: deposit,
    calculation: `${monthlyRent} × ${(rate * 100).toFixed(0)}% = ${deposit}`,
  };
}

export function validateLeaseTerm(start: string, end: string): { valid: boolean; message?: string } {
  const years = dayjs(end).diff(dayjs(start), 'year', true);
  if (years > 20) {
    return {
      valid: false,
      message: `根据《民法典》第705条，租赁期限不得超过20年（当前约${years.toFixed(1)}年）`,
    };
  }
  if (years <= 0) {
    return { valid: false, message: '租期结束日必须晚于起始日' };
  }
  return { valid: true };
}

export function validateDepositAmount(
  monthlyRent: number,
  deposit: number
): { valid: boolean; message?: string; maxDeposit: number } {
  const max = round2(monthlyRent * 0.2);
  if (deposit > max) {
    return {
      valid: false,
      message: `根据《民法典》第586条，定金/押金不得超过主合同标的额的20%（月租金${monthlyRent}元×20%=${max}元）`,
      maxDeposit: max,
    };
  }
  return { valid: true, maxDeposit: max };
}
