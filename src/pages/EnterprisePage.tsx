import { useState } from 'react';
import {
  Video, Upload, Wand2, Type, BarChart3, Play,
  TrendingUp, Eye, Heart, MessageSquare,
  ChevronDown, Settings,
  Zap, Layout,
  Trash2, Edit3, Plus,
  Briefcase, Users, Clock, Star, Bookmark,
  BarChart2, Scissors, Film, MonitorUp, UserCheck,
  ArrowUpRight, X, Check, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { companies } from '../data/mockData';

const EnterprisePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('全部');

  const company = companies[0];
  const videos = company.videos;
  const jobs = company.jobs;

  const tabs = [
    { id: 'dashboard', label: '数据看板', icon: BarChart3 },
    { id: 'videos', label: '视频管理', icon: Video },
    { id: 'creator', label: '视频制作', icon: Wand2 },
    { id: 'jobs', label: '岗位管理', icon: Briefcase },
  ];

  const weeklyTrend = [
    { day: '6/14', views: 4200, clicks: 892, applications: 12 },
    { day: '6/15', views: 5800, clicks: 1230, applications: 18 },
    { day: '6/16', views: 6500, clicks: 1380, applications: 22 },
    { day: '6/17', views: 5200, clicks: 1100, applications: 15 },
    { day: '6/18', views: 7800, clicks: 1650, applications: 28 },
    { day: '6/19', views: 9200, clicks: 1950, applications: 35 },
    { day: '6/20', views: 8500, clicks: 1800, applications: 26 },
  ];

  const recruitmentMetrics = [
    { label: '曝光量', value: 58200, change: '+12.5%', icon: Eye, color: 'bg-blue-500' },
    { label: '点击量', value: 12340, change: '+8.3%', icon: TrendingUp, color: 'bg-purple-500' },
    { label: '投递数', value: 156, change: '+23.1%', icon: MessageSquare, color: 'bg-green-500' },
    { label: '面试邀约', value: 42, change: '+15.8%', icon: UserCheck, color: 'bg-orange-500' },
    { label: '转化率', value: '1.26%', change: '+0.3%', icon: Zap, color: 'bg-pink-500' },
  ];

  const toolCards = [
    {
      id: 'editor',
      title: '视频剪辑',
      description: '专业视频编辑工具',
      icon: Scissors,
      color: 'from-blue-500 to-indigo-500',
      features: [
        { name: '裁剪功能', desc: '自由裁剪视频片段，去除冗余内容' },
        { name: '视频拼接', desc: '多段视频无缝拼接，支持转场过渡' },
        { name: '转场效果', desc: '内置30+精美转场特效，一键应用' },
      ]
    },
    {
      id: 'subtitle',
      title: '字幕生成',
      description: 'AI智能语音转字幕',
      icon: Type,
      color: 'from-purple-500 to-pink-500',
      features: [
        { name: 'AI语音转字幕', desc: '支持普通话/方言，准确率达98%' },
        { name: '字幕样式编辑', desc: '字体、大小、颜色、位置自由定制' },
        { name: '多语言支持', desc: '自动翻译中英双语字幕' },
      ]
    },
    {
      id: 'template',
      title: '模板中心',
      description: '精选招聘视频模板',
      icon: Layout,
      color: 'from-green-500 to-teal-500',
      features: [
        { name: '招聘岗位模板', desc: '30+岗位介绍模板，快速套用' },
        { name: '团队介绍模板', desc: '20+团队文化展示模板' },
        { name: '办公环境模板', desc: '15+办公环境拍摄模板' },
      ]
    },
  ];

  const templates = [
    { id: 't1', name: '咖啡师的一天', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=450&fit=crop', duration: '60秒', category: '招聘岗位', tags: ['餐饮', '服务'] },
    { id: 't2', name: '店长工作日常', thumbnail: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=300&h=450&fit=crop', duration: '90秒', category: '招聘岗位', tags: ['管理', '运营'] },
    { id: 't3', name: '团队破冰活动', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=450&fit=crop', duration: '45秒', category: '团队介绍', tags: ['团建', '文化'] },
    { id: 't4', name: '我们的团队', thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=450&fit=crop', duration: '60秒', category: '团队介绍', tags: ['团队'] },
    { id: 't5', name: '门店环境展示', thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=450&fit=crop', duration: '45秒', category: '办公环境', tags: ['环境'] },
    { id: 't6', name: '办公空间一览', thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=450&fit=crop', duration: '60秒', category: '办公环境', tags: ['办公'] },
  ];

  const templateCategories = ['全部', '招聘岗位', '团队介绍', '办公环境'];
  const filteredTemplates = templateCategory === '全部'
    ? templates
    : templates.filter(t => t.category === templateCategory);

  const maxViews = Math.max(...weeklyTrend.map(d => d.views));

  const sortedVideosByViews = [...videos].sort((a, b) => b.views - a.views).slice(0, 5);
  const sortedVideosByCompletion = [...videos].sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { text: '审核通过', color: 'bg-green-100 text-green-600', icon: Check };
      case 'pending':
        return { text: '待审核', color: 'bg-yellow-100 text-yellow-600', icon: Clock };
      case 'rejected':
        return { text: '审核驳回', color: 'bg-red-100 text-red-600', icon: X };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-600', icon: AlertCircle };
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据看板</h1>
          <p className="text-gray-500">视频内容与招聘效果分析</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            <option>最近7天</option>
            <option>最近30天</option>
            <option>最近90天</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {recruitmentMetrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${metric.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {metric.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800">播放量趋势</h3>
            <p className="text-sm text-gray-500">最近7天播放量、点击量、投递数变化</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary-500 rounded-full" />
              播放量
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500 rounded-full" />
              点击量
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-accent-500 rounded-full" />
              投递数
            </span>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-3 px-2">
          {weeklyTrend.map(day => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-52">
                <div
                  className="w-5 bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                  style={{ height: `${(day.views / maxViews) * 100}%` }}
                  title={`播放量: ${day.views.toLocaleString()}`}
                />
                <div
                  className="w-5 bg-purple-500 rounded-t-lg transition-all hover:bg-purple-600"
                  style={{ height: `${(day.clicks / 2000) * 100}%` }}
                  title={`点击量: ${day.clicks.toLocaleString()}`}
                />
                <div
                  className="w-5 bg-accent-500 rounded-t-lg transition-all hover:bg-accent-600"
                  style={{ height: `${(day.applications / 40) * 100}%` }}
                  title={`投递数: ${day.applications}`}
                />
              </div>
              <span className="text-xs text-gray-500">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary-500" />
              视频播放量排行榜 TOP5
            </h3>
          </div>
          <div className="space-y-3">
            {sortedVideosByViews.map((video, index) => (
              <div key={video.id} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-300 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <img src={video.thumbnail} alt="" className="w-12 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">
                    {video.views.toLocaleString()} 次播放 · {video.completionRate}% 完播
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-600">{video.views.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">播放</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              视频完播率排行榜 TOP5
            </h3>
          </div>
          <div className="space-y-4">
            {sortedVideosByCompletion.map((video, index) => (
              <div key={video.id}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-300 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <img src={video.thumbnail} alt="" className="w-12 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                    <p className="text-xs text-gray-500">{video.views.toLocaleString()} 次播放</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">{video.completionRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full ml-10">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${video.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVideos = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">视频管理</h1>
          <p className="text-gray-500">管理您的所有招聘视频</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
          <Upload className="w-5 h-5" />
          上传视频
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map(video => {
          const status = getReviewStatusBadge(video.reviewStatus);
          const StatusIcon = status.icon;
          return (
            <div key={video.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-[9/16]">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <button className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  </button>
                </div>
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.text}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    video.isPublished ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {video.isPublished ? '已上架' : '未上架'}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 text-sm line-clamp-2 h-10">{video.title}</h3>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{(video.views / 10000).toFixed(1)}w</p>
                    <p className="text-[10px] text-gray-400">播放</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <BarChart2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{video.completionRate}%</p>
                    <p className="text-[10px] text-gray-400">完播</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{video.likes}</p>
                    <p className="text-[10px] text-gray-400">点赞</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Bookmark className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{video.favorites}</p>
                    <p className="text-[10px] text-gray-400">收藏</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{video.conversions}</p>
                    <p className="text-[10px] text-gray-400">投递转化</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  <button className="py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-0.5">
                    <Edit3 className="w-3 h-3" />
                    编辑
                  </button>
                  <button className="py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-0.5">
                    <BarChart2 className="w-3 h-3" />
                    数据
                  </button>
                  <button className={`py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-0.5 ${
                    video.isPublished
                      ? 'text-orange-600 border border-orange-200 hover:bg-orange-50'
                      : 'text-green-600 border border-green-200 hover:bg-green-50'
                  }`}>
                    <MonitorUp className="w-3 h-3" />
                    {video.isPublished ? '下架' : '上架'}
                  </button>
                  <button className="py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="aspect-[9/16] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer">
          <Plus className="w-10 h-10 mb-2" />
          <span className="text-sm">上传新视频</span>
        </div>
      </div>
    </div>
  );

  const renderCreator = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">视频制作工具包</h1>
        <p className="text-gray-500">轻松制作专业的招聘视频</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {toolCards.map(tool => {
          const Icon = tool.icon;
          const isExpanded = expandedTool === tool.id;
          return (
            <div key={tool.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedTool(isExpanded ? null : tool.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{tool.title}</h3>
                      <p className="text-sm text-gray-500">{tool.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 animate-slide-up">
                  <div className="space-y-3 mb-4">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{feature.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-3 bg-gradient-to-r ${tool.color} text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                    <Wand2 className="w-5 h-5" />
                    立即使用
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800">模板中心</h3>
            <p className="text-sm text-gray-500">精选招聘视频模板，一键生成</p>
          </div>
          <div className="flex items-center gap-2">
            {templateCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setTemplateCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  templateCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
            >
              <div className="relative aspect-[9/16]">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] rounded-full">
                  {template.category}
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] rounded-full">
                  {template.duration}
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-gray-800 text-sm truncate">{template.name}</h4>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {template.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full mt-2 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium">
                  使用模板
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">岗位管理</h1>
          <p className="text-gray-500">管理招聘岗位及关联视频</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
          <Plus className="w-5 h-5" />
          发布新岗位
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobs.map(job => {
          const linkedVideo = videos.find(v => v.id === job.videoId);
          return (
            <div key={job.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {linkedVideo ? (
                <div className="relative aspect-video">
                  <img src={linkedVideo.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full font-medium flex items-center gap-0.5">
                    <Film className="w-3 h-3" />
                    已关联视频
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                  <Film className="w-8 h-8 mb-1" />
                  <span className="text-xs">未关联视频</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{job.title}</h3>
                  {job.verified && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full font-medium">
                      已认证
                    </span>
                  )}
                </div>
                <p className="text-accent-600 font-bold text-lg">{job.salary}</p>
                <p className="text-sm text-gray-500 mt-1">{job.location} · {job.type}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <Eye className="w-4 h-4 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{job.views}</p>
                    <p className="text-[10px] text-gray-400">查看数</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-4 h-4 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{job.applications}</p>
                    <p className="text-[10px] text-gray-400">投递数</p>
                  </div>
                  <div className="text-center">
                    <UserCheck className="w-4 h-4 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{job.matchedSeekers}</p>
                    <p className="text-[10px] text-gray-400">匹配</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {job.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  <button className="py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-0.5">
                    <Edit3 className="w-3 h-3" />
                    编辑
                  </button>
                  <button className="py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-0.5">
                    <Users className="w-3 h-3" />
                    简历
                  </button>
                  <button className="py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-0.5">
                    <LinkIcon className="w-3 h-3" />
                    关联
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer p-8 min-h-[300px]">
          <Plus className="w-10 h-10 mb-2" />
          <span className="text-sm">发布新岗位</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-20">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <img
                  src={company.logo}
                  alt="企业logo"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{company.name}</h3>
                  <p className="text-xs text-gray-500">{company.industry} · {company.size}</p>
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

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  <Settings className="w-5 h-5" />
                  设置
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'videos' && renderVideos()}
            {activeTab === 'creator' && renderCreator()}
            {activeTab === 'jobs' && renderJobs()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePage;
