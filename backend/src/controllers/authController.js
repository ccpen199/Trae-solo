const jwt = require('jsonwebtoken');
const { User } = require('../models');
const integrityVerify = require('../engines/IntegrityVerify');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, password, role, realName, phone, email, organization } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const user = await User.create({
      username,
      password,
      role,
      realName,
      phone,
      email,
      organization
    });

    await integrityVerify.logOperation({
      operationType: 'USER_REGISTER',
      operationName: '用户注册',
      userId: user.id,
      userRole: user.role,
      resourceType: 'User',
      resourceId: user.id,
      afterData: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName
      },
      description: `用户 ${username} 注册成功，角色: ${role}`
    }, req);

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        organization: user.organization
      },
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    await integrityVerify.logOperation({
      operationType: 'USER_LOGIN',
      operationName: '用户登录',
      userId: user.id,
      userRole: user.role,
      resourceType: 'User',
      resourceId: user.id,
      description: `用户 ${username} 登录成功，角色: ${user.role}`
    }, req);

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        organization: user.organization,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取当前用户错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await integrityVerify.logOperation({
      operationType: 'USER_LOGOUT',
      operationName: '用户登出',
      userId: req.user?.id,
      userRole: req.user?.role,
      resourceType: 'User',
      resourceId: req.user?.id,
      description: `用户登出`
    }, req);

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
};
