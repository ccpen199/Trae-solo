import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Eye, 
  ThumbsUp,
  Share2,
  MessageSquare,
  Radio,
  Zap,
  Globe,
  Activity,
  Clock,
  ArrowUpRight,
  Newspaper,
  Tv,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { dashboardStats, articleTrendData, channelDistribution, departmentStats, sentimentDistribution, hotEvents } from '../data/mockData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ icon: Icon, title, value, unit, trend, trendValue, color }: {
  icon: any;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}) {
  return (
    <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group hover:border-primary-500/50 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: color }}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1 animate-count-up">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
        </div>
        <div className="text-sm text-slate-400">{title}</div>
      </div>
    </div>
  );
}

function ChannelItem({ name, icon: Icon, value, total, color }: {
  name: string;
  icon: any;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white">{name}</span>
          <span className="text-xs text-slate-400">{value.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function HotEventItem({ event, index }: { event: any; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        index < 3 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{event.name}</div>
        <div className="text-xs text-slate-500">{event.articleCount}篇报道</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-orange-400">{(event.heat / 1000).toFixed(1)}k</div>
        <div className={`text-xs flex items-center gap-1 ${
          event.trend === 'up' ? 'text-red-400' : event.trend === 'down' ? 'text-green-400' : 'text-slate-500'
        }`}>
          {event.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
           event.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : 
           <span>-</span>}
          {event.trendValue > 0 ? '+' : ''}{event.trendValue}%
        </div>
      </div>
    </div>
  );
}

function LiveFeedItem({ item }: { item: any }) {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-slate-700/50 last:border-0">
      <div className="w-2 h-2 rounded-full bg-green-400 mt-2 animate-pulse"></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white line-clamp-1">{item.title}</div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <span>{item.source}</span>
          <span>·</span>
          <span>{item.time}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveFeed = [
    { title: '昌平区经济工作会议顺利召开', source: '昌平报', time: '2分钟前' },
    { title: '回天地区新增一处社区公园', source: '微信公众号', time: '5分钟前' },
    { title: '草莓节游客数量创新高', source: '抖音', time: '8分钟前' },
    { title: '未来科学城企业获国家级奖项', source: '微博', time: '12分钟前' },
    { title: '昌平教育系统开展师德培训', source: '教育新闻部', time: '15分钟前' },
    { title: '我区开展安全生产大检查', source: '应急管理局', time: '20分钟前' },
  ];

  const radarData = [
    { subject: '传播力', A: 85, fullMark: 100 },
    { subject: '影响力', A: 78, fullMark: 100 },
    { subject: '互动率', A: 72, fullMark: 100 },
    { subject: '原创度', A: 90, fullMark: 100 },
    { subject: '时效性', A: 88, fullMark: 100 },
    { subject: '覆盖度', A: 92, fullMark: 100 },
  ];

  return (
    <div className="dashboard-bg min-h-screen -m-6 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white glow-text">
              昌平区融媒体中心 · 数据指挥中心
            </h1>
            <p className="text-slate-400 mt-1">一体化内容生产与传播管理平台</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-white">
              {currentTime.toLocaleTimeString('zh-CN')}
            </div>
            <div className="text-sm text-slate-400">
              {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={FileText} title="总发稿量" value={dashboardStats.totalArticles} unit="篇" trend="up" trendValue="12.5%" color="#3b82f6" />
        <StatCard icon={Zap} title="今日发稿" value={dashboardStats.todayArticles} unit="篇" trend="up" trendValue="8.3%" color="#10b981" />
        <StatCard icon={Eye} title="总阅读量" value={dashboardStats.totalViews} trend="up" trendValue="15.2%" color="#f59e0b" />
        <StatCard icon={Share2} title="总转发" value={dashboardStats.totalShares} trend="up" trendValue="5.8%" color="#8b5cf6" />
        <StatCard icon={Activity} title="传播力指数" value={dashboardStats.spreadIndex} trend="up" trendValue="3.2%" color="#06b6d4" />
        <StatCard icon={Globe} title="矩阵覆盖率" value={dashboardStats.matrixCoverage} unit="%" trend="up" trendValue="1.5%" color="#ec4899" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">发稿量与传播趋势</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500"></span>发稿量</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>阅读量</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={articleTrendData}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="articles" stroke="#3b82f6" fillOpacity={1} fill="url(#colorArticles)" name="发稿量" />
                <Area type="monotone" dataKey="views" stroke="#10b981" fillOpacity={1} fill="url(#colorViews)" name="阅读量" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">渠道传播分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {channelDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs text-slate-400">{item.name}</span>
                <span className="text-xs text-white font-medium ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            热点事件排行
          </h3>
          <div className="space-y-1">
            {hotEvents.slice(0, 5).map((event, index) => (
              <HotEventItem key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            实时动态
          </h3>
          <div className="space-y-1">
            {liveFeed.map((item, index) => (
              <LiveFeedItem key={index} item={item} />
            ))}
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">媒体矩阵效能</h3>
          <div className="space-y-3">
            <ChannelItem name="微信公众号" icon={MessageCircle} value={320000} total={500000} color="#07c160" />
            <ChannelItem name="抖音" icon={Tv} value={1250000} total={2000000} color="#000000" />
            <ChannelItem name="微博" icon={Activity} value={580000} total={1000000} color="#e6162d" />
            <ChannelItem name="APP" icon={Smartphone} value={450000} total={800000} color="#3b82f6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">各部门发稿统计</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="articles" fill="#3b82f6" radius={[0, 4, 4, 0]} name="发稿量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">融媒综合能力评估</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                <PolarRadiusAxis stroke="#475569" fontSize={10} />
                <Radar name="评分" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-dark-100 rounded-xl p-5 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">今日要闻速览</h3>
        <div className="overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...liveFeed, ...liveFeed].map((item, index) => (
              <div key={index} className="flex items-center gap-4 mx-6 text-slate-300">
                <span className="text-primary-400">●</span>
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-slate-500">{item.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
