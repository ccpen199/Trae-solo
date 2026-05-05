import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Question, Answer } from '../entities/Question';
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();
const questionRepository = () => AppDataSource.getRepository(Question);
const answerRepository = () => AppDataSource.getRepository(Answer);

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const keyword = req.query.keyword as string;
    const isSolved = req.query.isSolved as string;
    const sort = req.query.sort as string || 'newest';

    const queryBuilder = questionRepository()
      .createQueryBuilder('question')
      .where('question.isActive = :isActive', { isActive: true });

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('question.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('question.content LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('question.tags LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    if (isSolved !== undefined) {
      queryBuilder.andWhere('question.isSolved = :isSolved', { isSolved: isSolved === 'true' });
    }

    switch (sort) {
      case 'hot':
        queryBuilder.orderBy('question.viewCount', 'DESC')
          .addOrderBy('question.likeCount', 'DESC');
        break;
      case 'unanswered':
        queryBuilder.andWhere('question.answerCount = 0');
        queryBuilder.orderBy('question.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('question.createdAt', 'DESC');
    }

    const [questions, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: questions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取问题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/', authMiddleware, [
  body('title').isLength({ min: 5, max: 100 }).withMessage('标题长度需在5-100之间'),
  body('content').isLength({ min: 10 }).withMessage('内容至少10个字符')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors.array()
      });
    }

    const { title, content, tags } = req.body;

    const question = questionRepository().create({
      userId: req.user!.id,
      title,
      content,
      tags
    });

    await questionRepository().save(question);

    res.status(201).json({
      success: true,
      message: '问题发布成功',
      data: question
    });
  } catch (error) {
    console.error('发布问题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await questionRepository().findOne({
      where: { id, isActive: true }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    question.viewCount++;
    await questionRepository().save(question);

    const answers = await answerRepository().find({
      where: { questionId: id },
      order: { isAdopted: 'DESC', createdAt: 'ASC' }
    });

    res.json({
      success: true,
      data: {
        question,
        answers
      }
    });
  } catch (error) {
    console.error('获取问题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/answers', authMiddleware, [
  body('content').isLength({ min: 5 }).withMessage('回答至少5个字符')
], async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors.array()
      });
    }

    const question = await questionRepository().findOne({
      where: { id, isActive: true }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const answer = answerRepository().create({
      questionId: id,
      userId: req.user!.id,
      content
    });

    await answerRepository().save(answer);

    question.answerCount++;
    await questionRepository().save(question);

    res.status(201).json({
      success: true,
      message: '回答发布成功',
      data: answer
    });
  } catch (error) {
    console.error('发布回答错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
