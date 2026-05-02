import { Response } from 'express';
import { Exam, ExamStatus } from '../models/Exam';
import { UserExam, UserExamStatus } from '../models/UserExam';
import { ExamPaper, ExamPaperStatus } from '../models/ExamPaper';
import { ExamPaperQuestion } from '../models/ExamPaperQuestion';
import { Question } from '../models/Question';
import { UserAnswer, AnswerStatus } from '../models/UserAnswer';
import { User, UserRole } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { sequelize } from '../database/sequelize';
import { Op } from 'sequelize';
import { autoGradingEngine } from '../engines/AutoGradingEngine';
import { antiCheatEngine, CheatingEvent, CheatingDetectionType } from '../engines/AntiCheatEngine';

export const createExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const {
      name,
      description,
      examPaperId,
      startTime,
      endTime,
      duration,
      totalScore,
      passScore,
      allowLateEntry,
      lateEntryMinutes,
      showResultImmediately,
      allowReview,
      isRandomOrder,
      maxAttempts,
      examineeIds,
    } = req.body;

    const examPaper = await ExamPaper.findByPk(examPaperId);
    if (!examPaper) {
      throw new AppError('试卷不存在', 404);
    }

    if (examPaper.status !== ExamPaperStatus.PUBLISHED) {
      throw new AppError('只能使用已发布的试卷创建考试', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const exam = await Exam.create(
        {
          name,
          description,
          examPaperId,
          creatorId: req.user.id,
          status: ExamStatus.DRAFT,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration,
          totalScore: totalScore ?? examPaper.totalScore,
          passScore: passScore ?? 60,
          allowLateEntry: allowLateEntry ?? false,
          lateEntryMinutes: lateEntryMinutes ?? 0,
          showResultImmediately: showResultImmediately ?? false,
          allowReview: allowReview ?? false,
          isRandomOrder: isRandomOrder ?? false,
          maxAttempts: maxAttempts ?? 1,
        },
        { transaction }
      );

      if (examineeIds && Array.isArray(examineeIds) && examineeIds.length > 0) {
        const userExams = examineeIds.map((userId: string) => ({
          examId: exam.id,
          userId,
          status: UserExamStatus.NOT_STARTED,
          attemptNumber: 1,
          isLate: false,
          screenSwitchCount: 0,
          copyPasteCount: 0,
          warningCount: 0,
          hasAnomaly: false,
        }));

        await UserExam.bulkCreate(userExams, { transaction });
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: '考试创建成功',
        data: {
          exam,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const getExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const exam = await Exam.findByPk(id, {
      include: [
        { model: ExamPaper, as: 'examPaper' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
      ],
    });

    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        exam,
      },
    });
  }
);

export const getExams = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { status, creatorId, keyword, page, pageSize } = req.query;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (req.user) {
      if (req.user.role === UserRole.EXAMINEE) {
        const userExams = await UserExam.findAll({
          where: { userId: req.user.id },
          attributes: ['examId'],
        });
        const examIds = userExams.map((ue) => ue.examId);
        if (examIds.length > 0) {
          where.id = { [Op.in]: examIds };
        } else {
          where.id = { [Op.eq]: null };
        }
      } else if (req.user.role !== UserRole.ADMIN) {
        where.creatorId = req.user.id;
      }
    }

    if (creatorId && req.user?.role === UserRole.ADMIN) {
      where.creatorId = creatorId;
    }

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 20;
    const offset = (currentPage - 1) * limit;

    const { count, rows } = await Exam.findAndCountAll({
      where,
      include: [
        { model: ExamPaper, as: 'examPaper' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
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

export const updateExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;
    const updateData = req.body;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    if (exam.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权修改此考试', 403);
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new AppError('只能修改草稿状态的考试', 400);
    }

    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    await exam.update(updateData);

    res.status(200).json({
      success: true,
      message: '考试更新成功',
      data: {
        exam,
      },
    });
  }
);

export const publishExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    if (exam.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权操作此考试', 403);
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new AppError('只能发布草稿状态的考试', 400);
    }

    await exam.update({ status: ExamStatus.PUBLISHED });

    res.status(200).json({
      success: true,
      message: '考试发布成功',
      data: {
        exam,
      },
    });
  }
);

export const startExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { examId } = req.params;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          model: ExamPaper,
          as: 'examPaper',
          include: [
            {
              model: ExamPaperQuestion,
              as: 'questions',
              include: [{ model: Question, as: 'question' }],
            },
          ],
        },
      ],
    });

    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const now = new Date();
    if (exam.status === ExamStatus.PUBLISHED) {
      if (now < exam.startTime) {
        throw new AppError('考试尚未开始', 400);
      }
      if (now > exam.endTime) {
        throw new AppError('考试已结束', 400);
      }
    } else if (exam.status !== ExamStatus.ONGOING) {
      throw new AppError('考试未开放', 400);
    }

    let userExam = await UserExam.findOne({
      where: { examId, userId: req.user.id },
    });

    if (!userExam) {
      throw new AppError('您没有参加此考试的权限', 403);
    }

    if (userExam.status === UserExamStatus.IN_PROGRESS) {
      throw new AppError('考试已在进行中', 400);
    }

    if (userExam.status === UserExamStatus.SUBMITTED || 
        userExam.status === UserExamStatus.GRADED ||
        userExam.status === UserExamStatus.FORCE_SUBMITTED) {
      if (userExam.attemptNumber >= exam.maxAttempts) {
        throw new AppError('已达到最大考试次数', 400);
      }
    }

    const isLate = now > exam.startTime;
    if (isLate && !exam.allowLateEntry) {
      throw new AppError('考试已开始，不允许迟到入场', 400);
    }
    if (isLate && exam.allowLateEntry) {
      const lateMinutes = Math.floor((now.getTime() - exam.startTime.getTime()) / 60000);
      if (lateMinutes > exam.lateEntryMinutes) {
        throw new AppError(`迟到时间超过允许范围（最多${exam.lateEntryMinutes}分钟）`, 400);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      if (
        userExam.status === UserExamStatus.SUBMITTED ||
        userExam.status === UserExamStatus.GRADED ||
        userExam.status === UserExamStatus.FORCE_SUBMITTED
      ) {
        userExam = await UserExam.create(
          {
            examId,
            userId: req.user!.id,
            status: UserExamStatus.IN_PROGRESS,
            attemptNumber: userExam.attemptNumber + 1,
            startTime: now,
            isLate,
            screenSwitchCount: 0,
            copyPasteCount: 0,
            warningCount: 0,
            hasAnomaly: false,
          },
          { transaction }
        );
      } else {
        await userExam.update(
          {
            status: UserExamStatus.IN_PROGRESS,
            startTime: now,
            isLate,
            screenSwitchCount: 0,
            copyPasteCount: 0,
            warningCount: 0,
            hasAnomaly: false,
          },
          { transaction }
        );
      }

      const examPaperQuestions = (exam.examPaper as ExamPaper)?.questions as (ExamPaperQuestion & { question: Question })[] | undefined;
      
      if (examPaperQuestions && examPaperQuestions.length > 0) {
        let questions = [...examPaperQuestions];
        
        if (exam.isRandomOrder) {
          questions = questions.sort(() => Math.random() - 0.5);
        }

        const userAnswers = questions.map((eq, index) => ({
          userExamId: userExam!.id,
          questionId: eq.questionId,
          examPaperQuestionId: eq.id,
          maxScore: eq.score,
          status: AnswerStatus.SAVED,
          isAutoGraded: false,
        }));

        await UserAnswer.bulkCreate(userAnswers, { transaction });
      }

      if (exam.status === ExamStatus.PUBLISHED) {
        await exam.update({ status: ExamStatus.ONGOING }, { transaction });
      }

      await transaction.commit();

      const paperQuestions = (exam.examPaper as ExamPaper)?.questions as (ExamPaperQuestion & { question: Question })[] | undefined;
      
      const examQuestions = paperQuestions?.map((eq) => ({
        id: eq.questionId,
        examPaperQuestionId: eq.id,
        title: (eq.question as Question)?.title,
        type: (eq.question as Question)?.type,
        difficulty: (eq.question as Question)?.difficulty,
        score: eq.score,
        content: (eq.question as Question)?.content,
        options: (eq.question as Question)?.options?.map((o) => ({
          id: o.id,
          label: o.label,
          content: o.content,
        })),
        sortOrder: eq.sortOrder,
        section: eq.section,
      }));

      res.status(200).json({
        success: true,
        message: '考试开始成功',
        data: {
          userExam: {
            id: userExam.id,
            examId: userExam.examId,
            status: userExam.status,
            startTime: userExam.startTime,
            duration: exam.duration,
            endTime: exam.endTime,
            isLate: userExam.isLate,
          },
          exam: {
            id: exam.id,
            name: exam.name,
            description: exam.description,
            totalScore: exam.totalScore,
            passScore: exam.passScore,
            duration: exam.duration,
            allowReview: exam.allowReview,
          },
          questions: examQuestions,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const saveAnswer = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userExamId } = req.params;
    const { questionId, answerContent, answerOptions } = req.body;

    const userExam = await UserExam.findByPk(userExamId);
    if (!userExam) {
      throw new AppError('考试记录不存在', 404);
    }

    if (userExam.userId !== req.user.id) {
      throw new AppError('无权操作此考试', 403);
    }

    if (userExam.status !== UserExamStatus.IN_PROGRESS) {
      throw new AppError('考试已结束或未开始', 400);
    }

    const userAnswer = await UserAnswer.findOne({
      where: { userExamId, questionId },
    });

    if (!userAnswer) {
      throw new AppError('答题记录不存在', 404);
    }

    await userAnswer.update({
      answerContent,
      answerOptions,
      status: AnswerStatus.SAVED,
      autoSavedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: '答案保存成功',
      data: {
        userAnswer,
      },
    });
  }
);

export const submitExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userExamId } = req.params;

    const userExam = await UserExam.findByPk(userExamId, {
      include: [{ association: 'answers' }],
    });

    if (!userExam) {
      throw new AppError('考试记录不存在', 404);
    }

    if (userExam.userId !== req.user.id) {
      throw new AppError('无权操作此考试', 403);
    }

    if (
      userExam.status === UserExamStatus.SUBMITTED ||
      userExam.status === UserExamStatus.GRADED ||
      userExam.status === UserExamStatus.FORCE_SUBMITTED
    ) {
      throw new AppError('考试已提交', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const now = new Date();
      const timeSpent = userExam.startTime
        ? Math.floor((now.getTime() - userExam.startTime.getTime()) / 1000)
        : 0;

      const answers = userExam.answers as UserAnswer[] | undefined;
      if (answers) {
        for (const answer of answers) {
          await answer.update(
            {
              status: AnswerStatus.SUBMITTED,
              submittedAt: now,
            },
            { transaction }
          );
        }
      }

      await userExam.update(
        {
          status: UserExamStatus.SUBMITTED,
          endTime: now,
          timeSpent,
          submittedAt: now,
        },
        { transaction }
      );

      const gradingResult = await autoGradingEngine.autoGradeExam(userExamId, transaction);

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: '考试提交成功',
        data: {
          userExam: {
            id: userExam.id,
            status: gradingResult.pendingManualCount > 0 ? UserExamStatus.SUBMITTED : UserExamStatus.GRADED,
            endTime: userExam.endTime,
            timeSpent: userExam.timeSpent,
            submittedAt: userExam.submittedAt,
            objectiveScore: gradingResult.objectiveScore,
            totalScore: gradingResult.pendingManualCount > 0 ? undefined : gradingResult.totalScore,
          },
          gradingResult,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const reportAnomaly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userExamId } = req.params;
    const { type, details } = req.body;

    const userExam = await UserExam.findByPk(userExamId);
    if (!userExam) {
      throw new AppError('考试记录不存在', 404);
    }

    if (userExam.userId !== req.user.id) {
      throw new AppError('无权操作此考试', 403);
    }

    const event: CheatingEvent = {
      type: type as CheatingDetectionType,
      userExamId,
      userId: req.user.id,
      examId: userExam.examId,
      timestamp: new Date(),
      ...details,
    };

    const result = await antiCheatEngine.detectAndRecord(event);

    res.status(200).json({
      success: true,
      message: result.shouldWarn ? '检测到异常行为' : '异常已记录',
      data: {
        shouldWarn: result.shouldWarn,
        shouldForceSubmit: result.shouldForceSubmit,
        warningMessage: result.warningMessage,
        severity: result.severity,
      },
    });
  }
);

export const getUserExam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { userExamId } = req.params;

    const userExam = await UserExam.findByPk(userExamId, {
      include: [
        { association: 'exam', include: [{ association: 'examPaper' }] },
        { association: 'user', attributes: ['id', 'name', 'username'] },
        { association: 'answers', include: [{ association: 'question' }] },
        { association: 'anomalyRecords' },
      ],
    });

    if (!userExam) {
      throw new AppError('考试记录不存在', 404);
    }

    if (userExam.userId !== req.user.id && 
        ![UserRole.ADMIN, UserRole.GRADER].includes(req.user.role)) {
      throw new AppError('无权查看此考试记录', 403);
    }

    const gradingDetails = await autoGradingEngine.getGradingDetails(userExamId);

    res.status(200).json({
      success: true,
      data: {
        userExam,
        gradingDetails,
      },
    });
  }
);

export const addExaminees = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { examId } = req.params;
    const { examineeIds } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    if (exam.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权操作此考试', 403);
    }

    if (!Array.isArray(examineeIds) || examineeIds.length === 0) {
      throw new AppError('请提供有效的考生ID列表', 400);
    }

    const existingUserExams = await UserExam.findAll({
      where: { examId, userId: { [Op.in]: examineeIds } },
    });

    const existingUserIds = existingUserExams.map((ue) => ue.userId);
    const newUserIds = examineeIds.filter((id: string) => !existingUserIds.includes(id));

    if (newUserIds.length > 0) {
      const userExams = newUserIds.map((userId: string) => ({
        examId,
        userId,
        status: UserExamStatus.NOT_STARTED,
        attemptNumber: 1,
        isLate: false,
        screenSwitchCount: 0,
        copyPasteCount: 0,
        warningCount: 0,
        hasAnomaly: false,
      }));

      await UserExam.bulkCreate(userExams);
    }

    res.status(200).json({
      success: true,
      message: `成功添加 ${newUserIds.length} 名考生`,
      data: {
        addedCount: newUserIds.length,
        existingCount: existingUserIds.length,
      },
    });
  }
);

export const getExamExaminees = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { status, keyword, page, pageSize } = req.query;

    const where: Record<string, unknown> = { examId };

    if (status) {
      where.status = status;
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 20;
    const offset = (currentPage - 1) * limit;

    const userWhere: Record<string, unknown> = {};
    if (keyword) {
      userWhere[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { username: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    const { count, rows } = await UserExam.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email', 'phone', 'department'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const statistics = {
      total: count,
      notStarted: await UserExam.count({ where: { examId, status: UserExamStatus.NOT_STARTED } }),
      inProgress: await UserExam.count({ where: { examId, status: UserExamStatus.IN_PROGRESS } }),
      submitted: await UserExam.count({ where: { examId, status: UserExamStatus.SUBMITTED } }),
      graded: await UserExam.count({ where: { examId, status: UserExamStatus.GRADED } }),
      hasAnomaly: await UserExam.count({ where: { examId, hasAnomaly: true } }),
    };

    res.status(200).json({
      success: true,
      data: {
        examinees: rows,
        statistics,
        total: count,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  }
);
