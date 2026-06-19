import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Progress } from "../components/ui/Progress"
import { useAppStore } from "../store/useAppStore"
import { formatCurrency, formatNumber } from "../lib/utils"
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
} from "lucide-react"
import type { UserRole } from "../types"

export function Dashboard() {
  const currentRole = useAppStore((state) => state.currentRole)
  const tasks = useAppStore((state) => state.tasks)
  const projectStats = useAppStore((state) => state.projectStats)
  const currentUser = useAppStore((state) => state.currentUser)
  const annotators = useAppStore((state) => state.annotators)

  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "published")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  const recentTasks = tasks.slice(0, 4)

  const stats = {
    publisher: [
      { label: "进行中项目", value: projectStats.activeTasks, icon: <FolderKanban />, color: "text-blue-500" },
      { label: "已完成任务", value: formatNumber(projectStats.completedUnits), icon: <CheckSquare />, color: "text-green-500" },
      { label: "总奖励池", value: formatCurrency(projectStats.totalReward), icon: <DollarSign />, color: "text-primary" },
      { label: "平均准确率", value: `${projectStats.averageAccuracy}%`, icon: <Target />, color: "text-orange-500" },
    ],
    annotator: [
      { label: "可接任务", value: activeTasks.length, icon: <FolderKanban />, color: "text-blue-500" },
      { label: "已完成", value: formatNumber(currentUser?.totalTasks || 0), icon: <CheckSquare />, color: "text-green-500" },
      { label: "本月收入", value: formatCurrency(2580), icon: <DollarSign />, color: "text-primary" },
      { label: "准确率", value: `${currentUser?.accuracy || 0}%`, icon: <Target />, color: "text-orange-500" },
    ],
    reviewer: [
      { label: "待审核", value: 128, icon: <Clock />, color: "text-blue-500" },
      { label: "已审核", value: 1560, icon: <CheckSquare />, color: "text-green-500" },
      { label: "待处理争议", value: 5, icon: <Zap />, color: "text-destructive" },
      { label: "审核通过率", value: "89.2%", icon: <Target />, color: "text-orange-500" },
    ],
    admin: [
      { label: "总用户数", value: "1,256", icon: <Users />, color: "text-blue-500" },
      { label: "进行中任务", value: 32, icon: <FolderKanban />, color: "text-green-500" },
      { label: "平台流水", value: formatCurrency(128500), icon: <DollarSign />, color: "text-primary" },
      { label: "今日新增", value: "+28", icon: <TrendingUp />, color: "text-orange-500" },
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {currentRole === "publisher" && "项目总览"}
            {currentRole === "annotator" && "工作台"}
            {currentRole === "reviewer" && "审核台"}
            {currentRole === "admin" && "管理面板"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {currentRole === "publisher" && "管理您的标注项目，监控质量与进度"}
            {currentRole === "annotator" && "浏览任务，开始标注，提升技能等级"}
            {currentRole === "reviewer" && "审核标注结果，处理争议申诉"}
            {currentRole === "admin" && "平台运营数据总览"}
          </p>
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
                <div className={cn("p-3 rounded-xl bg-secondary", stat.color?.replace("text-", "bg-")?.replace("-500", "-100"))}
                >
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ")
}
