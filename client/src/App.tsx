import { useState, useEffect } from "react"
import { Sidebar } from "./components/layout/Sidebar"
import { Header } from "./components/layout/Header"
import { Dashboard } from "./pages/Dashboard"
import { Tasks } from "./pages/Tasks"
import { QualityControl } from "./pages/QualityControl"
import { Settlement } from "./pages/Settlement"
import { Analytics } from "./pages/Analytics"
import { AnnotationEditor } from "./components/annotation/AnnotationEditor"
import { CreateTaskDialog } from "./components/tasks/CreateTaskDialog"
import { useAppStore } from "./store/useAppStore"
import type { Task, AnnotationData, UserRole } from "./types"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  DollarSign,
  BarChart3,
  Users,
  FileText,
  Zap,
  TrendingUp,
  Target,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  ChevronRight,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/Card"
import { Badge } from "./components/ui/Badge"
import { Button } from "./components/ui/Button"
import { Progress } from "./components/ui/Progress"
import { formatCurrency, formatDate, formatNumber, calculateJaccard } from "./lib/utils"
import { mockDailyStats } from "./data/mockData"

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [currentAnnotationTask, setCurrentAnnotationTask] = useState<Task | null>(null)
  const taskUnits = useAppStore((state) => state.taskUnits)
  const submitAnnotation = useAppStore((state) => state.submitAnnotation)
  const currentRole = useAppStore((state) => state.currentRole)
  const currentUser = useAppStore((state) => state.currentUser)
  const annotators = useAppStore((state) => state.annotators)
  const tasks = useAppStore((state) => state.tasks)
  const disputes = useAppStore((state) => state.disputes)
  const projectStats = useAppStore((state) => state.projectStats)

  useEffect(() => {
    const defaultTabs: Record<UserRole, string> = {
      publisher: "dashboard",
      annotator: "dashboard",
      reviewer: "dashboard",
      admin: "dashboard",
    }
    setActiveTab(defaultTabs[currentRole])
  }, [currentRole])

  const handleStartAnnotation = (task: Task) => {
    setCurrentAnnotationTask(task)
    setIsAnnotating(true)
  }

  const handleCloseAnnotation = () => {
    setIsAnnotating(false)
    setCurrentAnnotationTask(null)
  }

  const handleSubmitAnnotation = (unitId: string, data: AnnotationData) => {
    submitAnnotation(unitId, { data } as any)
  }

  const getPageTitle = () => {
    const publisherTitles: Record<string, string> = {
      dashboard: "发布方工作台",
      tasks: "项目管理",
      quality: "质量控制中心",
      settlement: "结算中心",
      analytics: "数据分析",
      annotators: "标注员管理",
    }
    const annotatorTitles: Record<string, string> = {
      dashboard: "标注员工作台",
      tasks: "任务大厅",
      "my-tasks": "我的任务",
      skills: "技能认证中心",
      settlement: "我的收入",
    }
    const reviewerTitles: Record<string, string> = {
      dashboard: "审核员工作台",
      "review-tasks": "待审核任务",
      disputes: "争议仲裁",
      analytics: "质检统计",
    }
    const adminTitles: Record<string, string> = {
      dashboard: "管理面板",
      users: "用户管理",
      tasks: "任务管理",
      settings: "系统设置",
    }
    const titlesByRole: Record<UserRole, Record<string, string>> = {
      publisher: publisherTitles,
      annotator: annotatorTitles,
      reviewer: reviewerTitles,
      admin: adminTitles,
    }
    return titlesByRole[currentRole]?.[activeTab] || "工作台"
  }

  const renderContent = () => {
    if (activeTab === "dashboard") {
      return (
        <Dashboard
          onCreateProject={() => setCreateTaskOpen(true)}
          onNavigate={setActiveTab}
        />
      )
    }

    if (activeTab === "tasks") {
      return <Tasks key={`${currentRole}-tasks`} onStartAnnotation={handleStartAnnotation} onNavigate={setActiveTab} />
    }

    switch (activeTab) {
      case "my-tasks":
      case "review-tasks":
        return <Tasks key={`${currentRole}-${activeTab}`} onStartAnnotation={handleStartAnnotation} onNavigate={setActiveTab} />
      case "quality":
      case "disputes":
        return <QualityControl />
      case "settlement":
        return <Settlement />
      case "analytics":
        return <Analytics />
      case "annotators":
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">标注员管理</h2>
            <AnnotatorsList />
          </div>
        )
      case "skills":
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">技能认证中心</h2>
            <SkillsCenter />
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  if (isAnnotating && currentAnnotationTask) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <AnnotationEditor
          task={currentAnnotationTask}
          units={taskUnits.filter((u) => u.taskId === currentAnnotationTask.id)}
          onClose={handleCloseAnnotation}
          onSubmit={handleSubmitAnnotation}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={getPageTitle()} />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={(taskId) => {
          setCreateTaskOpen(false)
          setActiveTab("tasks")
        }}
      />
    </>
  )
}

function AnnotatorsList() {
  const annotators = useAppStore((state) => state.annotators)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {annotators.map((annotator) => (
        <div
          key={annotator.id}
          className="p-5 rounded-xl border bg-card card-hover"
        >
          <div className="flex items-center gap-4 mb-4">
            <img
              src={annotator.avatar}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold">{annotator.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Lv.{annotator.level}
                </span>
                <span className="text-xs text-muted-foreground">
                  {annotator.totalTasks} 任务
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">准确率</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {annotator.accuracy}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {annotator.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  className="text-xs px-2 py-0.5 rounded bg-muted"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsCenter() {
  const currentUser = useAppStore((state) => state.currentUser)

  const skills = [
    { id: "s1", name: "图像分割入门", category: "image_segmentation", level: 1, certified: true, desc: "基础边界框标注" },
    { id: "s2", name: "图像分割进阶", category: "image_segmentation", level: 2, certified: true, desc: "多边形实例分割" },
    { id: "s3", name: "语音标注基础", category: "audio_transcription", level: 1, certified: false, desc: "语音转写与时间戳" },
    { id: "s4", name: "医疗影像认证", category: "medical_ct", level: 3, certified: false, desc: "DICOM影像病灶标注" },
    { id: "s5", name: "视频动作识别", category: "video_action", level: 2, certified: false, desc: "帧序列动作打标" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <div
          key={skill.id}
          className={`p-5 rounded-xl border ${
            skill.certified
              ? "border-green-500/50 bg-green-50 dark:bg-green-900/10"
              : "bg-card card-hover"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{skill.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{skill.desc}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              Lv.{skill.level}
            </span>
          </div>
          {skill.certified ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              已认证
            </div>
          ) : (
            <button className="text-sm text-primary hover:underline">
              开始考试 →
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

interface RoleDashboardProps {
  onCreateProject?: () => void
  onBrowseTasks?: () => void
  onReviewTasks?: () => void
}

function PublisherDashboard({ onCreateProject, onNavigate }: RoleDashboardProps & { onNavigate: (tab: string) => void }) {
  const tasks = useAppStore((state) => state.tasks)
  const currentUser = useAppStore((state) => state.currentUser)
  const disputes = useAppStore((state) => state.disputes)
  const annotators = useAppStore((state) => state.annotators)
  const myTasks = tasks.filter(t => t.publisherId === currentUser?.id || t.publisherName === currentUser?.name)
  const activeTasks = myTasks.filter(t => t.status === "in_progress" || t.status === "published")
  const completedTasks = myTasks.filter(t => t.status === "completed")
  const pendingReview = myTasks.filter(t => t.status === "reviewing")
  const totalSpent = myTasks.reduce((sum, t) => sum + (t.completedUnits * t.unitPrice), 0)
  const avgAccuracy = myTasks.length > 0 
    ? (myTasks.reduce((sum, t) => sum + (t.qualityConfig?.minConsistency || 0.75), 0) / myTasks.length * 100).toFixed(1)
    : "0"

  const recentDisputes = disputes.slice(0, 3)
  const recentAnnotators = annotators.slice(0, 4)
  const setActiveTab = onNavigate

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">发布方工作台</h2>
          <p className="text-muted-foreground mt-1">
            管理您的标注项目，监控质量与成本
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab("analytics")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            ROI 分析
          </Button>
          <Button onClick={onCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            创建新项目
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">进行中项目</span>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{activeTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">共 {myTasks.length} 个项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">待验收</span>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{pendingReview.length}</p>
            <p className="text-xs text-muted-foreground mt-1">等待审核通过</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">累计支出</span>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">已完成 {completedTasks.length} 个项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">平均合格率</span>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{avgAccuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">一致性阈值达标率</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>项目产能预测</CardTitle>
              <CardDescription>基于历史数据的未来30天产能预估</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("analytics")}>
              查看详情
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg border-muted">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">产能趋势图</p>
                <p className="text-xs text-muted-foreground mt-1">预测未来30天可完成 8,450 条标注</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={onCreateProject}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-left transition-colors"
            >
              <Plus className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">创建标注项目</p>
                <p className="text-xs text-muted-foreground">定义任务类型与质检规则</p>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab("quality")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
            >
              <CheckSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">质量抽检</p>
                <p className="text-xs text-muted-foreground">配置抽检规则与一致性校验</p>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab("settlement")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
            >
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">结算管理</p>
                <p className="text-xs text-muted-foreground">审核账单与批量支付</p>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab("annotators")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
            >
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">标注员管理</p>
                <p className="text-xs text-muted-foreground">查看标注员能力画像</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>进行中的项目</CardTitle>
              <CardDescription>{activeTasks.length} 个项目正在进行</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("tasks")}>
              全部项目
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">暂无进行中的项目</p>
                <Button className="mt-3" size="sm" onClick={onCreateProject}>
                  创建第一个项目
                </Button>
              </div>
            ) : (
              activeTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {task.coverImage && <img src={task.coverImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      <Badge variant="info" className="text-xs">进行中</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {task.annotationPerUnit}人标注
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Lv.{task.requiredSkillLevel}+
                      </span>
                      <span>{formatCurrency(task.unitPrice)}/条</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{task.completedUnits}/{task.totalUnits}</p>
                    <p className="text-xs text-muted-foreground">
                      {((task.completedUnits / task.totalUnits) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>标注一致性监控</CardTitle>
              <CardDescription>多人标注结果相似度校验</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("quality")}>
              详细报告
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium">一致性达标</p>
                  <p className="text-xs text-muted-foreground">平均 Jaccard 相似度 0.84</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">84%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium">待复核样本</p>
                  <p className="text-xs text-muted-foreground">一致性低于阈值需人工审核</p>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-600">3</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium">对抗样本检测</p>
                  <p className="text-xs text-muted-foreground">疑似作弊标注行为</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>顶尖标注员</CardTitle>
            <CardDescription>按准确率和完成速度排名</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("annotators")}>
            查看全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentAnnotators.map((annotator, index) => (
              <div key={annotator.id} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img src={annotator.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{annotator.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Lv.{annotator.level}</span>
                      <span>·</span>
                      <span>{annotator.totalTasks} 任务</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">准确率</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{annotator.accuracy}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">技能</p>
                    <p className="font-medium text-sm">{annotator.skills.length} 项</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnnotatorDashboard({ onBrowseTasks, onNavigate }: RoleDashboardProps & { onNavigate: (tab: string) => void }) {
  const currentUser = useAppStore((state) => state.currentUser)
  const tasks = useAppStore((state) => state.tasks)
  const taskUnits = useAppStore((state) => state.taskUnits)
  const userSkills = currentUser?.skills || []
  const certifiedSkills = userSkills.filter(s => s.certified)

  const filteredTasks = tasks.filter((task) => {
    if (task.status !== "published" && task.status !== "in_progress") return false
    if (task.requiredSkillLevel > (currentUser?.level || 1)) return false
    if (task.type === "medical_ct") {
      const hasMedicalSkill = userSkills.some(s => s.category === "medical_ct" && s.certified && s.level >= 3)
      if (!hasMedicalSkill) return false
    }
    if (task.type === "image_segmentation" && task.requiredSkillLevel >= 3) {
      const hasImageSkill = userSkills.some(s => s.category === "image_segmentation" && s.certified && s.level >= task.requiredSkillLevel)
      if (!hasImageSkill) return false
    }
    return true
  })

  const lockedTasks = tasks.filter((task) => {
    if (task.status !== "published" && task.status !== "in_progress") return false
    return !filteredTasks.includes(task)
  })

  const myCompletedTasks = taskUnits.filter(u => 
    u.status === "completed" && u.annotations.some(a => a.annotatorId === currentUser?.id)
  )

  const todayEarnings = myCompletedTasks.length * 0.5
  const setActiveTab = onNavigate

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">标注员工作台</h2>
          <p className="text-muted-foreground mt-1">
            欢迎回来，{currentUser?.name}！今天也要加油哦 ~
          </p>
        </div>
        <Button onClick={onBrowseTasks}>
          <FolderKanban className="w-4 h-4 mr-2" />
          任务大厅
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">今日收入</span>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(todayEarnings)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">已完成 {myCompletedTasks.length} 条</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">累计收入</span>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(2580.50)}</p>
            <p className="text-xs text-muted-foreground mt-1">本月目标 5,000 元</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">我的等级</span>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">Lv.{currentUser?.level || 1}</p>
            <p className="text-xs text-muted-foreground mt-1">{currentUser?.points || 0} 积分</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">历史准确率</span>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{currentUser?.accuracy || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">共完成 {currentUser?.totalTasks || 0} 任务</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>为你推荐</CardTitle>
              <CardDescription>基于你的技能和准确率智能匹配</CardDescription>
            </div>
            <Badge variant="success">{filteredTasks.length} 个可领取</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">暂无符合你资质的任务</p>
                <Button className="mt-3" size="sm" onClick={() => setActiveTab("skills")}>
                  获取更多技能认证
                </Button>
              </div>
            ) : (
              filteredTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={onBrowseTasks}>
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {task.coverImage && <img src={task.coverImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      <Badge variant="success" className="text-xs">高匹配</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Target className="w-3 h-3" />
                        Lv.{task.requiredSkillLevel}+
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {task.annotationPerUnit}人标注
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        截止 {task.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">{formatCurrency(task.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">每条单价</p>
                    <Button size="sm" className="mt-2 w-full">
                      立即领取
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>技能认证</CardTitle>
              <CardDescription>{certifiedSkills.length}/{userSkills.length} 项已认证</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userSkills.length === 0 ? (
                <div className="text-center py-4">
                  <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">暂无技能认证</p>
                </div>
              ) : (
                userSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      skill.certified 
                        ? "bg-green-100 dark:bg-green-900/30" 
                        : "bg-muted"
                    }`}>
                      {skill.certified ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">Lv.{skill.level}</p>
                    </div>
                    {skill.certified ? (
                      <Badge variant="success" className="text-xs">已认证</Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs">
                        考试
                      </Button>
                    )}
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-2" onClick={() => setActiveTab("skills")}>
                查看全部技能
              </Button>
            </CardContent>
          </Card>

          {lockedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>暂不可领取</CardTitle>
                <CardDescription>提升技能后可解锁</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {lockedTasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-muted/50 border border-dashed opacity-70">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-muted-foreground">{task.title}</h4>
                      {task.type === "medical_ct" && (
                        <Badge variant="destructive" className="text-xs">医疗资质</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      需要 Lv.{task.requiredSkillLevel} {task.type === "medical_ct" ? "+ 医疗影像认证" : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewerDashboard({ onReviewTasks, onNavigate }: RoleDashboardProps & { onNavigate: (tab: string) => void }) {
  const disputes = useAppStore((state) => state.disputes)
  const taskUnits = useAppStore((state) => state.taskUnits)
  const pendingReviews = disputes.filter(d => d.status === "pending")
  const todayReviewed = 12
  const setActiveTab = onNavigate

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">审核员工作台</h2>
          <p className="text-muted-foreground mt-1">
            审核标注质量，处理争议仲裁
          </p>
        </div>
        <Button onClick={onReviewTasks}>
          <CheckSquare className="w-4 h-4 mr-2" />
          开始审核
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">待审核</span>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{taskUnits.filter(u => u.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground mt-1">等待质量抽检</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">待仲裁</span>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{pendingReviews.length}</p>
            <p className="text-xs text-muted-foreground mt-1">争议案件处理中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">今日已审</span>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{todayReviewed}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">通过率 92%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">抽检合格率</span>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">94.5%</p>
            <p className="text-xs text-muted-foreground mt-1">本周平均</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>待审核任务</CardTitle>
              <CardDescription>按优先级排序</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onReviewTasks}>
              全部任务
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  i === 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"
                }`}>
                  {i === 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">标注单元 #{i + 15}</h4>
                    {i === 0 && <Badge variant="destructive" className="text-xs">高优先级</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">城市街景图像分割项目</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">2人标注</p>
                  <p className="text-xs text-muted-foreground">Jaccard 0.76</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>待仲裁争议</CardTitle>
              <CardDescription>{pendingReviews.length} 条等待处理</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("disputes")}>
              争议列表
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">暂无待处理争议</p>
              </div>
            ) : (
              pendingReviews.slice(0, 3).map((dispute) => (
                <div key={dispute.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{dispute.taskName}</h4>
                      <p className="text-xs text-muted-foreground">标注员: {dispute.annotatorName}</p>
                    </div>
                    <Badge variant="warning" className="text-xs">待仲裁</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="default" className="flex-1">
                      支持标注员
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      驳回申诉
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
