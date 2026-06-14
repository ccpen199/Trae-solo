import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { Resume } from '../entities/Resume';
import { resumeParseService } from '../services/resumeParseService';

const router = Router();
const resumeRepository = AppDataSource.getRepository(Resume);

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, keyword } = req.query;

    const queryBuilder = resumeRepository.createQueryBuilder('resume');

    if (keyword) {
      queryBuilder.where(
        'resume.name LIKE :keyword OR resume.expectedPosition LIKE :keyword',
        { keyword: `%${keyword}%` }
      );
    }

    const pageNum = page ? parseInt(page as string) : 1;
    const size = pageSize ? parseInt(pageSize as string) : 10;
    const skip = (pageNum - 1) * size;

    queryBuilder.skip(skip).take(size).orderBy('resume.updatedAt', 'DESC');

    const [resumes, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: {
        list: resumes,
        total,
        page: pageNum,
        pageSize: size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取简历列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resume = await resumeRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['user']
    });

    if (!resume) {
      res.json({
        success: false,
        message: '简历不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取简历详情失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/:id/parse', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await resumeParseService.parseResume(parseInt(id));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '解析简历失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/:id/parse-result', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resume = await resumeRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!resume) {
      res.json({
        success: false,
        message: '简历不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        resumeId: resume.id,
        parseScore: resume.parseScore,
        parsedData: resume.aiParsedData,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取解析结果失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
