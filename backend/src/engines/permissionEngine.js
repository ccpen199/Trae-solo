const { getQuery, allQuery } = require('../database/schema');

const rolePermissions = {
  admin: [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'student:read', 'student:create', 'student:update', 'student:delete', 'student:archive',
    'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete',
    'class:read', 'class:create', 'class:update', 'class:delete',
    'course:read', 'course:create', 'course:update', 'course:delete', 'course:publish',
    'schedule:read', 'schedule:create', 'schedule:update', 'schedule:delete', 'schedule:generate',
    'enrollment:read', 'enrollment:approve', 'enrollment:cancel',
    'attendance:read', 'attendance:statistics',
    'grade:read', 'grade:update', 'grade:approve', 'grade:statistics',
    'archive:read', 'archive:create', 'archive:delete',
    'report:read', 'report:generate', 'report:export',
    'log:read'
  ],
  teacher: [
    'user:read:self',
    'teacher:read:self',
    'course:read:assigned',
    'schedule:read:assigned',
    'enrollment:read:assigned',
    'attendance:read:assigned', 'attendance:create:assigned', 'attendance:update:assigned',
    'grade:read:assigned', 'grade:create:assigned', 'grade:update:assigned', 'grade:submit',
    'report:read:assigned'
  ],
  student: [
    'user:read:self',
    'student:read:self',
    'course:read:published',
    'schedule:read:self',
    'enrollment:read:self', 'enrollment:create:self', 'enrollment:drop:self',
    'attendance:read:self',
    'grade:read:self'
  ],
  homeroom_teacher: [
    'user:read',
    'student:read:class',
    'class:read:self',
    'schedule:read:class',
    'enrollment:read:class',
    'attendance:read:class', 'attendance:statistics:class',
    'grade:read:class', 'grade:statistics:class',
    'report:read:class'
  ]
};

const checkPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  
  if (permissions.includes(permission)) {
    return true;
  }
  
  const basePermission = permission.split(':')[0];
  const hasWildcard = permissions.some(p => p.startsWith(basePermission + ':') || p === basePermission);
  
  return hasWildcard;
};

const authMiddleware = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: '未登录，请先登录' });
      }
      
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'campus-edu-secret-key-2024';
      
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await getQuery('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      
      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({ error: '用户已被禁用' });
      }
      
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(p => checkPermission(user.role, p));
        if (!hasPermission) {
          return res.status(403).json({ error: '权限不足' });
        }
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('认证中间件错误:', error);
      res.status(401).json({ error: 'Token无效或已过期' });
    }
  };
};

const checkDataPermission = async (user, resourceType, resourceId) => {
  const { role, id: userId } = user;
  
  switch (role) {
    case 'admin':
      return true;
      
    case 'teacher':
      if (resourceType === 'teacher') {
        return resourceId === userId;
      }
      if (resourceType === 'course' || resourceType === 'schedule') {
        const course = await getQuery(
          `SELECT * FROM ${resourceType === 'schedule' ? 'schedules' : 'courses'} WHERE id = ? AND teacher_id = ?`,
          [resourceId, userId]
        );
        return !!course;
      }
      return false;
      
    case 'student':
      if (resourceType === 'student') {
        return resourceId === userId;
      }
      if (resourceType === 'enrollment' || resourceType === 'attendance' || resourceType === 'grade') {
        const record = await getQuery(
          `SELECT * FROM ${resourceType === 'enrollment' ? 'enrollments' : resourceType + 's'} WHERE id = ? AND student_id = ?`,
          [resourceId, userId]
        );
        return !!record;
      }
      return false;
      
    case 'homeroom_teacher':
      if (resourceType === 'student') {
        const studentClass = await getQuery(
          `SELECT c.id FROM classes c 
           JOIN student_profiles sp ON c.id = sp.class_id 
           WHERE sp.user_id = ? AND c.homeroom_teacher_id = ?`,
          [resourceId, userId]
        );
        return !!studentClass;
      }
      if (resourceType === 'class') {
        const classInfo = await getQuery(
          'SELECT * FROM classes WHERE id = ? AND homeroom_teacher_id = ?',
          [resourceId, userId]
        );
        return !!classInfo;
      }
      return false;
      
    default:
      return false;
  }
};

module.exports = {
  checkPermission,
  authMiddleware,
  checkDataPermission,
  rolePermissions
};
