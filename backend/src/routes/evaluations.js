const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, Role, EvaluationType } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { semester, type, studentId, page = 1, pageSize = 20 } = req.query;
    const user = req.user;

    let where = {};

    if (user.role === Role.STUDENT || user.role === Role.CLASS_MONITOR) {
      where.studentId = user.id;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (semester) {
      where.semester = semester;
    }

    if (type) {
      where.type = type;
    }

    const total = await prisma.evaluation.count({ where });

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true
          }
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: [
        { semester: 'desc' },
        { type: 'asc' }
      ],
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: {
        list: evaluations,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { semester, studentId } = req.query;
    const user = req.user;

    const targetStudentId = (user.role === Role.STUDENT || user.role === Role.CLASS_MONITOR) 
      ? user.id 
      : studentId;

    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        message: '请指定学生ID'
      });
    }

    const where = {
      studentId: targetStudentId
    };

    if (semester) {
      where.semester = semester;
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      orderBy: { semester: 'desc' }
    });

    const groupedBySemester = {};
    evaluations.forEach(evalItem => {
      if (!groupedBySemester[evalItem.semester]) {
        groupedBySemester[evalItem.semester] = {
          semester: evalItem.semester,
          types: [],
          totalScore: 0,
          maxScore: 0,
          average: 0
        };
      }
      groupedBySemester[evalItem.semester].types.push({
        type: evalItem.type,
        score: evalItem.score,
        maxScore: evalItem.maxScore,
        comment: evalItem.comment
      });
      groupedBySemester[evalItem.semester].totalScore += evalItem.score;
      groupedBySemester[evalItem.semester].maxScore += evalItem.maxScore;
    });

    const summary = Object.values(groupedBySemester).map(sem => ({
      ...sem,
      average: sem.maxScore > 0 ? Math.round((sem.totalScore / sem.maxScore) * 1000) / 10 : 0
    }));

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            classId: true,
            department: true
          }
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '综合测评记录不存在'
      });
    }

    if ((req.user.role === Role.STUDENT || req.user.role === Role.CLASS_MONITOR) 
        && evaluation.studentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此测评记录'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { studentId, semester, type, score, maxScore, comment } = req.body;

    if (!studentId || !semester || !type || score === undefined) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的测评信息'
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        studentId_semester_type: {
          studentId,
          semester,
          type
        }
      }
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: '该学期该类型的测评已存在'
      });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        semester,
        type,
        score: parseFloat(score),
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        comment,
        evaluatorId: req.user.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '测评记录已创建',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, maxScore, comment } = req.body;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id }
    });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '测评记录不存在'
      });
    }

    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        score: score !== undefined ? parseFloat(score) : evaluation.score,
        maxScore: maxScore !== undefined ? parseFloat(maxScore) : evaluation.maxScore,
        comment: comment !== undefined ? comment : evaluation.comment,
        evaluatorId: req.user.id
      }
    });

    res.json({
      success: true,
      message: '测评记录已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id }
    });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '测评记录不存在'
      });
    }

    await prisma.evaluation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '测评记录已删除'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch', authenticate, requireTeacher, async (req, res, next) => {
  try {
    const { records, semester } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的测评记录'
      });
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { studentId, type, score, maxScore, comment } = record;
        
        const existingEvaluation = await prisma.evaluation.findUnique({
          where: {
            studentId_semester_type: {
              studentId,
              semester,
              type
            }
          }
        });

        if (existingEvaluation) {
          const updated = await prisma.evaluation.update({
            where: { id: existingEvaluation.id },
            data: {
              score: parseFloat(score),
              maxScore: maxScore ? parseFloat(maxScore) : 100,
              comment,
              evaluatorId: req.user.id
            }
          });
          results.push({ studentId, type, status: 'updated', data: updated });
        } else {
          const created = await prisma.evaluation.create({
            data: {
              studentId,
              semester,
              type,
              score: parseFloat(score),
              maxScore: maxScore ? parseFloat(maxScore) : 100,
              comment,
              evaluatorId: req.user.id
            }
          });
          results.push({ studentId, type, status: 'created', data: created });
        }
      } catch (err) {
        errors.push({ studentId: record.studentId, type: record.type, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `批量处理完成，成功: ${results.length}, 失败: ${errors.length}`,
      data: {
        results,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
