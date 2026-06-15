import { Router, type Request, type Response } from 'express';
import {
  MOCK_SUBSIDY_APPS,
} from '../mock/mockData.js';
import {
  ApiResponse,
  SubsidyApplication,
} from '../../shared/types/index.js';

const router = Router();

const DEFAULT_SEEKER_ID = 'js_00001';
const DEFAULT_ENTERPRISE_ID = 'ent_0001';

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/types', async (req: Request, res: Response): Promise<void> => {
  const types = [
    {
      id: 'enterprise_hire',
      name: '企业吸纳就业补贴',
      applicantType: '企业',
      maxAmount: 20000,
      minAmount: 3000,
      description: '企业招用符合条件人员，签订1年以上劳动合同并缴纳社保的，按实际招用人数给予补贴',
      eligibility: [
        '招用登记失业半年以上人员',
        '招用应届高校毕业生',
        '招用就业困难人员',
        '签订1年以上劳动合同',
        '连续缴纳社保满3个月',
      ],
      requiredDocs: [
        '营业执照复印件',
        '劳动合同',
        '社保缴纳证明',
        '工资发放凭证',
        '申请人身份证',
      ],
    },
    {
      id: 'graduate',
      name: '高校毕业生就业补贴',
      applicantType: '个人/企业',
      maxAmount: 8000,
      minAmount: 2000,
      description: '应届高校毕业生到中小微企业就业，签订1年以上劳动合同并缴纳社保的一次性补贴',
      eligibility: [
        '毕业2年内的全日制普通高校毕业生',
        '到中小微企业就业',
        '签订1年以上劳动合同',
        '连续缴纳社保满6个月',
      ],
      requiredDocs: [
        '毕业证书',
        '劳动合同',
        '社保缴纳证明',
        '身份证',
      ],
    },
    {
      id: 'skill_upgrade',
      name: '技能提升补贴',
      applicantType: '个人/企业',
      maxAmount: 5000,
      minAmount: 1000,
      description: '参加职业技能培训并取得职业资格证书的人员，按证书等级给予培训补贴',
      eligibility: [
        '累计缴纳失业保险费36个月以上',
        '取得初级(五级)及以上职业资格证书',
        '证书核发之日起12个月内申请',
        '证书在国家职业资格目录内',
      ],
      requiredDocs: [
        '技能证书',
        '培训发票',
        '身份证',
        '社保缴纳证明',
      ],
    },
    {
      id: 'social_insurance',
      name: '社保补贴',
      applicantType: '企业/个人',
      maxAmount: 3000,
      minAmount: 500,
      description: '对就业困难人员、高校毕业生灵活就业后缴纳的社会保险费给予补贴',
      eligibility: [
        '就业困难人员或离校1年内未就业高校毕业生',
        '实现灵活就业',
        '以个人身份缴纳社会保险费',
        '按规定办理就业登记',
      ],
      requiredDocs: [
        '社保缴纳凭证',
        '劳动合同/就业证明',
        '工资表',
        '身份证',
      ],
    },
  ];

  res.json(ok(types));
});

router.get('/applications', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const applicantType = req.query.applicantType as string;
  const applicantId = req.query.applicantId as string;
  const type = req.query.type as string;
  const status = req.query.status as string;

  let applications = [...MOCK_SUBSIDY_APPS];

  if (applicantType) {
    applications = applications.filter(a => a.applicantType === applicantType);
  }
  if (applicantId) {
    applications = applications.filter(a => a.applicantId === applicantId);
  }
  if (type) {
    applications = applications.filter(a => a.type === type);
  }
  if (status) {
    applications = applications.filter(a => a.status === status);
  }

  applications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  const total = applications.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = applications.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.get('/applications/:id', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;
  const application = MOCK_SUBSIDY_APPS.find(a => a.id === applicationId);

  if (!application) {
    res.status(404).json(fail('补贴申请不存在'));
    return;
  }

  res.json(ok<SubsidyApplication>(application));
});

router.post('/applications', async (req: Request, res: Response): Promise<void> => {
  const data = req.body as Partial<SubsidyApplication> & {
    seekerId?: string;
    enterpriseId?: string;
  };

  const applicantType = data.applicantType || '个人';
  const applicantId = applicantType === '企业'
    ? (data.enterpriseId || DEFAULT_ENTERPRISE_ID)
    : (data.seekerId || DEFAULT_SEEKER_ID);

  const newApplication: SubsidyApplication = {
    id: `sub_new_${Date.now()}`,
    type: (data.type || 'SKILL_UPGRADE') as any,
    applicantType,
    applicantId,
    applicantName: data.applicantName || (applicantType === '企业' ? '企业名称' : '申请人'),
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    amount: data.amount || 3000,
    documents: data.requiredDocuments?.map(d => ({
      name: d.name,
      uploaded: !!d.url,
      url: d.url,
    })) || [],
    status: 'DRAFT' as any,
    auditTrail: [{
      step: '创建申请',
      operator: '申请人',
      comment: '申请草稿已创建',
      status: '待处理' as any,
      operatedAt: new Date().toISOString(),
    }] as any,
    appliedAt: new Date().toISOString(),
  } as any;

  res.json(ok<SubsidyApplication>(newApplication, '补贴申请已创建'));
});

router.put('/applications/:id', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;
  const data = req.body as Partial<SubsidyApplication>;

  const existing = MOCK_SUBSIDY_APPS.find(a => a.id === applicationId);
  if (!existing) {
    res.status(404).json(fail('补贴申请不存在'));
    return;
  }

  if ((existing.status as any) !== 'DRAFT') {
    res.status(400).json(fail('仅草稿状态可修改'));
    return;
  }

  const updated: SubsidyApplication = {
    ...existing,
    ...data,
    documents: (data as any).requiredDocuments || existing.documents,
  };

  res.json(ok<SubsidyApplication>(updated, '申请已更新'));
});

router.post('/applications/:id/submit', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;
  const existing = MOCK_SUBSIDY_APPS.find(a => a.id === applicationId);

  if (!existing) {
    res.status(404).json(fail('补贴申请不存在'));
    return;
  }

  const missingDocs = existing.documents.filter((d: any) => !d.uploaded);
  if (missingDocs.length > 0) {
    res.status(400).json(fail(`还需上传材料: ${missingDocs.map(d => d.name).join('、')}`));
    return;
  }

  const updated: SubsidyApplication = {
    ...existing,
    status: 'SUBMITTED' as any,
    auditTrail: [
      ...(existing.auditTrail || []),
      {
        step: '提交申请',
        operator: '申请人',
        comment: '申请材料已提交，等待材料初审',
        status: '通过' as any,
        operatedAt: new Date().toISOString(),
      },
    ],
  } as any;

  res.json(ok<SubsidyApplication>(updated, '申请已提交，预计3-5个工作日内完成审核'));
});

router.post('/applications/:id/upload-document', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;
  const { docName, fileUrl } = req.body as { docName: string; fileUrl: string };

  const existing = MOCK_SUBSIDY_APPS.find(a => a.id === applicationId);
  if (!existing) {
    res.status(404).json(fail('补贴申请不存在'));
    return;
  }

  const docs = existing.requiredDocuments.map(d =>
    d.name === docName ? { ...d, uploaded: true, url: fileUrl || d.url } : d
  );

  if (!docs.find(d => d.name === docName)) {
    docs.push({ name: docName, uploaded: true, url: fileUrl });
  }

  res.json(ok({
    applicationId,
    docName,
    uploaded: true,
    uploadedAt: new Date().toISOString(),
    documents: docs,
  }, '材料上传成功'));
});

router.get('/my', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const enterpriseId = req.query.enterpriseId as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const targetId = enterpriseId || seekerId;
  const myApplications = MOCK_SUBSIDY_APPS.filter(a => a.applicantId === targetId || a.employeeId === seekerId);

  const stats = {
    total: myApplications.length,
    byStatus: {
      draft: myApplications.filter(a => a.status === '草稿').length,
      submitted: myApplications.filter(a => ['已提交', '审核中'].includes(a.status)).length,
      approved: myApplications.filter(a => a.status === '已通过').length,
      paid: myApplications.filter(a => a.status === '已发放').length,
      rejected: myApplications.filter(a => a.status === '已驳回').length,
    },
    totalApprovedAmount: myApplications
      .filter(a => ['已通过', '已发放'].includes(a.status))
      .reduce((s, a) => s + a.amount, 0),
  };

  myApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  const total = myApplications.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = myApplications.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: {
      list: paginated,
      stats,
    },
    pagination: { page, pageSize, total, totalPages },
  });
});

router.get('/eligible', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;

  const eligibleSubsidies = [
    {
      id: 'skill_upgrade',
      name: '技能提升补贴',
      matchScore: 95,
      estimatedAmount: [1500, 3000],
      reason: '根据您的工作年限和技能证书情况，符合技能提升补贴申请条件',
    },
    {
      id: 'social_insurance',
      name: '社保补贴',
      matchScore: 80,
      estimatedAmount: [800, 1500],
      reason: '社保连续缴纳超过规定年限，符合灵活就业社保补贴申请条件',
    },
    {
      id: 'graduate',
      name: '高校毕业生就业补贴',
      matchScore: 60,
      estimatedAmount: [3000, 5000],
      reason: '需核实毕业时间和企业资质，建议在线咨询确认后申请',
    },
  ];

  res.json(ok(eligibleSubsidies, '为您匹配到3项可申领补贴'));
});

router.get('/guides', async (req: Request, res: Response): Promise<void> => {
  const guides = [
    {
      title: '企业吸纳就业补贴申请指南',
      type: 'enterprise_hire',
      steps: [
        '在线填写企业及员工信息',
        '上传相关证明材料',
        '提交申请等待镇街初审',
        '通过镇街复核',
        '区级审批通过',
        '补贴资金发放至企业账户',
      ],
      processingTime: '约10-15个工作日',
      faq: [
        { q: '社保需要缴纳多久？', a: '需连续缴纳满3个月以上' },
        { q: '每个员工可以申请几次？', a: '同一员工同一补贴只能享受一次' },
      ],
    },
    {
      title: '技能提升补贴申请指南',
      type: 'skill_upgrade',
      steps: [
        '查询证书是否在补贴目录内',
        '确认社保缴纳情况',
        '填写个人信息并上传证书',
        '提交后等待审核',
        '审核通过后补贴发放',
      ],
      processingTime: '约5-8个工作日',
      faq: [
        { q: '哪些证书可以申请？', a: '国家职业资格目录内的职业资格证书或技能等级证书' },
        { q: '申请期限是多久？', a: '证书核发之日起12个月内' },
      ],
    },
  ];

  res.json(ok(guides));
});

export default router;
