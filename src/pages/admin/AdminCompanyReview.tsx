import { useState, useMemo } from 'react';
import { Search, Filter, Check, X, Eye, FileText, AlertTriangle, Building, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { mockCompanies, mockCompanyQualifications, mockRiskScores } from '@shared/mock/data';
import { INDUSTRY_LIST } from '@shared/types';
import type { Company, CompanyQualification, VerificationStatus, IndustryType } from '@shared/types';

interface CompanyWithQualification extends Company {
  qualification: CompanyQualification | undefined;
  riskScore: number | undefined;
}

const AdminCompanyReviewContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [industryFilter, setIndustryFilter] = useState<IndustryType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithQualification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const itemsPerPage = 10;

  const companiesWithDetails: CompanyWithQualification[] = useMemo(() => {
    return mockCompanies.map(company => ({
      ...company,
      qualification: mockCompanyQualifications.find(q => q.companyId === company.id),
      riskScore: mockRiskScores.find(r => r.entityId === company.id)?.overallScore,
    }));
  }, []);

  const filteredCompanies = useMemo(() => {
    return companiesWithDetails.filter(company => {
      if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && company.qualification?.status !== statusFilter) {
        return false;
      }
      if (industryFilter !== 'all' && company.industry !== industryFilter) {
        return false;
      }
      if (dateRange.start) {
        const companyDate = new Date(company.createdAt);
        const startDate = new Date(dateRange.start);
        if (companyDate < startDate) return false;
      }
      if (dateRange.end) {
        const companyDate = new Date(company.createdAt);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        if (companyDate > endDate) return false;
      }
      return true;
    });
  }, [companiesWithDetails, searchQuery, statusFilter, industryFilter, dateRange]);

  const stats = useMemo(() => {
    const pending = companiesWithDetails.filter(c => c.qualification?.status === 'pending').length;
    const todayApproved = companiesWithDetails.filter(c => {
      if (!c.qualification?.verifiedAt) return false;
      const verifyDate = new Date(c.qualification.verifiedAt);
      const today = new Date();
      return verifyDate.toDateString() === today.toDateString() && c.qualification.status === 'approved';
    }).length;
    const todayRejected = companiesWithDetails.filter(c => {
      if (!c.qualification?.verifiedAt) return false;
      const verifyDate = new Date(c.qualification.verifiedAt);
      const today = new Date();
      return verifyDate.toDateString() === today.toDateString() && c.qualification.status === 'rejected';
    }).length;
    const totalReviewed = companiesWithDetails.filter(c => c.qualification?.status === 'approved' || c.qualification?.status === 'rejected').length;
    const approved = companiesWithDetails.filter(c => c.qualification?.status === 'approved').length;
    const passRate = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

    return { pending, todayApproved, todayRejected, passRate };
  }, [companiesWithDetails]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCompanies.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleViewDetail = (company: CompanyWithQualification) => {
    setSelectedCompany(company);
    setReviewNotes('');
    setDetailModalOpen(true);
  };

  const handleBulkApprove = () => {
    alert(`已通过 ${selectedIds.length} 家企业审核`);
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    alert(`已拒绝 ${selectedIds.length} 家企业审核`);
    setSelectedIds([]);
  };

  const handleApprove = () => {
    alert(`已通过 ${selectedCompany?.name} 的审核`);
    setDetailModalOpen(false);
  };

  const handleReject = () => {
    alert(`已拒绝 ${selectedCompany?.name} 的审核，原因：${reviewNotes}`);
    setDetailModalOpen(false);
  };

  const getStatusBadge = (status?: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case 'approved':
        return <Badge variant="success" size="sm"><Check className="w-3 h-3 mr-1" />已通过</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm"><X className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="info" size="sm">未知</Badge>;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'bg-mint-500';
    if (score >= 70) return 'bg-primary-500';
    if (score >= 50) return 'bg-accent-400';
    return 'bg-accent-600';
  };

  return (
    <PageLayout title="企业入驻审核" subtitle="多维度审核，确保企业资质真实有效">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                  <Building className="w-6 h-6 text-accent-500" />
                </div>
                <Badge variant="warning" size="sm">待处理</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.pending}</p>
              <p className="mt-1 text-sm text-neutral-500">待审核企业</p>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-mint-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-mint-500" />
                </div>
                <Badge variant="success" size="sm">今日</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.todayApproved}</p>
              <p className="mt-1 text-sm text-neutral-500">今日已通过</p>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <X className="w-6 h-6 text-accent-500" />
                </div>
                <Badge variant="danger" size="sm">今日</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.todayRejected}</p>
              <p className="mt-1 text-sm text-neutral-500">今日已拒绝</p>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <Badge variant="primary" size="sm">通过率</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.passRate}%</p>
              <p className="mt-1 text-sm text-neutral-500">审核通过率</p>
            </div>
          </Card>
        </div>

        <Card padding="md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索企业名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | VerificationStatus)}
                className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-neutral-400" />
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value as IndustryType | 'all')}
                className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white"
              >
                <option value="all">全部行业</option>
                {INDUSTRY_LIST.map(industry => (
                  <option key={industry.key} value={industry.key}>{industry.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <span className="text-neutral-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>

            <Button variant="ghost" onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setIndustryFilter('all');
              setDateRange({ start: '', end: '' });
            }}>
              重置
            </Button>
          </div>
        </Card>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200 animate-fade-in">
            <div className="flex items-center gap-3">
              <Badge variant="primary" size="md">{selectedIds.length} 家已选择</Badge>
              <span className="text-sm text-neutral-600">请选择批量操作</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="success" size="sm" onClick={handleBulkApprove}>
                <Check className="w-4 h-4" />
                批量通过
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkReject}>
                <X className="w-4 h-4" />
                批量拒绝
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                取消选择
              </Button>
            </div>
          </div>
        )}

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-5 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedCompanies.length && paginatedCompanies.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">企业名称</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">所属行业</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">联系人</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">联系电话</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">提交时间</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">审核状态</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">合规评分</th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company, index) => (
                  <tr key={company.id} className={cn(
                    'border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                    index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                  )}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(company.id)}
                        onChange={(e) => handleSelect(company.id, e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-mint-100 flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800">{company.name}</p>
                          {company.riskScore !== undefined && company.riskScore < 60 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-accent-500" />
                              <span className="text-xs text-accent-500">高风险</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info" size="sm">
                        {INDUSTRY_LIST.find(i => i.key === company.industry)?.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">{company.contactPerson}</td>
                    <td className="px-5 py-4 text-sm text-neutral-700">{company.phone}</td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(company.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(company.qualification?.status)}</td>
                    <td className="px-5 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-500">合规分</span>
                          <span className="text-xs font-medium text-neutral-700">
                            {company.qualification?.complianceScore || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', getComplianceColor(company.qualification?.complianceScore || 0))}
                            style={{ width: `${company.qualification?.complianceScore || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(company)}>
                          <Eye className="w-4 h-4" />
                          查看
                        </Button>
                        {company.qualification?.status === 'pending' && (
                          <>
                            <Button variant="success" size="sm" onClick={() => {
                              setSelectedCompany(company);
                              handleApprove();
                            }}>
                              <Check className="w-4 h-4" />
                              通过
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => {
                              setSelectedCompany(company);
                              setReviewNotes('');
                              handleReject();
                            }}>
                              <X className="w-4 h-4" />
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500">没有找到匹配的企业</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-500">
                共 {filteredCompanies.length} 条记录，第 {currentPage} / {totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-primary-500 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    {page}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={selectedCompany?.name}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>
                关闭
              </Button>
              {selectedCompany?.qualification?.status === 'pending' && (
                <>
                  <Button variant="success" onClick={handleApprove}>
                    <Check className="w-4 h-4" />
                    通过审核
                  </Button>
                  <Button variant="danger" onClick={handleReject}>
                    <X className="w-4 h-4" />
                    拒绝审核
                  </Button>
                </>
              )}
            </div>
          }
        >
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-serif text-lg font-semibold text-primary-800 mb-4">企业基本信息</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">企业名称</span>
                      <span className="text-sm text-neutral-800 font-medium">{selectedCompany.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">所属行业</span>
                      <Badge variant="info" size="sm">
                        {INDUSTRY_LIST.find(i => i.key === selectedCompany.industry)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">联系人</span>
                      <span className="text-sm text-neutral-800">{selectedCompany.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">联系电话</span>
                      <span className="text-sm text-neutral-800">{selectedCompany.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">企业地址</span>
                      <span className="text-sm text-neutral-800">{selectedCompany.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-20">提交时间</span>
                      <span className="text-sm text-neutral-800">
                        {new Date(selectedCompany.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-serif text-lg font-semibold text-primary-800 mb-4">营业执照</h4>
                  <div className="w-full aspect-video bg-neutral-100 rounded-xl overflow-hidden border-2 border-dashed border-neutral-300 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">点击预览营业执照</p>
                      <p className="text-xs text-neutral-400 mt-1">business-license.jpg</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-lg font-semibold text-primary-800 mb-4">行业资质认证</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompany.qualification?.industryCertifications.map((cert, index) => (
                    <Badge key={index} variant="success" size="md">
                      <Check className="w-3 h-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-lg font-semibold text-primary-800 mb-4">风险评估</h4>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-600">综合合规评分</span>
                    <span className="text-xl font-serif font-bold text-primary-600">
                      {selectedCompany.qualification?.complianceScore || 0}分
                    </span>
                  </div>
                  <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', getComplianceColor(selectedCompany.qualification?.complianceScore || 0))}
                      style={{ width: `${selectedCompany.qualification?.complianceScore || 0}%` }}
                    />
                  </div>
                  {selectedCompany.riskScore !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-accent-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-accent-700">风险评分: {selectedCompany.riskScore}分</p>
                        <p className="text-xs text-accent-600">
                          {selectedCompany.riskScore < 60 ? '存在较高风险，请谨慎审核' : '风险较低，可以正常审核'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-lg font-semibold text-primary-800 mb-4">审核备注</h4>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="请输入审核备注（拒绝时必填）..."
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

const AdminCompanyReview = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminCompanyReviewContent />
    </ProtectedRoute>
  );
};

export default AdminCompanyReview;
