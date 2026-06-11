import { useState } from "react";
import { AlertTriangle, Plus, X, User, Clock, ChevronRight, Shield, MessageSquare, CornerUpRight } from "lucide-react";

const SEVERITY: Record<string, { color: string; bg: string }> = {
  "低": { color: "text-[#2EC4B6]", bg: "bg-[#2EC4B6]/10" },
  "中": { color: "text-[#FFC857]", bg: "bg-[#FFC857]/10" },
  "高": { color: "text-[#E63946]", bg: "bg-[#E63946]/10" },
};

const TICKET_STATUS: Record<string, { color: string; bg: string }> = {
  "待处理": { color: "text-[#FFC857]", bg: "bg-[#FFC857]/10" },
  "处理中": { color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10" },
  "已解决": { color: "text-[#2EC4B6]", bg: "bg-[#2EC4B6]/10" },
  "已关闭": { color: "text-gray-400", bg: "bg-gray-100" },
};

const TRANSFER_TARGETS = ["李经理", "张主管", "王客服", "赵后勤"];

const KEYWORDS = ["卫生问题", "配送延迟", "食品安全", "价格争议", "服务态度"];

const ALERTS = [
  { id: 1, content: "食堂1号窗口多次收到卫生投诉", severity: "高", source: "动态圈", time: "10分钟前" },
  { id: 2, content: "北区配送延迟反馈增多", severity: "中", source: "客服", time: "30分钟前" },
  { id: 3, content: "二手交易订单#2048纠纷升级", severity: "高", source: "交易系统", time: "1小时前" },
  { id: 4, content: "图书馆占座系统功能异常", severity: "中", source: "动态圈", time: "2小时前" },
  { id: 5, content: "东区宿舍热水供应投诉", severity: "低", source: "客服", time: "3小时前" },
  { id: 6, content: "校园跑腿服务价格争议", severity: "低", source: "动态圈", time: "5小时前" },
];

interface TimelineEntry {
  time: string;
  action: string;
  user: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  created: string;
  timeline: TimelineEntry[];
}

const INITIAL_TICKETS: Ticket[] = [
  { id: "T-1001", title: "食堂卫生投诉处理", status: "处理中", assignee: "张主管", priority: "高", created: "2025-06-03 09:15",
    timeline: [
      { time: "09:15", action: "工单创建", user: "系统" },
      { time: "09:20", action: "分配给张主管", user: "李经理" },
      { time: "10:30", action: "已联系食堂负责人", user: "张主管" },
    ]
  },
  { id: "T-1002", title: "北区配送延迟跟进", status: "待处理", assignee: "未分配", priority: "中", created: "2025-06-03 10:00",
    timeline: [
      { time: "10:00", action: "工单创建", user: "系统" },
    ]
  },
  { id: "T-1003", title: "交易纠纷#2048调解", status: "已解决", assignee: "王客服", priority: "高", created: "2025-06-02 14:30",
    timeline: [
      { time: "14:30", action: "工单创建", user: "系统" },
      { time: "14:45", action: "分配给王客服", user: "李经理" },
      { time: "16:00", action: "联系买卖双方", user: "王客服" },
      { time: "17:30", action: "双方达成一致，退款处理", user: "王客服" },
    ]
  },
  { id: "T-1004", title: "热水供应问题反馈", status: "已关闭", assignee: "赵后勤", priority: "低", created: "2025-06-01 08:00",
    timeline: [
      { time: "08:00", action: "工单创建", user: "系统" },
      { time: "09:00", action: "已联系物业", user: "赵后勤" },
      { time: "11:00", action: "热水已恢复", user: "赵后勤" },
    ]
  },
];

export default function AdminSentiment() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [showTicket, setShowTicket] = useState<string | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState(TRANSFER_TARGETS[0]);
  const [transferReason, setTransferReason] = useState("");
  const [transferUrgency, setTransferUrgency] = useState("中");
  const selectedTicket = tickets.find((t) => t.id === showTicket);

  const updateTicketStatus = (ticketId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, timeline: [...t.timeline, { time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), action: `状态变更为${newStatus}`, user: "当前用户" }] }
          : t
      )
    );
  };

  const handleTransfer = () => {
    if (!selectedTicket || !transferReason.trim()) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, assignee: transferTarget, timeline: [...t.timeline, { time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), action: `转办给${transferTarget}，原因: ${transferReason}，紧急程度: ${transferUrgency}`, user: "当前用户" }] }
          : t
      )
    );
    setShowTransfer(false);
    setTransferReason("");
    setTransferUrgency("中");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">舆情监测与工单</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#1B3A5C] mb-4 flex items-center gap-2"><Shield size={16} className="text-[#FF6B35]" />关键词规则配置</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {KEYWORDS.map((kw) => (
                  <span key={kw} className="text-xs px-3 py-1.5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] flex items-center gap-1">
                    {kw}
                    <button className="hover:text-[#E63946]"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="添加关键词" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <button className="px-3 py-1.5 rounded-lg bg-[#1B3A5C] text-white text-sm">添加</button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C] flex items-center gap-2"><AlertTriangle size={16} className="text-[#E63946]" />告警列表</h3>
                <span className="text-xs text-gray-400">{ALERTS.length} 条告警</span>
              </div>
              <div className="space-y-3">
                {ALERTS.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm text-[#1B3A5C] flex-1">{alert.content}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${SEVERITY[alert.severity].bg} ${SEVERITY[alert.severity].color}`}>{alert.severity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>来源: {alert.source}</span>
                      <div className="flex items-center gap-3">
                        <span>{alert.time}</span>
                        <button onClick={() => setShowCreateTicket(true)} className="text-[#FF6B35] hover:underline flex items-center gap-1">
                          <Plus size={10} />创建工单
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C] flex items-center gap-2"><MessageSquare size={16} className="text-[#2EC4B6]" />工单列表</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">工单号</th>
                    <th className="text-left py-2 text-gray-500 font-medium">标题</th>
                    <th className="text-center py-2 text-gray-500 font-medium">状态</th>
                    <th className="text-center py-2 text-gray-500 font-medium">优先级</th>
                    <th className="text-left py-2 text-gray-500 font-medium">负责人</th>
                    <th className="text-right py-2 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-600 font-mono text-xs">{ticket.id}</td>
                      <td className="py-2.5 text-[#1B3A5C]">{ticket.title}</td>
                      <td className="text-center py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TICKET_STATUS[ticket.status].bg} ${TICKET_STATUS[ticket.status].color}`}>{ticket.status}</span>
                      </td>
                      <td className="text-center py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY[ticket.priority].bg} ${SEVERITY[ticket.priority].color}`}>{ticket.priority}</span>
                      </td>
                      <td className="py-2.5 text-gray-600 flex items-center gap-1"><User size={12} />{ticket.assignee}</td>
                      <td className="text-right py-2.5">
                        <button onClick={() => setShowTicket(ticket.id)} className="text-[#FF6B35] hover:underline flex items-center gap-1 ml-auto text-xs">
                          详情<ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowTicket(null); setShowTransfer(false); }}>
            <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#1B3A5C]">{selectedTicket.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{selectedTicket.id}</span>
                    <span className={`px-2 py-0.5 rounded-full ${TICKET_STATUS[selectedTicket.status].bg} ${TICKET_STATUS[selectedTicket.status].color}`}>{selectedTicket.status}</span>
                  </div>
                </div>
                <button onClick={() => { setShowTicket(null); setShowTransfer(false); }}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div><span className="text-gray-500">负责人: </span><span className="text-[#1B3A5C]">{selectedTicket.assignee}</span></div>
                <div><span className="text-gray-500">创建时间: </span><span className="text-[#1B3A5C]">{selectedTicket.created}</span></div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setShowTransfer(!showTransfer)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF6B35] text-[#FF6B35] text-xs font-medium hover:bg-[#FF6B35]/5 transition-colors">
                  <CornerUpRight size={12} />转办
                </button>
              </div>
              {showTransfer && (
                <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16 shrink-0">转办给</span>
                    <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]">
                      {TRANSFER_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 w-16 shrink-0 mt-2">转办原因</span>
                    <input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="请输入转办原因" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16 shrink-0">紧急程度</span>
                    <div className="flex gap-2">
                      {["高", "中", "低"].map((u) => (
                        <button key={u} onClick={() => setTransferUrgency(u)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${transferUrgency === u ? "bg-[#FF6B35] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{u}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleTransfer} className="w-full py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55d2b] transition-colors">确认转办</button>
                </div>
              )}
              <h4 className="text-sm font-medium text-[#1B3A5C] mb-3">处理时间线</h4>
              <div className="space-y-3 pl-4 border-l-2 border-[#2EC4B6]/30 mb-5">
                {selectedTicket.timeline.map((step, i) => (
                  <div key={i} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#2EC4B6] border-2 border-white" />
                    <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-2"><Clock size={10} />{step.time}</div>
                    <div className="text-sm text-[#1B3A5C]">{step.action}</div>
                    <div className="text-xs text-gray-400">操作人: {step.user}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                {selectedTicket.status === "待处理" && (
                  <button onClick={() => updateTicketStatus(selectedTicket.id, "处理中")} className="flex-1 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55d2b] transition-colors">开始处理</button>
                )}
                {selectedTicket.status === "处理中" && (
                  <button onClick={() => updateTicketStatus(selectedTicket.id, "已解决")} className="flex-1 py-2 rounded-lg bg-[#2EC4B6] text-white text-sm font-medium hover:bg-[#27b0a3] transition-colors">标记解决</button>
                )}
                {selectedTicket.status === "已解决" && (
                  <button onClick={() => updateTicketStatus(selectedTicket.id, "已关闭")} className="flex-1 py-2 rounded-lg bg-gray-400 text-white text-sm font-medium hover:bg-gray-500 transition-colors">关闭工单</button>
                )}
              </div>
            </div>
          </div>
        )}
        {showCreateTicket && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreateTicket(false)}>
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C]">创建工单</h3>
                <button onClick={() => setShowCreateTicket(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input placeholder="工单标题" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <textarea placeholder="问题描述" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
                <div className="flex gap-3">
                  <select className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]">
                    <option>优先级</option><option>高</option><option>中</option><option>低</option>
                  </select>
                  <select className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]">
                    <option>分配给</option><option>张主管</option><option>王客服</option><option>赵后勤</option>
                  </select>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-[#FF6B35] text-white font-medium text-sm hover:bg-[#e55d2b] transition-colors">创建工单</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
