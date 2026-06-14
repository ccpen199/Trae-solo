import { http, HttpResponse } from 'msw';
import {
  mockSystemUsers,
  mockRoles,
  mockOperationLogs,
  successResponse,
  errorResponse,
  generateMockSystemUsers,
  generateMockOperationLogs,
} from '../data/mockData';
import type {
  SystemUser,
  SystemUserListParams,
  OperationLogListParams,
} from '../../api/system';

let users = [...mockSystemUsers];
let logs = [...mockOperationLogs];

const statusNames: Record<string, string> = {
  active: '正常',
  disabled: '禁用',
};

export const systemHandlers = [
  http.get('/api/system/user/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const username = url.searchParams.get('username') || '';
    const realName = url.searchParams.get('realName') || '';
    const roleId = url.searchParams.get('roleId') || '';
    const status = url.searchParams.get('status') || '';
    const department = url.searchParams.get('department') || '';

    let filtered = [...users];

    if (username) {
      filtered = filtered.filter((u) => u.username.includes(username));
    }
    if (realName) {
      filtered = filtered.filter((u) => u.realName.includes(realName));
    }
    if (roleId) {
      filtered = filtered.filter((u) => u.roleId === roleId);
    }
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }
    if (department) {
      filtered = filtered.filter((u) => u.department.includes(department));
    }

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(
      successResponse({
        list,
        total: filtered.length,
        page,
        pageSize,
      })
    );
  }),

  http.get('/api/system/user/:id', ({ params }) => {
    const { id } = params;
    const user = users.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(errorResponse(404, '用户不存在'));
    }

    return HttpResponse.json(successResponse(user));
  }),

  http.post('/api/system/user', async ({ request }) => {
    const body = await request.json();
    const role = mockRoles.find((r) => r.id === body.roleId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newUser: SystemUser = {
      id: String(users.length + 1),
      ...body,
      roleName: role?.name || '普通用户',
      statusName: statusNames[body.status],
      createdAt: now,
    };

    users.unshift(newUser);

    return HttpResponse.json(successResponse(newUser, '创建成功'));
  }),

  http.put('/api/system/user/:id', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();

    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '用户不存在'));
    }

    const role = body.roleId ? mockRoles.find((r) => r.id === body.roleId) : null;

    const updated = {
      ...users[index],
      ...body,
      roleName: role ? role.name : users[index].roleName,
      statusName: body.status ? statusNames[body.status] : users[index].statusName,
    };

    users[index] = updated;

    return HttpResponse.json(successResponse(updated, '更新成功'));
  }),

  http.delete('/api/system/user/:id', ({ params }) => {
    const { id } = params;
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '用户不存在'));
    }

    users.splice(index, 1);

    return HttpResponse.json(successResponse(null, '删除成功'));
  }),

  http.put('/api/system/user/:id/reset-password', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const { newPassword } = body as { newPassword: string };

    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '用户不存在'));
    }

    return HttpResponse.json(successResponse(null, '密码重置成功'));
  }),

  http.get('/api/system/role/list', () => {
    return HttpResponse.json(successResponse(mockRoles));
  }),

  http.get('/api/system/role/:id', ({ params }) => {
    const { id } = params;
    const role = mockRoles.find((r) => r.id === id);

    if (!role) {
      return HttpResponse.json(errorResponse(404, '角色不存在'));
    }

    return HttpResponse.json(successResponse(role));
  }),

  http.post('/api/system/role', async ({ request }) => {
    const body = await request.json();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRole = {
      id: String(mockRoles.length + 1),
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    return HttpResponse.json(successResponse(newRole, '创建成功'));
  }),

  http.put('/api/system/role/:id', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const index = mockRoles.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '角色不存在'));
    }

    const updated = {
      ...mockRoles[index],
      ...body,
      updatedAt: now,
    };

    mockRoles[index] = updated;

    return HttpResponse.json(successResponse(updated, '更新成功'));
  }),

  http.delete('/api/system/role/:id', ({ params }) => {
    const { id } = params;
    const index = mockRoles.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '角色不存在'));
    }

    mockRoles.splice(index, 1);

    return HttpResponse.json(successResponse(null, '删除成功'));
  }),

  http.get('/api/system/log/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const userId = url.searchParams.get('userId') || '';
    const module = url.searchParams.get('module') || '';
    const operation = url.searchParams.get('operation') || '';
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    let filtered = [...logs];

    if (userId) {
      filtered = filtered.filter((l) => l.userId === userId);
    }
    if (module) {
      filtered = filtered.filter((l) => l.module === module);
    }
    if (operation) {
      filtered = filtered.filter((l) => l.operation === operation);
    }
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }
    if (startDate) {
      filtered = filtered.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((l) => l.createdAt <= endDate + ' 23:59:59');
    }

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(
      successResponse({
        list,
        total: filtered.length,
        page,
        pageSize,
      })
    );
  }),

  http.get('/api/system/log/:id', ({ params }) => {
    const { id } = params;
    const log = logs.find((l) => l.id === id);

    if (!log) {
      return HttpResponse.json(errorResponse(404, '日志不存在'));
    }

    return HttpResponse.json(successResponse(log));
  }),

  http.get('/api/system/statistics', () => {
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      totalRoles: mockRoles.length,
      totalLogs: logs.length,
      todayLogs: logs.filter(
        (l) => l.createdAt.startsWith(new Date().toISOString().split('T')[0])
      ).length,
    };

    return HttpResponse.json(successResponse(stats));
  }),
];
