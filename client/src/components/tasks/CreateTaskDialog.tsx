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
import { Card, CardContent } from "../ui/Card"
import { Badge } from "../ui/Badge"
import { Image, Mic, Video, Activity, FileText, CheckCircle, ChevronRight, DollarSign, Users, Target, Clock, Shield, Zap } from "lucide-react"
import type { TaskType } from "../../types"
import { useAppStore } from "../../store/useAppStore"
import { generateId } from "../../lib/utils"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: (taskId: string) => void
}

export function CreateTaskDialog({ open, onOpenChange, onTaskCreated }: CreateTaskDialogProps) {
  const addTask = useAppStore((state) => state.addTask)
  const currentUser = useAppStore((state) => state.currentUser)
  const [step, setStep] = useState(1)
  const [taskType, setTaskType] = useState<TaskType>("image_segmentation")
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalUnits: "100",
    unitPrice: "0.5",
    deadline: "",
    requiredSkillLevel: "2",
    annotationPerUnit: "3",
    consistencyThreshold: "0.85",
    samplingRate: "0.1",
    adversarialEnabled: true,
    adversarialRatio: "0.05",
    paymentMethod: "wechat",
    settlementCycle: "daily",
    reviewThreshold: "0.7",
    autoApprove: true,
    reviewerAssignment: "auto",
  })

  const taskTypes = [
    { id: "image_segmentation", name: "图像分割", icon: <Image className="w-6 h-6" />, desc: "实例分割、语义分割、边界框" },
    { id: "audio_transcription", name: "语音标注", icon: <Mic className="w-6 h-6" />, desc: "转写、情感标注、时间戳切分" },
    { id: "video_action", name: "视频标注", icon: <Video className="w-6 h-6" />, desc: "动作识别、帧序列打标、目标跟踪" },
    { id: "medical_ct", name: "医疗影像", icon: <Activity className="w-6 h-6" />, desc: "DICOM解析、病灶标注、器官分割" },
  ]

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    const newTask = {
      id: generateId(),
      title: formData.title || "新标注项目",
      description: formData.description,
      type: taskType,
      status: "published" as const,
      publisherId: currentUser?.id || "",
      publisherName: currentUser?.name || "发布方",
      totalUnits: parseInt(formData.totalUnits) || 100,
      completedUnits: 0,
      unitPrice: parseFloat(formData.unitPrice) || 0.5,
      rewardPool: (parseInt(formData.totalUnits) || 100) * (parseFloat(formData.unitPrice) || 0.5),
      requiredSkillLevel: parseInt(formData.requiredSkillLevel) || 2,
      consistencyThreshold: parseFloat(formData.consistencyThreshold) || 0.85,
      annotationPerUnit: parseInt(formData.annotationPerUnit) || 3,
      deadline: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      tags: [taskType],
      qualityConfig: {
        samplingRate: parseFloat(formData.samplingRate) || 0.1,
        minConsistency: parseFloat(formData.consistencyThreshold) || 0.85,
        adversarialEnabled: formData.adversarialEnabled,
        adversarialRatio: parseFloat(formData.adversarialRatio) || 0.05,
        reviewThreshold: parseFloat(formData.reviewThreshold) || 0.7,
      },
    }
    
    addTask(newTask)
    setShowSuccess(true)
    onTaskCreated?.(newTask.id)
  }

  const handleClose = () => {
    onOpenChange(false)
    setStep(1)
    setShowSuccess(false)
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">项目创建成功！</DialogTitle>
            <DialogDescription className="mb-8">
              您的标注项目已成功发布，系统将自动匹配符合资质的标注员
            </DialogDescription>

            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">任务类型</span>
                  </div>
                  <p className="font-semibold">
                    {taskTypes.find(t => t.id === taskType)?.name}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">预算总额</span>
                  </div>
                  <p className="font-semibold">
                    {(parseInt(formData.totalUnits) * parseFloat(formData.unitPrice)).toFixed(2)} 元
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">任务数量</span>
                  </div>
                  <p className="font-semibold">{formData.totalUnits} 条</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-muted-foreground">截止日期</span>
                  </div>
                  <p className="font-semibold">{formData.deadline || "30天后"}</p>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">质检配置已生效</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">一致性阈值</p>
                  <p className="font-medium">{(parseFloat(formData.consistencyThreshold) * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">抽检比例</p>
                  <p className="font-medium">{(parseFloat(formData.samplingRate) * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">对抗样本</p>
                  <p className="font-medium">{formData.adversarialEnabled ? "已开启" : "已关闭"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                返回项目列表
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                <Zap className="w-4 h-4 mr-2" />
                立即上传数据
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            配置标注任务的基本信息、质量要求和质检规则
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4].map((s) => (
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
              {s < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > s ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 pb-4 text-xs text-muted-foreground">
          <span className={step === 1 ? "text-primary font-medium" : ""}>任务类型</span>
          <span className={step === 2 ? "text-primary font-medium" : ""}>基本信息</span>
          <span className={step === 3 ? "text-primary font-medium" : ""}>质检标准</span>
          <span className={step === 4 ? "text-primary font-medium" : ""}>结算审核</span>
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

        {step === 4 && (
          <div className="space-y-5">
            <div className="p-4 rounded-lg bg-muted/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-medium">结算规则</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>支付方式</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                  >
                    <SelectItem value="wechat">微信支付</SelectItem>
                    <SelectItem value="alipay">支付宝</SelectItem>
                    <SelectItem value="bank">银行卡转账</SelectItem>
                    <SelectItem value="platform">平台钱包</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>结算周期</Label>
                  <Select
                    value={formData.settlementCycle}
                    onValueChange={(v) => setFormData({ ...formData, settlementCycle: v })}
                  >
                    <SelectItem value="daily">日结（每日24点）</SelectItem>
                    <SelectItem value="weekly">周结（每周一）</SelectItem>
                    <SelectItem value="biweekly">双周结</SelectItem>
                    <SelectItem value="monthly">月结（每月1号）</SelectItem>
                    <SelectItem value="manual">人工触发</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">预估总支出</span>
                  <span className="font-bold text-lg text-green-600">
                    ¥ {(parseInt(formData.totalUnits) * parseFloat(formData.unitPrice)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>单价 × 数量</span>
                  <span>¥{formData.unitPrice} × {formData.totalUnits}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>平台服务费 (5%)</span>
                  <span>¥ {(parseInt(formData.totalUnits) * parseFloat(formData.unitPrice) * 0.05).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium">审核配置</h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">自动通过阈值</Label>
                  <span className="text-sm font-medium">
                    {(parseFloat(formData.reviewThreshold) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={formData.reviewThreshold}
                  onChange={(e) => setFormData({ ...formData, reviewThreshold: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  多人标注一致性超过此阈值且通过抽检，将自动审核通过
                </p>
              </div>

              <div className="space-y-2">
                <Label>审核员分配方式</Label>
                <Select
                  value={formData.reviewerAssignment}
                  onValueChange={(v) => setFormData({ ...formData, reviewerAssignment: v })}
                >
                  <SelectItem value="auto">系统自动分配</SelectItem>
                  <SelectItem value="manual">手动指定审核员</SelectItem>
                  <SelectItem value="pool">从审核员池随机分配</SelectItem>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border">
                <div>
                  <p className="text-sm font-medium">自动验收</p>
                  <p className="text-xs text-muted-foreground">达标数据自动通过，无需人工审核</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, autoApprove: !formData.autoApprove })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.autoApprove ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      formData.autoApprove ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-700 dark:text-green-400">配置摘要</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">任务类型：</span>
                  <span className="font-medium">{taskTypes.find(t => t.id === taskType)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">技能等级：</span>
                  <span className="font-medium">Lv.{formData.requiredSkillLevel}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">一致性阈值：</span>
                  <span className="font-medium">{(parseFloat(formData.consistencyThreshold) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">抽检比例：</span>
                  <span className="font-medium">{(parseFloat(formData.samplingRate) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">结算周期：</span>
                  <span className="font-medium">{
                    { daily: "日结", weekly: "周结", biweekly: "双周结", monthly: "月结", manual: "人工" }[formData.settlementCycle]
                  }</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">自动验收：</span>
                  <span className="font-medium">{formData.autoApprove ? "已开启" : "已关闭"}</span>
                </div>
              </div>
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
          {step < 4 ? (
            <Button onClick={handleNext}>下一步</Button>
          ) : (
            <Button onClick={handleSubmit}>
              <CheckCircle className="w-4 h-4 mr-2" />
              创建项目
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
