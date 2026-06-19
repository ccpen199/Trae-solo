import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog"
import { Textarea } from "../components/ui/Textarea"
import { Label } from "../components/ui/Label"
import { formatDate, formatNumber, calculateJaccard } from "../lib/utils"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Users,
  TrendingUp,
  Eye,
  Check,
  X,
  MessageSquare,
  Gauge,
  Target,
} from "lucide-react"
import type { Dispute, Annotation } from "../types"

export function QualityControl() {
  const disputes = useAppStore((state) => state.disputes)
  const resolveDispute = useAppStore((state) => state.resolveDispute)
  const currentUser = useAppStore((state) => state.currentUser)

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState("")
  const [showResolveDialog, setShowResolveDialog] = useState(false)

  const pendingDisputes = disputes.filter((d) => d.status === "pending")
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved")

  const handleResolve = (approved: boolean) => {
    if (selectedDispute && resolution) {
      resolveDispute(
        selectedDispute.id,
        approved ? `申诉通过：${resolution}` : `申诉驳回：${resolution}`,
        currentUser?.id || ""
      )
      setShowResolveDialog(false)
      setSelectedDispute(null)
      setResolution("")
    }
  }

  const consistencyData = [
    { unit: "unit-1", jaccard: 0.92, annotators: ["李思琪", "陈雨萱", "王浩然"] },
    { unit: "unit-2", jaccard: 0.85, annotators: ["李思琪", "陈雨萱", "王浩然"] },
    { unit: "unit-3", jaccard: 0.78, annotators: ["李思琪", "陈雨萱", "王浩然"] },
    { unit: "unit-4", jaccard: 0.95, annotators: ["李思琪", "陈雨萱", "王浩然"] },
    { unit: "unit-5", jaccard: 0.65, annotators: ["李思琪", "陈雨萱", "王浩然"], flagged: true },
    { unit: "unit-6", jaccard: 0.88, annotators: ["李思琪", "陈雨萱", "王浩然"] },
  ]

  const adversarialStats = {
    total: 25,
    detected: 23,
    accuracy: 92,
    flaggedAnnotators: 2,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">质量控制中心</h2>
        <p className="text-muted-foreground mt-1">
          监控标注质量，处理争议申诉，确保数据准确性
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Shield className="w-5 h-5" />}
          label="平均一致性"
          value="92.3%"
          trend="+1.5%"
          positive
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="质检通过率"
          value="89.7%"
          trend="+2.1%"
          positive
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="待处理争议"
          value={pendingDisputes.length.toString()}
          trend="需关注"
          positive={false}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="对抗样本检出率"
          value={`${adversarialStats.accuracy}%`}
          trend="优秀"
          positive
        />
      </div>

      <Tabs defaultValue="consistency">
        <TabsList>
          <TabsTrigger value="consistency">
            <BarChart3 className="w-4 h-4 mr-2" />
            一致性校验
          </TabsTrigger>
          <TabsTrigger value="adversarial">
            <Shield className="w-4 h-4 mr-2" />
            对抗样本检测
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <MessageSquare className="w-4 h-4 mr-2" />
            争议仲裁
            {pendingDisputes.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5">
                {pendingDisputes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sampling">
            <Eye className="w-4 h-4 mr-2" />
            抽检管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consistency">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>一致性检测结果</CardTitle>
                <CardDescription>
                  基于 Jaccard 相似度计算多人标注结果的一致性
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consistencyData.map((item) => (
                    <div
                      key={item.unit}
                      className={`p-4 rounded-lg border ${
                        item.flagged ? "border-destructive/50 bg-destructive/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{item.unit}</span>
                          {item.flagged && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              异常
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.jaccard >= 0.85
                                  ? "bg-green-500"
                                  : item.jaccard >= 0.7
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${item.jaccard * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {(item.jaccard * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>标注员：</span>
                        {item.annotators.map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1">
                            {name}
                            {i < item.annotators.length - 1 && "、"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>一致性分布</CardTitle>
                <CardDescription>各区间占比统计</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ConsistencyBar label="优秀 (≥90%)" value={45} color="bg-green-500" />
                <ConsistencyBar label="良好 (80%-90%)" value={35} color="bg-blue-500" />
                <ConsistencyBar label="合格 (70%-80%)" value={15} color="bg-yellow-500" />
                <ConsistencyBar label="不合格 (<70%)" value={5} color="bg-red-500" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="adversarial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>对抗样本统计</CardTitle>
                <CardDescription>注入已知答案的质检样本，实时监测标注质量</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">注入总数</p>
                    <p className="text-2xl font-bold mt-1">{adversarialStats.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm text-muted-foreground">正确标注数</p>
                    <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                      {adversarialStats.detected}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    <span className="font-medium">整体检出准确率</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {adversarialStats.accuracy}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    高于行业平均水平 85%
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-destructive">异常标注员</span>
                  </div>
                  <p className="text-2xl font-bold text-destructive">
                    {adversarialStats.flaggedAnnotators} 人
                  </p>
                  <p className="text-sm text-destructive/70 mt-1">
                    准确率低于阈值，需重点关注
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>检测规则配置</CardTitle>
                <CardDescription>调整对抗样本检测参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>注入比例</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      defaultValue="5"
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">5%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>告警阈值</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="60"
                      max="95"
                      defaultValue="80"
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">80%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>抽检频率</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      defaultValue="10"
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">10%</span>
                  </div>
                </div>

                <Button className="w-full">保存配置</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disputes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>争议申诉列表</CardTitle>
                <CardDescription>处理标注员对审核结果的申诉</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingDisputes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无待处理的争议</p>
                  </div>
                ) : (
                  pendingDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="warning">待处理</Badge>
                            <span className="text-sm font-medium">{dispute.taskName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            申诉人：{dispute.annotatorName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {dispute.createdAt}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{dispute.reason}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedDispute(dispute)
                          setShowResolveDialog(true)
                        }}>
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        <Button size="sm" variant="default" onClick={() => {
                          setSelectedDispute(dispute)
                          setShowResolveDialog(true)
                        }}>
                          处理申诉
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>已处理记录</CardTitle>
                <CardDescription>最近处理的争议申诉</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resolvedDisputes.map((dispute) => (
                  <div key={dispute.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">已解决</Badge>
                      <span className="text-xs text-muted-foreground">
                        {dispute.createdAt}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{dispute.taskName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dispute.annotatorName}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sampling">
          <Card>
            <CardHeader>
              <CardTitle>抽检任务队列</CardTitle>
              <CardDescription>按照配置的抽检规则生成的待审核任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无待抽检任务</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>处理争议申诉</DialogTitle>
            <DialogDescription>
              请仔细核实标注结果，给出公正的仲裁决定
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">申诉人</span>
                <span className="text-sm text-muted-foreground">
                  {selectedDispute?.annotatorName}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">申诉理由：</span>
                {selectedDispute?.reason}
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                标注详情预览区域
              </p>
            </div>

            <div className="space-y-2">
              <Label>仲裁说明</Label>
              <Textarea
                placeholder="请输入仲裁结果说明..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleResolve(false)}>
              <XCircle className="w-4 h-4 mr-2" />
              驳回申诉
            </Button>
            <Button variant="default" onClick={() => handleResolve(true)}>
              <Check className="w-4 h-4 mr-2" />
              通过申诉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  trend,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
  positive?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <div className={`mt-2 text-xs font-medium ${positive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
          <TrendingUp className={`w-3 h-3 inline mr-1 ${!positive && "rotate-180"}`} />
          {trend}
        </div>
      </CardContent>
    </Card>
  )
}

function ConsistencyBar({ label, value, color }: { label: string; value: number; color: string }) {
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
