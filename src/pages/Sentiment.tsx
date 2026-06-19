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
  MessageSquare
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
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'list' | 'report'>('overview');
  const [searchText, setSearchText] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filteredItems = sentimentItems.filter(item => {
    const matchSearch = item.title.includes(searchText) || item.summary.includes(searchText);
    const matchSentiment = filterSentiment === 'all' || item.sentiment === filterSentiment;
    const matchPlatform = filterPlatform === 'all' || item.platform === filterPlatform;
    return matchSearch && matchSentiment && matchPlatform;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-1 inline-flex">
        {[
          { id: 'overview', label: '舆情概览', icon: BarChart3 },
          { id: 'events', label: '热点事件', icon: Zap },
          { id: 'list', label: '舆情列表', icon: Globe },
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
      {activeTab === 'events' && <HotEventsList />}
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
      {activeTab === 'report' && <SentimentReport />}
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

function HotEventsList() {
  return (
    <div className="space-y-4">
      {hotEvents.map((event, index) => (
        <div key={event.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
              index < 3 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-800">{event.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
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
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
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
            <button className="text-primary-500 text-sm font-medium flex items-center gap-1">
              详情
              <ChevronRight className="w-4 h-4" />
            </button>
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

function SentimentReport() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

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
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
    </div>
  );
}
