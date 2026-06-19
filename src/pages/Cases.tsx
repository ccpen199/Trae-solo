import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Clock,
  ChevronRight,
  ArrowLeft,
  FileCheck,
  Star,
  TrendingUp,
  Building,
  CalendarCheck,
  FileEdit,
  Upload,
  Route,
  Bell,
  MessageSquare,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useAppStore } from "@/store";
import { statusTextMap } from "@/data/mockData";
import type { CaseStatus } from "@/types";
import { cn } from "@/lib/utils";

const lifecycleSteps = [
  { key: "appointment", label: "预约", icon: CalendarCheck },
  { key: "apply", label: "申办", icon: FileEdit },
  { key: "upload", label: "材料上传", icon: Upload },
  { key: "track", label: "进度追踪", icon: Route },
  { key: "push", label: "结果推送", icon: Bell },
  { key: "evaluate", label: "服务评价", icon: MessageSquare },
];

function getLifecycleStatus(caseItem: { status: string; timeline: { status: string }[] }) {
  const done = caseItem.timeline.filter((t) => t.status === "completed").length;
  const total = caseItem.timeline.length;
  const isComplete = ["completed", "approved"].includes(caseItem.status);
  const isRejected = caseItem.status === "rejected";
  return lifecycleSteps.map((step, i) => {
    if (isRejected) return { ...step, state: i < 2 ? "done" : "failed" as const };
    if (isComplete) return { ...step, state: "done" as const };
    const stepDone = i < done;
    const stepActive = i === done;
    return { ...step, state: stepDone ? "done" as const : stepActive ? "active" as const : "pending" as const };
  });
}

const statusTabs: { key: CaseStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "processing", label: "办理中" },
  { key: "pending_material", label: "待补材料" },
  { key: "completed", label: "已完成" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已驳回" },
];

export default function Cases() {
  const navigate = useNavigate();
  const cases = useAppStore((s) => s.cases);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const [activeStatus, setActiveStatus] = useState<CaseStatus | "all">("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const statusMatch = activeStatus === "all" || c.status === activeStatus;
      const keywordMatch =
        !keyword ||
        c.serviceName.includes(keyword) ||
        c.caseNo.includes(keyword);
      return statusMatch && keywordMatch;
    });
  }, [cases, activeStatus, keyword]);

  const stats = useMemo(() => {
    return {
      total: cases.length,
      processing: cases.filter((c) => ["processing", "accepted", "submitted"].includes(c.status)).length,
      pending: cases.filter((c) => c.status === "pending_material").length,
      completed: cases.filter((c) => ["completed", "approved"].includes(c.status)).length,
    };
  }, [cases]);

  if (!isLoggedIn) {
    return (
      <div className="container py-16">
        <div className="card max-w-md mx-auto p-8 text-center">
          <Clock className="w-16 h-16 text-ink-lighter mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-ink mb-2">请先登录</h2>
          <p className="text-ink-light mb-6">登录后查看您的办件记录</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "办件总数", value: stats.total, icon: FileCheck, color: "from-gov-500 to-gov-700" },
            { label: "办理中", value: stats.processing, icon: TrendingUp, color: "from-warning-500 to-warning-700" },
            { label: "待补材料", value: stats.pending, icon: Star, color: "from-danger-500 to-danger-700" },
            { label: "已完成", value: stats.completed, icon: Building, color: "from-success-500 to-success-700" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", s.color)}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink-light">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="p-5 border-b border-ink-border">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-ink-light absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索服务名称或办件编号..."
                  className="input pl-11"
                />
              </div>
              <button className="btn-secondary">
                <Filter className="w-4 h-4" /> 高级筛选
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-4">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeStatus === tab.key
                      ? "bg-gov-600 text-white"
                      : "text-ink-light hover:bg-ink-bg hover:text-ink"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <FileCheck className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
              <p className="text-ink-light">暂无符合条件的办件</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-border">
              {filtered.map((c) => {
                const statusInfo = statusTextMap[c.status];
                const total = c.timeline.length;
                const done = c.timeline.filter((t) => t.status === "completed").length;
                const progress = Math.round((done / total) * 100);

                return (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="block p-5 hover:bg-gov-50/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors">
                            {c.serviceName}
                          </h3>
                          <span className={cn("shrink-0", statusInfo.badge)}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-light">
                          <span>办件编号：{c.caseNo}</span>
                          <span>申请时间：{c.applyTime}</span>
                          {c.estimatedFinishTime && (
                            <span>预计完成：{c.estimatedFinishTime}</span>
                          )}
                          {c.finishTime && <span>完成时间：{c.finishTime}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-lighter group-hover:text-gov-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-1.5 bg-ink-bg rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            c.status === "rejected" || c.status === "pending_material"
                              ? "bg-danger-500"
                              : c.status === "completed" || c.status === "approved"
                              ? "bg-success-500"
                              : "bg-gov-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-ink shrink-0">
                        {done}/{total}
                      </span>
                    </div>

                    <div className="flex items-center gap-0 mt-1.5">
                      {getLifecycleStatus(c).map((step, si) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center">
                            <div
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                step.state === "done" && "bg-success-50 text-success-700",
                                step.state === "active" && "bg-gov-50 text-gov-700 ring-1 ring-gov-200",
                                step.state === "pending" && "bg-gray-50 text-gray-400",
                                step.state === "failed" && "bg-danger-50 text-danger-600"
                              )}
                            >
                              {step.state === "done" ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : step.state === "active" ? (
                                <Circle className="w-2.5 h-2.5 fill-current" />
                              ) : (
                                <Circle className="w-2.5 h-2.5" />
                              )}
                              {step.label}
                            </div>
                            {si < 5 && (
                              <div className={cn(
                                "w-2 h-px mx-0.5",
                                step.state === "done" ? "bg-success-400" : "bg-gray-200"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-ink-light mt-2 flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3 rotate-180" /> 当前节点：{c.currentNode}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
