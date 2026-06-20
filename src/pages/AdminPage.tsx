import { useState } from 'react';
import {
  Shield, Video, Briefcase, Building2, Users,
  CheckCircle, XCircle, Clock, AlertTriangle,
  Eye, MapPin, BarChart3,
  ChevronRight, Search, Sparkles,
  FileText, Map, Activity,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { reviewItems, activityData } from '../data/mockData';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('review');
  const [reviewType, setReviewType] = useState<'all' | 'video' | 'job' | 'company'>('all');
  const [reviewStatus, setReviewStatus] = useState<'all' | 'pending' | 'ai_reviewed' | 'approved' | 'rejected'>('pending');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

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

  const filteredItems = reviewItems.filter(item => {
    const matchType = reviewType === 'all' || item.type === reviewType;
    const matchStatus = reviewStatus === 'all' || item.status === reviewStatus;
    return matchType && matchStatus;
  });

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

  const stats = [
    { label: '今日待审', value: '23', icon: Clock, color: 'bg-yellow-500' },
    { label: 'AI初审', value: '156', icon: Sparkles, color: 'bg-blue-500' },
    { label: '已通过', value: '456', icon: CheckCircle, color: 'bg-green-500' },
    { label: '已拒绝', value: '34', icon: XCircle, color: 'bg-red-500' },
  ];

  const verificationTasks = [
    { id: 1, company: '书香书店', type: '企业认证', status: '待核验', issues: ['工商信息待核验', '办公地址街景不清晰'], aiScore: 65 },
    { id: 2, company: '星辰咖啡', type: '岗位认证', status: '已通过', issues: [], aiScore: 92 },
    { id: 3, company: '悦动健身', type: '企业认证', status: '已通过', issues: [], aiScore: 88 },
    { id: 4, company: '花时间花艺', type: '岗位认证', status: '核验中', issues: ['视频内容需人工复核'], aiScore: 75 },
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

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="搜索..."
                          className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredItems.map(item => {
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
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
                                  {getStatusBadge(item.status)}
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
                              {item.aiIssues && item.aiIssues.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                    AI 检测到的问题
                                  </p>
                                  <div className="space-y-1">
                                    {item.aiIssues.map((issue, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                        {issue}
                                      </div>
                                    ))}
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

                              {(item.status === 'pending' || item.status === 'ai_reviewed') && (
                                <div className="flex items-center gap-3">
                                  <button className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                                    <ThumbsUp className="w-4 h-4" />
                                    通过
                                  </button>
                                  <button className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                                    <ThumbsDown className="w-4 h-4" />
                                    驳回
                                  </button>
                                  <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                    <Eye className="w-4 h-4" />
                                    预览
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {verificationTasks.map(task => (
                    <div key={task.id} className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://images.unsplash.com/photo-${task.id}?w=100&h=100&fit=crop`}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop';
                            }}
                          />
                          <div>
                            <h3 className="font-medium text-gray-800">{task.company}</h3>
                            <p className="text-sm text-gray-500">{task.type}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          task.status === '已通过' ? 'bg-green-100 text-green-700' :
                          task.status === '核验中' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>

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
                            <p key={i} className="text-xs text-yellow-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {issue}
                            </p>
                          ))}
                        </div>
                      )}

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
                    </div>
                  ))}
                </div>

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
                    { label: '企业总数', value: '1,234', icon: Building2, color: 'bg-blue-500' },
                    { label: '岗位总数', value: '5,678', icon: Briefcase, color: 'bg-green-500' },
                    { label: '视频总数', value: '8,901', icon: Video, color: 'bg-purple-500' },
                    { label: '用户总数', value: '45.6k', icon: Users, color: 'bg-orange-500' },
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
    </div>
  );
};

export default AdminPage;
