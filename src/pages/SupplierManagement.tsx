import { useState, useEffect } from "react";
import { Plus, Star, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useStore } from "@/store";
import StatusBadge from "@/components/StatusBadge";

const categories = ["全部", "体检", "出行", "法律", "生活", "文体"];

export default function SupplierManagement() {
  const { suppliers, fetchSuppliers, approveSupplier, assessSupplier } = useStore();
  const [statusFilter, setStatusFilter] = useState("全部");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assessingId, setAssessingId] = useState<string | null>(null);
  const [assessScore, setAssessScore] = useState(5);
  const [assessComment, setAssessComment] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = suppliers.filter((s) => {
    if (statusFilter !== "全部" && s.status !== statusFilter) return false;
    if (categoryFilter !== "全部" && s.category !== categoryFilter) return false;
    return true;
  });

  const handleAssess = async (id: string) => {
    await assessSupplier(id, assessScore, assessComment, "当前管理员");
    setAssessingId(null);
    setAssessScore(5);
    setAssessComment("");
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= score ? "fill-union-gold text-union-gold" : "text-gray-200"}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">供应商管理</h1>
          <p className="text-gray-500 mt-1">管理供应商准入、考核与评估</p>
        </div>
        <button onClick={() => setShowAddDialog(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增供应商
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态：</span>
            <div className="flex gap-1">
              {["全部", "applying", "approved", "suspended", "blacklisted"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === s
                      ? "bg-union-red text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "全部" ? "全部" : s === "applying" ? "申请中" : s === "approved" ? "已通过" : s === "suspended" ? "已暂停" : "黑名单"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">类别：</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-auto"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">供应商名称</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">类别</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">状态</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">评分</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">联系方式</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{supplier.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {supplier.qualificationDocs.length} 份资质文件
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{supplier.category}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={supplier.status} />
                </td>
                <td className="px-6 py-4">{renderStars(supplier.score)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">—</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {supplier.status === "applying" && (
                      <button
                        onClick={() => approveSupplier(supplier.id)}
                        className="px-3 py-1 text-sm bg-union-red/10 text-union-red rounded-lg hover:bg-union-red hover:text-white transition-colors"
                      >
                        准入审批
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (assessingId === supplier.id) {
                          setAssessingId(null);
                        } else {
                          setAssessingId(supplier.id);
                          setAssessScore(5);
                          setAssessComment("");
                        }
                      }}
                      className="px-3 py-1 text-sm bg-union-gold/10 text-union-gold rounded-lg hover:bg-union-gold hover:text-white transition-colors flex items-center gap-1"
                    >
                      <MessageSquare size={14} />
                      考核
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedId === supplier.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  暂无供应商数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {assessingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setAssessingId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">供应商考核</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setAssessScore(i)}>
                      <Star
                        size={28}
                        className={i <= assessScore ? "fill-union-gold text-union-gold" : "text-gray-200 hover:text-union-gold/50"}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-500 ml-2">{assessScore} 分</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评语</label>
                <textarea
                  value={assessComment}
                  onChange={(e) => setAssessComment(e.target.value)}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="请输入考核评语"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setAssessingId(null)} className="btn-outline">
                  取消
                </button>
                <button onClick={() => handleAssess(assessingId)} className="btn-primary">
                  提交考核
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">新增供应商</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
                <input className="input-field" placeholder="请输入供应商名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                <select className="input-field">
                  {categories.filter((c) => c !== "全部").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                <input className="input-field" placeholder="请输入联系方式" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowAddDialog(false)} className="btn-outline">取消</button>
                <button onClick={() => setShowAddDialog(false)} className="btn-primary">确认新增</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {expandedId && (() => {
        const supplier = suppliers.find((s) => s.id === expandedId);
        if (!supplier || supplier.assessmentHistory.length === 0) return null;
        return (
          <div className="card mt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">考核历史</h4>
            <div className="space-y-3">
              {supplier.assessmentHistory.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-union-gold/10 text-union-gold rounded-lg flex items-center justify-center shrink-0">
                    <Star size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{a.assessor}</span>
                      <span className="text-xs text-gray-400">{a.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(a.score)}
                    </div>
                    {a.comment && <p className="text-sm text-gray-600 mt-1">{a.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
