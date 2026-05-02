const Log = require('../models/Log');

// 日志记录中间件
exports.log = async (req, res, next) => {
  // 跳过登录和注册等不需要记录的路由
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }
  
  // 保存原始的响应方法
  const originalSend = res.send;
  
  // 重写响应方法，在响应时记录日志
  res.send = function(body) {
    // 只有当用户已认证且操作成功时才记录日志
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      // 提取资源类型和ID
      let resourceType = null;
      let resourceId = null;
      let action = null;
      let description = null;
      
      // 根据请求路径和方法判断操作类型
      if (req.path.includes('/api/equipment')) {
        resourceType = 'equipment';
        resourceId = req.params.id || null;
        action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        description = `${req.user.name} ${action} equipment`;
      } else if (req.path.includes('/api/maintenance')) {
        resourceType = 'maintenance';
        resourceId = req.params.id || null;
        action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        description = `${req.user.name} ${action} maintenance plan`;
      } else if (req.path.includes('/api/repair')) {
        resourceType = 'repair';
        resourceId = req.params.id || null;
        action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        description = `${req.user.name} ${action} repair order`;
      } else if (req.path.includes('/api/sparePart')) {
        resourceType = 'sparePart';
        resourceId = req.params.id || null;
        action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        description = `${req.user.name} ${action} spare part`;
      } else if (req.path.includes('/api/user')) {
        resourceType = 'user';
        resourceId = req.params.id || null;
        action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        description = `${req.user.name} ${action} user`;
      }
      
      // 记录日志
      if (resourceType) {
        const log = new Log({
          user: req.user._id,
          action: action,
          resourceType: resourceType,
          resourceId: resourceId,
          description: description,
          ip: req.ip
        });
        log.save().catch(err => console.error('Error saving log:', err));
      }
    }
    
    // 调用原始的响应方法
    return originalSend.call(this, body);
  };
  
  next();
};