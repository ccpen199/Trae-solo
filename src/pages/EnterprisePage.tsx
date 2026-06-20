import { useState } from 'react';
import {
  Video, Upload, Wand2, Type, BarChart3, Play,
  TrendingUp, Eye, Heart, MessageSquare, Calendar,
  ChevronRight, Sparkles, Settings, FileText,
  Zap, Layout, Image, Music,
  Download, Share2, Trash2, Edit3, Plus
} from 'lucide-react';

const EnterprisePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const tabs = [
    { id: 'dashboard', label: '数据看板', icon: BarChart3 },
    { id: 'videos', label: '视频管理', icon: Video },
    { id: 'creator', label: '视频制作', icon: Wand2 },
    { id: 'subtitles', label: '字幕生成', icon: Type },
    { id: 'templates', label: '模板中心', icon: Layout },
  ];

  const stats = [
    { label: '总视频数', value: '12', change: '+3', icon: Video, color: 'bg-blue-500' },
    { label: '总播放量', value: '58,200', change: '+12%', icon: Eye, color: 'bg-green-500' },
    { label: '获赞总数', value: '12,340', change: '+8%', icon: Heart, color: 'bg-pink-500' },
    { label: '岗位投递', value: '156', change: '+23%', icon: MessageSquare, color: 'bg-orange-500' },
  ];

  const weeklyData = [
    { day: '周一', views: 4200, applications: 12 },
    { day: '周二', views: 5800, applications: 18 },
    { day: '周三', views: 6500, applications: 22 },
    { day: '周四', views: 5200, applications: 15 },
    { day: '周五', views: 7800, applications: 28 },
    { day: '周六', views: 9200, applications: 35 },
    { day: '周日', views: 8500, applications: 26 },
  ];

  const videoList = [
    { id: 1, title: '咖啡师的一天：从拉花到服务', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop', views: 12580, likes: 3420, status: '已发布', date: '2024-01-15' },
    { id: 2, title: '我们的团队文化', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=300&fit=crop', views: 8920, likes: 2150, status: '已发布', date: '2024-01-12' },
    { id: 3, title: '门店环境实拍', thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=300&fit=crop', views: 15600, likes: 4200, status: '已发布', date: '2024-01-10' },
    { id: 4, title: '店长工作日常', thumbnail: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=200&h=300&fit=crop', views: 0, likes: 0, status: '审核中', date: '2024-01-16' },
  ];

  const templates = [
    { id: 't1', name: '岗位介绍', thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=300&fit=crop', duration: '30-60秒', category: '岗位' },
    { id: 't2', name: '团队展示', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=300&fit=crop', duration: '45-90秒', category: '团队' },
    { id: 't3', name: '办公环境', thumbnail: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=300&fit=crop', duration: '30-60秒', category: '环境' },
    { id: 't4', name: '企业宣传', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=300&fit=crop', duration: '60-120秒', category: '品牌' },
    { id: 't5', name: '员工故事', thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=300&fit=crop', duration: '60-90秒', category: '人物' },
    { id: 't6', name: '产品介绍', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=300&fit=crop', duration: '30-45秒', category: '产品' },
  ];

  const subtitleTasks = [
    { id: 1, videoTitle: '咖啡师的一天', status: '已完成', duration: '2分05秒', words: 386 },
    { id: 2, videoTitle: '我们的团队文化', status: '已完成', duration: '1分29秒', words: 245 },
    { id: 3, videoTitle: '店长工作日常', status: '处理中', duration: '1分45秒', progress: 65 },
  ];

  const maxViews = Math.max(...weeklyData.map(d => d.views));

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-20">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop"
                  alt="企业logo"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">星辰咖啡</h3>
                  <p className="text-xs text-gray-500">企业版 · 高级版</p>
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
            {activeTab === 'dashboard' && (
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(stat => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {stat.change}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-800">播放量趋势</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-primary-500 rounded-full" />
                        播放量
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-accent-500 rounded-full" />
                        投递数
                      </span>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {weeklyData.map(day => (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1 h-48">
                          <div
                            className="w-4 bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                            style={{ height: `${(day.views / maxViews) * 100}%` }}
                          />
                          <div
                            className="w-4 bg-accent-500 rounded-t-lg transition-all hover:bg-accent-600"
                            style={{ height: `${(day.applications / 40) * 100}%` }}
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
                      <h3 className="font-semibold text-gray-800">热门视频</h3>
                      <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                        全部 <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {videoList.slice(0, 3).map((video, index) => (
                        <div key={video.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-gray-300 text-white' :
                            'bg-orange-300 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <img src={video.thumbnail} alt="" className="w-12 h-16 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                            <p className="text-xs text-gray-500">{video.views.toLocaleString()} 次播放</p>
                          </div>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">招聘效果</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">视频简历点击率</span>
                          <span className="text-sm font-semibold text-primary-600">23.5%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-full w-[23.5%] bg-primary-500 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">简历投递转化率</span>
                          <span className="text-sm font-semibold text-green-600">15.2%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-full w-[15.2%] bg-green-500 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">完播率</span>
                          <span className="text-sm font-semibold text-accent-600">68.3%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-full w-[68.3%] bg-accent-500 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">收藏率</span>
                          <span className="text-sm font-semibold text-purple-600">8.7%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-full w-[8.7%] bg-purple-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'videos' && (
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
                  {videoList.map(video => (
                    <div key={video.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-[9/16]">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                          <button className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                          </button>
                        </div>
                        <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full ${
                          video.status === '已发布' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>
                          {video.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 text-sm truncate">{video.title}</h3>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {video.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {video.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {video.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button className="flex-1 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            编辑
                          </button>
                          <button className="flex-1 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                            <Share2 className="w-3.5 h-3.5" />
                            分享
                          </button>
                          <button className="py-1.5 px-2 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="aspect-[9/16] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer">
                    <Plus className="w-10 h-10 mb-2" />
                    <span className="text-sm">上传新视频</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'creator' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">视频制作工具</h1>
                  <p className="text-gray-500">轻松制作专业的招聘视频</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">编辑工作台</h3>
                    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                      <div className="text-center text-gray-500">
                        <Upload className="w-12 h-12 mx-auto mb-2" />
                        <p>拖拽视频到此处或点击上传</p>
                        <p className="text-sm mt-1">支持 MP4、MOV 格式</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex-1 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5" />
                        上传视频
                      </button>
                      <button className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                        从模板创建
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold text-gray-800">AI 工具</h3>
                      </div>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                          <Type className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-medium text-sm">自动生成字幕</p>
                            <p className="text-xs text-purple-400">AI语音识别，精准转写</p>
                          </div>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Sparkles className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-medium text-sm">智能标签提取</p>
                            <p className="text-xs text-blue-400">自动识别视频内容关键词</p>
                          </div>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                          <Zap className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-medium text-sm">一键生成封面</p>
                            <p className="text-xs text-green-400">智能选取精彩画面</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4">素材库</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['音乐', '贴纸', '滤镜', '转场', '文字', '特效'].map(item => (
                          <button key={item} className="aspect-square rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                            {item === '音乐' && <Music className="w-6 h-6 mb-1" />}
                            {item === '贴纸' && <Image className="w-6 h-6 mb-1" />}
                            {item === '滤镜' && <Sparkles className="w-6 h-6 mb-1" />}
                            {item !== '音乐' && item !== '贴纸' && item !== '滤镜' && <FileText className="w-6 h-6 mb-1" />}
                            <span className="text-xs">{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subtitles' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">字幕生成</h1>
                    <p className="text-gray-500">AI 自动语音转文字，精准高效</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
                    <Upload className="w-5 h-5" />
                    生成字幕
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">字幕任务</h3>
                  <div className="space-y-3">
                    {subtitleTasks.map(task => (
                      <div key={task.id} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                            <Type className="w-6 h-6 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{task.videoTitle}</p>
                            <p className="text-sm text-gray-500">
                              时长 {task.duration}
                              {task.words && ` · ${task.words}字`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {task.progress !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-100 rounded-full">
                                <div
                                  className="h-full bg-primary-500 rounded-full transition-all"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">{task.progress}%</span>
                            </div>
                          ) : (
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
                              {task.status}
                            </span>
                          )}
                          {task.status === '已完成' && (
                            <button className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">模板中心</h1>
                  <p className="text-gray-500">精选模板，一键生成专业视频</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'ring-2 ring-primary-500 ring-offset-2'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="relative aspect-[9/16]">
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full">
                          {template.category}
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full">
                          {template.duration}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-800 text-sm">{template.name}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('creator');
                          }}
                          className="w-full mt-2 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          使用模板
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePage;
