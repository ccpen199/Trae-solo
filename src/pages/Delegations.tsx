import { useEffect, useState } from "react";
import { apiFetch } from "@/store";
import { Plus, FileCheck, User, Home, Search, CheckCircle2, AlertCircle, CheckCircle, ArrowRight, Clock } from "lucide-react";

interface StatusHistory {
  id: number;
  delegation_id: number;
  from_status: string | null;
  to_status: string;
  agent_id: number | null;
  agent_name: string | null;
  remark: string;
  created_at: string;
}

interface Delegation {
  id: number;
  title: string;
  description: string;
  expected_price: number;
  status: string;
  agent_name: string;
  store_name: string;
  property_title: string;
  created_at: string;
  status_history: StatusHistory[];
}

export default function Delegations() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", expected_price: "", property_id: "" });
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    loadData();
    loadReferences();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ owner_id: "2", page: String(page), pageSize: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch(`/api/delegations?${params.toString()}`);
      if (res.success) {
        setDelegations(res.data.list);
        setTotal(res.data.total);
      } else {
        setError(res.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        apiFetch("/api/properties?pageSize=50"),
        apiFetch("/api/agents?pageSize=50"),
      ]);
      if (pRes.success) setProperties(pRes.data.list);
      if (aRes.success) setAgents(aRes.data.list);
    } catch (e: any) {
      console.error("加载参考数据失败:", e);
    }
  };

  const submitDelegation = async () => {
    if (!form.title) return;
    try {
      const res = await apiFetch("/api/delegations", {
        method: "POST",
        body: JSON.stringify({ ...form, owner_id: 2, expected_price: Number(form.expected_price) || 0 }),
      });
      if (res.success) {
        setShowForm(false);
        setForm({ title: "", description: "", expected_price: "", property_id: "" });
        await loadData();
        setSuccess("委托发布成功！");
      } else {
        setError(res.message || "发布失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    }
  };

  const assignAgent = async (id: number, agentId: number) => {
    try {
      const res = await apiFetch(`/api/delegations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ agent_id: agentId, status: "assigned" }),
      });
      if (res.success) {
        await loadData();
        setSuccess("经纪人分配成功！");
      }
    } catch (e: any) {
      console.error("分配经纪人失败:", e);
    }
  };

  const getStatusColor = (status: string) => {
    const map: any = {
      pending: "bg-amber-100 text-amber-700",
      assigned: "bg-blue-100 text-blue-700",
      active: "bg-emerald-100 text-emerald-700",
      completed: "bg-gray-100 text-gray-600",
      cancelled: "bg-red-100 text-red-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const getStatusLabel = (status: string) => {
    const map: any = {
      pending: "待分配",
      assigned: "已分配",
      active: "服务中",
      completed: "已完成",
      cancelled: "已取消",
    };
    return map[status] || status;
  };

  const getStatusHistoryTimeline = (history: StatusHistory[]) => {
    const statusOrder = ["pending", "assigned", "active", "completed"];
    const achievedStatuses = history.map(h => h.to_status);
    
    return (
      <div className="flex items-center gap-1 mt-3">
        {statusOrder.map((s, i) => {
          const isAchieved = achievedStatuses.includes(s);
          const historyItem = history.find(h => h.to_status === s);
          return (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isAchieved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {isAchieved && <CheckCircle className="w-3 h-3" />}
                {getStatusLabel(s)}
              </div>
              {i < statusOrder.length - 1 && (
                <ArrowRight className={`w-3 h-3 mx-1 ${isAchieved ? "text-emerald-400" : "text-gray-300"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">业主委托中心</h2>
          <p className="text-sm text-gray-500 mt-1">在线发布卖房需求，绑定专属经纪人</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          发布卖房委托
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            发布卖房委托
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">委托标题 <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="例如：翠苑一区两房诚意出售" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">绑定房源</label>
              <select
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
              >
                <option value="">暂不绑定</option>
                {properties.filter(p => p.type === "sale").map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title} · {p.price}万</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">期望售价（万元）</label>
              <input
                type="number" placeholder="请输入期望售价" value={form.expected_price}
                onChange={(e) => setForm({ ...form, expected_price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">房屋情况描述</label>
              <textarea
                rows={3} placeholder="房屋保养情况、装修状况、看房时间等" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
            <button onClick={submitDelegation} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">提交委托</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {["", "pending", "assigned", "active", "completed"].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${statusFilter === s ? "bg-emerald-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {s === "" ? "全部" : getStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {delegations.map((d) => (
              <div key={d.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{d.title}</h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${getStatusColor(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </div>
                    {d.property_title && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                        <Home className="w-4 h-4" />
                        {d.property_title}
                      </div>
                    )}
                    {d.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{d.description}</p>
                    )}
                    {d.status_history && d.status_history.length > 0 && getStatusHistoryTimeline(d.status_history)}
                    {d.status_history && d.status_history.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 状态流转记录
                        </div>
                        <div className="space-y-2">
                          {d.status_history.slice(-3).map((h) => (
                            <div key={h.id} className="flex items-start gap-2 text-xs">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${h.to_status === "cancelled" ? "bg-red-100" : "bg-emerald-100"}`}>
                                <CheckCircle className={`w-3 h-3 ${h.to_status === "cancelled" ? "text-red-500" : "text-emerald-500"}`} />
                              </div>
                              <div className="flex-1">
                                <div className="text-gray-700">
                                  {h.remark}
                                  {h.agent_name && <span className="text-gray-500"> · {h.agent_name}</span>}
                                </div>
                                <div className="text-gray-400 mt-0.5">{h.created_at}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>期望售价：<b className="text-red-500 text-sm">{d.expected_price || 0}</b> 万</span>
                      <span>提交时间：{d.created_at}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {d.agent_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                          {d.agent_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            {d.agent_name}
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="text-xs text-gray-500">{d.store_name}</div>
                          <div className="text-xs text-emerald-600 mt-1">专属经纪人</div>
                        </div>
                      </div>
                    ) : d.status === "pending" ? (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">专属经纪人</div>
                        <select
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          onChange={(e) => e.target.value && assignAgent(d.id, Number(e.target.value))}
                          defaultValue=""
                        >
                          <option value="" disabled>分配经纪人</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} · {a.deal_count}笔成交</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">暂无经纪人</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {delegations.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无委托记录</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
