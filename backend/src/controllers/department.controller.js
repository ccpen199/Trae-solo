const db = require('../models');
const logger = require('../utils/logger');

const getDepartments = async (req, res) => {
  try {
    const { page, pageSize, code, name, status } = req.query;
    
    const where = {};
    if (code) where.code = { [db.Sequelize.Op.like]: `%${code}%` };
    if (name) where.name = { [db.Sequelize.Op.like]: `%${name}%` };
    if (status !== undefined && status !== '') where.status = status === 'true';

    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      const { count, rows } = await db.Department.findAndCountAll({
        where,
        offset,
        limit,
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          list: rows,
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } else {
      const departments = await db.Department.findAll({
        where,
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        data: departments
      });
    }
  } catch (error) {
    logger.error('获取系列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系列表失败',
      error: error.message
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.Department.findOne({
      where: { id }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: '系别不存在'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    logger.error('获取系别信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系别信息失败',
      error: error.message
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { code, name, description, head, status = true } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: '系别代码和名称不能为空'
      });
    }

    const existing = await db.Department.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '系别代码已存在'
      });
    }

    const department = await db.Department.create({
      code,
      name,
      description,
      head,
      status
    });

    logger.info(`创建系别成功 - 代码: ${code}, 名称: ${name}`);

    res.status(201).json({
      success: true,
      message: '创建系别成功',
      data: department
    });
  } catch (error) {
    logger.error('创建系别失败:', error);
    res.status(500).json({
      success: false,
      message: '创建系别失败',
      error: error.message
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, head, status } = req.body;

    const department = await db.Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: '系别不存在'
      });
    }

    if (code && code !== department.code) {
      const existing = await db.Department.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: '系别代码已存在'
        });
      }
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (head !== undefined) updateData.head = head;
    if (status !== undefined) updateData.status = status;

    await department.update(updateData);

    logger.info(`更新系别成功 - ID: ${id}`);

    res.json({
      success: true,
      message: '更新系别成功',
      data: department
    });
  } catch (error) {
    logger.error('更新系别失败:', error);
    res.status(500).json({
      success: false,
      message: '更新系别失败',
      error: error.message
    });
  }
};

const deleteDepartment = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const department = await db.Department.findByPk(id, { transaction });
    if (!department) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '系别不存在'
      });
    }

    const classCount = await db.Class.count({ 
      where: { departmentId: id },
      transaction 
    });
    if (classCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该系别下存在班级，无法删除'
      });
    }

    const courseCount = await db.Course.count({ 
      where: { departmentId: id },
      transaction 
    });
    if (courseCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该系别下存在课程，无法删除'
      });
    }

    await department.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除系别成功 - ID: ${id}, 代码: ${department.code}`);

    res.json({
      success: true,
      message: '删除系别成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除系别失败:', error);
    res.status(500).json({
      success: false,
      message: '删除系别失败',
      error: error.message
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
