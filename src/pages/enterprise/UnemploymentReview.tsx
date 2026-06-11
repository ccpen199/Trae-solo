import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  Upload,
  BarChart3,
  Download,
  User,
  Calendar,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  Briefcase,
  DollarSign,
  CalendarDays,
  X,
  Check,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockUnemploymentApplications } from '@/mock/data';
import {
  formatCurrency,
  formatDate,
  formatIdCard,
  getStatusText,
  getStatusColor,
} from '@/utils/format';
import type { UnemploymentApplication } from '@/types';

type TabType = 'list' | 'detail';
type StatusFilter = 'all' | 'pending_review' | 'reviewing' | 'approved' | 'rejected';

const statusMap: Record<string, string> = {
  pending_review: '待预审',
  reviewing: '预审中',
  approved: '已通过',
  rejected: '已拒绝',
};

const getUnemploymentStatusText = (status: string): string => {
  return statusMap[status] || getStatusText(status);
};

const getUnemploymentStatusColor = (status: string): string => {
  if (status === 'pending_review') return 'warning';
  if (status === 'reviewing') return 'primary';
  return getStatusColor(status);
};

const UnemploymentReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<UnemploymentApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const statsData = [
    {
      title: '待预审申请数',
      value: 12,
      unit: '件',
      gradient: 'from-orange-500 to-orange-600',
      icon: Clock,
      trend: '+3',
      trendType: 'up',
    },
    {
      title: '本月预审通过数',
      value: 86,
      unit: '件',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: CheckCircle,
      trend: '+12%',
      trendType: 'up',
    },
    {
      title: '本月预审拒绝数',
      value: 8,
      unit: '件',
      gradient: 'from-rose-500 to-rose-600',
      icon: XCircle,
      trend: '-2',
      trendType: 'down',
    },
    {
      title: '平均预审时长',
      value: 1.5,
      unit: '工作日',
      gradient: 'from-blue-500 to-blue-600',
      icon: CalendarDays,
      trend: '-0.3天',
      trendType: 'down',
    },
  ];

  const quickActions = [
    { icon: Plus, label: '新增预审', color: 'from-orange-500 to-orange-600' },
    { icon: Upload, label: '批量导入', color: 'from-blue-500 to-blue-600' },
    { icon: BarChart3, label: '预审统计', color: 'from-emerald-500 to-emerald-600' },
    { icon: Download, label: '模板下载', color: 'from-violet-500 to-violet-600' },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending_review', label: '待预审' },
    { value: 'reviewing', label: '预审中' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
  ];

  const filteredApplications = useMemo(() => {
    return mockUnemploymentApplications.filter((app) => {
      const matchSearch =
        searchText === '' ||
        app.applicantName.includes(searchText) ||
        app.idCard.includes(searchText) ||
        app.applicationNo.includes(searchText);
      const matchStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchText, statusFilter]);

  const handleViewDetail = (app: UnemploymentApplication) => {
    setSelectedApplication(app);
    setShowDetailModal(true);
    setReviewComment(app.reviewComment || '');
  };

  const handleApprove = () => {
    alert('预审通过');
    setShowDetailModal(false);
  };

  const handleReject = () => {
    alert('预审拒绝');
    setShowDetailModal(false);
  };

  const materialList = [
    { name: '身份证正反面', status: 'approved', icon: CreditCard },
    { name: '离职证明', status: 'approved', icon: FileText },
    { name: '银行卡信息', status: 'approved', icon: DollarSign },
    { name: '社保缴费证明', status: 'pending', icon: FileCheck },
  ];

  const insuranceRecords = [
    { month: '2025-06', base: 10500, personal: 52.5, company: 52.5 },
    { month: '2025-05', base: 10500, personal: 52.5, company: 52.5 },
    { month: '2025-04', base: 10500, personal: 52.5, company: 52.5 },
    { month: '2025-03', base: 10500, personal: 52.5, company: 52.5 },
    { month: '2025-02', base: 10500, personal: 52.5, company: 52.5 },
    { month: '2025-01', base: 10500, personal: 52.5, company: 52.5 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-primary-600 text-white pb-20">
        <div className="container mx-auto px-4 pt-6">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">失业金申领预审</h1>
              <p className="text-sm text-white/70">企业端 · 失业待遇 · 资格预审</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {statsData.map((stat, index) => (
              <div
                key={stat.title}
                className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.trendType === 'up' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/20 text-white/80'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-sm text-white/70">{stat.unit}</span>
                </div>
                <p className="text-xs text-white/60 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-14 relative z-10">
        <Card className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-600">快捷操作</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-orange-50 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-600 group-hover:text-orange-600 transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card padding="none" className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="border-b border-neutral-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative ${
                  activeTab === 'list'
                    ? 'text-orange-600'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  预审列表
                </div>
                {activeTab === 'list' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-primary-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-64 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type="text"
                  placeholder="搜索姓名/身份证号/申请编号"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-orange-300 transition-colors"
                >
                  <Filter className="w-4 h-4 text-neutral-400" />
                  {statusOptions.find((o) => o.value === statusFilter)?.label}
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value as StatusFilter);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 transition-colors ${
                          statusFilter === option.value
                            ? 'text-orange-500 bg-orange-50'
                            : 'text-neutral-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-sm text-neutral-400 ml-auto">
                共 {filteredApplications.length} 条记录
              </span>
            </div>

            <div className="space-y-4">
              {filteredApplications.map((app, index) => (
                <Card
                  key={app.id}
                  hover
                  className="animate-fade-in-up overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-neutral-700">{app.applicantName}</h4>
                            <span className={`badge badge-${getUnemploymentStatusColor(app.status)}`}>
                              {getUnemploymentStatusText(app.status)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            身份证号：{formatIdCard(app.idCard)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-neutral-400 mb-1">申请编号</p>
                          <p className="text-sm text-neutral-600 font-medium">{app.applicationNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400 mb-1">申请日期</p>
                          <p className="text-sm text-neutral-600">{formatDate(app.applyDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400 mb-1">原工作岗位</p>
                          <p className="text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-neutral-300" />
                              技术工程师
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400 mb-1">离职原因</p>
                          <p className="text-sm text-neutral-600 line-clamp-1">{app.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-400" />
                          <span className="text-sm text-neutral-500">
                            拟发放：<span className="font-semibold text-orange-600">{app.benefitMonths}</span> 个月
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-neutral-500">
                            月标准：<span className="font-semibold text-emerald-600">¥{formatCurrency(app.monthlyBenefit, 0)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-neutral-500">
                            合计：<span className="font-semibold text-blue-600">¥{formatCurrency(app.monthlyBenefit * app.benefitMonths, 0)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      {app.status === 'pending_review' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Check className="w-4 h-4" />}
                            onClick={() => handleViewDetail(app)}
                          >
                            预审通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => handleViewDetail(app)}
                          >
                            预审拒绝
                          </Button>
                        </>
                      )}
                      {app.status === 'reviewing' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<UserCheck className="w-4 h-4" />}
                          onClick={() => handleViewDetail(app)}
                        >
                          继续审核
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => handleViewDetail(app)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="py-16 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">暂无符合条件的申请记录</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-orange-500 to-primary-500 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">失业金申领预审详情</h3>
                    <p className="text-sm text-white/70">申请编号：{selectedApplication.applicationNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  申请人基本信息
                </h4>
                <Card padding="sm">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">姓名</p>
                      <p className="text-sm text-neutral-600 font-medium">{selectedApplication.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">身份证号</p>
                      <p className="text-sm text-neutral-600">{formatIdCard(selectedApplication.idCard)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">申请日期</p>
                      <p className="text-sm text-neutral-600">{formatDate(selectedApplication.applyDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">原工作单位</p>
                      <p className="text-sm text-neutral-600">{selectedApplication.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">最后工作日</p>
                      <p className="text-sm text-neutral-600">{formatDate(selectedApplication.lastWorkDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">离职原因</p>
                      <p className="text-sm text-neutral-600">{selectedApplication.reason}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  参保缴费记录（失业保险）
                </h4>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">缴费月份</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">缴费基数</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">个人缴费</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">单位缴费</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {insuranceRecords.map((record) => (
                          <tr key={record.month} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-neutral-600">{record.month}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600">¥{formatCurrency(record.base, 0)}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600">¥{formatCurrency(record.personal, 2)}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600">¥{formatCurrency(record.company, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  材料清单
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {materialList.map((material, index) => (
                    <Card
                      key={material.name}
                      padding="sm"
                      hover
                      className="text-center"
                    >
                      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        material.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <material.icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-neutral-600 font-medium">{material.name}</p>
                      <p className={`text-xs mt-1 ${
                        material.status === 'approved' ? 'text-emerald-500' : 'text-orange-500'
                      }`}>
                        {material.status === 'approved' ? '已上传' : '待上传'}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  待遇核算
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                    <p className="text-xs text-orange-500 mb-1">拟发放月数</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedApplication.benefitMonths}<span className="text-sm font-normal">个月</span></p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                    <p className="text-xs text-emerald-500 mb-1">月发放标准</p>
                    <p className="text-2xl font-bold text-emerald-600">¥{formatCurrency(selectedApplication.monthlyBenefit, 0)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-xs text-blue-500 mb-1">预计总金额</p>
                    <p className="text-2xl font-bold text-blue-600">¥{formatCurrency(selectedApplication.monthlyBenefit * selectedApplication.benefitMonths, 0)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-orange-500" />
                  预审意见
                </h4>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="请输入预审意见..."
                  className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleReject}
              >
                预审拒绝
              </Button>
              <Button
                variant="primary"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleApprove}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                预审通过
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnemploymentReview;
