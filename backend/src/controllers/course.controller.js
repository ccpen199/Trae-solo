const db = require('../models');
const logger = require('../utils/logger');

const getCourses = async (req, res) => {
  try {
    const { page, pageSize, code, name, departmentId, teacherId, term, status } = req.query;
    
    const where = {};
    if (code) where.code = { [db.Sequelize.Op.like]: `%${code}%` };
    if (name) where.name = { [db.Sequelize.Op.like]: `%${name}%` };
    if (departmentId) where.departmentId = departmentId;
    if (teacherId) where.teacherId = teacherId;
    if (term) where.term = term;
    if (status !== undefined && status !== '') where.status = status === 'true';

    const includeOptions = [
      {
        model: db.Department,
        as: 'department',
        attributes: ['id', 'code', 'name']
      },
      {
        model: db.User,
        as: 'teacher',
        attributes: ['id', 'username', 'name']
      }
    ];

    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      const { count, rows } = await db.Course.findAndCountAll({
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
      const courses = await db.Course.findAll({
        where,
        include: includeOptions,
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        data: courses
      });
    }
  } catch (error) {
    logger.error('获取课程列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取课程列表失败',
      error: error.message
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await db.Course.findOne({
      where: { id },
      include: [
        {
          model: db.Department,
          as: 'department'
        },
        {
          model: db.User,
          as: 'teacher',
          attributes: ['id', 'username', 'name', 'phone', 'email']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('获取课程信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取课程信息失败',
      error: error.message
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const { code, name, departmentId, teacherId, credits, hours, term, description, status = true } = req.body;

    if (!code || !name || !departmentId) {
      return res.status(400).json({
        success: false,
        message: '课程代码、名称和系别不能为空'
      });
    }

    const department = await db.Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: '系别不存在'
      });
    }

    if (teacherId) {
      const teacher = await db.User.findOne({
        where: { 
          id: teacherId, 
          status: true,
          '$role.code$': { [db.Sequelize.Op.in]: ['TEACHER', 'TEACHING_ADMIN', 'SYSTEM_ADMIN'] }
        },
        include: [{ model: db.Role, as: 'role' }]
      });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: '教师不存在或无授课权限'
        });
      }
    }

    const existing = await db.Course.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '课程代码已存在'
      });
    }

    const course = await db.Course.create({
      code,
      name,
      departmentId,
      teacherId: teacherId || null,
      credits: credits || 0,
      hours: hours || 0,
      term,
      description,
      status
    });

    logger.info(`创建课程成功 - 代码: ${code}, 名称: ${name}`);

    const newCourse = await db.Course.findOne({
      where: { id: course.id },
      include: [
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name']
        },
        {
          model: db.User,
          as: 'teacher',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '创建课程成功',
      data: newCourse
    });
  } catch (error) {
    logger.error('创建课程失败:', error);
    res.status(500).json({
      success: false,
      message: '创建课程失败',
      error: error.message
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, departmentId, teacherId, credits, hours, term, description, status } = req.body;

    const course = await db.Course.findByPk(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    if (departmentId && departmentId !== course.departmentId) {
      const department = await db.Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: '系别不存在'
        });
      }
    }

    if (teacherId && teacherId !== course.teacherId) {
      const teacher = await db.User.findOne({
        where: { 
          id: teacherId, 
          status: true,
          '$role.code$': { [db.Sequelize.Op.in]: ['TEACHER', 'TEACHING_ADMIN', 'SYSTEM_ADMIN'] }
        },
        include: [{ model: db.Role, as: 'role' }]
      });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: '教师不存在或无授课权限'
        });
      }
    }

    if (code && code !== course.code) {
      const existing = await db.Course.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: '课程代码已存在'
        });
      }
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (credits !== undefined) updateData.credits = credits;
    if (hours !== undefined) updateData.hours = hours;
    if (term !== undefined) updateData.term = term;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    await course.update(updateData);

    logger.info(`更新课程成功 - ID: ${id}`);

    const updatedCourse = await db.Course.findOne({
      where: { id },
      include: [
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name']
        },
        {
          model: db.User,
          as: 'teacher',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: '更新课程成功',
      data: updatedCourse
    });
  } catch (error) {
    logger.error('更新课程失败:', error);
    res.status(500).json({
      success: false,
      message: '更新课程失败',
      error: error.message
    });
  }
};

const deleteCourse = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const course = await db.Course.findByPk(id, { transaction });
    if (!course) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    const gradeCount = await db.Grade.count({ 
      where: { courseId: id },
      transaction 
    });
    if (gradeCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该课程存在成绩记录，无法删除'
      });
    }

    await course.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除课程成功 - ID: ${id}, 代码: ${course.code}`);

    res.json({
      success: true,
      message: '删除课程成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除课程失败:', error);
    res.status(500).json({
      success: false,
      message: '删除课程失败',
      error: error.message
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
