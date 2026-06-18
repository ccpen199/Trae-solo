import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  MessageCircleWarning,
  ArrowUpRight,
  AlertTriangle,
  Gift,
  Shield,
  Heart,
  ShoppingCart,
  Wallet,
  Clock,
  Eye,
  CheckCircle2,
  TimerReset,
  XCircle,
  ArrowRight,
  BarChart3,
  Activity,
  Store,
  Package,
  HandCoins,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

const healthCards = [
  {
    icon: Activity,
    title: '社区健康综合指数',
    value: '86.5',
    suffix: '分',
    delta: '+3.2',
    trend: 'up',
    color: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-100',
    desc: '基于发帖活跃度/交易转化率/投诉响应/红包活跃度加权',
  },
  {
    icon: Users,
    title: '实名住户总数',
    value: '12,580',
    suffix: '人',
    delta: '+286',
    trend: 'up',
    color: 'from-primary-500 to-indigo-500',
    ring: 'ring-primary-100',
    desc: '实名认证通过人数，较上周+2.3%',
  },
  {
    icon: Building2,
    title: '接入社区数',
    value: '24',
    suffix: '个',
    delta: '+2',
    trend: 'up',
    color: 'from-blue-500 to-cyan-500',
    ring: 'ring-blue-100',
    desc: '子域独立部署，物业 SAML 对接 19 个',
  },
  {
    icon: ShoppingCart,
    title: '半径优选 GMV',
    value: '¥628.4K',
    delta: '+18.5%',
    trend: 'up',
    color: 'from-orange-500 to-amber-500',
    ring: 'ring-orange-100',
    desc: '本月累计（自营仓配 ¥412K + 物业代收 ¥216K）',
  },
  {
    icon: HandCoins,
    title: '担保交易总额',
    value: '¥227.8K',
    delta: '+24.3%',
    trend: 'up',
    color: 'from-purple-500 to-pink-500',
    ring: 'ring-purple-100',
    desc: '二手担保 412 笔，0 纠纷，待释放 38 笔',
  },
  {
    icon: Gift,
    title: '小金库红包池',
    value: '¥52,300',
    delta: '-¥8.2K',
    trend: 'down',
    color: 'from-rose-500 to-red-500',
    ring: 'ring-rose-100',
    desc: '当日发放 ¥8,200 · 待审核提现 7 笔',
  },
];

const dailyMetrics = [
  { date: '06-12', posts: 142, transactions: 78, conversion: 3.8, complaintRes: 12 },
  { date: '06-13', posts: 168, transactions: 92, conversion: 4.1, complaintRes: 18 },
  { date: '06-14', posts: 155, transactions: 88, conversion: 4.0, complaintRes: 10 },
  { date: '06-15', posts: 180, transactions: 105, conversion: 4.5, complaintRes: 14 },
  { date: '06-16', posts: 195, transactions: 118, conversion: 4.8, complaintRes: 16 },
  { date: '06-17', posts: 210, transactions: 132, conversion: 5.1, complaintRes: 13 },
  { date: '06-18', posts: 232, transactions: 145, conversion: 5.4, complaintRes: 19 },
];

const responseTimeData = [
  { date: '06-12', avgMin: 22, resolved24h: 72 },
  { date: '06-13', avgMin: 19, resolved24h: 78 },
  { date: '06-14', avgMin: 25, resolved24h: 70 },
  { date: '06-15', avgMin: 16, resolved24h: 82 },
  { date: '06-16', avgMin: 14, resolved24h: 85 },
  { date: '06-17', avgMin: 12, resolved24h: 89 },
  { date: '06-18', avgMin: 10, resolved24h: 92 },
];

const topCommunities = [
  { rank: 1, name: '朝阳家园', subdomain: 'chaoyang', posts: 1284, users: 2486, gmv: '¥186K', health: 92.4 },
  { rank: 2, name: '海淀花园', subdomain: 'haidian', posts: 1156, users: 2120, gmv: '¥158K', health: 90.1 },
  { rank: 3, name: '东城景苑', subdomain: 'dongcheng', posts: 982, users: 1860, gmv: '¥132K', health: 88.7 },
  { rank: 4, name: '西城国际', subdomain: 'xicheng', posts: 870, users: 1640, gmv: '¥116K', health: 85.3 },
  { rank: 5, name: '望京新城', subdomain: 'wangjing', posts: 812, users: 1520, gmv: '¥98K', health: 83.6 },
];

const activityStream = [
  { id: 1, type: 'escrow', icon: Shield, color: 'text-purple-500 bg-purple-50', title: '二手担保交易 #ESC-20260618-0842 买家确认收货', desc: '海淀花园·李华 → 张建国，¥1,280 已释放', time: '2 分钟前', tag: '担保释放' },
  { id: 2, type: 'post', icon: BarChart3, color: 'text-primary-500 bg-primary-50', title: '朝阳家园话题 #TY-28471 命中敏感词过滤', desc: '涉及"赌博"关键词，已自动遮蔽待审核', time: '5 分钟前', tag: '内容风控' },
  { id: 3, type: 'withdraw', icon: Wallet, color: 'text-orange-500 bg-orange-50', title: '合伙人分润提现申请 #WD-1872', desc: '朝阳·王芳 ¥5,680，待审核 · 三级邀请链', time: '11 分钟前', tag: '提现待审' },
  { id: 4, type: 'complaint', icon: Clock, color: 'text-red-500 bg-red-50', title: '投诉 #CP-4729 响应超时预警', desc: '东城景苑·装修噪音投诉，已过 32 分钟未响应', time: '32 分钟前', tag: 'SLA预警' },
  { id: 5, type: 'sso', icon: Building2, color: 'text-green-500 bg-green-50', title: '朝阳家园物业 SAML 同步完成', desc: '同步 12 名物业员工账号，门禁权限 1,248 条', time: '1 小时前', tag: 'SAML对接' },
  { id: 6, type: 'redpacket', icon: Gift, color: 'text-rose-500 bg-rose-50', title: '小金库任务批量发放完成', desc: '今日签到 3,240 人 · 邀请红包 186 笔 · 合计 ¥8,240', time: '2 小时前', tag: '资金池' },
];

const pendingTodos = [
  { id: 1, title: '审核敏感话题 #TY-28471、#TY-28468', count: 3, icon: Eye, color: 'text-amber-500', priority: 'high' },
  { id: 2, title: '审批合伙人提现申请（含反洗钱校验）', count: 7, icon: Wallet, color: 'text-orange-500', priority: 'high' },
  { id: 3, title: '响应超时投诉跟进（东城景苑/望京新城）', count: 4, icon: Clock, color: 'text-red-500', priority: 'high' },
  { id: 4, title: '本周新入驻社区物业 SAML 配置', count: 2, icon: Building2, color: 'text-green-500', priority: 'medium' },
  { id: 5, title: '半径优选自营仓库存盘点同步', count: 1, icon: Package, color: 'text-blue-500', priority: 'low' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">管理后台 · 数据概览</h1>
          <p className="text-sm text-gray-500 mt-1">实时监控全平台社区健康度、交易风控、资金池与业务承接</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            24 个子域 · 实时同步
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {healthCards.map((card) => (
          <div key={card.title} className="card relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br ${card.color} opacity-5 -mr-12 -mt-12`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-lg shadow-black/5`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                  {card.delta}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</span>
                {card.suffix && <span className="text-sm text-gray-500 font-medium">{card.suffix}</span>}
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{card.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">发帖活跃度 & 交易转化</h3>
              <p className="text-xs text-gray-400 mt-0.5">近 7 日发帖数 vs 交易转化率%</p>
            </div>
            <Link to="/admin/community-health" className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              查看明细 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="posts" fill="#0074c7" radius={[4, 4, 0, 0]} name="发帖数" />
              <Bar dataKey="transactions" fill="#22c55e" radius={[4, 4, 0, 0]} name="交易笔数" />
              <Line type="monotone" dataKey="conversion" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} name="转化率%" yAxisId={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">投诉响应时长 & 24h 解决率</h3>
              <p className="text-xs text-gray-400 mt-0.5">核心SLA：24h 解决率 92%（目标 ≥85%）</p>
            </div>
            <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              达标 ✓
            </div>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="avgMin" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="平均响应(分钟)" />
              <Line yAxisId="right" type="monotone" dataKey="resolved24h" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="24h解决率%" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">社区健康度排行榜（TOP 5）</h3>
              <p className="text-xs text-gray-400 mt-0.5">基于发帖、交易、投诉、红包活跃度四维综合评分</p>
            </div>
            <Link to="/admin/community-health" className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              健康度详情 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-6 py-2.5 font-medium">#</th>
                  <th className="text-left px-6 py-2.5 font-medium">社区 / 子域</th>
                  <th className="text-right px-6 py-2.5 font-medium">发帖</th>
                  <th className="text-right px-6 py-2.5 font-medium">住户</th>
                  <th className="text-right px-6 py-2.5 font-medium">GMV</th>
                  <th className="text-right px-6 py-2.5 font-medium">健康度</th>
                </tr>
              </thead>
              <tbody>
                {topCommunities.map((c) => (
                  <tr key={c.subdomain} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3">
                      <span className={`w-6 h-6 inline-flex items-center justify-center text-xs font-bold rounded-full ${c.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.rank}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{c.subdomain}.neighborhood.cn</div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700 font-medium tabular-nums">{c.posts.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-700 font-medium tabular-nums">{c.users.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-900 font-bold tabular-nums">{c.gmv}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${c.health >= 90 ? 'from-emerald-400 to-teal-500' : 'from-primary-400 to-indigo-500'}`}
                            style={{ width: `${c.health}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 tabular-nums w-12 text-right">{c.health}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">待办事项</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold">{pendingTodos.reduce((s, t) => s + t.count, 0)} 项</span>
          </div>
          <div className="space-y-2.5">
            {pendingTodos.map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition">
                <div className={`mt-0.5 ${t.color}`}><t.icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 leading-snug">{t.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{t.count} 条</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      t.priority === 'high' ? 'bg-red-50 text-red-600' : t.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {t.priority === 'high' ? '高优先级' : t.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">实时业务活动流</h3>
            <p className="text-xs text-gray-400 mt-0.5">担保交易、内容风控、资金池、SAML 对接、投诉响应等事件</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 正常</span>
            <span className="flex items-center gap-1"><TimerReset className="w-3 h-3 text-amber-500" /> 待处理</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> 预警</span>
          </div>
        </div>
        <div className="space-y-1 -mx-2">
          {activityStream.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    item.tag.includes('预警') || item.tag.includes('待审') ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{item.time}</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Activity, label: '社区健康度', link: '/admin/community-health', color: 'text-emerald-600 bg-emerald-50' },
          { icon: BarChart3, label: '溯源日志', link: '/admin/trace-logs', color: 'text-primary-600 bg-primary-50' },
          { icon: Shield, label: '风控中心', link: '/admin/risk-control', color: 'text-purple-600 bg-purple-50' },
          { icon: Store, label: '交易管理', link: '/admin/transactions', color: 'text-orange-600 bg-orange-50' },
          { icon: HandCoins, label: '合伙人分润', link: '/admin/partners', color: 'text-amber-600 bg-amber-50' },
          { icon: Building2, label: '物业对接', link: '/admin/property-integration', color: 'text-green-600 bg-green-50' },
        ].map((m) => (
          <Link key={m.label} to={m.link} className="card hover:shadow-md transition-all hover:-translate-y-0.5 text-center group">
            <div className={`w-11 h-11 rounded-xl mx-auto flex items-center justify-center mb-2 ${m.color} group-hover:scale-110 transition-transform`}>
              <m.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-800">{m.label}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1 text-[11px] text-primary-600 opacity-0 group-hover:opacity-100 transition">
              进入 <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
