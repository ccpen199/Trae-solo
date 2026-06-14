import { create } from 'zustand';
import type { Enterprise, ServicePackage, BatchOrder, Bill } from '@/types';

interface EnterpriseState {
  enterprise: Enterprise | null;
  enterpriseList: Enterprise[];
  servicePackages: ServicePackage[];
  batchOrders: BatchOrder[];
  bills: Bill[];
  setEnterprise: (enterprise: Enterprise | null) => void;
  setEnterpriseList: (enterprises: Enterprise[]) => void;
  setServicePackages: (packages: ServicePackage[]) => void;
  setBatchOrders: (orders: BatchOrder[]) => void;
  setBills: (bills: Bill[]) => void;
  addEnterprise: (enterprise: Omit<Enterprise, 'id'>) => void;
  updateEnterprise: (id: number, data: Partial<Enterprise>) => void;
  addServicePackage: (pkg: Omit<ServicePackage, 'id'>) => void;
  updateServicePackage: (id: number, data: Partial<ServicePackage>) => void;
  deleteServicePackage: (id: number) => void;
  createBatchOrder: (enterpriseId: number, packageId: number, count: number) => void;
  useBatchOrder: (batchOrderId: number) => void;
  payBill: (billId: number) => void;
  getUnpaidBills: () => Bill[];
  getEnterpriseById: (id: number) => Enterprise | undefined;
  getActiveBatchOrders: (enterpriseId: number) => BatchOrder[];
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  enterprise: {
    id: 2001,
    name: '北京星辰科技有限公司',
    contact: '张经理',
    phone: '13900139001',
    status: 'active',
  },
  enterpriseList: [
    {
      id: 2001,
      name: '北京星辰科技有限公司',
      contact: '张经理',
      phone: '13900139001',
      status: 'active',
    },
    {
      id: 2002,
      name: '上海云翔网络科技',
      contact: '李总',
      phone: '13900139002',
      status: 'active',
    },
    {
      id: 2003,
      name: '深圳创智咨询公司',
      contact: '王总监',
      phone: '13900139003',
      status: 'active',
    },
    {
      id: 2004,
      name: '杭州蓝海贸易有限公司',
      contact: '陈总',
      phone: '13900139004',
      status: 'inactive',
    },
    {
      id: 2005,
      name: '广州阳光文化传媒',
      contact: '刘经理',
      phone: '13900139005',
      status: 'active',
    },
  ],
  servicePackages: [
    {
      id: 301,
      name: '企业保洁基础包',
      service_types: ['cleaning'],
      service_type_labels: ['日常保洁'],
      price: 3800,
      original_price: 4800,
      valid_days: 90,
      description: '适合10-20人小型企业，包含10次日常保洁服务',
      features: ['10次日常保洁（每次3小时）', '专业保洁团队', '7x24客服支持', '服务不满意免费返工'],
    },
    {
      id: 302,
      name: '企业保洁进阶包',
      service_types: ['cleaning'],
      service_type_labels: ['日常保洁', '深度保洁'],
      price: 8800,
      original_price: 11000,
      valid_days: 180,
      description: '适合30-50人中型企业，含深度保洁',
      features: ['25次日常保洁（每次4小时）', '2次深度保洁', '季度玻璃清洁', '专属客户经理'],
    },
    {
      id: 303,
      name: '员工福利餐饮包',
      service_types: ['cooking'],
      service_type_labels: ['上门烹饪'],
      price: 12000,
      original_price: 15000,
      valid_days: 90,
      description: '员工加班餐、团建餐上门烹饪服务',
      features: ['30次烹饪服务', '可定制菜单', '食材代购服务', '餐后清洁'],
    },
    {
      id: 304,
      name: 'VIP综合服务包',
      service_types: ['cleaning', 'babysitting', 'cooking'],
      service_type_labels: ['日常保洁', '育儿陪护', '上门烹饪'],
      price: 25800,
      original_price: 32000,
      valid_days: 365,
      description: '企业高管专属综合福利包',
      features: ['不限次保洁服务', '育儿陪护200小时', '烹饪服务50次', '优先派单', 'VIP专属阿姨'],
    },
    {
      id: 305,
      name: '办公室深度保洁包',
      service_types: ['cleaning'],
      service_type_labels: ['深度保洁'],
      price: 5800,
      original_price: 7200,
      valid_days: 30,
      description: '适合新办公室入驻或季度大扫除',
      features: ['4次深度保洁（每次8小时）', '开荒级清洁', '空调滤网清洗', '消毒杀菌'],
    },
  ],
  batchOrders: [
    {
      id: 4001,
      enterprise_id: 2001,
      package_id: 302,
      package_name: '企业保洁进阶包',
      total_count: 27,
      used_count: 12,
      total_amount: 8800,
      status: 'active',
      created_at: '2024-03-01T10:00:00Z',
      expire_at: '2024-08-28T23:59:59Z',
    },
    {
      id: 4002,
      enterprise_id: 2001,
      package_id: 303,
      package_name: '员工福利餐饮包',
      total_count: 30,
      used_count: 5,
      total_amount: 12000,
      status: 'active',
      created_at: '2024-05-10T14:30:00Z',
      expire_at: '2024-08-08T23:59:59Z',
    },
    {
      id: 4003,
      enterprise_id: 2001,
      package_id: 301,
      package_name: '企业保洁基础包',
      total_count: 10,
      used_count: 10,
      total_amount: 3800,
      status: 'exhausted',
      created_at: '2024-01-15T09:00:00Z',
      expire_at: '2024-04-14T23:59:59Z',
    },
    {
      id: 4004,
      enterprise_id: 2002,
      package_id: 304,
      package_name: 'VIP综合服务包',
      total_count: 100,
      used_count: 38,
      total_amount: 25800,
      status: 'active',
      created_at: '2024-02-20T11:00:00Z',
      expire_at: '2025-02-19T23:59:59Z',
    },
    {
      id: 4005,
      enterprise_id: 2003,
      package_id: 305,
      package_name: '办公室深度保洁包',
      total_count: 4,
      used_count: 4,
      total_amount: 5800,
      status: 'expired',
      created_at: '2024-02-01T16:00:00Z',
      expire_at: '2024-03-02T23:59:59Z',
    },
  ],
  bills: [
    {
      id: 5001,
      enterprise_id: 2001,
      period: '2024年6月',
      amount: 8800,
      status: 'unpaid',
      items: [
        { description: '企业保洁进阶包（续费）', amount: 8800 },
      ],
      issued_at: '2024-06-01T09:00:00Z',
      due_date: '2024-06-15T23:59:59Z',
    },
    {
      id: 5002,
      enterprise_id: 2001,
      period: '2024年5月',
      amount: 12000,
      status: 'paid',
      items: [
        { description: '员工福利餐饮包', amount: 12000 },
      ],
      issued_at: '2024-05-01T09:00:00Z',
      due_date: '2024-05-15T23:59:59Z',
    },
    {
      id: 5003,
      enterprise_id: 2001,
      period: '2024年4月',
      amount: 3800,
      status: 'paid',
      items: [
        { description: '企业保洁基础包', amount: 3800 },
      ],
      issued_at: '2024-04-01T09:00:00Z',
      due_date: '2024-04-15T23:59:59Z',
    },
    {
      id: 5004,
      enterprise_id: 2002,
      period: '2024年6月',
      amount: 25800,
      status: 'paid',
      items: [
        { description: 'VIP综合服务包（年度）', amount: 25800 },
      ],
      issued_at: '2024-06-05T10:00:00Z',
      due_date: '2024-06-20T23:59:59Z',
    },
  ],
  setEnterprise: (enterprise) => set({ enterprise }),
  setEnterpriseList: (enterpriseList) => set({ enterpriseList }),
  setServicePackages: (servicePackages) => set({ servicePackages }),
  setBatchOrders: (batchOrders) => set({ batchOrders }),
  setBills: (bills) => set({ bills }),
  addEnterprise: (enterprise) =>
    set((state) => ({
      enterpriseList: [...state.enterpriseList, { ...enterprise, id: Date.now() }],
    })),
  updateEnterprise: (id, data) =>
    set((state) => ({
      enterpriseList: state.enterpriseList.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
      enterprise: state.enterprise?.id === id ? { ...state.enterprise, ...data } : state.enterprise,
    })),
  addServicePackage: (pkg) =>
    set((state) => ({
      servicePackages: [...state.servicePackages, { ...pkg, id: Date.now() }],
    })),
  updateServicePackage: (id, data) =>
    set((state) => ({
      servicePackages: state.servicePackages.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  deleteServicePackage: (id) =>
    set((state) => ({
      servicePackages: state.servicePackages.filter((p) => p.id !== id),
    })),
  createBatchOrder: (enterpriseId, packageId, count) =>
    set((state) => {
      const pkg = state.servicePackages.find((p) => p.id === packageId);
      if (!pkg) return state;
      const newBatch: BatchOrder = {
        id: Date.now(),
        enterprise_id: enterpriseId,
        package_id: packageId,
        package_name: pkg.name,
        total_count: count,
        used_count: 0,
        total_amount: Math.round((pkg.price / pkg.valid_days) * count),
        status: 'active',
        created_at: new Date().toISOString(),
        expire_at: new Date(Date.now() + pkg.valid_days * 24 * 60 * 60 * 1000).toISOString(),
      };
      return { batchOrders: [...state.batchOrders, newBatch] };
    }),
  useBatchOrder: (batchOrderId) =>
    set((state) => ({
      batchOrders: state.batchOrders.map((b) => {
        if (b.id !== batchOrderId) return b;
        const newUsedCount = b.used_count + 1;
        return {
          ...b,
          used_count: newUsedCount,
          status: newUsedCount >= b.total_count ? 'exhausted' : b.status,
        };
      }),
    })),
  payBill: (billId) =>
    set((state) => ({
      bills: state.bills.map((b) =>
        b.id === billId ? { ...b, status: 'paid' as const } : b
      ),
    })),
  getUnpaidBills: () => get().bills.filter((b) => b.status === 'unpaid'),
  getEnterpriseById: (id) => get().enterpriseList.find((e) => e.id === id),
  getActiveBatchOrders: (enterpriseId) =>
    get().batchOrders.filter((b) => b.enterprise_id === enterpriseId && b.status === 'active'),
}));
