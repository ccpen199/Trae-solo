import type {
  User,
  ServiceItem,
  ServiceRecord,
  FamilyMember,
  HeatmapData,
  DashboardData,
  CityOption,
  City,
  Category,
  RecordStatus,
  Sentiment,
  ServiceStep,
  FormField,
  Relation,
  DistrictHeat,
  AgeHeat,
  TimeSlotHeat,
  TopService,
  TrendPoint,
  BureauOverdue,
  SentimentStat,
  BureauStatus,
  LowReview,
} from '../types';

export const bureauList: string[] = [
  '人力资源和社会保障局',
  '卫生健康委员会',
  '教育局',
  '交通运输局',
  '公安局',
  '民政局',
  '住房公积金管理中心',
  '税务局',
  '市场监督管理局',
  '医疗保障局',
  '规划和自然资源局',
  '住房和城乡建设局',
  '生态环境局',
  '文化广电旅游局',
  '体育局',
  '科学技术局',
  '经济和信息化局',
  '商务局',
  '农业农村局',
  '水务局',
  '应急管理局',
  '司法局',
  '退役军人事务局',
  '审计局',
  '统计局',
];

export const cityOptions: CityOption[] = [
  {
    value: 'chengdu',
    label: '成都市',
    pinyin: 'Chengdu',
    districts: [
      '锦江区',
      '青羊区',
      '金牛区',
      '武侯区',
      '成华区',
      '龙泉驿区',
      '青白江区',
      '新都区',
      '温江区',
      '双流区',
      '郫都区',
      '新津区',
    ],
  },
  {
    value: 'deyang',
    label: '德阳市',
    pinyin: 'Deyang',
    districts: ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'],
  },
  {
    value: 'meishan',
    label: '眉山市',
    pinyin: 'Meishan',
    districts: ['东坡区', '彭山区', '仁寿县', '洪雅县', '丹棱县', '青神县'],
  },
  {
    value: 'ziyang',
    label: '资阳市',
    pinyin: 'Ziyang',
    districts: ['雁江区', '安岳县', '乐至县'],
  },
];

const allCities: City[] = ['chengdu', 'deyang', 'meishan', 'ziyang'];

const commonSteps: Record<string, ServiceStep[]> = {
  standard3: [
    { stepNumber: 1, title: '提交申请', description: '在线填写申请表单并上传所需材料', estimatedTime: '10分钟', required: true },
    { stepNumber: 2, title: '部门审核', description: '相关部门对提交材料进行审核', estimatedTime: '2-4小时', required: true },
    { stepNumber: 3, title: '办结出件', description: '审核通过后生成结果，可在线查看或邮寄送达', estimatedTime: '1小时', required: true },
  ],
  standard4: [
    { stepNumber: 1, title: '实名认证', description: '完成身份核验，确保申请人身份真实有效', estimatedTime: '5分钟', required: true },
    { stepNumber: 2, title: '提交申请', description: '填写申请信息并上传相关证明材料', estimatedTime: '15分钟', required: true },
    { stepNumber: 3, title: '部门审批', description: '业务部门进行多级审批处理', estimatedTime: '3-5小时', required: true },
    { stepNumber: 4, title: '领取结果', description: '线上下载电子证照或线下窗口领取', estimatedTime: '30分钟', required: true },
  ],
};

const commonForms: Record<string, FormField[]> = {
  basic: [
    { name: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入真实姓名' },
    { name: 'idCard', label: '身份证号', type: 'text', required: true, placeholder: '请输入18位身份证号', maxLength: 18 },
    { name: 'phone', label: '联系电话', type: 'text', required: true, placeholder: '请输入手机号' },
  ],
};

function buildService(
  id: string,
  name: string,
  category: Category,
  bureau: string,
  description: string,
  city: City[],
  avgHours: number,
  isHot: boolean,
  materials: string[],
  fee: string,
  onlineAvailable = true,
  customSteps?: ServiceStep[],
  customForms?: FormField[],
  prerequisites?: string[]
): ServiceItem {
  const HOURS_PER_WORKDAY = 8;
  const baseProcessingDays = Math.ceil(avgHours / HOURS_PER_WORKDAY);
  const processingTime = Math.max(1, baseProcessingDays + (avgHours >= 24 ? Math.ceil(baseProcessingDays * 0.3) : 0));

  return {
    id,
    name,
    category,
    bureau,
    description,
    city,
    avgDuration: `${Math.floor(avgHours)}小时${Math.round((avgHours % 1) * 60)}分钟`,
    avgDurationHours: avgHours,
    processingTime,
    isHot,
    requiredMaterials: materials,
    steps: customSteps || (avgHours < 4 ? commonSteps.standard3 : commonSteps.standard4),
    forms: customForms || commonForms.basic,
    fee,
    onlineAvailable,
    prerequisites,
    status: 'normal' as const,
  };
}

export const mockUsers: User[] = [
  {
    id: 'U001',
    name: '张明华',
    idCard: '510104198505120011',
    phone: '13800138001',
    city: 'chengdu',
    district: '锦江区',
    address: '四川省成都市锦江区春熙路街道XX号XX小区3栋2单元501',
    authMethod: 'idcard',
    lastLoginTime: '2026-06-13 09:23:45',
    isRealNameVerified: true,
  },
  {
    id: 'U002',
    name: '李秀兰',
    idCard: '510603197811230022',
    phone: '13900139002',
    city: 'deyang',
    district: '旌阳区',
    address: '四川省德阳市旌阳区文庙广场街道XX路XX号',
    authMethod: 'socialcard',
    lastLoginTime: '2026-06-12 18:45:12',
    isRealNameVerified: true,
  },
  {
    id: 'U003',
    name: '王建国',
    idCard: '511402199003080033',
    phone: '13700137003',
    city: 'meishan',
    district: '东坡区',
    address: '四川省眉山市东坡区苏祠街道XX社区XX街XX号',
    authMethod: 'medicalcard',
    lastLoginTime: '2026-06-13 07:56:33',
    isRealNameVerified: true,
  },
];

export const mockServices: ServiceItem[] = [
  buildService('S001', '社保参保证明开具', '人社', '人力资源和社会保障局', '查询并打印个人社会保险参保证明，支持电子版下载', allCities, 0.5, true, ['本人身份证原件'], '免费', true, commonSteps.standard3),
  buildService('S002', '新生儿出生一件事联办', '卫健', '卫生健康委员会', '出生医学证明、户口登记、医保参保、社保登记等事项联合办理', allCities, 48.0, true, ['父母双方身份证', '结婚证', '生育服务证', '新生儿出生记录'], '免费', true),
  buildService('S003', '医保异地就医备案', '医疗保障', '医疗保障局', '办理跨省或跨市异地就医直接结算备案手续', allCities, 2.0, true, ['本人身份证', '社会保障卡', '异地居住证明（异地安置人员）'], '免费'),
  buildService('S004', '公积金提取-购房', '公积金', '住房公积金管理中心', '购买自住住房提取本人及配偶住房公积金账户余额', allCities, 6.0, true, ['购房合同', '首付款发票', '身份证', '结婚证（已婚）', '房产证（已办证的）'], '免费'),
  buildService('S005', '驾驶证期满换证', '公安', '公安局', '机动车驾驶证有效期满前90日内申请换证', allCities, 2.5, true, ['身份证原件', '原驾驶证', '身体条件证明', '1寸白底彩色照片'], '工本费10元'),
  buildService('S006', '不动产登记查询', '不动产', '规划和自然资源局', '查询个人名下不动产登记信息，出具查询结果证明', allCities, 1.0, true, ['本人身份证原件'], '免费'),
  buildService('S007', '个体工商户营业执照办理', '市场监管', '市场监督管理局', '申请设立个体工商户，领取加载统一社会信用代码的营业执照', allCities, 8.0, true, ['身份证原件', '经营场所证明', '个体工商户登记申请书'], '免费'),
  buildService('S008', '义务教育阶段子女入学报名', '教育', '教育局', '小学一年级、初中一年级新生入学网上报名登记', allCities, 24.0, true, ['户口簿', '房产证或租房合同', '父母身份证', '孩子出生医学证明'], '免费'),
  buildService('S009', '老年优待证办理', '民政', '民政局', '年满60周岁以上老年人申请办理老年人优待证，享受各项优待服务', allCities, 3.0, true, ['身份证原件', '近期1寸免冠彩色照片1张'], '免费'),
  buildService('S010', '医疗费用手工报销', '医疗保障', '医疗保障局', '未联网结算的医疗费用申请手工报销处理', allCities, 15.0, true, ['医疗发票原件', '费用明细清单', '出院证/诊断证明', '身份证', '银行卡'], '免费'),
  buildService('S011', '居住证办理', '公安', '公安局', '流动人口在居住地居住半年以上，符合有合法稳定就业等条件办理居住证', allCities, 72.0, true, ['身份证', '近期照片', '居住地住址证明', '就业证明或就读证明'], '免费'),
  buildService('S012', '社保转移接续', '人社', '人力资源和社会保障局', '跨统筹地区流动就业人员办理基本养老保险关系转移接续', allCities, 72.0, false, ['身份证', '原参保地社保缴费凭证', '转入地参保凭证'], '免费'),
  buildService('S013', '企业职工基本养老保险待遇领取资格认证', '人社', '人力资源和社会保障局', '离退休人员年度养老保险待遇领取资格在线认证', allCities, 0.3, true, ['身份证', '人脸活体检测'], '免费', true),
  buildService('S014', '住房公积金贷款申请', '公积金', '住房公积金管理中心', '缴存职工购买自住住房申请个人住房公积金贷款', allCities, 168.0, true, ['身份证', '户口本', '婚姻证明', '购房合同', '首付款凭证', '收入证明'], '免费'),
  buildService('S015', '出入境证件办理预约', '公安', '公安局', '预约办理普通护照、港澳通行证、台湾通行证等出入境证件', allCities, 0.5, true, ['身份证原件'], '证件费另计'),
  buildService('S016', '机动车注册登记', '公安', '公安局', '新购机动车申请注册登记，领取机动车号牌和行驶证', allCities, 4.0, false, ['身份证', '购车发票', '车辆购置税完税证明', '交强险凭证', '车辆合格证'], '工本费120元'),
  buildService('S017', '医疗保险参保登记', '医疗保障', '医疗保障局', '城乡居民或灵活就业人员办理基本医疗保险参保登记手续', allCities, 3.0, false, ['身份证', '户口本', '近期免冠照片'], '免费'),
  buildService('S018', '商品房买卖合同网签备案', '住建', '住房和城乡建设局', '新建商品房买卖合同网上签约及登记备案', allCities, 5.0, false, ['商品房买卖合同', '身份证明', '首付款发票'], '免费'),
  buildService('S019', '食品经营许可证办理', '市场监管', '市场监督管理局', '从事食品销售或餐饮服务经营活动申请食品经营许可', allCities, 48.0, false, ['营业执照', '身份证', '经营场所布局图', '健康证明'], '免费'),
  buildService('S020', '结婚登记预约', '民政', '民政局', '内地居民自愿结婚登记网上预约服务', allCities, 0.5, true, ['双方身份证', '双方户口簿', '3张2寸双方近期半身免冠合影照片'], '免费'),
  buildService('S021', '低保申请', '民政', '民政局', '共同生活的家庭成员人均收入低于当地低保标准等困难家庭申请最低生活保障', allCities, 96.0, false, ['身份证', '户口本', '家庭收入证明', '财产证明', '残疾证（如有）'], '免费'),
  buildService('S022', '个人所得税完税证明开具', '税务', '税务局', '查询并开具个人所得税完税证明或纳税记录', allCities, 0.5, true, ['身份证'], '免费', true),
  buildService('S023', '灵活就业人员社保参保登记', '人社', '人力资源和社会保障局', '无雇工的个体工商户、未在用人单位参保的非全日制从业人员等办理参保', allCities, 2.0, false, ['身份证', '户口本', '个人档案'], '免费'),
  buildService('S024', '残疾人证办理', '民政', '民政局', '符合残疾标准的申请人办理残疾人证，享受相关优惠政策', allCities, 72.0, false, ['身份证', '户口本', '二寸免冠照片', '病历资料'], '免费'),
  buildService('S025', '公租房申请', '住建', '住房和城乡建设局', '符合条件的住房困难家庭或个人申请公共租赁住房保障', allCities, 96.0, true, ['身份证', '户口本', '婚姻证明', '收入证明', '住房证明'], '免费'),
  buildService('S026', '道路运输从业人员资格证核发', '交通', '交通运输局', '经营性道路客货运输驾驶员等从业人员从业资格证办理', allCities, 24.0, false, ['身份证', '驾驶证', '三年无重大事故证明', '培训合格证明'], '工本费10元'),
  buildService('S027', '生育登记服务', '卫健', '卫生健康委员会', '育龄夫妻生育前办理生育登记，领取生育服务证', allCities, 1.0, true, ['双方身份证', '结婚证', '户口本'], '免费'),
  buildService('S028', '高校毕业生档案接收', '人社', '人力资源和社会保障局', '高校毕业生离校后学籍档案接收、存放、管理服务', allCities, 2.0, false, ['身份证', '毕业证', '报到证', '档案转移凭证'], '免费'),
  buildService('S029', '网约车驾驶员从业资格证申请', '交通', '交通运输局', '申请从事网约车经营服务的驾驶员资格认定', allCities, 24.0, false, ['身份证', '驾驶证', '三年无重大事故证明', '无暴力犯罪记录证明'], '免费'),
  buildService('S030', '社保卡申领', '人社', '人力资源和社会保障局', '首次申领加载金融功能的社会保障（市民）卡', allCities, 72.0, true, ['身份证', '1寸白底彩色照片'], '免费'),
  buildService('S031', '医保个人账户家庭共济备案', '医疗保障', '医疗保障局', '职工医保个人账户资金用于支付配偶、父母、子女的医疗费用备案', allCities, 1.0, true, ['身份证', '社保卡', '亲属关系证明'], '免费', true),
  buildService('S032', '住房公积金单位缴存登记', '公积金', '住房公积金管理中心', '新设立单位办理住房公积金缴存登记及账户设立', allCities, 4.0, false, ['营业执照', '法人身份证', '经办人身份证', '单位银行账户信息'], '免费'),
  buildService('S033', '企业开办一窗通', '市场监管', '市场监督管理局', '企业设立登记、刻章、开户、税务、社保、公积金一站式办理', allCities, 8.0, true, ['身份证', '公司章程', '股东身份证明', '经营场所证明'], '免费'),
  buildService('S034', '护士执业注册', '卫健', '卫生健康委员会', '通过护士执业资格考试人员申请首次注册', allCities, 12.0, false, ['身份证', '学历证书', '护士资格证书', '健康体检证明'], '免费'),
  buildService('S035', '教师资格认定', '教育', '教育局', '中小学教师资格申请认定和证书发放', allCities, 48.0, true, ['身份证', '学历证书', '教师资格考试合格证明', '普通话证书', '体检表'], '免费'),
  buildService('S036', '车辆购置税申报', '税务', '税务局', '购置应税车辆后办理车辆购置税纳税申报', allCities, 1.0, false, ['身份证', '车辆合格证', '购车发票'], '按规定缴税'),
  buildService('S037', '不动产权证办理（转移登记）', '不动产', '规划和自然资源局', '二手房买卖办理不动产权转移登记', allCities, 24.0, true, ['原不动产权证', '买卖合同', '双方身份证', '契税完税凭证'], '登记费80元/件'),
  buildService('S038', '失业保险金申领', '人社', '人力资源和社会保障局', '非因本人意愿中断就业的失业人员申领失业保险待遇', allCities, 5.0, true, ['身份证', '解除劳动合同证明', '失业登记证明'], '免费'),
  buildService('S039', '高龄津贴申请', '民政', '民政局', '80周岁以上老年人申请按月发放的高龄津贴', allCities, 48.0, false, ['身份证', '户口本', '1寸照片', '银行卡'], '免费'),
  buildService('S040', '城镇职工医保门诊慢特病认定', '医疗保障', '医疗保障局', '患有规定范围内门诊慢特病的参保人员申请门诊特殊疾病认定', allCities, 48.0, false, ['身份证', '社保卡', '近两年住院病历', '近期检查报告'], '免费'),
  buildService('S041', '计划生育奖励扶助申请', '卫健', '卫生健康委员会', '农村部分计划生育家庭申请奖励扶助金', allCities, 72.0, false, ['身份证', '户口本', '结婚证', '独生子女证'], '免费'),
  buildService('S042', '建筑业企业资质办理', '住建', '住房和城乡建设局', '建筑施工企业申请工程施工资质', allCities, 96.0, false, ['营业执照', '法人身份证', '人员资格证书', '业绩证明'], '免费'),
  buildService('S043', '化妆品经营备案', '市场监管', '市场监督管理局', '化妆品经营者办理经营备案登记', allCities, 8.0, false, ['营业执照', '法人身份证', '经营场所证明'], '免费'),
  buildService('S044', '医疗机构执业许可证校验', '卫健', '卫生健康委员会', '医疗机构对执业许可证进行年度校验', allCities, 24.0, false, ['执业许可证正本', '校验申请书', '人员资质证明', '年度工作报告'], '免费'),
  buildService('S045', '取水许可审批', '水利', '水务局', '单位或个人申请利用取水工程或设施直接取水许可', allCities, 48.0, false, ['申请书', '法定代表人身份证明', '取水项目可行性报告', '水资源论证报告'], '按规定收费'),
  buildService('S046', '排污许可证申请', '环保', '生态环境局', '排放污染物的企事业单位申请排污许可证', allCities, 72.0, false, ['营业执照', '法人身份证', '环评批复', '污染物监测报告'], '免费'),
  buildService('S047', '道路危险货物运输许可', '交通', '交通运输局', '企业申请从事道路危险货物运输经营许可', allCities, 96.0, false, ['营业执照', '车辆证明', '驾驶员资格证', '安全生产管理制度'], '免费'),
  buildService('S048', '工伤认定申请', '人社', '人力资源和社会保障局', '职工因工受伤或患职业病后申请工伤认定', allCities, 48.0, false, ['工伤认定申请表', '劳动关系证明', '医疗诊断证明', '身份证'], '免费'),
  buildService('S049', '临时身份证办理', '公安', '公安局', '居民在申请领取换领、补领居民身份证期间急需使用身份证可申请', allCities, 0.5, false, ['户口本', '居民身份证领取凭证'], '工本费10元'),
  buildService('S050', '再生育审批', '卫健', '卫生健康委员会', '符合再生育条件的夫妻申请再生育一个子女的审批', allCities, 72.0, false, ['双方身份证', '结婚证', '户口本', '已有子女情况证明'], '免费'),
  buildService('S051', '退役士兵自主就业一次性经济补助给付', '退役军人', '退役军人事务局', '自主就业退役士兵领取一次性经济补助', allCities, 48.0, false, ['退伍证', '身份证', '户口本', '退役手续材料'], '免费'),
  buildService('S052', '创业担保贷款申请', '人社', '人力资源和社会保障局', '符合条件的创业者申请创业担保贷款及贴息支持', allCities, 96.0, true, ['身份证', '营业执照', '创业项目计划书', '担保材料'], '免费'),
];

const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '华', '文', '辉', '健', '玲', '锋', '斌', '波'];
const statuses: RecordStatus[] = ['pending', 'processing', 'completed', 'completed', 'completed', 'completed', 'rejected', 'overdue'];
const sentiments: Sentiment[] = ['positive', 'positive', 'positive', 'positive', 'positive', 'neutral', 'negative'];
const positiveReviews = [
  '办理速度很快，全程线上操作，非常方便！',
  '服务态度很好，流程清晰，一次通过，满意。',
  '效率很高，当天就办好啦，点赞！',
  '材料齐全的话办理非常顺利，省去了跑窗口的麻烦。',
  '政务服务越来越便民了，好评！',
  '操作指引很详细，第一次用也很顺利。',
  '客服回复及时，问题都解决了。',
  '比以前方便太多了，在家就能办。',
];
const neutralReviews = [
  '整体还行，就是等待时间稍微长了点。',
  '流程有点繁琐，但办下来了。',
  '一般般吧，中规中矩。',
  '材料需要的有点多，不过也能理解。',
  '办理过程中有些小问题，但总体满意。',
];
const negativeReviews = [
  '审核太慢了，等了好几天，希望能改进。',
  '系统不太稳定，提交了好几次才成功。',
  '有些要求不太合理，希望可以优化。',
  '沟通不够顺畅，来回补了好几次材料。',
  '体验不太好，指引不够清晰。',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return 'BJ' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function generateName(): string {
  return randomFrom(surnames) + randomFrom(givenNames);
}

function daysAgo(days: number, hour = 9, min = 0): string {
  const d = new Date(2026, 5, 13);
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const districtsByCity: Record<City, string[]> = {
  chengdu: cityOptions[0].districts,
  deyang: cityOptions[1].districts,
  meishan: cityOptions[2].districts,
  ziyang: cityOptions[3].districts,
};

export const mockServiceRecords: ServiceRecord[] = [];

const serviceSample = [
  { serviceId: 'S001', serviceName: '社保参保证明开具', category: '人社' as Category, bureau: '人力资源和社会保障局' },
  { serviceId: 'S002', serviceName: '新生儿出生一件事联办', category: '卫健' as Category, bureau: '卫生健康委员会' },
  { serviceId: 'S003', serviceName: '医保异地就医备案', category: '医疗保障' as Category, bureau: '医疗保障局' },
  { serviceId: 'S004', serviceName: '公积金提取-购房', category: '公积金' as Category, bureau: '住房公积金管理中心' },
  { serviceId: 'S005', serviceName: '驾驶证期满换证', category: '公安' as Category, bureau: '公安局' },
  { serviceId: 'S006', serviceName: '不动产登记查询', category: '不动产' as Category, bureau: '规划和自然资源局' },
  { serviceId: 'S007', serviceName: '个体工商户营业执照办理', category: '市场监管' as Category, bureau: '市场监督管理局' },
  { serviceId: 'S008', serviceName: '义务教育阶段子女入学报名', category: '教育' as Category, bureau: '教育局' },
  { serviceId: 'S009', serviceName: '老年优待证办理', category: '民政' as Category, bureau: '民政局' },
  { serviceId: 'S010', serviceName: '医疗费用手工报销', category: '医疗保障' as Category, bureau: '医疗保障局' },
  { serviceId: 'S011', serviceName: '居住证办理', category: '公安' as Category, bureau: '公安局' },
  { serviceId: 'S012', serviceName: '社保转移接续', category: '人社' as Category, bureau: '人力资源和社会保障局' },
  { serviceId: 'S013', serviceName: '养老保险待遇资格认证', category: '人社' as Category, bureau: '人力资源和社会保障局' },
  { serviceId: 'S014', serviceName: '住房公积金贷款申请', category: '公积金' as Category, bureau: '住房公积金管理中心' },
  { serviceId: 'S015', serviceName: '出入境证件办理预约', category: '公安' as Category, bureau: '公安局' },
  { serviceId: 'S016', serviceName: '机动车注册登记', category: '公安' as Category, bureau: '公安局' },
  { serviceId: 'S020', serviceName: '结婚登记预约', category: '民政' as Category, bureau: '民政局' },
  { serviceId: 'S022', serviceName: '个税完税证明开具', category: '税务' as Category, bureau: '税务局' },
  { serviceId: 'S025', serviceName: '公租房申请', category: '住建' as Category, bureau: '住房和城乡建设局' },
  { serviceId: 'S030', serviceName: '社保卡申领', category: '人社' as Category, bureau: '人力资源和社会保障局' },
  { serviceId: 'S033', serviceName: '企业开办一窗通', category: '市场监管' as Category, bureau: '市场监督管理局' },
  { serviceId: 'S035', serviceName: '教师资格认定', category: '教育' as Category, bureau: '教育局' },
  { serviceId: 'S037', serviceName: '不动产权证办理', category: '不动产' as Category, bureau: '规划和自然资源局' },
  { serviceId: 'S038', serviceName: '失业保险金申领', category: '人社' as Category, bureau: '人力资源和社会保障局' },
  { serviceId: 'S052', serviceName: '创业担保贷款申请', category: '人社' as Category, bureau: '人力资源和社会保障局' },
];

for (let i = 0; i < 65; i++) {
  const city: City = allCities[i % 4];
  const service = randomFrom(serviceSample);
  const status = randomFrom(statuses);
  const daysAgoVal = i % 30;
  const submitTime = daysAgo(daysAgoVal, randomInt(8, 17), randomInt(0, 59));

  let completeTime: string | undefined;
  let actualDurationHours: number | undefined;
  let actualDuration: string | undefined;
  let rating: number | undefined;
  let reviewText: string | undefined;
  let sentiment: Sentiment | undefined;
  let rejectReason: string | undefined;

  const svc = mockServices.find(s => s.id === service.serviceId);
  const baseHours = svc?.avgDurationHours ?? 4;

  if (status === 'completed' || status === 'rejected' || status === 'overdue') {
    const extraHours = baseHours * (status === 'overdue' ? 1.8 : 0.6) + randomInt(1, 12);
    const ct = new Date(submitTime);
    ct.setHours(ct.getHours() + Math.floor(extraHours));
    ct.setMinutes(ct.getMinutes() + randomInt(0, 59));
    completeTime = ct.toISOString().replace('T', ' ').slice(0, 19);
    actualDurationHours = Math.round(extraHours * 10) / 10;
    actualDuration = `${Math.floor(extraHours)}小时${Math.round((extraHours % 1) * 60)}分钟`;
  }

  if (status === 'completed') {
    const hasReview = Math.random() > 0.3;
    if (hasReview) {
      sentiment = randomFrom(sentiments);
      if (sentiment === 'positive') {
        rating = randomInt(4, 5);
        reviewText = randomFrom(positiveReviews);
      } else if (sentiment === 'neutral') {
        rating = 3;
        reviewText = randomFrom(neutralReviews);
      } else {
        rating = randomInt(1, 2);
        reviewText = randomFrom(negativeReviews);
      }
    }
  }

  if (status === 'rejected') {
    rejectReason = randomFrom([
      '提交材料不完整，请补充相关证明文件',
      '信息填写有误，请核实后重新提交',
      '不符合办理条件，请查看申请须知',
      '上传的材料图片不清晰，请重新上传',
    ]);
  }

  mockServiceRecords.push({
    id: generateId() + i,
    userId: 'U' + String((i % 3) + 1).padStart(3, '0'),
    userName: generateName(),
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    category: service.category,
    bureau: service.bureau,
    city,
    district: randomFrom(districtsByCity[city]),
    status,
    submitTime,
    completeTime,
    actualDuration,
    actualDurationHours,
    rating,
    reviewText,
    sentiment,
    handler: '办理员' + randomFrom(['张', '王', '李', '赵', '陈']) + randomFrom(['东', '南', '西', '北', '明']),
    rejectReason,
  });
}

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'F001',
    userId: 'U001',
    name: '张德明',
    relation: 'parent',
    relationText: '父亲',
    idCard: '510104195508150055',
    phone: '13800138050',
    birthDate: '1955-08-15',
    isVerified: true,
  },
  {
    id: 'F002',
    userId: 'U001',
    name: '王秀芬',
    relation: 'parent',
    relationText: '母亲',
    idCard: '510104195710220066',
    phone: '13800138051',
    birthDate: '1957-10-22',
    isVerified: true,
  },
  {
    id: 'F003',
    userId: 'U001',
    name: '刘雪梅',
    relation: 'spouse',
    relationText: '配偶',
    idCard: '510105198603180088',
    phone: '13800138002',
    birthDate: '1986-03-18',
    isVerified: true,
  },
  {
    id: 'F004',
    userId: 'U001',
    name: '张思雨',
    relation: 'child',
    relationText: '女儿',
    idCard: '510104201211050099',
    birthDate: '2012-11-05',
    isVerified: true,
  },
  {
    id: 'F005',
    userId: 'U001',
    name: '张明远',
    relation: 'child',
    relationText: '儿子',
    idCard: '510104201805200077',
    birthDate: '2018-05-20',
    isVerified: true,
  },
  {
    id: 'F006',
    userId: 'U002',
    name: '李荣华',
    relation: 'parent',
    relationText: '父亲',
    idCard: '510603195206050011',
    phone: '13900139050',
    birthDate: '1952-06-05',
    isVerified: true,
  },
  {
    id: 'F007',
    userId: 'U002',
    name: '陈志强',
    relation: 'spouse',
    relationText: '配偶',
    idCard: '510603197609150033',
    phone: '13900139003',
    birthDate: '1976-09-15',
    isVerified: true,
  },
  {
    id: 'F008',
    userId: 'U002',
    name: '陈思远',
    relation: 'child',
    relationText: '儿子',
    idCard: '510603200803250055',
    birthDate: '2008-03-25',
    isVerified: true,
  },
  {
    id: 'F009',
    userId: 'U003',
    name: '王友福',
    relation: 'parent',
    relationText: '父亲',
    idCard: '511402196204100011',
    phone: '13700137050',
    birthDate: '1962-04-10',
    isVerified: true,
  },
  {
    id: 'F010',
    userId: 'U003',
    name: '周丽娟',
    relation: 'spouse',
    relationText: '配偶',
    idCard: '511402199107220022',
    phone: '13700137004',
    birthDate: '1991-07-22',
    isVerified: true,
  },
  {
    id: 'F011',
    userId: 'U003',
    name: '王诗雅',
    relation: 'child',
    relationText: '女儿',
    idCard: '511402202012080033',
    birthDate: '2020-12-08',
    isVerified: true,
  },
  {
    id: 'F012',
    userId: 'U003',
    name: '王建军',
    relation: 'other',
    relationText: '兄弟',
    idCard: '511402198802150044',
    phone: '13700137051',
    birthDate: '1988-02-15',
    isVerified: true,
  },
];

const cityNames: Record<City, string> = {
  chengdu: '成都市',
  deyang: '德阳市',
  meishan: '眉山市',
  ziyang: '资阳市',
};

function buildDistrictHeats(): DistrictHeat[] {
  const list: DistrictHeat[] = [];
  cityOptions.forEach(opt => {
    const baseWeight = opt.value === 'chengdu' ? 3.2 : opt.value === 'deyang' ? 1.6 : opt.value === 'meishan' ? 1.2 : 1.0;
    opt.districts.forEach(district => {
      const districtFactor = district.includes('锦江') || district.includes('旌阳') || district.includes('东坡') || district.includes('雁江') ? 1.5 : 1;
      const count = Math.round(randomInt(200, 1800) * baseWeight * districtFactor);
      list.push({
        city: opt.value,
        cityName: cityNames[opt.value],
        district,
        count,
      });
    });
  });
  return list.sort((a, b) => b.count - a.count);
}

const ageGroupDefs = [
  { label: '0-18岁', min: 0, max: 18, weight: 0.45 },
  { label: '19-35岁', min: 19, max: 35, weight: 1.8 },
  { label: '36-50岁', min: 36, max: 50, weight: 2.2 },
  { label: '51-65岁', min: 51, max: 65, weight: 1.4 },
  { label: '65岁以上', min: 65, max: 120, weight: 0.85 },
];

function buildAgeHeats(): AgeHeat[] {
  const base = 8500;
  return ageGroupDefs.map(g => {
    const total = Math.round(base * g.weight + randomInt(200, 1500));
    const maleRatio = g.max <= 18 ? 1.08 : g.min >= 65 ? 0.82 : 1.02;
    const male = Math.round(total * maleRatio / (1 + maleRatio));
    return {
      ageGroup: g.label,
      minAge: g.min,
      maxAge: g.max,
      count: total,
      maleCount: male,
      femaleCount: total - male,
    };
  });
}

function buildTimeSlotHeats(): TimeSlotHeat[] {
  const list: TimeSlotHeat[] = [];
  for (let h = 0; h < 24; h++) {
    let weight: number;
    if (h >= 9 && h <= 11) weight = 3.0;
    else if (h >= 14 && h <= 16) weight = 2.8;
    else if (h >= 19 && h <= 21) weight = 2.2;
    else if (h >= 8 && h <= 8) weight = 1.5;
    else if (h >= 12 && h <= 13) weight = 1.2;
    else if (h >= 17 && h <= 18) weight = 1.4;
    else if (h >= 22 && h <= 23) weight = 0.8;
    else if (h >= 0 && h <= 5) weight = 0.12;
    else weight = 0.5;

    const count = Math.round(randomInt(150, 600) * weight);
    list.push({
      hour: h,
      timeSlot: `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`,
      timeRange: `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`,
      count,
      avgWaitMinutes: Math.round(randomInt(2, 15) * weight),
    });
  }
  return list;
}

function buildTopServices(): TopService[] {
  const topServiceList = [
    { serviceId: 'S001', serviceName: '社保参保证明开具', category: '人社' as Category, base: 3800, trend: 'up' as const },
    { serviceId: 'S003', serviceName: '医保异地就医备案', category: '医疗保障' as Category, base: 3200, trend: 'up' as const },
    { serviceId: 'S013', serviceName: '养老保险待遇资格认证', category: '人社' as Category, base: 2950, trend: 'flat' as const },
    { serviceId: 'S004', serviceName: '公积金提取-购房', category: '公积金' as Category, base: 2600, trend: 'down' as const },
    { serviceId: 'S005', serviceName: '驾驶证期满换证', category: '公安' as Category, base: 2400, trend: 'up' as const },
    { serviceId: 'S006', serviceName: '不动产登记查询', category: '不动产' as Category, base: 2200, trend: 'up' as const },
    { serviceId: 'S002', serviceName: '新生儿出生一件事联办', category: '卫健' as Category, base: 1980, trend: 'up' as const },
    { serviceId: 'S010', serviceName: '医疗费用手工报销', category: '医疗保障' as Category, base: 1850, trend: 'flat' as const },
    { serviceId: 'S008', serviceName: '义务教育阶段子女入学报名', category: '教育' as Category, base: 1720, trend: 'up' as const },
    { serviceId: 'S011', serviceName: '居住证办理', category: '公安' as Category, base: 1550, trend: 'down' as const },
  ];
  return topServiceList.map((t, i) => ({
    rank: i + 1,
    serviceId: t.serviceId,
    serviceName: t.serviceName,
    category: t.category,
    count: t.base + randomInt(-150, 250),
    trend: t.trend,
  }));
}

export const mockHeatmapData: HeatmapData = {
  districtHeats: buildDistrictHeats(),
  ageHeats: buildAgeHeats(),
  timeSlotHeats: buildTimeSlotHeats(),
  topServices: buildTopServices(),
  lastUpdated: '2026-06-13 10:30:00',
};

function buildTrendPoints(): TrendPoint[] {
  const list: TrendPoint[] = [];
  const base = 11000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(2026, 5, 13);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const weekendFactor = isWeekend ? 0.78 : 1.0;
    const dayFactor = 1 + (Math.sin(i * 0.6) + 1) * 0.08;
    const count = Math.round((base + randomInt(-800, 1500)) * weekendFactor * dayFactor);
    const completed = Math.round(count * (0.9 + Math.random() * 0.08));
    const avgHours = Math.round((3.5 + Math.random() * 1.8 + (isWeekend ? 0.8 : 0)) * 10) / 10;
    list.push({ date: dateStr, count, completedCount: completed, avgDurationHours: avgHours });
  }
  return list;
}

function buildBureauOverdues(): BureauOverdue[] {
  const bureauData = [
    { b: '人力资源和社会保障局', t: 2380, o: 28 },
    { b: '医疗保障局', t: 1860, o: 22 },
    { b: '住房公积金管理中心', t: 1520, o: 31 },
    { b: '公安局', t: 2650, o: 18 },
    { b: '规划和自然资源局', t: 980, o: 45 },
    { b: '市场监督管理局', t: 1450, o: 35 },
    { b: '住房和城乡建设局', t: 820, o: 28 },
    { b: '卫生健康委员会', t: 1120, o: 24 },
    { b: '民政局', t: 960, o: 15 },
    { b: '教育局', t: 680, o: 10 },
    { b: '税务局', t: 840, o: 8 },
    { b: '交通运输局', t: 580, o: 22 },
  ];
  return bureauData.map(x => ({
    bureau: x.b,
    totalCount: x.t + randomInt(-200, 200),
    overdueCount: x.o + randomInt(-5, 10),
    overdueRate: 0,
  })).map(x => ({
    ...x,
    overdueRate: Math.round((x.overdueCount / x.totalCount) * 10000) / 100,
  })).sort((a, b) => b.overdueCount - a.overdueCount);
}

function buildSentimentStats(): SentimentStat[] {
  const total = 10246;
  const p = Math.round(total * 0.725);
  const n = Math.round(total * 0.195);
  const ne = total - p - n;
  return [
    { sentiment: 'positive', label: '正面', count: p, percentage: Math.round((p / total) * 1000) / 10 },
    { sentiment: 'neutral', label: '中性', count: ne, percentage: Math.round((ne / total) * 1000) / 10 },
    { sentiment: 'negative', label: '负面', count: n, percentage: Math.round((n / total) * 1000) / 10 },
  ];
}

function buildBureauStatuses(): BureauStatus[] {
  return bureauList.slice(0, 23).map((b, i) => {
    const disconnected = i === 18;
    const poor = i === 14 || i === 20;
    return {
      bureau: b,
      isConnected: !disconnected,
      responseTimeMs: disconnected ? 0 : poor ? randomInt(1800, 3500) : randomInt(80, 850),
      lastUpdateTime: disconnected ? '--' : daysAgo(0, randomInt(9, 10), randomInt(0, 59)),
      serviceCount: randomInt(3, 48),
    };
  });
}

function buildLowReviews(): LowReview[] {
  const reviews: LowReview[] = [];
  const reviewPool = [
    { service: '公积金提取-购房', bureau: '住房公积金管理中心', rating: 2, text: '等待时间太长了，一周过去了还在审核中，希望能提速。' },
    { service: '不动产权证办理', bureau: '规划和自然资源局', rating: 1, text: '来回跑了三趟，每次说材料不一样，能不能一次性说清楚！' },
    { service: '医保异地就医备案', bureau: '医疗保障局', rating: 2, text: '系统提交了三次都显示失败，最后还是打电话人工解决的。' },
    { service: '居住证办理', bureau: '公安局', rating: 2, text: '预约了号结果到了现场说系统坏了，白跑一趟。' },
    { service: '社保转移接续', bureau: '人力资源和社会保障局', rating: 1, text: '三个月了还没转过来，两边踢皮球，体验太差。' },
    { service: '公租房申请', bureau: '住房和城乡建设局', rating: 2, text: '流程不够透明，不知道审核到哪一步了，等待遥遥无期。' },
    { service: '医疗费用手工报销', bureau: '医疗保障局', rating: 2, text: '材料要求太苛刻，住院发票复印件不认可，必须要原件。' },
    { service: '创业担保贷款申请', bureau: '人力资源和社会保障局', rating: 1, text: '门槛太高，各种担保要求，普通人根本贷不到。' },
    { service: '食品经营许可证办理', bureau: '市场监督管理局', rating: 2, text: '现场检查太严苛，一点点小问题就让整改，效率低。' },
    { service: '排污许可证申请', bureau: '生态环境局', rating: 1, text: '办理周期太长，严重影响我们企业投产计划。' },
  ];

  reviewPool.forEach((r, i) => {
    const city: City = allCities[i % 4];
    reviews.push({
      id: 'LR' + String(i + 1).padStart(3, '0'),
      serviceName: r.service,
      userName: generateName(),
      rating: r.rating,
      reviewText: r.text,
      submitTime: daysAgo(i % 8, randomInt(10, 18), randomInt(0, 59)),
      bureau: r.bureau,
      city,
      sentiment: r.rating <= 2 ? 'negative' : 'neutral',
    });
  });
  return reviews;
}

export const mockDashboardData: DashboardData = {
  todayCount: 12847,
  todayCompletedCount: 8962,
  avgDurationHours: 4.2,
  onTimeRate: 98.6,
  satisfactionRate: 96.3,
  trendPoints: buildTrendPoints(),
  bureauOverdues: buildBureauOverdues(),
  sentimentStats: buildSentimentStats(),
  bureauStatuses: buildBureauStatuses(),
  lowReviews: buildLowReviews(),
  lastUpdated: '2026-06-13 10:30:00',
};
