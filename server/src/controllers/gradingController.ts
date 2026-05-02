import { Response } from 'express';
import { autoGradingEngine } from '../engines/AutoGradingEngine';
import { UserExam, UserExamStatus } from '../models/UserExam';
import { UserAnswer, AnswerStatus } from '../models/UserAnswer';
import { GradingRecord, GradingStatus } from '../models/GradingRecord';
import { User, UserRole } from '../models/User';
import { Exam } from '../models/Exam';
import { Question } from '../models/Question';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { sequelize } from '../database/sequelize';
import { Op, QueryTypes } from 'sequelize';

export const getPendingGradings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId, page, pageSize } = req.query;

    const where: Record<string, unknown> = {
      status: UserExamStatus.SUBMITTED,
    };

    if (examId) {
      where.examId = examId;
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 20;
    const offset = (currentPage - 1) * limit;

    const { count, rows } = await UserExam.findAndCountAll({
      where,
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'totalScore', 'passScore'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'department'],
        },
      ],
      limit,
      offset,
      order: [['submittedAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  }
);

export const getGradingDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userExamId } = req.params;

    const result = await autoGradingEngine.getGradingDetails(userExamId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const gradeAnswer = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userAnswerId } = req.params;
    const { score, comment } = req.body;

    if (score === undefined) {
      throw new AppError('请提供评分', 400);
    }

    const gradingRecord = await autoGradingEngine.manualGrade(
      userAnswerId,
      req.user.id,
      score,
      comment
    );

    const userAnswer = await UserAnswer.findByPk(userAnswerId);
    if (userAnswer) {
      const allAnswers = await UserAnswer.findAll({
        where: { userExamId: userAnswer.userExamId },
      });

      const allGraded = allAnswers.every((a) => a.status === AnswerStatus.GRADED);

      if (allGraded) {
        const totalScore = allAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
        const objectiveScore = allAnswers
          .filter((a) => a.isAutoGraded)
          .reduce((sum, a) => sum + (a.score || 0), 0);
        const subjectiveScore = allAnswers
          .filter((a) => !a.isAutoGraded)
          .reduce((sum, a) => sum + (a.score || 0), 0);

        const userExam = await UserExam.findByPk(userAnswer.userExamId);
        if (userExam) {
          const exam = await Exam.findByPk(userExam.examId);
          const isPassed = exam ? totalScore >= exam.passScore : undefined;

          await userExam.update({
            status: UserExamStatus.GRADED,
            totalScore,
            objectiveScore,
            subjectiveScore,
            isPassed,
            gradedAt: new Date(),
            gradedById: req.user!.id,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: '评分成功',
      data: {
        gradingRecord,
      },
    });
  }
);

export const batchGrade = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { gradings } = req.body;

    if (!Array.isArray(gradings) || gradings.length === 0) {
      throw new AppError('请提供有效的评分列表', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const results = [];

      for (const grading of gradings) {
        const gradingRecord = await autoGradingEngine.manualGrade(
          grading.userAnswerId,
          req.user!.id,
          grading.score,
          grading.comment,
          transaction
        );
        results.push(gradingRecord);
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `成功评分 ${results.length} 道题目`,
        data: {
          count: results.length,
          gradings: results,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const getGradingStatistics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId, graderId } = req.query;

    const where: Record<string, unknown> = {};
    if (graderId) {
      where.graderId = graderId;
    }

    const userExamWhere: Record<string, unknown> = {};
    if (examId) {
      userExamWhere.examId = examId;
    }

    const totalPending = await UserExam.count({
      where: { ...userExamWhere, status: UserExamStatus.SUBMITTED },
    });

    const totalGraded = await UserExam.count({
      where: { ...userExamWhere, status: UserExamStatus.GRADED },
    });

    const gradingRecords = await GradingRecord.findAll({
      where,
      attributes: [
        'isAutoGraded',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('given_score')), 'avgScore'],
      ],
      group: ['isAutoGraded'],
      raw: true,
    });

    const autoGraded = gradingRecords.find((r: { is_auto_graded: boolean }) => r.is_auto_graded === true) || {
      count: 0,
      avgScore: 0,
    };
    const manualGraded = gradingRecords.find((r: { is_auto_graded: boolean }) => r.is_auto_graded === false) || {
      count: 0,
      avgScore: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalPending,
        totalGraded,
        autoGraded: {
          count: parseInt(autoGraded.count as string),
          avgScore: parseFloat(autoGraded.avgScore as string) || 0,
        },
        manualGraded: {
          count: parseInt(manualGraded.count as string),
          avgScore: parseFloat(manualGraded.avgScore as string) || 0,
        },
      },
    });
  }
);

export const assignGradingTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userExamId, graderId, questionIds } = req.body;

    if (!userExamId || !graderId) {
      throw new AppError('请提供考试记录ID和阅卷人ID', 400);
    }

    const userExam = await UserExam.findByPk(userExamId, {
      include: [
        {
          association: 'answers',
          include: [{ association: 'question' }],
        },
      ],
    });

    if (!userExam) {
      throw new AppError('考试记录不存在', 404);
    }

    const grader = await User.findByPk(graderId);
    if (!grader || grader.role !== UserRole.GRADER) {
      throw new AppError('指定的阅卷人不存在或无阅卷权限', 400);
    }

    const answers = userExam.answers as (UserAnswer & { question: Question })[] | undefined;
    if (!answers || answers.length === 0) {
      throw new AppError('没有需要阅卷的题目', 400);
    }

    let targetAnswers = answers;
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      targetAnswers = answers.filter((a) => questionIds.includes(a.questionId));
    }

    const subjectiveAnswers = targetAnswers.filter(
      (a) => !a.isAutoGraded && a.status !== AnswerStatus.GRADED
    );

    if (subjectiveAnswers.length === 0) {
      throw new AppError('没有可分配的主观题阅卷任务', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const gradingRecords = subjectiveAnswers.map((answer) => ({
        userExamId,
        userAnswerId: answer.id,
        questionId: answer.questionId,
        graderId,
        status: GradingStatus.PENDING,
        maxScore: answer.maxScore,
        isAutoGraded: false,
      }));

      await GradingRecord.bulkCreate(gradingRecords, { transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `成功分配 ${subjectiveAnswers.length} 道题目的阅卷任务`,
        data: {
          assignedCount: subjectiveAnswers.length,
          graderId,
          graderName: grader.name,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const getMyGradingTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { status, examId, page, pageSize } = req.query;

    const where: Record<string, unknown> = {
      graderId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 20;
    const offset = (currentPage - 1) * limit;

    const { count, rows } = await GradingRecord.findAndCountAll({
      where,
      include: [
        {
          model: UserExam,
          as: 'userExam',
          include: [
            {
              model: Exam,
              as: 'exam',
              attributes: ['id', 'name'],
              where: examId ? { id: examId } : undefined,
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'username'],
            },
          ],
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'title', 'type', 'difficulty'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'ASC']],
    });

    const statistics = {
      total: count,
      pending: await GradingRecord.count({
        where: { graderId: req.user.id, status: GradingStatus.PENDING },
      }),
      inProgress: await GradingRecord.count({
        where: { graderId: req.user.id, status: GradingStatus.IN_PROGRESS },
      }),
      completed: await GradingRecord.count({
        where: { graderId: req.user.id, status: GradingStatus.COMPLETED },
      }),
    };

    res.status(200).json({
      success: true,
      data: {
        tasks: rows,
        statistics,
        total: count,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  }
);
