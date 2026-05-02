const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');

const getUserRoles = (userId) => {
  return query(`
    SELECT r.*, ur.assigned_at, ur.assigned_by
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `, [userId]);
};

const getRolePermissions = (roleId) => {
  return query(`
    SELECT p.*
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `, [roleId]);
};

const getUserPermissions = (userId) => {
  const roles = getUserRoles(userId);
  const permissionCodes = new Set();
  const permissions = [];

  roles.forEach(role => {
    const rolePerms = getRolePermissions(role.id);
    rolePerms.forEach(perm => {
      if (!permissionCodes.has(perm.code)) {
        permissionCodes.add(perm.code);
        permissions.push(perm);
      }
    });
  });

  return {
    roles,
    permissionCodes: Array.from(permissionCodes),
    permissions
  };
};

const resourceTypeAlias = {
  'organization': 'org',
  'application': 'app',
  'role': 'role',
  'user': 'user',
  'audit': 'audit',
  'monitor': 'monitor',
  'resource': 'resource',
  'sensitive': 'sensitive'
};

const checkRBAC = (userId, resourceType, action) => {
  const userAuth = getUserPermissions(userId);
  const alias = resourceTypeAlias[resourceType] || resourceType;
  const requiredCode = `${alias}:${action}`;
  
  const hasPermission = userAuth.permissionCodes.includes(requiredCode);
  
  return {
    allowed: hasPermission,
    reason: hasPermission ? 'RBAC 权限匹配' : 'RBAC 权限不足',
    userPermissions: userAuth.permissionCodes
  };
};

const evaluateABACPolicy = (policy, context) => {
  try {
    const conditions = JSON.parse(policy.conditions);
    let matched = true;

    if (conditions.userRoles) {
      const userRoles = context.user?.roles || [];
      const hasRequiredRole = conditions.userRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) matched = false;
    }

    if (conditions.organization) {
      if (conditions.organization.ids) {
        const userOrgId = context.user?.organizationId;
        if (!conditions.organization.ids.includes(userOrgId)) matched = false;
      }
      if (conditions.organization.types) {
        const userOrgType = context.user?.organizationType;
        if (!conditions.organization.types.includes(userOrgType)) matched = false;
      }
    }

    if (conditions.timeWindow) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();

      if (conditions.timeWindow.hours) {
        if (currentHour < conditions.timeWindow.hours.start || 
            currentHour >= conditions.timeWindow.hours.end) {
          matched = false;
        }
      }

      if (conditions.timeWindow.days) {
        if (!conditions.timeWindow.days.includes(currentDay)) {
          matched = false;
        }
      }
    }

    if (conditions.ipRange) {
      const clientIp = context.ipAddress;
      if (clientIp && conditions.ipRange.allow) {
        const inRange = conditions.ipRange.allow.some(range => {
          if (range.includes('/')) {
            return clientIp.startsWith(range.split('/')[0]);
          }
          return clientIp === range;
        });
        if (!inRange) matched = false;
      }
      if (clientIp && conditions.ipRange.deny) {
        const inDeny = conditions.ipRange.deny.some(range => {
          if (range.includes('/')) {
            return clientIp.startsWith(range.split('/')[0]);
          }
          return clientIp === range;
        });
        if (inDeny) matched = false;
      }
    }

    if (conditions.environment) {
      const deviceType = context.deviceType || 'desktop';
      if (conditions.environment.deviceTypes) {
        if (!conditions.environment.deviceTypes.includes(deviceType)) {
          matched = false;
        }
      }
    }

    if (conditions.attributes) {
      const userAttrs = context.user?.attributes || {};
      for (const [key, value] of Object.entries(conditions.attributes)) {
        if (userAttrs[key] !== value) {
          matched = false;
          break;
        }
      }
    }

    return matched;
  } catch (error) {
    console.error('[ABAC Engine] 策略评估错误:', error);
    return false;
  }
};

const checkABAC = (userId, resourceType, action, context = {}) => {
  const policies = query(`
    SELECT * FROM abac_policies 
    WHERE status = 'active'
    AND (resource_type = ? OR resource_type IS NULL)
    AND (action = ? OR action IS NULL)
    ORDER BY priority DESC
  `, [resourceType, action]);

  if (policies.length === 0) {
    return {
      allowed: false,
      reason: '无匹配的 ABAC 策略',
      policies: []
    };
  }

  const user = query(`
    SELECT u.*, o.name as organization_name, o.type as organization_type
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.id = ?
  `, [userId])[0];

  const userRoles = getUserRoles(userId).map(r => r.name);

  const evalContext = {
    ...context,
    user: {
      id: userId,
      roles: userRoles,
      organizationId: user?.organization_id,
      organizationType: user?.organization_type,
      attributes: {
        status: user?.status
      }
    }
  };

  let finalDecision = null;
  const matchedPolicies = [];

  for (const policy of policies) {
    const matched = evaluateABACPolicy(policy, evalContext);
    if (matched) {
      matchedPolicies.push({
        id: policy.id,
        name: policy.name,
        effect: policy.effect,
        priority: policy.priority
      });

      if (policy.effect === 'deny') {
        finalDecision = false;
        break;
      } else if (policy.effect === 'allow' && finalDecision === null) {
        finalDecision = true;
      }
    }
  }

  return {
    allowed: finalDecision === true,
    reason: finalDecision === true 
      ? 'ABAC 策略允许访问' 
      : finalDecision === false 
        ? 'ABAC 策略拒绝访问' 
        : '无匹配的 ABAC 策略',
    matchedPolicies,
    evaluatedPolicies: policies.map(p => ({ id: p.id, name: p.name }))
  };
};

const checkAuthorization = (userId, resourceType, action, context = {}) => {
  const rbacResult = checkRBAC(userId, resourceType, action);
  
  const abacPolicies = query(`
    SELECT COUNT(*) as count FROM abac_policies 
    WHERE status = 'active'
    AND (resource_type = ? OR resource_type IS NULL)
    AND (action = ? OR action IS NULL)
  `, [resourceType, action]);

  if (abacPolicies[0]?.count > 0) {
    const abacResult = checkABAC(userId, resourceType, action, context);
    
    if (abacResult.matchedPolicies.length > 0) {
      return {
        allowed: abacResult.allowed,
        engine: 'abac',
        rbac: rbacResult,
        abac: abacResult,
        reason: abacResult.reason
      };
    }
  }

  return {
    allowed: rbacResult.allowed,
    engine: 'rbac',
    rbac: rbacResult,
    reason: rbacResult.reason
  };
};

const generateMenuForUser = (userId) => {
  const userAuth = getUserPermissions(userId);
  const permCodes = userAuth.permissionCodes;

  const allMenus = [
    {
      id: 'dashboard',
      name: '仪表盘',
      icon: 'dashboard',
      path: '/dashboard',
      requiredPermission: null,
      order: 1
    },
    {
      id: 'organization',
      name: '组织架构',
      icon: 'organization',
      path: '/organization',
      requiredPermission: 'org:read',
      order: 2
    },
    {
      id: 'users',
      name: '用户管理',
      icon: 'users',
      path: '/users',
      requiredPermission: 'user:read',
      order: 3
    },
    {
      id: 'audit',
      name: '审计中心',
      icon: 'audit',
      path: '/audit',
      requiredPermission: 'audit:read',
      order: 6
    },
    {
      id: 'monitor',
      name: '实时监控',
      icon: 'monitor',
      path: '/monitor',
      requiredPermission: 'monitor:view',
      order: 7
    },
    {
      id: 'profile',
      name: '个人中心',
      icon: 'profile',
      path: '/profile',
      requiredPermission: null,
      order: 100
    }
  ];

  const filterMenus = (menus) => {
    return menus
      .filter(menu => {
        if (!menu.requiredPermission) return true;
        return permCodes.includes(menu.requiredPermission);
      })
      .map(menu => {
        if (menu.children) {
          const filteredChildren = filterMenus(menu.children);
          if (filteredChildren.length === 0) return null;
          return { ...menu, children: filteredChildren };
        }
        return menu;
      })
      .filter(menu => menu !== null)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  };

  return {
    menus: filterMenus(allMenus),
    permissions: permCodes,
    roles: userAuth.roles.map(r => ({ id: r.id, name: r.name, description: r.description }))
  };
};

module.exports = {
  getUserRoles,
  getRolePermissions,
  getUserPermissions,
  checkRBAC,
  checkABAC,
  checkAuthorization,
  generateMenuForUser
};
