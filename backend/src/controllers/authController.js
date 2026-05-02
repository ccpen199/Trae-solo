const { get, all } = require('../config/database');

const ROLES = {
  PLAYER: 'player',
  PLANNER: 'planner',
  OPERATOR: 'operator',
  CUSTOMER_SERVICE: 'customer_service'
};

const ROLE_PERMISSIONS = {
  [ROLES.PLAYER]: {
    visibleModules: ['tasks', 'progress', 'achievements', 'rewards'],
    allowedActions: ['view', 'trigger']
  },
  [ROLES.PLANNER]: {
    visibleModules: ['tasks', 'achievements', 'rewards', 'triggers', 'reports'],
    allowedActions: ['view', 'create', 'update', 'delete', 'publish']
  },
  [ROLES.OPERATOR]: {
    visibleModules: ['tasks', 'achievements', 'rewards', 'reports', 'analytics'],
    allowedActions: ['view', 'adjust', 'analyze']
  },
  [ROLES.CUSTOMER_SERVICE]: {
    visibleModules: ['users', 'progress', 'audits', 'issues'],
    allowedActions: ['view', 'handle']
  }
};

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      const user = await get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const role = await get(
        'SELECT * FROM roles WHERE role_code = ?',
        [user.role_code]
      );

      const permissions = ROLE_PERMISSIONS[user.role_code] || {
        visibleModules: [],
        allowedActions: []
      };

      res.json({
        success: true,
        data: {
          user: {
            user_uuid: user.user_uuid,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            role_code: user.role_code,
            role_name: role?.role_name
          },
          permissions: permissions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      
      if (!userUuid) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        });
      }

      const user = await get(
        'SELECT * FROM users WHERE user_uuid = ?',
        [userUuid]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      const role = await get(
        'SELECT * FROM roles WHERE role_code = ?',
        [user.role_code]
      );

      const permissions = ROLE_PERMISSIONS[user.role_code] || {
        visibleModules: [],
        allowedActions: []
      };

      res.json({
        success: true,
        data: {
          user: {
            user_uuid: user.user_uuid,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            role_code: user.role_code,
            role_name: role?.role_name
          },
          permissions: permissions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRoles(req, res) {
    try {
      const roles = await all('SELECT * FROM roles');
      
      res.json({
        success: true,
        data: roles.map(role => ({
          ...role,
          permissions: ROLE_PERMISSIONS[role.role_code]
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = { AuthController, ROLES, ROLE_PERMISSIONS };
