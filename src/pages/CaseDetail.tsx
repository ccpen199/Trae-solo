import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Upload,
  Star,
  MessageSquare,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Bell,
  ShieldCheck,
  Send,
  Lock,
  Eye,
  Trash2,
  File,
  Building,
  Route,
} from "lucide-react";
import { useAppStore } from "@/store";
import { statusTextMap } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getCaseById = useAppStore((s) => s.getCaseById);
  const caseItem = getCaseById(id || "");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState<{ rating: number; comment: string; time: string } | null>(null);
  const [activeStep, setActiveStep] = useState<"timeline" | "materials" | "result" | "eval">("timeline");

  if (!caseItem) {
    return (
      <div className="container py-16 text-center">
        <p className="text-ink-light">办件不存在</p>
        <Link to="/cases" className="btn-primary mt-4">
          返回办件列表
        </Link>
      </div>
    );
  }

  const statusInfo = statusTextMap[caseItem.status];

  const getTimelineIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-white" />;
    if (status === "processing") return <Clock className="w-5 h-5 text-white animate-pulse-soft" />;
    if (status === "rejected") return <XCircle className="w-5 h-5 text-white" />;
    return <Clock className="w-5 h-5 text-white" />;
  };

  const getTimelineColor = (status: string) => {
    if (status === "completed") return "bg-success-500";
    if (status === "processing") return "bg-gov-500";
    if (status === "rejected") return "bg-danger-500";
    return "bg-ink-lighter";
  };

  const canEvaluate = ["completed", "approved"].includes(caseItem.status);
  const doneNodes = caseItem.timeline.filter((t) => t.status === "completed").length;
  const totalNodes = caseItem.timeline.length;
  const progress = Math.round((doneNodes / totalNodes) * 100);

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-ink-light hover:text-gov-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {/* 办件头部 */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-ink-border">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-serif text-xl font-bold text-ink">{caseItem.serviceName}</h1>
                <span className={cn(statusInfo.badge)}>{statusInfo.text}</span>
                <span className="badge-primary">全程网办</span>
                <span className="badge-success">电子证照已生成</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-light">
                <span>办件编号：<b className="text-ink font-mono">{caseItem.caseNo}</b></span>
                <span>申请时间：{caseItem.applyTime}</span>
                <span>申请人：{caseItem.applicantName}</span>
                {caseItem.estimatedFinishTime && <span>预计完成：<b className="text-gov-700">{caseItem.estimatedFinishTime}</b></span>}
                {caseItem.finishTime && <span className="text-success-600">完成时间：{caseItem.finishTime}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {caseItem.result?.downloadUrl && (
                <button className="btn-secondary">
                  <Download className="w-4 h-4" /> 下载批文
                </button>
              )}
              {caseItem.result?.certificateId && (
                <Link to="/certificates" className="btn-primary">
                  <FileCheck className="w-4 h-4" /> 查看电子证照
                </Link>
              )}
              {canEvaluate && !showRating && !rated && (
                <button onClick={() => { setShowRating(true); setActiveStep("eval"); }} className="btn-primary">
                  <Star className="w-4 h-4" /> 服务评价
                </button>
              )}
            </div>
          </div>

          {/* 总体进度条 */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-ink-light">办件总体进度</span>
              <span className="font-medium text-gov-700">{progress}% · {doneNodes}/{totalNodes}个节点已完成</span>
            </div>
            <div className="flex-1 h-3 bg-ink-bg rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  caseItem.status === "rejected" ? "bg-danger-500" : caseItem.status === "completed" || caseItem.status === "approved"
                    ? "bg-gradient-to-r from-success-500 to-gov-500"
                    : "bg-gradient-to-r from-gov-500 to-violet-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 生命周期6环节导航 */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { k: "1", label: "预约", icon: CheckCircle2, done: doneNodes >= 1, active: false, color: "from-gov-500 to-blue-500" },
              { k: "2", label: "申办", icon: FileText, done: doneNodes >= 1, active: doneNodes === 1, color: "from-blue-500 to-cyan-500" },
              { k: "3", label: "材料上传", icon: Upload, done: doneNodes >= 2, active: doneNodes === 2, color: "from-cyan-500 to-emerald-500" },
              { k: "4", label: "进度追踪", icon: Route, done: doneNodes >= 3, active: doneNodes === 3, color: "from-emerald-500 to-amber-500" },
              { k: "5", label: "结果送达", icon: Bell, done: doneNodes >= 4, active: doneNodes === 4, color: "from-amber-500 to-violet-500" },
              { k: "6", label: "服务评价", icon: Star, done: !!rated, active: showRating || rated, color: "from-violet-500 to-rose-500" },
            ].map((st) => (
              <button
                key={st.k}
                onClick={() => setActiveStep(st.k === "6" ? "eval" : st.k === "3" ? "materials" : st.k === "5" ? "result" : "timeline")}
                className={cn(
                  "p-3 rounded-xl text-center transition-all border",
                  st.done ? "border-success-200 bg-success-50/50" : st.active ? "border-gov-300 bg-gov-50 ring-2 ring-gov-100" : "border-gray-200 bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 mx-auto rounded-lg bg-gradient-to-br flex items-center justify-center mb-1.5 text-white",
                    st.done ? "from-success-500 to-success-700" : st.active ? st.color : "from-gray-400 to-gray-500"
                  )}
                >
                  <st.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-medium">{st.label}</p>
                {st.done && <p className="text-[10px] text-success-600 mt-0.5">✓ 已完成</p>}
              </button>
            ))}
          </div>
        </div>

        {/* 评价表单 */}
        {(showRating || rated) && (
          <div className="card p-6 mb-6 border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-gov-50">
            <h3 className="font-serif text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" /> 服务评价 · 办件闭环留痕
              <span className="badge-warning text-[10px] ml-2">计入政务服务"好差评"系统</span>
            </h3>
            {rated ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "w-6 h-6",
                          n <= rated.rating ? "text-warning-500 fill-warning-500" : "text-ink-lighter"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {["非常不满意", "不满意", "一般", "满意", "非常满意"][rated.rating - 1]}
                  </span>
                  <span className="text-xs text-ink-light ml-auto">{rated.time}</span>
                </div>
                {rated.comment && (
                  <div className="p-4 rounded-lg bg-white border border-amber-100">
                    <p className="text-sm text-ink leading-relaxed">{rated.comment}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/50 text-xs text-ink-light">
                  <ShieldCheck className="w-3.5 h-3.5 text-gov-600" />
                  <span>评价已加密入库 · 匿名化处理 · 全程审计可追溯</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-ink mb-2">整体满意度评分：</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            n <= rating ? "text-warning-500 fill-warning-500" : "text-ink-lighter"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-medium text-ink">
                      {["非常不满意", "不满意", "一般", "满意", "非常满意"][rating - 1]}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { l: "办理便捷度" }, { l: "材料清晰度" }, { l: "时效满意度" },
                    { l: "窗口态度" }, { l: "结果满意度" }, { l: "线上体验" },
                  ].map((d) => (
                    <div key={d.l} className="p-2 rounded-lg bg-white border border-amber-100 text-center">
                      <p className="text-[10px] text-ink-light mb-1">{d.l}</p>
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className="w-3 h-3 text-warning-500 fill-warning-500" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label">意见建议 <span className="text-ink-lighter">（选填）</span></label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input min-h-[90px] resize-none bg-white"
                    placeholder="您的反馈将用于改进政务服务质量..."
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-ink-light p-3 rounded-lg bg-white/60 border border-amber-100">
                  <Lock className="w-3.5 h-3.5 mt-0.5 text-gov-600 shrink-0" />
                  <span>
                    提交后评价将计入全国政务服务"好差评"系统，您的个人信息将严格保密，仅用于服务改进。
                    如对办理结果有异议，可通过 <b className="text-gov-600">在线咨询</b> 或 <b className="text-gov-600">12345热线</b> 反馈。
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRating(false)}
                    className="btn-ghost"
                  >
                    暂不评价
                  </button>
                  <button
                    onClick={() => {
                      setRated({ rating, comment: comment || "用户未填写评价内容", time: new Date().toLocaleString("zh-CN") });
                      setShowRating(false);
                    }}
                    disabled={rating === 0}
                    className="btn-primary flex-1 justify-center"
                  >
                    <Send className="w-4 h-4" /> 提交评价 · 完成办件闭环
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 办理结果 + 送达方式 */}
        {caseItem.result && (
          <div className="card p-6 mb-6">
            <h3 className="font-serif text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-success-500 rounded-full" />
              结果送达 · 办件出件
            </h3>
            <div className="grid lg:grid-cols-2 gap-5">
              <div
                className={cn(
                  "p-5 rounded-xl border",
                  caseItem.result.type === "rejection"
                    ? "bg-danger-50 border-danger-200"
                    : "bg-gradient-to-br from-success-50 to-gov-50 border-success-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {caseItem.result.type === "rejection" ? (
                    <AlertCircle className="w-8 h-8 text-danger-600 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-gov-600 flex items-center justify-center shrink-0">
                      <FileCheck className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink mb-1">
                      {caseItem.result.type === "certificate"
                        ? "电子证照已生成入库"
                        : caseItem.result.type === "rejection"
                        ? "办理不通过"
                        : "审批结果通知"}
                    </h4>
                    <p className="text-ink mb-2">{caseItem.result.title}</p>
                    {caseItem.result.remark && (
                      <p className="text-sm text-ink-light bg-white/60 rounded p-2.5 border border-white">{caseItem.result.remark}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {caseItem.result.downloadUrl && (
                    <button className="btn-secondary">
                      <Download className="w-4 h-4" /> 下载批文（PDF）
                    </button>
                  )}
                  {caseItem.result.certificateId && (
                    <Link to="/certificates" className="btn-primary">
                      <FileCheck className="w-4 h-4" /> 查看电子证照
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-ink-bg/50 border border-ink-border">
                <h4 className="font-semibold text-ink mb-4 flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-gov-600" /> 送达方式 & 通知记录
                </h4>
                <div className="space-y-2.5">
                  {[
                    { icon: CheckCircle2, color: "text-success-600", label: "电子证照入库", val: `证照ID：${caseItem.result?.certificateId || "KS-CERT-" + caseItem.caseNo}`, time: caseItem.finishTime || "2026-06-19 16:42" },
                    { icon: Bell, color: "text-gov-600", label: "App推送通知", val: "已送达（客户端已读取）", time: "2026-06-19 16:42" },
                    { icon: Send, color: "text-violet-600", label: "短信通知", val: `收件人：${caseItem.applicantName} 138****8888`, time: "2026-06-19 16:43" },
                    { icon: FileCheck, color: "text-amber-600", label: "访问审计", val: "全链路留痕 · 可追溯", time: "系统自动记录" },
                  ].map((it, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white hover:bg-gov-50/40 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-ink-bg flex items-center justify-center shrink-0 mt-0.5">
                        <it.icon className={cn("w-4 h-4", it.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-ink">{it.label}</span>
                          <span className="text-[10px] text-ink-light shrink-0">{it.time}</span>
                        </div>
                        <p className="text-xs text-ink-light mt-0.5">{it.val}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 办理进度时间轴 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-serif text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-gov-600 rounded-full" />
                办理进度 · 节点流转
              </h2>

              <div className="relative pl-2">
                {caseItem.timeline.map((node, idx) => (
                  <div key={node.nodeId} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm",
                          getTimelineColor(node.status)
                        )}
                      >
                        {getTimelineIcon(node.status)}
                      </div>
                      {idx < caseItem.timeline.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 mt-2 -mb-8",
                              node.status === "completed" ? "bg-success-300" : "bg-ink-border"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-ink text-base">{node.nodeName}</h4>
                        {node.status === "processing" && (
                          <span className="badge-warning animate-pulse">正在处理</span>
                        )}
                        {node.status === "completed" && <span className="badge-success text-[10px]">已办结</span>}
                      </div>
                      {node.handlerDept && (
                        <p className="text-xs text-ink-light mb-1.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Building className="w-3 h-3" /> {node.handlerDept}
                          </span>
                          {node.handler && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" /> 经办人：{node.handler}
                            </span>
                          )}
                          {node.handleTime && (
                            <span className="inline-flex items-center gap-1 text-gov-700">
                              <Clock className="w-3 h-3" /> {node.handleTime}
                            </span>
                          )}
                        </p>
                      )}
                      {node.remark && (
                        <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-ink-bg to-gov-50/40 border border-gov-100/50">
                          <p className="text-sm text-ink leading-relaxed">{node.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 材料记录 */}
            <div className="card p-6">
              <h3 className="font-serif text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-violet-500 rounded-full" />
                材料记录 · 上传留痕
                <span className="badge-gray text-[10px] ml-2">{caseItem.materials.length}份材料</span>
              </h3>
              {caseItem.materials.length === 0 ? (
                <div className="text-center py-8 text-ink-light">
                  <Upload className="w-10 h-10 mx-auto mb-2 text-ink-lighter" />
                  <p>暂无上传材料</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseItem.materials.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-ink-border hover:border-violet-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-50 to-gov-50 border border-violet-100 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-ink">{m.name}</h4>
                            <span className="badge-success text-[10px]">已核验</span>
                            <span className="badge-primary text-[10px]">原件</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-light mt-1">
                            <span>文件名：<b className="font-mono text-ink">{m.fileName}</b></span>
                            <span>大小：{m.fileSize > 1024 ? (m.fileSize / 1024).toFixed(1) + "MB" : m.fileSize + "KB"}</span>
                            <span>上传时间：{m.uploadTime}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-light hover:text-gov-600 hover:bg-gov-50 transition-colors" title="预览">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-light hover:text-gov-600 hover:bg-gov-50 transition-colors" title="下载">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 pt-3 border-t border-dashed border-ink-border">
                        <ShieldCheck className="w-4 h-4 text-success-600 shrink-0" />
                        <span className="text-xs text-success-700">
                          材料已通过国密SM4加密存储 · 关联电子证照比对 · 相似度98.{idx + 5}% · 公安人口库权威核验通过
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 侧边信息 */}
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gov-600" /> 办件信息总览
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { l: "服务事项", v: caseItem.serviceName, r: true },
                  { l: "办件编号", v: caseItem.caseNo, mono: true },
                  { l: "申请人", v: caseItem.applicantName },
                  { l: "申请时间", v: caseItem.applyTime },
                  { l: "预计完成", v: caseItem.estimatedFinishTime || "—", g: true },
                  { l: "完成时间", v: caseItem.finishTime || "—", s: true },
                  { l: "当前节点", v: caseItem.currentNode },
                  { l: "办理状态", v: <span className={cn(statusInfo.badge)}>{statusInfo.text}</span>, raw: true },
                ].map((it, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 pt-2.5 first:pt-0 first:border-0 border-t border-dashed border-ink-border">
                    <span className="text-ink-light shrink-0 mt-0.5">{it.l}</span>
                    <span className={cn(
                      "text-right max-w-[65%] text-ink",
                      it.mono && "font-mono text-xs",
                      it.g && "text-gov-600 font-medium",
                      it.s && "text-success-600 font-medium",
                      it.r && "text-right"
                    )}>
                      {it.raw ? it.v : it.v as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-violet-600" /> 安全合规
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { t: "加密算法", v: "SM2签名 + SM4存储加密", c: "text-gov-600" },
                  { t: "身份认证", v: caseItem.serviceName.includes("身份") || caseItem.serviceName.includes("身份") ? "L3公安人脸" : "L2实名认证", c: "text-violet-600" },
                  { t: "访问审计", v: "12次操作记录 · 可追溯", c: "text-success-600" },
                  { t: "数据有效期", v: "永久存档 · 按档案法保管", c: "text-amber-600" },
                ].map((it, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-ink-light">{it.t}</span>
                    <span className={cn("font-medium", it.c)}>{it.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 咨询服务 */}
            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-3">需要帮助？</h3>
              <p className="text-sm text-ink-light mb-4">
                如有疑问，请联系办理部门或拨打服务热线
              </p>
              <div className="space-y-2">
                <button className="w-full btn-secondary justify-center">
                  <MessageSquare className="w-4 h-4" /> 在线咨询 · 人工坐席
                </button>
                <Link to="/admin" className="w-full btn-ghost justify-center">
                  🛡 查看服务审计记录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
