const rolePermissions = {
  platform_engineer: {
    application: ['create', 'read', 'update', 'delete'],
    environment: ['create', 'read', 'update', 'delete'],
    strategy: ['create', 'read', 'update', 'delete', 'approve'],
    task: ['create', 'read', 'execute', 'cancel'],
    change_order: ['create', 'read', 'approve', 'execute'],
    audit: ['read', 'export'],
    report: ['export'],
    user: ['manage'],
    exception: ['handle'],
    alert: ['acknowledge', 'resolve']
  },
  ops: {
    application: ['read'],
    environment: ['read', 'update'],
    strategy: ['read', 'update'],
    task: ['create', 'read', 'execute', 'cancel'],
    change_order: ['create', 'read', 'execute'],
    audit: ['read'],
    report: ['export'],
    exception: ['handle'],
    alert: ['acknowledge', 'resolve']
  },
  developer: {
    application: ['read'],
    environment: ['read'],
    strategy: ['read'],
    task: ['read', 'create'],
    change_order: ['read', 'create']
  },
  app_owner: {
    application: ['read', 'update'],
    environment: ['read'],
    strategy: ['read', 'approve'],
    task: ['read'],
    change_order: ['read', 'approve'],
    audit: ['read']
  },
  security_admin: {
    application: ['read'],
    environment: ['read'],
    strategy: ['read'],
    task: ['read'],
    change_order: ['read'],
    audit: ['read', 'export'],
    report: ['export'],
    key: ['manage'],
    user: ['read'],
    permission: ['manage']
  }
};

export const hasPermission = (role, resource, action) => {
  if (!role || !rolePermissions[role]) return false;
  const permissions = rolePermissions[role][resource];
  return permissions ? permissions.includes(action) : false;
};

export const canCreate = (role, resource) => hasPermission(role, resource, 'create');
export const canRead = (role, resource) => hasPermission(role, resource, 'read');
export const canUpdate = (role, resource) => hasPermission(role, resource, 'update');
export const canDelete = (role, resource) => hasPermission(role, resource, 'delete');
export const canApprove = (role, resource) => hasPermission(role, resource, 'approve');
export const canExecute = (role, resource) => hasPermission(role, resource, 'execute');
export const canExport = (role, resource) => hasPermission(role, resource, 'export');
export const canHandle = (role, resource) => hasPermission(role, resource, 'handle');

export const getCurrentRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.role;
};
