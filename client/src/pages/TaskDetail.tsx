import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Progress } from "../components/ui/Progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import { formatCurrency, formatDate, formatNumber } from "../lib/utils"
import type { Task } from "../types"
import {
  Calendar,
  Users,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  BarChart3,
  Play,
  FileText,
  Settings,
  Download,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react"

interface TaskDetailProps {
  task: Task
  onStartAnnotation?: (task: Task) => void
}

const taskTypeLabels: Record<string, string> = {
  image_segmentation: "图像分割",
  audio_transcription: "语音标注",
  video_action: "视频标注",
  medical_ct: "医疗影像",
  text_classification: "文本分类",
}

const statusLabels: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  in_progress: "进行中",
  reviewing: "审核中",
  completed: "已完成",
  archived: "已归档",
}

const statusColors: Record<string, string> = {
  draft: "secondary",
  published: "info",
  in_progress: "default",
  reviewing: "warning",
  completed: "success",
  archived: "secondary",
}

export function TaskDetail({ task, onStartAnnotation }: TaskDetailProps) {
  const currentRole = useAppStore((state) => state.currentRole)
  const taskUnits = useAppStore((state) => state.getUnitsByTaskId(task.id))
  const annotators = useAppStore((state) => state.annotators)

  const progress = (task.completedUnits / task.totalUnits) * 100
  const remainingUnits = task.totalUnits - task.completedUnits
  const estimatedDays = Math.ceil(remainingUnits / 200)

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <div className="aspect-[21/9] relative overflow-hidden rounded-t-xl bg-muted">
              {task.coverImage && (
                <img
                  src={task.coverImage}
                  alt={task.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                    {taskTypeLabels[task.type]}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                    {statusLabels[task.status]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold">{task.title}</h1>
                <p className="text-white/80 text-sm mt-1">发布者：{task.publisherName}</p>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold mb-2">任务描述</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Target className="w-4 h-4" />}
                  label="技能等级"
                  value={`Lv.${task.requiredSkillLevel}+`}
                />
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  label="标注人数"
                  value={`${task.annotationPerUnit}人/条`}
                />
                <StatCard
                  icon={<DollarSign className="w-4 h-4" />}
                  label="单价"
                  value={formatCurrency(task.unitPrice)}
                />
                <StatCard
                  icon={<Calendar className="w-4 h-4" />}
                  label="截止日期"
                  value={formatDate(task.deadline)}
                />
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">任务进度</span>
                  <span className="text-sm text-muted-foreground">
                    {task.completedUnits.toLocaleString()} / {task.totalUnits.toLocaleString()}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>预计还需 {estimatedDays} 天完成</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {currentRole === "annotator" && (
                <div className="mt-6">
                  <Button size="lg" className="w-full" onClick={() => onStartAnnotation?.(task)}>
                    <Play className="w-4 h-4" />
                    开始标注
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    完成后通过审核即可获得报酬
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="quality">
            <TabsList>
              <TabsTrigger value="quality">
                <Shield className="w-4 h-4 mr-2" />
                质检配置
              </TabsTrigger>
              <TabsTrigger value="spec">
                <FileText className="w-4 h-4 mr-2" />
                标注规范
              </TabsTrigger>
              <TabsTrigger value="data">
                <BarChart3 className="w-4 h-4 mr-2" />
                数据统计
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quality">
              <Card>
                <CardHeader>
                  <CardTitle>质量控制配置</CardTitle>
                  <CardDescription>确保标注质量的多重保障机制</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QualityItem
                    icon={<Users className="w-5 h-5" />}
                    title="多人交叉验证"
                    description={`每条数据由 ${task.annotationPerUnit} 名标注员独立标注，计算一致性得分`}
                    value={`Jaccard ≥ ${task.consistencyThreshold}`}
                  />
                  <QualityItem
                    icon={<Activity className="w-5 h-5" />}
                    title="抽检审核"
                    description={`按 ${(task.qualityConfig.samplingRate * 100).toFixed(0)}% 比例抽检，由审核员人工复核`}
                    value={`${(task.qualityConfig.samplingRate * 100).toFixed(0)}% 抽检率`}
                  />
                  <QualityItem
                    icon={<Zap className="w-5 h-5" />}
                    title="对抗样本检测"
                    description={
                      task.qualityConfig.adversarialEnabled
                        ? `注入 ${(task.qualityConfig.adversarialRatio * 100).toFixed(0)}% 已知答案的质检样本，实时监测标注质量`
                        : "未启用对抗样本检测"
                    }
                    value={task.qualityConfig.adversarialEnabled ? "已启用" : "未启用"}
                    highlight={task.qualityConfig.adversarialEnabled}
                  />
                  <QualityItem
                    icon={<AlertTriangle className="w-5 h-5" />}
                    title="争议仲裁机制"
                    description="标注结果有异议可发起申诉，由高级审核员仲裁"
                    value="24小时内响应"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spec">
              <Card>
                <CardHeader>
                  <CardTitle>标注规范说明</CardTitle>
                  <CardDescription>请仔细阅读标注规范以确保数据质量</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">1. 标注范围</h4>
                    <p className="text-muted-foreground">
                      标注图像中所有可见的目标对象，包括但不限于：车辆、行人、交通标志、建筑物等。
                      被遮挡超过30%的对象可省略标注。
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">2. 标注精度要求</h4>
                    <p className="text-muted-foreground">
                      边界框需紧贴目标边缘，误差不超过5像素。多边形标注需精确贴合轮廓，
                      顶点数量控制在合理范围内。
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">3. 标签分类</h4>
                    <p className="text-muted-foreground">
                      共20类目标，详见标签列表。不确定的类别请选择"其他"并备注说明。
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold text-destructive mb-2">⚠️ 注意事项</h4>
                    <p className="text-destructive/80 text-sm">
                      严禁抄袭他人标注结果，系统会进行一致性检测。
                      发现作弊行为将扣除相应积分并封禁账号。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>每日完成量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end justify-between gap-1">
                      {Array.from({ length: 14 }, (_, i) => {
                        const height = Math.random() * 70 + 30
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary/80 rounded-t-sm hover:bg-primary transition-colors"
                            style={{ height: `${height}%` }}
                          />
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">近14天</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>准确率分布</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AccuracyBar label="优秀 (≥95%)" value={35} color="bg-green-500" />
                    <AccuracyBar label="良好 (85%-95%)" value={45} color="bg-blue-500" />
                    <AccuracyBar label="合格 (75%-85%)" value={15} color="bg-yellow-500" />
                    <AccuracyBar label="待改进 (<75%)" value={5} color="bg-red-500" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>参与标注员</CardTitle>
              <CardDescription>Top 标注员排行</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {annotators.slice(0, 5).map((annotator, index) => (
                <div key={annotator.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <img
                    src={annotator.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{annotator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(Math.random() * 500) + 100} 条完成
                    </p>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {annotator.accuracy}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>奖励池</CardTitle>
              <CardDescription>已分配 / 总预算</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(task.rewardPool)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">总奖励预算</p>
              </div>
              <Progress
                value={progress}
                className="h-2 mb-2"
                indicatorClassName="bg-gradient-to-r from-primary to-indigo-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>已发放 {formatCurrency(task.rewardPool * progress / 100)}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          {currentRole === "publisher" && (
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4" />
                  编辑项目
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4" />
                  导出数据
                </Button>
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4" />
                  查看报告
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  )
}

function QualityItem({
  icon,
  title,
  description,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/30 transition-colors">
      <div className={cn(
        "p-2.5 rounded-lg",
        highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Badge variant={highlight ? "default" : "outline"} className="flex-shrink-0">
        {value}
      </Badge>
    </div>
  )
}

function AccuracyBar({ label, value, color }: { label: string; value: number; color: string }) {
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

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ")
}
