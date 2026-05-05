const { Department, OperationLog, Barcode } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const getDepartments = async (req, res, next) => {
  try {
    const { page, pageSize, keyword, status } = req.query;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (status !== undefined && status !== '') {
      where.status = status === 'true';
    }
    
    let departments;
    
    if (page && pageSize) {
      const offset = (page - 1) * pageSize;
      const { count, rows } = await Department.findAndCountAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: parseInt(offset)
      });
      
      departments = {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } else {
      const rows = await Department.findAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'DESC']]
      });
      departments = rows;
    }
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new AppError('部门不存在', 404);
    }
    
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, parentId, sort, status } = req.body;
    
    if (!name || !code) {
      throw new AppError('部门名称和编码不能为空', 400);
    }
    
    const existingDept = await Department.findOne({ where: { code } });
    if (existingDept) {
      throw new AppError('部门编码已存在', 400);
    }
    
    const department = await Department.create({
      name,
      code,
      description,
      parentId,
      sort: sort || 0,
      status: status !== undefined ? status : true
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'department',
      action: 'create',
      targetId: department.id,
      targetType: 'Department',
      description: `创建部门：${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '部门创建成功',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, parentId, sort, status } = req.body;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new AppError('部门不存在', 404);
    }
    
    if (code && code !== department.code) {
      const existingDept = await Department.findOne({ 
        where: { code, id: { [Op.ne]: id } } 
      });
      if (existingDept) {
        throw new AppError('部门编码已存在', 400);
      }
    }
    
    await department.update({
      name,
      code,
      description,
      parentId,
      sort,
      status
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'department',
      action: 'update',
      targetId: department.id,
      targetType: 'Department',
      description: `更新部门：${department.name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '部门更新成功'
    });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new AppError('部门不存在', 404);
    }
    
    const barcodeCount = await Barcode.count({ where: { departmentId: id } });
    if (barcodeCount > 0) {
      throw new AppError('该部门下有关联的条码数据，无法删除', 400);
    }
    
    const name = department.name;
    await department.destroy();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'department',
      action: 'delete',
      targetId: id,
      targetType: 'Department',
      description: `删除部门：${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '部门删除成功'
    });
  } catch (error) {
    next(error);
  }
};

const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new AppError('部门不存在', 404);
    }
    
    department.status = !department.status;
    await department.save();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'department',
      action: 'toggle',
      targetId: department.id,
      targetType: 'Department',
      description: `切换部门状态：${department.name} - ${department.status ? '启用' : '禁用'}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: `部门已${department.status ? '启用' : '禁用'}`,
      data: { status: department.status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus
};
