import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Property,
  Bill,
  Tenant,
  LeaseTemplate,
  OperationLogEntry,
  Meter,
  LogModule,
  LogAction,
} from '@/types';
import { uid } from '@/types';
import { mockBills, mockLeaseTemplates, mockLogs, mockProperties, mockTenants } from '@/data/mockData';
import { buildLogEntry, diffObject } from '@/utils/logger';

interface AppState {
  properties: Property[];
  tenants: Tenant[];
  bills: Bill[];
  leaseTemplates: LeaseTemplate[];
  logs: OperationLogEntry[];
  operatorName: string;

  addProperty: (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Property;
  updateProperty: (id: string, data: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  setMeterReading: (propertyId: string, meterId: string, reading: number, date: string) => void;

  addTenant: (data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => Tenant;
  updateTenant: (id: string, data: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  addBill: (data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Bill;
  updateBill: (id: string, data: Partial<Bill>) => void;
  appendBillItems: (id: string, items: Bill['items']) => void;
  markBillPaid: (
    id: string,
    amount: number,
    method: Bill['payments'][number]['method'],
    remark?: string
  ) => void;
  deleteBill: (id: string) => void;

  log: (entry: Omit<OperationLogEntry, 'id' | 'timestamp'>) => void;
  logAction: (params: {
    module: LogModule;
    action: LogAction;
    targetId?: string;
    targetName?: string;
    summary: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }) => void;

  resetAll: () => void;
  clearLogs: () => void;
}

const initialState = {
  properties: mockProperties,
  tenants: mockTenants,
  bills: mockBills,
  leaseTemplates: mockLeaseTemplates,
  logs: mockLogs,
  operatorName: '房东（管理员）',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addProperty: (data) => {
        const now = new Date().toISOString();
        const newProp: Property = { ...data, id: uid('prop_'), createdAt: now, updatedAt: now };
        set((s) => ({ properties: [newProp, ...s.properties] }));
        get().logAction({
          module: 'property',
          action: 'create',
          targetId: newProp.id,
          targetName: newProp.title,
          summary: `新增房源「${newProp.title}」，地址：${newProp.address}，表计配置 ${newProp.meters.length} 项`,
        });
        return newProp;
      },

      updateProperty: (id, data) => {
        set((s) => {
          const target = s.properties.find((p) => p.id === id);
          const before = target
            ? ({ ...target } as unknown as Record<string, unknown>)
            : undefined;
          const properties = s.properties.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          );
          const after = properties.find((p) => p.id === id) as unknown as Record<string, unknown>;
          const newTarget = properties.find((p) => p.id === id);
          if (target && newTarget) {
            get().logAction({
              module: 'property',
              action: 'update',
              targetId: id,
              targetName: newTarget.title,
              summary: `更新房源信息「${newTarget.title}」`,
              before,
              after,
            });
          }
          return { properties };
        });
      },

      deleteProperty: (id) => {
        const target = get().properties.find((p) => p.id === id);
        set((s) => ({ properties: s.properties.filter((p) => p.id !== id) }));
        if (target) {
          get().logAction({
            module: 'property',
            action: 'delete',
            targetId: id,
            targetName: target.title,
            summary: `删除房源「${target.title}」`,
          });
        }
      },

      setMeterReading: (propertyId, meterId, reading, date) => {
        set((s) => ({
          properties: s.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  updatedAt: new Date().toISOString(),
                  meters: p.meters.map((m: Meter) =>
                    m.id === meterId
                      ? { ...m, lastReading: reading, lastReadingDate: date }
                      : m
                  ),
                }
              : p
          ),
        }));
        const prop = get().properties.find((p) => p.id === propertyId);
        const meter = prop?.meters.find((m) => m.id === meterId);
        if (prop && meter) {
          get().logAction({
            module: 'meter',
            action: 'update',
            targetId: meterId,
            targetName: `${prop.title} · ${meter.meterNo}`,
            summary: `抄表更新：${meter.meterNo} 读数 ${reading}（${date}）`,
          });
        }
      },

      addTenant: (data) => {
        const now = new Date().toISOString();
        const newTenant: Tenant = { ...data, id: uid('ten_'), createdAt: now, updatedAt: now };
        set((s) => ({ tenants: [newTenant, ...s.tenants] }));
        get().logAction({
          module: 'tenant',
          action: 'create',
          targetId: newTenant.id,
          targetName: newTenant.name,
          summary: `新增租客「${newTenant.name}」，手机号 ${newTenant.phone}`,
        });
        return newTenant;
      },

      updateTenant: (id, data) => {
        set((s) => {
          const target = s.tenants.find((t) => t.id === id);
          const before = target
            ? ({ ...target } as unknown as Record<string, unknown>)
            : undefined;
          const tenants = s.tenants.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          );
          const after = tenants.find((t) => t.id === id) as unknown as Record<string, unknown>;
          const newT = tenants.find((t) => t.id === id);
          if (target && newT) {
            get().logAction({
              module: 'tenant',
              action: 'update',
              targetId: id,
              targetName: newT.name,
              summary: `更新租客信息「${newT.name}」`,
              before,
              after,
            });
          }
          return { tenants };
        });
      },

      deleteTenant: (id) => {
        const target = get().tenants.find((t) => t.id === id);
        set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) }));
        if (target) {
          get().logAction({
            module: 'tenant',
            action: 'delete',
            targetId: id,
            targetName: target.name,
            summary: `删除/退租租客「${target.name}」`,
          });
        }
      },

      addBill: (data) => {
        const now = new Date().toISOString();
        const newBill: Bill = { ...data, id: uid('bill_'), createdAt: now, updatedAt: now };
        set((s) => ({ bills: [newBill, ...s.bills] }));
        const prop = get().properties.find((p) => p.id === newBill.propertyId);
        const tenant = get().tenants.find((t) => t.id === newBill.tenantId);
        get().logAction({
          module: 'bill',
          action: 'create',
          targetId: newBill.id,
          targetName: newBill.billNo,
          summary: `生成账单 ${newBill.billNo}（${prop?.title ?? '-'} · ${tenant?.name ?? '-'}），合计 ${newBill.totalAmount} 元`,
        });
        return newBill;
      },

      updateBill: (id, data) => {
        set((s) => {
          const target = s.bills.find((b) => b.id === id);
          const before = target
            ? ({ ...target } as unknown as Record<string, unknown>)
            : undefined;
          const bills = s.bills.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b
          );
          const after = bills.find((b) => b.id === id) as unknown as Record<string, unknown>;
          const newB = bills.find((b) => b.id === id);
          if (target && newB) {
            get().logAction({
              module: 'bill',
              action: 'update',
              targetId: id,
              targetName: newB.billNo,
              summary: `修改账单 ${newB.billNo}`,
              before,
              after,
            });
          }
          return { bills };
        });
      },

      appendBillItems: (id, items) => {
        set((s) => ({
          bills: s.bills.map((b) => {
            if (b.id !== id) return b;
            const newItems = [...b.items, ...items];
            const total = newItems.reduce((sum, it) => sum + it.amount, 0);
            return {
              ...b,
              items: newItems,
              totalAmount: Math.round(total * 100) / 100,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        const bill = get().bills.find((b) => b.id === id);
        if (bill) {
          get().logAction({
            module: 'meter',
            action: 'update',
            targetId: id,
            targetName: bill.billNo,
            summary: `账单 ${bill.billNo} 追加 ${items.length} 项抄表费用，合计 ${bill.totalAmount} 元`,
          });
        }
      },

      markBillPaid: (id, amount, method, remark) => {
        set((s) => ({
          bills: s.bills.map((b) => {
            if (b.id !== id) return b;
            const paid = b.paidAmount + amount;
            let status = b.status;
            if (paid >= b.totalAmount) status = 'paid';
            else if (paid > 0) status = 'partial';
            const payment = {
              id: uid('pay_'),
              amount,
              method,
              paidAt: new Date().toISOString(),
              remark,
              operator: get().operatorName,
            };
            return {
              ...b,
              paidAmount: Math.round(paid * 100) / 100,
              status,
              payments: [...b.payments, payment],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        const bill = get().bills.find((b) => b.id === id);
        if (bill) {
          get().logAction({
            module: 'bill',
            action: 'pay',
            targetId: id,
            targetName: bill.billNo,
            summary: `账单收款：${bill.billNo} 收款 ${amount} 元（${method}）${remark ? ' · ' + remark : ''}，已付 ${bill.paidAmount}/${bill.totalAmount}`,
          });
        }
      },

      deleteBill: (id) => {
        const target = get().bills.find((b) => b.id === id);
        set((s) => ({ bills: s.bills.filter((b) => b.id !== id) }));
        if (target) {
          get().logAction({
            module: 'bill',
            action: 'delete',
            targetId: id,
            targetName: target.billNo,
            summary: `删除账单 ${target.billNo}`,
          });
        }
      },

      log: (entry) => {
        const e = buildLogEntry({
          module: entry.module,
          action: entry.action,
          operator: entry.operator,
          targetId: entry.targetId,
          targetName: entry.targetName,
          summary: entry.summary,
          diff: entry.diff,
        });
        set((s) => ({ logs: [e, ...s.logs].slice(0, 500) }));
      },

      logAction: ({ module, action, targetId, targetName, summary, before, after }) => {
        const diff =
          before && after ? diffObject(before, after) : undefined;
        const keys = diff ? Object.keys(diff) : [];
        let finalSummary = summary;
        if (keys.length && !summary.includes('字段')) {
          finalSummary += ` · 变更字段：${keys.join(', ')}`;
        }
        const entry = buildLogEntry({
          module,
          action,
          operator: get().operatorName,
          targetId,
          targetName,
          summary: finalSummary,
          diff: diff ?? undefined,
        });
        set((s) => ({ logs: [entry, ...s.logs].slice(0, 500) }));
      },

      resetAll: () => {
        set(initialState);
      },

      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: 'property-asset-saas-store',
      version: 1,
    }
  )
);
