const { Op } = require('sequelize');
const initModels = require('../models');

const getRoles = async (req, res) => {
  try {
    const { keyword, status } = req.query;
    const { Role } = initModels();

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const roles = await Role.findAll({
      where,
      order: [['sort', 'ASC']]
    });

    res.json({
      code: 200,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取角色列表失败'
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { Role, Permission } = initModels();

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'code', 'type', 'path']
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    res.json({
      code: 200,
      data: role
    });
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取角色详情失败'
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, code, type, sort, status, description } = req.body;
    const { Role } = initModels();

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '角色名称不能为空'
      });
    }

    if (code) {
      const existing = await Role.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '角色编码已存在'
        });
      }
    }

    const role = await Role.create({
      name,
      code,
      type: type || 'custom',
      sort: sort || 0,
      status: status || 'active',
      description
    });

    res.json({
      code: 200,
      message: '创建成功',
      data: role
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建角色失败'
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, sort, status, description } = req.body;
    const { Role } = initModels();

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    if (role.type === 'system' && status === 'inactive') {
      return res.status(400).json({
        code: 400,
        message: '系统角色不能禁用'
      });
    }

    if (code && code !== role.code) {
      const existing = await Role.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '角色编码已存在'
        });
      }
    }

    await role.update({
      name: name || role.name,
      code: code !== undefined ? code : role.code,
      sort: sort !== undefined ? sort : role.sort,
      status: status || role.status,
      description: description !== undefined ? description : role.description
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: role
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新角色失败'
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { Role, UserRole, RolePermission } = initModels();

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    if (role.type === 'system') {
      return res.status(400).json({
        code: 400,
        message: '系统角色不能删除'
      });
    }

    const userCount = await UserRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该角色下存在用户，无法删除'
      });
    }

    await RolePermission.destroy({ where: { roleId: id } });
    await role.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除角色失败'
    });
  }
};

const assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    const { Role, Permission, RolePermission } = initModels();

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    await RolePermission.destroy({ where: { roleId: id } });

    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      const existingPermissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      const validIds = existingPermissions.map(p => p.id);
      
      for (const permId of validIds) {
        await RolePermission.create({
          roleId: id,
          permissionId: permId
        });
      }
    }

    res.json({
      code: 200,
      message: '分配权限成功'
    });
  } catch (error) {
    console.error('分配权限错误:', error);
    res.status(500).json({
      code: 500,
      message: '分配权限失败'
    });
  }
};

const getAllPermissions = async (req, res) => {
  try {
    const { Permission } = initModels();
    const permissions = await Permission.findAll({
      order: [['sort', 'ASC']]
    });

    res.json({
      code: 200,
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取权限列表失败'
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getAllPermissions
};
