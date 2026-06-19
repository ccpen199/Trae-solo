import { useState } from 'react';
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
  History
} from 'lucide-react';
import { newsList, distributionChannels, currentUser } from '../data/mockData';
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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'review'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

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

  const goBack = () => {
    setActiveTab('list');
    setSelectedNews(null);
  };

  if (activeTab === 'edit' && selectedNews) {
    return <EditorDetail news={selectedNews} onBack={goBack} />;
  }

  if (activeTab === 'review' && selectedNews) {
    return <ReviewDetail news={selectedNews} onBack={goBack} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索稿件..."
              className="pl-10 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'pending', 'reviewing', 'approved', 'published', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status === 'all' ? '全部' : statusMap[status]?.label}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" />
          新建稿件
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">稿件标题</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">作者</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">传播数据</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">更新时间</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredNews.map(news => {
              const statusInfo = statusMap[news.status];
              const typeInfo = typeMap[news.type];
              const StatusIcon = statusInfo.icon;
              const TypeIcon = typeInfo.icon;
              return (
                <tr key={news.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {news.cover && (
                        <img src={news.cover} alt="" className="w-12 h-10 rounded object-cover" />
                      )}
                      <div>
                        <div className="font-medium text-slate-800 line-clamp-1 cursor-pointer hover:text-primary-600" onClick={() => openEditor(news)}>
                          {news.title}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Tag className="w-3 h-3" />
                          {news.tags.slice(0, 3).join(' · ')}
                        </div>
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
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{news.author}</span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6">{news.department}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{news.views?.toLocaleString() || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{news.likes?.toLocaleString() || 0}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{news.shares?.toLocaleString() || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{news.updatedAt}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditor(news)} className="p-1.5 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openReview(news)} className="p-1.5 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
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

function EditorDetail({ news, onBack }: { news: NewsItem; onBack: () => void }) {
  const [title, setTitle] = useState(news.title);
  const [content, setContent] = useState(news.content || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(news.channels || []);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

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
              <div>
                <label className="text-sm text-slate-500 block mb-1">版权信息</label>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{news.copyright}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary-500" />
              一键分发
            </h3>
            <div className="space-y-2">
              {distributionChannels.slice(0, 6).map(channel => (
                <label key={channel.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedChannels.includes(channel.name)}
                    onChange={() => toggleChannel(channel.name)}
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700 flex-1">{channel.name}</span>
                  <span className="text-xs text-slate-400">{channel.todayPosts}篇/今日</span>
                </label>
              ))}
            </div>
            <button className="w-full mt-4 py-2 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-primary-600 hover:to-blue-700 transition-all">
              一键分发到 {selectedChannels.length} 个渠道
            </button>
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
