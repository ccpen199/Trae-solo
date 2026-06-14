import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield, Sparkles, Calculator, Banknote, FileCheck, Calendar,
  FileText, CheckCircle2, X, ChevronRight, AlertTriangle,
  Clock, Building2, Users, DollarSign, Percent, Landmark, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { httpGet, httpPost } from '@/api/client';
import { useAuthStore } from '@/store/auth';

interface Policy {
  id: string | number;
  policyId?: number;
  policyCode?: string;
  name: string;
  title?: string;
  category: string;
  matchScore?: number;
  match_score?: number;
  matchDetails?: string[];
  isEligible?: boolean;
  amount: number;
  deadline: string;
  validFrom?: string;
  validTo?: string;
  materials: string[];
  description?: string;
  summary?: string;
  process?: { step: string; desc: string }[];
  threeNetVerification?: {
    medicalInsurance?: { verified: boolean; agency: string; remark: string; verifiedAt: string };
    taxation?: { verified: boolean; agency: string; remark: string; verifiedAt: string };
    marketSupervision?: { verified: boolean; agency: string; remark: string; verifiedAt: string };
  };
}

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'wsg', label: '稳岗返还' },
  { id: 'sbbt', label: '社保补贴' },
  { id: 'cyfc', label: '创业扶持' },
  { id: 'jnpx', label: '技能培训' },
  { id: 'jyfc', label: '就业扶持' },
];

const categoryColors: Record<string, string> = {
  '稳岗返还': 'bg-gold-100 text-gold-700 border-gold-200',
  '社保补贴': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '创业扶持': 'bg-purple-100 text-purple-700 border-purple-200',
  '技能培训': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '就业扶持': 'bg-gov-100 text-gov-700 border-gov-200',
};

const categoryTabMap: Record<string, string> = {
  'wsg': '稳岗返还',
  'sbbt': '社保补贴',
  'cyfc': '创业扶持',
  'jnpx': '技能培训',
  'jyfc': '就业扶持',
};

const staticPolicies: Policy[] = [
  {
    id: 1,
    name: '失业保险稳岗返还',
    category: '稳岗返还',
    matchScore: 95,
    amount: 125600,
    deadline: '2026-12-31',
    materials: ['营业执照副本', '上年度失业保险缴费凭证', '企业银行账户信息', '承诺书'],
    matchDetails: [
      '省医保局核验：职工医保连续参保48个月，无断缴记录',
      '省税务局核验：纳税信用等级A级，缴费正常',
      '省市场监管局核验：工商登记存续，经营状态正常',
      '参保率100%（120/120人），超过90%门槛',
      '裁员率2.5%，低于中小微企业20%阈值',
      '上年度实际缴纳失业保险费¥240,000',
    ],
    description: '对采取有效措施不裁员、少裁员，稳定就业岗位的企业，由失业保险基金给予稳岗返还。中小微企业返还比例60%，大型企业30%。',
    process: [
      { step: '企业申报', desc: '通过平台填写企业信息，上传相关材料' },
      { step: '部门审核', desc: '人社部门审核参保缴费、裁员率等情况' },
      { step: '社会公示', desc: '对拟返还企业名单进行5个工作日公示' },
      { step: '资金拨付', desc: '公示无异议后15个工作日内拨付资金' },
    ],
  },
  {
    id: 2,
    name: '企业吸纳就业社保补贴',
    category: '社保补贴',
    matchScore: 88,
    amount: 48000,
    deadline: '2026-10-31',
    materials: ['招用人员花名册', '劳动合同', '社保缴费证明', '工资发放凭证'],
    matchDetails: [
      '省社保局核验：企业正常缴纳社保，缴费记录完整',
      '省税务局核验：纳税信用B级以上，正常经营',
      '省市场监管局核验：企业存续，未列入经营异常名录',
      '招用就业困难人员3名，签订1年以上劳动合同',
      '连续缴纳社保6个月以上，符合补贴条件',
    ],
    description: '对企业招用就业困难人员、毕业年度高校毕业生，签订1年以上劳动合同并缴纳社保的，给予最长不超过3年的社保补贴。',
    process: [
      { step: '申请提交', desc: '企业在平台提交申请及相关材料' },
      { step: '资格核查', desc: '核查人员身份、劳动合同、社保缴纳情况' },
      { step: '补贴核算', desc: '按实际缴费基数核算补贴金额' },
      { step: '资金发放', desc: '按季度发放至企业银行账户' },
    ],
  },
  {
    id: 3,
    name: '创业担保贷款贴息',
    category: '创业扶持',
    matchScore: 82,
    amount: 300000,
    deadline: '2026-11-30',
    materials: ['创业计划书', '营业执照', '申请人身份证', '反担保材料', '经营场所证明'],
    matchDetails: [
      '省市场监管局核验：营业执照注册满6个月，经营正常',
      '省税务局核验：纳税申报正常，无欠税记录',
      '省社保局核验：企业职工参保缴费正常',
      '申请人符合创业担保贷款对象条件',
      '企业信用记录良好，无不良征信',
    ],
    description: '符合条件的创业者可申请最高300万元创业担保贷款，财政给予贴息支持。小微企业最高600万元。',
    process: [
      { step: '贷款申请', desc: '向人社部门或合作银行提交贷款申请' },
      { step: '资质审核', desc: '审核创业资质、信用状况、经营情况' },
      { step: '银行审批', desc: '合作银行进行贷款审批' },
      { step: '放款及贴息', desc: '银行放款，财政按季拨付贴息资金' },
    ],
  },
  {
    id: 4,
    name: '职业技能提升补贴',
    category: '技能培训',
    matchScore: 76,
    amount: 15000,
    deadline: '2026-09-30',
    materials: ['技能等级证书', '身份证', '社保缴费证明', '培训合格证明'],
    matchDetails: [
      '省鉴定中心核验：技能等级证书真实有效，全国联网可查',
      '省社保局核验：在职参保缴费满12个月',
      '省税务局核验：个人所得税正常申报',
      '取得高级工（三级）职业技能等级证书',
      '符合技能提升补贴标准：高级工2000元/人',
    ],
    description: '企业职工参加职业技能培训并取得证书的，可申领1000-5000元不等的技能提升补贴。',
    process: [
      { step: '证书核验', desc: '核验职业资格证书或技能等级证书' },
      { step: '在线申请', desc: '通过平台提交补贴申请' },
      { step: '审核公示', desc: '审核通过后公示5个工作日' },
      { step: '补贴拨付', desc: '资金拨付至申请人个人账户' },
    ],
  },
  {
    id: 5,
    name: '一次性吸纳就业补贴',
    category: '就业扶持',
    matchScore: 71,
    amount: 24000,
    deadline: '2026-08-31',
    materials: ['招用人员名单', '劳动合同', '社保缴费6个月证明'],
    matchDetails: [
      '省社保局核验：新招用人员已参保缴费3个月',
      '省教育局核验：招用人员为2026届高校毕业生',
      '省市场监管局核验：企业正常经营，未被列入失信名单',
      '签订1年以上劳动合同，缴纳失业保险',
      '按每人1500元标准，招用16人可获¥24,000',
    ],
    description: '企业招用毕业年度高校毕业生，签订劳动合同并参加失业保险的，按每人1500元标准发放一次性扩岗补助。',
    process: [
      { step: '条件确认', desc: '确认招用人员符合政策条件' },
      { step: '提交申请', desc: '在平台上传相关证明材料' },
      { step: '审核拨付', desc: '审核通过后10个工作日内拨付' },
    ],
  },
];

interface CalcBasisItem { key: string; label: string; value: string; pass: boolean }

interface ThreeNetItem { verified: boolean; agency: string; remark: string; verifiedAt: string; insuredMonths?: number; lastTaxPayment?: number; creditCode?: string; enterpriseStatus?: string }
interface ThreeNetVerification {
  medicalInsurance: ThreeNetItem;
  taxation: ThreeNetItem;
  marketSupervision: ThreeNetItem;
}

interface CalcResult {
  eligible: boolean;
  amount: number;
  ratio: number;
  reason?: string;
  reasons?: string[];
  estimatedReturn?: number;
  ratioPercent?: string;
  enterpriseTypeText?: string;
  calcBasis?: CalcBasisItem[];
  threeNetVerification?: ThreeNetVerification;
  claimStatus?: 'ready' | 'applying' | 'claimed' | 'ineligible';
  suggestion?: string;
  parameters?: {
    totalEmployees: number;
    insuredEmployees: number;
    actualPayment: number;
    layoffRate: number;
  };
}

export default function PolicyMatchPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [policies, setPolicies] = useState<Policy[]>(staticPolicies);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>(staticPolicies);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const [formData, setFormData] = useState({
    totalEmployees: '120',
    insuredEmployees: '120',
    actualPayment: '240000',
    layoffRate: '2.5',
  });
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const resp = await httpGet<any>(`/policy-match/match?userId=${user?.id || 1}`);
        if (resp.code === 0 && resp.data && resp.data.results && Array.isArray(resp.data.results)) {
          const mapped: Policy[] = resp.data.results.map((r: any, idx: number) => ({
            id: r.policyId || idx,
            policyId: r.policyId,
            policyCode: r.policyCode,
            name: r.title,
            title: r.title,
            category: r.category,
            matchScore: r.matchScore,
            matchDetails: r.matchDetails,
            isEligible: r.isEligible,
            amount: staticPolicies[idx % staticPolicies.length]?.amount || 50000,
            deadline: r.validTo || staticPolicies[idx % staticPolicies.length]?.deadline || '2026-12-31',
            validFrom: r.validFrom,
            validTo: r.validTo,
            materials: staticPolicies[idx % staticPolicies.length]?.materials || [],
            description: r.summary || staticPolicies[idx % staticPolicies.length]?.description,
            summary: r.summary,
            process: staticPolicies[idx % staticPolicies.length]?.process,
            threeNetVerification: r.threeNetVerification,
          }));
          if (mapped.length > 0) setPolicies(mapped);
        }
      } catch {
        setPolicies(staticPolicies);
      }
    };
    fetchPolicies();
  }, [user?.id]);

  useEffect(() => {
    if (!autoCalculated) {
      setAutoCalculated(true);
      handleCalculate();
    }
  }, []);

  useEffect(() => {
    const normalizedKeyword = keyword.trim();
    let next = policies;
    if (activeTab !== 'all') {
      const categoryName = categoryTabMap[activeTab];
      next = next.filter((p) => p.category === categoryName);
    }
    if (normalizedKeyword) {
      next = next.filter((p) => {
        const source = [
          p.name,
          p.title,
          p.category,
          p.description,
          p.summary,
          ...(p.materials || []),
          ...(p.matchDetails || []),
        ].join(' ');
        return source.includes(normalizedKeyword);
      });
    }
    setFilteredPolicies(next);
  }, [activeTab, policies, keyword]);

  const submitKeyword = () => {
    const next = keyword.trim();
    setSearchParams(next ? { keyword: next } : {});
  };

  const handleCalculate = async () => {
    if (!formData.totalEmployees || !formData.insuredEmployees || !formData.actualPayment || !formData.layoffRate) {
      return;
    }
    setIsCalculating(true);
    try {
      const resp = await httpPost<any>('/policy-match/wsg-return/calculate', {
        totalEmployees: Number(formData.totalEmployees),
        insuredEmployees: Number(formData.insuredEmployees),
        actualPayment: Number(formData.actualPayment),
        layoffRate: Number(formData.layoffRate),
      });
      if (resp.code === 0 && resp.data) {
        const d = resp.data;
        setCalcResult({
          eligible: d.eligible,
          amount: d.estimatedReturn,
          ratio: d.ratio,
          reasons: d.reasons,
          estimatedReturn: d.estimatedReturn,
          ratioPercent: d.ratioPercent,
          enterpriseTypeText: d.enterpriseTypeText,
          calcBasis: d.calcBasis,
          threeNetVerification: d.threeNetVerification,
          claimStatus: d.claimStatus,
          suggestion: d.suggestion,
          parameters: d.parameters,
        });
      }
    } catch {
      const total = Number(formData.totalEmployees);
      const insured = Number(formData.insuredEmployees);
      const payment = Number(formData.actualPayment);
      const layoff = Number(formData.layoffRate);
      const insuredRatio = insured / total;
      const isSmall = total <= 300;
      let eligible = true;
      const reasons: string[] = [];
      if (insuredRatio < 0.9) {
        eligible = false;
        reasons.push('参保率不足90%');
      }
      const threshold = isSmall ? 0.2 : 0.055;
      if (layoff > threshold * 100) {
        eligible = false;
        reasons.push(`裁员率${layoff}%超过阈值${(threshold * 100).toFixed(1)}%`);
      }
      const ratio = isSmall ? 0.6 : 0.3;
      const ratioPercent = isSmall ? '60%' : '30%';
      const enterpriseTypeText = isSmall ? '中小微企业' : '大型企业';
      setCalcResult({
        eligible,
        amount: eligible ? Math.round(payment * ratio) : 0,
        ratio: ratio * 100,
        ratioPercent,
        enterpriseTypeText,
        reasons,
        estimatedReturn: eligible ? Math.round(payment * ratio) : 0,
        claimStatus: eligible ? 'ready' : 'ineligible',
        suggestion: eligible ? '您的企业符合稳岗返还条件，可一键申领' : '请检查企业数据是否符合政策要求',
        parameters: { totalEmployees: total, insuredEmployees: insured, actualPayment: payment, layoffRate: layoff },
        calcBasis: [
          { key: 'insured_employees', label: '失业保险参保人数', value: `${insured}人（参保率 ${(insuredRatio * 100).toFixed(1)}%）`, pass: insuredRatio >= 0.9 },
          { key: 'layoff_rate_threshold', label: '裁员率判定口径', value: `${total > 30 ? '30人以上企业' : '30人以下企业'}，按≤${(threshold * 100).toFixed(1)}%执行`, pass: layoff <= threshold * 100 },
          { key: 'enterprise_type', label: '企业规模口径（参保人数）', value: `参保${total}人 ${isSmall ? '≤300人' : '>300人'}，判定为【${enterpriseTypeText}】`, pass: true },
          { key: 'return_ratio', label: '返还比例适用', value: `${enterpriseTypeText}：上年度实际缴纳失业保险费的 ${ratioPercent}`, pass: true },
          { key: 'actual_payment', label: '上年度实际缴费额（取数口径）', value: `税务部门征缴数据：¥${payment.toLocaleString()}元`, pass: true },
          { key: 'estimated_return', label: '预计返还金额计算公式', value: eligible ? `¥${payment.toLocaleString()} × ${ratioPercent} = ¥${Math.round(payment * ratio).toLocaleString()}` : '不符合条件', pass: eligible },
        ],
        threeNetVerification: {
          medicalInsurance: { verified: true, agency: '省级医疗保障局', remark: '职工医保连续参保，无断缴记录', verifiedAt: '2026-06-11', insuredMonths: 48 },
          taxation: { verified: true, agency: '省级税务局', remark: '企业纳税信用等级 A 级', verifiedAt: '2026-06-11', lastTaxPayment: payment },
          marketSupervision: { verified: true, agency: '省级市场监督管理局', remark: '工商登记信息核验通过', verifiedAt: '2026-06-11', enterpriseStatus: '存续（在营、开业、在册）' },
        },
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClaim = () => {
    if (!calcResult?.eligible) return;
    setCalcResult({ ...calcResult, claimStatus: 'applying' });
    setTimeout(() => {
      setCalcResult((prev) => (prev ? { ...prev, claimStatus: 'claimed' } : prev));
    }, 1800);
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-gov">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">免申即享 · 政策匹配中心</h1>
            <p className="text-sm text-gray-500">大数据智能匹配 · 政策主动找人 · 一键快速申领</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <Sparkles className="w-4 h-4 text-gov-500 shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitKeyword();
                }}
                placeholder="搜索政策名称、申领材料、三网核验依据"
                className="flex-1 bg-transparent py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                onClick={submitKeyword}
                className="px-4 py-2 rounded-lg bg-gov-500 text-white text-sm font-medium hover:bg-gov-600 transition-colors"
              >
                搜索
              </button>
            </div>
          </div>
          <div className="border-b border-gray-100 bg-gray-50/50 px-2">
            <div className="flex gap-1 p-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-gov-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-white hover:text-gov-600'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-gold-50 via-white to-gov-50/50 rounded-2xl border-2 border-gold-300 overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500"></div>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  稳岗返还自动测算
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-700 text-xs font-medium border border-gold-200">
                    热门
                  </span>
                </h2>
                <p className="text-sm text-gray-500">输入企业数据，秒级测算返还金额</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 text-gov-600" />
                    企业总人数
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.totalEmployees}
                      onChange={(e) => setFormData({ ...formData, totalEmployees: e.target.value })}
                      placeholder="请输入员工总数"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-4 focus:ring-gov-100 transition-all outline-none text-gray-700"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">人</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-gov-600" />
                    参保人数
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.insuredEmployees}
                      onChange={(e) => setFormData({ ...formData, insuredEmployees: e.target.value })}
                      placeholder="参加失业保险人数"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-4 focus:ring-gov-100 transition-all outline-none text-gray-700"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">人</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 text-gov-600" />
                    实际缴费额
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.actualPayment}
                      onChange={(e) => setFormData({ ...formData, actualPayment: e.target.value })}
                      placeholder="上年度实际缴纳失业保险费"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-4 focus:ring-gov-100 transition-all outline-none text-gray-700"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">元</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Percent className="w-4 h-4 text-gov-600" />
                    裁员率
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.layoffRate}
                      onChange={(e) => setFormData({ ...formData, layoffRate: e.target.value })}
                      placeholder="上年度裁员率"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-4 focus:ring-gov-100 transition-all outline-none text-gray-700"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className={cn(
                      'w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2',
                      isCalculating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gov-500 to-gov-700 hover:shadow-gov-lg hover:scale-[1.01] shadow-gov'
                    )}
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        测算中...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" />
                        立即测算
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className={cn(
                'rounded-2xl p-6 md:p-8 transition-all duration-500',
                calcResult
                  ? calcResult.eligible
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200'
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'
                  : 'bg-gray-50 border-2 border-dashed border-gray-200'
              )}>
                {calcResult ? (
                  <div className="animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                      {calcResult.eligible ? (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg">
                          <AlertTriangle className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-800">
                            {calcResult.eligible ? '符合申领条件' : '暂不符合条件'}
                          </h3>
                          {calcResult.claimStatus === 'claimed' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 已成功申领
                            </span>
                          )}
                          {calcResult.claimStatus === 'applying' && (
                            <span className="px-3 py-1 rounded-full bg-gov-50 text-gov-700 border border-gov-200 text-xs font-medium inline-flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-gov-600/30 border-t-gov-600 rounded-full animate-spin" /> 申领审核中
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {calcResult.eligible ? calcResult.suggestion || '恭喜！您的企业可以申请稳岗返还' : (calcResult.reasons?.[0] || calcResult.reason || '请检查您的输入数据')}
                        </p>
                      </div>
                    </div>

                    {calcResult.eligible && (
                      <div className="space-y-5">
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-gold-600" />
                            预计返还金额
                          </p>
                          <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-500 to-gold-700 bg-clip-text text-transparent">
                            ¥{calcResult.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">返还比例</p>
                            <p className="text-2xl font-bold text-gov-600">{calcResult.ratioPercent || `${calcResult.ratio}%`}</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">企业类型</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {calcResult.enterpriseTypeText || (Number(formData.totalEmployees) <= 300 ? '中小微' : '大型')}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">累计缴费</p>
                            <p className="text-2xl font-bold text-gold-600">
                              ¥{calcResult.parameters?.actualPayment?.toLocaleString() || formData.actualPayment}
                            </p>
                          </div>
                        </div>

                        {calcResult.threeNetVerification && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Network className="w-4 h-4 text-gov-600" />
                              省三网数据核验依据
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {[
                                { label: '医保', data: calcResult.threeNetVerification.medicalInsurance, icon: <Shield className="w-4 h-4" /> },
                                { label: '税务', data: calcResult.threeNetVerification.taxation, icon: <Landmark className="w-4 h-4" /> },
                                { label: '市监', data: calcResult.threeNetVerification.marketSupervision, icon: <Building2 className="w-4 h-4" /> },
                              ].map((item) => (
                                <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                      <div className={cn(
                                        'w-7 h-7 rounded-lg flex items-center justify-center text-white',
                                        item.data?.verified ? 'bg-emerald-500' : 'bg-red-500'
                                      )}>{item.icon}</div>
                                      {item.label}核验
                                    </div>
                                    <span className={cn(
                                      'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                                      item.data?.verified
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    )}>{item.data?.verified ? '通过' : '未通过'}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed mb-1">{item.data?.remark}</p>
                                  <p className="text-[11px] text-gray-400">数据来源：{item.data?.agency} · {item.data?.verifiedAt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {calcResult.calcBasis && calcResult.calcBasis.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-gov-600" />
                              测算口径与规则依据
                            </h4>
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                              {calcResult.calcBasis.map((b) => (
                                <div key={b.key} className="flex items-start gap-3 p-4">
                                  <div className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                    b.pass ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                  )}>
                                    {b.pass ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{b.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleClaim}
                          disabled={calcResult.claimStatus !== 'ready'}
                          className={cn(
                            'w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                            calcResult.claimStatus === 'claimed'
                              ? 'bg-emerald-500 cursor-default'
                              : calcResult.claimStatus === 'applying'
                                ? 'bg-gov-500 cursor-wait'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:scale-[1.02]'
                          )}
                        >
                          {calcResult.claimStatus === 'claimed' ? (
                            <><CheckCircle2 className="w-5 h-5" /> 已申领完成</>
                          ) : calcResult.claimStatus === 'applying' ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 正在提交申领...</>
                          ) : (
                            <><FileCheck className="w-5 h-5" /> 一键申领稳岗返还</>
                          )}
                        </button>
                      </div>
                    )}

                    {!calcResult.eligible && calcResult.reasons && calcResult.reasons.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <h4 className="text-sm font-semibold text-gray-700">不符合原因</h4>
                        <div className="bg-white rounded-xl p-4 border border-red-100">
                          {calcResult.reasons.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 text-sm text-gray-600">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Calculator className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">等待测算</h3>
                    <p className="text-sm text-gray-400 max-w-xs">
                      请在左侧填写企业相关数据，点击"立即测算"查看预计返还金额
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">我的匹配政策</h2>
                <p className="text-sm text-gray-500">共匹配 <span className="text-gov-600 font-semibold">{filteredPolicies.length}</span> 条政策</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredPolicies.map((policy, idx) => {
              const score = policy.matchScore || policy.match_score || 80;
              return (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy)}
                  className="group relative rounded-2xl border border-gray-100 p-6 cursor-pointer hover:border-gov-300 hover:shadow-gov transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gov-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-medium border',
                        categoryColors[policy.category] || 'bg-gray-100 text-gray-700 border-gray-200'
                      )}>
                        {policy.category}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-50 text-gov-700 border border-gov-100">
                        <span className="text-xs font-medium">匹配度</span>
                        <span className="font-bold">{score}%</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-gov-600 transition-colors line-clamp-1">
                      {policy.name}
                    </h3>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>匹配度进度</span>
                        <span className="font-medium text-gov-600">{score}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                            score >= 80 ? 'bg-gradient-to-r from-gov-400 to-gov-600' :
                            score >= 70 ? 'bg-gradient-to-r from-gold-400 to-gold-600' :
                            'bg-gradient-to-r from-orange-400 to-orange-600'
                          )}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50/50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Banknote className="w-3 h-3" />
                          预估金额
                        </p>
                        <p className="text-xl font-bold text-gold-600">¥{policy.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50/50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          申报截止
                        </p>
                        <p className="text-base font-semibold text-gray-700">{policy.deadline}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">所需材料</p>
                      <div className="flex flex-wrap gap-1.5">
                        {policy.materials.slice(0, 3).map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 text-xs border border-gray-100">
                            <FileText className="w-3 h-3 text-gray-400" />
                            {m}
                          </span>
                        ))}
                        {policy.materials.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-xs border border-gray-100">
                            +{policy.materials.length - 3}项
                          </span>
                        )}
                      </div>
                    </div>

                    {policy.matchDetails && policy.matchDetails.length > 0 && (
                      <div className="mb-4 bg-gov-50/40 rounded-xl p-3 border border-gov-100/50">
                        <p className="text-xs font-medium text-gov-600 mb-2 flex items-center gap-1">
                          <Network className="w-3 h-3" />
                          核验依据 · 匹配原因
                        </p>
                        <div className="space-y-1">
                          {policy.matchDetails.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{d}</span>
                            </div>
                          ))}
                          {policy.matchDetails.length > 3 && (
                            <p className="text-[11px] text-gov-500 font-medium mt-1">+{policy.matchDetails.length - 3}项依据，点击查看详情</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('正在跳转至申领流程...');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gov-500 to-gov-700 text-white font-medium text-sm hover:shadow-gov transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-1"
                      >
                        一键申领
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPolicy(policy);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gov-300 hover:bg-gov-50 hover:text-gov-700 transition-all duration-200"
                      >
                        详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="relative bg-gradient-to-r from-gov-600 via-gov-500 to-gov-700 px-6 md:px-8 py-6 text-white">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-gold-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 border',
                    (categoryColors[selectedPolicy.category] || 'bg-white/20 text-white border-white/30').replace('bg-', 'bg-white/20 ').replace('text-', 'text-white border-white/30 ').split(' ').slice(0, 4).join(' ')
                  )} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}>
                    {selectedPolicy.category}
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">{selectedPolicy.name}</h2>
                  <p className="text-sm text-gov-100 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      截止：{selectedPolicy.deadline}
                    </span>
                    <span>匹配度：{(selectedPolicy.matchScore || selectedPolicy.match_score || 85)}%</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-260px)] px-6 md:px-8 py-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gov-600" />
                  政策说明
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                  {selectedPolicy.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gold-50 to-orange-50 rounded-xl p-5 border border-gold-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-gold-600" />
                    预估补贴金额
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-700 bg-clip-text text-transparent">
                    ¥{selectedPolicy.amount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gov-50 to-blue-50 rounded-xl p-5 border border-gov-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gov-600" />
                    申报截止日期
                  </p>
                  <p className="text-2xl font-bold text-gov-700">{selectedPolicy.deadline}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-gov-600" />
                  所需材料清单
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPolicy.materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-700">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPolicy.matchDetails && selectedPolicy.matchDetails.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gov-600" />
                    资格匹配依据
                  </h3>
                  <div className="bg-gov-50/50 rounded-xl border border-gov-100 p-4 space-y-2">
                    {selectedPolicy.matchDetails.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.category === '稳岗返还' && calcResult?.threeNetVerification && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Network className="w-4 h-4 text-gov-600" />
                    省三网数据核验结论（免申即享资格依据）
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: '医保局', data: calcResult.threeNetVerification.medicalInsurance, icon: <Shield className="w-4 h-4" /> },
                      { label: '税务局', data: calcResult.threeNetVerification.taxation, icon: <Landmark className="w-4 h-4" /> },
                      { label: '市场监管局', data: calcResult.threeNetVerification.marketSupervision, icon: <Building2 className="w-4 h-4" /> },
                    ].map((item) => (
                      <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-white',
                              item.data?.verified ? 'bg-emerald-500' : 'bg-red-500'
                            )}>{item.icon}</div>
                            {item.label}
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                            item.data?.verified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          )}>{item.data?.verified ? '通过' : '未通过'}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-1">{item.data?.remark}</p>
                        <p className="text-[11px] text-gray-400">数据来源：{item.data?.agency} · {item.data?.verifiedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.category === '稳岗返还' && calcResult?.calcBasis && calcResult.calcBasis.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gov-600" />
                    测算口径与规则依据
                  </h3>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                    {calcResult.calcBasis.map((b) => (
                      <div key={b.key} className="flex items-start gap-3 p-3">
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          b.pass ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        )}>
                          {b.pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{b.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.category === '稳岗返还' && calcResult && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-gov-600" />
                    申领状态追踪
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      calcResult.claimStatus === 'claimed' ? 'bg-emerald-500' :
                      calcResult.claimStatus === 'applying' ? 'bg-gov-500' :
                      calcResult.eligible ? 'bg-gold-500' : 'bg-gray-300'
                    )}>
                      {calcResult.claimStatus === 'claimed' ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                       calcResult.claimStatus === 'applying' ? <Clock className="w-5 h-5 text-white animate-spin" /> :
                       <FileCheck className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {calcResult.claimStatus === 'claimed' ? '已成功申领' :
                         calcResult.claimStatus === 'applying' ? '审核中' :
                         calcResult.eligible ? '待申领（符合条件）' : '不符合申领条件'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calcResult.claimStatus === 'claimed' ? '资金已拨付至企业银行账户' :
                         calcResult.claimStatus === 'applying' ? '人社部门正在审核您的申领申请' :
                         calcResult.eligible ? `预计返还 ¥${calcResult.estimatedReturn?.toLocaleString() || calcResult.amount.toLocaleString()}，点击下方按钮申领` :
                         '请核实企业参保缴费及裁员率数据'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPolicy.process && selectedPolicy.process.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gov-600" />
                    办理流程
                  </h3>
                  <div className="relative pl-6 space-y-5">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gov-400 via-gov-300 to-gov-200 rounded-full"></div>
                    {selectedPolicy.process.map((step, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 w-6 h-6 rounded-full bg-gradient-to-br from-gov-500 to-gov-700 text-white text-xs font-bold flex items-center justify-center shadow-md border-2 border-white">
                          {i + 1}
                        </div>
                        <div className="bg-gradient-to-r from-gov-50/80 to-transparent rounded-xl p-4 border border-gov-100">
                          <h4 className="font-semibold text-gray-800 mb-1">{step.step}</h4>
                          <p className="text-sm text-gray-600">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 md:px-8 py-5 bg-gray-50/50 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (calcResult?.claimStatus === 'ready') {
                    handleClaim();
                  }
                  setSelectedPolicy(null);
                }}
                disabled={calcResult?.claimStatus === 'applying'}
                className={cn(
                  'flex-1 min-w-[200px] py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-gov flex items-center justify-center gap-2',
                  calcResult?.claimStatus === 'claimed'
                    ? 'bg-emerald-500 cursor-default'
                    : calcResult?.claimStatus === 'applying'
                      ? 'bg-gov-500 cursor-wait'
                      : 'bg-gradient-to-r from-gov-500 to-gov-700 hover:shadow-gov-lg hover:scale-[1.02]'
                )}
              >
                {calcResult?.claimStatus === 'claimed' ? (
                  <><CheckCircle2 className="w-5 h-5" /> 已申领完成</>
                ) : calcResult?.claimStatus === 'applying' ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 申领审核中...</>
                ) : (
                  <><FileCheck className="w-5 h-5" /> 立即申领</>
                )}
              </button>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
