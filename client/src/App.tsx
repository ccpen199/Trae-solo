import { useState, useEffect } from "react"
import { Sidebar } from "./components/layout/Sidebar"
import { Header } from "./components/layout/Header"
import { Dashboard } from "./pages/Dashboard"
import { Tasks } from "./pages/Tasks"
import { QualityControl } from "./pages/QualityControl"
import { Settlement } from "./pages/Settlement"
import { Analytics } from "./pages/Analytics"
import { AnnotationEditor } from "./components/annotation/AnnotationEditor"
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
      if (currentRole === "publisher") {
        return <PublisherDashboard onCreateProject={() => setActiveTab("tasks")} />
      } else if (currentRole === "annotator") {
        return <AnnotatorDashboard onBrowseTasks={() => setActiveTab("tasks")} />
      } else if (currentRole === "reviewer") {
        return <ReviewerDashboard onReviewTasks={() => setActiveTab("review-tasks")} />
      }
      return <Dashboard />
    }

    if (activeTab === "tasks") {
      return <Tasks key={`${currentRole}-tasks`} onStartAnnotation={handleStartAnnotation} />
    }

    switch (activeTab) {
      case "my-tasks":
      case "review-tasks":
        return <Tasks key={`${currentRole}-${activeTab}`} onStartAnnotation={handleStartAnnotation} />
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

export default App
