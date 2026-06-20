import { Router, type Request, type Response } from 'express';
import { TalentService, type TalentListParams, type UpdateProfileData, type UploadCertificateData } from '@api/services/talent.service';

const router = Router();

router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const params: TalentListParams = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      industry: req.query.industry as string,
      keyword: req.query.keyword as string,
      minExperience: req.query.minExperience ? Number(req.query.minExperience) : undefined,
      maxExpectedSalary: req.query.maxExpectedSalary ? Number(req.query.maxExpectedSalary) : undefined,
    };

    const result = await TalentService.getTalentList(params);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取人才列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const talent = await TalentService.getTalentById(id);

    if (!talent) {
      res.json({ success: false, error: '人才不存在' });
      return;
    }

    res.json({ success: true, data: talent });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取人才详情失败' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const profileData: UpdateProfileData = req.body;

    const updatedTalent = await TalentService.updateTalentProfile(id, profileData);

    if (!updatedTalent) {
      res.json({ success: false, error: '人才不存在' });
      return;
    }

    res.json({ success: true, data: updatedTalent });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '更新人才资料失败' });
  }
});

router.post('/:id/certificate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const certificateData: UploadCertificateData = req.body;

    if (!certificateData.name || !certificateData.issuer || !certificateData.issueDate) {
      res.json({ success: false, error: '证书信息不完整' });
      return;
    }

    const certificate = await TalentService.uploadCertificate(id, certificateData);

    if (!certificate) {
      res.json({ success: false, error: '人才不存在' });
      return;
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '上传证书失败' });
  }
});

router.get('/:id/recommended-jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const jobs = await TalentService.getRecommendedJobs(id);
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : '获取推荐职位失败' });
  }
});

export default router;
