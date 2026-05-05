import request from './axios';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post('/auth/login', data),
};

export const userApi = {
  getProfile: () => request.get('/auth/profile'),
  getMenus: () => request.get('/auth/menus'),
  getList: () => request.get('/users'),
  getById: (id: string) => request.get(`/users/${id}`),
  create: (data: any) => request.post('/users', data),
  update: (id: string, data: any) => request.patch(`/users/${id}`, data),
  delete: (id: string) => request.delete(`/users/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    request.post(`/users/${id}/reset-password`, { newPassword }),
  initAdmin: () => request.post('/users/init-admin'),
};

export const organizationApi = {
  getList: () => request.get('/organizations'),
  getTree: () => request.get('/organizations/tree'),
  getById: (id: string) => request.get(`/organizations/${id}`),
  create: (data: any) => request.post('/organizations', data),
  update: (id: string, data: any) => request.patch(`/organizations/${id}`, data),
  delete: (id: string) => request.delete(`/organizations/${id}`),
};

export const storeApi = {
  getList: () => request.get('/stores'),
  getByOrganization: (organizationId: string) =>
    request.get(`/stores/organization/${organizationId}`),
  getById: (id: string) => request.get(`/stores/${id}`),
  create: (data: any) => request.post('/stores', data),
  update: (id: string, data: any) => request.patch(`/stores/${id}`, data),
  delete: (id: string) => request.delete(`/stores/${id}`),
};

export const roleApi = {
  getList: () => request.get('/roles'),
  getById: (id: string) => request.get(`/roles/${id}`),
  create: (data: any) => request.post('/roles', data),
  update: (id: string, data: any) => request.patch(`/roles/${id}`, data),
  delete: (id: string) => request.delete(`/roles/${id}`),
  assignPermissions: (id: string, modulePermissions: any[]) =>
    request.post(`/roles/${id}/permissions`, { modulePermissions }),
  getPermissions: (id: string) => request.get(`/roles/${id}/permissions`),
  initDefaults: () => request.post('/roles/init-defaults'),
};

export const moduleApi = {
  getList: () => request.get('/modules'),
  getTree: (enabledOnly = true) => request.get(`/modules/tree?enabledOnly=${enabledOnly}`),
  getById: (id: string) => request.get(`/modules/${id}`),
  create: (data: any) => request.post('/modules', data),
  update: (id: string, data: any) => request.patch(`/modules/${id}`, data),
  delete: (id: string) => request.delete(`/modules/${id}`),
  initDefaults: () => request.post('/modules/init-defaults'),
};
