import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { tasks } from "@/mock";
import type { TaskType, TaskStatus } from "@/types";

const typeLabels: Record<TaskType, string> = {
  steps: "步数", video: "视频", checkin: "签到",
  invite: "邀请", limited: "限时", holiday: "节日",
};
const statusLabels: Record<TaskStatus, string> = {
  available: "可领取", in_progress: "进行中",
  completed: "已完成", expired: "已过期",
};
const statusDot: Record<TaskStatus, string> = {
  available: "bg-emerald", in_progress: "bg-gold-400",
  completed: "bg-white/30", expired: "bg-white/15",
};
const typeBadge: Record<TaskType, string> = {
  steps: "bg-emerald/15 text-emerald", video: "bg-indigo-500/15 text-indigo-400",
  checkin: "bg-gold-400/15 text-gold-300", invite: "bg-purple-500/15 text-purple-400",
  limited: "bg-coral/15 text-coral", holiday: "bg-pink-500/15 text-pink-400",
};

export default function Tasks() {
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  const filtered = tasks.filter(t => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gold-text font-display">任务管理</h1>
        <button onClick={() => setShowModal(true)} className="gold-btn !py-2 !px-5 !text-sm">
          <Plus className="h-4 w-4" /> 创建任务
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TaskType | "all")} className="input !w-auto">
          <option value="all">全部类型</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | "all")} className="input !w-auto">
          <option value="all">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-white/40">
              <th className="p-4">任务名称</th>
              <th className="p-4">类型</th>
              <th className="p-4">金币奖励</th>
              <th className="p-4">状态</th>
              <th className="p-4">时间范围</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-night-700/40 transition-colors">
                <td className="p-4 text-white/90 font-medium">{t.title}</td>
                <td className="p-4"><span className={`chip ${typeBadge[t.type]}`}>{typeLabels[t.type]}</span></td>
                <td className="p-4 gold-text font-display font-bold">{t.coinReward}</td>
                <td className="p-4">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className={`h-2 w-2 rounded-full ${statusDot[t.status]}`} />
                    {statusLabels[t.status]}
                  </span>
                </td>
                <td className="p-4 text-white/50 text-xs">
                  {t.startTime && t.endTime ? `${t.startTime.slice(0, 10)} ~ ${t.endTime.slice(0, 10)}` : "长期"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="text-white/40 hover:text-gold-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button className="text-white/40 hover:text-coral transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold gold-text">编辑任务</h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white/70"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">任务标题</label>
                  <input className="input" placeholder="输入任务标题" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">类型</label>
                  <select className="input">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">金币奖励</label>
                  <input type="number" className="input" placeholder="0" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">开始时间</label>
                    <input className="input" placeholder="2026-06-10" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">结束时间</label>
                    <input className="input" placeholder="2026-06-20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">地区标签</label>
                  <input className="input" placeholder="广东, 北京" />
                </div>
                <button className="gold-btn w-full mt-2">保存</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
