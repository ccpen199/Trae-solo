import { Service } from 'typedi';
import logger, { auditLogger } from '../utils/logger';
import config from '../config';
import {
  Policy,
  KnowledgeNode,
  KnowledgeGraph,
  GraphSearchResult
} from '../../../shared/types';
import {
  buildKnowledgeGraph,
  searchKnowledgeGraph,
  generateQAMatches,
  matchPoliciesToProfile
} from '../../../shared/utils/knowledge-graph';

interface QAPair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  policyIds: string[];
  category: string;
  viewCount: number;
}

@Service()
export class KnowledgeGraphEngine {
  private static initialized = false;
  private static policies: Policy[] = [];
  private static graph: KnowledgeGraph = new Map();
  private static qaPairs: QAPair[] = [];
  private static searchStats = {
    totalSearches: 0,
    avgResponseTime: 0,
    topSearches: new Map<string, number>()
  };

  static initialize(): void {
    if (this.initialized) return;

    logger.info('[KnowledgeGraph] 初始化政务知识图谱...');

    this.seedPolicies();
    this.seedQAPairs();
    this.graph = buildKnowledgeGraph(this.policies);

    logger.info(`[KnowledgeGraph] 知识图谱构建完成:
      - 政策节点: ${this.policies.length} 条
      - 图谱节点总数: ${this.graph.size} 个
      - 问答对数量: ${this.qaPairs.length} 条`);

    this.initialized = true;
  }

  private static seedPolicies(): void {
    this.policies = [
      {
        id: 'POLICY-001',
        title: '郑州市新生儿落户政策（2025版）',
        category: 'household',
        departmentCode: 'gaj',
        departmentName: '郑州市公安局',
        summary: '新生婴儿父母一方或双方为郑州市户籍的，可在出生后30日内办理出生登记，实行当场受理即时办结',
        content: `## 适用人群
- 父母一方或双方为郑州市常住户口
- 2025年1月1日后出生的新生婴儿

## 办理条件
1. 持有《出生医学证明》原件
2. 父母双方《居民户口簿》和《居民身份证》
3. 《结婚证》（非婚生育提供非婚生育说明）

## 办理流程
1. 在线提交申请材料
2. 公安派出所即时审核
3. 当场打印户口簿

## 办理时限
- 网上申请：1个工作日
- 窗口申请：当场办结`,
        tags: ['新生儿', '落户', '户籍', '出生登记', '户籍迁入'],
        effectiveDate: '2025-01-01',
        expiryDate: '2027-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-HH-001', 'SRV-HH-002'],
        relatedPolicyIds: ['POLICY-002', 'POLICY-004'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/001',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z'
      },
      {
        id: 'POLICY-002',
        title: '郑州市城乡居民基本医疗保险参保政策',
        category: 'medical_insurance',
        departmentCode: 'ybj',
        departmentName: '郑州市医疗保障局',
        summary: '新生儿出生当年可随父母参加居民医保，享受当年医保待遇，个人缴费部分由财政全额补贴',
        content: `## 参保对象
- 具有郑州市户籍的城乡居民
- 持有郑州市居住证的外地户籍人员
- 在郑高校大中专学生
- 新生儿（出生当年免缴费）

## 缴费标准
- 个人缴费：380元/人·年
- 财政补贴：760元/人·年
- 低保特困人员：个人缴费由财政全额补助

## 待遇享受
- 住院报销比例：乡镇卫生院90%，县级80%，市级70%，省级65%
- 门诊统筹：年度限额300元
- 大病保险：年度最高支付限额55万元`,
        tags: ['医保', '参保', '居民医保', '新生儿医保', '医疗保障'],
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-YB-001', 'SRV-YB-002'],
        relatedPolicyIds: ['POLICY-001', 'POLICY-006'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/002',
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2025-02-01T09:00:00Z'
      },
      {
        id: 'POLICY-003',
        title: '郑州市灵活就业人员养老保险政策',
        category: 'social_security',
        departmentCode: 'sbj',
        departmentName: '郑州市人力资源和社会保障局',
        summary: '灵活就业人员可自愿参加企业职工基本养老保险，缴费基数在当地全口径平均工资的60%-300%之间自主选择',
        content: `## 参保范围
- 郑州市户籍灵活就业人员
- 持有郑州市居住证的外地户籍灵活就业人员
- 个体工商户雇工

## 缴费标准
- 缴费比例：20%
- 缴费基数：4174元-20871元（2025年度）
- 月缴费额：834.8元-4174.2元

## 退休条件
1. 累计缴费满15年
2. 男年满60周岁，女年满55周岁
3. 达到法定退休年龄当月办理`,
        tags: ['社保', '养老保险', '灵活就业', '退休', '养老金'],
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-SB-001', 'SRV-SB-005'],
        relatedPolicyIds: ['POLICY-007'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/003',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2025-01-20T14:00:00Z'
      },
      {
        id: 'POLICY-004',
        title: '郑州市义务教育阶段招生入学政策',
        category: 'education',
        departmentCode: 'jyj',
        departmentName: '郑州市教育局',
        summary: '实行免试就近入学，小学一年级入学年龄为年满6周岁（8月31日前出生），按划片范围对口入学',
        content: `## 入学条件
- 小学：年满6周岁（2019年8月31日前出生）
- 初中：小学应届毕业生
- 具有郑州市户籍或居住证

## 报名时间
- 线上报名：6月15日-6月25日
- 现场核验：7月1日-7月5日
- 录取通知：8月15日前

## 划片原则
1. 免试就近入学
2. 房户一致优先
3. 统筹安排随迁子女`,
        tags: ['教育', '入学', '义务教育', '小学', '初中', '招生'],
        effectiveDate: '2025-06-01',
        expiryDate: '2025-09-30',
        status: 'active',
        relatedServiceIds: ['SRV-JY-001', 'SRV-JY-003'],
        relatedPolicyIds: ['POLICY-001'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/004',
        createdAt: '2025-05-01T00:00:00Z',
        updatedAt: '2025-05-20T16:30:00Z'
      },
      {
        id: 'POLICY-005',
        title: '郑州市住房公积金个人住房贷款政策',
        category: 'housing_fund',
        departmentCode: 'gjj',
        departmentName: '郑州住房公积金管理中心',
        summary: '首套住房公积金贷款最高额度80万元，二套住房60万元，贷款期限最长30年，年利率3.1%起',
        content: `## 贷款条件
1. 连续足额缴存公积金6个月以上
2. 购房所在地为郑州市行政区域
3. 申请人及配偶无未结清公积金贷款
4. 信用记录良好

## 贷款额度
- 首套住房：最高80万元
- 二套住房：最高60万元
- 可贷额度=账户余额×(14+缴存年限)

## 首付比例
- 首套房：20%
- 二套房：30%

## 利率
- 5年以内（含）：年利率2.6%
- 5年以上：年利率3.1%
- 二套房：基准利率上浮10%`,
        tags: ['公积金', '房贷', '住房贷款', '购房', '首套房'],
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-GJJ-001', 'SRV-GJJ-003'],
        relatedPolicyIds: ['POLICY-008'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/005',
        createdAt: '2024-12-20T00:00:00Z',
        updatedAt: '2025-02-15T11:00:00Z'
      },
      {
        id: 'POLICY-006',
        title: '郑州市门诊慢特病保障政策',
        category: 'medical_insurance',
        departmentCode: 'ybj',
        departmentName: '郑州市医疗保障局',
        summary: '恶性肿瘤门诊放化疗、透析、器官移植抗排异等54种慢特病纳入门诊保障，报销比例不低于80%',
        content: `## 病种范围
共54种，分为三类：
- Ⅰ类（重大疾病）：恶性肿瘤放化疗、透析、器官移植抗排异等11种
- Ⅱ类（慢性病）：高血压、糖尿病、冠心病等38种
- Ⅲ类（特殊疾病）：罕见病等5种

## 报销比例
- Ⅰ类：在职85%，退休90%，统筹支付限额15万
- Ⅱ类：在职80%，退休85%，统筹支付限额5千-5万
- Ⅲ类：80%，统筹支付限额10万-50万

## 申请材料
1. 近三年二级以上医院住院病历
2. 近期检查检验报告
3. 社保卡、身份证复印件`,
        tags: ['医保', '门诊慢特病', '报销', '慢性病', '重大疾病'],
        effectiveDate: '2025-01-01',
        expiryDate: '2027-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-YB-003', 'SRV-YB-005'],
        relatedPolicyIds: ['POLICY-002'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/006',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-03-01T10:00:00Z'
      },
      {
        id: 'POLICY-007',
        title: '郑州市企业职工退休审批政策',
        category: 'social_security',
        departmentCode: 'sbj',
        departmentName: '郑州市人力资源和社会保障局',
        summary: '男年满60周岁、女工人年满50周岁、女干部年满55周岁，累计缴费满15年，可办理正常退休手续',
        content: `## 退休条件
1. 正常退休
   - 男年满60周岁，女工人年满50周岁，女干部年满55周岁
   - 累计缴费满15年

2. 特殊工种提前退休
   - 男年满55周岁，女年满45周岁
   - 从事高空/特别繁重体力10年、井下/高温9年、其他有害8年

3. 因病提前退休
   - 男年满50周岁，女年满45周岁
   - 经劳动能力鉴定完全丧失劳动能力

## 办理流程
1. 单位或个人申报
2. 人社部门审核档案
3. 公示5个工作日
4. 办理退休手续，核发待遇`,
        tags: ['社保', '退休', '养老金', '审批', '提前退休'],
        effectiveDate: '2025-01-01',
        expiryDate: '2027-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-SB-005', 'SRV-SB-006'],
        relatedPolicyIds: ['POLICY-003'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/007',
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-02-10T15:00:00Z'
      },
      {
        id: 'POLICY-008',
        title: '郑州市存量房（二手房）交易登记政策',
        category: 'real_estate',
        departmentCode: 'zrzyj',
        departmentName: '郑州市自然资源和规划局',
        summary: '二手房交易实行"一窗受理、并行办理"，交易、缴税、登记全流程1个工作日内办结',
        content: `## 办理条件
1. 房屋所有权清晰，无司法查封
2. 已取得不动产权证书
3. 买卖双方到场（委托需公证）

## 提交材料
1. 不动产权证书原件
2. 买卖双方身份证明
3. 存量房买卖合同
4. 契税完税凭证

## 办理时限
- "一窗受理"全流程：1个工作日
- 不动产登记：30分钟
- 不动产证明：当场领取

## 税费标准
- 契税：首套90平以下1%，90平以上1.5%
- 个税：满五唯一免征，否则1%
- 增值税：满2年免征，否则5.6%`,
        tags: ['房产', '二手房', '过户', '不动产登记', '契税'],
        effectiveDate: '2025-01-01',
        expiryDate: '2026-12-31',
        status: 'active',
        relatedServiceIds: ['SRV-FC-001', 'SRV-FC-003'],
        relatedPolicyIds: ['POLICY-005'],
        documentUrl: 'https://www.zhengzhou.gov.cn/policy/008',
        createdAt: '2024-12-25T00:00:00Z',
        updatedAt: '2025-01-30T09:30:00Z'
      }
    ];
  }

  private static seedQAPairs(): void {
    this.qaPairs = [
      {
        id: 'QA-001',
        question: '新生儿如何办理郑州户口？需要哪些材料？',
        answer: '新生婴儿可在出生后30日内申请办理郑州户口。所需材料：1)《出生医学证明》原件；2)父母双方的《居民户口簿》《居民身份证》；3)《结婚证》（非婚生育需提供非婚生育说明）。可通过"郑好办"APP在线申请，1个工作日办结，也可到父母户籍地派出所窗口当场办理。',
        keywords: ['新生儿', '落户', '户口', '出生登记', '户籍'],
        policyIds: ['POLICY-001'],
        category: 'household',
        viewCount: 18562
      },
      {
        id: 'QA-002',
        question: '灵活就业人员怎么交社保？一个月多少钱？',
        answer: '灵活就业人员可携带身份证、居住证到社保经办机构办理参保登记，也可线上通过"郑好办"办理。2025年度缴费基数区间为4174元-20871元，个人可自主选择，缴费比例为20%。月缴费金额为834.8元（最低档）至4174.2元（最高档）。建议选择与收入相匹配的档位，多缴多得。',
        keywords: ['灵活就业', '社保', '缴费', '养老保险', '基数'],
        policyIds: ['POLICY-003'],
        category: 'social_security',
        viewCount: 15234
      },
      {
        id: 'QA-003',
        question: '二手房过户流程是什么？需要交哪些税？',
        answer: '郑州二手房过户流程：1)签订存量房买卖合同并网签备案；2)税务窗口申报纳税并缴纳契税、个税（增值税如涉及）；3)不动产登记窗口提交过户材料；4)1个工作日后领取新不动产权证。税费标准：契税（首套90平以下1%、90平以上1.5%，二套90平以下1%、90平以上2%），个税（满五唯一免征，否则1%），增值税（满2年免征，否则5.6%）。',
        keywords: ['二手房', '过户', '契税', '不动产登记', '税费'],
        policyIds: ['POLICY-008'],
        category: 'real_estate',
        viewCount: 12876
      },
      {
        id: 'QA-004',
        question: '住房公积金贷款最高能贷多少？需要什么条件？',
        answer: '郑州公积金贷款最高额度：首套房80万元，二套房60万元。贷款期限最长30年，5年以上利率3.1%。申请条件：1)连续足额缴存公积金6个月以上；2)购房在郑州行政区域内；3)无未结清公积金贷款；4)信用良好。可贷额度参考：账户余额×(14+缴存年限)，具体以实际审批为准。',
        keywords: ['公积金', '贷款', '房贷', '额度', '首套房'],
        policyIds: ['POLICY-005'],
        category: 'housing_fund',
        viewCount: 11342
      },
      {
        id: 'QA-005',
        question: '小孩上小学怎么报名？划片范围怎么查？',
        answer: '郑州小学实行免试就近入学，年满6周岁（8月31日前出生）的儿童可报名。报名方式：6月15-25日通过"郑好办"APP义务教育入学一件事线上报名，7月1-5日现场核验材料，8月15日前发放录取通知。划片范围查询：1)关注"郑州教育"微信公众号；2)各区教育局官网；3)报名系统自动匹配。房户一致优先录取，随迁子女统筹安排。',
        keywords: ['小学', '入学', '报名', '划片', '义务教育'],
        policyIds: ['POLICY-004'],
        category: 'education',
        viewCount: 9876
      },
      {
        id: 'QA-006',
        question: '退休年龄是多少？怎么办理退休手续？',
        answer: '法定退休年龄：男年满60周岁，女工人年满50周岁，女干部年满55周岁。特殊工种男55岁/女45岁，因病完全丧失劳动能力男50岁/女45岁可提前退休。办理流程：1)达到退休年龄当月由单位或个人申报；2)人社部门审核职工档案；3)公示5个工作日无异议；4)办理退休手续，次月起发放养老金。累计缴费需满15年。',
        keywords: ['退休', '年龄', '手续', '养老金', '审批'],
        policyIds: ['POLICY-007'],
        category: 'social_security',
        viewCount: 8754
      },
      {
        id: 'QA-007',
        question: '门诊慢特病有哪些病种？怎么申请？',
        answer: '郑州门诊慢特病共54种，分三类：Ⅰ类11种（恶性肿瘤放化疗、透析、移植抗排异等）、Ⅱ类38种（高血压、糖尿病、冠心病等）、Ⅲ类5种（罕见病）。申请方式：1)在"郑好办"APP医保专区申请；2)携带近3年住院病历、检查报告到定点医院医保科办理；3)专家评审通过后次月享受待遇。报销比例：Ⅰ类85%-90%，Ⅱ类80%-85%，Ⅲ类80%。',
        keywords: ['门诊慢特病', '报销', '慢性病', '申请', '医保'],
        policyIds: ['POLICY-006'],
        category: 'medical_insurance',
        viewCount: 7654
      },
      {
        id: 'QA-008',
        question: '新生儿医保怎么办理？需要缴费吗？',
        answer: '郑州新生儿出生当年可免缴费参加居民医保。办理方式：1)先办理出生登记落户；2)在"郑好办"APP搜索"居民医保参保登记"选择新生儿参保；3)填写出生医学证明信息提交，1个工作日办结；4)医保待遇自出生之日起生效，当年内住院、门诊均可报销。次年需按时缴纳居民医保费用（380元/年）。',
        keywords: ['新生儿', '医保', '参保', '居民医保', '缴费'],
        policyIds: ['POLICY-002'],
        category: 'medical_insurance',
        viewCount: 14321
      }
    ];
  }

  static async search(
    query: string,
    options?: {
      citizenId?: string;
      category?: string;
      limit?: number;
      type?: 'all' | 'policy' | 'qa' | 'node';
    }
  ): Promise<{
    policies: (Policy & { matchScore: number; matchReasons: string[] })[];
    qaPairs: (QAPair & { score: number })[];
    graphNodes: GraphSearchResult[];
    suggestedRefinements: string[];
    searchTime: number;
  }> {
    const startTime = Date.now();
    const limit = options?.limit || 10;

    logger.debug(`[KnowledgeGraph] 执行搜索: "${query}"`);

    const graphNodes = searchKnowledgeGraph(this.graph, query, undefined, limit);

    const matchedQAPairs = generateQAMatches(this.qaPairs.map(qa => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      keywords: qa.keywords,
      category: qa.category
    })), query, config.knowledgeGraph.similarityThreshold)
      .slice(0, limit);

    const matchedPolicies = matchPoliciesToProfile(
      options?.category
        ? this.policies.filter(p => p.category === options.category)
        : this.policies,
      { tags: [{ name: query, category: 'preference' as any, weight: 0.9 }] } as any
    )
      .slice(0, limit)
      .map(p => ({
        ...p,
        matchReasons: (p as any).matchReasons || this.generateMatchReasons(p, query)
      }));

    const searchTime = Date.now() - startTime;
    this.recordSearch(query, searchTime);

    const suggestions = this.generateRefinementSuggestions(query, matchedPolicies, matchedQAPairs);

    return {
      policies: matchedPolicies,
      qaPairs: matchedQAPairs.map((m, i) => {
        const qa = this.qaPairs.find(q => q.id === m.id)!;
        return { ...qa, score: (m as any).score };
      }),
      graphNodes,
      suggestedRefinements: suggestions,
      searchTime
    };
  }

  private static generateMatchReasons(policy: Policy, query: string): string[] {
    const reasons: string[] = [];
    const queryLower = query.toLowerCase();

    if (policy.title.toLowerCase().includes(queryLower)) {
      reasons.push('政策标题关键词匹配');
    }
    if (policy.tags.some(t => queryLower.includes(t.toLowerCase()))) {
      reasons.push('政策标签相关度高');
    }
    if (policy.content.toLowerCase().includes(queryLower)) {
      reasons.push('正文条款相关');
    }
    if (reasons.length === 0) {
      reasons.push('内容语义相似度匹配');
      reasons.push('办理场景高度关联');
    }

    return reasons;
  }

  private static generateRefinementSuggestions(
    query: string,
    policies: Policy[],
    qas: any[]
  ): string[] {
    const suggestions: string[] = [];
    const categories = new Map<string, number>();

    policies.forEach(p => categories.set(p.category, (categories.get(p.category) || 0) + 1));
    qas.forEach(q => categories.set(q.category, (categories.get(q.category) || 0) + 1));

    const topCategory = Array.from(categories.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      const categoryNames: Record<string, string> = {
        household: '户籍办理',
        social_security: '社会保障',
        medical_insurance: '医疗保障',
        education: '教育入学',
        housing_fund: '住房公积金',
        real_estate: '不动产登记'
      };
      if (categoryNames[topCategory[0]]) {
        suggestions.push(`查看全部「${categoryNames[topCategory[0]]}」政策`);
      }
    }

    if (query.length < 6) {
      suggestions.push('尝试更精确的关键词（如加上"郑州"、"2025"等）');
    }

    suggestions.push('查看关联的办事服务指南');
    suggestions.push('使用AI智能问答获取更详细解答');

    return suggestions;
  }

  private static recordSearch(query: string, searchTime: number): void {
    this.searchStats.totalSearches++;
    const prevTotal = this.searchStats.totalSearches - 1;
    this.searchStats.avgResponseTime = Math.round(
      (this.searchStats.avgResponseTime * prevTotal + searchTime) / this.searchStats.totalSearches
    );
    this.searchStats.topSearches.set(query, (this.searchStats.topSearches.get(query) || 0) + 1);
  }

  static async getPolicyDetail(id: string): Promise<{
    policy: Policy | undefined;
    relatedPolicies: Policy[];
    relatedServices: string[];
    relatedQAs: QAPair[];
    graphConnections: GraphSearchResult[];
  }> {
    const policy = this.policies.find(p => p.id === id);
    if (!policy) {
      return {
        policy: undefined,
        relatedPolicies: [],
        relatedServices: [],
        relatedQAs: [],
        graphConnections: []
      };
    }

    const relatedPolicies = policy.relatedPolicyIds
      .map(pid => this.policies.find(p => p.id === pid)!)
      .filter(Boolean);

    const relatedQAs = this.qaPairs.filter(qa => qa.policyIds.includes(id));

    const graphConnections = searchKnowledgeGraph(this.graph, policy.title, undefined, 8)
      .filter(r => r.node.type !== 'policy' || r.node.id !== id);

    auditLogger.systemEvent('policy_viewed', {
      policyId: id,
      title: policy.title,
      relatedCount: relatedPolicies.length + relatedQAs.length
    });

    return {
      policy,
      relatedPolicies,
      relatedServices: policy.relatedServiceIds,
      relatedQAs,
      graphConnections
    };
  }

  static async aiAnswer(
    question: string,
    context?: { citizenId?: string; chatHistory?: any[] }
  ): Promise<{
    answer: string;
    confidence: number;
    sourcePolicies: Policy[];
    sourceQAs: QAPair[];
    relatedServiceIds: string[];
    citations: { type: string; id: string; title: string; snippet: string }[];
  }> {
    logger.info(`[KnowledgeGraph] AI智能问答: "${question}"`);

    const searchResult = await this.search(question, {
      citizenId: context?.citizenId,
      limit: 5
    });

    const topQA = searchResult.qaPairs[0];
    const topPolicy = searchResult.policies[0];

    let answer = '';
    let confidence = 0;

    if (topQA && topQA.score > 0.7) {
      answer = topQA.answer;
      confidence = topQA.score;
    } else if (topPolicy && topPolicy.matchScore > 0.6) {
      answer = this.synthesizeAnswerFromPolicy(question, topPolicy);
      confidence = topPolicy.matchScore * 0.9;
    } else {
      answer = this.generateFallbackAnswer(question);
      confidence = Math.max(0.3, ...searchResult.policies.map(p => p.matchScore * 0.6));
    }

    const citations: any[] = [];
    searchResult.policies.slice(0, 3).forEach(p => {
      citations.push({
        type: 'policy',
        id: p.id,
        title: p.title,
        snippet: p.summary
      });
    });
    searchResult.qaPairs.slice(0, 2).forEach(qa => {
      citations.push({
        type: 'qa',
        id: qa.id,
        title: qa.question,
        snippet: qa.answer.substring(0, 100) + '...'
      });
    });

    auditLogger.systemEvent('ai_qa_answered', {
      questionLength: question.length,
      confidence,
      sourceCount: citations.length
    });

    return {
      answer,
      confidence: Math.round(confidence * 100) / 100,
      sourcePolicies: searchResult.policies.slice(0, 3),
      sourceQAs: searchResult.qaPairs.slice(0, 2),
      relatedServiceIds: [
        ...(topPolicy?.relatedServiceIds || []),
        ...searchResult.policies.flatMap(p => p.relatedServiceIds || [])
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
      citations
    };
  }

  private static synthesizeAnswerFromPolicy(question: string, policy: Policy): string {
    const lines = policy.content.split('\n').filter(l => l.trim());
    const headingLines = lines.filter(l => l.startsWith('#'));

    let answer = `根据《${policy.title}》的规定：\n\n`;

    if (question.includes('条件') || question.includes('要求')) {
      const conditionSection = lines.findIndex(l => l.includes('办理条件') || l.includes('适用人群'));
      if (conditionSection >= 0) {
        answer += lines.slice(conditionSection + 1, conditionSection + 6).join('\n');
      } else {
        answer += policy.summary;
      }
    } else if (question.includes('材料') || question.includes('哪些')) {
      const materialSection = lines.findIndex(l => l.includes('提交材料') || l.includes('办理条件'));
      if (materialSection >= 0) {
        answer += lines.slice(materialSection + 1, materialSection + 6).join('\n');
      } else {
        answer += policy.summary;
      }
    } else if (question.includes('流程') || question.includes('步骤')) {
      const flowSection = lines.findIndex(l => l.includes('办理流程'));
      if (flowSection >= 0) {
        answer += lines.slice(flowSection + 1, flowSection + 6).join('\n');
      } else {
        answer += policy.summary;
      }
    } else {
      answer += policy.summary + '\n\n';
      if (headingLines.length > 0) {
        answer += '【主要内容】\n' + headingLines.slice(0, 5).map(h => h.replace(/#+/g, '•')).join('\n');
      }
    }

    answer += `\n\n📌 政策有效期：${policy.effectiveDate} 至 ${policy.expiryDate}\n`;
    answer += `📌 主管部门：${policy.departmentName}\n`;

    return answer;
  }

  private static generateFallbackAnswer(question: string): string {
    return `您的问题「${question}」涉及的政务信息，我为您检索到了相关的政策文件和热门问答。\n\n` +
      `如果以上信息不够精确，建议您：\n` +
      `1️⃣ 使用更具体的关键词重新搜索（如加上"郑州"、"办理条件"、"2025"等）\n` +
      `2️⃣ 查看下方关联的办事服务指南\n` +
      `3️⃣ 拨打12345政务服务热线咨询人工客服\n` +
      `4️⃣ 前往就近的政务服务中心现场咨询\n\n` +
      `系统会持续学习更多政务知识，为您提供更准确的解答。`;
  }

  static getPolicies(options?: { category?: string; department?: string; limit?: number }): Policy[] {
    let result = [...this.policies];
    if (options?.category) result = result.filter(p => p.category === options.category);
    if (options?.department) result = result.filter(p => p.departmentCode === options.department);
    return result.slice(0, options?.limit || result.length);
  }

  static getGraphStats() {
    const nodesByType = new Map<string, number>();
    for (const node of this.graph.values()) {
      nodesByType.set(node.type, (nodesByType.get(node.type) || 0) + 1);
    }

    return {
      totalPolicies: this.policies.length,
      totalQAPairs: this.qaPairs.length,
      totalGraphNodes: this.graph.size,
      nodesByType: Object.fromEntries(nodesByType),
      topHotQAs: [...this.qaPairs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5).map(q => ({
        id: q.id,
        question: q.question,
        views: q.viewCount
      })),
      searchStats: {
        ...this.searchStats,
        topSearches: Array.from(this.searchStats.topSearches.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      }
    };
  }
}

export default KnowledgeGraphEngine;
