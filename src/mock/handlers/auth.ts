import { http, HttpResponse } from 'msw';
import { successResponse, errorResponse, delay } from '../utils';
import type { LoginRequest, User, UserRole } from '@/types/auth';

interface DemoAccount {
  account: string;
  phone: string;
  password: string;
  role: UserRole;
  user: User;
  description: string;
}

const demoUsers: Record<UserRole, User> = {
  owner: {
    id: 'owner_001',
    role: 'owner',
    phone: '13800138000',
    nickname: '张小花的铲屎官',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner001',
    createdAt: '2024-01-15T08:00:00Z',
  },
  store_admin: {
    id: 'store_001',
    role: 'store_admin',
    phone: '13900139000',
    nickname: '爱宠屋店长',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=store001',
    storeId: 'store_001',
    createdAt: '2023-06-01T08:00:00Z',
  },
  store_staff: {
    id: 'staff_001',
    role: 'store_staff',
    phone: '13500135000',
    nickname: '美容师小王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff001',
    storeId: 'store_001',
    createdAt: '2023-09-01T08:00:00Z',
  },
  store_manager: {
    id: 'mgr_001',
    role: 'store_manager',
    phone: '13400134000',
    nickname: '店长老李',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mgr001',
    storeId: 'store_001',
    createdAt: '2023-03-01T08:00:00Z',
  },
  veterinarian: {
    id: 'vet_001',
    role: 'veterinarian',
    phone: '13700137000',
    nickname: '李兽医',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vet001',
    veterinarianId: 'vet_001',
    licenseNo: 'VET20230001',
    createdAt: '2023-01-01T08:00:00Z',
  },
  operator: {
    id: 'op_001',
    role: 'operator',
    phone: '13600136000',
    nickname: '平台管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=op001',
    createdAt: '2023-01-01T08:00:00Z',
  },
};

export const demoAccounts: DemoAccount[] = [
  { account: 'owner', phone: '13800138000', password: '123456', role: 'owner', user: demoUsers.owner, description: '宠主 - 预约服务、管理宠物档案' },
  { account: 'admin', phone: '13900139000', password: '123456', role: 'store_admin', user: demoUsers.store_admin, description: '门店管理员 - 排班、库存、运营' },
  { account: 'staff', phone: '13500135000', password: '123456', role: 'store_staff', user: demoUsers.store_staff, description: '门店员工 - 服务执行、SOP流程' },
  { account: 'vet', phone: '13700137000', password: '123456', role: 'veterinarian', user: demoUsers.veterinarian, description: '执业兽医 - 审方、病历管理' },
  { account: 'platform', phone: '13400134000', password: '123456', role: 'store_manager', user: demoUsers.store_manager, description: '门店店长 - 排班调度、业绩查看' },
  { account: 'ops', phone: '13600136000', password: '123456', role: 'operator', user: demoUsers.operator, description: '平台运营 - 全局数据、知识图谱' },
];

const VALID_ROLES: UserRole[] = ['owner', 'store_admin', 'store_staff', 'store_manager', 'veterinarian', 'operator'];
const DEFAULT_PASSWORD = '123456';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(600);
    try {
      const body = (await request.json()) as LoginRequest;
      const { phone, password, smsCode, role } = body;

      if (!role || !VALID_ROLES.includes(role)) {
        return HttpResponse.json(
          errorResponse('请选择登录身份（宠主/门店/兽医）', 1001),
          { status: 400 }
        );
      }

      if (!phone || phone.trim() === '') {
        return HttpResponse.json(
          errorResponse('请输入手机号或账号', 1002),
          { status: 400 }
        );
      }

      const input = phone.trim().toLowerCase();
      const matchedByAccount = demoAccounts.find(
        (acc) => acc.account === input || acc.phone === input
      );

      let matchedAccount: DemoAccount | null = null;

      if (matchedByAccount) {
        if (matchedByAccount.role !== role && role !== 'operator') {
          const correctRoleAccount = demoAccounts.find(
            (acc) => (acc.account === input || acc.phone === input) && acc.role === role
          );
          if (!correctRoleAccount) {
            return HttpResponse.json(
              errorResponse(`该账号无法以「${getRoleLabel(role)}」身份登录，请选择正确的身份或使用对应账号`, 1003),
              { status: 401 }
            );
          }
          matchedAccount = correctRoleAccount;
        } else {
          matchedAccount = matchedByAccount;
        }
      }

      if (!matchedAccount) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          return HttpResponse.json(
            errorResponse('账号不存在，请使用下方演示账号登录', 1004),
            { status: 401 }
          );
        }

        if (smsCode && smsCode !== '123456') {
          return HttpResponse.json(
            errorResponse('验证码错误，演示验证码为 123456', 1005),
            { status: 401 }
          );
        }

        if (password && password !== DEFAULT_PASSWORD) {
          return HttpResponse.json(
            errorResponse(`密码错误，演示账号密码为「${DEFAULT_PASSWORD}」`, 1006),
            { status: 401 }
          );
        }

        matchedAccount = {
          account: phone,
          phone,
          password: DEFAULT_PASSWORD,
          role,
          user: {
            ...demoUsers[role],
            id: `user_${Date.now()}`,
            phone,
            nickname: `用户${phone.slice(-4)}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
          },
          description: '新用户',
        };
      }

      if (password && password !== matchedAccount.password && password !== DEFAULT_PASSWORD) {
        return HttpResponse.json(
          errorResponse(`密码错误，演示账号密码为「${DEFAULT_PASSWORD}」`, 1007),
          { status: 401 }
        );
      }

      if (smsCode && smsCode !== '123456') {
        return HttpResponse.json(
          errorResponse('验证码错误，演示验证码为 123456', 1008),
          { status: 401 }
        );
      }

      const token = `token_${matchedAccount.role}_${Date.now()}`;
      localStorage.setItem('auth_token', token);

      return HttpResponse.json(
        successResponse(
          {
            token,
            user: matchedAccount.user,
            redirectPath: getRoleRedirectPath(matchedAccount.role),
            welcomeMessage: `欢迎回来，${matchedAccount.user.nickname}！正在进入${getRoleLabel(matchedAccount.role)}工作台...`,
          },
          '登录成功'
        )
      );
    } catch (e) {
      console.error('Login handler error:', e);
      return HttpResponse.json(
        errorResponse('登录服务异常，请稍后重试', 500),
        { status: 500 }
      );
    }
  }),

  http.post('/api/auth/sms', async () => {
    await delay(400);
    return HttpResponse.json(
      successResponse(
        { success: true, demoCode: '123456' },
        '验证码已发送，演示验证码为 123456'
      )
    );
  }),

  http.post('/api/auth/logout', async () => {
    await delay(200);
    localStorage.removeItem('auth_token');
    return HttpResponse.json(successResponse(null, '已退出登录'));
  }),

  http.get('/api/auth/me', async () => {
    await delay(300);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return HttpResponse.json(errorResponse('未登录', 401), { status: 401 });
    }

    const role = (token.split('_')[1] as UserRole) || 'owner';
    const user = demoUsers[role] || demoUsers.owner;

    return HttpResponse.json(successResponse(user));
  }),

  http.get('/api/auth/demo-accounts', async () => {
    await delay(100);
    return HttpResponse.json(
      successResponse(
        demoAccounts.map((acc) => ({
          account: acc.account,
          password: acc.password,
          role: acc.role,
          roleLabel: getRoleLabel(acc.role),
          description: acc.description,
        }))
      )
    );
  }),
];

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: '宠主端',
    store_admin: '门店管理员',
    store_staff: '门店员工',
    store_manager: '门店店长',
    veterinarian: '执业兽医',
    operator: '平台运营',
  };
  return labels[role] || role;
}

function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'owner':
      return '/owner';
    case 'store_admin':
    case 'store_staff':
    case 'store_manager':
    case 'veterinarian':
    case 'operator':
      return '/store';
    default:
      return '/owner';
  }
}

export { getRoleLabel, getRoleRedirectPath };
