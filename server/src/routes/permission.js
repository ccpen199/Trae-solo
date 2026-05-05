const express = require('express');
const pool = require('../config/database');
const { authenticateJWT, checkPermission, checkAnyPermission } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticateJWT);

router.get('/tree',
  checkAnyPermission(['user:manage', 'role:manage']),
  async (req, res) => {
    try {
      const isRoot = req.user.isRoot;

      let query;
      let params;

      if (isRoot) {
        query = `
          SELECT id, name, code, type, parent_id, path, component, icon, 
                 sort_order, is_hidden, is_root, depends_on, description
          FROM permissions
          ORDER BY sort_order ASC, created_at ASC
        `;
        params = [];
      } else {
        query = `
          SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, 
                          p.component, p.icon, p.sort_order, p.is_hidden, 
                          p.is_root, p.depends_on, p.description
          FROM permissions p
          INNER JOIN role_permissions rp ON p.id = rp.permission_id
          INNER JOIN roles r ON rp.role_id = r.id
          INNER JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = $1 AND p.is_hidden = false
          ORDER BY p.sort_order ASC
        `;
        params = [req.user.id];
      }

      const result = await pool.query(query, params);

      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            type: item.type,
            parentId: item.parent_id,
            path: item.path,
            component: item.component,
            icon: item.icon,
            sortOrder: item.sort_order,
            isHidden: item.is_hidden,
            isRoot: item.is_root,
            dependsOn: item.depends_on,
            description: item.description,
            children: buildTree(items, item.id)
          }));
      };

      const permissions = result.rows;
      const tree = buildTree(permissions);

      res.json({
        success: true,
        data: tree
      });

    } catch (error) {
      logger.error('获取权限树失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/menus',
  async (req, res) => {
    try {
      const isRoot = req.user.isRoot;

      let query;
      let params;

      if (isRoot) {
        query = `
          SELECT id, name, code, type, parent_id, path, component, icon, sort_order, is_hidden
          FROM permissions
          WHERE type = 'menu' AND (is_hidden = false OR is_root = false)
          ORDER BY sort_order ASC, created_at ASC
        `;
        params = [];
      } else {
        query = `
          SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, 
                          p.component, p.icon, p.sort_order, p.is_hidden
          FROM permissions p
          INNER JOIN role_permissions rp ON p.id = rp.permission_id
          INNER JOIN roles r ON rp.role_id = r.id
          INNER JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = $1 AND p.type = 'menu' AND p.is_hidden = false
          ORDER BY p.sort_order ASC
        `;
        params = [req.user.id];
      }

      const result = await pool.query(query, params);

      const buildMenuTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            type: item.type,
            parentId: item.parent_id,
            path: item.path,
            component: item.component,
            icon: item.icon,
            sortOrder: item.sort_order,
            isHidden: item.is_hidden,
            children: buildMenuTree(items, item.id)
          }));
      };

      const menus = result.rows;
      const menuTree = buildMenuTree(menus);

      res.json({
        success: true,
        data: menuTree
      });

    } catch (error) {
      logger.error('获取菜单树失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/buttons',
  async (req, res) => {
    try {
      const isRoot = req.user.isRoot;

      let query;
      let params;

      if (isRoot) {
        query = `
          SELECT code FROM permissions WHERE type = 'button'
        `;
        params = [];
      } else {
        query = `
          SELECT DISTINCT p.code
          FROM permissions p
          INNER JOIN role_permissions rp ON p.id = rp.permission_id
          INNER JOIN roles r ON rp.role_id = r.id
          INNER JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = $1 AND p.type = 'button'
        `;
        params = [req.user.id];
      }

      const result = await pool.query(query, params);
      const buttonCodes = result.rows.map(row => row.code);

      res.json({
        success: true,
        data: buttonCodes
      });

    } catch (error) {
      logger.error('获取按钮权限失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/dependencies',
  checkPermission('role:manage'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.id, p.code, p.name, 
                d.id as depends_id, d.code as depends_code, d.name as depends_name
         FROM permissions p
         LEFT JOIN permissions d ON p.depends_on = d.id
         WHERE p.depends_on IS NOT NULL
         ORDER BY p.sort_order`
      );

      const dependencies = result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        dependsOn: {
          id: row.depends_id,
          code: row.depends_code,
          name: row.depends_name
        }
      }));

      res.json({
        success: true,
        data: dependencies
      });

    } catch (error) {
      logger.error('获取权限依赖关系失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

module.exports = router;
