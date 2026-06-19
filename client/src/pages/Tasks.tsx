import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Progress } from "../components/ui/Progress"
import { Input } from "../components/ui/Input"
import { Select, SelectItem } from "../components/ui/Select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import { formatCurrency, formatNumber } from "../lib/utils"
import type { TaskType, TaskStatus, Task } from "../types"
import {
  Search,
  Filter,
  Plus,
  Image,
  Mic,
  Video,
  Activity,
  FileText,
  Calendar,
  Users,
  Clock,
  Target,
  ChevronRight,
  X,
} from "lucide-react"
import { TaskDetail } from "./TaskDetail"
import { CreateTaskDialog } from "../components/tasks/CreateTaskDialog"

const taskTypeLabels: Record<TaskType, string> = {
  image_segmentation: "图像分割",
  audio_transcription: "语音标注",
  video_action: "视频标注",
  medical_ct: "医疗影像",
  text_classification: "文本分类",
}

const taskTypeIcons: Record<TaskType, React.ReactNode> = {
  image_segmentation: <Image className="w-4 h-4" />,
  audio_transcription: <Mic className="w-4 h-4" />,
  video_action: <Video className="w-4 h-4" />,
  medical_ct: <Activity className="w-4 h-4" />,
  text_classification: <FileText className="w-4 h-4" />,
}

const taskStatusLabels: Record<TaskStatus, string> = {
  draft: "草稿",
  published: "已发布",
  in_progress: "进行中",
  reviewing: "审核中",
  completed: "已完成",
  archived: "已归档",
}

const statusColors: Record<TaskStatus, string> = {
  draft: "secondary",
  published: "info",
  in_progress: "default",
  reviewing: "warning",
  completed: "success",
  archived: "secondary",
}

interface TasksProps {
  onStartAnnotation?: (task: Task) => void
}

export function Tasks({ onStartAnnotation }: TasksProps) {
  const tasks = useAppStore((state) => state.tasks)
  const currentRole = useAppStore((state) => state.currentRole)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || task.type === typeFilter
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  if (selectedTask) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedTask(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          返回任务列表
        </button>
        <TaskDetail task={selectedTask} onStartAnnotation={onStartAnnotation} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {currentRole === "publisher" ? "项目管理" : "任务大厅"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {currentRole === "publisher"
              ? "管理您的标注项目，创建新任务"
              : "浏览可用任务，选择适合您的项目"}
          </p>
        </div>
        {currentRole === "publisher" && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            创建项目
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="任务类型"
                className="w-40"
              >
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="image_segmentation">图像分割</SelectItem>
                <SelectItem value="audio_transcription">语音标注</SelectItem>
                <SelectItem value="video_action">视频标注</SelectItem>
                <SelectItem value="medical_ct">医疗影像</SelectItem>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="任务状态"
                className="w-40"
              >
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">网格视图</TabsTrigger>
          <TabsTrigger value="list">列表视图</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {task.coverImage && (
                        <img src={task.coverImage} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{task.title}</h3>
                        <Badge variant={statusColors[task.status] as any}>
                          {taskStatusLabels[task.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-primary">
                        {formatCurrency(task.unitPrice)}/条
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.totalUnits.toLocaleString()} 条
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">没有找到匹配的任务</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setTypeFilter("all")
                setStatusFilter("all")
              }}
            >
              清除筛选
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onClick: () => void
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const progress = (task.completedUnits / task.totalUnits) * 100

  return (
    <Card
      className="overflow-hidden cursor-pointer card-hover group"
      onClick={onClick}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {task.coverImage && (
          <img
            src={task.coverImage}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <span className="flex items-center gap-1">
              {taskTypeIcons[task.type]}
              {taskTypeLabels[task.type]}
            </span>
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={statusColors[task.status] as any}>
            {taskStatusLabels[task.status]}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold mb-2 line-clamp-1">{task.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {task.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">进度</span>
            <span className="font-medium">
              {task.completedUnits.toLocaleString()} / {task.totalUnits.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.annotationPerUnit}人标注
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Lv.{task.requiredSkillLevel}+
              </span>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{formatCurrency(task.unitPrice)}</p>
              <p className="text-xs text-muted-foreground">每条单价</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
