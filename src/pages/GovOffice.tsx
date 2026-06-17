import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { FileText, Users, ClipboardList, Sparkles, Clock, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";

type Tab = "documents" | "meetings" | "tasks";

export default function GovOffice() {
  const [tab, setTab] = useState<Tab>("documents");
  const [documents, setDocuments] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.gov.documents(), api.gov.meetings(), api.gov.tasks()]).then(([d, m, t]) => {
      if (!alive) return;
      setDocuments(d);
      setMeetings(m);
      setTasks(t);
      if (d.length > 0) setSelectedDoc(d[0]);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">智政办公</h2>
        <p className="text-sm text-gray-500">公文智能摘要 · 会议纪要生成 · 任务督办看板</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "documents" as Tab, label: "公文智能摘要", icon: FileText, count: documents.length },
          { key: "meetings" as Tab, label: "会议纪要生成", icon: Users, count: meetings.length },
          { key: "tasks" as Tab, label: "任务督办看板", icon: ClipboardList, count: tasks.length },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === item.key ? "bg-primary-900 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <span className={clsx(
              "text-xs px-1.5 py-0.5 rounded-full",
              tab === item.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            )}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ))
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={clsx(
                    "w-full text-left p-4 transition-colors",
                    selectedDoc?.id === doc.id ? "bg-primary-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={clsx("text-sm font-semibold flex-1", selectedDoc?.id === doc.id ? "text-primary-900" : "text-gray-900")}>
                      {doc.title}
                    </h4>
                    <ChevronRight className={clsx("w-4 h-4 flex-shrink-0", selectedDoc?.id === doc.id ? "text-primary-400" : "text-gray-300")} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={doc.status} />
                    <span className="text-[10px] text-gray-400">{doc.createdAt}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-6">
            {selectedDoc ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-base">{selectedDoc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedDoc.status} />
                      <span className="text-xs text-gray-400">{selectedDoc.source} · {selectedDoc.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-900 to-primary-700 text-white text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI摘要
                  </div>
                </div>
                <div className="rounded-lg bg-primary-50/50 border border-primary-100 p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedDoc.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.keywords.map((kw: string) => (
                    <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-white border border-primary-200 text-primary-700">
                      {kw}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />加载中...
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "meetings" && (
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
              </div>
            ))
          ) : (
            meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-xl border border-gray-100 p-5 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{meeting.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.date}</span>
                        <span>{meeting.attendees}人参会</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={meeting.status} />
                </div>
                {meeting.status === "completed" && (
                  <>
                    <div className="rounded-lg bg-gray-50 p-4 mb-3">
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-primary-600 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI生成纪要
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{meeting.minutes}</p>
                    </div>
                    {meeting.actionItems.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400">待办提取：</span>
                        {meeting.actionItems.map((item: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {meeting.status === "generating" && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-blue-600">AI正在生成会议纪要...</span>
                    </div>
                    <div className="w-full h-1.5 bg-blue-100 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </div>
                )}
                {meeting.status === "pending" && (
                  <div className="rounded-lg bg-gray-50 p-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">会议纪要待生成</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "tasks" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(["todo", "in_progress", "done"] as const).map((status) => {
            const statusTasks = tasks.filter((t) => t.status === status);
            const statusLabels = { todo: "待办", in_progress: "进行中", done: "已完成" };
            const statusColors = { todo: "bg-gray-500", in_progress: "bg-blue-500", done: "bg-emerald-500" };
            const headerColors = { todo: "bg-gray-50", in_progress: "bg-blue-50", done: "bg-emerald-50" };
            return (
              <div key={status} className="space-y-3">
                <div className={clsx("rounded-xl p-3 flex items-center justify-between", headerColors[status])}>
                  <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", statusColors[status])} />
                    <span className="font-semibold text-sm text-gray-900">{statusLabels[status]}</span>
                  </div>
                  <span className="text-xs text-gray-500">{statusTasks.length}项</span>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                      </div>
                    ))
                  ) : (
                    statusTasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4 hover-lift">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 flex-1">{task.title}</h4>
                          {task.overdue && (
                            <AlertTriangle className="w-4 h-4 text-red-500 alert-pulse flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{task.assignee}</span>
                          <span>·</span>
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded",
                            task.priority === "high" ? "bg-red-50 text-red-600" : task.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
                          )}>
                            {task.priority === "high" ? "紧急" : task.priority === "medium" ? "一般" : "低"}
                          </span>
                        </div>
                        <div className={clsx("text-xs mt-2", task.overdue ? "text-red-500 font-medium" : "text-gray-400")}>
                          截止：{task.deadline} {task.overdue && "（已逾期）"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
