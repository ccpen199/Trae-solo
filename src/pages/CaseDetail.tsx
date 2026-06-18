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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

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

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-ink-light hover:text-gov-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {/* 办件头部 */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-ink-border">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-serif text-xl font-bold text-ink">{caseItem.serviceName}</h1>
                <span className={cn(statusInfo.badge)}>{statusInfo.text}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-light">
                <span>办件编号：{caseItem.caseNo}</span>
                <span>申请时间：{caseItem.applyTime}</span>
                <span>申请人：{caseItem.applicantName}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {caseItem.result?.downloadUrl && (
                <button className="btn-secondary">
                  <Download className="w-4 h-4" /> 下载结果
                </button>
              )}
              {canEvaluate && !showRating && (
                <button onClick={() => setShowRating(true)} className="btn-primary">
                  <Star className="w-4 h-4" /> 服务评价
                </button>
              )}
            </div>
          </div>

          {/* 评价表单 */}
          {showRating && (
            <div className="mt-5 p-5 bg-warning-50 rounded-lg border border-warning-100 animate-fade-in">
              <h3 className="font-medium text-ink mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-warning-600" /> 服务评价
              </h3>
              <div className="mb-4">
                <p className="text-sm text-ink-light mb-2">请为本次服务打分：</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 transition-colors",
                          n <= rating ? "text-warning-500 fill-warning-500" : "text-ink-lighter"
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-ink">
                      {["非常不满意", "不满意", "一般", "满意", "非常满意"][rating - 1]}
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="label">评价内容（选填）</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="请分享您的服务体验..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRating(false);
                    setRating(0);
                    setComment("");
                  }}
                  className="btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    alert("评价提交成功，感谢您的反馈！");
                    setShowRating(false);
                  }}
                  disabled={rating === 0}
                  className="btn-primary"
                >
                  提交评价
                </button>
              </div>
            </div>
          )}

          {caseItem.result && (
            <div
              className={cn(
                "mt-5 p-5 rounded-lg border",
                caseItem.result.type === "rejection"
                  ? "bg-danger-50 border-danger-100"
                  : "bg-success-50 border-success-100"
              )}
            >
              <div className="flex items-start gap-3">
                {caseItem.result.type === "rejection" ? (
                  <AlertCircle className="w-6 h-6 text-danger-600 shrink-0 mt-0.5" />
                ) : (
                  <FileCheck className="w-6 h-6 text-success-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-ink mb-1">
                    {caseItem.result.type === "certificate"
                      ? "电子证照已生成"
                      : caseItem.result.type === "rejection"
                      ? "办理不通过"
                      : "办理结果"}
                  </h3>
                  <p className="text-ink mb-2">{caseItem.result.title}</p>
                  {caseItem.result.remark && (
                    <p className="text-sm text-ink-light">{caseItem.result.remark}</p>
                  )}
                  {caseItem.result.downloadUrl && (
                    <button className="btn-secondary mt-3">
                      <Download className="w-4 h-4" /> 下载办理结果
                    </button>
                  )}
                  {caseItem.result.certificateId && (
                    <Link to={`/certificates/${caseItem.result.certificateId}`} className="btn-primary mt-3 ml-2">
                      <FileCheck className="w-4 h-4" /> 查看电子证照
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 办理进度时间轴 */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-serif text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-gov-600 rounded-full" />
                办理进度
              </h2>

              <div className="relative pl-2">
                {caseItem.timeline.map((node, idx) => (
                  <div key={node.nodeId} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10",
                          getTimelineColor(node.status)
                        )}
                      >
                        {getTimelineIcon(node.status)}
                      </div>
                      {idx < caseItem.timeline.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 mt-2 -mb-8",
                            node.status === "completed" ? "bg-success-200" : "bg-ink-border"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-ink">{node.nodeName}</h4>
                        {node.status === "processing" && (
                          <span className="badge-warning">处理中</span>
                        )}
                      </div>
                      {node.handlerDept && (
                        <p className="text-xs text-ink-light mb-1.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> {node.handlerDept}
                          {node.handler && ` · ${node.handler}`}
                        </p>
                      )}
                      {node.handleTime && (
                        <p className="text-xs text-ink-light flex items-center gap-1 mb-1.5">
                          <Clock className="w-3 h-3" /> {node.handleTime}
                        </p>
                      )}
                      {node.remark && (
                        <p className="text-sm text-ink bg-ink-bg rounded p-2.5 mt-2">
                          {node.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 侧边信息 */}
          <div className="space-y-6">
            {/* 申请材料 */}
            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-gov-600" /> 申请材料
              </h3>
              {caseItem.materials.length === 0 ? (
                <p className="text-sm text-ink-light">暂无上传材料</p>
              ) : (
                <div className="space-y-2">
                  {caseItem.materials.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 bg-ink-bg rounded-md group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-gov-600 shrink-0" />
                        <span className="text-sm text-ink truncate">{m.name}</span>
                      </div>
                      <button className="p-1 text-ink-light hover:text-gov-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 办件信息 */}
            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gov-600" /> 办件信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-light">服务事项</span>
                  <span className="text-ink text-right max-w-[60%]">{caseItem.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-light">办件编号</span>
                  <span className="text-ink">{caseItem.caseNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-light">申请人</span>
                  <span className="text-ink">{caseItem.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-light">申请时间</span>
                  <span className="text-ink">{caseItem.applyTime}</span>
                </div>
                {caseItem.estimatedFinishTime && (
                  <div className="flex justify-between">
                    <span className="text-ink-light">预计完成</span>
                    <span className="text-gov-600 font-medium">{caseItem.estimatedFinishTime}</span>
                  </div>
                )}
                {caseItem.finishTime && (
                  <div className="flex justify-between">
                    <span className="text-ink-light">完成时间</span>
                    <span className="text-success-600 font-medium">{caseItem.finishTime}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-light">当前状态</span>
                  <span className={cn(statusInfo.badge)}>{statusInfo.text}</span>
                </div>
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
                  <MessageSquare className="w-4 h-4" /> 在线咨询
                </button>
                <button className="w-full btn-ghost justify-center">
                  📞 服务热线 12345
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
