import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const safeParam = (params: any, key: string, defaultValue: any = 0) => {
  return params?.[key] !== undefined ? params[key] : defaultValue;
};

export default [
  {
    url: '/api/admin/login',
    method: 'post',
    response: ({ body }: any) => {
      const { username } = body;
      const roleMap: Record<string, { roleId: number; roleName: string }> = {
        admin: { roleId: 1, roleName: '系统管理员' },
        operator: { roleId: 2, roleName: '运营管理员' },
        supervisor: { roleId: 3, roleName: '客服主管' },
        service: { roleId: 4, roleName: '客服人员' },
        finance: { roleId: 5, roleName: '财务人员' },
      };
      const role = roleMap[username] || { roleId: 4, roleName: '客服人员' };

      return {
        code: 0,
        message: 'success',
        data: {
          token: 'mock_admin_token_' + Mock.Random.string(32),
          userInfo: {
            id: 1,
            username,
            realName: Mock.Random.cname(),
            roleId: role.roleId,
            roleName: role.roleName,
            status: 1,
            createTime: Mock.Random.datetime(),
          },
        },
      };
    },
  },
  {
    url: '/api/admin/info',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: {
          id: 1,
          username: 'admin',
          realName: '系统管理员',
          roleId: 1,
          roleName: '系统管理员',
          status: 1,
          createTime: '2024-01-01 00:00:00',
        },
      };
    },
  },
  {
    url: '/api/admin/user/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, keyword, userType, status } = query;
      const list: any[] = [];

      for (let i = 0; i < pageSize; i++) {
        list.push({
          id: i + 1 + (page - 1) * pageSize,
          phone: '138' + Mock.Random.string('number', 8),
          nickname: Mock.Random.cname(),
          avatar: '',
          userType: userType ? Number(userType) : Mock.Random.pick([1, 2]),
          realNameStatus: Mock.Random.pick([0, 1, 2]),
          realName: Mock.Random.cname(),
          householdCount: Mock.Random.integer(1, 5),
          totalPayment: Mock.Random.float(100, 10000, 2, 2),
          status: status !== undefined ? Number(status) : Mock.Random.pick([0, 1]),
          createTime: Mock.Random.datetime(),
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 586,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/admin/user/:id',
    method: 'get',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      return {
        code: 0,
        message: 'success',
        data: {
          id,
          phone: '138' + Mock.Random.string('number', 8),
          nickname: Mock.Random.cname(),
          realName: Mock.Random.cname(),
          idCard: '510104' + Mock.Random.string('number', 12),
          userType: 1,
          realNameStatus: 1,
          createTime: Mock.Random.datetime(),
          households: [
            {
              id: 1,
              householdNo: 'W2024000001',
              householdName: '张三',
              serviceType: 'water',
              address: '四川省成都市锦江区春熙路88号',
              isDefault: 1,
              createTime: '2024-01-01',
            },
            {
              id: 2,
              householdNo: 'E2024000002',
              householdName: '张三',
              serviceType: 'electricity',
              address: '四川省成都市锦江区春熙路88号',
              isDefault: 0,
              createTime: '2024-01-05',
            },
          ],
          recentPayments: [
            {
              id: 1,
              paymentNo: 'P202412011200001234',
              totalAmount: 214.7,
              payMethod: 'wechat',
              status: 1,
              payTime: '2024-12-01 12:30:00',
            },
          ],
        },
      };
    },
  },
  {
    url: '/api/admin/user/status/:id',
    method: 'put',
    response: () => {
      return {
        code: 0,
        message: '状态更新成功',
      };
    },
  },
  {
    url: '/api/admin/role/list',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: [
          {
            id: 1,
            roleName: '系统管理员',
            description: '拥有系统所有权限',
            permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            createTime: '2024-01-01 00:00:00',
          },
          {
            id: 2,
            roleName: '运营管理员',
            description: '负责公告管理、报表统计',
            permissionIds: [1, 2, 3, 4],
            createTime: '2024-01-01 00:00:00',
          },
          {
            id: 3,
            roleName: '客服主管',
            description: '负责工单审核、公告审核',
            permissionIds: [1, 2, 5, 6],
            createTime: '2024-01-01 00:00:00',
          },
          {
            id: 4,
            roleName: '客服人员',
            description: '负责工单处理、用户咨询',
            permissionIds: [1, 5],
            createTime: '2024-01-01 00:00:00',
          },
          {
            id: 5,
            roleName: '财务人员',
            description: '负责对账、凭证管理',
            permissionIds: [1, 3],
            createTime: '2024-01-01 00:00:00',
          },
        ],
      };
    },
  },
  {
    url: '/api/admin/permission/tree',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: [
          {
            id: 1,
            permissionKey: 'dashboard',
            permissionName: '工作台',
            type: 'menu',
            parentId: 0,
            icon: 'DashboardOutlined',
            sort: 1,
            children: [],
          },
          {
            id: 2,
            permissionKey: 'announcement',
            permissionName: '公告管理',
            type: 'menu',
            parentId: 0,
            icon: 'NotificationOutlined',
            sort: 2,
            children: [
              { id: 21, permissionKey: 'announcement:list', permissionName: '公告列表', type: 'menu', parentId: 2, sort: 1 },
              { id: 22, permissionKey: 'announcement:create', permissionName: '新建公告', type: 'button', parentId: 2, sort: 2 },
              { id: 23, permissionKey: 'announcement:audit', permissionName: '公告审核', type: 'button', parentId: 2, sort: 3 },
            ],
          },
          {
            id: 3,
            permissionKey: 'payment',
            permissionName: '缴费管理',
            type: 'menu',
            parentId: 0,
            icon: 'PayCircleOutlined',
            sort: 3,
            children: [
              { id: 31, permissionKey: 'payment:list', permissionName: '缴费记录', type: 'menu', parentId: 3, sort: 1 },
              { id: 32, permissionKey: 'payment:reconciliation', permissionName: '对账报表', type: 'menu', parentId: 3, sort: 2 },
              { id: 33, permissionKey: 'payment:export', permissionName: '导出报表', type: 'button', parentId: 3, sort: 3 },
            ],
          },
          {
            id: 4,
            permissionKey: 'workOrder',
            permissionName: '工单管理',
            type: 'menu',
            parentId: 0,
            icon: 'FileTextOutlined',
            sort: 4,
            children: [
              { id: 41, permissionKey: 'workOrder:list', permissionName: '工单列表', type: 'menu', parentId: 4, sort: 1 },
              { id: 42, permissionKey: 'workOrder:assign', permissionName: '工单分派', type: 'button', parentId: 4, sort: 2 },
              { id: 43, permissionKey: 'workOrder:process', permissionName: '工单处理', type: 'button', parentId: 4, sort: 3 },
            ],
          },
          {
            id: 5,
            permissionKey: 'user',
            permissionName: '用户管理',
            type: 'menu',
            parentId: 0,
            icon: 'UserOutlined',
            sort: 5,
            children: [
              { id: 51, permissionKey: 'user:list', permissionName: '用户列表', type: 'menu', parentId: 5, sort: 1 },
              { id: 52, permissionKey: 'user:detail', permissionName: '用户详情', type: 'button', parentId: 5, sort: 2 },
            ],
          },
          {
            id: 6,
            permissionKey: 'system',
            permissionName: '系统设置',
            type: 'menu',
            parentId: 0,
            icon: 'SettingOutlined',
            sort: 10,
            children: [
              { id: 61, permissionKey: 'system:roles', permissionName: '角色权限', type: 'menu', parentId: 6, sort: 1 },
              { id: 62, permissionKey: 'system:regulatory', permissionName: '监管接口', type: 'menu', parentId: 6, sort: 2 },
              { id: 63, permissionKey: 'system:audit', permissionName: '审计日志', type: 'menu', parentId: 6, sort: 3 },
            ],
          },
        ],
      };
    },
  },
  {
    url: '/api/admin/regulatory/config',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: {
          platformName: '四川省能源监管平台',
          apiUrl: 'https://regulatory.sc.gov.cn/api',
          appId: 'SC_AIZHONG_001',
          appSecret: '',
          dataSyncEnabled: true,
          autoSyncInterval: 60,
          lastSyncTime: '2024-12-01 12:00:00',
          lastSyncStatus: 1,
        },
      };
    },
  },
  {
    url: '/api/admin/regulatory/config',
    method: 'put',
    response: () => {
      return {
        code: 0,
        message: '配置更新成功',
      };
    },
  },
  {
    url: '/api/admin/regulatory/sync',
    method: 'post',
    response: () => {
      return {
        code: 0,
        message: '同步任务已启动',
        data: {
          syncId: 'SYNC' + Mock.Random.string('number', 12),
        },
      };
    },
  },
  {
    url: '/api/admin/regulatory/sync-records',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query;
      const list: any[] = [];
      const types = ['payment', 'user', 'bill', 'voucher'];
      const typeNames: Record<string, string> = {
        payment: '缴费数据',
        user: '用户数据',
        bill: '账单数据',
        voucher: '凭证数据',
      };

      for (let i = 0; i < pageSize; i++) {
        const type = types[i % 4];
        list.push({
          id: i + 1,
          syncId: 'SYNC' + Mock.Random.string('number', 12),
          type,
          typeName: typeNames[type],
          status: Mock.Random.pick([0, 1, 2]),
          recordCount: Mock.Random.integer(100, 5000),
          successCount: Mock.Random.integer(100, 5000),
          failCount: Mock.Random.integer(0, 10),
          startTime: Mock.Random.datetime(),
          endTime: Mock.Random.datetime(),
          operator: Mock.Random.cname(),
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 156,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/admin/audit-logs',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query;
      const list: any[] = [];
      const modules = ['用户管理', '公告管理', '工单管理', '缴费管理', '系统设置'];
      const actions = ['创建', '修改', '删除', '审核', '导出', '登录', '退出'];

      for (let i = 0; i < pageSize; i++) {
        list.push({
          id: i + 1,
          module: modules[i % 5],
          action: actions[i % 7],
          content: Mock.Random.csentence(10, 20),
          operator: Mock.Random.cname(),
          ip: Mock.Random.ip(),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createTime: Mock.Random.datetime(),
        });
      }

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: 2580,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
] as MockMethod[];
