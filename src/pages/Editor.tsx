import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  User, 
  Eye,
  ThumbsUp,
  Share2,
  MessageSquare,
  FileText,
  Image,
  Video,
  Mic,
  FileType,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  Send,
  ChevronRight,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Tag,
  Lock,
  History,
  Layers,
  BarChart3,
  Settings,
  Globe,
  Smartphone,
  Tv,
  BookOpen,
  Award,
  Activity,
  Database,
  Copyright,
  Folder,
  Link,
  Zap,
  RefreshCw,
  TrendingUp,
  Users,
  PieChart as PieChartIcon,
  Newspaper,
  Radio
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { newsList, distributionChannels, currentUser, departmentStats } from '../data/mockData';
import type { NewsItem } from '../types';

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600', icon: FileText },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: '已退回', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const typeMap: Record<string, { label: string; icon: any }> = {
  text: { label: '文字', icon: FileText },
  image: { label: '图片', icon: Image },
  video: { label: '视频', icon: Video },
  audio: { label: '音频', icon: Mic },
  mixed: { label: '融媒', icon: FileType }
};

export default function Editor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'review' | 'distribution' | 'stats' | 'edit' | 'create' | 'profile'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'distribution' || tab === 'stats' || tab === 'review' || tab === 'list') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const setActiveTabWithUrl = (tab: 'list' | 'review' | 'distribution' | 'stats') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredNews = newsList.filter(news => {
    const matchStatus = filterStatus === 'all' || news.status === filterStatus;
    const matchSearch = news.title.includes(searchText) || news.author.includes(searchText);
    return matchStatus && matchSearch;
  });

  const openEditor = (news: NewsItem) => {
    setSelectedNews(news);
    setActiveTab('edit');
  };

  const openReview = (news: NewsItem) => {
    setSelectedNews(news);
    setActiveTab('review');
  };

  const createNews = () => {
    const emptyNews: NewsItem = {
      id: 'new',
      title: '新建稿件',
      content: '',
      type: 'mixed',
      status: 'draft',
      author: currentUser.name,
      department: currentUser.department,
      tags: [],
      cover: '',
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      updatedAt: new Date().toLocaleDateString('zh-CN'),
      copyright: '原创',
      channels: [],
      reviewHistory: []
    };
    setSelectedNews(emptyNews);
    setActiveTab('create');
  };

  const openProfile = () => {
    setActiveTab('profile');
  };

  const goBack = () => {
    setActiveTab('list');
    setSelectedNews(null);
  };

  if (activeTab === 'profile') {
    return <ProfilePage onBack={goBack} />;
  }

  if ((activeTab === 'edit' || activeTab === 'create') && selectedNews) {
    return <EditorDetail news={selectedNews} onBack={goBack} isCreate={activeTab === 'create'} />;
  }

  if (activeTab === 'review' && selectedNews) {
    return <ReviewDetail news={selectedNews} onBack={goBack} />;
  }

  if (activeTab === 'distribution') {
    return <DistributionManager onBack={() => setActiveTabWithUrl('list')} />;
  }

  if (activeTab === 'stats') {
    return <StatsManager onBack={() => setActiveTabWithUrl('list')} />;
  }

  const mainTabs = [
    { id: 'list', label: '稿件列表', icon: FileText },
    { id: 'review', label: '审核管理', icon: CheckCircle },
    { id: 'distribution', label: '分发管理', icon: Share2 },
    { id: 'stats', label: '统计分析', icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">编辑后台</h2>
          <span className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full">
            {mainTabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={createNews} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" />
            新建稿件
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" onClick={openProfile}>
            <img src={currentUser.avatar} alt="" className="w-7 h-7 rounded-full" />
            <div className="text-sm">
              <div className="font-medium text-slate-800">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.roleName} · {currentUser.department}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100">
          <div className="flex">
            {mainTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabWithUrl(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'list' && (
            <NewsListPage
              searchText={searchText}
              setSearchText={setSearchText}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filteredNews={filteredNews}
              onOpenEditor={(news) => { setSelectedNews(news); setActiveTab('edit'); }}
              onOpenReview={(news) => { setSelectedNews(news); setActiveTab('review'); }}
            />
          )}

          {activeTab === 'review' && (
            <ReviewManager
              onOpenReview={(news) => { setSelectedNews(news); setActiveTab('review'); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NewsListPage({ searchText, setSearchText, filterStatus, setFilterStatus, filteredNews, onOpenEditor, onOpenReview }: {
  searchText: string;
  setSearchText: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filteredNews: NewsItem[];
  onOpenEditor: (news: NewsItem) => void;
  onOpenReview: (news: NewsItem) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索稿件标题、作者..."
              className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'pending', 'reviewing', 'approved', 'published', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status === 'all' ? '全部' : statusMap[status]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">稿件标题</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">类型</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">状态/校次</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">审核人</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">作者/部门</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">分发去向</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">传播数据</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">更新时间</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredNews.map(news => {
              const statusInfo = statusMap[news.status];
              const typeInfo = typeMap[news.type];
              const StatusIcon = statusInfo.icon;
              const TypeIcon = typeInfo.icon;
              const reviewStep = news.reviewHistory && news.reviewHistory.length > 0 
                ? ['初审', '一校', '复审', '二校', '终审', '三校'][Math.min(news.reviewHistory.length * 2 - 1, 5)]
                : '待送审';
              const lastReviewer = news.reviewHistory && news.reviewHistory.length > 0
                ? news.reviewHistory[news.reviewHistory.length - 1].reviewer
                : '-';
              const lastComment = news.reviewHistory && news.reviewHistory.length > 0
                ? news.reviewHistory[news.reviewHistory.length - 1].comment
                : '';
              const displayChannels = (news.channels || []).slice(0, 3);
              const extraChannels = Math.max(0, (news.channels || []).length - 3);

              return (
                <tr key={news.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {news.cover && (
                        <img src={news.cover} alt="" className="w-12 h-10 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 line-clamp-1 cursor-pointer hover:text-primary-600" onClick={() => onOpenEditor(news)}>
                          {news.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Tag className="w-3 h-3" />
                          {news.tags.slice(0, 3).join(' · ')}
                        </div>
                        {news.status === 'rejected' && lastComment && (
                          <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            退回意见：{lastComment}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                      <TypeIcon className="w-4 h-4" />
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        当前：{reviewStep}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs text-primary-600 font-medium">
                        {lastReviewer.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-700">{lastReviewer}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{news.author}</span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6 mt-0.5">{news.department}</div>
                  </td>
                  <td className="px-5 py-4">
                    {displayChannels.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {displayChannels.map(c => {
                          const ch = distributionChannels.find(d => d.id === c);
                          return (
                            <span key={c} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              {ch?.name || c}
                            </span>
                          );
                        })}
                        {extraChannels > 0 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                            +{extraChannels}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">未分发</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1" title="阅读">
                        <Eye className="w-3 h-3" />{(news.views || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1" title="点赞">
                        <ThumbsUp className="w-3 h-3" />{(news.likes || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1" title="转发">
                        <Share2 className="w-3 h-3" />{(news.shares || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{news.updatedAt}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onOpenEditor(news)} className="p-1.5 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors" title="编辑">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onOpenReview(news)} className="p-1.5 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded transition-colors" title="审核">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="更多">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewManager({ onOpenReview }: { onOpenReview: (news: NewsItem) => void }) {
  const [filterLevel, setFilterLevel] = useState('all');
  
  const reviewQueue = newsList.filter(n => n.status === 'pending' || n.status === 'reviewing');
  
  const levels = [
    { id: 'all', label: '全部待审', count: reviewQueue.length },
    { id: 'first', label: '初审待办', count: 4 },
    { id: 'second', label: '复审待办', count: 3 },
    { id: 'final', label: '终审待办', count: 2 },
    { id: 'proof1', label: '一校待办', count: 5 },
    { id: 'proof2', label: '二校待办', count: 3 },
    { id: 'proof3', label: '三校待办', count: 1 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => setFilterLevel(level.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterLevel === level.id
                ? 'bg-primary-50 border-primary-200 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-2xl font-bold text-slate-800">{level.count}</div>
            <div className="text-xs text-slate-500 mt-1">{level.label}</div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reviewQueue.map((news, index) => {
          const step = index % 6;
          const stepName = ['初审', '一校', '复审', '二校', '终审', '三校'][step];
          const assignedReviewer = ['王主任', '李校对', '张副总', '赵校对', '刘总编', '陈校对'][step];
          const deadlineHours = 2 + (index % 6);
          
          return (
            <div key={news.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded text-xs font-medium">{stepName}</span>
                    {news.tags.slice(0, 2).map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">{t}</span>
                    ))}
                    <span className="text-xs text-slate-400">· {typeMap[news.type]?.label}</span>
                  </div>
                  <h4 className="font-medium text-slate-800 mb-1 cursor-pointer hover:text-primary-600" onClick={() => onOpenReview(news)}>
                    {news.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> 作者：{news.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> 部门：{news.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 时限：{deadlineHours}小时内
                    </span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <AlertCircle className="w-3 h-3" /> 当前处理人：{assignedReviewer}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => onOpenReview(news)}
                    className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    审核
                  </button>
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionManager({ onBack }: { onBack: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'channels' | 'records'>('channels');

  const channels = [
    { id: 'site', name: '昌平新闻网', icon: Globe, status: 'active', todayPosts: 78, enabled: true, category: '网站' },
    { id: 'wechat', name: '微信公众号', icon: MessageSquare, status: 'active', todayPosts: 65, enabled: true, category: '社交' },
    { id: 'weibo', name: '官方微博', icon: Activity, status: 'active', todayPosts: 52, enabled: true, category: '社交' },
    { id: 'douyin', name: '抖音号', icon: Tv, status: 'active', todayPosts: 38, enabled: true, category: '视频' },
    { id: 'app', name: '北京昌平APP', icon: Smartphone, status: 'active', todayPosts: 45, enabled: true, category: 'APP' },
    { id: 'video', name: '微信视频号', icon: Video, status: 'active', todayPosts: 28, enabled: true, category: '视频' },
    { id: 'paper', name: '昌平报', icon: Newspaper, status: 'active', todayPosts: 12, enabled: true, category: '报纸' },
    { id: 'tv', name: '昌平电视台', icon: Tv, status: 'active', todayPosts: 8, enabled: true, category: '电视' },
    { id: 'radio', name: '昌平广播', icon: Radio, status: 'inactive', todayPosts: 0, enabled: false, category: '广播' },
  ];

  const rules = [
    { id: 1, name: '时政要闻一键全分发', desc: '含「时政」「要闻」标签的稿件自动分发所有渠道', enabled: true, channels: 9, hitCount: 156 },
    { id: 2, name: '民生新闻优先新媒体', desc: '民生类稿件优先发微信、APP、抖音', enabled: true, channels: 5, hitCount: 289 },
    { id: 3, name: '视频稿件分发视频平台', desc: '视频类型稿件自动分发抖音、视频号', enabled: true, channels: 3, hitCount: 124 },
    { id: 4, name: '深度报道仅发重点渠道', desc: '深度专题类只发网站、报纸、公众号', enabled: false, channels: 3, hitCount: 45 },
  ];

  const records = [
    { id: 1, title: '昌平区2026年经济工作会议召开', time: '2026-06-19 09:30', channels: ['site', 'wechat', 'weibo', 'app', 'douyin'], status: 'success', operator: '张编辑' },
    { id: 2, title: '回天地区五年行动成果', time: '2026-06-19 08:15', channels: ['site', 'wechat', 'paper'], status: 'success', operator: '李编辑' },
    { id: 3, title: '未来科学城创新纪实', time: '2026-06-18 17:45', channels: ['site', 'wechat', 'weibo', 'app', 'douyin', 'video'], status: 'success', operator: '张编辑' },
    { id: 4, title: '夏季安全出行提示', time: '2026-06-18 15:20', channels: ['wechat', 'douyin', 'video', 'app'], status: 'partial', operator: '王编辑', failed: ['radio'] },
    { id: 5, title: '昌平文旅宣传片', time: '2026-06-18 10:00', channels: ['douyin', 'video', 'tv'], status: 'success', operator: '李编辑' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">分发管理</h2>
          <p className="text-sm text-slate-500">配置分发规则、渠道绑定与分发记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '已接入渠道', value: 9, total: 10, color: 'text-primary-500', icon: Globe },
          { label: '今日已分发', value: 256, unit: '篇', color: 'text-green-500', icon: Send },
          { label: '分发成功率', value: '98.5', unit: '%', color: 'text-blue-500', icon: CheckCircle },
          { label: '活跃分发规则', value: 3, total: 4, color: 'text-orange-500', icon: Zap },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {item.value}{item.unit && <span className="text-sm text-slate-400 ml-0.5">{item.unit}</span>}
                {item.total && <span className="text-xs font-normal text-slate-400 ml-1">/ {item.total}</span>}
              </div>
              <div className="text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-100 px-5">
          <div className="flex">
            {[
              { id: 'channels', label: '渠道配置', icon: Globe },
              { id: 'rules', label: '分发规则', icon: Settings },
              { id: 'records', label: '分发记录', icon: History },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeSubTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeSubTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map(ch => {
                const Icon = ch.icon;
                return (
                  <div key={ch.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${ch.enabled ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{ch.name}</h4>
                          <p className="text-xs text-slate-400">{ch.category}</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${ch.enabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-slate-500">今日发稿</span>
                      <span className="font-medium text-slate-800">{ch.todayPosts}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                        配置
                      </button>
                      <button className={`flex-1 py-2 text-sm rounded-lg transition-colors ${ch.enabled ? 'border border-red-200 text-red-500 hover:bg-red-50' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>
                        {ch.enabled ? '停用' : '启用'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab === 'rules' && (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-800">{rule.name}</h4>
                        {rule.enabled ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">已启用</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">已停用</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{rule.desc}</p>
                      <div className="flex items-center gap-5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> 覆盖 {rule.channels} 个渠道
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> 累计命中 {rule.hitCount} 次
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        {rule.enabled ? <Lock className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-colors text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                新建分发规则
              </button>
            </div>
          )}

          {activeSubTab === 'records' && (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">稿件标题</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">分发时间</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">分发渠道</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">状态</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">操作人</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800 text-sm">{r.title}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{r.time}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {r.channels.map(c => {
                            const ch = channels.find(x => x.id === c);
                            return (
                              <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                {ch?.name || c}
                              </span>
                            );
                          })}
                          {r.failed?.map(c => {
                            const ch = channels.find(x => x.id === c);
                            return (
                              <span key={c} className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-xs">
                                ✗ {ch?.name || c}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {r.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                            <CheckCircle className="w-3 h-3" /> 全部成功
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                            <AlertCircle className="w-3 h-3" /> 部分失败
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{r.operator}</td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-sm text-primary-500 hover:text-primary-600">详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsManager({ onBack }: { onBack: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'review' | 'spread'>('department');

  const deptDailyData = [
    { date: '6/13', 新闻中心: 28, 专题部: 12, 经济部: 8, 社会部: 15, 新媒体: 22 },
    { date: '6/14', 新闻中心: 32, 专题部: 15, 经济部: 10, 社会部: 18, 新媒体: 25 },
    { date: '6/15', 新闻中心: 35, 专题部: 18, 经济部: 12, 社会部: 20, 新媒体: 28 },
    { date: '6/16', 新闻中心: 30, 专题部: 14, 经济部: 9, 社会部: 16, 新媒体: 26 },
    { date: '6/17', 新闻中心: 38, 专题部: 20, 经济部: 14, 社会部: 22, 新媒体: 30 },
    { date: '6/18', 新闻中心: 42, 专题部: 22, 经济部: 16, 社会部: 25, 新媒体: 35 },
    { date: '6/19', 新闻中心: 20, 专题部: 10, 经济部: 7, 社会部: 12, 新媒体: 18 },
  ];

  const reviewEfficiency = [
    { name: '初审', avg: 1.2, completed: 156, pending: 4 },
    { name: '一校', avg: 0.8, completed: 142, pending: 5 },
    { name: '复审', avg: 2.5, completed: 128, pending: 3 },
    { name: '二校', avg: 1.0, completed: 121, pending: 3 },
    { name: '终审', avg: 3.8, completed: 98, pending: 2 },
    { name: '三校', avg: 0.6, completed: 95, pending: 1 },
  ];

  const deptColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'];

  const departmentDetailData = [
    { id: 'd1', name: '新闻中心', count: 86, published: 67, reviewing: 13, rejected: 6, avgViews: 7240 },
    { id: 'd2', name: '社会新闻部', count: 62, published: 48, reviewing: 9, rejected: 5, avgViews: 5820 },
    { id: 'd3', name: '科技新闻部', count: 48, published: 38, reviewing: 7, rejected: 3, avgViews: 4210 },
    { id: 'd4', name: '文旅新闻部', count: 42, published: 33, reviewing: 6, rejected: 3, avgViews: 6150 },
    { id: 'd5', name: '教育新闻部', count: 28, published: 22, reviewing: 4, rejected: 2, avgViews: 3680 },
    { id: 'd6', name: '卫生新闻部', count: 18, published: 14, reviewing: 3, rejected: 1, avgViews: 2940 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">统计分析</h2>
          <p className="text-sm text-slate-500">部门发稿、审核效率、传播效果等多维度数据</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日总发稿', value: 67, trend: '+12%', icon: FileText, color: 'text-primary-500' },
          { label: '平均审核时长', value: '1.7', unit: '小时', trend: '-18%', icon: ClockIcon, color: 'text-green-500' },
          { label: '总阅读量', value: '2.8M', trend: '+25%', icon: Eye, color: 'text-blue-500' },
          { label: '传播力指数', value: 87.5, trend: '+3.2', icon: TrendingUp, color: 'text-orange-500' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-xs text-green-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {item.trend}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {item.value}{item.unit && <span className="text-sm text-slate-400 ml-0.5">{item.unit}</span>}
              </div>
              <div className="text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-100 px-5">
          <div className="flex">
            {[
              { id: 'department', label: '部门发稿统计', icon: Users },
              { id: 'review', label: '审核效率分析', icon: CheckCircle },
              { id: 'spread', label: '传播效果统计', icon: Activity },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeSubTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeSubTab === 'department' && (
            <div className="space-y-6">
              <div className="bg-white">
                <h3 className="font-semibold text-slate-800 mb-4">近7日各部门发稿趋势</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptDailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="新闻中心" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="专题部" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="经济部" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="社会部" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="新媒体" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4">部门累计发稿明细</h3>
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">部门</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">本月发稿</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">占比</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">已发布</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">审核中</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">已退回</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">平均阅读</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentDetailData.map((dept, i) => (
                        <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: deptColors[i % deptColors.length] }}>
                                {dept.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800">{dept.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">{dept.count}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 max-w-[180px]">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(dept.count / 284) * 100}%`, backgroundColor: deptColors[i % deptColors.length] }}></div>
                              </div>
                              <span className="text-xs text-slate-500 w-10">{((dept.count / 284) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-green-600 font-medium">{dept.published}</td>
                          <td className="px-5 py-4 text-sm text-yellow-600 font-medium">{dept.reviewing}</td>
                          <td className="px-5 py-4 text-sm text-red-500 font-medium">{dept.rejected}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{dept.avgViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">各节点平均审核时长（小时）</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reviewEfficiency}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={3} name="平均时长" dot={{ fill: '#8b5cf6', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">审核节点完成情况</h3>
                <div className="space-y-4">
                  {reviewEfficiency.map((r, i) => (
                    <div key={r.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 font-medium">{r.name}</span>
                        <span className="text-slate-500">
                          <span className="text-green-600 font-semibold">{r.completed}</span> 已完成
                          <span className="mx-1 text-slate-300">/</span>
                          <span className="text-yellow-600">{r.pending}</span> 待处理
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                          style={{ width: `${(r.completed / (r.completed + r.pending)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'spread' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '总阅读', value: '2,856,120', trend: '+15.2%', color: 'text-blue-500' },
                  { label: '总点赞', value: '156,280', trend: '+12.5%', color: 'text-red-500' },
                  { label: '总转发', value: '89,650', trend: '+8.3%', color: 'text-green-500' },
                  { label: '总评论', value: '45,320', trend: '+18.6%', color: 'text-purple-500' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className="text-xs text-green-500">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-72">
                <h3 className="font-semibold text-slate-800 mb-4">各渠道传播力对比</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: '网站', 阅读: 890000, 点赞: 45000, 转发: 28000 },
                      { name: '公众号', 阅读: 620000, 点赞: 52000, 转发: 35000 },
                      { name: '微博', 阅读: 480000, 点赞: 32000, 转发: 18000 },
                      { name: '抖音', 阅读: 520000, 点赞: 38000, 转发: 12000 },
                      { name: 'APP', 阅读: 346000, 点赞: 18000, 转发: 9500 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="阅读" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="点赞" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="转发" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorDetail({ news, onBack, isCreate = false }: { news: NewsItem; onBack: () => void; isCreate?: boolean }) {
  const [title, setTitle] = useState(isCreate ? '' : news.title);
  const [content, setContent] = useState(news.content || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(news.channels || []);
  const [showTypeSelector, setShowTypeSelector] = useState(isCreate);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  if (showTypeSelector) {
    const sourceTopics = [
      { id: 1, title: '2026年昌平经济工作会议专题', status: '已通过', priority: '高', time: '2026-06-18' },
      { id: 2, title: '回天地区五年行动成果调研', status: '已通过', priority: '中', time: '2026-06-17' },
      { id: 3, title: '未来科学城创新企业走访', status: '审核中', priority: '中', time: '2026-06-16' },
    ];
    const sourceMaterials = [
      { id: 1, name: '经济工作会议现场照片.zip', type: '图片/28张', size: '256MB', time: '2小时前', source: '李记者' },
      { id: 2, name: '领导讲话录音.mp3', type: '音频/45分钟', size: '98MB', time: '3小时前', source: '李记者' },
      { id: 3, name: '会议现场视频.mp4', type: '视频/15分钟', size: '1.2GB', time: '4小时前', source: '王记者' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">新建稿件</h2>
            <p className="text-sm text-slate-500">选择稿件类型或从选题、素材快速开始</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">选择稿件类型</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(typeMap).map(([key, value]) => {
              const TypeIcon = value.icon;
              return (
                <button
                  key={key}
                  onClick={() => setShowTypeSelector(false)}
                  className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white group-hover:bg-primary-100 flex items-center justify-center transition-colors border border-slate-100">
                    <TypeIcon className="w-6 h-6 text-slate-600 group-hover:text-primary-600" />
                  </div>
                  <p className="text-center font-medium text-slate-800">{value.label}稿件</p>
                  <p className="text-center text-xs text-slate-400 mt-1">
                    {key === 'text' && '纯文字新闻报道'}
                    {key === 'image' && '图集+文字说明'}
                    {key === 'video' && '视频+文字解说'}
                    {key === 'audio' && '音频+文字稿'}
                    {key === 'mixed' && '文图视音频混排'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              关联选题来源
              <span className="text-xs font-normal text-slate-400 ml-2">（点击选题快速创建稿件）</span>
            </h3>
            <div className="space-y-3">
              {sourceTopics.map(topic => (
                <div key={topic.id} className="p-4 bg-slate-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition-all border border-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 text-sm">{topic.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">申报时间：{topic.time}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${topic.priority === '高' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {topic.priority}优先
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${topic.status === '已通过' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {topic.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 text-sm text-primary-500 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1">
              <Folder className="w-4 h-4" />
              从选题库中选择更多
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-500" />
              素材回传记录
              <span className="text-xs font-normal text-slate-400 ml-2">（点击素材直接使用）</span>
            </h3>
            <div className="space-y-3">
              {sourceMaterials.map(mat => (
                <div key={mat.id} className="p-4 bg-slate-50 rounded-lg hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                      {mat.type.startsWith('图片') ? <Image className="w-5 h-5 text-green-500" /> :
                       mat.type.startsWith('音频') ? <Mic className="w-5 h-5 text-purple-500" /> :
                       <Video className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 text-sm truncate">{mat.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {mat.type} · {mat.size} · {mat.source} 回传于 {mat.time}
                      </p>
                    </div>
                    <div className="text-primary-500 text-xs flex-shrink-0 flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      导入
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 text-sm text-primary-500 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1">
              <Database className="w-4 h-4" />
              从素材库选择更多
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">编辑稿件</h2>
            <p className="text-sm text-slate-500">正在编辑：{news.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            历史版本
          </button>
          <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            保存草稿
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2">
            <Send className="w-4 h-4" />
            送审
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-slate-800 border-0 border-b border-slate-200 pb-4 focus:outline-none focus:border-primary-500"
              placeholder="请输入标题"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50">
              {[
                { icon: 'B', label: '加粗', isString: true },
                { icon: 'I', label: '斜体', isString: true },
                { icon: 'U', label: '下划线', isString: true },
                { type: 'divider' },
                { icon: Image, label: '插入图片', isString: false },
                { icon: Video, label: '插入视频', isString: false },
                { icon: Mic, label: '插入音频', isString: false },
                { icon: Upload, label: '上传文件', isString: false },
                { type: 'divider' },
                { icon: 'H1', label: '标题1', isString: true },
                { icon: 'H2', label: '标题2', isString: true },
                { type: 'divider' },
                { icon: '•', label: '列表', isString: true },
                { icon: '1.', label: '有序列表', isString: true },
                { type: 'divider' },
                { icon: '"', label: '引用', isString: true },
                { icon: '<>', label: '代码', isString: true },
              ].map((item: any, index) => (
                item.type === 'divider' 
                  ? <div key={index} className="w-px h-5 bg-slate-300 mx-1"></div>
                  : <button key={index} className="p-2 rounded hover:bg-slate-200 transition-colors text-slate-600 text-sm">
                      {item.isString ? <span className="font-bold">{item.icon}</span> : <item.icon className="w-4 h-4" />}
                    </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入正文内容，支持文图视音频混排..."
              className="w-full h-96 p-5 resize-none focus:outline-none text-slate-700"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-primary-500" />
              媒体素材
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative group">
                  <img src={`https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop&${i}`} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button className="p-2 bg-white rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <div className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <Plus className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-500">添加素材</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-orange-500" />
              选题与素材溯源
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-orange-600 font-medium">关联选题</span>
                  <button className="text-xs text-primary-500 hover:text-primary-600">更换</button>
                </div>
                <p className="text-sm font-medium text-slate-800">2026年昌平经济工作会议专题</p>
                <p className="text-xs text-slate-500 mt-0.5">高优先级 · 已通过审核</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-600 font-medium">使用素材 (3)</span>
                  <button className="text-xs text-primary-500 hover:text-primary-600">管理</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-slate-700 truncate">经济工作会议现场照片.zip</span>
                    <span className="text-xs text-slate-400 ml-auto">28张</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-700 truncate">领导讲话录音.mp3</span>
                    <span className="text-xs text-slate-400 ml-auto">45分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-700 truncate">会议现场视频.mp4</span>
                    <span className="text-xs text-slate-400 ml-auto">15分钟</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">稿件属性</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500 block mb-1">作者</label>
                <input type="text" defaultValue={news.author} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-sm text-slate-500 block mb-1">栏目</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>要闻</option>
                  <option>社会</option>
                  <option>经济</option>
                  <option>科技</option>
                  <option>文旅</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-500 block mb-1">关键词标签</label>
                <div className="flex flex-wrap gap-2">
                  {news.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                      {tag}
                      <XCircle className="w-3 h-3 cursor-pointer" />
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-slate-300 rounded text-xs text-slate-400 cursor-pointer hover:border-primary-500 hover:text-primary-500">
                    <Plus className="w-3 h-3" /> 添加
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Copyright className="w-5 h-5 text-cyan-500" />
              版权与授权
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500 block mb-1.5">版权归属</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>原创 · 本台所有</option>
                  <option>授权转载 · 北京日报</option>
                  <option>公共素材 · 需标注来源</option>
                  <option>二次创作 · 经原作者授权</option>
                  <option>受限使用 · 仅内部参考</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-500 block mb-1.5">授权范围</label>
                <div className="space-y-2">
                  {[
                    { label: '可在全平台分发', checked: true },
                    { label: '可用于二次加工改编', checked: true },
                    { label: '可授权第三方使用', checked: false },
                    { label: '需署名作者与来源', checked: true },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 text-primary-500 rounded" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">授权编号</span>
                  <span className="text-slate-700 font-mono">CP-2026-0619-0042</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-500">生效时间</span>
                  <span className="text-slate-700">2026-06-19 ~ 2027-06-18</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary-500" />
              发布渠道绑定
            </h3>
            <div className="space-y-1">
              {distributionChannels.slice(0, 8).map(channel => (
                <label key={channel.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    defaultChecked={['site', 'wechat', 'app'].includes(channel.id)}
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-slate-700">{channel.name}</span>
                    {channel.category && (
                      <span className="text-xs text-slate-400">({channel.category})</span>
                    )}
                  </div>
                  <span className="text-xs text-green-500">✓ 已连通</span>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>已选渠道</span>
                <span className="text-primary-600 font-medium">3 / 9</span>
              </div>
              <button className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-primary-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                保存并发布到选中渠道
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">协作人员</h3>
            <div className="flex -space-x-2 mb-3">
              {['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'].map((avatar, i) => (
                <img key={i} src={avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white" />
              ))}
            </div>
            <button className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> 添加协作者
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewDetail({ news, onBack }: { news: NewsItem; onBack: () => void }) {
  const [reviewComment, setReviewComment] = useState('');
  const reviewHistory = news.reviewHistory || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">稿件审核</h2>
            <p className="text-sm text-slate-500">{news.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[news.status].color}`}>
            {statusMap[news.status].label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">{news.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{news.author}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{news.createdAt}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{news.views?.toLocaleString()}次浏览</span>
            </div>
            <div className="prose max-w-none text-slate-700">
              <p>昌平区2026年经济工作会议于今日上午在区政府大礼堂隆重召开。区委书记出席会议并发表重要讲话，区长主持会议。</p>
              <h3 className="text-lg font-semibold mt-4 mb-2">一、上半年经济运行情况</h3>
              <p>今年以来，全区上下坚持以习近平新时代中国特色社会主义思想为指导，全面贯彻落实党的二十大精神，按照市委、市政府决策部署，坚持稳中求进工作总基调，完整、准确、全面贯彻新发展理念，加快构建新发展格局，着力推动高质量发展。</p>
              <p>上半年，全区地区生产总值同比增长6.8%，增速位居全市前列。一般公共预算收入完成年度预算的56.2%，同比增长8.5%。固定资产投资同比增长12.3%，社会消费品零售总额同比增长9.6%。</p>
              <h3 className="text-lg font-semibold mt-4 mb-2">二、重点工作任务</h3>
              <p>会议明确了下半年八个方面重点工作任务：</p>
              <ol className="list-decimal pl-6 mt-2">
                <li>全力以赴稳增长，确保完成全年目标任务</li>
                <li>加快推进科技创新，建设高水平创新型城区</li>
                <li>深化改革开放，激发市场主体活力</li>
                <li>推动城乡融合发展，提升城市功能品质</li>
                <li>加强生态环境保护，推动绿色低碳发展</li>
                <li>保障和改善民生，增进人民群众福祉</li>
                <li>统筹发展和安全，维护社会和谐稳定</li>
                <li>加强政府自身建设，提升治理能力水平</li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              三审三校流程
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {['初审', '一校', '复审', '二校', '终审', '三校'].map((step, index) => {
                const isCompleted = index < (reviewHistory.length * 2);
                const isCurrent = index === reviewHistory.length * 2 - 1 || index === reviewHistory.length * 2;
                return (
                  <div key={step} className="text-center">
                    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-primary-500 text-white animate-pulse' : 
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className={`mt-2 text-xs ${isCompleted ? 'text-green-600' : isCurrent ? 'text-primary-600' : 'text-slate-400'}`}>
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">审核记录</h3>
            <div className="space-y-4">
              {reviewHistory.map((record, index) => (
                <div key={record.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:pb-0 last:border-0">
                  <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    record.status === 'approved' ? 'bg-green-500' : 
                    record.status === 'rejected' ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`}>
                    {record.status === 'approved' ? <CheckCircle className="w-3 h-3 text-white" /> : 
                     record.status === 'rejected' ? <XCircle className="w-3 h-3 text-white" /> :
                     <ClockIcon className="w-3 h-3 text-white" />}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{record.role} - {record.reviewer}</span>
                      <span className="text-xs text-slate-400">{record.createdAt}</span>
                    </div>
                    <p className="text-sm text-slate-600">{record.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">您的审核意见</h3>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请输入审核意见..."
              className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" />
                退回修改
              </button>
              <button className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                通过审核
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">稿件信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">类型</span>
                <span className="text-slate-700">{typeMap[news.type].label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">作者</span>
                <span className="text-slate-700">{news.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">部门</span>
                <span className="text-slate-700">{news.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">版权</span>
                <span className="text-slate-700">{news.copyright}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span className="text-slate-700">{news.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">更新时间</span>
                <span className="text-slate-700">{news.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'review' | 'distribution' | 'work'>('info');

  const reviewRecords = [
    { id: 1, title: '昌平区2026年经济工作会议召开', type: '初审', result: '通过', time: '2026-06-18 14:30', comment: '内容准确，结构清晰，同意通过初审' },
    { id: 2, title: '回天地区三年行动计划成果显著', type: '复审', result: '通过', time: '2026-06-17 10:15', comment: '数据详实，建议补充更多案例' },
    { id: 3, title: '中关村昌平园创新企业走访纪实', type: '初审', result: '退回', time: '2026-06-16 16:45', comment: '标题需要修改，内容需补充采访对象背景' },
    { id: 4, title: '明十三陵文化遗产保护新进展', type: '终审', result: '通过', time: '2026-06-15 09:20', comment: '符合发布要求，同意发布' },
    { id: 5, title: '昌平区夏季旅游攻略发布', type: '一校', result: '通过', time: '2026-06-14 11:30', comment: '校对完成，修改错别字3处' },
  ];

  const distributionStats = [
    { name: '昌平报', count: 156, type: '报纸' },
    { name: '昌平电视台', count: 89, type: '电视' },
    { name: '昌平广播', count: 124, type: '广播' },
    { name: '昌平新闻网', count: 312, type: '网站' },
    { name: '北京昌平APP', count: 278, type: 'APP' },
    { name: '微信公众号', count: 425, type: '微信' },
    { name: '官方微博', count: 356, type: '微博' },
    { name: '抖音号', count: 189, type: '抖音' },
    { name: '快手号', count: 145, type: '快手' },
  ];

  const workStats = [
    { label: '本月发稿', value: 42, unit: '篇' },
    { label: '审核通过', value: 38, unit: '篇' },
    { label: '平均审核时长', value: 2.5, unit: '小时' },
    { label: '分发渠道', value: 9, unit: '个' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">个人中心</h2>
          <p className="text-sm text-slate-500">管理您的账户和工作设置</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              <img 
                src={currentUser.avatar} 
                alt="" 
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary-100"
              />
              <h3 className="font-semibold text-lg text-slate-800">{currentUser.name}</h3>
              <p className="text-sm text-slate-500">{currentUser.roleName}</p>
              <p className="text-xs text-slate-400 mt-1">{currentUser.department}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              {[
                { key: 'info', label: '基本信息', icon: User },
                { key: 'work', label: '工作统计', icon: FileText },
                { key: 'review', label: '审核留痕', icon: CheckCircle },
                { key: 'distribution', label: '分发配置', icon: Share2 },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === item.key 
                        ? 'bg-primary-50 text-primary-600 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'info' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-6">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-500 block mb-2">姓名</label>
                  <input type="text" defaultValue={currentUser.name} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-2">工号</label>
                  <input type="text" defaultValue="CP2024001" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" readOnly />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-2">部门</label>
                  <input type="text" defaultValue={currentUser.department} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" readOnly />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-2">职位</label>
                  <input type="text" defaultValue={currentUser.roleName} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" readOnly />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-2">手机号</label>
                  <input type="text" defaultValue="138****5678" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-2">邮箱</label>
                  <input type="email" defaultValue="zhangbianji@changping.gov.cn" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  取消
                </button>
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  保存修改
                </button>
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {workStats.map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="text-2xl font-bold text-slate-800">
                      {stat.value}<span className="text-sm font-normal text-slate-400 ml-1">{stat.unit}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">我的稿件</h3>
                <div className="space-y-3">
                  {newsList.slice(0, 5).map(news => (
                    <div key={news.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{news.title}</p>
                          <p className="text-xs text-slate-400">{news.createdAt}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[news.status].color}`}>
                        {statusMap[news.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-6">审核留痕记录</h3>
              <div className="space-y-4">
                {reviewRecords.map(record => (
                  <div key={record.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-800">{record.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">审核时间：{record.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          {record.type}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                          record.result === '通过' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {record.result}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">审核意见：</span>
                        {record.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">共 {reviewRecords.length} 条审核记录</span>
                  <button className="text-primary-600 hover:text-primary-700">查看全部 →</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-6">分发渠道配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {distributionStats.map(channel => (
                    <div key={channel.name} className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{channel.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{channel.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">已分发</span>
                        <span className="text-lg font-bold text-slate-800">{channel.count}<span className="text-xs font-normal text-slate-400">篇</span></span>
                      </div>
                      <div className="mt-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-xs text-slate-600">启用分发</span>
                          <div className={`w-10 h-5 rounded-full transition-colors relative ${
                            channel.count > 0 ? 'bg-primary-500' : 'bg-slate-300'
                          }`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                              channel.count > 0 ? 'right-0.5' : 'left-0.5'
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">分发规则设置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">自动同步至新媒体平台</p>
                      <p className="text-xs text-slate-500 mt-0.5">稿件通过终审后自动分发至微信、微博等平台</p>
                    </div>
                    <div className="w-10 h-5 bg-primary-500 rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">发布前人工确认</p>
                      <p className="text-xs text-slate-500 mt-0.5">自动分发前需要运营人员确认</p>
                    </div>
                    <div className="w-10 h-5 bg-slate-300 rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">定时发布</p>
                      <p className="text-xs text-slate-500 mt-0.5">支持设置定时发布时间</p>
                    </div>
                    <div className="w-10 h-5 bg-primary-500 rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
