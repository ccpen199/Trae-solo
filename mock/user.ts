import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const users: any[] = [];
let userSeq = 1;

export default [
  {
    url: '/api/user/login',
    method: 'post',
    response: ({ body }: any) => {
      const { phone } = body;
      const user = {
        id: userSeq++,
        phone,
        nickname: '用户' + phone.slice(-4),
        avatar: '',
        userType: 1,
        realNameStatus: 1,
        realName: '张三',
        createTime: Mock.mock('@datetime'),
      };
      users.push(user);
      return {
        code: 0,
        message: 'success',
        data: {
          token: 'mock_token_' + Mock.mock('@string(32)'),
          userInfo: user,
        },
      };
    },
  },
  {
    url: '/api/user/register',
    method: 'post',
    response: ({ body }: any) => {
      const user = {
        id: userSeq++,
        phone: body.phone,
        nickname: '用户' + body.phone.slice(-4),
        avatar: '',
        userType: body.userType || 1,
        realNameStatus: 0,
        createTime: Mock.mock('@datetime'),
      };
      users.push(user);
      return {
        code: 0,
        message: 'success',
        data: {
          token: 'mock_token_' + Mock.mock('@string(32)'),
          userInfo: user,
        },
      };
    },
  },
  {
    url: '/api/user/info',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: {
          id: 1,
          phone: '13800138000',
          nickname: '爱众用户',
          avatar: '',
          userType: 1,
          realNameStatus: 1,
          realName: '张三',
          idCard: '510104199001011234',
          createTime: '2024-01-01 12:00:00',
        },
      };
    },
  },
  {
    url: '/api/user/real-name',
    method: 'post',
    response: ({ body }: any) => {
      return {
        code: 0,
        message: '认证成功',
        data: {
          realNameStatus: 1,
          realName: body.realName,
        },
      };
    },
  },
  {
    url: '/api/user/sms-code',
    method: 'post',
    response: () => {
      return {
        code: 0,
        message: '验证码已发送',
        data: null,
      };
    },
  },
  {
    url: '/api/user/household/list',
    method: 'get',
    response: () => {
      const households = [
        {
          id: 1,
          userId: 1,
          householdNo: 'W2024000001',
          householdName: '张三',
          serviceType: 'water',
          address: '四川省成都市锦江区春熙路88号1栋1单元101号',
          areaCode: '510104',
          areaName: '锦江区',
          isDefault: 1,
          createTime: '2024-01-01',
          arrearsAmount: 128.5,
        },
        {
          id: 2,
          userId: 1,
          householdNo: 'E2024000002',
          householdName: '张三',
          serviceType: 'electricity',
          address: '四川省成都市锦江区春熙路88号1栋1单元101号',
          areaCode: '510104',
          areaName: '锦江区',
          isDefault: 0,
          createTime: '2024-01-05',
          arrearsAmount: 0,
        },
        {
          id: 3,
          userId: 1,
          householdNo: 'G2024000003',
          householdName: '张三',
          serviceType: 'gas',
          address: '四川省成都市锦江区春熙路88号1栋1单元101号',
          areaCode: '510104',
          areaName: '锦江区',
          isDefault: 0,
          createTime: '2024-01-10',
          arrearsAmount: 86.2,
        },
      ];
      return {
        code: 0,
        message: 'success',
        data: households,
      };
    },
  },
  {
    url: '/api/user/household/bind',
    method: 'post',
    response: ({ body }: any) => {
      return {
        code: 0,
        message: '绑定成功',
        data: {
          id: Date.now(),
          userId: 1,
          householdNo: body.householdNo,
          householdName: body.householdName,
          serviceType: body.serviceType,
          address: '四川省成都市武侯区人民南路四段1号',
          areaCode: '510107',
          areaName: '武侯区',
          isDefault: 0,
          createTime: Mock.mock('@datetime'),
          arrearsAmount: Mock.Random.float(0, 300, 2, 2),
        },
      };
    },
  },
  {
    url: '/api/user/household/:id',
    method: 'delete',
    response: () => {
      return {
        code: 0,
        message: '解绑成功',
        data: null,
      };
    },
  },
  {
    url: '/api/user/household/default/:id',
    method: 'put',
    response: () => {
      return {
        code: 0,
        message: '设置成功',
        data: null,
      };
    },
  },
] as MockMethod[];
