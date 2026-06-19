import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import { Select, SelectItem } from "../components/ui/Select"
import { Badge } from "../components/ui/Badge"
import { Progress } from "../components/ui/Progress"
import { mockDailyStats } from "../data/mockData"
import { formatCurrency, formatNumber } from "../lib/utils"
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Activity,
  Clock,
  Zap,
  PieChart,
  BarChart,
  LineChart as LineChartIcon,
  Award,
  TrendingDown,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts"

export function Analytics() {
  const tasks = useAppStore((state) => state.tasks)
  const annotators = useAppStore((state) => state.annotators)
  const [timeRange, setTimeRange] = useState("30d")

  const efficiencyData = tasks.map((task) => ({
    name: task.title.substring(0, 8) + "...",
    progress: (task.completedUnits / task.totalUnits) * 100,
    efficiency: Math.random() * 20 + 80,
    reward: task.rewardPool,
  }))

  const radarData = annotators.slice(0, 5).map((a) => ({
    subject: a.name.substring(0, 4),
    accuracy: a.accuracy,
    speed: Math.random() * 20 + 75,
    consistency: Math.random() * 15 + 80,
    quality: Math.random() * 10 + 88,
  }))

  const roiData = tasks.map((task) => ({
    name: task.title.substring(0, 6),
    cost: task.rewardPool,
    value: task.rewardPool * (1 + Math.random() * 0.5 + 0.3),
    roi: Math.random() * 50 + 30,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据分析中心</h2>
          <p className="text-muted-foreground mt-1">
            全面了解项目进展、标注员表现与投资回报
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange} className="w-36">
          <SelectItem value="7d">近7天</SelectItem>
          <SelectItem value="30d">近30天</SelectItem>
          <SelectItem value="90d">近90天</SelectItem>
          <SelectItem value="year">近一年</SelectItem>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="总任务量"
          value={formatNumber(tasks.reduce((sum, t) => sum + t.totalUnits, 0))}
          change="+12.5%"
          positive
          icon={<Target className="w-5 h-5" />}
        />
        <KpiCard
          title="活跃标注员"
          value={formatNumber(annotators.length * 15)}
          change="+8.3%"
          positive
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          title="平均准确率"
          value="92.3%"
          change="+2.1%"
          positive
          icon={<Activity className="w-5 h-5" />}
        />
        <KpiCard
          title="ROI 回报率"
          value="156%"
          change="-3.2%"
          positive={false}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            产能总览
          </TabsTrigger>
          <TabsTrigger value="annotators">
            <Users className="w-4 h-4 mr-2" />
            标注员分析
          </TabsTrigger>
          <TabsTrigger value="roi">
            <DollarSign className="w-4 h-4 mr-2" />
            ROI 分析
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Target className="w-4 h-4 mr-2" />
            质量分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>产能趋势</CardTitle>
                <CardDescription>每日完成标注量趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockDailyStats}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
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
                <CardTitle>任务类型分布</CardTitle>
                <CardDescription>按类型统计任务量</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TypeDistributionItem label="图像分割" value={45} color="bg-violet-500" />
                  <TypeDistributionItem label="语音标注" value={25} color="bg-cyan-500" />
                  <TypeDistributionItem label="视频标注" value={18} color="bg-green-500" />
                  <TypeDistributionItem label="医疗影像" value={12} color="bg-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>项目产能预测</CardTitle>
                <CardDescription>基于历史数据预测未来产能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateForecastData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name="实际"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="预测"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-primary rounded" />
                    <span className="text-muted-foreground">实际产能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-amber-500 rounded" style={{ borderStyle: "dashed" }} />
                    <span className="text-muted-foreground">预测产能</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>各项目进度</CardTitle>
                <CardDescription>项目完成情况一览</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.slice(0, 5).map((task) => {
                  const progress = (task.completedUnits / task.totalUnits) * 100
                  return (
                    <div key={task.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[60%]">{task.title}</span>
                        <span className="text-muted-foreground">
                          {task.completedUnits.toLocaleString()} / {task.totalUnits.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="annotators">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>能力雷达图对比</CardTitle>
                <CardDescription>Top 5 标注员能力维度对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="准确率" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Radar name="速度" dataKey="speed" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                      <Radar name="一致性" dataKey="consistency" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>标注员排行榜</CardTitle>
                <CardDescription>按综合评分排名</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {annotators.map((annotator, index) => (
                  <div
                    key={annotator.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : index === 1
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          : index === 2
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index === 0 && <Award className="w-4 h-4" />}
                      {index > 0 && index + 1}
                    </div>
                    <img
                      src={annotator.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{annotator.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {annotator.totalTasks} 任务 · Lv.{annotator.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                        {annotator.accuracy}%
                      </p>
                      <p className="text-xs text-muted-foreground">准确率</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>效率-质量散点图</CardTitle>
              <CardDescription>标注效率与质量分布关系</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      dataKey="speed"
                      name="效率"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      type="number"
                      dataKey="accuracy"
                      name="准确率"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Scatter data={generateScatterData()}>
                      {generateScatterData().map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"][index % 5]}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>项目 ROI 对比</CardTitle>
                <CardDescription>各项目投资回报率</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={roiData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "ROI"]}
                      />
                      <Bar dataKey="roi" name="ROI" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                        {roiData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.roi >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--chart-1))"}
                          />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>成本收益分析</CardTitle>
                <CardDescription>投入成本与产出价值对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={roiData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="cost" name="成本" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="value" name="价值" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>准确率趋势</CardTitle>
                <CardDescription>历史准确率变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockDailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        domain={[80, 100]}
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>一致性分布</CardTitle>
                <CardDescription>Jaccard 相似度分布</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QualityBar label="优秀 (≥0.9)" value={35} color="bg-green-500" />
                <QualityBar label="良好 (0.8-0.9)" value={40} color="bg-blue-500" />
                <QualityBar label="合格 (0.7-0.8)" value={18} color="bg-yellow-500" />
                <QualityBar label="不合格 (<0.7)" value={7} color="bg-red-500" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>质检指标</CardTitle>
                <CardDescription>核心质量指标概览</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MetricItem
                  icon={<Target className="w-4 h-4" />}
                  label="平均准确率"
                  value="92.3%"
                  trend="+1.5%"
                />
                <MetricItem
                  icon={<Users className="w-4 h-4" />}
                  label="标注一致性"
                  value="88.7%"
                  trend="+2.1%"
                />
                <MetricItem
                  icon={<Zap className="w-4 h-4" />}
                  label="对抗样本检出率"
                  value="95.2%"
                  trend="+0.8%"
                />
                <MetricItem
                  icon={<Clock className="w-4 h-4" />}
                  label="平均审核时长"
                  value="4.2min"
                  trend="-12%"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({
  title,
  value,
  change,
  positive,
  icon,
}: {
  title: string
  value: string
  change: string
  positive: boolean
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${positive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </CardContent>
    </Card>
  )
}

function TypeDistributionItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function QualityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function MetricItem({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background text-primary">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">{value}</p>
        <p className="text-xs text-green-600 dark:text-green-400">{trend}</p>
      </div>
    </div>
  )
}

function generateForecastData() {
  const data: { day: string; actual: number | null; forecast: number | null }[] = []
  for (let i = 0; i < 30; i++) {
    const actual = i < 20 ? Math.floor(300 + Math.sin(i / 3) * 50 + Math.random() * 30) : null
    const forecast = i >= 15 ? Math.floor(350 + (i - 15) * 5 + Math.random() * 20) : null
    data.push({
      day: `第${i + 1}天`,
      actual,
      forecast,
    })
  }
  return data
}

function generateScatterData() {
  return Array.from({ length: 50 }, () => ({
    speed: Math.random() * 40 + 60,
    accuracy: Math.random() * 20 + 80,
  }))
}
