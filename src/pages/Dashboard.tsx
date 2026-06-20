import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  MessageCircle,
  PenTool,
  Camera,
  AlertTriangle,
  GraduationCap,
  Database,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Copyright,
  Send,
  ChevronRight,
  Layers,
  Search,
  Award,
  BookOpen,
  Video,
  Mic,
  UserCheck,
  Shield,
  PieChart as PieChartIcon,
  Edit3,
  Microscope,
  Upload,
  Scan,
  Archive,
  Gauge,
  Building2,
  BookMarked,
  AlertCircle,
  BarChart3,
  UserPlus,
  TimerReset,
  History,
  BadgeAlert,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { dashboardStats, articleTrendData, channelDistribution, departmentStats, sentimentDistribution, hotEvents } from '../data/mockData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:59263';

type RoleType = 'editor' | 'reporter' | 'reviewer' | 'admin' | 'overview';

type PlatformStatus = {
  status: 'loading' | 'online' | 'offline';
  message: string;
  checkedAt?: string;
  backendUrl?: string;
  frontendUrl?: string;
  sqliteLabel?: string;
};

function StatCard({ icon: Icon, title, value, unit, trend, trendValue, color, onClick, linkTo, linkText }: {
  icon: any;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  onClick?: () => void;
  linkTo?: string;
  linkText?: string;
}) {
  return (
    <div 
      className={`bg-dark-100 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group hover:border-primary-500/50 transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/10' : ''}`}
    >
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">{title}</div>
          {linkTo ? (
            <Link 
              to={linkTo}
              onClick={(e) => { e.stopPropagation(); }}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {linkText || '查看明细'}
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          ) : onClick ? (
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" onClick={onClick} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChannelItem({ name, icon: Icon, value, total, color, onClick }: {
  name: string;
  icon: any;
  value: number;
  total: number;
  color: string;
  onClick?: () => void;
}) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
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

function HotEventItem({ event, index, onClick }: { event: any; index: number; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
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

function BusinessEntryCard({ icon: Icon, title, desc, color, onClick, badge }: {
  icon: any;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 hover:border-primary-500/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/10 group relative"
    >
      {badge && (
        <div 
          className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}25`, color }}
        >
          {badge}
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
      </div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
  );
}

function WorkflowStep({ icon: Icon, title, count, status, color, isLast }: {
  icon: any;
  title: string;
  count: number;
  status: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="text-sm font-medium text-white mt-2">{title}</div>
        <div className="text-xl font-bold" style={{ color }}>{count}</div>
        <div className="text-xs text-slate-500">{status}</div>
      </div>
      {!isLast && (
        <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent hidden lg:block"></div>
      )}
    </div>
  );
}

function StatusItem({ label, value, color, icon: Icon }: {
  label: string;
  value: number;
  color: string;
  icon?: any;
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-sm font-medium text-white">{value}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(value / 150 * 100, 100)}%`, backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
}

const roles: { key: RoleType; label: string; icon: any; color: string }[] = [
  { key: 'editor', label: '编辑工作台', icon: Edit3, color: '#3b82f6' },
  { key: 'reporter', label: '记者工作台', icon: Camera, color: '#10b981' },
  { key: 'reviewer', label: '审核工作台', icon: Shield, color: '#f59e0b' },
  { key: 'admin', label: '管理工作台', icon: Gauge, color: '#8b5cf6' },
  { key: 'overview', label: '全流程概览', icon: Layers, color: '#06b6d4' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeRole, setActiveRole] = useState<RoleType>('editor');
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({
    status: 'loading',
    message: '正在检查本地服务链路...',
  });
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPlatformStatus = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/overview`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        if (cancelled) {
          return;
        }

        setPlatformStatus({
          status: 'online',
          message: payload.message || '本地前后端服务在线',
          checkedAt: payload.checkedAt,
          backendUrl: payload.backendUrl,
          frontendUrl: payload.frontendUrl,
          sqliteLabel: payload.sqlite?.enabled ? '已启用' : '未使用',
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPlatformStatus({
          status: 'offline',
          message: error instanceof Error ? error.message : '后端服务不可用',
          sqliteLabel: '未知',
        });
      }
    };

    loadPlatformStatus();
    const timer = setInterval(loadPlatformStatus, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
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

  const reviewNodes = [
    { name: '初审', pending: 5, reviewing: 3, color: '#3b82f6' },
    { name: '一校', pending: 4, reviewing: 2, color: '#06b6d4' },
    { name: '复审', pending: 3, reviewing: 2, color: '#8b5cf6' },
    { name: '二校', pending: 2, reviewing: 1, color: '#ec4899' },
    { name: '终审', pending: 2, reviewing: 1, color: '#f59e0b' },
    { name: '三校', pending: 1, reviewing: 1, color: '#ef4444' },
    { name: '发布', pending: 3, reviewing: 0, color: '#10b981' },
  ];

  const distributionChannels = [
    { name: '网站', today: 15, pending: 3, color: '#3b82f6', icon: Globe },
    { name: '微信公众号', today: 6, pending: 2, color: '#07c160', icon: MessageCircle },
    { name: '微博', today: 23, pending: 1, color: '#e6162d', icon: Activity },
    { name: '抖音', today: 8, pending: 2, color: '#000000', icon: Tv },
    { name: '快手', today: 5, pending: 1, color: '#f97316', icon: Video },
    { name: 'APP', today: 30, pending: 4, color: '#8b5cf6', icon: Smartphone },
    { name: '视频号', today: 4, pending: 1, color: '#10b981', icon: Video },
    { name: '昌平报', today: 8, pending: 0, color: '#6b7280', icon: Newspaper },
  ];

  const reporterTopics = {
    pending: [
      { title: '科技创新企业风采展示', time: '2026-06-18 09:15' },
      { title: '夏季旅游攻略专题', time: '2026-06-17 14:20' },
      { title: '交通拥堵治理调研', time: '2026-06-18 10:30' },
    ],
    approved: [
      { title: '2026年中经济发展专题报道', time: '2026-06-15 11:00' },
      { title: '回天行动计划实施五周年系列', time: '2026-06-10 15:30' },
      { title: '乡村振兴成果追踪', time: '2026-06-16 09:00' },
    ],
    assigned: [
      { title: '昌平草莓节深度报道', time: '2026-06-18 08:00', assignee: '李记者' },
      { title: '高考考点现场纪实', time: '2026-06-17 16:00', assignee: '王记者' },
    ],
  };

  const materialStatus = [
    { title: '经济工作会议现场照片', steps: ['上传中', '质检中', '入库', '已采用'], activeStep: 3, time: ['14:30', '14:35', '14:42', '15:10'], status: 'success' },
    { title: '草莓节开幕式视频', steps: ['上传中', '质检中', '入库', '已采用'], activeStep: 2, time: ['10:15', '10:28', '—', '—'], status: 'processing' },
    { title: '科创基地揭牌仪式', steps: ['上传中', '质检中', '入库', '退回'], activeStep: 1, time: ['09:20', '09:35', '—', '—'], status: 'warning' },
    { title: '社区治理现场照片', steps: ['上传中', '质检中', '入库', '已采用'], activeStep: 2, time: ['11:10', '11:18', '—', '—'], status: 'processing' },
  ];

  const reviewQueue = [
    { title: '昌平区召开2026年经济工作会议', author: '李记者', dept: '新闻中心', node: '待初审', wait: '12分钟', urgent: true },
    { title: '回天地区社区治理新模式探索', author: '王记者', dept: '社会新闻部', node: '待复审', wait: '35分钟', urgent: false },
    { title: '科技创新企业孵化基地揭牌', author: '刘记者', dept: '科技新闻部', node: '待终审', wait: '1小时12分', urgent: true },
    { title: '昌平草莓节开幕现场报道', author: '陈记者', dept: '文旅新闻部', node: '待二校', wait: '28分钟', urgent: false },
    { title: '教育系统师德师风建设推进会', author: '赵记者', dept: '教育新闻部', node: '待一校', wait: '45分钟', urgent: false },
    { title: '卫生健康委员会夏季健康提示', author: '周记者', dept: '卫生新闻部', node: '待三校', wait: '18分钟', urgent: false },
  ];

  const reviewerCards = [
    { node: '待初审', count: 12, person: '张初审', avg: '15分钟', color: '#3b82f6', icon: UserCheck },
    { node: '待一校', count: 8, person: '王校对', avg: '12分钟', color: '#06b6d4', icon: BookOpen },
    { node: '待复审', count: 6, person: '李复审', avg: '25分钟', color: '#8b5cf6', icon: Users },
    { node: '待二校', count: 4, person: '赵校对', avg: '10分钟', color: '#ec4899', icon: BookMarked },
    { node: '待终审', count: 3, person: '刘总编', avg: '40分钟', color: '#f59e0b', icon: Award },
    { node: '待三校', count: 2, person: '孙校对', avg: '8分钟', color: '#ef4444', icon: Shield },
  ];

  const rejectRecords = [
    { title: '交通新闻早高峰播报素材', node: '初审', reason: '音频杂音过大，建议重新录制', person: '张初审', time: '2026-06-18 14:22' },
    { title: '社区活动现场图片组', node: '一校', reason: '图片缺少版权说明，需补充授权信息', person: '王校对', time: '2026-06-18 11:45' },
    { title: '企业专访稿件', node: '复审', reason: '数据引用不准确，请核实具体数字', person: '李复审', time: '2026-06-18 10:30' },
    { title: '政策解读文章', node: '终审', reason: '涉及敏感内容，需要法务审核', person: '刘总编', time: '2026-06-17 16:50' },
    { title: '美食探店Vlog脚本', node: '二校', reason: '广告植入过于明显，建议调整', person: '赵校对', time: '2026-06-17 14:15' },
  ];

  const deptRanking = [...departmentStats].sort((a, b) => b.articles - a.articles).map((d, i) => ({
    ...d,
    rank: i + 1,
    percentage: Math.round(d.articles / Math.max(...departmentStats.map(x => x.articles)) * 100),
  }));

  const adminQuickEntries = [
    { title: '舆情监测', desc: '热点追踪·预警处置', icon: AlertTriangle, color: '#f59e0b', to: '/sentiment', badge: '3条负面待处置' },
    { title: '培训管理', desc: '在线学习·学时统计', icon: GraduationCap, color: '#8b5cf6', to: '/training', badge: '5人待结业' },
    { title: '内容资产', desc: '素材管理·版权授权', icon: Database, color: '#06b6d4', to: '/assets', badge: '4份待授权' },
    { title: '全流程概览', desc: '数据大屏·实时监控', icon: Layers, color: '#3b82f6', to: '', badge: '运行正常' },
  ];

  const renderRoleContent = () => {
    switch (activeRole) {
      case 'editor':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FileText} title="总发稿量" value={dashboardStats.totalArticles} unit="篇" trend="up" trendValue="12.5%" color="#3b82f6" linkTo="/editor?tab=list" linkText="进入编辑后台" />
              <StatCard icon={Activity} title="传播力指数" value={dashboardStats.spreadIndex} trend="up" trendValue="3.2%" color="#06b6d4" linkTo="/editor?tab=list" linkText="进入编辑后台" />
              <StatCard icon={Clock} title="待审稿件数" value={34} unit="篇" trend="down" trendValue="5.8%" color="#f59e0b" linkTo="/editor?tab=list" linkText="进入编辑后台" />
              <StatCard icon={CheckCircle} title="已发布" value={86} unit="篇/今日" trend="up" trendValue="8.3%" color="#10b981" linkTo="/editor?tab=list" linkText="进入编辑后台" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-blue-400" />
                    稿件审核状态分布
                  </h3>
                  <Link to="/editor?tab=review" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    进入审核管理
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '待审核', value: 12, color: '#f59e0b' },
                          { name: '初审中', value: 8, color: '#3b82f6' },
                          { name: '复审中', value: 5, color: '#8b5cf6' },
                          { name: '终审中', value: 3, color: '#ec4899' },
                          { name: '已发布', value: 86, color: '#10b981' },
                          { name: '已退回', value: 6, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[
                          { name: '待审核', value: 12, color: '#f59e0b' },
                          { name: '初审中', value: 8, color: '#3b82f6' },
                          { name: '复审中', value: 5, color: '#8b5cf6' },
                          { name: '终审中', value: 3, color: '#ec4899' },
                          { name: '已发布', value: 86, color: '#10b981' },
                          { name: '已退回', value: 6, color: '#ef4444' },
                        ].map((entry, index) => (
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

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">审核节点明细</h4>
                    <Link to="/editor?tab=review" className="text-xs text-blue-400 hover:text-blue-300">
                      进入审核管理 →
                    </Link>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {reviewNodes.map((node, idx) => (
                      <div key={idx} className="bg-slate-800/40 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400 mb-1">{node.name}</div>
                        <div className="text-sm font-semibold mb-0.5" style={{ color: node.color }}>{node.reviewing}</div>
                        <div className="text-xs text-slate-500">在审</div>
                        <div className="text-xs font-medium text-white mt-1">{node.pending}</div>
                        <div className="text-xs text-slate-500">待审</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-400" />
                    渠道分布 / 媒体矩阵
                  </h3>
                  <Link to="/editor?tab=distribution" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    进入分发管理
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
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

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">分发去向追踪</h4>
                    <Link to="/editor?tab=distribution" className="text-xs text-purple-400 hover:text-purple-300">
                      进入分发管理 →
                    </Link>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {distributionChannels.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ch.color}20` }}>
                          <ch.icon className="w-4 h-4" style={{ color: ch.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-medium truncate">{ch.name}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-green-400 font-medium">{ch.today}</div>
                          <div className="text-xs text-slate-500">今日分发</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-xs text-yellow-400 font-medium">{ch.pending}</div>
                          <div className="text-xs text-slate-500">待分发</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reporter':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Upload} title="今日回传素材" value={156} unit="条" trend="up" trendValue="18.2%" color="#10b981" linkTo="/reporter" linkText="进入记者端" />
              <StatCard icon={BookMarked} title="待提交选题" value={8} unit="个" trend="up" trendValue="2.1%" color="#3b82f6" linkTo="/reporter" linkText="进入记者端" />
              <StatCard icon={Mic} title="AI转写中" value={12} unit="条" color="#f59e0b" linkTo="/reporter" linkText="进入记者端" />
              <StatCard icon={CheckCircle} title="已采用稿件" value={23} unit="篇" trend="up" trendValue="6.5%" color="#06b6d4" linkTo="/reporter" linkText="进入记者端" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    选题申报进度追踪
                  </h3>
                  <Link to="/reporter" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    进入记者端
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-yellow-400">待审核</span>
                      <span className="text-lg font-bold text-yellow-400">{reporterTopics.pending.length}</span>
                    </div>
                    <div className="space-y-2">
                      {reporterTopics.pending.map((t, i) => (
                        <div key={i} className="p-2 rounded bg-slate-800/50">
                          <div className="text-xs text-white line-clamp-1">{t.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-green-400">已通过</span>
                      <span className="text-lg font-bold text-green-400">{reporterTopics.approved.length}</span>
                    </div>
                    <div className="space-y-2">
                      {reporterTopics.approved.map((t, i) => (
                        <div key={i} className="p-2 rounded bg-slate-800/50">
                          <div className="text-xs text-white line-clamp-1">{t.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-400">已分配</span>
                      <span className="text-lg font-bold text-blue-400">{reporterTopics.assigned.length}</span>
                    </div>
                    <div className="space-y-2">
                      {reporterTopics.assigned.map((t, i) => (
                        <div key={i} className="p-2 rounded bg-slate-800/50">
                          <div className="text-xs text-white line-clamp-1">{t.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>{t.time}</span>
                            <span className="text-blue-400">{t.assignee}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Scan className="w-5 h-5 text-green-400" />
                    素材回传状态流
                  </h3>
                  <Link to="/reporter" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    进入记者端
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {materialStatus.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-800/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-white font-medium truncate pr-2">{m.title}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          m.status === 'success' ? 'bg-green-500/15 text-green-400' :
                          m.status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {m.status === 'success' ? '已采用' : m.status === 'processing' ? '处理中' : '已退回'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {m.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex-1 flex flex-col items-center relative">
                            {sIdx < m.steps.length - 1 && (
                              <div 
                                className={`absolute top-3 left-1/2 w-full h-0.5 ${
                                  sIdx < m.activeStep ? 'bg-green-500' : 'bg-slate-700'
                                }`}
                              ></div>
                            )}
                            <div 
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs z-10 ${
                                sIdx < m.activeStep ? 'bg-green-500 text-white' :
                                sIdx === m.activeStep ? 'bg-blue-500 text-white animate-pulse' :
                                'bg-slate-700 text-slate-500'
                              }`}
                            >
                              {sIdx < m.activeStep ? <CheckCircle className="w-3 h-3" /> : sIdx + 1}
                            </div>
                            <div className="text-xs text-slate-400 mt-1.5 text-center whitespace-nowrap">{step}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{m.time[sIdx]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'reviewer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {reviewerCards.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-dark-100 rounded-xl p-4 border border-slate-700/50 hover:border-orange-500/50 transition-all group cursor-pointer"
                  onClick={() => navigate('/editor?tab=review')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: card.color }}>{card.count}</div>
                  <div className="text-sm font-medium text-white mb-1">{card.node}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{card.person}</span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {card.avg}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/50">
                    <Link 
                      to="/editor?tab=review" 
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs flex items-center justify-center gap-1 py-1 rounded transition-colors"
                      style={{ backgroundColor: `${card.color}15`, color: card.color }}
                    >
                      进入审核管理
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  待审核队列
                </h3>
                <Link to="/editor?tab=review" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                  查看全部
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-3 px-2 font-medium">稿件标题</th>
                      <th className="text-left py-3 px-2 font-medium">作者</th>
                      <th className="text-left py-3 px-2 font-medium">部门</th>
                      <th className="text-left py-3 px-2 font-medium">到达节点</th>
                      <th className="text-left py-3 px-2 font-medium">等待时长</th>
                      <th className="text-left py-3 px-2 font-medium">优先级</th>
                      <th className="text-right py-3 px-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="text-white font-medium truncate max-w-xs">{item.title}</div>
                        </td>
                        <td className="py-3 px-2 text-slate-300">{item.author}</td>
                        <td className="py-3 px-2 text-slate-400">{item.dept}</td>
                        <td className="py-3 px-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400">{item.node}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-xs ${item.urgent ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                            {item.wait}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {item.urgent ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400">
                              <BadgeAlert className="w-3 h-3" />
                              紧急
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">普通</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link 
                            to="/editor?tab=review"
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            立即处理
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  退回意见统计
                </h3>
                <Link to="/editor?tab=review" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                  审核留痕
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {rejectRecords.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-sm font-medium text-white truncate">{r.title}</div>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400 flex-shrink-0">{r.node}退回</span>
                      </div>
                      <div className="text-xs text-slate-400 mb-1.5">退回原因：{r.reason}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {r.person}
                        </span>
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {r.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon={FileText} title="总发稿量" value={dashboardStats.totalArticles} unit="篇" trend="up" trendValue="12.5%" color="#8b5cf6" linkTo="/editor?tab=stats" linkText="查看明细" />
              <StatCard icon={Eye} title="总阅读量" value={dashboardStats.totalViews} trend="up" trendValue="15.2%" color="#3b82f6" linkTo="/sentiment" linkText="查看明细" />
              <StatCard icon={Building2} title="部门数" value={6} unit="个" color="#06b6d4" linkTo="/editor?tab=stats" linkText="查看明细" />
              <StatCard icon={Database} title="内容资产" value={2856} unit="份" trend="up" trendValue="4.8%" color="#10b981" linkTo="/assets" linkText="查看明细" />
              <StatCard icon={GraduationCap} title="培训学时" value={1248} unit="学时" trend="up" trendValue="2.3%" color="#f59e0b" linkTo="/training" linkText="查看明细" />
            </div>

            <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  部门发稿排行榜
                </h3>
                <Link to="/editor?tab=stats" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  查看部门明细
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-4">
                {deptRanking.map((dept, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-slate-700/50 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-white">{dept.name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-purple-400 font-medium">{dept.articles}篇</span>
                          <span className="text-slate-500">{dept.views.toLocaleString()}阅读</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${dept.percentage}%`,
                            background: `linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc)`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {adminQuickEntries.map((entry, idx) => (
                <BusinessEntryCard
                  key={idx}
                  icon={entry.icon}
                  title={entry.title}
                  desc={entry.desc}
                  color={entry.color}
                  badge={entry.badge}
                  onClick={() => entry.to ? navigate(entry.to) : setActiveRole('overview')}
                />
              ))}
            </div>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={FileText} title="总发稿量" value={dashboardStats.totalArticles} unit="篇" trend="up" trendValue="12.5%" color="#3b82f6" onClick={() => navigate('/editor')} />
              <StatCard icon={Zap} title="今日发稿" value={dashboardStats.todayArticles} unit="篇" trend="up" trendValue="8.3%" color="#10b981" onClick={() => navigate('/editor')} />
              <StatCard icon={Eye} title="总阅读量" value={dashboardStats.totalViews} trend="up" trendValue="15.2%" color="#f59e0b" onClick={() => navigate('/sentiment')} />
              <StatCard icon={Share2} title="总转发" value={dashboardStats.totalShares} trend="up" trendValue="5.8%" color="#8b5cf6" onClick={() => navigate('/sentiment')} />
              <StatCard icon={Activity} title="传播力指数" value={dashboardStats.spreadIndex} trend="up" trendValue="3.2%" color="#06b6d4" onClick={() => navigate('/sentiment')} />
              <StatCard icon={Globe} title="矩阵覆盖率" value={dashboardStats.matrixCoverage} unit="%" trend="up" trendValue="1.5%" color="#ec4899" onClick={() => navigate('/editor?tab=distribution')} />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-400" />
                  业务快速入口
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <BusinessEntryCard icon={Share2} title="编辑后台" desc="稿件编辑·三审三校·一键分发" color="#3b82f6" onClick={() => navigate('/editor')} />
                <BusinessEntryCard icon={Camera} title="记者移动端" desc="素材回传·AI转写·选题申报" color="#10b981" onClick={() => navigate('/reporter')} />
                <BusinessEntryCard icon={AlertTriangle} title="舆情监测" desc="热点追踪·舆情简报·预警处置" color="#f59e0b" onClick={() => navigate('/sentiment')} />
                <BusinessEntryCard icon={GraduationCap} title="培训管理" desc="在线学习·考试认证·学时统计" color="#8b5cf6" onClick={() => navigate('/training')} />
                <BusinessEntryCard icon={Database} title="内容资产" desc="素材管理·版权标记·授权加工" color="#06b6d4" onClick={() => navigate('/assets')} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">发稿量与传播趋势</h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    查看详情
                    <ChevronRight className="w-3 h-3" />
                  </button>
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

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor?tab=distribution')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">渠道传播分布</h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    分发管理
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    热点事件排行
                  </h3>
                  <button 
                    onClick={() => navigate('/sentiment')}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    更多
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {hotEvents.slice(0, 5).map((event, index) => (
                    <HotEventItem key={event.id} event={event} index={index} onClick={() => navigate('/sentiment')} />
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

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor?tab=distribution')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">媒体矩阵效能</h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    分发配置
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  <ChannelItem name="微信公众号" icon={MessageCircle} value={320000} total={500000} color="#07c160" onClick={() => navigate('/editor?tab=distribution')} />
                  <ChannelItem name="抖音" icon={Tv} value={1250000} total={2000000} color="#000000" onClick={() => navigate('/editor?tab=distribution')} />
                  <ChannelItem name="微博" icon={Activity} value={580000} total={1000000} color="#e6162d" onClick={() => navigate('/editor?tab=distribution')} />
                  <ChannelItem name="APP" icon={Smartphone} value={450000} total={800000} color="#3b82f6" onClick={() => navigate('/editor?tab=distribution')} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor?tab=stats')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">各部门发稿统计</h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    查看明细
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
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

            <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-400" />
                  采编发全流程概览
                </h3>
                <button 
                  onClick={() => navigate('/editor')}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  进入流程
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div onClick={() => navigate('/reporter')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">选题策划</div>
                  <div className="text-xl font-bold text-orange-400 mt-1">28</div>
                  <div className="text-xs text-slate-500">待审选题</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/reporter')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Camera className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">素材采集</div>
                  <div className="text-xl font-bold text-green-400 mt-1">156</div>
                  <div className="text-xs text-slate-500">今日回传</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/editor')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <PenTool className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">稿件编辑</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">42</div>
                  <div className="text-xs text-slate-500">在编辑稿</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/editor?tab=review')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                    <CheckCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">三审三校</div>
                  <div className="text-xl font-bold text-yellow-400 mt-1">18</div>
                  <div className="text-xs text-slate-500">审核中</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/editor?tab=distribution')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Send className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">多端分发</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">86</div>
                  <div className="text-xs text-slate-500">今日发布</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/sentiment')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Activity className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">传播效果</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">87.5</div>
                  <div className="text-xs text-slate-500">传播指数</div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-slate-700/50 self-center"></div>
                
                <div onClick={() => navigate('/assets')} className="flex-1 min-w-[120px] flex flex-col items-center cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                    <Database className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="text-sm font-medium text-white mt-3">内容资产</div>
                  <div className="text-xl font-bold text-pink-400 mt-1">2,856</div>
                  <div className="text-xs text-slate-500">可复用素材</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor?tab=review')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    审核状态分布
                  </h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    审核留痕
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  <StatusItem label="待审核" value={12} color="#f59e0b" icon={ClockIcon} />
                  <StatusItem label="初审中" value={8} color="#3b82f6" icon={Users} />
                  <StatusItem label="复审中" value={5} color="#8b5cf6" icon={BookOpen} />
                  <StatusItem label="终审中" value={3} color="#ec4899" icon={Award} />
                  <StatusItem label="已发布" value={86} color="#10b981" icon={CheckCircle} />
                  <StatusItem label="已退回" value={6} color="#ef4444" icon={XCircle} />
                </div>
              </div>

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/editor?tab=distribution')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-400" />
                    分发去向统计
                  </h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    分发管理
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  <StatusItem label="网站" value={78} color="#3b82f6" icon={Globe} />
                  <StatusItem label="微信公众号" value={65} color="#07c160" icon={MessageCircle} />
                  <StatusItem label="微博" value={52} color="#e6162d" icon={Activity} />
                  <StatusItem label="抖音" value={38} color="#000000" icon={Tv} />
                  <StatusItem label="APP" value={45} color="#8b5cf6" icon={Smartphone} />
                  <StatusItem label="视频号" value={28} color="#07c160" icon={Video} />
                </div>
              </div>

              <div className="bg-dark-100 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all" onClick={() => navigate('/assets')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Copyright className="w-5 h-5 text-cyan-400" />
                    版权归属构成
                  </h3>
                  <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    资产管理
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  <StatusItem label="原创内容" value={1256} color="#10b981" icon={PenTool} />
                  <StatusItem label="授权转载" value={586} color="#3b82f6" icon={Share2} />
                  <StatusItem label="公共素材" value={428} color="#8b5cf6" icon={Database} />
                  <StatusItem label="待授权" value={89} color="#f59e0b" icon={ClockIcon} />
                  <StatusItem label="受限使用" value={45} color="#ef4444" icon={AlertTriangle} />
                  <StatusItem label="二次加工" value={232} color="#ec4899" icon={Mic} />
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
  };

  const activeRoleConfig = roles.find(r => r.key === activeRole) || roles[0];

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

      <div className="mb-4 flex flex-wrap gap-2 bg-dark-100 rounded-xl p-2 border border-slate-700/50">
        {roles.map((role) => {
          const RoleIcon = role.icon;
          const isActive = activeRole === role.key;
          return (
            <button
              key={role.key}
              onClick={() => setActiveRole(role.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              style={{
                backgroundColor: isActive ? `${role.color}25` : 'transparent',
                borderColor: isActive ? `${role.color}50` : 'transparent',
                borderWidth: isActive ? '1px' : '1px',
                boxShadow: isActive ? `0 0 20px ${role.color}15` : 'none',
              }}
            >
              <RoleIcon className="w-4 h-4" style={{ color: isActive ? role.color : undefined }} />
              <span style={{ color: isActive ? role.color : undefined }}>{role.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-slate-700/50 bg-dark-100 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              platformStatus.status === 'online'
                ? 'bg-emerald-500/15 text-emerald-400'
                : platformStatus.status === 'offline'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-sky-500/15 text-sky-400'
            }`}>
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">本地服务链路</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  platformStatus.status === 'online'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : platformStatus.status === 'offline'
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-sky-500/15 text-sky-300'
                }`}>
                  {platformStatus.status === 'online' ? '在线' : platformStatus.status === 'offline' ? '异常' : '检查中'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{platformStatus.message}</p>
            </div>
          </div>

          <div className="grid gap-2 text-xs text-slate-400 lg:text-right">
            <span>前端: {platformStatus.frontendUrl || '待确认'}</span>
            <span>后端: {platformStatus.backendUrl || '待确认'}</span>
            <span>SQLite: {platformStatus.sqliteLabel || '待确认'}</span>
            <span>
              最近检查:
              {' '}
              {platformStatus.checkedAt
                ? new Date(platformStatus.checkedAt).toLocaleString('zh-CN')
                : '未完成'}
            </span>
          </div>
        </div>
      </div>

      {renderRoleContent()}
    </div>
  );
}