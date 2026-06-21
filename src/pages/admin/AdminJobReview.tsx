import { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Eye,
  Check,
  X,
  AlertTriangle,
  DollarSign,
  AlertCircle,
  Gift,
  XCircle,
  CheckCircle,
  ChevronRight,
  Building2,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import { mockJobs } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatSalary, getIndustryLabel } from '@/utils/helpers';
import type { Job } from '@/../shared/types';

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
];

const industryOptions = ['全部行业', '餐饮', '零售', '家政', '物流', '安保', '其他'];
const salaryRangeOptions = [
  { key: 'all', label: '全部薪资' },
  { key: 'low', label: '5000以下' },
  { key: 'mid', label: '5000-10000' },
  { key: 'high', label: '10000以上' },
];

const rejectReasons = [
  '薪资信息虚假',
  '包含敏感词汇',
  '福利承诺不实',
  '岗位描述违规',
  '企业资质未通过',
  '其他原因',
];

interface JobRiskAnalysis {
  salaryAbnormal: boolean;
  sensitiveWords: string[];
  suspiciousBenefits: string[];
  aiPreliminaryResult: 'pass' | 'warning' | 'reject';
  industrySalaryAvg: number;
}

const jobRiskMap: Record<string, JobRiskAnalysis> = {
  'job-001': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 25,
  },
  'job-002': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 21,
  },
  'job-003': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 280,
  },
  'job-004': {
    salaryAbnormal: true,
    sensitiveWords: [],
    suspiciousBenefits: ['包住条件未明确说明'],
    aiPreliminaryResult: 'warning',
    industrySalaryAvg: 220,
  },
  'job-005': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 23,
  },
  'job-006': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 4800,
  },
  'job-007': {
    salaryAbnormal: false,
    sensitiveWords: [],
    suspiciousBenefits: [],
    aiPreliminaryResult: 'pass',
    industrySalaryAvg: 7500,
  },
  'job-008': {
    salaryAbnormal: false,
    sensitiveWords: ['保底月薪过高', '提成无上限'],
    suspiciousBenefits: ['月度之星奖金未说明评定标准'],
    aiPreliminaryResult: 'warning',
    industrySalaryAvg: 18,
  },
};

function getAiResultBadge(result: 'pass' | 'warning' | 'reject') {
  const map = {
    pass: { label: '通过', className: 'bg-green-100 text-green-700' },
    warning: { label: '风险提示', className: 'bg-yellow-100 text-yellow-700' },
    reject: { label: '驳回建议', className: 'bg-red-100 text-red-700' },
  };
  return map[result];
}

export default function AdminJobReview() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('全部行业');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      if (activeTab === 'pending' && job.reviewStatus !== 'pending') return false;
      if (activeTab === 'approved' && job.reviewStatus !== 'approved') return false;
      if (activeTab === 'rejected' && job.reviewStatus !== 'rejected') return false;

      if (
        searchQuery &&
        !job.title.includes(searchQuery) &&
        !job.companyName.includes(searchQuery)
      ) {
        return false;
      }

      const industryLabel = getIndustryLabel(job.industry);
      if (selectedIndustry !== '全部行业' && industryLabel !== selectedIndustry) {
        return false;
      }

      if (selectedSalaryRange !== 'all') {
        const monthlyEquivalent =
          job.salaryType === 'monthly'
            ? job.salaryMin
            : job.salaryType === 'daily'
            ? job.salaryMin * 22
            : job.salaryMin * 8 * 22;

        if (selectedSalaryRange === 'low' && monthlyEquivalent >= 5000) return false;
        if (selectedSalaryRange === 'mid' && (monthlyEquivalent < 5000 || monthlyEquivalent > 10000))
          return false;
        if (selectedSalaryRange === 'high' && monthlyEquivalent <= 10000) return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, selectedIndustry, selectedSalaryRange]);

  const handleViewDetail = (job: Job) => {
    setSelectedJob(job);
    setApproveNote('');
    setSelectedRejectReason('');
    setRejectNote('');
  };

  const handleCloseDetail = () => {
    setSelectedJob(null);
  };

  const handleApprove = (jobId: string) => {
    console.log('通过岗位审核:', jobId, '备注:', approveNote);
    setSelectedJob(null);
  };

  const handleReject = (jobId: string) => {
    console.log(
      '驳回岗位审核:',
      jobId,
      '原因:',
      selectedRejectReason,
      '补充说明:',
      rejectNote
    );
    setSelectedJob(null);
  };

  const handleQuickApprove = (jobId: string) => {
    console.log('快速通过:', jobId);
  };

  const handleQuickReject = (jobId: string) => {
    console.log('快速驳回:', jobId);
  };

  const selectedRisk = selectedJob ? jobRiskMap[selectedJob.id] : null;

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Briefcase className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">岗位内容审核</h1>
      </div>

      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索岗位标题、企业名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {industryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={selectedSalaryRange}
            onChange={(e) => setSelectedSalaryRange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {salaryRangeOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">岗位标题</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">薪资范围</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">行业类别</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">发布时间</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">AI预审结果</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">风险项</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job: Job) => {
              const risk = jobRiskMap[job.id];
              const aiBadge = risk ? getAiResultBadge(risk.aiPreliminaryResult) : null;
              const riskCount = risk
                ? (risk.salaryAbnormal ? 1 : 0) +
                  risk.sensitiveWords.length +
                  risk.suspiciousBenefits.length
                : 0;

              return (
                <tr
                  key={job.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.companyName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                      {getIndustryLabel(job.industry)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">{formatDate(job.createdAt)}</td>
                  <td className="py-4 px-4">
                    {aiBadge && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${aiBadge.className}`}
                      >
                        {aiBadge.label}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {riskCount > 0 ? (
                      <div className="flex items-center gap-1">
                        {risk?.salaryAbnormal && (
                          <span
                            title="薪资异常"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/10 text-accent"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {risk && risk.sensitiveWords.length > 0 && (
                          <span
                            title={`敏感词: ${risk.sensitiveWords.join(', ')}`}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-danger/10 text-danger"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {risk && risk.suspiciousBenefits.length > 0 && (
                          <span
                            title={`虚假福利: ${risk.suspiciousBenefits.join(', ')}`}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-700"
                          >
                            <Gift className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-1">{riskCount}项</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={job.reviewStatus} type="review" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(job)}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        查看详情
                      </button>
                      {job.reviewStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleQuickApprove(job.id)}
                            className="flex items-center gap-1 text-sm text-success hover:text-success/80 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            通过
                          </button>
                          <button
                            onClick={() => handleQuickReject(job.id)}
                            className="flex items-center gap-1 text-sm text-danger hover:text-danger/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            驳回
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的岗位</p>
          </div>
        )}
      </div>

      {selectedJob && selectedRisk && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseDetail}
          />
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl animate-slide-up">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">岗位审核详情</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedJob.companyName} · {selectedJob.title}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    岗位基本信息
                  </h3>
                  <StatusBadge status={selectedJob.reviewStatus} type="review" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">岗位标题</p>
                    <p className="text-gray-900 font-medium">{selectedJob.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">薪资范围</p>
                    <p className="text-accent font-semibold">
                      {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">所属企业</p>
                    <div className="flex items-center gap-1 text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {selectedJob.companyName}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">行业类别</p>
                    <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                      {getIndustryLabel(selectedJob.industry)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">工作地点</p>
                    <div className="flex items-center gap-1 text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {selectedJob.location}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">发布时间</p>
                    <div className="flex items-center gap-1 text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(selectedJob.createdAt)}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">标签</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedJob.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  岗位详细内容
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">岗位描述</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedJob.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">任职要求</p>
                    <ul className="space-y-1.5">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">福利待遇</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-accent/10 text-accent px-3 py-1.5 text-sm"
                        >
                          <Gift className="h-3.5 w-3.5" />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    AI风险分析
                  </h3>
                  {(() => {
                    const badge = getAiResultBadge(selectedRisk.aiPreliminaryResult);
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-danger" />
                      <p className="font-medium text-gray-900 text-sm">敏感词检测</p>
                    </div>
                    {selectedRisk.sensitiveWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRisk.sensitiveWords.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg bg-danger/10 text-danger px-3 py-1.5 text-sm"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-success flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        未检测到敏感词汇
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <p className="font-medium text-gray-900 text-sm">薪资真实性核验</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-xs mb-1">岗位最低</p>
                        <p className="text-lg font-bold text-gray-900">{selectedJob.salaryMin}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-xs mb-1">行业均值</p>
                        <p className="text-lg font-bold text-primary">
                          {selectedRisk.industrySalaryAvg}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-xs mb-1">偏差</p>
                        <p
                          className={`text-lg font-bold ${
                            selectedRisk.salaryAbnormal ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {selectedRisk.salaryAbnormal
                            ? `+${Math.round(
                                ((selectedJob.salaryMin - selectedRisk.industrySalaryAvg) /
                                  selectedRisk.industrySalaryAvg) *
                                  100
                              )}%`
                            : '正常'}
                        </p>
                      </div>
                    </div>
                    {selectedRisk.salaryAbnormal && (
                      <p className="text-xs text-danger mt-3 flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        薪资水平明显高于同行业均值，建议人工核实薪资真实性
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-5 w-5 text-yellow-600" />
                      <p className="font-medium text-gray-900 text-sm">福利条款审查</p>
                    </div>
                    {selectedRisk.suspiciousBenefits.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedRisk.suspiciousBenefits.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2"
                          >
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-success flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        福利条款未发现可疑承诺
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedJob.reviewStatus === 'pending' && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">审核操作</h3>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">通过备注（选填）</label>
                    <textarea
                      placeholder="填写通过审核的备注信息..."
                      value={approveNote}
                      onChange={(e) => setApproveNote(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">驳回原因</label>
                    <select
                      value={selectedRejectReason}
                      onChange={(e) => setSelectedRejectReason(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger bg-white mb-2"
                    >
                      <option value="">请选择驳回原因（驳回时必选）</option>
                      {rejectReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="补充说明（选填）..."
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedJob.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                    >
                      <CheckCircle className="h-5 w-5" />
                      通过审核
                    </button>
                    <button
                      onClick={() => handleReject(selectedJob.id)}
                      disabled={!selectedRejectReason}
                      className="flex-1 flex items-center justify-center gap-2 bg-danger hover:bg-danger/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                    >
                      <XCircle className="h-5 w-5" />
                      驳回审核
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
