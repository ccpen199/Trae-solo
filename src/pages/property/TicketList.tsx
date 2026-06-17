import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion as m } from "framer-motion";
import {
  Search,
  Plus,
  List,
  MapPin,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  Upload,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import {
  cn,
  formatDate,
  getTicketStatusLabel,
  getPriorityLabel,
  getTimeRemaining,
  generateId,
} from "@/utils";
import type { RepairTicket, TicketStatus } from "@/types";

const statusFilters: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending_assign", label: "待派单" },
  { value: "assigned", label: "已派单" },
  { value: "processing", label: "处理中" },
  { value: "completed", label: "已完成" },
  { value: "escalated", label: "已督办" },
];
const priorityFilters = ["all", "low", "medium", "high", "urgent"];
const ticketCategories = ["水电维修", "电梯故障", "公共设施", "绿化维护", "保洁服务", "安保问题", "其他"];
const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

export default function TicketList() {
  const navigate = useNavigate();
  const { repairTickets, addRepairTicket, currentUser } = useAppStore();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", description: "", location: "", category: "水电维修", priority: "medium" as "low" | "medium" | "high" | "urgent", photos: [] as string[] });

  const stats = useMemo(() => ({
    pending: repairTickets.filter(t => t.status === "pending_assign").length,
    processing: repairTickets.filter(t => t.status === "processing" || t.status === "assigned").length,
    completed: repairTickets.filter(t => t.status === "completed").length,
    escalated: repairTickets.filter(t => t.status === "escalated").length,
  }), [repairTickets]);

  const filteredTickets = useMemo(() => repairTickets.filter(t =>
    (statusFilter === "all" || t.status === statusFilter) &&
    (priorityFilter === "all" || t.priority === priorityFilter) &&
    (t.title.includes(searchQuery) || t.description.includes(searchQuery) || t.location.includes(searchQuery))
  ), [repairTickets, statusFilter, priorityFilter, searchQuery]);

  const isOverdue = (t: RepairTicket) => t.status === "pending_assign" && Date.now() - new Date(t.submitTime).getTime() > 2 * 60 * 60 * 1000;

  const getTimeText = (t: RepairTicket) => {
    if (t.status === "completed") return "已完成";
    if (t.status === "escalated" && t.superviseRecord?.deadline) {
      const r = getTimeRemaining(t.superviseRecord.deadline);
      return `剩余 ${r.hours}小时${r.minutes}分钟`;
    }
    if (t.status === "pending_assign") {
      const e = Date.now() - new Date(t.submitTime).getTime();
      return `已等待 ${Math.floor(e / 3600000)}小时${Math.floor((e % 3600000) / 60000)}分钟`;
    }
    return "处理中";
  };

  const handleCreateTicket = () => {
    addRepairTicket({
      id: generateId(), ...newTicket,
      submitter: currentUser.id, submitterName: currentUser.name,
      submitTime: new Date().toISOString(), status: "pending_assign",
      escalated: false, processLog: [{ time: new Date().toISOString(), action: "提交报修", operator: currentUser.name, remark: "业主提交报修申请" }],
    });
    setIsModalOpen(false);
    setNewTicket({ title: "", description: "", location: "", category: "水电维修", priority: "medium", photos: [] });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">报修工单大厅</h1>
          <p className="text-sm text-slate-500 mt-1">管理和跟踪所有物业报修工单</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          新建工单
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "待派单", value: stats.pending, trend: 12, color: "text-amber-600" },
          { label: "处理中", value: stats.processing, trend: -5, color: "text-primary-600" },
          { label: "已完成", value: stats.completed, trend: 23, color: "text-emerald-600" },
          { label: "已督办", value: stats.escalated, trend: 2, color: "text-rose-600" },
        ].map((stat, i) => (
          <m.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card><CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-slate-500">{stat.label}</p><p className={cn("text-3xl font-bold mt-2", stat.color)}>{stat.value}</p></div>
                <div className={cn("flex items-center gap-1 text-sm", stat.trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {stat.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(stat.trend)}%</span>
                </div>
              </div>
            </CardContent></Card>
          </m.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <Button variant={viewMode === "list" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="px-3"><List className="w-4 h-4 mr-1" />列表视图</Button>
                <Button variant={viewMode === "map" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("map")} className="px-3"><MapPin className="w-4 h-4 mr-1" />地图视图</Button>
              </div>
              <div className="flex gap-1">{statusFilters.map(f => (
                <Button key={f.value} variant={statusFilter === f.value ? "primary" : "ghost"} size="sm" onClick={() => setStatusFilter(f.value)} className="px-3">{f.label}</Button>
              ))}</div>
              <div className="flex gap-1">{priorityFilters.map(f => (
                <Button key={f} variant={priorityFilter === f ? "primary" : "ghost"} size="sm" onClick={() => setPriorityFilter(f)} className="px-3">{f === "all" ? "全部" : getPriorityLabel(f as any).label}</Button>
              ))}</div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜索工单..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn("pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64")} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? <Empty title="暂无工单" description="暂无符合条件的工单" /> : (
            <div className="space-y-4">{filteredTickets.map((t, i) => {
              const p = getPriorityLabel(t.priority);
              const s = getTicketStatusLabel(t.status);
              const overdue = isOverdue(t);
              return (
                <m.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} onClick={() => navigate(`/property/ticket/${t.id}`)} className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all duration-200",
                  t.status === "escalated" ? "border-rose-300 bg-rose-50/50" : overdue ? "border-rose-300 bg-rose-50/30 animate-pulse" : "border-slate-200 bg-white hover:shadow-md"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">{t.title}</h3>
                        <Badge className={cn(p.bgColor, p.color)}>{p.label}</Badge>
                        <Badge className={cn(s.bgColor, s.color)}>{s.label}</Badge>
                        {t.status === "escalated" && <Badge variant="danger" dot><AlertTriangle className="w-3 h-3" />已督办</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{t.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDate(t.submitTime, "YYYY-MM-DD HH:mm")}</span>
                        <span className={cn("flex items-center gap-1", overdue ? "text-rose-600 font-medium" : "")}>{getTimeText(t)}</span>
                      </div>
                      {t.assigneeName && <div className="flex items-center gap-1 mt-2 text-sm text-slate-600"><User className="w-4 h-4" /><span>处理人：{t.assigneeName}</span></div>}
                    </div>
                  </div>
                </m.div>
              );
            })}</div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新建报修工单" description="请填写报修信息，我们将尽快安排处理" size="lg" footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>取消</Button>
          <Button onClick={handleCreateTicket}>提交报修</Button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标题 <span className="text-rose-500">*</span></label>
            <input value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">详细描述 <span className="text-rose-500">*</span></label>
            <textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} rows={3} className={cn(inputClass, "resize-none")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">位置 <span className="text-rose-500">*</span></label>
              <input value={newTicket.location} onChange={(e) => setNewTicket({ ...newTicket, location: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">类别</label>
              <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} className={inputClass}>
                {ticketCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
            <div className="flex gap-2">{(["low", "medium", "high", "urgent"] as const).map(p => {
              const info = getPriorityLabel(p);
              return (
                <button key={p} onClick={() => setNewTicket({ ...newTicket, priority: p })} className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  newTicket.priority === p ? cn(info.bgColor, info.color, "border-transparent") : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}>{info.label}</button>
              );
            })}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">上传照片</label>
            <div className="flex flex-wrap gap-2">
              {newTicket.photos.map((photo, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => setNewTicket({ ...newTicket, photos: newTicket.photos.filter((_, i) => i !== idx) })} className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-500 mt-1">上传</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const urls = files.map(f => URL.createObjectURL(f));
                  setNewTicket({ ...newTicket, photos: [...newTicket.photos, ...urls] });
                }} />
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
