import { Router, type Request, type Response } from 'express';
import { MatchService } from '@api/services/match.service';

const router = Router();

router.get('/job/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const matches = await MatchService.matchJobToTalents(jobId);
    res.json({ success: true, data: matches });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取职位匹配人才失败' });
  }
});

router.get('/talent/:talentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { talentId } = req.params;
    const matches = await MatchService.matchTalentToJobs(talentId);
    res.json({ success: true, data: matches });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取人才匹配职位失败' });
  }
});

router.get('/detail', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, talentId } = req.query;

    if (!jobId || !talentId) {
      res.json({ success: false, error: '缺少 jobId 或 talentId 参数' });
      return;
    }

    const match = await MatchService.getMatchDetail(jobId as string, talentId as string);

    if (!match) {
      res.json({ success: false, error: '未找到匹配结果' });
      return;
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取匹配详情失败' });
  }
});

router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, talentId } = req.body;

    if (!jobId || !talentId) {
      res.json({ success: false, error: '缺少 jobId 或 talentId 参数' });
      return;
    }

    const match = await MatchService.calculateMatch(jobId, talentId);

    if (!match) {
      res.json({ success: false, error: '职位或人才不存在' });
      return;
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '计算匹配度失败' });
  }
});

export default router;
