import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs"
import { Select, SelectItem } from "../components/ui/Select"
import { formatCurrency, formatDate } from "../lib/utils"
import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Send,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts"

export function Settlement() {
  const settlements = useAppStore((state) => state.settlements)
  const currentRole = useAppStore((state) => state.currentRole)
  const currentUser = useAppStore((state) => state.currentUser)
  const [period, setPeriod] = useState("month")

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    income: Math.floor(Math.random() * 5000) + 2000,
    expense: Math.floor(Math.random() * 3000) + 1000,
  }))

  const pieData = [
    { name: "图像分割", value: 45, color: "#8b5cf6" },
    { name: "语音标注", value: 25, color: "#06b6d4" },
    { name: "视频标注", value: 20, color: "#22c55e" },
    { name: "医疗影像", value: 10, color: "#f59e0b" },
  ]

  const totalEarnings = settlements.reduce((sum, s) => sum + s.amount, 0)
  const pendingAmount = settlements.filter((s) => s.status === "processing").reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {currentRole === "publisher" ? "结算中心" : "我的收入"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {currentRole === "publisher"
              ? "管理项目预算，发放标注报酬"
              : "查看收入明细，申请提现"}
          </p>
        </div>
        {currentRole === "annotator" && (
          <Button>
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            申请提现
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {currentRole === "publisher" ? "总预算支出" : "累计收入"}
                </p>
                <p className="text-3xl font-bold mt-1 text-primary">
                  {formatCurrency(currentRole === "publisher" ? 28500 : totalEarnings + 15680)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">+12.5%</span>
              较上月
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {currentRole === "publisher" ? "待结算金额" : "待入账"}
                </p>
                <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(currentRole === "publisher" ? 3200 : pendingAmount + 580)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              审核通过后自动结算
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {currentRole === "publisher" ? "已完成结算" : "已提现"}
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {formatCurrency(currentRole === "publisher" ? 25300 : 12480)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              共 {settlements.length + 8} 笔记录
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">
            <FileText className="w-4 h-4 mr-2" />
            结算记录
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            收入分析
          </TabsTrigger>
          {currentRole === "publisher" && (
            <TabsTrigger value="methods">
              <CreditCard className="w-4 h-4 mr-2" />
              支付方式
            </TabsTrigger>
          )}
          {currentRole === "annotator" && (
            <TabsTrigger value="withdraw">
              <Wallet className="w-4 h-4 mr-2" />
              提现管理
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>结算记录</CardTitle>
                <CardDescription>所有结算明细</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={setPeriod} className="w-32">
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">本年</SelectItem>
                </Select>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="py-3 px-4 font-medium">项目名称</th>
                      <th className="py-3 px-4 font-medium">
                        {currentRole === "publisher" ? "标注员" : "发布方"}
                      </th>
                      <th className="py-3 px-4 font-medium">数量</th>
                      <th className="py-3 px-4 font-medium">金额</th>
                      <th className="py-3 px-4 font-medium">支付方式</th>
                      <th className="py-3 px-4 font-medium">状态</th>
                      <th className="py-3 px-4 font-medium">日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {settlements.map((settlement) => (
                      <tr
                        key={settlement.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium">{settlement.taskName}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {settlement.userName}
                        </td>
                        <td className="py-3 px-4 text-sm">{settlement.units} 条</td>
                        <td className="py-3 px-4 font-medium text-primary">
                          {formatCurrency(settlement.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {settlement.paymentMethod === "wechat" ? (
                              <>
                                <span className="w-3 h-3 rounded-full bg-green-500" />
                                微信
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3 h-3" />
                                银行卡
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={settlement.status} />
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {settlement.createdAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>收支趋势</CardTitle>
                <CardDescription>近12个月收支情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="income" name="收入" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      {currentRole === "publisher" && (
                        <Bar dataKey="expense" name="支出" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>收入构成</CardTitle>
                <CardDescription>按任务类型分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methods">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>微信支付</CardTitle>
                <CardDescription>企业微信付款到零钱</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">微</span>
                  </div>
                  <div>
                    <p className="font-medium">已绑定</p>
                    <p className="text-sm text-muted-foreground">支持批量付款</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  更换商户号
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>银行卡转账</CardTitle>
                <CardDescription>企业对公账户支付</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">工商银行 **** 8821</p>
                    <p className="text-sm text-muted-foreground">T+1 到账</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  更换银行卡
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>提现账户</CardTitle>
              <CardDescription>管理您的提现收款账户</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">微</span>
                  </div>
                  <div>
                    <p className="font-medium">微信钱包</p>
                    <p className="text-sm text-muted-foreground">实时到账</p>
                  </div>
                </div>
                <Badge>默认</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">招商银行 **** 6632</p>
                    <p className="text-sm text-muted-foreground">T+1 工作日到账</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  设为默认
                </Button>
              </div>

              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                添加提现账户
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    completed: { variant: "success", label: "已完成", icon: <CheckCircle className="w-3 h-3" /> },
    processing: { variant: "warning", label: "处理中", icon: <Clock className="w-3 h-3" /> },
    pending: { variant: "secondary", label: "待处理", icon: <Clock className="w-3 h-3" /> },
    failed: { variant: "destructive", label: "失败", icon: <AlertCircle className="w-3 h-3" /> },
  }

  const v = variants[status] || variants.pending

  return (
    <Badge variant={v.variant} className="flex items-center gap-1 w-fit">
      {v.icon}
      {v.label}
    </Badge>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
