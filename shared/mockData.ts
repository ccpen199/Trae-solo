import {
  CityCode,
  CityPolicy,
  CityRatePlan,
  InsuranceType,
  PolicyDocument,
  Hospital,
  Transaction,
  Certificate,
  Ticket,
  Employee,
  PayrollBatch,
  CITIES,
  CITY_NAMES,
  INSURANCE_NAMES,
} from './types';

export const cityPolicies: Record<CityCode, CityPolicy> = {
  BJ: { code: 'BJ', name: '北京', socialAvgSalary: 13730, minBase: 6326, maxBase: 33891, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['养老医疗待遇优厚', '公积金贷款最高160万', '医保报销比例高'] },
  SH: { code: 'SH', name: '上海', socialAvgSalary: 12183, minBase: 7310, maxBase: 36549, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['最低工资标准高', '医保覆盖范围广', '人才落户政策优'] },
  GZ: { code: 'GZ', name: '广州', socialAvgSalary: 12613, minBase: 4588, maxBase: 37839, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['缴费基数下限低', '珠三角医保互通', '粤港澳大湾区政策'] },
  SZ: { code: 'SZ', name: '深圳', socialAvgSalary: 13730, minBase: 23608, maxBase: 37839, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['社平工资领先全国', '一档医保待遇优', '前海个税优惠'] },
  HZ: { code: 'HZ', name: '杭州', socialAvgSalary: 12231, minBase: 4927, maxBase: 36675, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['数字经济人才补贴', '灵活就业政策松', '共同富裕示范区'] },
  TJ: { code: 'TJ', name: '天津', socialAvgSalary: 9835, minBase: 4920, maxBase: 29493, baseRangeMinPercent: 60, baseRangeMaxPercent: 300, highlights: ['京津冀协同发展', '生活成本较低', '滨海新区政策优惠'] },
};

const rates: Record<CityCode, Partial<Record<InsuranceType, { p: number; c: number; f?: number }>>> = {
  BJ: { PENSION: { p: 8, c: 16 }, MEDICAL: { p: 2, c: 9.8, f: 3 }, UNEMPLOYMENT: { p: 0.5, c: 0.5 }, INJURY: { p: 0, c: 0.4 }, MATERNITY: { p: 0, c: 0.8 }, HOUSING_FUND: { p: 12, c: 12 } },
  SH: { PENSION: { p: 8, c: 16 }, MEDICAL: { p: 2, c: 9.5, f: 2 }, UNEMPLOYMENT: { p: 0.5, c: 0.5 }, INJURY: { p: 0, c: 0.26 }, MATERNITY: { p: 0, c: 1 }, HOUSING_FUND: { p: 7, c: 7 } },
  GZ: { PENSION: { p: 8, c: 15 }, MEDICAL: { p: 2, c: 5.5, f: 3 }, UNEMPLOYMENT: { p: 0.2, c: 0.48 }, INJURY: { p: 0, c: 0.16 }, MATERNITY: { p: 0, c: 0.45 }, HOUSING_FUND: { p: 12, c: 12 } },
  SZ: { PENSION: { p: 8, c: 15 }, MEDICAL: { p: 2, c: 6.2, f: 3 }, UNEMPLOYMENT: { p: 0.3, c: 0.7 }, INJURY: { p: 0, c: 0.2 }, MATERNITY: { p: 0, c: 0.45 }, HOUSING_FUND: { p: 12, c: 12 } },
  HZ: { PENSION: { p: 8, c: 15 }, MEDICAL: { p: 2, c: 9.5, f: 3 }, UNEMPLOYMENT: { p: 0.5, c: 0.5 }, INJURY: { p: 0, c: 0.2 }, MATERNITY: { p: 0, c: 0.5 }, HOUSING_FUND: { p: 12, c: 12 } },
  TJ: { PENSION: { p: 8, c: 16 }, MEDICAL: { p: 2, c: 9, f: 2 }, UNEMPLOYMENT: { p: 0.5, c: 0.5 }, INJURY: { p: 0, c: 0.2 }, MATERNITY: { p: 0, c: 0.5 }, HOUSING_FUND: { p: 11, c: 11 } },
};

const lb = (city: CityCode, t: InsuranceType) => {
  const data: any = {
    PENSION: {
      BJ: { title: '北京市基本养老保险规定', docNo: '市政府令第183号', effectiveDate: '2007-01-01', article: '第十二条', url: '#' },
      SH: { title: '上海市城镇职工养老保险办法', docNo: '沪府发〔1998〕36号', effectiveDate: '1998-09-01', article: '第十条', url: '#' },
      GZ: { title: '广州市社会养老保险条例', docNo: '穗府〔2008〕8号', effectiveDate: '2008-01-01', article: '第十三条', url: '#' },
      SZ: { title: '深圳经济特区社会养老保险条例', docNo: '深人社规〔2021〕8号', effectiveDate: '2021-08-01', article: '第十一条', url: '#' },
      HZ: { title: '杭州市职工基本养老保险暂行办法', docNo: '杭政办〔2011〕22号', effectiveDate: '2011-07-01', article: '第九条', url: '#' },
      TJ: { title: '天津市城镇企业职工养老保险条例', docNo: '津人发〔1996〕27号', effectiveDate: '1996-01-01', article: '第十二条', url: '#' },
    },
    MEDICAL: {
      BJ: { title: '北京市基本医疗保险规定', docNo: '市政府令第158号', effectiveDate: '2005-06-06', article: '第十一条', url: '#' },
      SH: { title: '上海市职工基本医疗保险办法', docNo: '沪府令第60号', effectiveDate: '2013-12-01', article: '第十四条', url: '#' },
      GZ: { title: '广州市社会医疗保险规定', docNo: '穗府规〔2022〕3号', effectiveDate: '2022-07-01', article: '第十二条', url: '#' },
      SZ: { title: '深圳市社会医疗保险办法', docNo: '深府令第256号', effectiveDate: '2022-10-01', article: '第十一条', url: '#' },
      HZ: { title: '杭州市基本医疗保险办法', docNo: '杭政办函〔2020〕8号', effectiveDate: '2020-01-01', article: '第十条', url: '#' },
      TJ: { title: '天津市职工基本医疗保险规定', docNo: '津政发〔2017〕16号', effectiveDate: '2017-08-01', article: '第十一条', url: '#' },
    },
    UNEMPLOYMENT: {
      BJ: { title: '北京市失业保险规定', docNo: '市政府令第38号', effectiveDate: '1999-11-01', article: '第七条', url: '#' },
      SH: { title: '上海市失业保险办法', docNo: '沪府发〔1999〕7号', effectiveDate: '1999-04-01', article: '第六条', url: '#' },
      GZ: { title: '广东省失业保险条例', docNo: '粤常发〔2013〕21号', effectiveDate: '2014-07-01', article: '第八条', url: '#' },
      SZ: { title: '深圳经济特区失业保险若干规定', docNo: '深人大常〔2022〕26号', effectiveDate: '2023-01-01', article: '第五条', url: '#' },
      HZ: { title: '浙江省失业保险条例', docNo: '浙人大常〔2022〕68号', effectiveDate: '2023-01-01', article: '第十二条', url: '#' },
      TJ: { title: '天津市失业保险条例', docNo: '津人发〔2014〕15号', effectiveDate: '2015-01-01', article: '第六条', url: '#' },
    },
    INJURY: {
      BJ: { title: '北京市实施《工伤保险条例》办法', docNo: '市政府令第140号', effectiveDate: '2004-01-01', article: '第八条', url: '#' },
      SH: { title: '上海市工伤保险实施办法', docNo: '沪府令第93号', effectiveDate: '2013-01-01', article: '第十条', url: '#' },
      GZ: { title: '广东省工伤保险条例', docNo: '粤常发〔2019〕58号', effectiveDate: '2020-01-01', article: '第十一条', url: '#' },
      SZ: { title: '广东省工伤保险条例实施', docNo: '深人社规〔2020〕8号', effectiveDate: '2020-07-01', article: '第六条', url: '#' },
      HZ: { title: '浙江省工伤保险条例', docNo: '浙人大常〔2020〕38号', effectiveDate: '2021-01-01', article: '第九条', url: '#' },
      TJ: { title: '天津市工伤保险若干规定', docNo: '津政令第24号', effectiveDate: '2020-03-01', article: '第七条', url: '#' },
    },
    MATERNITY: {
      BJ: { title: '北京市企业职工生育保险规定', docNo: '市政府令第154号', effectiveDate: '2005-07-01', article: '第七条', url: '#' },
      SH: { title: '上海市城镇生育保险办法', docNo: '沪市府令第11号', effectiveDate: '2001-11-01', article: '第六条', url: '#' },
      GZ: { title: '广州市职工生育保险实施办法', docNo: '穗府办〔2019〕27号', effectiveDate: '2019-10-01', article: '第五条', url: '#' },
      SZ: { title: '深圳市职工生育保险规定', docNo: '深府令第273号', effectiveDate: '2023-10-01', article: '第七条', url: '#' },
      HZ: { title: '杭州市生育保险办法', docNo: '杭政办函〔2019〕97号', effectiveDate: '2020-01-01', article: '第六条', url: '#' },
      TJ: { title: '天津市职工生育保险规定', docNo: '津政办发〔2018〕23号', effectiveDate: '2018-09-01', article: '第六条', url: '#' },
    },
    HOUSING_FUND: {
      BJ: { title: '北京住房公积金缴存管理办法', docNo: '京房公积金管委会〔2006〕2号', effectiveDate: '2006-03-01', article: '第五条', url: '#' },
      SH: { title: '上海市住房公积金缴存管理办法', docNo: '沪公积金管委会〔2018〕4号', effectiveDate: '2018-04-01', article: '第五条', url: '#' },
      GZ: { title: '广州市住房公积金缴存管理办法', docNo: '穗公积金管委会〔2019〕1号', effectiveDate: '2019-07-01', article: '第六条', url: '#' },
      SZ: { title: '深圳市住房公积金缴存管理规定', docNo: '深公积金规〔2022〕2号', effectiveDate: '2022-09-01', article: '第六条', url: '#' },
      HZ: { title: '杭州住房公积金缴存管理办法', docNo: '杭房公委〔2021〕3号', effectiveDate: '2021-07-01', article: '第五条', url: '#' },
      TJ: { title: '天津市住房公积金缴存管理办法', docNo: '津公积金委〔2022〕5号', effectiveDate: '2022-09-01', article: '第六条', url: '#' },
    },
  };
  return data[t][city] || { title: '中华人民共和国社会保险法', docNo: '主席令第35号', effectiveDate: '2011-07-01', article: '基础条款', url: '#' };
};

export const cityRatePlans: Record<CityCode, CityRatePlan> = Object.fromEntries(
  CITIES.map((code) => {
    const types: InsuranceType[] = ['PENSION', 'MEDICAL', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY', 'HOUSING_FUND'];
    const items = types.map(t => {
      const r = rates[code][t];
      return { type: t, name: INSURANCE_NAMES[t], personalRate: r.p, companyRate: r.c, fixedAmount: r.f, legalBasis: lb(code, t) };
    });
    return [code, { cityCode: code, cityName: CITY_NAMES[code], effectiveDate: '2025-01-01', items }];
  })
) as Record<CityCode, CityRatePlan>;

const hn: Record<CityCode, Array<{ n: string; l: Hospital['level']; a: string }>> = {
  BJ: [
    { n: '北京协和医院', l: '三甲', a: '东城区帅府园一号' },
    { n: '北京大学第一医院', l: '三甲', a: '西城区西什库大街8号' },
    { n: '中日友好医院', l: '三甲', a: '朝阳区樱花园东街2号' },
    { n: '北京同仁医院', l: '三甲', a: '东城区东交民巷1号' },
    { n: '朝阳区望京社区卫生中心', l: '社区', a: '朝阳区望京街道' },
  ],
  SH: [
    { n: '复旦大学附属中山医院', l: '三甲', a: '徐汇区枫林路180号' },
    { n: '瑞金医院', l: '三甲', a: '黄浦区瑞金二路197号' },
    { n: '上海市第一人民医院', l: '三甲', a: '虹口区武进路85号' },
    { n: '上海市第六人民医院', l: '三甲', a: '徐汇区宜山路600号' },
    { n: '陆家嘴社区卫生服务中心', l: '社区', a: '浦东新区陆家嘴' },
  ],
  GZ: [
    { n: '中山大学附属第一医院', l: '三甲', a: '越秀区中山二路58号' },
    { n: '南方医科大学南方医院', l: '三甲', a: '白云区广州大道北1838号' },
    { n: '广东省人民医院', l: '三甲', a: '越秀区中山二路106号' },
    { n: '广州市第一人民医院', l: '三甲', a: '越秀区盘福路1号' },
    { n: '天河区石牌社区卫服中心', l: '社区', a: '天河区石牌街道' },
  ],
  SZ: [
    { n: '深圳市人民医院', l: '三甲', a: '罗湖区东门北路1017号' },
    { n: '北京大学深圳医院', l: '三甲', a: '福田区莲花路1120号' },
    { n: '深圳市第二人民医院', l: '三甲', a: '福田区笋岗西路3002号' },
    { n: '香港大学深圳医院', l: '三甲', a: '福田区海园一路1号' },
    { n: '南山区蛇口社区卫服', l: '社区', a: '南山区蛇口街道' },
  ],
  HZ: [
    { n: '浙大一院', l: '三甲', a: '上城区庆春路79号' },
    { n: '浙大二院', l: '三甲', a: '上城区解放路88号' },
    { n: '浙江省人民医院', l: '三甲', a: '拱墅区上塘路158号' },
    { n: '杭州市第一人民医院', l: '三甲', a: '上城区浣纱路261号' },
    { n: '西湖区文新社区卫服', l: '社区', a: '西湖区文新街道' },
  ],
  TJ: [
    { n: '天津医科大学总医院', l: '三甲', a: '和平区鞍山道154号' },
    { n: '天津市第一中心医院', l: '三甲', a: '南开区复康路24号' },
    { n: '天津医大二院', l: '三甲', a: '河西区平江道23号' },
    { n: '天津市人民医院', l: '三甲', a: '红桥区芥园道190号' },
    { n: '小白楼社区卫生服务中心', l: '社区', a: '和平区小白楼街道' },
  ],
};

export const hospitals: Record<CityCode, Hospital[]> = Object.fromEntries(
  CITIES.map(c => [c, hn[c].map((h, i) => ({ id: `${c}_H${i + 1}`, cityCode: c, name: h.n, level: h.l, address: h.a, isDesignated: i < 2 }))])
) as Record<CityCode, Hospital[]>;

export const policyDocuments: PolicyDocument[] = [
  { id: 'P001', cityCode: 'BJ', cityName: '北京', title: '关于2025年度北京市社会保险缴费工资基数调整的通知', docNo: '京人社养发〔2025〕12号', issuingAuthority: '北京市人社局', issueDate: '2025-05-20', effectiveDate: '2025-07-01', status: 'EFFECTIVE', category: '养老保险', applicableGroups: ['城镇职工', '灵活就业人员'], content: '<p>根据《北京市基本养老保险规定》，2025年度缴费基数上限33891元/月，下限6326元/月。</p>', tags: ['基数调整', '2025年度'], relatedDocIds: ['P002'], sourceUrl: '#' },
  { id: 'P002', cityCode: 'BJ', cityName: '北京', title: '北京市基本医疗保险门诊共济保障机制实施细则', docNo: '京医保发〔2023〕28号', issuingAuthority: '北京市医保局', issueDate: '2023-11-15', effectiveDate: '2024-01-01', status: 'EFFECTIVE', category: '医疗保险', applicableGroups: ['城镇职工', '退休人员'], content: '<p>在职职工个人账户计入标准为本人参保缴费基数的2%。</p>', tags: ['门诊共济', '医保改革'], relatedDocIds: ['P001'], sourceUrl: '#' },
  { id: 'P003', cityCode: 'SH', cityName: '上海', title: '上海市2025年度社保缴费基数调整公告', docNo: '沪人社规〔2025〕6号', issuingAuthority: '上海市人社局', issueDate: '2025-06-05', effectiveDate: '2025-07-01', status: 'EFFECTIVE', category: '综合', applicableGroups: ['城镇职工', '灵活就业'], content: '<p>2025年7月起上限36549元/月，下限7310元/月。</p>', tags: ['基数调整', '2025'], relatedDocIds: ['P004'], sourceUrl: '#' },
  { id: 'P004', cityCode: 'SZ', cityName: '深圳', title: '深圳经济特区社会养老保险条例实施细则', docNo: '深人社规〔2024〕3号', issuingAuthority: '深圳市人社局', issueDate: '2024-02-10', effectiveDate: '2024-03-01', status: 'EFFECTIVE', category: '养老保险', applicableGroups: ['深户职工', '非深户职工'], content: '<p>缴费基数为上月工资总额，不低于最低工资标准，不超过社平300%。</p>', tags: ['养老保险', '实施细则'], relatedDocIds: ['P003'], sourceUrl: '#' },
  { id: 'P005', cityCode: 'NATIONAL', cityName: '全国', title: '中华人民共和国社会保险法', docNo: '主席令第三十五号', issuingAuthority: '全国人大常委会', issueDate: '2010-10-28', effectiveDate: '2011-07-01', status: 'EFFECTIVE', category: '基础法律', applicableGroups: ['全体公民'], content: '<p>规范社会保险关系，维护公民合法权益。</p>', tags: ['根本法', '社会保险'], relatedDocIds: ['P001', 'P002', 'P003', 'P004', 'P006'], sourceUrl: '#' },
  { id: 'P006', cityCode: 'NATIONAL', cityName: '全国', title: '个人所得税专项附加扣除暂行办法', docNo: '国发〔2018〕41号', issuingAuthority: '国务院', issueDate: '2018-12-13', effectiveDate: '2019-01-01', status: 'EFFECTIVE', category: '税务法规', applicableGroups: ['个税纳税人'], content: '<p>子女教育、继续教育、住房贷款利息、住房租金、赡养老人、婴幼儿照护7项专项附加扣除。</p>', tags: ['个税', '专项附加扣除'], relatedDocIds: ['P005'], sourceUrl: '#' },
];

const now = new Date();
const dAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const mockTransactions: Transaction[] = [
  { id: 'T001', userId: 'U001', type: 'SUPPLEMENTARY_PAY', title: '2025年3-4月社保补缴', status: 'SUCCESS', cityCode: 'BJ', requestData: { months: ['2025-03', '2025-04'], baseAmount: 12000 }, resultData: { principal: 6720, lateFee: 89.5, total: 6809.5 }, ipAddress: '103.27.25.108', submittedAt: dAgo(5), updatedAt: dAgo(2), completedAt: dAgo(2), timeline: [{ status: 'SUBMITTED', time: dAgo(5), operator: '用户本人', comment: '申请已提交' }, { status: 'AI_REVIEWING', time: dAgo(5), operator: '系统AI', comment: '自动审核通过' }, { status: 'PROCESSING', time: dAgo(4), operator: '北京市社保局', comment: '接口处理中' }, { status: 'SUCCESS', time: dAgo(2), operator: '北京市社保局', comment: '补缴成功' }] },
  { id: 'T002', userId: 'U001', type: 'BASE_ADJUSTMENT', title: '缴费基数由10000调整至15000', status: 'MANUAL_REVIEWING', cityCode: 'BJ', requestData: { effectiveMonth: '2025-07', newBase: 15000, oldBase: 10000, reason: '薪资调整' }, resultData: { personalDifference: 1400, companyDifference: 3220 }, ipAddress: '103.27.25.108', submittedAt: dAgo(1), updatedAt: dAgo(1), timeline: [{ status: 'SUBMITTED', time: dAgo(1), operator: '用户本人' }, { status: 'MANUAL_REVIEWING', time: dAgo(1), operator: '审核专员·李明', comment: '调整幅度超50%需人工复核' }] },
  { id: 'T003', userId: 'U001', type: 'HOSPITAL_CHANGE', title: '定点医院变更：新增北京协和医院', status: 'SUCCESS', cityCode: 'BJ', requestData: { addHospitalIds: ['BJ_H1'], removeHospitalIds: [] }, ipAddress: '124.64.18.55', submittedAt: dAgo(12), updatedAt: dAgo(11), completedAt: dAgo(11), timeline: [{ status: 'SUBMITTED', time: dAgo(12), operator: '用户本人' }, { status: 'AI_REVIEWING', time: dAgo(12), operator: '系统AI' }, { status: 'PROCESSING', time: dAgo(12), operator: '北京市医保局' }, { status: 'SUCCESS', time: dAgo(11), operator: '北京市医保局', comment: '即时生效' }] },
  { id: 'T004', userId: 'U001', type: 'TRANSFER', title: '养老保险转移（上海→北京）', status: 'PROCESSING', cityCode: 'BJ', requestData: { fromCity: 'SH', toCity: 'BJ', transferTypes: ['PENSION', 'MEDICAL'] }, ipAddress: '124.64.18.55', submittedAt: dAgo(20), updatedAt: dAgo(8), timeline: [{ status: 'SUBMITTED', time: dAgo(20), operator: '用户本人' }, { status: 'MANUAL_REVIEWING', time: dAgo(19), operator: '审核专员·王芳' }, { status: 'PROCESSING', time: dAgo(15), operator: '上海市社保局', comment: '转出函已开具' }] },
];

export const mockCertificates: Certificate[] = [
  { id: 'C001', certificateNo: 'SI20250618BJ0012345', type: 'SUPPLEMENTARY_PAY', userId: 'U001', transactionId: 'T001', title: '社保补缴申请凭证', content: { '补缴月份': '2025年3月-2025年4月', '缴费基数': '¥12,000/月', '本金合计': '¥6,720.00', '滞纳金': '¥89.50', '总金额': '¥6,809.50', '参保城市': '北京市' }, timestamp: dAgo(2), ipAddress: '103.27.25.108', operatorName: '张伟', hash: '0x7f8e9a2b4c1d5e6f3a8b9c0d1e2f3a4b', blockchainTxId: '0x8888abc123def', pdfUrl: '#', qrCodeUrl: '#', verifyUrl: '#', createdAt: dAgo(2) },
  { id: 'C002', certificateNo: 'SI20250612BJ0012189', type: 'HOSPITAL_CHANGE', userId: 'U001', transactionId: 'T003', title: '定点医院变更凭证', content: { '变更类型': '新增定点医院', '新增医院': '北京协和医院（三甲）', '生效时间': '2025-06-11 14:32', '医保局回执号': 'BJYB202506110892' }, timestamp: dAgo(11), ipAddress: '124.64.18.55', operatorName: '张伟', hash: '0xa1b2c3d4e5f60987654321fed', blockchainTxId: '0x7777cde456', pdfUrl: '#', qrCodeUrl: '#', verifyUrl: '#', createdAt: dAgo(11) },
  { id: 'C003', certificateNo: 'SI20250601BJ0011802', type: 'INSURANCE_APPLY', userId: 'U001', title: '参保申请凭证', content: { '参保城市': '北京市', '缴费基数': '¥12,000/月', '参保项目': '五险一金', '公积金比例': '12%', '生效日期': '2025-06-01', '月缴总额': '¥7,920.00' }, timestamp: dAgo(20), ipAddress: '103.27.25.108', operatorName: '张伟', hash: '0xfedcba9876543210fedcba98', blockchainTxId: '0x6666abc123', pdfUrl: '#', qrCodeUrl: '#', verifyUrl: '#', createdAt: dAgo(20) },
];

export const mockTickets: Ticket[] = [
  { id: 'TK001', ticketNo: 'GD20250620001', userId: 'U001', subject: '我的社保断缴了2个月怎么办？', intent: 'PAYMENT_INTERRUPT', confidence: 0.97, priority: 'HIGH', status: 'PROCESSING', cityCode: 'BJ', agentName: '客服·陈静', satisfaction: undefined, messages: [{ id: 'M1', role: 'USER', content: '你好，我之前换工作社保断缴了2个月，会有什么影响？可以补缴吗？', timestamp: dAgo(0).slice(0, 19).replace('T', ' ') }, { id: 'M2', role: 'AI', content: '您好！AI助手解答：根据政策断缴影响1）养老累计年限；2）医保报销资格。可发起补缴，最多24个月。是否立即办理？', timestamp: dAgo(0).slice(0, 19).replace('T', ' '), relatedPolicyIds: ['P001', 'P005'] }, { id: 'M3', role: 'USER', content: '我人在外地可以办吗？', timestamp: dAgo(0).slice(0, 19).replace('T', ' ') }, { id: 'M4', role: 'AGENT', content: '您好！异地可全程在线办理，上传身份证即可！', timestamp: dAgo(0).slice(0, 19).replace('T', ' '), relatedPolicyIds: ['P001'] }], createdAt: dAgo(0), updatedAt: dAgo(0) },
  { id: 'TK002', ticketNo: 'GD20250618015', userId: 'U001', subject: '退休金怎么计算？', intent: 'PENSION_CALCULATE', confidence: 0.95, priority: 'MEDIUM', status: 'AI_RESOLVED', cityCode: 'BJ', satisfaction: 5, messages: [{ id: 'M1', role: 'USER', content: '我30岁按15000基数交，退休能领多少？', timestamp: dAgo(3).slice(0, 19).replace('T', ' ') }, { id: 'M2', role: 'AI', content: '按北京政策测算：基础+个人账户合计约7422元/月，仅供参考。', timestamp: dAgo(3).slice(0, 19).replace('T', ' '), relatedPolicyIds: ['P001', 'P005'] }], createdAt: dAgo(3), updatedAt: dAgo(3), resolvedAt: dAgo(3) },
  { id: 'TK003', ticketNo: 'GD20250615088', userId: 'U001', subject: '上海社保转北京', intent: 'TRANSFER', confidence: 0.98, priority: 'MEDIUM', status: 'RESOLVED', cityCode: 'BJ', agentName: '客服·李强', satisfaction: 4, messages: [{ id: 'M1', role: 'USER', content: '上海交了5年转到北京', timestamp: dAgo(7).slice(0, 19).replace('T', ' ') }, { id: 'M2', role: 'AI', content: '已识别：社保转移接续（上海→北京），支持在线办理。', timestamp: dAgo(7).slice(0, 19).replace('T', ' '), relatedPolicyIds: ['P003', 'P004'] }], createdAt: dAgo(7), updatedAt: dAgo(6), resolvedAt: dAgo(6) },
];

export const mockEmployees: Employee[] = [
  { id: 'E001', employeeNo: 'EMP001', name: '张伟', idNumber: '110101199001011234', phone: '138****1234', department: '技术部', position: '高级工程师', cityCode: 'BJ', insuranceBase: 20000, housingFundBase: 20000, housingFundPercent: 12, selectedItems: ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'], status: 'INSURED', entryDate: '2021-03-15', taxDeductions: [{ type: 'CHILD_EDUCATION', name: '子女教育', monthlyAmount: 2000, effectiveFrom: '2023-01-01' }, { type: 'HOUSING_LOAN', name: '住房贷款利息', monthlyAmount: 1000, effectiveFrom: '2022-06-01' }] },
  { id: 'E002', employeeNo: 'EMP002', name: '李娜', idNumber: '310101199203042345', phone: '139****5678', department: '产品部', position: '产品经理', cityCode: 'SH', insuranceBase: 18000, housingFundBase: 18000, housingFundPercent: 7, selectedItems: ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'], status: 'INSURED', entryDate: '2022-01-10', taxDeductions: [{ type: 'CHILD_EDUCATION', name: '子女教育', monthlyAmount: 1000, effectiveFrom: '2024-01-01' }, { type: 'ELDERLY_SUPPORT', name: '赡养老人', monthlyAmount: 3000, effectiveFrom: '2023-01-01' }] },
  { id: 'E003', employeeNo: 'EMP003', name: '王强', idNumber: '440101198808083456', phone: '137****9012', department: '设计部', position: 'UI设计师', cityCode: 'GZ', insuranceBase: 15000, housingFundBase: 15000, housingFundPercent: 12, selectedItems: ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'], status: 'INSURED', entryDate: '2023-05-20', taxDeductions: [{ type: 'HOUSING_RENT', name: '住房租金', monthlyAmount: 1500, effectiveFrom: '2023-06-01' }] },
  { id: 'E004', employeeNo: 'EMP004', name: '赵敏', idNumber: '330101199505054567', phone: '136****3456', department: '市场部', position: '市场专员', cityCode: 'HZ', insuranceBase: 12000, housingFundBase: 12000, housingFundPercent: 12, selectedItems: ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'], status: 'INSURED', entryDate: '2023-08-15', taxDeductions: [] },
  { id: 'E005', employeeNo: 'EMP005', name: '陈刚', idNumber: '120101198706065678', phone: '135****7890', department: '财务部', position: '财务主管', cityCode: 'TJ', insuranceBase: 22000, housingFundBase: 22000, housingFundPercent: 11, selectedItems: ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'], status: 'INSURED', entryDate: '2020-02-10', taxDeductions: [{ type: 'CHILD_EDUCATION', name: '子女教育×2', monthlyAmount: 2000, effectiveFrom: '2022-01-01' }, { type: 'INFANT_CARE', name: '婴幼儿照护', monthlyAmount: 2000, effectiveFrom: '2023-01-01' }] },
];

export const mockPayrollBatches: PayrollBatch[] = [];
