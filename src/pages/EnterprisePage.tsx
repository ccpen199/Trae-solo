import { useState } from "react";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { mockROIData, mockCompletionRateData, mockUserAgeDistribution } from "@/data/mockData";
import {
  Plus,
  Video,
  FileText,
  Heart,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  PieChart,
  Zap,
  Settings2,
  ChevronRight,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  SlidersHorizontal,
  Upload,
  Store,
} from "lucide-react";
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
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { TaskTemplate, Task } from "@/types";

const templateIconMap: Record<string, React.ElementType> = {
  Video,
  FileText,
  Heart,
  Users,
  Package,
  Store,
};

export default function EnterprisePage() {
  const {
    currentEnterprise,
    taskTemplates,
    tasks,
    createTask,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "templates" | "tasks" | "pricing">("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  const enterpriseTasks = tasks.filter((t) => t.enterpriseId === currentEnterprise.id);

  const totalViews = enterpriseTasks.reduce((sum, t) => sum + t.views, 0);
  const totalClicks = enterpriseTasks.reduce((sum, t) => sum + t.clicks, 0);
  const totalConversions = enterpriseTasks.reduce((sum, t) => sum + t.completed, 0);
  const totalSpent = enterpriseTasks.reduce((sum, t) => sum + t.completed * t.reward, 0);

  const handleUseTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateTask = () => {
    if (selectedTemplate) {
      createTask({
        title: `新建${selectedTemplate.name}任务`,
        type: selectedTemplate.type,
        description: selectedTemplate.description,
        reward: 5,
        quota: 1000,
      });
      setSelectedTemplate(null);
      setActiveTab("tasks");
    }
  };

  const taskStatusConfig = {
    active: { label: "进行中", icon: PlayCircle, color: "text-success-500", bg: "bg-success-500/10" },
    paused: { label: "已暂停", icon: PauseCircle, color: "text-warning-500", bg: "bg-warning-500/10" },
    completed: { label: "已完成", icon: CheckCircle2, color: "text-cyber-cyan-400", bg: "bg-cyber-cyan-500/10" },
    draft: { label: "草稿", icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10" },
    closed: { label: "已关闭", icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10" },
  };

  return (
    <MainLayout title="企业工作台" subtitle={`${currentEnterprise.name} · 已认证企业`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {[
            { key: "dashboard", label: "数据看板", icon: BarChart3 },
            { key: "templates", label: "任务模板", icon: FileText },
            { key: "tasks", label: "我的任务", icon: Target },
            { key: "pricing", label: "动态定价", icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  isActive
                    ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-5">
              <StatCard
                title="账户余额"
                value={`¥${currentEnterprise.balance.toLocaleString()}`}
                icon={<DollarSign className="w-6 h-6" />}
                subtitle={`总预算 ¥${currentEnterprise.totalBudget.toLocaleString()}`}
                accentColor="#FFB800"
              />
              <StatCard
                title="任务曝光量"
                value={totalViews.toLocaleString()}
                icon={<Eye className="w-6 h-6" />}
                trend={15.3}
                trendLabel="较上周"
                accentColor="#00F0FF"
              />
              <StatCard
                title="点击转化率"
                value={`${((totalClicks / totalViews) * 100).toFixed(1)}%`}
                icon={<MousePointer className="w-6 h-6" />}
                trend={3.2}
                trendLabel="较上周"
                accentColor="#00E676"
              />
              <StatCard
                title="完成转化数"
                value={totalConversions.toLocaleString()}
                icon={<CheckCircle2 className="w-6 h-6" />}
                trend={8.7}
                trendLabel="较上周"
                accentColor="#FF9100"
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">ROI 趋势分析</h3>
                    <p className="text-sm text-gray-500 mt-1">近7天投入产出对比</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyber-cyan-500" />
                      <span className="text-gray-400">投入成本</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-success-500" />
                      <span className="text-gray-400">转化价值</span>
                    </span>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockROIData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#00F0FF"
                        fill="url(#colorCost)"
                        name="投入(元)"
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00E676"
                        fill="url(#colorRevenue)"
                        name="价值(元)"
                      />
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-2">用户画像分布</h3>
                <p className="text-sm text-gray-500 mb-6">按年龄段分布</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockUserAgeDistribution.reduce((acc: { range: string; male: number; female: number }[], curr) => {
                        const existing = acc.find((a) => a.range === curr.range);
                        if (existing) {
                          if (curr.gender === "male") existing.male = curr.count;
                          else existing.female = curr.count;
                        } else {
                          acc.push({
                            range: curr.range,
                            male: curr.gender === "male" ? curr.count : 0,
                            female: curr.gender === "female" ? curr.count : 0,
                          });
                        }
                        return acc;
                      }, [])}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="range" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="male" fill="#00F0FF" name="男性" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" fill="#FF9100" name="女性" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">任务完成率走势</h3>
                  <p className="text-sm text-gray-500 mt-1">近7日完成率与目标对比</p>
                </div>
                <span className="tag tag-red flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 rotate-180" />
                  拐点预警
                </span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockCompletionRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1628",
                        border: "1px solid rgba(0,240,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#666"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      name="目标"
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#FF3D71"
                      strokeWidth={2}
                      dot={{ fill: "#FF3D71", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="实际完成率"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">任务模板库</h3>
                <p className="text-sm text-gray-500 mt-1">选择预设模板快速创建任务，或自定义任务类型</p>
              </div>
              <button className="btn-secondary flex items-center gap-2">
                <Upload className="w-4 h-4" />
                导入模板
              </button>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {taskTemplates.map((template) => {
                const Icon = templateIconMap[template.icon] || FileText;
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "glass-card-hover p-6 cursor-pointer relative",
                      isSelected && "border-cyber-cyan-500/50 shadow-glow-cyan"
                    )}
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyber-cyan-500/10 border border-cyber-cyan-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-cyber-cyan-400" />
                      </div>
                      <span className="tag tag-cyan text-xs">
                        使用 {template.usageCount.toLocaleString()} 次
                      </span>
                    </div>

                    <h4 className="text-base font-medium text-white mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500">
                        类型：
                        {template.type === "media" && "媒体类"}
                        {template.type === "survey" && "调研类"}
                        {template.type === "experience" && "体验类"}
                      </span>
                      <button className="text-cyber-cyan-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                        使用模板
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="glass-card p-6 border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-cyber-cyan-500/30 hover:bg-cyber-cyan-500/5 transition-all">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">创建自定义模板</p>
                <p className="text-xs text-gray-600 mt-1">根据您的需求定制</p>
              </div>
            </div>

            {selectedTemplate && (
              <div className="glass-card p-6 border-cyber-cyan-500/30">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-1">
                      使用「{selectedTemplate.name}」创建任务
                    </h4>
                    <p className="text-sm text-gray-500">基于模板快速配置，支持自定义修改</p>
                  </div>
                  <button
                    onClick={handleCreateTask}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    创建任务
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select className="input-field w-40 text-sm">
                  <option>全部状态</option>
                  <option>进行中</option>
                  <option>已暂停</option>
                  <option>已完成</option>
                  <option>草稿</option>
                </select>
                <select className="input-field w-40 text-sm">
                  <option>全部类型</option>
                  <option>媒体类</option>
                  <option>调研类</option>
                  <option>体验类</option>
                </select>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新建任务
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="table-header">任务名称</th>
                    <th className="table-header">类型</th>
                    <th className="table-header">赏金</th>
                    <th className="table-header">进度</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {enterpriseTasks.map((task: Task) => {
                    const statusConfig = taskStatusConfig[task.status];
                    const StatusIcon = statusConfig.icon;
                    const progress = (task.completed / task.quota) * 100;
                    return (
                      <tr key={task.id} className="hover:bg-white/5 transition-colors">
                        <td className="table-cell">
                          <div>
                            <p className="text-white font-medium">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.enterpriseName}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="tag tag-cyan">
                            {task.type === "media" && "媒体类"}
                            {task.type === "survey" && "调研类"}
                            {task.type === "experience" && "体验类"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-amber-gold-400 font-medium">
                            ¥{task.reward}
                          </span>
                        </td>
                        <td className="table-cell w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">
                              {task.completed}/{task.quota}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={cn("tag", statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button className="text-cyber-cyan-400 hover:text-cyber-cyan-300 text-sm">
                              详情
                            </button>
                            <button className="text-gray-400 hover:text-white text-sm">
                              编辑
                            </button>
                            <Settings2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">动态定价引擎</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    根据任务难度、完成率和市场行情实时调整赏金，最大化ROI
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tag tag-green flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    已启用
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">基础赏金</label>
                      <span className="text-cyber-cyan-400 font-mono">¥2.00</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="50"
                      step="0.5"
                      defaultValue="2"
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">难度系数倍率</label>
                      <span className="text-cyber-cyan-400 font-mono">1.5x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      defaultValue="1.5"
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">完成率触发阈值</label>
                      <span className="text-cyber-cyan-400 font-mono">60%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      defaultValue="60"
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">自动加价幅度</label>
                      <span className="text-amber-gold-400 font-mono">+25%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      defaultValue="25"
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">最高赏金上限</label>
                      <span className="text-danger-400 font-mono">¥10.00</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="100"
                      step="1"
                      defaultValue="10"
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-danger-500"
                    />
                  </div>
                </div>

                <div className="bg-deep-space-950/50 rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-medium mb-4">推荐定价曲线</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { diff: 1, price: 2, demand: 5000 },
                          { diff: 2, price: 3.5, demand: 3000 },
                          { diff: 3, price: 5.5, demand: 1500 },
                          { diff: 4, price: 8, demand: 600 },
                          { diff: 5, price: 12, demand: 200 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="diff" stroke="#666" fontSize={12} label={{ value: "难度等级", fill: "#666", fontSize: 11 }} />
                        <YAxis yAxisId="left" stroke="#666" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A1628",
                            border: "1px solid rgba(0,240,255,0.2)",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="price"
                          stroke="#00F0FF"
                          strokeWidth={2}
                          dot={{ fill: "#00F0FF" }}
                          name="建议赏金(元)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="demand"
                          stroke="#FFB800"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="日需求量"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    难度越高，所需赏金越高，市场供给越少
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
