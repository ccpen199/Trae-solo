import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  Building2,
  Award,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UsersRound,
  MapPin,
  FileText,
  Heart,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  BookCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockStats } from '../data/mockData';

interface StatCard {
  title: string;
  value: string;
  unit: string;
  icon: typeof Users;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend: string;
  trendUp: boolean;
  clickable?: boolean;
  navigatePath?: string;
  actionLabel?: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: typeof UsersRound;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  navigatePath: string;
  category: 'sanxiaxiang' | 'scholarship' | 'admin';
}

interface DepartmentRankItem {
  name: string;
  hours: number;
  rate: number;
  teamCount: number;
  avgHours: number;
}

interface BaseSatisfactionItem {
  name: string;
  score: number;
  checkins: number;
  teams: number;
}

interface MonthlyDataItem {
  month: string;
  hours: number;
  teams: number;
  logs: number;
  checkins: number;
}

const Dashboard = () => {
  useApp();
  const navigate = useNavigate();

  const statCards: StatCard[] = [
    {
      title: '参与学生数',
      value: mockStats.totalStudents.toLocaleString(),
      unit: '人',
      icon: Users,
      color: 'blue',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: '实践团队数',
      value: String(mockStats.totalTeams),
      unit: '支',
      icon: Award,
      color: 'green',
      trend: '+8.3%',
      trendUp: true,
      clickable: true,
      navigatePath: '/sanxiaxiang/teams',
      actionLabel: '查看全部团队 →',
    },
    {
      title: '总服务时长',
      value: mockStats.totalHours.toLocaleString(),
      unit: '小时',
      icon: Clock,
      color: 'orange',
      trend: '+15.2%',
      trendUp: true,
      clickable: true,
      navigatePath: '/sanxiaxiang/checkin',
      actionLabel: '查看打卡记录 →',
    },
    {
      title: '实践基地数',
      value: String(mockStats.totalBases),
      unit: '个',
      icon: Building2,
      color: 'purple',
      trend: '-2.4%',
      trendUp: false,
      clickable: true,
      navigatePath: '/admin/bases',
      actionLabel: '查看基地列表 →',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: '新建团队申报',
      description: '组建团队、关联学籍、提交审核',
      icon: UsersRound,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100',
      navigatePath: '/sanxiaxiang/teams?action=create',
      category: 'sanxiaxiang',
    },
    {
      title: '记录行程打卡',
      description: 'LBS定位 + 照片水印 + 现场描述',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      navigatePath: '/sanxiaxiang/checkin?action=create',
      category: 'sanxiaxiang',
    },
    {
      title: '撰写实践日志',
      description: 'AI自动生成摘要与关键词沉淀',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-100',
      navigatePath: '/sanxiaxiang/logs?action=create',
      category: 'sanxiaxiang',
    },
    {
      title: '捐赠方入驻',
      description: '邀请企业/基金会入驻发布资助',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      hoverBg: 'hover:bg-pink-100',
      navigatePath: '/scholarship/donors?action=create',
      category: 'scholarship',
    },
    {
      title: '发布资助项目',
      description: '发布奖学金项目、设置申请条件',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-100',
      navigatePath: '/scholarship/projects?action=create',
      category: 'scholarship',
    },
    {
      title: '分享励志故事',
      description: '匿名沉淀受助学生成长故事',
      icon: MessageCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverBg: 'hover:bg-yellow-100',
      navigatePath: '/scholarship/stories?action=create',
      category: 'scholarship',
    },
    {
      title: '团队审核认定',
      description: '指导老师/院系管理员两级审核',
      icon: ShieldCheck,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBg: 'hover:bg-red-100',
      navigatePath: '/admin/credits?action=review',
      category: 'admin',
    },
    {
      title: '学分认定工作台',
      description: '对接教育部学分标准、批量认定',
      icon: BookCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-100',
      navigatePath: '/admin/credits',
      category: 'admin',
    },
  ];

  const participationData = [
    { name: '参与率', value: mockStats.participationRate },
    { name: '未参与', value: 100 - mockStats.participationRate },
  ];

  const departmentRanking = mockStats.departmentRanking as DepartmentRankItem[];
  const baseSatisfaction = mockStats.baseSatisfaction as BaseSatisfactionItem[];
  const monthlyData = mockStats.monthlyData as MonthlyDataItem[];

  const renderLineTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload: unknown; name?: string; value?: unknown; color?: unknown; dataKey?: unknown }> };
    if (p.active && p.payload && p.payload.length) {
      const data = p.payload[0].payload as MonthlyDataItem;
      return (
        <div
          style={{
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
            padding: '12px',
          }}
        >
          <p className="text-sm font-medium text-gray-800 mb-2">{data.month}</p>
          {p.payload.map((entry, index: number) => (
            <p key={index} className="text-sm text-gray-600 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: entry.color as string }}
              />
              {entry.name}: {entry.value as number}
              {entry.dataKey === 'hours' ? ' 小时' : ' 支'}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            日志数: {data.logs}篇 / 打卡数: {data.checkins}次
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload: unknown }> };
    if (p.active && p.payload && p.payload.length) {
      const data = p.payload[0].payload as DepartmentRankItem;
      return (
        <div
          style={{
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
            padding: '12px',
          }}
        >
          <p className="text-sm font-medium text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600 mb-2">
            服务时长: {data.hours.toLocaleString()} 小时
          </p>
          <p className="text-xs text-blue-500 font-medium">👉 点击查看该系全部团队</p>
        </div>
      );
    }
    return null;
  };

  const deptColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-purple-100 text-purple-600';
    }
  };

  const categoryLabels: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
    sanxiaxiang: { label: '三下乡专项', icon: Sparkles, color: 'text-blue-600' },
    scholarship: { label: '奖学金共享', icon: Heart, color: 'text-pink-600' },
    admin: { label: '后台管理', icon: ShieldCheck, color: 'text-gray-600' },
  };

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className="space-y-6">
      {/* 顶部数据统计卡 */}
      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-200 ${
              card.clickable
                ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5'
                : ''
            }`}
            onClick={() => {
              if (card.clickable && card.navigatePath) {
                navigate(card.navigatePath);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-800">
                    {card.value}
                  </span>
                  <span className="text-sm text-gray-500">{card.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {card.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      card.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="text-xs text-gray-400">同比</span>
                </div>
                {card.clickable && card.actionLabel && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    {card.actionLabel}
                  </div>
                )}
              </div>
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${deptColorClasses(
                  card.color
                )}`}
              >
                <card.icon className="w-7 h-7" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷业务入口 - 3组分类 */}
      {(['sanxiaxiang', 'scholarship', 'admin'] as const).map((cat) => {
        const catInfo = categoryLabels[cat];
        const CatIcon = catInfo.icon;
        return (
          <div key={cat} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <CatIcon className={`w-5 h-5 ${catInfo.color}`} />
              <h3 className="text-lg font-semibold text-gray-800">{catInfo.label}</h3>
              <span className="text-xs text-gray-400 ml-2">快速进入业务流程</span>
            </div>
            <div className={`grid gap-4 ${
              groupedActions[cat]?.length === 3 ? 'grid-cols-3' :
              groupedActions[cat]?.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {groupedActions[cat]?.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(action.navigatePath)}
                    className={`p-5 rounded-xl border-2 ${action.borderColor} ${action.bgColor} ${action.hoverBg} cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${action.bgColor} ${action.color} flex items-center justify-center border ${action.borderColor} group-hover:scale-110 transition-transform`}>
                        <ActionIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-base font-bold ${action.color}`}>
                            {action.title}
                          </h4>
                          <ArrowRight className={`w-4 h-4 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {action.description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                          立即进入 <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 服务时长趋势 + 参与率 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">服务时长趋势</h3>
              <p className="text-xs text-gray-400 mt-0.5">可追溯：点击团队数卡查看明细</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-500">服务时长</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-500">团队数</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip content={renderLineTooltip} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="服务时长"
                />
                <Line
                  type="monotone"
                  dataKey="teams"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                  name="团队数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5"
          onClick={() => navigate('/admin/departments')}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">学生参与率</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold text-blue-600">
              {mockStats.participationRate}%
            </span>
            <p className="text-sm text-gray-500 mt-1">整体参与率</p>
            <div className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              查看院系排行
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP院系 + 基地满意度 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                服务时长TOP院系
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">点击条形或行可查看该院系全部团队</p>
            </div>
            <button
              onClick={() => navigate('/admin/departments')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              全部院系
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentRanking}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                  width={80}
                />
                <Tooltip content={renderBarTooltip} />
                <Bar
                  dataKey="hours"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  name="服务时长"
                  cursor="pointer"
                  onClick={(data) =>
                    navigate(
                      `/sanxiaxiang/teams?dept=${encodeURIComponent(
                        (data as unknown as { payload: DepartmentRankItem }).payload.name
                      )}`
                    )
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              <div className="col-span-1">排名</div>
              <div className="col-span-3">院系名</div>
              <div className="col-span-2 text-right">总时长</div>
              <div className="col-span-1 text-right">团队</div>
              <div className="col-span-2 text-right">参与率</div>
              <div className="col-span-2 text-right">人均</div>
              <div className="col-span-1"></div>
            </div>
            {departmentRanking.map((dept, index) => (
              <div
                key={dept.name}
                className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 items-center group"
                onClick={() =>
                  navigate(
                    `/sanxiaxiang/teams?dept=${encodeURIComponent(dept.name)}`
                  )
                }
              >
                <div className="col-span-1">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      index < 3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="col-span-3 text-sm font-medium text-gray-700 truncate">
                  {dept.name}
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right font-medium">
                  {dept.hours.toLocaleString()}h
                </div>
                <div className="col-span-1 text-sm text-gray-500 text-right">
                  {dept.teamCount}
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right">
                  {dept.rate}%
                </div>
                <div className="col-span-2 text-sm text-gray-500 text-right">
                  {dept.avgHours}h
                </div>
                <div className="col-span-1 flex justify-end">
                  <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                基地满意度排名
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">点击行可查看基地详情、打卡记录</p>
            </div>
            <button
              onClick={() => navigate('/admin/bases')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              全部基地
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {baseSatisfaction.map((base, index) => (
              <div
                key={base.name}
                className="flex items-center gap-4 p-3.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                onClick={() =>
                  navigate(
                    `/admin/bases?base=${encodeURIComponent(base.name)}`
                  )
                }
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ${
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {base.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {base.teams}个团队 · {base.checkins}次打卡
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-600 ml-2 flex-shrink-0 bg-green-50 px-2 py-0.5 rounded">
                      {base.score}分
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${base.score}%` }}
                    ></div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
