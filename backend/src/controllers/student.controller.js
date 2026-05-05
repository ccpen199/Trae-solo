const db = require('../models');
const logger = require('../utils/logger');

const getStudents = async (req, res) => {
  try {
    const { page, pageSize, studentNo, name, classId, departmentId, status } = req.query;
    
    const where = {};
    if (studentNo) where.studentNo = { [db.Sequelize.Op.like]: `%${studentNo}%` };
    if (name) where.name = { [db.Sequelize.Op.like]: `%${name}%` };
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const classInclude = {
      model: db.Class,
      as: 'classInfo',
      attributes: ['id', 'code', 'name', 'grade'],
      include: [{
        model: db.Department,
        as: 'department',
        attributes: ['id', 'code', 'name']
      }]
    };

    if (departmentId) {
      classInclude.where = { departmentId };
    }

    const includeOptions = [classInclude];

    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      const { count, rows } = await db.Student.findAndCountAll({
        where,
        include: includeOptions,
        offset,
        limit,
        order: [['studentNo', 'ASC']]
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
      const students = await db.Student.findAll({
        where,
        include: includeOptions,
        order: [['studentNo', 'ASC']]
      });

      res.json({
        success: true,
        data: students
      });
    }
  } catch (error) {
    logger.error('获取学生列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学生列表失败',
      error: error.message
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await db.Student.findOne({
      where: { id },
      include: [
        {
          model: db.Class,
          as: 'classInfo',
          include: [{
            model: db.Department,
            as: 'department'
          }]
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'phone']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('获取学生信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学生信息失败',
      error: error.message
    });
  }
};

const createStudent = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { 
      studentNo, userId, classId, name, gender, 
      idCard, birthDate, address, phone, email, 
      enrollmentDate, status = '在读' 
    } = req.body;

    if (!studentNo || !classId || !name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学号、班级和姓名不能为空'
      });
    }

    const classObj = await db.Class.findByPk(classId);
    if (!classObj) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '班级不存在'
      });
    }

    const existing = await db.Student.findOne({ where: { studentNo } });
    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学号已存在'
      });
    }

    const student = await db.Student.create({
      studentNo,
      userId,
      classId,
      name,
      gender: gender || '未知',
      idCard,
      birthDate,
      address,
      phone,
      email,
      enrollmentDate,
      status
    }, { transaction });

    await transaction.commit();

    logger.info(`创建学生成功 - 学号: ${studentNo}, 姓名: ${name}`);

    const newStudent = await db.Student.findOne({
      where: { id: student.id },
      include: [{
        model: db.Class,
        as: 'classInfo',
        include: [{
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: '创建学生成功',
      data: newStudent
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('创建学生失败:', error);
    res.status(500).json({
      success: false,
      message: '创建学生失败',
      error: error.message
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      studentNo, userId, classId, name, gender, 
      idCard, birthDate, address, phone, email, 
      enrollmentDate, status 
    } = req.body;

    const student = await db.Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    if (classId && classId !== student.classId) {
      const classObj = await db.Class.findByPk(classId);
      if (!classObj) {
        return res.status(400).json({
          success: false,
          message: '班级不存在'
        });
      }
    }

    if (studentNo && studentNo !== student.studentNo) {
      const existing = await db.Student.findOne({ where: { studentNo } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: '学号已存在'
        });
      }
    }

    const updateData = {};
    if (studentNo !== undefined) updateData.studentNo = studentNo;
    if (userId !== undefined) updateData.userId = userId;
    if (classId !== undefined) updateData.classId = classId;
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (idCard !== undefined) updateData.idCard = idCard;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (enrollmentDate !== undefined) updateData.enrollmentDate = enrollmentDate;
    if (status !== undefined) updateData.status = status;

    await student.update(updateData);

    logger.info(`更新学生成功 - ID: ${id}`);

    const updatedStudent = await db.Student.findOne({
      where: { id },
      include: [{
        model: db.Class,
        as: 'classInfo',
        include: [{
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name']
        }]
      }]
    });

    res.json({
      success: true,
      message: '更新学生成功',
      data: updatedStudent
    });
  } catch (error) {
    logger.error('更新学生失败:', error);
    res.status(500).json({
      success: false,
      message: '更新学生失败',
      error: error.message
    });
  }
};

const deleteStudent = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const student = await db.Student.findByPk(id, { transaction });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    const gradeCount = await db.Grade.count({ 
      where: { studentId: id },
      transaction 
    });
    if (gradeCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该学生存在成绩记录，无法删除'
      });
    }

    await student.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除学生成功 - ID: ${id}, 学号: ${student.studentNo}`);

    res.json({
      success: true,
      message: '删除学生成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除学生失败:', error);
    res.status(500).json({
      success: false,
      message: '删除学生失败',
      error: error.message
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
