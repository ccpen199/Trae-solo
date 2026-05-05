import { Router, Request, Response } from 'express';
import { Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Job, EmploymentGuide, JobStatus, JobType } from '../entities/Job';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const jobRepository = () => AppDataSource.getRepository(Job);
const guideRepository = () => AppDataSource.getRepository(EmploymentGuide);

router.get('/jobs', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const keyword = req.query.keyword as string;
    const type = req.query.type as JobType;
    const location = req.query.location as string;

    const queryBuilder = jobRepository()
      .createQueryBuilder('job')
      .where('job.status = :status', { status: JobStatus.ACTIVE });

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('job.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('job.companyName LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('job.description LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    if (type) {
      queryBuilder.andWhere('job.type = :type', { type });
    }

    if (location) {
      queryBuilder.andWhere('job.location LIKE :location', { location: `%${location}%` });
    }

    queryBuilder.orderBy('job.createdAt', 'DESC');

    const [jobs, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: jobs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取职位列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await jobRepository().findOne({
      where: { id, status: JobStatus.ACTIVE }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: '职位不存在'
      });
    }

    job.viewCount++;
    await jobRepository().save(job);

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('获取职位详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/guides', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const queryBuilder = guideRepository()
      .createQueryBuilder('guide')
      .where('guide.isActive = :isActive', { isActive: true })
      .orderBy('guide.createdAt', 'DESC');

    const [guides, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: guides,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取就业指导列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/guides/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const guide = await guideRepository().findOne({
      where: { id, isActive: true }
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: '指导文章不存在'
      });
    }

    guide.viewCount++;
    await guideRepository().save(guide);

    res.json({
      success: true,
      data: guide
    });
  } catch (error) {
    console.error('获取就业指导详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
