import { useState } from 'react';
import {
  Shield, Video, Briefcase, Building2, Users,
  CheckCircle, XCircle, Clock, AlertTriangle,
  Eye, MapPin, BarChart3,
  ChevronRight, Search, Sparkles,
  FileText, Map, Activity,
  ThumbsUp, ThumbsDown, AlertOctagon,
  Image as ImageIcon, ListTodo, Flag,
  TrendingUp, ArrowRight, Filter,
  History, UserCheck, X, Info
} from 'lucide-react';
import {
  reviewItemsDetail, activityData, heatmapData,
  reviewRecords, verificationTasks, verificationRecords,
  complaints, dailyActivities, funnelData,
  companies, jobs
} from '../data/mockData';
import type {
  ReviewItemDetail, AIIssueDetail, ReviewRecord,
  HeatmapData
} from '../types';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('review');
  const [reviewType, setReviewType] = useState<'all' | 'video' | 'job' | 'company'>('all');
  const [reviewStatus, setReviewStatus] = useState<'all' | 'pending' | 'ai_reviewed' | 'approved' | 'rejected'>('all');
  const [reviewQueueFilter, setReviewQueueFilter] = useState<'all' | 'low_score' | 'risk_keyword' | 'reported'>('all');
  const [reviewSubTab, setReviewSubTab] = useState<'list' | 'records'>('list');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ReviewItemDetail | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewItem, setPreviewItem] = useState<ReviewItemDetail | null>(null);
  const [detailItem, setDetailItem] = useState<ReviewItemDetail | null>(null);
  const [verificationSubTab, setVerificationSubTab] = useState<'tasks' | 'records' | 'complaints'>('tasks');
  const [searchKeyword, setSearchKeyword] = useState('');

  const tabs = [
    { id: 'review', label: '内容审核', icon: Shield },
    { id: 'verification', label: '真实性核验', icon: CheckCircle },
    { id: 'activity', label: '活跃度监测', icon: Activity },
    { id: 'statistics', label: '数据统计', icon: BarChart3 },
  ];

  const typeOptions = [
    { id: 'all', label: '全部' },
    { id: 'video', label: '视频' },
    { id: 'job', label: '岗位' },
    { id: 'company', label: '企业' },
  ];

  const statusOptions = [
    { id: 'all', label: '全部状态' },
    { id: 'pending', label: '待审核' },
    { id: 'ai_reviewed', label: 'AI已审' },
    { id: 'approved', label: '已通过' },
    { id: 'rejected', label: '已拒绝' },
  ];

  const queueFilterOptions = [
    { id: 'all', label: '全部待审' },
    { id: 'low_score', label: 'AI评分<70分' },
    { id: 'risk_keyword', label: '含违规风险词' },
    { id: 'reported', label: '被举报内容' },
  ];

  const filteredReviewItems = reviewItemsDetail.filter(item => {
    const matchType = reviewType === 'all' || item.type === reviewType;
    const matchStatus = reviewStatus === 'all' || item.status === reviewStatus;
    const matchKeyword = !searchKeyword || 
      item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.submitter.toLowerCase().includes(searchKeyword.toLowerCase());
    let matchQueue = true;
    if (reviewQueueFilter === 'low_score') {
      matchQueue = item.aiScore !== undefined && item.aiScore < 70;
    } else if (reviewQueueFilter === 'risk_keyword') {
      matchQueue = (item.aiIssueDetails || []).some(i => i.category === 'keyword');
    } else if (reviewQueueFilter === 'reported') {
      matchQueue = (item.reportedCount || 0) > 0;
    }
    return matchType && matchStatus && matchKeyword && matchQueue;
  });

  const todayPending = reviewItemsDetail.filter(i => i.status === 'pending' || i.status === 'ai_reviewed').length;
  const aiApprovedCount = reviewItemsDetail.filter(i => i.status === 'ai_reviewed' && (i.aiScore || 0) >= 70).length;
  const manualApprovedCount = reviewRecords.filter(r => r.action === 'approve').length;
  const rejectedCount = reviewItemsDetail.filter(i => i.status === 'rejected').length;

  const stats = [
    { label: '今日待审', value: todayPending, icon: Clock, color: 'bg-yellow-500' },
    { label: 'AI初筛通过', value: aiApprovedCount, icon: Sparkles, color: 'bg-blue-500' },
    { label: '人工复审通过', value: manualApprovedCount, icon: CheckCircle, color: 'bg-green-500' },
    { label: '驳回数量', value: rejectedCount, icon: XCircle, color: 'bg-red-500' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      ai_reviewed: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: '待审核',
      ai_reviewed: 'AI已审',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'job': return Briefcase;
      case 'company': return Building2;
      default: return FileText;
    }
  };

  const getIssueCategoryIcon = (category: AIIssueDetail['category']) => {
    switch (category) {
      case 'keyword': return AlertOctagon;
      case 'quality': return ImageIcon;
      case 'copyright': return Flag;
      default: return AlertTriangle;
    }
  };

  const getIssueCategoryLabel = (category: AIIssueDetail['category']) => {
    switch (category) {
      case 'keyword': return '违规关键词';
      case 'quality': return '画面质量';
      case 'copyright': return '版权检测';
      default: return '其他问题';
    }
  };

  const getSeverityStyle = (severity: AIIssueDetail['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getSeverityLabel = (severity: AIIssueDetail['severity']) => {
    switch (severity) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
    }
  };

  const getReviewRecordActionLabel = (action: ReviewRecord['action']) => {
    switch (action) {
      case 'approve': return '审核通过';
      case 'reject': return '审核驳回';
      case 'request_material': return '要求补充材料';
    }
  };

  const getReviewRecordActionStyle = (action: ReviewRecord['action']) => {
    switch (action) {
      case 'approve': return 'bg-green-100 text-green-700';
      case 'reject': return 'bg-red-100 text-red-700';
      case 'request_material': return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleReject = () => {
    if (rejectModalItem && rejectReason.trim()) {
      setRejectModalItem(null);
      setRejectReason('');
    }
  };

  const handleApprove = (item: ReviewItemDetail) => {
    console.log('Approve:', item.id);
  };

  const regionNames = ['静安区', '浦东新区', '徐汇区', '长宁区', '黄浦区', '普陀区'];
  const heatmapDisplay: (HeatmapData & { region: string })[] = heatmapData.slice(0, 6).map((d, i) => ({
    ...d,
    region: regionNames[i] || `区域${i + 1}`
  }));

  const maxActivity = Math.max(...dailyActivities.map(d => d.activeUsers));

  const funnelColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-purple-500 to-purple-600'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-20">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">管理后台</h3>
                  <p className="text-xs text-gray-500">内容安全与运营</p>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === 'review' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">内容审核</h1>
                  <p className="text-gray-500">视频内容审核工作流 · AI初筛 + 人工复审</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(stat => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-2 border-b border-gray-100 -mx-4 -mt-4 px-4">
                    <button
                      onClick={() => setReviewSubTab('list')}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        reviewSubTab === 'list'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ListTodo className="w-4 h-4" />
                      审核列表
                    </button>
                    <button
                      onClick={() => setReviewSubTab('records')}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        reviewSubTab === 'records'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      审核记录
                    </button>
                  </div>
                </div>

                {reviewSubTab === 'list' && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {typeOptions.map(option => (
                          <button
                            key={option.id}
                            onClick={() => setReviewType(option.id as typeof reviewType)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              reviewType === option.id
                                ? 'bg-primary-100 text-primary-600'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={reviewStatus}
                          onChange={e => setReviewStatus(e.target.value as typeof reviewStatus)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                          {statusOptions.map(option => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <select
                            value={reviewQueueFilter}
                            onChange={e => setReviewQueueFilter(e.target.value as typeof reviewQueueFilter)}
                            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none cursor-pointer"
                          >
                            {queueFilterOptions.map(option => (
                              <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="搜索..."
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredReviewItems.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                          <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>暂无符合条件的审核项</p>
                        </div>
                      ) : (
                        filteredReviewItems.map(item => {
                          const TypeIcon = getTypeIcon(item.type);
                          const isSelected = selectedItem === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`border rounded-xl overflow-hidden transition-all ${
                                isSelected ? 'border-primary-300 bg-primary-50/30' : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div
                                className="p-4 cursor-pointer"
                                onClick={() => setSelectedItem(isSelected ? null : item.id)}
                              >
                                <div className="flex items-center gap-4">
                                  {item.thumbnail ? (
                                    <img
                                      src={item.thumbnail}
                                      alt=""
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <TypeIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
                                      {getStatusBadge(item.status)}
                                      {(item.reportedCount || 0) > 0 && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
                                          <Flag className="w-3 h-3" />
                                          被举报{item.reportedCount}次
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {item.submitter} · {item.submitTime}
                                    </p>
                                  </div>
                                  {item.aiScore !== undefined && (
                                    <div className="text-center">
                                      <p className={`text-lg font-bold ${
                                        item.aiScore >= 80 ? 'text-green-600' :
                                        item.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {item.aiScore}分
                                      </p>
                                      <p className="text-xs text-gray-400">AI评分</p>
                                    </div>
                                  )}
                                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                                    isSelected ? 'rotate-90' : ''
                                  }`} />
                                </div>
                              </div>

                              {isSelected && (
                                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                                  {item.aiIssueDetails && item.aiIssueDetails.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                        AI 问题检测详细列表
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {item.aiIssueDetails.map((issue, i) => {
                                          const IssueIcon = getIssueCategoryIcon(issue.category);
                                          return (
                                            <div key={i} className={`p-3 rounded-lg border ${getSeverityStyle(issue.severity)}`}>
                                              <div className="flex items-start gap-2">
                                                <IssueIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-xs font-semibold">
                                                      {getIssueCategoryLabel(issue.category)}
                                                    </span>
                                                    <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                                      {getSeverityLabel(issue.severity)}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs opacity-90">{issue.description}</p>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {item.aiScore !== undefined && (
                                    <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                                      <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4" />
                                        AI 初审报告摘要
                                      </p>
                                      <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                                            item.aiScore >= 80 ? 'bg-green-100 text-green-700' :
                                            item.aiScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                            {item.aiScore}
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-blue-800">
                                            {item.aiScore >= 80 ? 'AI 检测内容质量较高，建议快速通过' :
                                             item.aiScore >= 60 ? 'AI 检测存在部分疑点，建议人工复核' :
                                             'AI 检测存在明显风险问题，请重点审核'}
                                          </p>
                                          <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${
                                                item.aiScore >= 80 ? 'bg-green-500' :
                                                item.aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${item.aiScore}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {item.notes && (
                                    <div className="mb-4 p-3 bg-red-50 rounded-lg">
                                      <p className="text-sm text-red-700">
                                        <span className="font-medium">驳回原因：</span>{item.notes}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {(item.status === 'pending' || item.status === 'ai_reviewed') && (
                                      <>
                                        <button
                                          onClick={() => handleApprove(item)}
                                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                        >
                                          <ThumbsUp className="w-4 h-4" />
                                          通过
                                        </button>
                                        <button
                                          onClick={() => { setRejectModalItem(item); setRejectReason(''); }}
                                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                        >
                                          <ThumbsDown className="w-4 h-4" />
                                          驳回
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => setDetailItem(item)}
                                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                      <Info className="w-4 h-4" />
                                      查看详情
                                    </button>
                                    <button
                                      onClick={() => setPreviewItem(item)}
                                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      预览
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {reviewSubTab === 'records' && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary-500" />
                      最近 20 条审核操作记录
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">审核员</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">时间</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">审核对象</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviewRecords.map(record => {
                            const TypeIcon = getTypeIcon(record.targetType);
                            return (
                              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {record.reviewerAvatar ? (
                                      <img src={record.reviewerAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <UserCheck className="w-4 h-4 text-gray-500" />
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-800">{record.reviewer}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-500">{record.time}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getReviewRecordActionStyle(record.action)}`}>
                                    {getReviewRecordActionLabel(record.action)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <TypeIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-800">{record.targetTitle}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                                  {record.reason || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">AI 智能审核</h3>
                      <p className="text-white/80 text-sm">自动识别违规内容，审核效率提升 80%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">98.5%</p>
                      <p className="text-xs text-white/70">准确率</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">3秒</p>
                      <p className="text-xs text-white/70">平均处理</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">24/7</p>
                      <p className="text-xs text-white/70">全天候</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">真实性核验</h1>
                  <p className="text-gray-500">工商信息比对 + 办公地址街景验证</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-2 border-b border-gray-100 -mx-4 -mt-4 px-4">
                    <button
                      onClick={() => setVerificationSubTab('tasks')}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        verificationSubTab === 'tasks'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ListTodo className="w-4 h-4" />
                      核验任务
                    </button>
                    <button
                      onClick={() => setVerificationSubTab('records')}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        verificationSubTab === 'records'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      核验记录
                    </button>
                    <button
                      onClick={() => setVerificationSubTab('complaints')}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        verificationSubTab === 'complaints'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      投诉举报
                      {complaints.filter(c => c.status === 'pending').length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {complaints.filter(c => c.status === 'pending').length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {verificationSubTab === 'tasks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {verificationTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={task.companyLogo}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div>
                              <h3 className="font-medium text-gray-800">{task.companyName}</h3>
                              <p className="text-sm text-gray-500">
                                {task.type === 'enterprise' ? '企业认证' : '岗位认证'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            task.status === 'approved' ? 'bg-green-100 text-green-700' :
                            task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            task.status === 'need_material' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {task.status === 'approved' ? '已通过' :
                             task.status === 'rejected' ? '已驳回' :
                             task.status === 'need_material' ? '需补充材料' : '待核验'}
                          </span>
                        </div>

                        {(task.reportedCount || 0) > 0 && (
                          <div className="mb-3 p-2 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              被用户举报 {task.reportedCount} 次
                            </p>
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-500">AI 核验评分</span>
                            <span className={`text-sm font-bold ${
                              task.aiScore >= 80 ? 'text-green-600' :
                              task.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {task.aiScore}分
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                task.aiScore >= 80 ? 'bg-green-500' :
                                task.aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${task.aiScore}%` }}
                            />
                          </div>
                        </div>

                        {task.issues.length > 0 && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs font-medium text-yellow-700 mb-2">待确认项</p>
                            {task.issues.map((issue, i) => (
                              <p key={i} className="text-xs text-yellow-600 flex items-center gap-1 mb-1 last:mb-0">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {issue}
                              </p>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mb-4">提交时间：{task.submitTime}</p>

                        {task.status === 'pending' && (
                          <div className="grid grid-cols-3 gap-2">
                            <button className="flex items-center justify-center gap-1 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                              <CheckCircle className="w-4 h-4" />
                              通过
                            </button>
                            <button className="flex items-center justify-center gap-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                              <XCircle className="w-4 h-4" />
                              驳回
                            </button>
                            <button className="flex items-center justify-center gap-1 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                              <FileText className="w-4 h-4" />
                              补材料
                            </button>
                          </div>
                        )}

                        {task.status !== 'pending' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button className="flex items-center justify-center gap-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                              <FileText className="w-4 h-4" />
                              工商信息
                            </button>
                            <button className="flex items-center justify-center gap-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                              <Map className="w-4 h-4" />
                              街景验证
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {verificationSubTab === 'records' && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary-500" />
                      核验历史记录
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">企业</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">类型</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">核验员</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">核验日期</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verificationRecords.map(record => (
                            <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <img src={record.companyLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                  <span className="text-sm font-medium text-gray-800">{record.companyName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {record.type === 'enterprise' ? '企业认证' : '岗位认证'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {record.verifierAvatar ? (
                                    <img src={record.verifierAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                      <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-800">{record.verifier}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500">{record.verifyDate}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  record.result === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.result === 'approved' ? '核验通过' : '核验未通过'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {verificationSubTab === 'complaints' && (
                  <div className="space-y-4">
                    {complaints.map(complaint => (
                      <div key={complaint.id} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <img
                              src={complaint.targetLogo}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-medium text-gray-800">{complaint.targetTitle}</h3>
                                <span className="text-xs text-gray-400">
                                  {complaint.targetType === 'company' ? '企业' : '岗位'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  complaint.status === 'handled' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {complaint.status === 'pending' ? '待处理' :
                                   complaint.status === 'handled' ? '已处理' : '已驳回'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">被举报方：{complaint.targetName}</p>
                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">举报理由：</span>{complaint.reason}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                举报人：{complaint.reporter} · {complaint.reportTime}
                              </p>
                            </div>
                          </div>
                          {complaint.status === 'pending' && (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                标记已处理
                              </button>
                              <button className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                驳回举报
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {verificationSubTab === 'tasks' && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">核验流程</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { step: 1, title: '资料提交', icon: FileText, desc: '企业提交认证材料' },
                        { step: 2, title: '工商比对', icon: Building2, desc: '自动比对工商信息' },
                        { step: 3, title: '地址核验', icon: MapPin, desc: '街景地图验证地址' },
                        { step: 4, title: '人工复核', icon: Shield, desc: '运营人员最终确认' },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.step} className="text-center">
                            <div className="w-12 h-12 mx-auto bg-primary-50 rounded-xl flex items-center justify-center mb-3">
                              <Icon className="w-6 h-6 text-primary-500" />
                            </div>
                            <p className="font-medium text-gray-800">
                              <span className="text-primary-500 mr-1">{item.step}.</span>
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">求职活跃度监测</h1>
                  <p className="text-gray-500">各区域求职热度实时监控</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '今日发布岗位', value: '289', change: '+12%', icon: Briefcase, color: 'text-blue-500' },
                    { label: '今日投递数', value: '1,567', change: '+8%', icon: Users, color: 'text-green-500' },
                    { label: '视频播放量', value: '45.2k', change: '+23%', icon: Video, color: 'text-purple-500' },
                    { label: '活跃用户', value: '3,420', change: '+5%', icon: Activity, color: 'text-orange-500' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <Icon className={`w-6 h-6 ${item.color}`} />
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {item.change}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary-500" />
                      区域求职热度热力图
                    </h3>
                    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 aspect-video">
                      <svg viewBox="0 0 400 300" className="w-full h-full">
                        <defs>
                          <radialGradient id="heat-high">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="heat-medium">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="heat-low">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <rect x="0" y="0" width="400" height="300" fill="#f8fafc" rx="8" />
                        {heatmapDisplay.map((point, i) => {
                          const x = 50 + (i % 3) * 140 + (i === 1 || i === 4 ? 30 : 0);
                          const y = 50 + Math.floor(i / 3) * 120;
                          const radius = 30 + point.intensity * 40;
                          const gradientId = point.intensity >= 0.8 ? 'heat-high' : point.intensity >= 0.6 ? 'heat-medium' : 'heat-low';
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r={radius} fill={`url(#${gradientId})`} />
                              <circle cx={x} cy={y} r={6} fill="#fff" stroke="#64748b" strokeWidth="1" />
                              <text x={x} y={y - radius - 8} textAnchor="middle" className="text-xs fill-gray-600 font-medium" fontSize="10">
                                {point.region}
                              </text>
                              <text x={x} y={y + 3} textAnchor="middle" className="text-xs fill-gray-700 font-bold" fontSize="9">
                                {Math.round(point.intensity * 100)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 opacity-70"></div>
                          <span className="text-xs text-gray-500">低热度</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></div>
                          <span className="text-xs text-gray-500">中热度</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 opacity-90"></div>
                          <span className="text-xs text-gray-500">高热度</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {heatmapDisplay.slice(0, 6).map((point, i) => (
                        <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700">{point.region}</p>
                          <p className="text-xs text-gray-500">岗位{point.jobCount} · 求职{point.seekerCount}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-500" />
                      最近 7 天活跃用户数
                    </h3>
                    <div className="h-56 flex items-end justify-between gap-2 px-2">
                      {dailyActivities.map((day, i) => {
                        const heightPercent = (day.activeUsers / maxActivity) * 100;
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end flex-1">
                              <span className="text-xs font-semibold text-gray-600 mb-1">
                                {day.activeUsers >= 1000 ? (day.activeUsers / 1000).toFixed(1) + 'k' : day.activeUsers}
                              </span>
                              <div
                                className={`w-full max-w-10 rounded-t-lg bg-gradient-to-t ${
                                  i === dailyActivities.length - 1
                                    ? 'from-primary-600 to-primary-400'
                                    : 'from-primary-400 to-primary-300'
                                } transition-all`}
                                style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                              />
                            </div>
                            <span className={`text-xs ${
                              i === dailyActivities.length - 1 ? 'text-primary-600 font-semibold' : 'text-gray-500'
                            }`}>
                              {day.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    投递转化漏斗
                  </h3>
                  <div className="space-y-3">
                    {funnelData.map((item, i) => {
                      const widthPercent = (item.count / funnelData[0].count) * 100;
                      const prevCount = i > 0 ? funnelData[i - 1].count : item.count;
                      const conversionRate = i > 0 ? ((item.count / prevCount) * 100).toFixed(1) : '100';
                      return (
                        <div key={item.stage} className="flex items-center gap-4">
                          <div className="w-16 text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400">{conversionRate}%</p>
                          </div>
                          <div className="flex-1 relative">
                            <div className={`h-12 rounded-lg bg-gradient-to-r ${funnelColors[i]} flex items-center px-4 transition-all`}
                              style={{ width: `${widthPercent}%`, minWidth: '120px' }}
                            >
                              <span className="text-white font-bold">
                                {item.count >= 1000 ? (item.count / 1000).toFixed(1) + 'k' : item.count}
                              </span>
                            </div>
                          </div>
                          {i < funnelData.length - 1 && (
                            <div className="w-8 flex-shrink-0 flex justify-center">
                              <ArrowRight className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-1">整体转化率</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {((funnelData[2].count / funnelData[1].count) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-1">点击→投递</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {((funnelData[3].count / funnelData[2].count) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-1">投递→面试</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">各区域活跃度排行</h3>
                  <div className="space-y-4">
                    {activityData
                      .sort((a, b) => b.activeUsers - a.activeUsers)
                      .map((region, index) => (
                        <div key={region.region} className="flex items-center gap-4">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-gray-300 text-white' :
                            index === 2 ? 'bg-orange-300 text-white' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="w-20 text-sm font-medium text-gray-800">{region.region}</div>
                          <div className="flex-1">
                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all"
                                style={{ width: `${(region.activeUsers / 2560) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <p className="text-sm font-semibold text-gray-800">{region.activeUsers}</p>
                            <p className="text-xs text-gray-500">活跃用户</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">岗位分布</h3>
                    <div className="space-y-3">
                      {activityData.map(region => (
                        <div key={region.region} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{region.region}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(region.jobPosts / 67) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-800 w-12 text-right">
                              {region.jobPosts}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">视频播放量</h3>
                    <div className="space-y-3">
                      {activityData.map(region => (
                        <div key={region.region} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{region.region}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${(region.videoViews / 18900) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-800 w-16 text-right">
                              {region.videoViews >= 1000
                                ? (region.videoViews / 1000).toFixed(1) + 'k'
                                : region.videoViews
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">数据统计</h1>
                  <p className="text-gray-500">平台整体运营数据</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '企业总数', value: companies.length, icon: Building2, color: 'bg-blue-500' },
                    { label: '岗位总数', value: jobs.length, icon: Briefcase, color: 'bg-green-500' },
                    { label: '今日待审核', value: reviewItemsDetail.filter(r => r.status === 'pending' || r.status === 'ai_reviewed').length, icon: Clock, color: 'bg-yellow-500' },
                    { label: '待处理投诉', value: complaints.filter(c => c.status === 'pending').length, icon: Flag, color: 'bg-red-500' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {rejectModalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">驳回审核</h3>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">驳回对象：{rejectModalItem.title}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              驳回原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">内容预览</h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {previewItem.thumbnail && (
                <img
                  src={previewItem.thumbnail}
                  alt=""
                  className="w-full h-64 object-cover rounded-xl"
                />
              )}
              <div>
                <h4 className="font-semibold text-gray-800 text-lg mb-2">{previewItem.title}</h4>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {getStatusBadge(previewItem.status)}
                  <span className="text-sm text-gray-500">提交者：{previewItem.submitter}</span>
                  <span className="text-sm text-gray-500">提交时间：{previewItem.submitTime}</span>
                </div>
                {previewItem.content && (
                  <p className="text-gray-600">{previewItem.content}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">审核详情</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {detailItem.thumbnail ? (
                  <img src={detailItem.thumbnail} alt="" className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                    {(() => { const Icon = getTypeIcon(detailItem.type); return <Icon className="w-10 h-10 text-gray-400" />; })()}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-lg mb-1">{detailItem.title}</h4>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {getStatusBadge(detailItem.status)}
                    {detailItem.aiScore !== undefined && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        detailItem.aiScore >= 80 ? 'bg-green-100 text-green-700' :
                        detailItem.aiScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        AI评分 {detailItem.aiScore}分
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">提交者：{detailItem.submitter}</p>
                  <p className="text-sm text-gray-500">提交时间：{detailItem.submitTime}</p>
                </div>
              </div>
              {detailItem.content && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">内容描述</p>
                  <p className="text-gray-600 text-sm">{detailItem.content}</p>
                </div>
              )}
              {detailItem.aiIssueDetails && detailItem.aiIssueDetails.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">AI 检测问题详情</p>
                  <div className="space-y-2">
                    {detailItem.aiIssueDetails.map((issue, i) => {
                      const IssueIcon = getIssueCategoryIcon(issue.category);
                      return (
                        <div key={i} className={`p-3 rounded-lg border ${getSeverityStyle(issue.severity)}`}>
                          <div className="flex items-start gap-2">
                            <IssueIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold">{getIssueCategoryLabel(issue.category)}</span>
                                <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">{getSeverityLabel(issue.severity)}</span>
                              </div>
                              <p className="text-xs opacity-90">{issue.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {detailItem.notes && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-700 mb-1">驳回原因</p>
                  <p className="text-sm text-red-600">{detailItem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
