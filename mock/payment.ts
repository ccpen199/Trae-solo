import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

export default [
  {
    url: '/api/payment/bill/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, serviceType, status } = query;
      const types = serviceType ? [serviceType] : ['water', 'electricity', 'gas'];
      const list: any[] = [];

      for (let i = 0; i < pageSize; i++) {
        const type = types[i % types.length];
        const billStatus = status ? Number(status) : Mock.Random.pick([0, 1, 2]);
        list.push({
          id: i + 1 + (page - 1) * pageSize,
          billNo: `B${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 6)}`,
          householdId: 1,
          householdNo: type === 'water' ? 'W2024000001' : type === 'electricity' ? 'E2024000002' : 'G2024000003',
          householdName: '张三',
          serviceType: type,
          billingPeriod: `2024-${String(12 - i).padStart(2, '0')}`,
          totalAmount: Mock.Random.float(50, 500, 2, 2),
          payableAmount: Mock.Random.float(50, 500, 2, 2),
          paidAmount: billStatus === 1 ? Mock.Random.float(50, 500, 2, 2) : 0,
          status: billStatus,
          billDate: `2024-${String(12 - i).padStart(2, '0')}-01`,
          dueDate: `2024-${String(12 - i + 1).padStart(2, '0')}-15`,
          details: [
            {
              itemName: type === 'electricity' ? '基础电费' : type === 'water' ? '基础水费' : '基础气费',
              quantity: Mock.Random.float(10, 200, 2, 2),
              unit: type === 'electricity' ? '度' : type === 'water' ? '吨' : '立方',
              unitPrice: Mock.Random.float(0.5, 5, 2, 2),
              amount: Mock.Random.float(30, 300, 2, 2),
            },
            { itemName: '阶梯费用', amount: Mock.Random.float(10, 100, 2, 2) },
            { itemName: '违约金', amount: billStatus === 2 ? Mock.Random.float(1, 50, 2, 2) : 0 },
          ],
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 36,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/payment/bill/unpaid',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: [
          {
            id: 1,
            billNo: 'B202412010001',
            householdId: 1,
            householdNo: 'W2024000001',
            householdName: '张三',
            serviceType: 'water',
            billingPeriod: '2024-12',
            totalAmount: 128.5,
            payableAmount: 128.5,
            paidAmount: 0,
            status: 0,
            billDate: '2024-12-01',
            dueDate: '2025-01-15',
            details: [
              { itemName: '基础水费', quantity: 25, unit: '吨', unitPrice: 3.5, amount: 87.5 },
              { itemName: '污水处理费', quantity: 25, unit: '吨', unitPrice: 0.9, amount: 22.5 },
              { itemName: '水资源费', amount: 18.5 },
            ],
          },
          {
            id: 2,
            billNo: 'B202412010002',
            householdId: 3,
            householdNo: 'G2024000003',
            householdName: '张三',
            serviceType: 'gas',
            billingPeriod: '2024-12',
            totalAmount: 86.2,
            payableAmount: 86.2,
            paidAmount: 0,
            status: 0,
            billDate: '2024-12-01',
            dueDate: '2025-01-15',
            details: [
              { itemName: '基础气费', quantity: 20, unit: '立方', unitPrice: 2.8, amount: 56 },
              { itemName: '燃气附加费', amount: 30.2 },
            ],
          },
        ],
      };
    },
  },
  {
    url: '/api/payment/create',
    method: 'post',
    response: ({ body }: any) => {
      const paymentNo = `P${Mock.Random.date('yyyyMMddHHmmss')}${Mock.Random.string('number', 4)}`;
      return {
        code: 0,
        message: 'success',
        data: {
          paymentNo,
          totalAmount: 214.7,
          payParams: {
            orderId: paymentNo,
            amount: 214.7,
          },
        },
      };
    },
  },
  {
    url: '/api/payment/query/:paymentNo',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: {
          status: 1,
          paymentNo: 'P202412011200001234',
        },
      };
    },
  },
  {
    url: '/api/payment/records',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, serviceType, status } = query;
      const types = serviceType ? [serviceType] : ['water', 'electricity', 'gas'];
      const methods = ['wechat', 'alipay', 'bank'];
      const list: any[] = [];

      for (let i = 0; i < pageSize; i++) {
        const type = types[i % types.length];
        const payStatus = status ? Number(status) : Mock.Random.pick([1, 2]);
        list.push({
          id: i + 1 + (page - 1) * pageSize,
          paymentNo: `P${Mock.Random.date('yyyyMMddHHmmss')}${Mock.Random.string('number', 4)}`,
          userId: 1,
          billIds: [Mock.Random.integer(1, 1000)],
          householdNos: [type === 'water' ? 'W2024000001' : type === 'electricity' ? 'E2024000002' : 'G2024000003'],
          serviceTypes: [type],
          totalAmount: Mock.Random.float(50, 500, 2, 2),
          payMethod: methods[i % methods.length],
          status: payStatus,
          payTime: payStatus === 1 ? Mock.Random.datetime() : null,
          thirdPartyNo: Mock.Random.string('number', 20),
          createTime: Mock.Random.datetime(),
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 58,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/payment/voucher/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query;
      const list: any[] = [];

      for (let i = 0; i < pageSize; i++) {
        list.push({
          id: i + 1 + (page - 1) * pageSize,
          voucherNo: `V${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 8)}`,
          paymentId: Mock.Random.integer(1, 10000),
          paymentNo: `P${Mock.Random.date('yyyyMMddHHmmss')}${Mock.Random.string('number', 4)}`,
          amount: Mock.Random.float(50, 500, 2, 2),
          fileUrl: '',
          createTime: Mock.Random.datetime(),
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 45,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/report/payment/statistics',
    method: 'get',
    response: ({ query }: any) => {
      const { type = 'month' } = query;
      const dailyTrend = [];
      const days = type === 'day' ? 7 : type === 'month' ? 30 : 12;

      for (let i = 0; i < days; i++) {
        dailyTrend.push({
          date: type === 'year' ? `${2024}-${String(i + 1).padStart(2, '0')}` : `12-${String(days - i).padStart(2, '0')}`,
          amount: Mock.Random.float(5000, 50000, 2, 2),
          count: Mock.Random.integer(50, 500),
        });
      }

      const waterAmount = Mock.Random.float(10000, 50000, 2, 2);
      const electricityAmount = Mock.Random.float(20000, 80000, 2, 2);
      const gasAmount = Mock.Random.float(10000, 30000, 2, 2);
      const totalAmount = waterAmount + electricityAmount + gasAmount;

      return {
        code: 0,
        message: 'success',
        data: {
          totalAmount,
          totalCount: Mock.Random.integer(500, 2000),
          waterAmount,
          waterCount: Mock.Random.integer(200, 800),
          electricityAmount,
          electricityCount: Mock.Random.integer(300, 1000),
          gasAmount,
          gasCount: Mock.Random.integer(100, 500),
          todayAmount: Mock.Random.float(1000, 10000, 2, 2),
          todayCount: Mock.Random.integer(10, 100),
          dailyTrend,
          typeRatio: [
            { type: 'water', typeName: '水费', amount: waterAmount, count: 300, ratio: Number((waterAmount / totalAmount * 100).toFixed(2)) },
            { type: 'electricity', typeName: '电费', amount: electricityAmount, count: 500, ratio: Number((electricityAmount / totalAmount * 100).toFixed(2)) },
            { type: 'gas', typeName: '燃气费', amount: gasAmount, count: 200, ratio: Number((gasAmount / totalAmount * 100).toFixed(2)) },
          ],
        },
      };
    },
  },
] as MockMethod[];
