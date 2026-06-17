import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import { AlertTriangle, FileText, Bell, Send, Plus, Eye, Upload, Clock, TrendingUp, TrendingDown, AlertCircle, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal, DataTable, type Column } from "@/components/ui";
import { useAppStore } from "@/stores";
import { cn, formatDate } from "@/utils";
import type { StreetInstruction } from "@/types";

const typeMap = {
  supervision: { label: "督办", variant: "danger" as const, icon: AlertTriangle },
  inspection: { label: "检查", variant: "warning" as const, icon: FileText },
  notification: { label: "通知", variant: "info" as const, icon: Bell },
  coordination: { label: "协调", variant: "secondary" as const, icon: Send },
};

const statusMap = {
  pending: { label: "待处理", variant: "warning" as const },
  processing: { label: "处理中", variant: "info" as const },
  completed: { label: "已完成", variant: "success" as const },
  overdue: { label: "已逾期", variant: "danger" as const },
};

export default function StreetSupervision() {
  const streetInstructions = useAppStore((s) => s.streetInstructions);
  const [selected, setSelected] = useState<StreetInstruction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [page, setPage] = useState(1);
  const [newInstruction, setNewInstruction] = useState({ title: "", type: "supervision" as keyof typeof typeMap, content: "", deadline: "" });

  const communityRankings = useMemo(
    () => [
      { id: 1, name: "阳光花园小区", score: 92.5, trend: "up" as const, isCurrent: true },
      { id: 2, name: "幸福家园小区", score: 89.3, trend: "up" as const, isCurrent: false },
      { id: 3, name: "和谐社区", score: 85.7, trend: "down" as const, isCurrent: false },
      { id: 4, name: "美好家园", score: 82.1, trend: "up" as const, isCurrent: false },
      { id: 5, name: "温馨小区", score: 78.6, trend: "down" as const, isCurrent: false },
    ],
    []
  );

  const warnings = useMemo(
    () => [
      { id: 1, title: "业主认证率偏低", level: "warning", value: "68%" },
      { id: 2, title: "维修响应超时", level: "danger", value: "3 次" },
      { id: 3, title: "公共收益公示待更新", level: "warning", value: "已逾期 5 天" },
    ],
    []
  );

  const columns: Column<StreetInstruction>[] = [
    { key: "title", title: "标题", dataIndex: "title" },
    { key: "type", title: "类型", dataIndex: "type", width: 100,
      render: (v) => {
        const t = typeMap[v as keyof typeof typeMap];
        const Icon = t.icon;
        return <Badge variant={t.variant}><Icon className="w-3 h-3 mr-1" />{t.label}</Badge>;
      } },
    { key: "issueTime", title: "下发时间", dataIndex: "issueTime", width: 120, render: (v) => formatDate(v as string) },
    { key: "deadline", title: "截止时间", dataIndex: "deadline", width: 120, render: (v) => formatDate(v as string) },
    { key: "status", title: "状态", dataIndex: "status", width: 100,
      render: (v) => { const s = statusMap[v as keyof typeof statusMap]; return <Badge variant={s.variant}>{s.label}</Badge>; } },
    { key: "actions", title: "操作", dataIndex: "id", width: 120, align: "center",
      render: (_, r) => (
        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}
          onClick={() => { setSelected(r); setDetailOpen(true); }}>详情</Button>
      ) },
  ];

  const handleSubmitFeedback = () => {
    if (selected && feedback) {
      console.log(`提交反馈: ${feedback}`);
      setDetailOpen(false);
      setFeedback("");
    }
  };

  const handleCreateInstruction = () => {
    console.log("创建指令:", newInstruction);
    setCreateOpen(false);
    setNewInstruction({ title: "", type: "supervision", content: "", deadline: "" });
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">街道监管中心</h2>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>新建指令</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              辖区小区治理健康度排名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communityRankings.map((c, idx) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all",
                    c.isCurrent ? "bg-primary-50 border-2 border-primary-500" : "bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                    idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-600" : "bg-slate-300"
                  )}>{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium", c.isCurrent && "text-primary-700")}>{c.name}</p>
                      {c.isCurrent && <Badge variant="primary" size="sm">本小区</Badge>}
                    </div>
                    <div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800">{c.score}</p>
                    {c.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500 ml-auto" /> : <TrendingDown className="w-4 h-4 text-rose-500 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              治理预警
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.map((w) => (
              <div key={w.id} className={cn("p-3 rounded-xl flex items-center gap-3", w.level === "danger" ? "bg-rose-50" : "bg-amber-50")}>
                <AlertCircle className={cn("w-5 h-5 flex-shrink-0", w.level === "danger" ? "text-rose-500" : "text-amber-500")} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{w.title}</p>
                  <p className={cn("text-xs", w.level === "danger" ? "text-rose-600" : "text-amber-600")}>{w.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            监管指令
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<StreetInstruction>
            columns={columns}
            data={streetInstructions}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: 10,
              total: streetInstructions.length,
              onChange: (p) => setPage(p),
            }}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="指令详情"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>取消</Button>
            <Button variant="primary" onClick={handleSubmitFeedback} disabled={!feedback}>提交反馈</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={typeMap[selected.type].variant} size="lg">
                {typeMap[selected.type].label}
              </Badge>
              <Badge variant={statusMap[selected.status].variant} size="lg">
                {statusMap[selected.status].label}
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />下发：{formatDate(selected.issueTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />截止：{formatDate(selected.deadline)}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-600 mb-2">指令内容</p>
              <p className="text-slate-700">{selected.content}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">反馈内容</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="请输入反馈内容..."
                className={cn(
                  "w-full p-3 border border-slate-200 rounded-lg resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500"
                )}
                rows={4}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">附件上传</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-500">点击或拖拽文件到此处上传</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="新建监管指令" size="lg"
        footer={<div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreateInstruction} disabled={!newInstruction.title || !newInstruction.content}>创建</Button>
          </div>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">指令标题</label>
            <input type="text" value={newInstruction.title}
              onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
              placeholder="请输入指令标题"
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">指令类型</label>
            <div className="flex gap-2">
              {(Object.keys(typeMap) as Array<keyof typeof typeMap>).map((key) => {
                const t = typeMap[key]; const Icon = t.icon;
                return <Button key={key} variant={newInstruction.type === key ? "primary" : "ghost"} size="sm"
                  leftIcon={<Icon className="w-4 h-4" />}
                  onClick={() => setNewInstruction({ ...newInstruction, type: key })}>{t.label}</Button>;
              })}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">截止时间</label>
            <input type="date" value={newInstruction.deadline}
              onChange={(e) => setNewInstruction({ ...newInstruction, deadline: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">指令内容</label>
            <textarea value={newInstruction.content}
              onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
              placeholder="请输入指令内容..."
              className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4} />
          </div>
        </div>
      </Modal>
    </m.div>
  );
}
