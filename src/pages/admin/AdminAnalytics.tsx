import {
  BarChart3,
  Users,
  PawPrint,
  Cpu,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Award,
  Calendar,
  ChevronRight,
  TrendingDown,
  Clock,
  Volume2,
  PieChart,
  LineChart,
  BarChart2,
  MoreVertical,
  Sparkles,
  CircleUser,
  Heart,
} from "lucide-react";

export default function AdminAnalytics() {
  const weekDays = ["06/09", "06/10", "06/11", "06/12", "06/13", "06/14", "06/15"];

  const trendData = {
    labels: weekDays,
    analyses: [980, 1120, 1340, 1080, 1450, 1580, 1692],
    activeUsers: [620, 710, 850, 780, 920, 1050, 1150],
    trainings: [320, 380, 420, 410, 480, 520, 580],
  };

  const categoryData = [
    { category: "基础服从", trained: 342, accuracy: 0.89, color: "from-brand-mint to-brand-mint-light", donutColor: "brand" },
    { category: "技能训练", trained: 218, accuracy: 0.85, color: "from-brand-orange to-brand-orange-light", donutColor: "orange" },
    { category: "行为纠正", trained: 156, accuracy: 0.78, color: "from-violet-500 to-violet-400", donutColor: "violet" },
    { category: "社交训练", trained: 98, accuracy: 0.82, color: "from-sky-500 to-sky-400", donutColor: "sky" },
    { category: "敏捷训练", trained: 67, accuracy: 0.91, color: "from-pink-500 to-pink-400", donutColor: "pink" },
    { category: "其他", trained: 45, accuracy: 0.76, color: "from-amber-500 to-amber-400", donutColor: "amber" },
  ];
  const maxTrained = Math.max(...categoryData.map((d) => d.trained));

  const topEmotions = [
    { name: "开心", count: 2456, percentage: 28.1, color: "bg-brand-mint" },
    { name: "饥饿", count: 1823, percentage: 20.9, color: "bg-brand-orange" },
    { name: "困倦", count: 1456, percentage: 16.7, color: "bg-violet-500" },
    { name: "玩耍", count: 1234, percentage: 14.1, color: "bg-sky-500" },
    { name: "好奇", count: 987, percentage: 11.3, color: "bg-pink-500" },
    { name: "其他", count: 786, percentage: 8.9, color: "bg-amber-500" },
  ];

  const weeklySummary = [
    { label: "声纹分析次数", value: "8,742", change: 15.3, up: true, icon: Volume2 },
    { label: "新增样本提交", value: "342", change: 8.6, up: true, icon: Cpu },
    { label: "审核通过样本", value: "298", change: 12.1, up: true, icon: Award },
    { label: "模型总调用量", value: "45,621", change: 22.4, up: true, icon: Zap },
  ];

  const maxTrend = Math.max(
    ...trendData.analyses,
    ...trendData.activeUsers,
    ...trendData.trainings,
  );

  const buildLinePath = (data: number[]) => {
    const max = maxTrend;
    const width = 560;
    const height = 180;
    const padding = 16;
    const stepX = (width - padding * 2) / (data.length - 1);
    const pointsStr = data.map((v, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    });
    const pointsObj = data.map((v, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (v / max) * (height - padding * 2);
      return { x, y };
    });
    const pathD = `M ${pointsStr.join(" L ")}`;
    const areaD =
      `M ${padding},${height - padding} L ${pointsStr.join(" L ")} L ${width - padding},${height - padding} Z`;
    return { line: pathD, area: areaD, points: pointsObj };
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-mint/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-brand-mint" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">训练效果数据中心</h1>
            <p className="text-sm text-gray-400">
              全面掌握模型训练效果与用户使用数据
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8 animate-slide-up">
        <DataCard
          label="累计用户"
          value="12,847"
          icon={Users}
          trend={12.5}
          trendUp
          color="mint"
          subText="本周新增 486"
        />
        <DataCard
          label="宠物档案"
          value="18,932"
          icon={PawPrint}
          trend={9.2}
          trendUp
          color="orange"
          subText="本周新增 312"
        />
        <DataCard
          label="模型准确率"
          value="92.4%"
          icon={Target}
          trend={1.8}
          trendUp
          color="violet"
          subText="v2.3.1 版本"
        />
        <DataCard
          label="平均响应"
          value="0.23s"
          icon={Activity}
          trend={5.6}
          trendUp={false}
          color="sky"
          subText="较上周优化"
        />
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5 mb-8 animate-slide-up stagger-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-mint/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-mint" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">本周数据概览</h2>
              <p className="text-xs text-gray-400">
                06月09日 - 06月15日
              </p>
            </div>
          </div>
          <button className="p-2 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {weeklySummary.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 hover:border-gray-600/50 transition-all animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-mint/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-mint" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      item.up ? "text-brand-mint" : "text-rose-400"
                    }`}
                  >
                    {item.up ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.change}%
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-white">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">训练分类效果</h3>
                <p className="text-xs text-gray-400">各训练类型训练次数与准确率</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors">
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-5">
            {categoryData.map((item, idx) => (
              <div
                key={item.category}
                className="animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0">
                      <Donut value={item.accuracy} color={item.donutColor} />
                    </div>
                    <div>
                      <span className="text-sm text-gray-200 font-medium block">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {item.trained} 次训练
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            item.accuracy >= 0.85
                              ? "text-brand-mint"
                              : item.accuracy >= 0.8
                                ? "text-amber-400"
                                : "text-rose-400"
                          }`}
                        >
                          准确率 {(item.accuracy * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative h-6 w-full bg-gray-700/50 rounded-lg overflow-hidden ml-15">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color} rounded-lg transition-all duration-700 ease-out`}
                    style={{
                      width: `${(item.trained / maxTrained) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-white/90">
                      {Math.round((item.trained / maxTrained) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">情绪识别分布</h3>
                <p className="text-xs text-gray-400">本周识别情绪类别占比</p>
              </div>
            </div>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>

          <div className="space-y-3 mb-6">
            {topEmotions.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${item.color}`}
                />
                <span className="text-sm text-gray-300 w-16">{item.name}</span>
                <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.percentage * 3}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-gray-200 w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-mint/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand-mint" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">识别准确率提升</p>
              <p className="text-xs text-gray-400">
                相比上周整体准确率提升 1.8%，「饥饿」识别准确率最高达 95.2%
              </p>
            </div>
            <span className="text-xl font-bold text-brand-mint">+1.8%</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5 animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-mint/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-mint" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">使用趋势折线</h3>
              <p className="text-xs text-gray-400">近7天各项核心指标变化</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {[
              { label: "声纹分析", color: "bg-brand-mint", key: "analyses" },
              { label: "活跃用户", color: "bg-sky-500", key: "activeUsers" },
              { label: "训练次数", color: "bg-brand-orange", key: "trainings" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full h-56">
          <svg
            viewBox="0 0 600 200"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gradAnalyses" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradActiveUsers" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradTrainings" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF8A5B" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FF8A5B" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="40"
                x2="560"
                y1={20 + i * 36}
                y2={20 + i * 36}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            ))}

            {Object.entries({
              analyses: { color: "#4ECDC4", grad: "gradAnalyses", data: trendData.analyses },
              activeUsers: { color: "#0ea5e9", grad: "gradActiveUsers", data: trendData.activeUsers },
              trainings: { color: "#FF8A5B", grad: "gradTrainings", data: trendData.trainings },
            }).map(([key, cfg]) => {
              const { line, area, points } = buildLinePath(cfg.data);
              return (
                <g key={key}>
                  <path d={area} fill={`url(#${cfg.grad})`} />
                  <path
                    d={line}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#1f2937"
                        stroke={cfg.color}
                        strokeWidth="2.5"
                      />
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>

          <div className="flex justify-between text-xs text-gray-500 mt-3 px-4">
            {trendData.labels.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            {
              label: "声纹分析峰值",
              value: "1,692",
              time: "06/15",
              color: "mint",
              icon: Volume2,
            },
            {
              label: "活跃用户峰值",
              value: "1,150",
              time: "06/15",
              color: "sky",
              icon: CircleUser,
            },
            {
              label: "训练次数峰值",
              value: "580",
              time: "06/15",
              color: "orange",
              icon: Target,
            },
          ].map((item) => {
            const Icon = item.icon;
            const iconBg = {
              mint: "bg-brand-mint/15",
              sky: "bg-sky-500/15",
              orange: "bg-brand-orange/15",
            }[item.color];
            const iconText = {
              mint: "text-brand-mint",
              sky: "text-sky-400",
              orange: "text-brand-orange",
            }[item.color];
            return (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${iconText}`} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      {item.value}
                    </span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <InsightCard
          icon={TrendingUp}
          title="用户留存趋势"
          description="7日留存率达到 68.4%，较上周提升 4.2 个百分点"
          value="68.4%"
          color="mint"
        />
        <InsightCard
          icon={Heart}
          title="训练完成率"
          description="本周训练平均完成率 87.6%，训练效果持续改善"
          value="87.6%"
          color="orange"
        />
        <InsightCard
          icon={Clock}
          title="日均使用时长"
          description="人均日均使用时长 12.4 分钟，用户粘性稳步增长"
          value="12.4分"
          color="violet"
        />
      </div>
    </div>
  );
}

function DataCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
  subText,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  trend: number;
  trendUp: boolean;
  color: "mint" | "orange" | "violet" | "sky";
  subText: string;
}) {
  const colors = {
    mint: {
      bg: "bg-brand-mint/15",
      text: "text-brand-mint",
      value: "text-brand-mint",
    },
    orange: {
      bg: "bg-brand-orange/15",
      text: "text-brand-orange",
      value: "text-brand-orange",
    },
    violet: {
      bg: "bg-violet-500/15",
      text: "text-violet-400",
      value: "text-violet-400",
    },
    sky: {
      bg: "bg-sky-500/15",
      text: "text-sky-400",
      value: "text-sky-400",
    },
  }[color];

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trendUp
              ? "bg-brand-mint/15 text-brand-mint"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {trendUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend}%
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-1 ${colors.value}`}>{value}</p>
      <p className="text-xs text-gray-500">{subText}</p>
    </div>
  );
}

function Donut({ value, color }: { value: number; color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  const strokeColor: Record<string, string> = {
    brand: "#4ECDC4",
    orange: "#FF8A5B",
    violet: "#8b5cf6",
    sky: "#0ea5e9",
    pink: "#ec4899",
    amber: "#f59e0b",
  };

  return (
    <svg viewBox="0 0 52 52" className="-rotate-90 w-full h-full">
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke="#374151"
        strokeWidth="5"
      />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={strokeColor[color] || "#4ECDC4"}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
      />
    </svg>
  );
}

function InsightCard({
  icon: Icon,
  title,
  description,
  value,
  color,
}: {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  value: string;
  color: "mint" | "orange" | "violet";
}) {
  const colors = {
    mint: {
      bg: "from-brand-mint/10 to-brand-mint/5",
      border: "border-brand-mint/20",
      iconBg: "bg-brand-mint/20",
      icon: "text-brand-mint",
      text: "text-brand-mint",
    },
    orange: {
      bg: "from-brand-orange/10 to-brand-orange/5",
      border: "border-brand-orange/20",
      iconBg: "bg-brand-orange/20",
      icon: "text-brand-orange",
      text: "text-brand-orange",
    },
    violet: {
      bg: "from-violet-500/10 to-violet-500/5",
      border: "border-violet-500/20",
      iconBg: "bg-violet-500/20",
      icon: "text-violet-400",
      text: "text-violet-400",
    },
  }[color];

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} backdrop-blur rounded-2xl p-5 border ${colors.border} animate-slide-up`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h4 className="font-semibold text-white">{title}</h4>
            <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
