import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import OrchestrationEngine from '../engines/OrchestrationEngine';
import { getAllOrchestrations } from '../../../shared/utils/service-orchestration';
import { GOVERNMENT_DEPARTMENTS, SERVICE_CATEGORIES } from '../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const buildGovernmentServices = () => {
  const services: any[] = [];
  let serviceCounter = 1;

  SERVICE_CATEGORIES.forEach(cat => {
    const depts = GOVERNMENT_DEPARTMENTS.filter(d => d.category === cat.code);

    const serviceTemplates: Record<string, { name: string; desc: string; hotLevel: number; tags: string[]; averageTime: string }[]> = {
      social_security: [
        { name: '社保参保证明打印', desc: '打印个人社保参保缴费明细证明，带电子印章', hotLevel: 9800, tags: ['证明', '即办件', '全程网办'], averageTime: '1分钟' },
        { name: '养老保险待遇资格认证', desc: '人脸识别完成退休人员养老金领取资格认证', hotLevel: 7200, tags: ['认证', '即办件', '刷脸办'], averageTime: '2分钟' },
        { name: '灵活就业人员社保参保登记', desc: '灵活就业人员自愿参加职工养老/医疗保险登记', hotLevel: 5400, tags: ['登记', '承诺件', '全程网办'], averageTime: '1个工作日' },
        { name: '社保关系转移接续申请', desc: '跨统筹地区社保关系转入/转出申请', hotLevel: 3100, tags: ['转移', '承诺件'], averageTime: '15个工作日' },
        { name: '失业保险金申领', desc: '非本人意愿中断就业人员申领失业保险待遇', hotLevel: 2800, tags: ['待遇', '承诺件'], averageTime: '5个工作日' },
        { name: '退休手续办理预约', desc: '达到法定退休年龄预约办理退休审批', hotLevel: 1500, tags: ['预约', '联审联批'], averageTime: '10个工作日' },
      ],
      medical_insurance: [
        { name: '居民医保参保登记', desc: '城乡居民基本医疗保险参保登记/变更', hotLevel: 12500, tags: ['登记', '即办件', '新生儿免缴'], averageTime: '1个工作日' },
        { name: '医保账户余额查询', desc: '查询职工医保个人账户余额及消费明细', hotLevel: 10800, tags: ['查询', '即办件'], averageTime: '实时' },
        { name: '门诊慢特病认定申请', desc: '54种门诊慢特病医保待遇资格认定', hotLevel: 4200, tags: ['认定', '承诺件', '专家评审'], averageTime: '10个工作日' },
        { name: '异地就医备案', desc: '跨省异地就医住院/门诊直接结算备案', hotLevel: 3900, tags: ['备案', '即办件'], averageTime: '即时生效' },
        { name: '医疗费用手工报销', desc: '未直接结算的医疗费用手工报销申请', hotLevel: 2100, tags: ['报销', '承诺件'], averageTime: '20个工作日' },
        { name: '医保电子凭证激活', desc: '激活医保电子凭证，扫码就医购药', hotLevel: 15000, tags: ['激活', '即办件', '刷码'], averageTime: '1分钟' },
      ],
      household: [
        { name: '新生儿出生登记落户', desc: '新生婴儿户口登记（支持"出生一件事"联办）', hotLevel: 8900, tags: ['登记', '即办件', '一件事联办'], averageTime: '现场即时' },
        { name: '市内户口迁移', desc: '郑州市范围内户口迁入/迁出/住址变动', hotLevel: 6300, tags: ['迁移', '即办件'], averageTime: '1个工作日' },
        { name: '户籍证明开具', desc: '出具户籍证明、户口登记项目变更证明', hotLevel: 4500, tags: ['证明', '即办件'], averageTime: '3分钟' },
        { name: '居民身份证办理', desc: '首次申领/换领/补领居民身份证', hotLevel: 8200, tags: ['证件', '承诺件'], averageTime: '20个工作日' },
        { name: '居住证申领', desc: '外地户籍人员在郑居住登记满半年申领居住证', hotLevel: 5100, tags: ['证件', '承诺件'], averageTime: '15个工作日' },
        { name: '投靠户口迁入', desc: '夫妻投靠/父母投靠/子女投靠户口迁入', hotLevel: 2800, tags: ['迁移', '承诺件'], averageTime: '25个工作日' },
      ],
      education: [
        { name: '义务教育入学一件事', desc: '小学/初中新生入学报名、划片查询、现场核验', hotLevel: 25600, tags: ['报名', '一件事', '高并发业务'], averageTime: '3个工作日' },
        { name: '学生资助申请', desc: '义务教育/高中/中职教育助学金申请', hotLevel: 3200, tags: ['资助', '承诺件'], averageTime: '20个工作日' },
        { name: '教师资格认定', desc: '中小学教师资格考试合格人员资格认定', hotLevel: 1800, tags: ['认定', '承诺件'], averageTime: '30个工作日' },
        { name: '幼儿园招生报名', desc: '公办/普惠性民办幼儿园新生报名登记', hotLevel: 9800, tags: ['报名', '高并发业务'], averageTime: '5个工作日' },
      ],
      housing_fund: [
        { name: '公积金账户余额查询', desc: '查询个人住房公积金账户余额及明细', hotLevel: 18200, tags: ['查询', '即办件'], averageTime: '实时' },
        { name: '公积金贷款申请', desc: '个人住房公积金贷款预申请及额度测算', hotLevel: 6800, tags: ['贷款', '承诺件'], averageTime: '10个工作日' },
        { name: '公积金提取', desc: '购房/租房/还贷/离职等9种情形公积金提取', hotLevel: 11300, tags: ['提取', '承诺件', '秒批'], averageTime: '3个工作日' },
        { name: '异地公积金转移接续', desc: '跨城市住房公积金账户转移', hotLevel: 1500, tags: ['转移', '承诺件'], averageTime: '11个工作日' },
        { name: '公积金贷款提前还款', desc: '公积金贷款部分/全部提前还款申请', hotLevel: 2100, tags: ['还款', '即办件'], averageTime: '1个工作日' },
      ],
      real_estate: [
        { name: '二手房交易登记', desc: '存量房网签、缴税、转移登记"一窗办理"', hotLevel: 7500, tags: ['登记', '一窗受理', '一件事'], averageTime: '1个工作日' },
        { name: '不动产查询', desc: '个人/家庭名下不动产登记信息查询', hotLevel: 15200, tags: ['查询', '即办件'], averageTime: '实时' },
        { name: '不动产登记证明打印', desc: '打印不动产权证书/登记证明（电子证照）', hotLevel: 8800, tags: ['证明', '即办件', '电子证照'], averageTime: '1分钟' },
        { name: '商品房合同网签备案', desc: '新建商品房买卖合同网签备案查询及打印', hotLevel: 3600, tags: ['备案', '即办件'], averageTime: '即时' },
        { name: '不动产抵押登记', desc: '不动产抵押权设立/变更/注销登记', hotLevel: 4200, tags: ['登记', '承诺件'], averageTime: '3个工作日' },
      ],
      tax: [
        { name: '个人所得税纳税记录开具', desc: '个税申报记录、纳税明细、完税证明打印', hotLevel: 11800, tags: ['证明', '即办件'], averageTime: '1分钟' },
        { name: '契税申报缴纳', desc: '新房/二手房契税申报、计算、缴纳', hotLevel: 6200, tags: ['缴税', '即办件', '一窗联办'], averageTime: '即时' },
        { name: '发票领用申请', desc: '增值税发票线上领用、邮寄送达', hotLevel: 2800, tags: ['发票', '即办件'], averageTime: '1个工作日' },
        { name: '灵活就业人员社保费缴纳', desc: '灵活就业人员养老/医疗保险费税务申报缴纳', hotLevel: 7100, tags: ['缴费', '即办件'], averageTime: '即时' },
      ],
      traffic: [
        { name: '驾驶证补换领', desc: '驾驶证期满换证/遗失补证/损毁换证', hotLevel: 9500, tags: ['证件', '即办件'], averageTime: '1个工作日' },
        { name: '机动车六年免检', desc: '非营运小微型载客汽车6年免检合格标志核发', hotLevel: 12800, tags: ['年检', '即办件', '电子凭证'], averageTime: '即时' },
        { name: '交通违法处理', desc: '电子眼抓拍交通违法查询、处理、缴款', hotLevel: 25400, tags: ['违法', '即办件'], averageTime: '即时' },
        { name: '机动车号牌换领', desc: '机动车号牌损坏/遗失补领', hotLevel: 1600, tags: ['号牌', '承诺件'], averageTime: '15个工作日' },
      ],
      business: [
        { name: '个体工商户设立登记', desc: '个体工商户营业执照设立、变更、注销', hotLevel: 4800, tags: ['登记', '承诺件'], averageTime: '1个工作日' },
        { name: '公司设立登记', desc: '有限责任公司/股份有限公司营业执照办理', hotLevel: 2600, tags: ['登记', '一窗受理'], averageTime: '1个工作日' },
        { name: '开办企业一窗通', desc: '公司设立+刻章+发票+社保开户+公积金"一窗通"', hotLevel: 3800, tags: ['一件事', '一窗受理'], averageTime: '0.5个工作日' },
        { name: '食品经营许可证办理', desc: '餐饮/食品销售经营者食品经营许可', hotLevel: 1500, tags: ['许可', '承诺件'], averageTime: '12个工作日' },
      ],
      civil: [
        { name: '婚姻登记预约', desc: '结婚/离婚登记跨区通办预约', hotLevel: 5600, tags: ['预约', '跨区通办'], averageTime: '当日' },
        { name: '低保/特困申请', desc: '最低生活保障/特困人员救助供养待遇申请', hotLevel: 1200, tags: ['救助', '承诺件'], averageTime: '30个工作日' },
        { name: '残疾人证办理', desc: '中华人民共和国残疾人证申领', hotLevel: 800, tags: ['证件', '承诺件'], averageTime: '20个工作日' },
      ],
      legal: [
        { name: '公证处公证申请', desc: '委托/声明/继承/合同等公证事项在线预约', hotLevel: 1800, tags: ['公证', '承诺件'], averageTime: '7个工作日' },
        { name: '法律援助申请', desc: '困难群众民事/刑事法律援助申请', hotLevel: 600, tags: ['援助', '承诺件'], averageTime: '5个工作日' },
        { name: '人民调解预约', desc: '民事纠纷人民调解申请及预约', hotLevel: 400, tags: ['调解', '即办件'], averageTime: '3个工作日' },
      ],
      environment: [
        { name: '建设项目环评备案', desc: '环境影响评价登记表在线备案', hotLevel: 300, tags: ['备案', '即办件'], averageTime: '即时' },
        { name: '排水许可证办理', desc: '城镇污水排入排水管网许可证办理', hotLevel: 200, tags: ['许可', '承诺件'], averageTime: '15个工作日' },
      ]
    };

    depts.forEach(dept => {
      const templates = serviceTemplates[cat.code] || [];
      templates.forEach((tmpl, idx) => {
        services.push({
          id: `SRV-${cat.code.substring(0, 2).toUpperCase()}-${String(serviceCounter++).padStart(3, '0')}`,
          name: tmpl.name,
          description: tmpl.desc,
          category: cat.code,
          departmentCode: dept.code,
          departmentName: dept.name,
          hotLevel: tmpl.hotLevel,
          tags: tmpl.tags,
          averageProcessTime: tmpl.averageTime,
          requiredMaterialCount: Math.floor(Math.random() * 3) + 2,
          onlineAvailable: true,
          offlineAvailable: idx % 3 !== 0,
          supportedDistricts: ['jinshui', 'erqi', 'zhongyuan', 'guancheng', 'huiji', 'zhengdong', 'kaifa', 'gaoxin'],
          rating: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
          applicationCount: Math.floor(tmpl.hotLevel * (0.9 + Math.random() * 0.4)),
          satisfactionRate: Math.round((90 + Math.random() * 9) * 10) / 10,
          createdAt: '2025-01-01T00:00:00Z'
        });
      });
    });
  });

  return services;
};

let GOVERNMENT_SERVICES: any[] | null = null;
function getServices() {
  if (!GOVERNMENT_SERVICES) GOVERNMENT_SERVICES = buildGovernmentServices();
  return GOVERNMENT_SERVICES;
}

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { category, department, keyword, page, pageSize, sort } = req.query;
    const services = getServices();
    let result = [...services];

    if (category) result = result.filter(s => s.category === category);
    if (department) result = result.filter(s => s.departmentCode === department);
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw) ||
        s.tags.some((t: string) => t.toLowerCase().includes(kw))
      );
    }

    if (sort === 'hot') result.sort((a, b) => b.hotLevel - a.hotLevel);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    else result.sort((a, b) => b.applicationCount - a.applicationCount);

    const p = parseInt(page as string || '1', 10);
    const ps = parseInt(pageSize as string || '20', 10);
    const total = result.length;
    const paginated = result.slice((p - 1) * ps, p * ps);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total,
        page: p,
        pageSize: ps,
        totalPages: Math.ceil(total / ps),
        services: paginated
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/hot', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const limit = parseInt(req.query.limit as string || '10', 10);
    const services = getServices();
    const hot = [...services].sort((a, b) => b.hotLevel - a.hotLevel).slice(0, limit);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        ranking: hot.map((s, i) => ({
          rank: i + 1,
          service: s,
          badge: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : null
        })),
        updatedAt: new Date().toISOString()
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const service = getServices().find(s => s.id === req.params.id);
    if (!service) throw new AppError('服务不存在', 404);

    const related = getServices()
      .filter(s => s.category === service.category && s.id !== service.id)
      .slice(0, 5);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        service,
        relatedServices: related,
        materials: Array.from({ length: service.requiredMaterialCount }).map((_, i) => ({
          name: ['居民身份证原件', '户口簿原件', '近期免冠照片', '申请表', '授权委托书', '收入证明'][i % 6],
          required: i < 3,
          format: i % 2 === 0 ? '原件+复印件' : '原件',
          note: i === 0 ? '正反面复印在同一张A4纸上' : undefined,
          canUploadOnline: true
        })),
        processSteps: [
          { step: 1, name: '在线申请', description: '填写申请信息并上传材料', duration: '5分钟' },
          { step: 2, name: '后台审核', description: '工作人员审核申请材料', duration: service.averageProcessTime },
          { step: 3, name: '通知结果', description: '短信/推送通知审核结果', duration: '1小时' },
          { step: 4, name: '证件领取', description: '邮寄或现场领取办理结果', duration: '3个工作日' }
        ],
        faq: [
          { q: '办理需要多久？', a: `承诺办结时限为${service.averageProcessTime}，实际以审核进度为准` },
          { q: '可以代办吗？', a: '可委托近亲属代办，需提供委托书和双方身份证' },
          { q: '费用多少？', a: '本事项不收取任何行政事业性费用' }
        ]
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/:id/apply', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const service = getServices().find(s => s.id === req.params.id);
    if (!service) throw new AppError('服务不存在', 404);

    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    OrchestrationEngine.triggerByServiceComplete(req.params.id, {
      citizenId: req.citizenId!,
      applicationId,
      triggerData: { serviceId: req.params.id, ...req.body }
    });

    res.status(201).json({
      code: 0,
      message: '申请已提交',
      data: {
        applicationId,
        serviceId: service.id,
        serviceName: service.name,
        expectedTime: service.averageProcessTime,
        status: 'submitted',
        trackingCode: `ZZ${Date.now().toString().slice(-8)}`,
        nextStep: '工作人员将在24小时内审核您的申请材料',
        submittedAt: new Date().toISOString()
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/categories/tree', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const services = getServices();

    const tree = SERVICE_CATEGORIES.map(cat => ({
      ...cat,
      departments: GOVERNMENT_DEPARTMENTS.filter(d => d.category === cat.code).map(dept => ({
        ...dept,
        serviceCount: services.filter(s => s.departmentCode === dept.code).length
      })),
      serviceCount: services.filter(s => s.category === cat.code).length
    }));

    res.json({
      code: 0,
      message: 'OK',
      data: { categories: tree, totalServices: services.length },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/departments/list', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const services = getServices();
    const list = GOVERNMENT_DEPARTMENTS.map(dept => ({
      ...dept,
      serviceCount: services.filter(s => s.departmentCode === dept.code).length,
      totalApplications: services.filter(s => s.departmentCode === dept.code)
        .reduce((s, x) => s + x.applicationCount, 0)
    })).sort((a, b) => b.serviceCount - a.serviceCount);

    res.json({
      code: 0, message: 'OK',
      data: list,
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
