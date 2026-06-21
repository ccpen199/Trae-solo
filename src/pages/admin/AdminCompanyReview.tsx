import { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Check,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  User,
  MapPin,
  Scale,
  Gavel,
  ShieldAlert,
  FileWarning,
} from 'lucide-react';
import { mockCompanies, mockVerificationRecords } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTime, getRiskLevelColor } from '@/utils/helpers';
import type { Company, VerificationRecord, RiskItem } from '@/../shared/types';

interface CompanyWithVerification {
  company: Company;
  verification: VerificationRecord | undefined;
}

const riskLevelLabelMap: Record<string, string> = {
  none: '无风险',
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const riskTypeLabelMap: Record<string, string> = {
  lawsuit: '诉讼纠纷',
  execution: '被执行',
  dishonest: '失信',
  penalty: '行政处罚',
};

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
];

const industryOptions = ['全部行业', '餐饮服务', '新零售', '家政服务', '物流配送', '安保服务'];
const riskLevelOptions = ['全部风险', '无风险', '低风险', '中风险', '高风险'];

function maskLicenseNo(licenseNo: string): string {
  if (!licenseNo || licenseNo.length < 10) return licenseNo;
  return licenseNo.slice(0, 6) + '********' + licenseNo.slice(-4);
}

function getVerificationStatusFromCompany(company: Company): string {
  switch (company.status) {
    case 'verified':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending_review';
  }
}

export default function AdminCompanyReview() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('全部行业');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('全部风险');
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const companiesWithVerification: CompanyWithVerification[] = useMemo(() => {
    return mockCompanies.map((company) => ({
      company,
      verification: mockVerificationRecords.find((v) => v.companyId === company.id),
    }));
  }, []);

  const filteredCompanies = useMemo(() => {
    return companiesWithVerification.filter(({ company, verification }) => {
      const statusForFilter = getVerificationStatusFromCompany(company);

      if (activeTab === 'pending' && statusForFilter !== 'pending_review') return false;
      if (activeTab === 'approved' && statusForFilter !== 'approved') return false;
      if (activeTab === 'rejected' && statusForFilter !== 'rejected') return false;

      if (searchQuery && !company.name.includes(searchQuery) && !company.legalPerson.includes(searchQuery)) {
        return false;
      }

      if (selectedIndustry !== '全部行业' && company.industry !== selectedIndustry) {
        return false;
      }

      if (selectedRiskLevel !== '全部风险') {
        const riskLevel = verification?.riskData?.level ?? 'none';
        const riskLevelKey = Object.keys(riskLevelLabelMap).find(
          (k) => riskLevelLabelMap[k] === selectedRiskLevel
        );
        if (riskLevel !== riskLevelKey) return false;
      }

      return true;
    });
  }, [companiesWithVerification, activeTab, searchQuery, selectedIndustry, selectedRiskLevel]);

  const handleApprove = (companyId: string) => {
    console.log('通过企业认证:', companyId);
  };

  const handleReject = (companyId: string) => {
    const reason = rejectReasons[companyId] || '';
    console.log('驳回企业认证:', companyId, '原因:', reason);
  };

  const setRejectReason = (companyId: string, reason: string) => {
    setRejectReasons((prev) => ({ ...prev, [companyId]: reason }));
  };

  const renderRiskItemIcon = (type: string) => {
    switch (type) {
      case 'lawsuit':
        return <Scale className="h-4 w-4 text-info" />;
      case 'execution':
        return <Gavel className="h-4 w-4 text-accent" />;
      case 'dishonest':
        return <ShieldAlert className="h-4 w-4 text-danger" />;
      case 'penalty':
        return <FileWarning className="h-4 w-4 text-accent" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">企业资质审核</h1>
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
              placeholder="搜索企业名称、法人..."
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
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {riskLevelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompanies.map(({ company, verification }) => {
          const riskData = verification?.riskData;
          const ocrData = verification?.ocrData;
          const displayStatus = verification?.status || getVerificationStatusFromCompany(company);
          const isPending = company.status === 'pending';

          return (
            <div
              key={company.id}
              className="glass rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <StatusBadge status={displayStatus} type="verification" />
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-gray-400" />
                      <span>营业执照：{maskLicenseNo(company.licenseNo)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>法人代表：{company.legalPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>所属行业：{company.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="line-clamp-1">地址：{company.address}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">提交时间</p>
                  <p className="text-sm text-gray-700">
                    {verification ? formatDateTime(verification.submittedAt) : '-'}
                  </p>
                </div>
              </div>

              {ocrData && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <h4 className="font-medium text-gray-900">OCR识别结果</h4>
                    <span className="text-xs text-gray-500 ml-auto">
                      置信度 {(ocrData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">企业名称</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">营业执照号</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">法人代表</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">注册资本</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">成立日期</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-gray-600">经营范围</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    <h4 className="font-medium text-gray-900">司法风险扫描结果</h4>
                  </div>
                  {riskData && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskLevelColor(
                        riskData.level
                      )}`}
                      style={{
                        backgroundColor:
                          riskData.level === 'none'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : riskData.level === 'low'
                            ? 'rgba(59, 130, 246, 0.1)'
                            : riskData.level === 'medium'
                            ? 'rgba(255, 107, 53, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      {riskLevelLabelMap[riskData.level]}
                    </span>
                  )}
                </div>

                {riskData ? (
                  <>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-info">{riskData.lawsuitCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">诉讼纠纷</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-accent">{riskData.executionCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">被执行</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-danger">{riskData.dishonestCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">失信</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-accent">
                          {riskData.administrativePenaltyCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">行政处罚</p>
                      </div>
                    </div>

                    {riskData.details.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">风险明细：</p>
                        {riskData.details.map((item: RiskItem, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-white rounded-lg p-3"
                          >
                            {renderRiskItemIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {riskTypeLabelMap[item.type] || item.type}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-0.5">{item.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{item.date}</span>
                                {item.amount && <span>金额：{item.amount}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">风险扫描进行中...</p>
                )}
              </div>

              {isPending && (
                <div className="space-y-3">
                  <div>
                    <textarea
                      placeholder="填写驳回原因（选填，驳回时需填写）..."
                      value={rejectReasons[company.id] || ''}
                      onChange={(e) => setRejectReason(company.id, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(company.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                    >
                      <CheckCircle className="h-5 w-5" />
                      通过认证
                    </button>
                    <button
                      onClick={() => handleReject(company.id)}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-danger text-danger hover:bg-danger/5 px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                    >
                      <XCircle className="h-5 w-5" />
                      驳回认证
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的企业</p>
        </div>
      )}
    </div>
  );
}
