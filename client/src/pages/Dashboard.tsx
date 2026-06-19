import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Progress } from "../components/ui/Progress"
import { Button } from "../components/ui/Button"
import { useAppStore } from "../store/useAppStore"
import { formatCurrency, formatNumber, cn } from "../lib/utils"
import { mockDailyStats } from "../data/mockData"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  FolderKanban,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Target,
  Plus,
  Shield,
  Settings,
  FileText,
  Activity,
  Award,
  BarChart3,
  PieChart,
  AlertTriangle,
  ChevronRight,
  ScanLine,
  Wallet,
  UserCheck,
  Layers,
} from "lucide-react"
import type { UserRole } from "../types"

interface DashboardProps {
  onCreateProject?: () => void
  onNavigate?: (tab: string) => void
}

export function Dashboard({ onCreateProject, onNavigate }: DashboardProps) {
  const currentRole = useAppStore((state) => state.currentRole)
  const tasks = useAppStore((state) => state.tasks)
  const projectStats = useAppStore((state) => state.projectStats)
  const currentUser = useAppStore((state) => state.currentUser)
  const annotators = useAppStore((state) => state.annotators)
  const disputes = useAppStore((state) => state.disputes)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "published")
  const completedTasks = tasks.filter((t) => t.status === "completed")
  const recentTasks = tasks.slice(0, 4)

  const stats = {
    publisher: [
      { label: "进行中项目", value: projectStats.activeTasks, icon: <FolderKanban className="w-5 h-5" />, color: "text-blue-500" },
      { label: "已完成任务", value: formatNumber(projectStats.completedUnits), icon: <CheckSquare className="w-5 h-5" />, color: "text-green-500" },
      { label: "总奖励池", value: formatCurrency(projectStats.totalReward), icon: <DollarSign className="w-5 h-5" />, color: "text-primary" },
      { label: "平均准确率", value: `${projectStats.averageAccuracy}%`, icon: <Target className="w-5 h-5" />, color: "text-orange-500" },
    ],
    annotator: [
      { label: "可接任务", value: activeTasks.length, icon: <FolderKanban className="w-5 h-5" />, color: "text-blue-500" },
      { label: "已完成", value: formatNumber(currentUser?.totalTasks || 0), icon: <CheckSquare className="w-5 h-5" />, color: "text-green-500" },
      { label: "本月收入", value: formatCurrency(2580), icon: <DollarSign className="w-5 h-5" />, color: "text-primary" },
      { label: "准确率", value: `${currentUser?.accuracy || 0}%`, icon: <Target className="w-5 h-5" />, color: "text-orange-500" },
    ],
    reviewer: [
      { label: "待审核", value: 128, icon: <Clock className="w-5 h-5" />, color: "text-blue-500" },
      { label: "今日已审", value: 36, icon: <CheckSquare className="w-5 h-5" />, color: "text-green-500" },
      { label: "待处理争议", value: disputes.filter(d => d.status === "pending").length, icon: <Zap className="w-5 h-5" />, color: "text-destructive" },
      { label: "审核通过率", value: "89.2%", icon: <Target className="w-5 h-5" />, color: "text-orange-500" },
    ],
    admin: [
      { label: "总用户数", value: "1,256", icon: <Users className="w-5 h-5" />, color: "text-blue-500" },
      { label: "进行中任务", value: 32, icon: <FolderKanban className="w-5 h-5" />, color: "text-green-500" },
      { label: "平台流水", value: formatCurrency(128500), icon: <DollarSign className="w-5 h-5" />, color: "text-primary" },
      { label: "今日新增", value: "+28", icon: <TrendingUp className="w-5 h-5" />, color: "text-orange-500" },
    ],
  }

  const currentStats = stats[currentRole as UserRole] || stats.publisher

  const radarData = [
    { subject: "准确率", A: 94.5, fullMark: 100 },
    { subject: "速度", A: 87.2, fullMark: 100 },
    { subject: "一致性", A: 91.8, fullMark: 100 },
    { subject: "复杂度", A: 82.5, fullMark: 100 },
    { subject: "完成率", A: 96.3, fullMark: 100 },
  ]

  const publisherQuickActions = [
    { id: "create", label: "创建项目", icon: <Plus className="w-6 h-6" />, desc: "配置任务类型、质检标准、验收阈值", onClick: () => onCreateProject?.(), color: "from-primary to-indigo-500" },
    { id: "quality", label: "质检标准", icon: <Shield className="w-6 h-6" />, desc: "设置一致性阈值、抽检规则、对抗样本", onClick: () => onNavigate?.("quality"), color: "from-green-500 to-emerald-500" },
    { id: "settlement", label: "结算规则", icon: <DollarSign className="w-6 h-6" />, desc: "配置单价、结算周期、支付方式", onClick: () => onNavigate?.("settlement"), color: "from-amber-500 to-orange-500" },
    { id: "analytics", label: "ROI 分析", icon: <BarChart3 className="w-6 h-6" />, desc: "查看产能预测、投资回报、成本分析", onClick: () => onNavigate?.("analytics"), color: "from-blue-500 to-cyan-500" },
    { id: "annotators", label: "标注员管理", icon: <Users className="w-6 h-6" />, desc: "查看标注员表现、技能认证、准确率", onClick: () => onNavigate?.("annotators"), color: "from-violet-500 to-purple-500" },
    { id: "tasks", label: "项目列表", icon: <FolderKanban className="w-6 h-6" />, desc: "管理所有项目、查看进度、验收结果", onClick: () => onNavigate?.("tasks"), color: "from-pink-500 to-rose-500" },
  ]

  const annotatorQuickActions = [
    { id: "tasks", label: "任务大厅", icon: <FolderKanban className="w-6 h-6" />, desc: "浏览推荐任务、查看资格要求", onClick: () => onNavigate?.("tasks"), color: "from-primary to-indigo-500" },
    { id: "skills", label: "技能认证", icon: <Award className="w-6 h-6" />, desc: "考取技能证书、解锁高价值任务", onClick: () => onNavigate?.("skills"), color: "from-green-500 to-emerald-500" },
    { id: "my-tasks", label: "我的任务", icon: <FileText className="w-6 h-6" />, desc: "查看进行中、已完成、待验收任务", onClick: () => onNavigate?.("my-tasks"), color: "from-amber-500 to-orange-500" },
    { id: "settlement", label: "我的收入", icon: <Wallet className="w-6 h-6" />, desc: "查看收入明细、结算记录、提现", onClick: () => onNavigate?.("settlement"), color: "from-blue-500 to-cyan-500" },
    { id: "analytics", label: "能力画像", icon: <PieChart className="w-6 h-6" />, desc: "查看能力雷达、准确率趋势、等级进度", onClick: () => onNavigate?.("analytics"), color: "from-violet-500 to-purple-500" },
    { id: "high-value", label: "高门槛任务", icon: <Layers className="w-6 h-6" />, desc: "查看医疗影像等特殊任务资格要求", onClick: () => onNavigate?.("tasks"), color: "from-pink-500 to-rose-500" },
  ]

  const reviewerQuickActions = [
    { id: "review-tasks", label: "待审核任务", icon: <CheckSquare className="w-6 h-6" />, desc: "审核标注结果、标记质量问题", onClick: () => onNavigate?.("review-tasks"), color: "from-primary to-indigo-500" },
    { id: "disputes", label: "争议仲裁", icon: <AlertTriangle className="w-6 h-6" />, desc: "处理标注员申诉、仲裁争议", onClick: () => onNavigate?.("disputes"), color: "from-red-500 to-orange-500" },
    { id: "quality", label: "一致性复查", icon: <ScanLine className="w-6 h-6" />, desc: "查看 Jaccard 相似度、批量复核", onClick: () => onNavigate?.("quality"), color: "from-green-500 to-emerald-500" },
    { id: "analytics", label: "对抗样本检测", icon: <Activity className="w-6 h-6" />, desc: "查看异常检测结果、可疑标注员", onClick: () => onNavigate?.("analytics"), color: "from-amber-500 to-orange-500" },
    { id: "settings", label: "抽检规则", icon: <Settings className="w-6 h-6" />, desc: "配置抽检比例、自动审核阈值", onClick: () => onNavigate?.("quality"), color: "from-blue-500 to-cyan-500" },
    { id: "statistics", label: "质检统计", icon: <BarChart3 className="w-6 h-6" />, desc: "查看个人审核数据、效率分析", onClick: () => onNavigate?.("analytics"), color: "from-violet-500 to-purple-500" },
  ]

  const getQuickActions = () => {
    switch (currentRole) {
      case "publisher": return publisherQuickActions
      case "annotator": return annotatorQuickActions
      case "reviewer": return reviewerQuickActions
      default: return publisherQuickActions
    }
  }

  const quickActions = getQuickActions()

  const getWelcomeMessage = () => {
    switch (currentRole) {
      case "publisher":
        return {
          title: "发布方工作台",
          subtitle: "创建标注项目，管理质检标准，监控投资回报",
          cta: "开始创建您的第一个标注项目",
        }
      case "annotator":
        return {
          title: "标注员工作台",
          subtitle: "浏览任务赚取收益，提升技能解锁高价值项目",
          cta: "前往任务大厅选择适合您的任务",
        }
      case "reviewer":
        return {
          title: "审核员工作台",
          subtitle: "审核标注质量，处理争议仲裁，保障数据准确性",
          cta: "开始审核待处理任务",
        }
      default:
        return {
          title: "管理面板",
          subtitle: "平台运营数据总览",
          cta: "",
        }
    }
  }

  const welcome = getWelcomeMessage()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-500/10 border border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{welcome.title}</h2>
            <p className="text-muted-foreground mt-1">{welcome.subtitle}</p>
            {welcome.cta && (
              <p className="text-sm text-primary font-medium mt-2">{welcome.cta}</p>
            )}
          </div>
          <div className="flex gap-3">
            {currentRole === "publisher" && (
              <Button size="lg" onClick={() => onCreateProject?.()}>
                <Plus className="w-5 h-5 mr-2" />
                立即创建项目
              </Button>
            )}
            {currentRole === "annotator" && (
              <Button size="lg" onClick={() => onNavigate?.("tasks")}>
                <FolderKanban className="w-5 h-5 mr-2" />
                浏览任务大厅
              </Button>
            )}
            {currentRole === "reviewer" && (
              <Button size="lg" onClick={() => onNavigate?.("review-tasks")}>
                <CheckSquare className="w-5 h-5 mr-2" />
                开始审核
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentStats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-secondary", stat.color?.replace("text-", "bg-")?.replace("-500", "-100 dark:bg-")?.replace("-100 dark:bg-", "-100 dark:bg-") + "900/30")}
                >
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">快速操作</h3>
          <span className="text-sm text-muted-foreground">点击卡片进入对应功能</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.id}
              className="card-hover cursor-pointer group"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", action.color)}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{action.label}</h4>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>任务完成趋势</CardTitle>
            <CardDescription>近30天任务完成量与准确率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockDailyStats}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                    name="完成量"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>能力雷达图</CardTitle>
            <CardDescription>综合能力评估</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} angle={30} />
                <Radar
                  name="能力值"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>进行中的项目</CardTitle>
              <CardDescription>点击查看详情</CardDescription>
            </div>
            <Badge variant="secondary">{activeTasks.length} 个项目</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task) => {
              const progress = (task.completedUnits / task.totalUnits) * 100
              return (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {task.coverImage && (
                          <img
                            src={task.coverImage}
                            alt={task.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.completedUnits.toLocaleString()} / {task.totalUnits.toLocaleString()} 条
                        </p>
                      </div>
                    </div>
                    <Badge variant={task.status === "in_progress" ? "default" : "secondary"}>
                      {task.status === "in_progress" ? "进行中" : "已发布"}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
              {currentRole === "publisher" ? "顶尖标注员" : "排行榜"}
              </CardTitle>
              <CardDescription>按准确率排名</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {annotators.slice(0, 5).map((annotator, index) => (
              <div key={annotator.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <img
                  src={annotator.avatar}
                  alt={annotator.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{annotator.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {annotator.totalTasks} 任务 · Lv.{annotator.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {annotator.accuracy}%
              </p>
              <p className="text-xs text-muted-foreground">准确率</p>
            </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
