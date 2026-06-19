import { useState } from "react"
import { Sidebar } from "./components/layout/Sidebar"
import { Header } from "./components/layout/Header"
import { Dashboard } from "./pages/Dashboard"
import { Tasks } from "./pages/Tasks"
import { QualityControl } from "./pages/QualityControl"
import { Settlement } from "./pages/Settlement"
import { Analytics } from "./pages/Analytics"
import { AnnotationEditor } from "./components/annotation/AnnotationEditor"
import { useAppStore } from "./store/useAppStore"
import type { Task, AnnotationData } from "./types"

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [currentAnnotationTask, setCurrentAnnotationTask] = useState<Task | null>(null)
  const taskUnits = useAppStore((state) => state.taskUnits)
  const submitAnnotation = useAppStore((state) => state.submitAnnotation)

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
    const titles: Record<string, string> = {
      dashboard: "总览",
      tasks: "任务管理",
      "my-tasks": "我的任务",
      quality: "质量控制",
      settlement: "结算中心",
      analytics: "数据分析",
      annotators: "标注员管理",
      skills: "技能认证",
      "review-tasks": "待审核任务",
      disputes: "争议仲裁",
      users: "用户管理",
      settings: "系统设置",
    }
    return titles[activeTab] || "总览"
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "tasks":
      case "my-tasks":
      case "review-tasks":
        return <Tasks onStartAnnotation={handleStartAnnotation} />
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
