import { useEffect, useState } from "react";
import { apiFetch } from "@/store";
import { Users, Share2, Eye, Shield, CheckCircle, XCircle, AlertTriangle, Plus, AlertCircle } from "lucide-react";

export default function Collaboration() {
  const [activeTab, setActiveTab] = useState<"viewings" | "share" | "verification">("viewings");
  const [viewings, setViewings] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareForm, setShareForm] = useState({ from_agent_id: "1", to_agent_id: "", customer_name: "", permission_level: "view" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, cRes, aRes] = await Promise.all([
        apiFetch("/api/collab/viewings?pageSize=50"),
        apiFetch("/api/collab/collaborations?pageSize=50"),
        apiFetch("/api/agents?pageSize=50"),
      ]);
      if (vRes.success && cRes.success && aRes.success) {
        setViewings(vRes.data.list);
        setCollaborations(cRes.data.list);
        setAgents(aRes.data.list);
      } else {
        setError(vRes.message || cRes.message || aRes.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const submitShare = async () => {
    if (!shareForm.to_agent_id) return;
    try {
      const res = await apiFetch("/api/collab/collaborations", {
        method: "POST",
        body: JSON.stringify(shareForm),
      });
      if (res.success) {
        setShowShareForm(false);
        await loadData();
        setShareForm({ from_agent_id: "1", to_agent_id: "", customer_name: "", permission_level: "view" });
      }
    } catch (e: any) {
      console.error("提交共享失败:", e);
    }
  };

  const revokeShare = async (id: number) => {
    try {
      await apiFetch(`/api/collab/collaborations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "revoked" }),
      });
      await loadData();
    } catch (e: any) {
      console.error("撤销共享失败:", e);
    }
  };

  const getPermColor = (p: string) => {
    const map: any = { view: "bg-blue-100 text-blue-700", edit: "bg-amber-100 text-amber-700", full: "bg-red-100 text-red-700" };
    return map[p] || map.view;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">经纪人协作工具</h2>
          <p className="text-sm text-gray-500 mt-1">客户共享权限配置 · 带看记录自动归集</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "viewings", label: "带看记录归集" },
          { key: "share", label: "客户共享配置" },
          { key: "verification", label: "房源核验流水线" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key ? "text-emerald-600 border-emerald-500" : "text-gray-500 border-transparent hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "viewings" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              带看记录 · 自动归集
            </h3>
            <span className="text-sm text-gray-500">共 {viewings.length} 条带看记录</span>
          </div>
          {loading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-5 text-left font-medium text-gray-500">房源</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">类型</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">价格</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">经纪人</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">客户</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">带看时间</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">方式</th>
                    <th className="py-4 px-5 text-left font-medium text-gray-500">评分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewings.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-4 px-5">
                        <div className="font-medium text-gray-900 max-w-[240px] truncate">{v.property_title}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded ${v.property_type === "sale" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {v.property_type === "sale" ? "二手房" : "租房"}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-900">{v.price}{v.property_type === "sale" ? "万" : "元/月"}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                            {v.agent_name?.charAt(0)}
                          </div>
                          <span>{v.agent_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-600">{v.viewer_name}</td>
                      <td className="py-4 px-5 text-gray-500">{v.viewed_at}</td>
                      <td className="py-4 px-5">
                        <span className={`text-xs px-2 py-0.5 rounded ${v.type === "online" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                          {v.type === "online" ? "VR线上带看" : "线下带看"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-amber-500">{"★".repeat(v.rating || 0)}</span>
                        <span className="text-gray-300">{"★".repeat(5 - (v.rating || 0))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "share" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-500" />
              客户共享权限配置
            </h3>
            <button onClick={() => setShowShareForm(true)} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> 新增共享
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {collaborations.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {c.from_agent_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.from_agent_name}</div>
                        <div className="text-xs text-gray-500">{c.from_store_name}</div>
                      </div>
                    </div>
                    <Share2 className="w-5 h-5 text-gray-300" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {c.to_agent_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.to_agent_name}</div>
                        <div className="text-xs text-gray-500">{c.to_store_name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div>
                      <div className="text-sm text-gray-900 font-medium">{c.customer_name || "未命名客户"}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPermColor(c.permission_level)}`}>
                        {c.permission_level === "full" ? "完全控制" : c.permission_level === "edit" ? "可编辑" : "仅查看"}
                      </span>
                    </div>
                    {c.status === "active" && (
                      <button onClick={() => revokeShare(c.id)} className="text-xs text-red-500 hover:text-red-600 px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors">
                        撤销
                      </button>
                    )}
                    {c.status === "revoked" && (
                      <span className="text-xs text-gray-400 px-3 py-1 border border-gray-200 rounded">已撤销</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "verification" && <VerificationList />}

      {showShareForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-500" />
              新增客户共享
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">客户姓名</label>
                <input type="text" placeholder="请输入客户姓名" value={shareForm.customer_name} onChange={(e) => setShareForm({ ...shareForm, customer_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">共享给经纪人</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={shareForm.to_agent_id} onChange={(e) => setShareForm({ ...shareForm, to_agent_id: e.target.value })}>
                  <option value="" disabled>请选择经纪人</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} · {a.store_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">权限级别</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "view", label: "仅查看" },
                    { key: "edit", label: "可编辑" },
                    { key: "full", label: "完全控制" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setShareForm({ ...shareForm, permission_level: opt.key })}
                      className={`py-2.5 text-sm rounded-lg border transition-colors ${shareForm.permission_level === opt.key ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowShareForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={submitShare} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">确认共享</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationList() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/collab/verifications?pageSize=50");
      if (res.success) {
        setVerifications(res.data.list);
      } else {
        setError(res.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const review = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/collab/verifications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ verification_status: status }),
      });
      await loadData();
    } catch (e: any) {
      console.error("审核失败:", e);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "passed") return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === "failed") return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  };

  const getStatusColor = (status: string) => {
    const map: any = { pending: "bg-amber-100 text-amber-700", passed: "bg-emerald-100 text-emerald-700", failed: "bg-red-100 text-red-600", needs_review: "bg-blue-100 text-blue-700" };
    return map[status] || map.pending;
  };

  const getStatusLabel = (status: string) => {
    const map: any = { pending: "待核验", passed: "核验通过", failed: "核验不通过", needs_review: "需人工复核" };
    return map[status] || status;
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            房源真实性核验流水线
            <span className="text-sm text-gray-500 font-normal">· AI实勘照片比对 + 地址脱敏校验</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {verifications.map((v) => (
            <div key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(v.verification_status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{v.property_title}</h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${getStatusColor(v.verification_status)}`}>
                        {getStatusLabel(v.verification_status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{v.community_name} · 核验员：{v.inspector_name || "-"}</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">AI 照片匹配度</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${v.ai_match_score >= 85 ? "bg-emerald-500" : v.ai_match_score >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${v.ai_match_score}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{v.ai_match_score?.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">地址核验</div>
                        {v.address_verified ? (
                          <span className="flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            已通过脱敏校验
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="w-4 h-4 text-red-500" />
                            地址不匹配
                          </span>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">核验时间</div>
                        <div className="text-sm text-gray-900">{v.verified_at || "未核验"}</div>
                      </div>
                    </div>
                    {v.notes && <p className="text-xs text-gray-500 mt-2">备注：{v.notes}</p>}
                  </div>
                </div>
                {v.verification_status === "needs_review" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => review(v.id, "passed")} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600">通过</button>
                    <button onClick={() => review(v.id, "failed")} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600">驳回</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
