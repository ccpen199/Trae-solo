const db = require('../models');
const { generateToken, decodeToken } = require('../utils/jwt');
const { getRedisClient } = require('../config/redis');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }
    
    const user = await db.User.scope('withPassword').findOne({
      where: { username },
      include: [
        { model: db.Role, as: 'role' }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用，请联系管理员'
      });
    }
    
    const isValidPassword = user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    const token = generateToken(user);
    
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.connection.remoteAddress;
    await user.save();
    
    const userData = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        displayName: user.role?.displayName,
        permissions: user.role?.permissions
      }
    };
    
    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userData
      }
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.token;
    const redisClient = getRedisClient();
    
    if (redisClient.isReady) {
      try {
        const decoded = decodeToken(token);
        const expiresIn = decoded ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;
        await redisClient.set(`blacklist:${token}`, '1', { EX: Math.max(expiresIn, 0) });
      } catch (e) {
        console.log('Redis logout failed, using in-memory fallback');
      }
    }
    
    return res.json({
      code: 200,
      message: '登出成功'
    });
    
  } catch (error) {
    console.error('登出错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    const userData = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        displayName: user.role?.displayName,
        permissions: user.role?.permissions
      }
    };
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: userData
    });
    
  } catch (error) {
    console.error('获取当前用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};
