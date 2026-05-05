require('dotenv').config();
const jwt = require('jsonwebtoken');
const initModels = require('../models');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { User, Role, Permission, Organization } = initModels();

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Role,
          as: 'roles',
          include: [{
            model: Permission,
            as: 'permissions'
          }]
        },
        {
          model: Organization,
          as: 'organization'
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '用户已被禁用'
      });
    }

    await user.update({ lastLoginAt: new Date() });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const menus = [];
    const permissionCodes = new Set();
    
    user.roles.forEach(role => {
      role.permissions.forEach(perm => {
        permissionCodes.add(perm.code);
        if (perm.type === 'menu') {
          const exists = menus.find(m => m.id === perm.id);
          if (!exists) {
            menus.push({
              id: perm.id,
              name: perm.name,
              code: perm.code,
              path: perm.path,
              icon: perm.icon,
              component: perm.component,
              sort: perm.sort
            });
          }
        }
      });
    });

    menus.sort((a, b) => a.sort - b.sort);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name
          } : null,
          roles: user.roles.map(r => ({
            id: r.id,
            name: r.name,
            code: r.code
          }))
        },
        menus,
        permissions: Array.from(permissionCodes)
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试'
    });
  }
};

const logout = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      code: 500,
      message: '登出失败'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const { User, Role, Permission, Organization } = initModels();
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [{
            model: Permission,
            as: 'permissions'
          }]
        },
        {
          model: Organization,
          as: 'organization'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const menus = [];
    const permissionCodes = new Set();
    
    user.roles.forEach(role => {
      role.permissions.forEach(perm => {
        permissionCodes.add(perm.code);
        if (perm.type === 'menu') {
          const exists = menus.find(m => m.id === perm.id);
          if (!exists) {
            menus.push({
              id: perm.id,
              name: perm.name,
              code: perm.code,
              path: perm.path,
              icon: perm.icon,
              component: perm.component,
              sort: perm.sort
            });
          }
        }
      });
    });

    menus.sort((a, b) => a.sort - b.sort);

    res.json({
      code: 200,
      data: {
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name
          } : null,
          roles: user.roles.map(r => ({
            id: r.id,
            name: r.name,
            code: r.code
          }))
        },
        menus,
        permissions: Array.from(permissionCodes)
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};
