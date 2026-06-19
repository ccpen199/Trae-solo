import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Textarea } from "../ui/Textarea"
import { Label } from "../ui/Label"
import { Select, SelectItem } from "../ui/Select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs"
import { Image, Mic, Video, Activity, FileText } from "lucide-react"
import type { TaskType } from "../../types"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const [step, setStep] = useState(1)
  const [taskType, setTaskType] = useState<TaskType>("image_segmentation")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalUnits: "",
    unitPrice: "",
    deadline: "",
    requiredSkillLevel: "2",
    annotationPerUnit: "3",
    consistencyThreshold: "0.85",
    samplingRate: "0.1",
    adversarialEnabled: true,
    adversarialRatio: "0.05",
  })

  const taskTypes = [
    { id: "image_segmentation", name: "图像分割", icon: <Image className="w-6 h-6" />, desc: "实例分割、语义分割、边界框" },
    { id: "audio_transcription", name: "语音标注", icon: <Mic className="w-6 h-6" />, desc: "转写、情感标注、时间戳切分" },
    { id: "video_action", name: "视频标注", icon: <Video className="w-6 h-6" />, desc: "动作识别、帧序列打标、目标跟踪" },
    { id: "medical_ct", name: "医疗影像", icon: <Activity className="w-6 h-6" />, desc: "DICOM解析、病灶标注、器官分割" },
  ]

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    onOpenChange(false)
    setStep(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            配置标注任务的基本信息、质量要求和质检规则
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 ${
                    step > s ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>任务类型</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {taskTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTaskType(type.id as TaskType)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      taskType === type.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-accent/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                      taskType === type.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {type.icon}
                    </div>
                    <p className="font-medium text-sm">{type.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>项目名称</Label>
              <Input
                placeholder="请输入项目名称"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>项目描述</Label>
              <Textarea
                placeholder="请详细描述标注任务的要求和规范"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>任务数量</Label>
                <Input
                  type="number"
                  placeholder="请输入任务条数"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>单价 (元/条)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="标注单价"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>截止日期</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>技能等级要求</Label>
                <Select
                  value={formData.requiredSkillLevel}
                  onValueChange={(v) => setFormData({ ...formData, requiredSkillLevel: v })}
                >
                  <SelectItem value="1">Lv.1 入门</SelectItem>
                  <SelectItem value="2">Lv.2 初级</SelectItem>
                  <SelectItem value="3">Lv.3 中级</SelectItem>
                  <SelectItem value="4">Lv.4 高级</SelectItem>
                  <SelectItem value="5">Lv.5 专家</SelectItem>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>每条数据标注人数</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.annotationPerUnit}
                  onChange={(e) => setFormData({ ...formData, annotationPerUnit: e.target.value })}
                  className="flex-1"
                />
                <span className="w-8 text-center font-medium">{formData.annotationPerUnit}人</span>
              </div>
              <p className="text-xs text-muted-foreground">
                多人标注可计算一致性得分，提高数据质量
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-medium">一致性校验配置</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">一致性阈值</Label>
                  <span className="text-sm font-medium">
                    {(parseFloat(formData.consistencyThreshold) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="0.95"
                  step="0.05"
                  value={formData.consistencyThreshold}
                  onChange={(e) => setFormData({ ...formData, consistencyThreshold: e.target.value })}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                低于此阈值的标注结果需要进入人工审核
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">抽检审核</h4>
                <span className="text-sm font-medium">
                  {(parseFloat(formData.samplingRate) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.05"
                value={formData.samplingRate}
                onChange={(e) => setFormData({ ...formData, samplingRate: e.target.value })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                按比例随机抽取数据由审核员人工复核
              </p>
            </div>

            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">对抗样本检测</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    推荐开启
                  </span>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, adversarialEnabled: !formData.adversarialEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.adversarialEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      formData.adversarialEnabled ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
              {formData.adversarialEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">注入比例</Label>
                    <span className="text-sm font-medium">
                      {(parseFloat(formData.adversarialRatio) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.1"
                    step="0.01"
                    value={formData.adversarialRatio}
                    onChange={(e) => setFormData({ ...formData, adversarialRatio: e.target.value })}
                    className="w-full"
                  />
                </>
              )}
              <p className="text-xs text-muted-foreground">
                注入已知答案的质检样本，实时监测标注质量，防止作弊
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handlePrev}>
              上一步
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>下一步</Button>
          ) : (
            <Button onClick={handleSubmit}>创建项目</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
