import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const safeParam = (params: any, key: string, defaultValue: any = 0) => {
  return params?.[key] !== undefined ? params[key] : defaultValue;
};

const workOrders: any[] = [];
const typeMap: Record<string, string> = {
  consultation: '咨询',
  complaint: '投诉',
  suggestion: '建议',
  repair: '报修',
  other: '其他',
};

for (let i = 0; i < 30; i++) {
  const types = Object.keys(typeMap);
  const type = types[i % types.length];
  workOrders.push({
    id: i + 1,
    orderNo: `WO202412${String(i + 1).padStart(6, '0')}`,
    userId: 1,
    userName: Mock.Random.cname(),
    userPhone: /^1[3-9]\d{9}$/,
    type,
    typeName: typeMap[type],
    title: `${typeMap[type]} - ${Mock.Random.csentence(5, 15)}`,
    content: Mock.Random.cparagraph(2, 4),
    images: [],
    status: [0, 1, 2, 3, 4][i % 5],
    priority: i % 3,
    assigneeId: i % 10 + 1,
    assigneeName: Mock.Random.cname(),
    createTime: Mock.Random.datetime(),
    updateTime: Mock.Random.datetime(),
  });
}

export default [
  {
    url: '/api/work-order/create',
    method: 'post',
    response: ({ body }: any) => {
      const newOrder = {
        id: workOrders.length + 1,
        orderNo: `WO${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 6)}`,
        userId: 1,
        userName: '张三',
        userPhone: '13800138000',
        ...body,
        typeName: typeMap[body.type] || '其他',
        status: 0,
        priority: 0,
        createTime: Mock.Random.datetime(),
        updateTime: Mock.Random.datetime(),
      };
      workOrders.unshift(newOrder);
      return {
        code: 0,
        message: '提交成功',
        data: newOrder,
      };
    },
  },
  {
    url: '/api/work-order/my-list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, status, type } = query;
      let filtered = [...workOrders];

      if (status !== undefined) {
        filtered = filtered.filter((o) => o.status === Number(status));
      }
      if (type) {
        filtered = filtered.filter((o) => o.type === type);
      }

      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: filtered.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/admin/work-order/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, status, type, keyword } = query;
      let filtered = [...workOrders];

      if (status !== undefined) {
        filtered = filtered.filter((o) => o.status === Number(status));
      }
      if (type) {
        filtered = filtered.filter((o) => o.type === type);
      }
      if (keyword) {
        filtered = filtered.filter(
          (o) => o.title.includes(keyword) || o.orderNo.includes(keyword) || o.userName.includes(keyword)
        );
      }

      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: filtered.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/work-order/:id',
    method: 'get',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const order = workOrders.find((o) => o.id === id);
      return {
        code: 0,
        message: 'success',
        data: order || workOrders[0],
      };
    },
  },
  {
    url: '/api/work-order/:id/logs',
    method: 'get',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const logs = [
        {
          id: 1,
          orderId: id,
          action: 'create',
          content: '用户提交工单',
          operatorId: 1,
          operatorName: '张三',
          createTime: '2024-12-01 10:00:00',
        },
        {
          id: 2,
          orderId: id,
          action: 'accept',
          content: '客服人员已受理工单',
          operatorId: 2,
          operatorName: '李客服',
          createTime: '2024-12-01 10:30:00',
        },
        {
          id: 3,
          orderId: id,
          action: 'assign',
          content: '已分派给维修部门处理',
          operatorId: 2,
          operatorName: '李客服',
          createTime: '2024-12-01 11:00:00',
        },
        {
          id: 4,
          orderId: id,
          action: 'process',
          content: '维修人员已到达现场，正在处理中',
          operatorId: 3,
          operatorName: '王师傅',
          createTime: '2024-12-01 14:00:00',
        },
      ];
      return {
        code: 0,
        message: 'success',
        data: logs,
      };
    },
  },
  {
    url: '/api/admin/work-order/assign/:id',
    method: 'post',
    response: ({ params, body }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = workOrders.findIndex((o) => o.id === id);
      if (index > -1) {
        workOrders[index].status = 1;
        workOrders[index].assigneeId = body.assigneeId;
        workOrders[index].assigneeName = '工作人员';
        workOrders[index].updateTime = Mock.Random.datetime();
      }
      return {
        code: 0,
        message: '分派成功',
      };
    },
  },
  {
    url: '/api/admin/work-order/process/:id',
    method: 'post',
    response: () => {
      return {
        code: 0,
        message: '处理成功',
      };
    },
  },
  {
    url: '/api/work-order/confirm/:id',
    method: 'post',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = workOrders.findIndex((o) => o.id === id);
      if (index > -1) {
        workOrders[index].status = 3;
        workOrders[index].updateTime = Mock.Random.datetime();
      }
      return {
        code: 0,
        message: '确认完成',
      };
    },
  },
] as MockMethod[];
