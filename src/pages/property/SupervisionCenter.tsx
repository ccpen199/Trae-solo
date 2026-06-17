import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { AlertTriangle, Clock, TrendingUp, Clock3, Send, Plus, XCircle } from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { cn, formatDate, getTimeRemaining, generateId } from "@/utils";
import type { SuperviseRecord } from "@/types";

const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function SupervisionCenter() {
  const { repairTickets, updateRepairTicket, currentUser } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [form, setForm] = useState({ instruction: "", deadline: "" });

  const supervisedTickets = useMemo(
    () => repairTickets.filter((t) => t.status === "escalated" || t.superviseRecord),
    [repairTickets]
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const supervised = repairTickets.filter((t) => t.status === "escalated" || t.superviseRecord);
    const overdue = supervised.filter((t) => t.superviseRecord?.deadline && new Date(t.superviseRecord.deadline).getTime() < now);
    const completedIn24h = repairTickets.filter((t) => {
      if (t.status !== "completed" || !t.completeTime) return false;
      return new Date(t.completeTime).getTime() - new Date(t.submitTime).getTime() < 24 * 60 * 60 * 1000;
    }).length;
    const totalCompleted = repairTickets.filter((t) => t.status === "completed").length;
    const assigned = repairTickets.filter((t) => t.assignTime && t.submitTime);
    const avgResponse = assigned.map((t) => new Date(t.assignTime!).getTime() - new Date(t.submitTime).getTime()).reduce((a, b) => a + b, 0);
    return {
      supervising: supervised.length,
      overdue: overdue.length,
      rate24h: totalCompleted > 0 ? Math.round((completedIn24h / totalCompleted) * 100) : 0,
      avgResponse: assigned.length > 0 ? Math.round(avgResponse / assigned.length / 60000) : 0,
    };
  }, [repairTickets]);

  const chartOption = {
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: ["0-30分钟", "30-60分钟", "1-2小时", "2-4小时", "4-8小时", "8小时以上"] },
    yAxis: { type: "value", name: "工单数量" },
    series: [{
      name: "工单数量", type: "bar", data: [12, 18, 8, 5, 3, 2],
      itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#1d4ed8" }] }, borderRadius: [4, 4, 0, 0] },
      barWidth: "50%",
    }],
  };

  const handleSupervise = () => {
    if (!selectedTicketId || !form.instruction || !form.deadline) return;
    const record: SuperviseRecord = {
      id: generateId(), ticketId: selectedTicketId,
      streetOfficer: currentUser.id, officerName: currentUser.name,
      instruction: form.instruction, deadline: new Date(form.deadline).toISOString(), status: "pending",
    };
    updateRepairTicket(selectedTicketId, {
      status: "escalated", escalated: true, escalatedTime: new Date().toISOString(), superviseRecord: record,
    });
    setIsModalOpen(false);
    setSelectedTicketId(null);
    setForm({ instruction: "", deadline: "" });
  };

  const getFeedbackStatus = (s: SuperviseRecord | undefined) => {
    if (!s) return { label: "待反馈", color: "text-amber-600", bgColor: "bg-amber-100" };
    if (s.status === "completed") return { label: "已反馈", color: "text-emerald-600", bgColor: "bg-emerald-100" };
    if (s.status === "processing") return { label: "处理中", color: "text-primary-600", bgColor: "bg-primary-100" };
    return { label: "待反馈", color: "text-amber-600", bgColor: "bg-amber-100" };
  };

  const isOverdue = (s: SuperviseRecord | undefined) => s?.deadline && new Date(s.deadline).getTime() < Date.now();
  const openModal = (ticketId: string) => { setSelectedTicketId(ticketId); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedTicketId(null); setForm({ instruction: "", deadline: "" }); };

  return (
    <div className="p-6 space-y-6">
      <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 font-display">街道督办中心</h1>
            <p className="text-sm text-slate-500 mt-1">督办超时工单，确保及时处理</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal("")}>下发督办指令</Button>
        </div>
      </m.div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "督办中", value: stats.supervising, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "超时未处理", value: stats.overdue, icon: XCircle, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "24小时处理率", value: `${stats.rate24h}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "平均响应时间", value: `${stats.avgResponse}分钟`, icon: Clock3, color: "text-primary-600", bg: "bg-primary-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <m.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card><CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div><p className="text-sm text-slate-500">{stat.label}</p><p className={cn("text-3xl font-bold mt-2", stat.color)}>{stat.value}</p></div>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}><Icon className={cn("w-6 h-6", stat.color)} /></div>
                </div>
              </CardContent></Card>
            </m.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-2">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">督办工单列表</h2></CardHeader>
            <CardContent>
              {supervisedTickets.length === 0 ? <Empty title="暂无督办" description="暂无督办工单" /> : (
                <div className="space-y-4">
                  {supervisedTickets.map((t, i) => {
                    const fs = getFeedbackStatus(t.superviseRecord);
                    const overdue = isOverdue(t.superviseRecord);
                    const remaining = t.superviseRecord?.deadline ? getTimeRemaining(t.superviseRecord.deadline) : null;
                    return (
                      <m.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                        className={cn("p-4 rounded-xl border transition-all", overdue ? "border-rose-400 bg-rose-50/50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-slate-800">{t.title}</h3>
                              <Badge className={cn(fs.bgColor, fs.color)}>{fs.label}</Badge>
                              {overdue && <Badge variant="danger" dot className="animate-pulse"><AlertTriangle className="w-3 h-3" />已超时</Badge>}
                            </div>
                            {t.superviseRecord?.instruction && (
                              <p className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                                <span className="font-medium text-slate-700">督办指令：</span>{t.superviseRecord.instruction}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />提交时间：{formatDate(t.submitTime, "YYYY-MM-DD HH:mm")}</span>
                              {t.superviseRecord?.deadline && remaining && (
                                <span className={cn("flex items-center gap-1", overdue ? "text-rose-600 font-medium animate-pulse" : "")}>
                                  <Clock3 className="w-4 h-4" />{overdue ? "已超时" : `剩余 ${remaining.hours}小时${remaining.minutes}分钟`}
                                </span>
                              )}
                              <span className="flex items-center gap-1"><Send className="w-4 h-4" />督办人：{t.superviseRecord?.officerName || "未指派"}</span>
                            </div>
                            {t.superviseRecord?.feedback && (
                              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                                <p className="text-sm font-medium text-emerald-700">反馈内容：</p>
                                <p className="text-sm text-emerald-600 mt-1">{t.superviseRecord.feedback}</p>
                                {t.superviseRecord.feedbackTime && (
                                  <p className="text-xs text-emerald-500 mt-1">反馈时间：{formatDate(t.superviseRecord.feedbackTime, "YYYY-MM-DD HH:mm")}</p>
                                )}
                              </div>
                            )}
                          </div>
                          {!t.superviseRecord && <Button size="sm" onClick={() => openModal(t.id)}>下发督办</Button>}
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">处理时效统计</h2></CardHeader>
            <CardContent><ReactECharts option={chartOption} style={{ height: "300px" }} /></CardContent>
          </Card>
        </m.div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="下发督办指令" description="请填写督办信息，确保工单及时处理" size="md" footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={closeModal}>取消</Button>
          <Button onClick={handleSupervise}>确认下发</Button>
        </div>
      }>
        <div className="space-y-4">
          {!selectedTicketId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">选择工单</label>
              <select value={selectedTicketId || ""} onChange={(e) => setSelectedTicketId(e.target.value)} className={inputClass}>
                <option value="">请选择要督办的工单</option>
                {repairTickets.filter((t) => t.status !== "completed" && !t.superviseRecord).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">督办指令 <span className="text-rose-500">*</span></label>
            <textarea value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} rows={3} placeholder="请输入督办指令内容" className={cn(inputClass, "resize-none")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">截止时间 <span className="text-rose-500">*</span></label>
            <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
