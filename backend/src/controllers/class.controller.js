const db = require('../models');
const logger = require('../utils/logger');

const getClasses = async (req, res) => {
  try {
    const { page, pageSize, code, name, departmentId, grade, status } = req.query;
    
    const where = {};
    if (code) where.code = { [db.Sequelize.Op.like]: `%${code}%` };
    if (name) where.name = { [db.Sequelize.Op.like]: `%${name}%` };
    if (departmentId) where.departmentId = departmentId;
    if (grade) where.grade = grade;
    if (status !== undefined && status !== '') where.status = status === 'true';

    const includeOptions = [
      {
        model: db.Department,
        as: 'department',
        attributes: ['id', 'code', 'name']
      }
    ];

    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      const { count, rows } = await db.Class.findAndCountAll({
        where,
        include: includeOptions,
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
      const classes = await db.Class.findAll({
        where,
        include: includeOptions,
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        data: classes
      });
    }
  } catch (error) {
    logger.error('获取班级列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取班级列表失败',
      error: error.message
    });
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classObj = await db.Class.findOne({
      where: { id },
      include: [
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name']
        }
      ]
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    res.json({
      success: true,
      data: classObj
    });
  } catch (error) {
    logger.error('获取班级信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取班级信息失败',
      error: error.message
    });
  }
};

const createClass = async (req, res) => {
  try {
    const { code, name, departmentId, grade, monitor, description, status = true } = req.body;

    if (!code || !name || !departmentId || !grade) {
      return res.status(400).json({
        success: false,
        message: '班级代码、名称、系别和年级不能为空'
      });
    }

    const department = await db.Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: '系别不存在'
      });
    }

    const existing = await db.Class.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '班级代码已存在'
      });
    }

    const newClass = await db.Class.create({
      code,
      name,
      departmentId,
      grade,
      monitor,
      description,
      status
    });

    logger.info(`创建班级成功 - 代码: ${code}, 名称: ${name}`);

    const classWithDept = await db.Class.findOne({
      where: { id: newClass.id },
      include: [{
        model: db.Department,
        as: 'department',
        attributes: ['id', 'code', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      message: '创建班级成功',
      data: classWithDept
    });
  } catch (error) {
    logger.error('创建班级失败:', error);
    res.status(500).json({
      success: false,
      message: '创建班级失败',
      error: error.message
    });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, departmentId, grade, monitor, description, status } = req.body;

    const classObj = await db.Class.findByPk(id);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    if (departmentId && departmentId !== classObj.departmentId) {
      const department = await db.Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: '系别不存在'
        });
      }
    }

    if (code && code !== classObj.code) {
      const existing = await db.Class.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: '班级代码已存在'
        });
      }
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (grade !== undefined) updateData.grade = grade;
    if (monitor !== undefined) updateData.monitor = monitor;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    await classObj.update(updateData);

    logger.info(`更新班级成功 - ID: ${id}`);

    const updatedClass = await db.Class.findOne({
      where: { id },
      include: [{
        model: db.Department,
        as: 'department',
        attributes: ['id', 'code', 'name']
      }]
    });

    res.json({
      success: true,
      message: '更新班级成功',
      data: updatedClass
    });
  } catch (error) {
    logger.error('更新班级失败:', error);
    res.status(500).json({
      success: false,
      message: '更新班级失败',
      error: error.message
    });
  }
};

const deleteClass = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const classObj = await db.Class.findByPk(id, { transaction });
    if (!classObj) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    const studentCount = await db.Student.count({ 
      where: { classId: id },
      transaction 
    });
    if (studentCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该班级下存在学生，无法删除'
      });
    }

    await classObj.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除班级成功 - ID: ${id}, 代码: ${classObj.code}`);

    res.json({
      success: true,
      message: '删除班级成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除班级失败:', error);
    res.status(500).json({
      success: false,
      message: '删除班级失败',
      error: error.message
    });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
