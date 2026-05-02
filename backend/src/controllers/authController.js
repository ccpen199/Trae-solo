const authService = require('../services/authService');

const login = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const result = authService.login(username, password);
  if (result.error) {
    return res.status(401).json(result);
  }
  res.json(result);
};

const getPermissions = (req, res) => {
  const permissions = authService.getPermissionsByRole(req.user.role);
  res.json({
    user: req.user,
    permissions
  });
};

module.exports = {
  login,
  getPermissions
};
