import { Router, type Request, type Response } from 'express';
import { jobPosts } from '../data/mockData.js';
import { MatchAlgorithmService } from '../services/MatchAlgorithmService.js';
import { currentUserProfile } from '../data/mockData.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const {
      keyword, city, minSalary, maxSalary,
      hasTrainingSystem, hasRotationProgram, mentorshipProgram, promotionPathClear,
      page, pageSize,
    } = req.query;

    let filtered = [...jobPosts];
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(kw) ||
        j.company.name.toLowerCase().includes(kw) ||
        j.description.toLowerCase().includes(kw)
      );
    }
    if (city) filtered = filtered.filter(j => j.city === city);
    if (minSalary) filtered = filtered.filter(j => j.salaryRange[1] >= parseInt(minSalary as string, 10));
    if (maxSalary) filtered = filtered.filter(j => j.salaryRange[0] <= parseInt(maxSalary as string, 10));
    if (hasTrainingSystem === 'true') filtered = filtered.filter(j => j.growthTags.hasTrainingSystem);
    if (hasRotationProgram === 'true') filtered = filtered.filter(j => j.growthTags.hasRotationProgram);
    if (mentorshipProgram === 'true') filtered = filtered.filter(j => j.growthTags.mentorshipProgram);
    if (promotionPathClear === 'true') filtered = filtered.filter(j => j.growthTags.promotionPathClear);

    const p = page ? parseInt(page as string, 10) : 1;
    const ps = pageSize ? parseInt(pageSize as string, 10) : 20;
    const total = filtered.length;
    const start = (p - 1) * ps;
    const data = filtered.slice(start, start + ps);

    res.json({ success: true, data, total, page: p, pageSize: ps });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/recommend', (req: Request, res: Response) => {
  try {
    const { page, pageSize } = req.query;
    const result = MatchAlgorithmService.recommendJobs(currentUserProfile, {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const job = jobPosts.find(j => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const { matchScore, matchBreakdown } = MatchAlgorithmService.matchJob(job, currentUserProfile);
    res.json({ success: true, data: { ...job, matchScore, matchBreakdown } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
