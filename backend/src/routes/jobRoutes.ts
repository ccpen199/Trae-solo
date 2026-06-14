import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { jobService } from '../services/jobService';
import { talentMatchService } from '../services/talentMatchService';
import { Company } from '../entities/Company';
import { AppDataSource } from '../data-source';

const router = Router();
const companyRepository = AppDataSource.getRepository(Company);

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let companyId = req.body.companyId;

    if (!companyId && req.user) {
      const company = await companyRepository.findOne({ where: { userId: req.user.id } });
      if (company) {
        companyId = company.id;
      }
    }

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: '缺少公司ID'
      });
      return;
    }

    const { companyId: _cid, ...jobData } = req.body;
    const result = await jobService.createJob(companyId, jobData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建岗位失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

    if (!companyId && req.user && req.user.role === 'enterprise') {
      const company = await companyRepository.findOne({ where: { userId: req.user.id } });
      if (company) {
        companyId = company.id;
      }
    }

    const filters = {
      companyId,
      status: req.query.status as string,
      jobType: req.query.jobType as string,
      keyword: req.query.keyword as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
    };

    const result = await jobService.getJobList(companyId || 0, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取岗位列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await jobService.getJobDetail(parseInt(id));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取岗位详情失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await jobService.updateJob(parseInt(id), req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新岗位失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await jobService.deleteJob(parseInt(id));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除岗位失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/:id/recommend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { topN } = req.body;
    const result = await talentMatchService.recommendCandidates(
      parseInt(id),
      topN || 10
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '推荐候选人失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
