const db = require('../models');
const logger = require('../utils/logger');
const { calculateLevel, calculatePoints, calculateCreditsEarned, calculateClassStatistics, calculateGPA } = require('../utils/grade.utils');
const { cache } = require('../config/redis');

const getGrades = async (req, res) => {
  try {
    const { 
      page, pageSize, studentId, courseId, classId, departmentId, 
      term, examType, minScore, maxScore, level 
    } = req.query;
    
    const user = req.user;
    const where = {};
    
    // 学生只能看自己的成绩
    if (user.roleCode === 'STUDENT') {
      const student = await db.Student.findOne({
        where: { userId: user.id }
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: '未找到对应的学生信息'
        });
      }
      where.studentId = student.id;
    } else {
      if (studentId) where.studentId = studentId;
    }
    
    if (courseId) where.courseId = courseId;
    if (term) where.term = term;
    if (examType) where.examType = examType;
    if (level) where.level = level;
    
    if (minScore !== undefined) {
      where.score = { [db.Sequelize.Op.gte]: parseFloat(minScore) };
    }
    if (maxScore !== undefined) {
      where.score = { 
        ...where.score,
        [db.Sequelize.Op.lte]: parseFloat(maxScore) 
      };
    }

    const includeOptions = [
      {
        model: db.Student,
        as: 'student',
        include: [{
          model: db.Class,
          as: 'classInfo',
          include: [{
            model: db.Department,
            as: 'department'
          }]
        }]
      },
      {
        model: db.Course,
        as: 'course',
        include: [{
          model: db.User,
          as: 'teacher',
          attributes: ['id', 'username', 'name']
        }]
      }
    ];

    // 按班级或系别过滤需要处理关联
    if (classId) {
      includeOptions[0].where = { classId };
    }
    
    if (departmentId && !classId) {
      includeOptions[0].include[0].where = { departmentId };
    }

    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      const { count, rows } = await db.Grade.findAndCountAll({
        where,
        include: includeOptions,
        offset,
        limit,
        order: [['createdAt', 'DESC']]
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
      const grades = await db.Grade.findAll({
        where,
        include: includeOptions,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: grades
      });
    }
  } catch (error) {
    logger.error('获取成绩列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成绩列表失败',
      error: error.message
    });
  }
};

const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const grade = await db.Grade.findOne({
      where: { id },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [{
            model: db.Class,
            as: 'classInfo',
            include: [{
              model: db.Department,
              as: 'department'
            }]
          }]
        },
        {
          model: db.Course,
          as: 'course',
          include: [{
            model: db.User,
            as: 'teacher',
            attributes: ['id', 'username', 'name']
          }]
        },
        {
          model: db.GradeChangeLog,
          as: 'changeLogs',
          include: [{
            model: db.User,
            as: 'operator',
            attributes: ['id', 'username', 'name']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '成绩不存在'
      });
    }

    // 学生只能看自己的成绩
    if (user.roleCode === 'STUDENT') {
      const student = await db.Student.findOne({
        where: { userId: user.id }
      });
      if (!student || grade.studentId !== student.id) {
        return res.status(403).json({
          success: false,
          message: '无权查看此成绩'
        });
      }
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    logger.error('获取成绩详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成绩详情失败',
      error: error.message
    });
  }
};

const createGrade = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { studentId, courseId, score, term, examType = '正常考试', remark, reason } = req.body;
    const operatorId = req.user.id;

    if (!studentId || !courseId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学生和课程不能为空'
      });
    }

    // 检查学生和课程是否存在
    const student = await db.Student.findByPk(studentId, { transaction });
    if (!student) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学生不存在'
      });
    }

    const course = await db.Course.findByPk(courseId, { transaction });
    if (!course) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 检查是否已存在
    const existingGrade = await db.Grade.findOne({
      where: { studentId, courseId, examType },
      transaction
    });
    if (existingGrade) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '该学生该考试类型的成绩已存在，请使用更新操作'
      });
    }

    // 计算等级和绩点
    const level = score !== undefined ? calculateLevel(score) : null;
    const points = score !== undefined ? calculatePoints(score) : null;
    const credits = score !== undefined && course.credits
      ? calculateCreditsEarned(score, course.credits)
      : 0;

    const grade = await db.Grade.create({
      studentId,
      courseId,
      score,
      level,
      points,
      credits,
      term: term || course.term,
      examType,
      remark
    }, { transaction });

    // 记录变更日志
    await db.GradeChangeLog.create({
      gradeId: grade.id,
      operatorId,
      operationType: 'CREATE',
      newValue: JSON.stringify(grade.toJSON()),
      reason: reason || '新建成绩',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    logger.info(`创建成绩成功 - 学生ID: ${studentId}, 课程ID: ${courseId}`);

    const newGrade = await db.Grade.findOne({
      where: { id: grade.id },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [{
            model: db.Class,
            as: 'classInfo'
          }]
        },
        {
          model: db.Course,
          as: 'course'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '创建成绩成功',
      data: newGrade
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('创建成绩失败:', error);
    res.status(500).json({
      success: false,
      message: '创建成绩失败',
      error: error.message
    });
  }
};

const updateGrade = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { score, term, examType, isLocked, remark, reason } = req.body;
    const operatorId = req.user.id;

    const grade = await db.Grade.findOne({
      where: { id },
      include: [{
        model: db.Course,
        as: 'course'
      }],
      transaction
    });
    
    if (!grade) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '成绩不存在'
      });
    }

    // 检查是否锁定
    if (grade.isLocked) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '成绩已锁定，无法修改'
      });
    }

    const oldValue = grade.toJSON();

    const updateData = {};
    
    if (score !== undefined) {
      updateData.score = score;
      updateData.level = calculateLevel(score);
      updateData.points = calculatePoints(score);
      updateData.credits = grade.course?.credits 
        ? calculateCreditsEarned(score, grade.course.credits)
        : 0;
    }
    
    if (term !== undefined) updateData.term = term;
    if (examType !== undefined) updateData.examType = examType;
    if (isLocked !== undefined) updateData.isLocked = isLocked;
    if (remark !== undefined) updateData.remark = remark;

    await grade.update(updateData, { transaction });

    // 记录变更日志
    await db.GradeChangeLog.create({
      gradeId: grade.id,
      operatorId,
      operationType: 'UPDATE',
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(grade.toJSON()),
      reason: reason || '修改成绩',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    logger.info(`更新成绩成功 - ID: ${id}`);

    const updatedGrade = await db.Grade.findOne({
      where: { id },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [{
            model: db.Class,
            as: 'classInfo'
          }]
        },
        {
          model: db.Course,
          as: 'course'
        }
      ]
    });

    res.json({
      success: true,
      message: '更新成绩成功',
      data: updatedGrade
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('更新成绩失败:', error);
    res.status(500).json({
      success: false,
      message: '更新成绩失败',
      error: error.message
    });
  }
};

const deleteGrade = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const operatorId = req.user.id;
    const { reason } = req.body;

    const grade = await db.Grade.findByPk(id, { transaction });
    if (!grade) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '成绩不存在'
      });
    }

    if (grade.isLocked) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '成绩已锁定，无法删除'
      });
    }

    const oldValue = grade.toJSON();

    // 记录变更日志
    await db.GradeChangeLog.create({
      gradeId: grade.id,
      operatorId,
      operationType: 'DELETE',
      oldValue: JSON.stringify(oldValue),
      reason: reason || '删除成绩',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, { transaction });

    await grade.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除成绩成功 - ID: ${id}`);

    res.json({
      success: true,
      message: '删除成绩成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除成绩失败:', error);
    res.status(500).json({
      success: false,
      message: '删除成绩失败',
      error: error.message
    });
  }
};

const getMyGrades = async (req, res) => {
  try {
    const user = req.user;
    const { term } = req.query;

    const student = await db.Student.findOne({
      where: { userId: user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的学生信息'
      });
    }

    const where = { studentId: student.id };
    if (term) where.term = term;

    const grades = await db.Grade.findAll({
      where,
      include: [
        {
          model: db.Course,
          as: 'course',
          include: [{
            model: db.Department,
            as: 'department'
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const gpa = calculateGPA(grades);
    const totalCredits = grades.reduce((sum, g) => sum + (g.credits || 0), 0);
    const totalCourses = grades.length;
    const passedCourses = grades.filter(g => (g.score || 0) >= 60).length;

    res.json({
      success: true,
      data: {
        student: {
          studentNo: student.studentNo,
          name: student.name
        },
        gpa: parseFloat(gpa.toFixed(2)),
        totalCredits,
        totalCourses,
        passedCourses,
        grades
      }
    });
  } catch (error) {
    logger.error('获取我的成绩失败:', error);
    res.status(500).json({
      success: false,
      message: '获取我的成绩失败',
      error: error.message
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    const { courseId, classId, term } = req.query;

    if (!courseId && !classId) {
      return res.status(400).json({
        success: false,
        message: '请指定课程或班级进行统计'
      });
    }

    const where = {};
    if (courseId) where.courseId = courseId;
    if (term) where.term = term;

    const includeOptions = [
      {
        model: db.Student,
        as: 'student',
        include: [{
          model: db.Class,
          as: 'classInfo',
          include: [{
            model: db.Department,
            as: 'department'
          }]
        }]
      },
      {
        model: db.Course,
        as: 'course'
      }
    ];

    if (classId) {
      includeOptions[0].where = { classId };
    }

    const grades = await db.Grade.findAll({
      where,
      include: includeOptions
    });

    const statistics = calculateClassStatistics(grades);

    res.json({
      success: true,
      data: {
        ...statistics,
        totalStudents: grades.length
      }
    });
  } catch (error) {
    logger.error('获取成绩统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成绩统计失败',
      error: error.message
    });
  }
};

const batchCreateGrades = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { grades } = req.body;
    const operatorId = req.user.id;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '成绩数据不能为空'
      });
    }

    const createdGrades = [];
    const errors = [];

    for (let i = 0; i < grades.length; i++) {
      const gradeData = grades[i];
      const { studentId, courseId, score, term, examType = '正常考试', remark } = gradeData;

      if (!studentId || !courseId) {
        errors.push(`第${i + 1}条数据：学生和课程不能为空`);
        continue;
      }

      // 检查学生和课程是否存在
      const student = await db.Student.findByPk(studentId, { transaction });
      if (!student) {
        errors.push(`第${i + 1}条数据：学生不存在`);
        continue;
      }

      const course = await db.Course.findByPk(courseId, { transaction });
      if (!course) {
        errors.push(`第${i + 1}条数据：课程不存在`);
        continue;
      }

      // 检查是否已存在
      const existingGrade = await db.Grade.findOne({
        where: { studentId, courseId, examType },
        transaction
      });
      if (existingGrade) {
        errors.push(`第${i + 1}条数据：学生 ${student.studentNo} 该考试类型的成绩已存在`);
        continue;
      }

      // 计算等级和绩点
      const level = score !== undefined ? calculateLevel(score) : null;
      const points = score !== undefined ? calculatePoints(score) : null;
      const credits = score !== undefined && course.credits
        ? calculateCreditsEarned(score, course.credits)
        : 0;

      const grade = await db.Grade.create({
        studentId,
        courseId,
        score,
        level,
        points,
        credits,
        term: term || course.term,
        examType,
        remark
      }, { transaction });

      // 记录变更日志
      await db.GradeChangeLog.create({
        gradeId: grade.id,
        operatorId,
        operationType: 'CREATE',
        newValue: JSON.stringify(grade.toJSON()),
        reason: '批量新建成绩',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, { transaction });

      createdGrades.push(grade);
    }

    await transaction.commit();

    logger.info(`批量创建成绩成功 - 成功: ${createdGrades.length}, 失败: ${errors.length}`);

    res.status(201).json({
      success: true,
      message: `成功创建 ${createdGrades.length} 条成绩`,
      data: {
        created: createdGrades.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('批量创建成绩失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建成绩失败',
      error: error.message
    });
  }
};

module.exports = {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getMyGrades,
  getStatistics,
  batchCreate: batchCreateGrades
};
