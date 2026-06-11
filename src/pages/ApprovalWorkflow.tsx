import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useStore } from "@/store";
import StatusBadge from "@/components/StatusBadge";

export default function ApprovalWorkflow() {
  const { budgets, fetchBudgets, approveBudget, rejectBudget, user } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const getProgress = (plan: typeof budgets[0]) => {
    const total = plan.approvalFlow.length;
    const done = plan.approvalFlow.filter((s) => s.status !== "pending").length;
    return total > 0 ? (done / total) * 100 : 0;
  };

  const isMyPendingStep = (plan: typeof budgets[0]) => {
    if (!user) return false;
    const current = plan.approvalFlow.find((s) => s.status === "pending");
    return current && current.approver === user.id;
  };

  const handleApprove = async (id: string) => {
    await approveBudget(id, commentMap[id]);
    setCommentMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleReject = async (id: string) => {
    await rejectBudget(id, commentMap[id] || "不通过");
    setRejectId(null);
    setCommentMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const stepIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 size={18} className="text-green-500" />;
    if (status === "rejected") return <XCircle size={18} className="text-red-500" />;
    return <Clock size={18} className="text-gray-300" />;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">审批管理</h1>
        <p className="text-gray-500 mt-1">预算审批流程与进度跟踪</p>
      </div>

      <div className="space-y-4">
        {budgets.map((plan) => {
          const progress = getProgress(plan);
          const expanded = expandedId === plan.id;
          const myPending = isMyPendingStep(plan);

          return (
            <div key={plan.id} className="card">
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : plan.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-gray-900">{plan.title}</h3>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>组织：{plan.orgId}</span>
                    <span>总预算：¥{plan.totalAmount.toLocaleString()}</span>
                    <span>已使用：¥{plan.usedAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-union-red rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-4">
                  {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {expanded && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4">审批流程</h4>
                  <div className="relative ml-4">
                    {plan.approvalFlow.map((step, idx) => (
                      <div key={step.step} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                        {idx < plan.approvalFlow.length - 1 && (
                          <div className="absolute left-[8px] top-[26px] bottom-0 w-px bg-gray-200" />
                        )}
                        <div className="relative z-10 shrink-0">{stepIcon(step.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {step.approverName}
                            </span>
                            <StatusBadge status={step.status} />
                          </div>
                          {step.comment && (
                            <p className="text-sm text-gray-500 mt-1">{step.comment}</p>
                          )}
                          {step.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">{step.timestamp}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {myPending && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-3">
                        <textarea
                          value={commentMap[plan.id] || ""}
                          onChange={(e) =>
                            setCommentMap((prev) => ({ ...prev, [plan.id]: e.target.value }))
                          }
                          className="input-field flex-1 min-h-[60px] resize-none"
                          placeholder="输入审批意见（可选）"
                        />
                      </div>
                      <div className="flex gap-3 mt-3 justify-end">
                        <button
                          onClick={() => setRejectId(plan.id)}
                          className="px-4 py-2 text-sm border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          驳回
                        </button>
                        <button
                          onClick={() => handleApprove(plan.id)}
                          className="btn-primary"
                        >
                          通过
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="card text-center py-12 text-gray-400">暂无审批数据</div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRejectId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认驳回</h3>
            <p className="text-sm text-gray-500 mb-4">请确认驳回此审批，该操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectId(null)} className="btn-outline">取消</button>
              <button onClick={() => handleReject(rejectId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
