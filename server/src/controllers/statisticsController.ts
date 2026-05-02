import { Response } from 'express';
import { Exam, ExamStatus } from '../models/Exam';
import { UserExam, UserExamStatus } from '../models/UserExam';
import { UserAnswer } from '../models/UserAnswer';
import { Question } from '../models/Question';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { ExamPaperQuestion } from '../models/ExamPaperQuestion';
import { User, UserRole } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { sequelize } from '../database/sequelize';
import { Op, QueryTypes } from 'sequelize';

export interface ScoreSegment {
  min: number;
  max: number;
  count: number;
}

export interface ExamStatistics {
  totalExaminees: number;
  participatedCount: number;
  referenceRate: number;
  passedCount: number;
  passRate: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  scoreSegments: ScoreSegment[];
  questionAnalysis: Array<{
    questionId: string;
    questionTitle: string;
    correctRate: number;
    avgScore: number;
    maxScore: number;
    totalAttempts: number;
  }>;
  knowledgePointAnalysis: Array<{
    knowledgePointId: string;
    knowledgePointName: string;
    correctRate: number;
    avgScore: number;
    totalScore: number;
    questionCount: number;
  }>;
}

export const getExamStatistics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          association: 'examPaper',
          include: [
            {
              association: 'questions',
              include: [{ association: 'question', include: [{ association: 'knowledgePoint' }] }],
            },
          ],
        },
      ],
    });

    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const userExams = await UserExam.findAll({
      where: { examId },
      include: [{ association: 'answers' }],
    });

    const totalExaminees = userExams.length;
    const participatedCount = userExams.filter(
      (ue) => ue.status !== UserExamStatus.NOT_STARTED
    ).length;
    const referenceRate = totalExaminees > 0 ? (participatedCount / totalExaminees) * 100 : 0;

    const gradedExams = userExams.filter(
      (ue) => ue.status === UserExamStatus.GRADED && ue.totalScore !== undefined
    );

    const passedCount = gradedExams.filter((ue) => ue.isPassed).length;
    const passRate = gradedExams.length > 0 ? (passedCount / gradedExams.length) * 100 : 0;

    const scores = gradedExams.map((ue) => ue.totalScore!).filter((s) => s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    const segments = [
      { min: 0, max: 59 },
      { min: 60, max: 69 },
      { min: 70, max: 79 },
      { min: 80, max: 89 },
      { min: 90, max: 100 },
    ];

    const scoreSegments: ScoreSegment[] = segments.map((segment) => ({
      ...segment,
      count: scores.filter((s) => s >= segment.min && s <= segment.max).length,
    }));

    const paperQuestions = (exam.examPaper as any)?.questions as (ExamPaperQuestion & { question: Question })[] | undefined;
    
    const questionAnalysis: ExamStatistics['questionAnalysis'] = [];
    const knowledgePointMap = new Map<string, {
      correctCount: number;
      totalCount: number;
      totalScore: number;
      maxScore: number;
      questionCount: number;
      name: string;
    }>();

    if (paperQuestions) {
      for (const eq of paperQuestions) {
        const question = eq.question as Question;
        
        const allAnswers = userExams
          .map((ue) => (ue.answers as UserAnswer[] | undefined)?.find((a) => a.questionId === question.id))
          .filter((a) => a !== undefined) as UserAnswer[];

        const validAnswers = allAnswers.filter(
          (a) => a.status === UserExamStatus.GRADED || a.isCorrect !== undefined
        );

        const correctCount = validAnswers.filter((a) => a.isCorrect === true).length;
        const totalAttempts = validAnswers.length;
        const correctRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

        const scores = validAnswers.map((a) => a.score).filter((s) => s !== undefined) as number[];
        const avgQuestionScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        questionAnalysis.push({
          questionId: question.id,
          questionTitle: question.title,
          correctRate: Math.round(correctRate * 100) / 100,
          avgScore: Math.round(avgQuestionScore * 100) / 100,
          maxScore: eq.score,
          totalAttempts,
        });

        const kp = (question as any)?.knowledgePoint as KnowledgePoint | undefined;
        if (kp) {
          const existing = knowledgePointMap.get(kp.id) || {
            correctCount: 0,
            totalCount: 0,
            totalScore: 0,
            maxScore: 0,
            questionCount: 0,
            name: kp.name,
          };
          
          existing.correctCount += correctCount;
          existing.totalCount += totalAttempts;
          existing.totalScore += avgQuestionScore * (scores.length || 1);
          existing.maxScore += eq.score;
          existing.questionCount += 1;
          
          knowledgePointMap.set(kp.id, existing);
        }
      }
    }

    const knowledgePointAnalysis: ExamStatistics['knowledgePointAnalysis'] = 
      Array.from(knowledgePointMap.entries()).map(([id, data]) => ({
        knowledgePointId: id,
        knowledgePointName: data.name,
        correctRate: data.totalCount > 0 ? (data.correctCount / data.totalCount) * 100 : 0,
        avgScore: data.questionCount > 0 ? data.totalScore / data.questionCount : 0,
        totalScore: data.maxScore,
        questionCount: data.questionCount,
      }));

    const statistics: ExamStatistics = {
      totalExaminees,
      participatedCount,
      referenceRate: Math.round(referenceRate * 100) / 100,
      passedCount,
      passRate: Math.round(passRate * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100,
      maxScore,
      minScore,
      scoreSegments,
      questionAnalysis,
      knowledgePointAnalysis,
    };

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          description: exam.description,
          totalScore: exam.totalScore,
          passScore: exam.passScore,
          status: exam.status,
        },
        statistics,
      },
    });
  }
);

export const getDashboardStatistics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const totalUsers = await User.count();
    const totalQuestions = await Question.count({ where: { isActive: true } });
    const totalExams = await Exam.count();
    const totalExamPapers = await Exam.count();

    const activeExams = await Exam.findAll({
      where: {
        status: { [Op.in]: [ExamStatus.ONGOING, ExamStatus.PUBLISHED] },
      },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      limit: 10,
      order: [['startTime', 'ASC']],
    });

    const recentExams = await Exam.findAll({
      where: { status: ExamStatus.ENDED },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      limit: 10,
      order: [['endTime', 'DESC']],
    });

    const byRole = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    });

    const roleStats = Object.values(UserRole).reduce(
      (acc, role) => {
        const item = byRole.find((r: { role: string; count: string }) => r.role === role);
        acc[role] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<UserRole, number>
    );

    const userExamStats = {
      total: await UserExam.count(),
      inProgress: await UserExam.count({ where: { status: UserExamStatus.IN_PROGRESS } }),
      submitted: await UserExam.count({ where: { status: UserExamStatus.SUBMITTED } }),
      graded: await UserExam.count({ where: { status: UserExamStatus.GRADED } }),
      hasAnomaly: await UserExam.count({ where: { hasAnomaly: true } }),
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalExams,
          totalExamPapers,
        },
        roleDistribution: roleStats,
        userExamStats,
        activeExams,
        recentExams,
      },
    });
  }
);

export const exportExamResults = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          association: 'userExams',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'username', 'email', 'phone', 'department'],
            },
          ],
        },
      ],
    });

    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const userExams = exam.userExams as (UserExam & { user: User })[] | undefined;

    if (!userExams || userExams.length === 0) {
      res.status(200).json({
        success: true,
        message: '暂无成绩数据',
        data: {
          exam: { id: exam.id, name: exam.name },
          results: [],
        },
      });
      return;
    }

    const results = userExams.map((ue) => ({
      userId: ue.userId,
      username: ue.user?.username,
      name: ue.user?.name,
      email: ue.user?.email,
      phone: ue.user?.phone,
      department: ue.user?.department,
      status: ue.status,
      attemptNumber: ue.attemptNumber,
      startTime: ue.startTime,
      endTime: ue.endTime,
      timeSpent: ue.timeSpent,
      totalScore: ue.totalScore,
      objectiveScore: ue.objectiveScore,
      subjectiveScore: ue.subjectiveScore,
      isPassed: ue.isPassed,
      isLate: ue.isLate,
      screenSwitchCount: ue.screenSwitchCount,
      copyPasteCount: ue.copyPasteCount,
      warningCount: ue.warningCount,
      hasAnomaly: ue.hasAnomaly,
      submittedAt: ue.submittedAt,
      gradedAt: ue.gradedAt,
    }));

    const summary = {
      totalExaminees: results.length,
      participatedCount: results.filter((r) => r.status !== UserExamStatus.NOT_STARTED).length,
      gradedCount: results.filter((r) => r.status === UserExamStatus.GRADED).length,
      passedCount: results.filter((r) => r.isPassed === true).length,
      avgScore:
        results.filter((r) => r.totalScore !== undefined).length > 0
          ? results
              .filter((r) => r.totalScore !== undefined)
              .reduce((sum, r) => sum + (r.totalScore || 0), 0) /
            results.filter((r) => r.totalScore !== undefined).length
          : 0,
      maxScore:
        results.filter((r) => r.totalScore !== undefined).length > 0
          ? Math.max(...results.filter((r) => r.totalScore !== undefined).map((r) => r.totalScore || 0))
          : 0,
      minScore:
        results.filter((r) => r.totalScore !== undefined).length > 0
          ? Math.min(...results.filter((r) => r.totalScore !== undefined).map((r) => r.totalScore || 0))
          : 0,
      hasAnomalyCount: results.filter((r) => r.hasAnomaly).length,
    };

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          description: exam.description,
          totalScore: exam.totalScore,
          passScore: exam.passScore,
        },
        summary,
        results,
      },
    });
  }
);

export const getKnowledgePointAnalysis = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          association: 'examPaper',
          include: [
            {
              association: 'questions',
              include: [{ association: 'question', include: [{ association: 'knowledgePoint' }] }],
            },
          ],
        },
        {
          association: 'userExams',
          include: [{ association: 'answers' }],
        },
      ],
    });

    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const paperQuestions = (exam.examPaper as any)?.questions as (ExamPaperQuestion & { question: Question })[] | undefined;
    const userExams = exam.userExams as UserExam[] | undefined;

    if (!paperQuestions || !userExams) {
      res.status(200).json({
        success: true,
        data: { analysis: [] },
      });
      return;
    }

    const kpMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      totalQuestions: number;
      totalScore: number;
      studentScores: number[];
      correctAttempts: number;
      totalAttempts: number;
    }>();

    for (const eq of paperQuestions) {
      const question = eq.question as Question;
      const kp = (question as any)?.knowledgePoint as KnowledgePoint | undefined;
      
      if (kp) {
        const existing = kpMap.get(kp.id) || {
          id: kp.id,
          name: kp.name,
          code: kp.code,
          totalQuestions: 0,
          totalScore: 0,
          studentScores: [],
          correctAttempts: 0,
          totalAttempts: 0,
        };
        
        existing.totalQuestions += 1;
        existing.totalScore += eq.score;
        
        for (const ue of userExams) {
          const answer = (ue.answers as UserAnswer[] | undefined)?.find(
            (a) => a.questionId === question.id && a.status === UserExamStatus.GRADED
          );
          
          if (answer) {
            existing.totalAttempts += 1;
            if (answer.score !== undefined) {
              existing.studentScores.push(answer.score);
            }
            if (answer.isCorrect === true) {
              existing.correctAttempts += 1;
            }
          }
        }
        
        kpMap.set(kp.id, existing);
      }
    }

    const analysis = Array.from(kpMap.values()).map((kp) => ({
      knowledgePointId: kp.id,
      knowledgePointName: kp.name,
      knowledgePointCode: kp.code,
      totalQuestions: kp.totalQuestions,
      totalScore: kp.totalScore,
      avgScore:
        kp.studentScores.length > 0
          ? Math.round((kp.studentScores.reduce((a, b) => a + b, 0) / kp.studentScores.length) * 100) / 100
          : 0,
      correctRate:
        kp.totalAttempts > 0
          ? Math.round((kp.correctAttempts / kp.totalAttempts) * 10000) / 100
          : 0,
      masteryLevel: calculateMasteryLevel(
        kp.totalAttempts > 0 ? kp.correctAttempts / kp.totalAttempts : 0
      ),
    }));

    res.status(200).json({
      success: true,
      data: {
        exam: { id: exam.id, name: exam.name },
        knowledgePointAnalysis: analysis,
      },
    });
  }
);

function calculateMasteryLevel(correctRate: number): string {
  if (correctRate >= 0.9) return '精通';
  if (correctRate >= 0.8) return '熟练';
  if (correctRate >= 0.7) return '掌握';
  if (correctRate >= 0.6) return '基本掌握';
  if (correctRate >= 0.4) return '了解';
  return '待提高';
}
