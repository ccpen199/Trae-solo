const { Op } = require('sequelize');
const initModels = require('../models');

const buildTree = (items, parentId = null) => {
  const tree = [];
  items
    .filter(item => item.parentId === parentId)
    .forEach(item => {
      const children = buildTree(items, item.id);
      tree.push({
        ...item.toJSON(),
        children: children.length > 0 ? children : undefined
      });
    });
  return tree.sort((a, b) => a.sort - b.sort);
};

const getOrganizations = async (req, res) => {
  try {
    const { keyword, status, asTree = false } = req.query;
    const { Organization, User } = initModels();

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

    const organizations = await Organization.findAll({
      where,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'realName']
        }
      ],
      order: [['sort', 'ASC']]
    });

    if (asTree && asTree !== 'false') {
      const tree = buildTree(organizations);
      res.json({
        code: 200,
        data: tree
      });
    } else {
      res.json({
        code: 200,
        data: organizations
      });
    }
  } catch (error) {
    console.error('获取机构列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取机构列表失败'
    });
  }
};

const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { Organization, User } = initModels();

    const organization = await Organization.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'realName', 'username']
        }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        code: 404,
        message: '机构不存在'
      });
    }

    res.json({
      code: 200,
      data: organization
    });
  } catch (error) {
    console.error('获取机构详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取机构详情失败'
    });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { name, code, type, parentId, leaderId, sort, status, description } = req.body;
    const { Organization } = initModels();

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '机构名称不能为空'
      });
    }

    if (code) {
      const existing = await Organization.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '机构编码已存在'
        });
      }
    }

    if (parentId) {
      const parent = await Organization.findByPk(parentId);
      if (!parent) {
        return res.status(400).json({
          code: 400,
          message: '上级机构不存在'
        });
      }
    }

    const organization = await Organization.create({
      name,
      code,
      type: type || 'department',
      parentId: parentId || null,
      leaderId: leaderId || null,
      sort: sort || 0,
      status: status || 'active',
      description
    });

    res.json({
      code: 200,
      message: '创建成功',
      data: organization
    });
  } catch (error) {
    console.error('创建机构错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建机构失败'
    });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type, parentId, leaderId, sort, status, description } = req.body;
    const { Organization } = initModels();

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        code: 404,
        message: '机构不存在'
      });
    }

    if (parentId && parentId === id) {
      return res.status(400).json({
        code: 400,
        message: '不能将自己设为上级机构'
      });
    }

    if (code && code !== organization.code) {
      const existing = await Organization.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '机构编码已存在'
        });
      }
    }

    await organization.update({
      name: name || organization.name,
      code: code !== undefined ? code : organization.code,
      type: type || organization.type,
      parentId: parentId !== undefined ? parentId : organization.parentId,
      leaderId: leaderId !== undefined ? leaderId : organization.leaderId,
      sort: sort !== undefined ? sort : organization.sort,
      status: status || organization.status,
      description: description !== undefined ? description : organization.description
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: organization
    });
  } catch (error) {
    console.error('更新机构错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新机构失败'
    });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { Organization, User } = initModels();

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        code: 404,
        message: '机构不存在'
      });
    }

    const childrenCount = await Organization.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该机构下存在子机构，无法删除'
      });
    }

    const usersCount = await User.count({ where: { orgId: id } });
    if (usersCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该机构下存在员工，无法删除'
      });
    }

    await organization.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除机构错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除机构失败'
    });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
