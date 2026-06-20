import { useState } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  FileText,
  Download,
  Calendar,
  Globe,
  MessageCircle,
  Twitter,
  Video as VideoIcon,
  Newspaper,
  ChevronRight,
  Zap,
  BarChart3,
  Clock,
  ExternalLink,
  Sparkles,
  Mail,
  MessageSquare,
  ArrowLeft,
  Users,
  Share2,
  Eye,
  Send,
  CheckCircle,
  User
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { sentimentItems, hotEvents, sentimentDistribution } from '../data/mockData';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-green-500 bg-green-50',
  negative: 'text-red-500 bg-red-50',
  neutral: 'text-yellow-500 bg-yellow-50'
};

const platformStats = [
  { name: '微信', articles: 234, positive: 156, negative: 35, neutral: 43 },
  { name: '微博', articles: 189, positive: 98, negative: 52, neutral: 39 },
  { name: '抖音', articles: 156, positive: 87, negative: 34, neutral: 35 },
  { name: '网站', articles: 287, positive: 180, negative: 45, neutral: 62 },
  { name: '头条', articles: 145, positive: 85, negative: 28, neutral: 32 },
];

const trendData = [
  { date: '6/12', positive: 65, negative: 15, neutral: 20 },
  { date: '6/13', positive: 62, negative: 18, neutral: 20 },
  { date: '6/14', positive: 68, negative: 12, neutral: 20 },
  { date: '6/15', positive: 64, negative: 16, neutral: 20 },
  { date: '6/16', positive: 70, negative: 10, neutral: 20 },
  { date: '6/17', positive: 67, negative: 14, neutral: 19 },
  { date: '6/18', positive: 66, negative: 13, neutral: 21 },
];

export default function Sentiment() {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'list' | 'report' | 'warnings'>('overview');
  const [searchText, setSearchText] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const filteredItems = sentimentItems.filter(item => {
    const matchSearch = item.title.includes(searchText) || item.summary.includes(searchText);
    const matchSentiment = filterSentiment === 'all' || item.sentiment === filterSentiment;
    const matchPlatform = filterPlatform === 'all' || item.platform === filterPlatform;
    return matchSearch && matchSentiment && matchPlatform;
  });

  if (selectedEvent) {
    return <HotEventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  if (selectedReport) {
    return <ReportDetail report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-1 inline-flex">
        {[
          { id: 'overview', label: '舆情概览', icon: BarChart3 },
          { id: 'events', label: '热点事件', icon: Zap },
          { id: 'list', label: '舆情列表', icon: Globe },
          { id: 'warnings', label: '预警处置', icon: AlertTriangle },
          { id: 'report', label: '舆情简报', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <SentimentOverview />}
      {activeTab === 'events' && <HotEventsList onSelect={setSelectedEvent} />}
      {activeTab === 'list' && (
        <SentimentList
          searchText={searchText}
          setSearchText={setSearchText}
          filterSentiment={filterSentiment}
          setFilterSentiment={setFilterSentiment}
          filterPlatform={filterPlatform}
          setFilterPlatform={setFilterPlatform}
          filteredItems={filteredItems}
        />
      )}
      {activeTab === 'warnings' && <WarningRecords />}
      {activeTab === 'report' && <SentimentReport onViewDetail={setSelectedReport} />}
    </div>
  );
}

function SentimentOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日舆情总量', value: '1,256', trend: '+12.5%', trendUp: true, color: 'text-blue-500', icon: Globe },
          { label: '正面舆情', value: '816', trend: '+8.3%', trendUp: true, color: 'text-green-500', icon: ThumbsUp },
          { label: '负面舆情', value: '163', trend: '-5.2%', trendUp: false, color: 'text-red-500', icon: ThumbsDown },
          { label: '预警舆情', value: '8', trend: '+2', trendUp: true, color: 'text-yellow-500', icon: AlertTriangle },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium flex items-center gap-1">
                  {stat.trendUp ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={stat.trendUp ? 'text-green-500' : 'text-red-500'}>{stat.trend}</span>
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">情感分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-4">
            {sentimentDistribution.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                  <span className="text-xs text-slate-500">{item.name}</span>
                </div>
                <div className="text-lg font-bold text-slate-800 mt-1">{item.value}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">舆情趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} name="正面" dot={false} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="负面" dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} name="中性" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">各平台分布</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" fill="#10b981" name="正面" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neutral" fill="#f59e0b" name="中性" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negative" fill="#ef4444" name="负面" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function HotEventsList({ onSelect }: { onSelect: (event: any) => void }) {
  return (
    <div className="space-y-4">
      {hotEvents.map((event, index) => (
        <div 
          key={event.id} 
          onClick={() => onSelect(event)}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 ${
              index < 3 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-800">{event.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                  event.trend === 'up' ? 'bg-red-100 text-red-600' :
                  event.trend === 'down' ? 'bg-green-100 text-green-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {event.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                   event.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                  {event.trendValue > 0 ? '+' : ''}{event.trendValue}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3 flex-wrap">
                <span>热度：<span className="text-orange-500 font-medium">{(event.heat / 1000).toFixed(1)}k</span></span>
                <span>相关报道：{event.articleCount}篇</span>
                <span>更新于 {event.updateTime}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.keywords.map(keyword => (
                  <span key={keyword} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SentimentListProps {
  searchText: string;
  setSearchText: (v: string) => void;
  filterSentiment: string;
  setFilterSentiment: (v: string) => void;
  filterPlatform: string;
  setFilterPlatform: (v: string) => void;
  filteredItems: typeof sentimentItems;
}

function SentimentList({
  searchText,
  setSearchText,
  filterSentiment,
  setFilterSentiment,
  filterPlatform,
  setFilterPlatform,
  filteredItems
}: SentimentListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索舆情内容..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">全部情感</option>
          <option value="positive">正面</option>
          <option value="negative">负面</option>
          <option value="neutral">中性</option>
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">全部平台</option>
          <option value="website">网站</option>
          <option value="weibo">微博</option>
          <option value="wechat">微信</option>
          <option value="douyin">抖音</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const sentimentInfo = {
            positive: { label: '正面', icon: ThumbsUp, color: SENTIMENT_COLORS.positive },
            negative: { label: '负面', icon: ThumbsDown, color: SENTIMENT_COLORS.negative },
            neutral: { label: '中性', icon: Minus, color: SENTIMENT_COLORS.neutral }
          }[item.sentiment];
          const SentimentIcon = sentimentInfo.icon;

          return (
            <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-slate-800 hover:text-primary-600 cursor-pointer">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${sentimentInfo.color}`}>
                      <SentimentIcon className="w-3 h-3" />
                      {sentimentInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{item.summary}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {item.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.publishTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-orange-400" />
                      热度 {item.heat}
                    </span>
                    {item.region && (
                      <span className="flex items-center gap-1">
                        区域：{item.region}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.keywords.map((keyword) => (
                      <span key={keyword} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="text-primary-500 text-sm flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SentimentReport({ onViewDetail }: { onViewDetail: (report: any) => void }) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const reports = [
    { id: '1', title: '昌平区舆情周报', dateRange: '2026.06.12 - 2026.06.18', type: '周报', status: '已发布' },
    { id: '2', title: '昌平区舆情月报', dateRange: '2026年5月', type: '月报', status: '已发布' },
    { id: '3', title: '昌平区一季度舆情分析报告', dateRange: '2026年Q1', type: '季报', status: '已发布' },
    { id: '4', title: '经济工作会议专题舆情报告', dateRange: '2026.06.15 - 2026.06.19', type: '专报', status: '生成中' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['今日', '本周', '本月', '本季度'].map((period, index) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm ${
                index === 1 ? 'bg-primary-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" />
            邮件订阅
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            下载简报
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">昌平区舆情周报</h2>
          <p className="text-sm text-slate-500">2026年6月12日 - 2026年6月18日</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: '舆情总量', value: '8,756', change: '+15.2%', up: true },
            { label: '正面占比', value: '66.5%', change: '+3.2%', up: true },
            { label: '负面占比', value: '13.8%', change: '-2.1%', up: false },
            { label: '预警事件', value: '23', change: '+5', up: true },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-800">{item.value}</div>
              <div className="text-sm text-slate-500 mt-1">{item.label}</div>
              <div className={`text-xs mt-1 ${item.up ? 'text-green-500' : 'text-red-500'}`}>
                {item.change}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            一、舆情总体概况
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            本周，昌平区舆情总体平稳，正面舆情占比持续提升。本周共监测到相关舆情信息8,756条，
            较上周增长15.2%。其中正面舆情5,822条，占比66.5%；中性舆情1,724条，占比19.7%；
            负面舆情1,210条，占比13.8%。
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            二、热点事件盘点
          </h3>
          <div className="space-y-3">
            {hotEvents.slice(0, 3).map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-red-500 text-white' :
                  index === 1 ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-slate-800 text-sm">{event.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    相关报道 {event.articleCount} 篇，热度指数 {event.heat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            三、风险预警提示
          </h3>
          <div className="space-y-2">
            {[
              '回天地区交通拥堵问题持续引发关注，建议相关部门应及时回应',
              '部分小区停水事件影响居民生活，需做好沟通解释工作',
              '夏季高温天气来临，需关注防暑降温和安全生产工作',
            ].map((tip, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            四、应对建议
          </h3>
          <div className="space-y-2">
            {[
              '加强正面宣传引导，加大对经济发展、民生改善等成就的宣传报道力度',
              '建立快速响应机制，对负面舆情做到早发现、早处置、早回应',
              '提升政务新媒体运营，增强与网民的互动沟通',
              '定期开展舆情分析研判，为决策提供参考依据',
            ].map((tip, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">历史简报</h3>
        <div className="space-y-3">
          {reports.map(report => (
            <div 
              key={report.id}
              onClick={() => onViewDetail(report)}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-12 bg-primary-100 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">{report.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{report.dateRange}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${
                report.status === '已发布' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {report.status}
              </span>
              <span className="text-xs text-slate-400">{report.type}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HotEventDetail({ event, onBack }: { event: any; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'trend' | 'keywords' | 'articles'>('trend');

  const eventTrendData = [
    { date: '6/14', heat: 1200 },
    { date: '6/15', heat: 2800 },
    { date: '6/16', heat: 5600 },
    { date: '6/17', heat: 8900 },
    { date: '6/18', heat: 12500 },
    { date: '6/19', heat: 9800 },
  ];

  const keywordClusters = [
    { keyword: '经济工作会议', count: 356, sentiment: 'positive' },
    { keyword: '昌平发展', count: 289, sentiment: 'positive' },
    { keyword: '未来科学城', count: 245, sentiment: 'positive' },
    { keyword: '回天计划', count: 198, sentiment: 'neutral' },
    { keyword: '营商环境', count: 176, sentiment: 'positive' },
    { keyword: '民生改善', count: 154, sentiment: 'positive' },
    { keyword: '科技创新', count: 132, sentiment: 'positive' },
    { keyword: '交通拥堵', count: 89, sentiment: 'negative' },
  ];

  const relatedArticles = [
    { id: '1', title: '昌平区召开2026年经济工作会议部署全年任务', source: '昌平新闻网', time: '2小时前', sentiment: 'positive', heat: 3560 },
    { id: '2', title: '未来科学城创新企业集聚效应显现', source: '北京日报', time: '5小时前', sentiment: 'positive', heat: 2890 },
    { id: '3', title: '回天地区五年行动计划成效显著', source: '北京青年报', time: '8小时前', sentiment: 'positive', heat: 2145 },
    { id: '4', title: '昌平优化营商环境 激发市场主体活力', source: '千龙网', time: '10小时前', sentiment: 'positive', heat: 1820 },
    { id: '5', title: '部分网友反映回龙观早高峰交通拥堵问题', source: '微博', time: '12小时前', sentiment: 'negative', heat: 980 },
  ];

  const sentimentMap: Record<string, { label: string; color: string }> = {
    positive: { label: '正面', color: 'bg-green-100 text-green-600' },
    negative: { label: '负面', color: 'bg-red-100 text-red-600' },
    neutral: { label: '中性', color: 'bg-yellow-100 text-yellow-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{event.name}</h2>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500" />
              热度 {event.heat.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              报道 {event.articleCount} 篇
            </span>
            <span>更新于 {event.updateTime}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            加入监测
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-1 inline-flex">
        {[
          { id: 'trend', label: '传播趋势' },
          { id: 'keywords', label: '关键词聚类' },
          { id: 'articles', label: '相关报道' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'trend' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">热度趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="heat" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    name="热度"
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">情感分布</h3>
              <div className="space-y-3">
                {[
                  { label: '正面', value: 68, color: 'bg-green-500' },
                  { label: '中性', value: 18, color: 'bg-yellow-500' },
                  { label: '负面', value: 14, color: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-800">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">平台分布</h3>
              <div className="space-y-2">
                {[
                  { platform: '微信', count: 456, percent: 36 },
                  { platform: '微博', count: 389, percent: 31 },
                  { platform: '网站', count: 278, percent: 22 },
                  { platform: '抖音', count: 127, percent: 11 },
                ].map(item => (
                  <div key={item.platform} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.platform}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{item.count}篇</span>
                      <span className="font-medium text-slate-800 w-12 text-right">{item.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'keywords' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">关键词聚类分析</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {keywordClusters.map((item, index) => (
              <div
                key={item.keyword}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  item.sentiment === 'positive' ? 'bg-green-50 text-green-700' :
                  item.sentiment === 'negative' ? 'bg-red-50 text-red-700' :
                  'bg-yellow-50 text-yellow-700'
                }`}
                style={{ fontSize: `${12 + (index < 3 ? 4 : 0)}px` }}
              >
                <span className="font-medium">{item.keyword}</span>
                <span className="text-xs opacity-70">({item.count})</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {keywordClusters.map((item, index) => (
              <div key={item.keyword} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  {index + 1}
                </span>
                <span className="w-28 text-sm font-medium text-slate-800">{item.keyword}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      item.sentiment === 'positive' ? 'bg-green-500' :
                      item.sentiment === 'negative' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${(item.count / 356) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 text-right text-sm font-medium text-slate-700">{item.count}次</span>
                <span className={`w-12 text-xs text-center px-2 py-0.5 rounded ${
                  item.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                  item.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {item.sentiment === 'positive' ? '正面' : item.sentiment === 'negative' ? '负面' : '中性'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'articles' && (
        <div className="space-y-3">
          {relatedArticles.map(article => {
            const info = sentimentMap[article.sentiment];
            return (
              <div key={article.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-slate-800 hover:text-primary-600 cursor-pointer flex-1 pr-4">
                    {article.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${info.color}`}>
                    {info.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {article.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-400" />
                    热度 {article.heat.toLocaleString()}
                  </span>
                  <button className="text-primary-500 flex items-center gap-1 ml-auto">
                    <ExternalLink className="w-3 h-3" />
                    原文
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WarningRecords() {
  const [filterStatus, setFilterStatus] = useState('all');

  const warnings = [
    { id: '1', title: '回天地区交通拥堵问题持续发酵', level: 'high', status: 'processing', time: '2小时前', source: '微博', relatedCount: 256, handler: '舆情部-李主管' },
    { id: '2', title: '某小区停水事件引发居民不满', level: 'medium', status: 'processing', time: '5小时前', source: '微信', relatedCount: 128, handler: '社区办-王主任' },
    { id: '3', title: '教育资源分配相关讨论升温', level: 'medium', status: 'pending', time: '8小时前', source: '论坛', relatedCount: 89, handler: '' },
    { id: '4', title: '夏季高温安全生产隐患问题', level: 'low', status: 'resolved', time: '1天前', source: '抖音', relatedCount: 67, handler: '应急管理局' },
    { id: '5', title: '医疗服务满意度相关舆情', level: 'low', status: 'resolved', time: '2天前', source: '微博', relatedCount: 45, handler: '卫健委' },
  ];

  const filteredWarnings = warnings.filter(w => filterStatus === 'all' || w.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '预警总数', value: '23', color: 'text-blue-500', icon: AlertTriangle },
          { label: '待处理', value: '5', color: 'text-yellow-500', icon: Clock },
          { label: '处理中', value: '12', color: 'text-orange-500', icon: Users },
          { label: '已处置', value: '6', color: 'text-green-500', icon: CheckCircle },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{item.value}</div>
              <div className="text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {['all', 'pending', 'processing', 'resolved'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filterStatus === status ? 'bg-primary-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {status === 'all' ? '全部' : 
             status === 'pending' ? '待处理' :
             status === 'processing' ? '处理中' : '已处置'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredWarnings.map(warning => (
          <div key={warning.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  warning.level === 'high' ? 'bg-red-100 text-red-600' :
                  warning.level === 'medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {warning.level === 'high' ? '高危' : warning.level === 'medium' ? '中危' : '低危'}
                </span>
                <h3 className="font-medium text-slate-800">{warning.title}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 ${
                warning.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                warning.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                'bg-green-100 text-green-600'
              }`}>
                {warning.status === 'pending' ? '待处理' :
                 warning.status === 'processing' ? '处理中' : '已处置'}
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {warning.source}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                相关 {warning.relatedCount} 条
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {warning.time}
              </span>
              {warning.handler && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  责任人：{warning.handler}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              {warning.status === 'pending' && (
                <button className="px-3 py-1.5 bg-primary-500 text-white rounded text-xs flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  派发处置
                </button>
              )}
              {warning.status === 'processing' && (
                <button className="px-3 py-1.5 bg-green-500 text-white rounded text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  标记已处置
                </button>
              )}
              <button className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                查看详情
              </button>
              <button className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs flex items-center gap-1">
                <FileText className="w-3 h-3" />
                处置记录
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportDetail({ report, onBack }: { report: any; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{report.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{report.dateRange}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            report.status === '已发布' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
          }`}>
            {report.status}
          </span>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            下载PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
        <div className="text-center mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{report.title}</h1>
          <p className="text-sm text-slate-500">报告周期：{report.dateRange}</p>
          <p className="text-xs text-slate-400 mt-2">昌平区融媒体中心 · 舆情监测组</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              一、舆情总体概况
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed pl-3">
              <p>
                本监测周期内，昌平区相关舆情总体平稳向好。共监测到各类舆情信息共计8,756条，
                较上一周期增长15.2%。其中，正面舆情5,822条，占比66.5%；中性舆情1,724条，
                占比19.7%；负面舆情1,210条，占比13.8%。
              </p>
              <p>
                整体来看，正面舆情占比持续提升，主要得益于我区经济发展、民生改善、
                科技创新等方面取得的积极成效。负面舆情主要集中在交通出行、社区治理、
                公共服务等领域，相关部门应予以关注并及时回应。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
              二、热点事件盘点
            </h2>
            <div className="space-y-4 pl-3">
              {[
                { rank: 1, title: '2026年中经济发展专题', heat: 12500, desc: '昌平区2026年经济工作会议召开，部署下半年重点任务，引发广泛关注。' },
                { rank: 2, title: '回天地区五年行动成果', heat: 9800, desc: '回天行动计划实施五年来取得的显著成效，获得市民广泛好评。' },
                { rank: 3, title: '未来科学城创新发展', heat: 7600, desc: '未来科学城一批重大创新项目落地，科技创新引领作用进一步凸显。' },
              ].map(item => (
                <div key={item.rank} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.rank === 1 ? 'bg-red-500 text-white' :
                      item.rank === 2 ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {item.rank}
                    </span>
                    <h3 className="font-medium text-slate-800">{item.title}</h3>
                    <span className="text-xs text-orange-500 ml-auto">热度 {item.heat.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 pl-10">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              三、风险预警提示
            </h2>
            <div className="space-y-3 pl-3">
              {[
                { type: '高风险', content: '回天地区早高峰交通拥堵问题持续发酵，网民反映强烈，建议交通部门及时出台疏解措施并做好信息发布。' },
                { type: '中风险', content: '部分老旧小区停水停电问题偶有发生，易引发居民不满情绪，建议相关部门做好应急保障和沟通解释工作。' },
                { type: '中风险', content: '暑期临近，学生安全、防溺水等话题关注度上升，建议教育、应急等部门提前部署做好宣传引导。' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                    item.type === '高风险' ? 'bg-red-100 text-red-600' :
                    item.type === '中风险' ? 'bg-orange-100 text-orange-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {item.type}
                  </span>
                  <p className="text-sm text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-500 rounded-full"></span>
              四、应对建议
            </h2>
            <div className="space-y-3 pl-3">
              {[
                '加强正面宣传引导。围绕中心工作，策划推出系列主题宣传，充分展示我区经济社会发展成就，营造良好舆论氛围。',
                '完善快速响应机制。建立健全舆情监测预警和快速响应体系，对负面舆情做到第一时间发现、第一时间处置、第一时间回应。',
                '提升政务新媒体运营水平。加强各部门政务新媒体建设，增强与网民的互动沟通，提升信息发布的及时性和权威性。',
                '强化部门协同联动。建立舆情工作联席会议制度，定期会商研判重大舆情，形成工作合力。',
                '加强舆情队伍建设。定期开展业务培训，提升舆情工作人员的专业素养和处置能力。',
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-600">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              五、处置跟踪记录
            </h2>
            <div className="space-y-4 pl-3">
              {[
                { time: '2026-06-18 16:30', action: '发布通报', content: '昌平交通局就回天地区拥堵问题发布情况通报，说明相关治理措施进展', operator: '交通局' },
                { time: '2026-06-18 10:15', action: '舆情响应', content: '监测发现交通拥堵相关舆情升温，已向相关部门发出预警提示', operator: '舆情监测组' },
                { time: '2026-06-17 14:20', action: '专题会商', content: '召开本周舆情研判会，对热点事件和风险点进行分析部署', operator: '宣传部' },
              ].map((item, index) => (
                <div key={index} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:pb-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary-500 border-2 border-white"></div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-800">{item.action}</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-sm text-slate-600">{item.content}</p>
                    <p className="text-xs text-slate-400 mt-2">责任单位：{item.operator}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">—— 报告完 ——</p>
          <p className="text-xs text-slate-400 mt-2">本报告由昌平区融媒体中心舆情监测系统自动生成</p>
        </div>
      </div>
    </div>
  );
}
