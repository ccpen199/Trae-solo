const { error } = require('../utils/response');
const { get } = require('../models/database');

const auth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json(error('未登录，请先登录'));
  }

  const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.status(401).json(error('用户不存在'));
  }

  req.user = user;
  next();
};

module.exports = auth;
