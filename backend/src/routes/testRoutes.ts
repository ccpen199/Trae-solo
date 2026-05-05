import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { TestPaper, TestQuestion, TestRecord } from '../entities/Test';
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();
const testPaperRepository = () => AppDataSource.getRepository(TestPaper);
const testQuestionRepository = () => AppDataSource.getRepository(TestQuestion);
const testRecordRepository = () => AppDataSource.getRepository(TestRecord);

router.get('/papers', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const queryBuilder = testPaperRepository()
      .createQueryBuilder('testPaper')
      .where('testPaper.isActive = :isActive', { isActive: true })
      .orderBy('testPaper.createdAt', 'DESC');

    const [papers, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: papers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取试卷列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/papers/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paper = await testPaperRepository().findOne({
      where: { id, isActive: true },
      relations: ['questions']
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在'
      });
    }

    let userRecord = null;
    if (req.user) {
      userRecord = await testRecordRepository().findOne({
        where: { userId: req.user.id, testPaperId: id }
      });
    }

    const questions = paper.questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));

    res.json({
      success: true,
      data: {
        paper: {
          ...paper,
          questions: undefined
        },
        questions,
        userRecord
      }
    });
  } catch (error) {
    console.error('获取试卷详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/papers/:id/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, duration } = req.body;

    const paper = await testPaperRepository().findOne({
      where: { id, isActive: true },
      relations: ['questions']
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在'
      });
    }

    let totalScore = 0;
    const results: Record<string, boolean> = {};

    const answerMap: Record<string, string> = answers || {};

    for (const question of paper.questions) {
      const userAnswer = answerMap[question.id] || '';
      const isCorrect = userAnswer === question.correctAnswer;
      results[question.id] = isCorrect;

      if (isCorrect) {
        totalScore += question.score;
      }
    }

    const isPassed = totalScore >= paper.passScore;

    let testRecord = await testRecordRepository().findOne({
      where: { userId: req.user!.id, testPaperId: id }
    });

    if (testRecord) {
      testRecord.score = totalScore;
      testRecord.isPassed = isPassed;
      testRecord.answers = JSON.stringify(answerMap);
      testRecord.duration = duration || 0;
      testRecord.attemptCount++;
    } else {
      testRecord = testRecordRepository().create({
        userId: req.user!.id,
        testPaperId: id,
        score: totalScore,
        isPassed,
        answers: JSON.stringify(answerMap),
        duration: duration || 0
      });
    }

    await testRecordRepository().save(testRecord);

    res.json({
      success: true,
      message: isPassed ? '恭喜通过测试！' : '测试未通过，继续加油！',
      data: {
        score: totalScore,
        totalScore: paper.totalScore,
        passScore: paper.passScore,
        isPassed,
        results
      }
    });
  } catch (error) {
    console.error('提交测试错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await testRecordRepository().find({
      where: { userId: req.user!.id },
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取测试记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
