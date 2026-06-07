import { useEffect, useState } from "react";
import { apiFetch } from "@/store";
import { Users, Star, MapPin, Home, Eye, CheckCircle, Award, AlertCircle, Phone, MessageSquare, Calendar, X, Clock, Store } from "lucide-react";

const isEnabled = (value: number | boolean | null | undefined) => value === true || value === 1;

interface ContactRecord {
  id: number;
  agent_id: number;
  customer_id: number;
  contact_type: string;
  content: string;
  status: string;
  next_follow_up: string;
  created_at: string;
  store_name: string;
  has_shared: number;
  assigned_viewings_count: number;
}

interface ExclusiveAssignment {
  id: number;
  agent_id: number;
  customer_id: number;
  status: string;
  assigned_at: string;
  store_name: string;
}

const contactTypeLabels: Record<string, string> = {
  phone: "电话",
  im: "IM沟通",
  viewing: "预约带看"
};

const statusLabels: Record<string, string> = {
  pending: "待联系",
  contacted: "已联系",
  following: "跟进中",
  closed: "已成交"
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  following: "bg-purple-100 text-purple-700",
  closed: "bg-emerald-100 text-emerald-700"
};

export default function Agents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ store_id: "", certified: "" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [contactRecords, setContactRecords] = useState<ContactRecord[]>([]);
  const [exclusiveAssignment, setExclusiveAssignment] = useState<ExclusiveAssignment | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    contact_type: "phone",
    content: "",
    next_follow_up: "",
    enable_sharing: true,
    auto_assign_viewings: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, filter]);

  const loadStores = async () => {
    try {
      const res = await apiFetch("/api/agents/stores");
      if (res.success) setStores(res.data);
    } catch (e: any) {
      console.error("加载门店数据失败:", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (filter.store_id) params.set("store_id", filter.store_id);
      if (filter.certified) params.set("certified", filter.certified);
      const res = await apiFetch(`/api/agents?${params.toString()}`);
      if (res.success) {
        setAgents(res.data.list);
        setTotal(res.data.total);
        if (!selectedId && res.data.list.length > 0) {
          loadDetail(res.data.list[0].id);
        }
      } else {
        setError(res.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setSelectedId(id);
    try {
      const [detailRes, contactsRes, assignRes] = await Promise.all([
        apiFetch(`/api/agents/${id}`),
        apiFetch(`/api/agents/${id}/contacts`),
        apiFetch(`/api/agents/${id}/exclusive?customer_id=5`),
      ]);
      if (detailRes.success) setDetail(detailRes.data);
      if (contactsRes.success) setContactRecords(contactsRes.data);
      if (assignRes.success) setExclusiveAssignment(assignRes.data);
    } catch (e: any) {
      console.error("加载经纪人详情失败:", e);
    }
  };



  const submitContactRecord = async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/agents/${detail.id}/contact`, {
        method: "POST",
        body: JSON.stringify({
          customer_id: 5,
          contact_type: contactForm.contact_type,
          content: contactForm.content,
          status: "following",
          next_follow_up: contactForm.next_follow_up,
          has_shared: contactForm.enable_sharing ? 1 : 0,
          auto_assign_viewings: contactForm.auto_assign_viewings ? 1 : 0,
        }),
      });
      if (res.success) {
        setShowContactForm(false);
        let noticeMsg = "联系记录已保存";
        if (contactForm.enable_sharing) noticeMsg += "，客户信息已同步至门店共享池";
        if (contactForm.auto_assign_viewings) noticeMsg += "，带看记录已自动归集";
        noticeMsg += "，专属承接状态已激活";
        setNotice(noticeMsg);
        const [recordsRes, assignRes] = await Promise.all([
          apiFetch(`/api/agents/${detail.id}/contacts`),
          apiFetch(`/api/agents/${detail.id}/exclusive?customer_id=5`),
        ]);
        if (recordsRes.success) setContactRecords(recordsRes.data);
        if (assignRes.success) setExclusiveAssignment(assignRes.data);
        setContactForm({ contact_type: "phone", content: "", next_follow_up: "", enable_sharing: true, auto_assign_viewings: true });
      } else {
        setError(res.message || "保存失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const getStoreAcceptStatus = () => {
    if (contactRecords.length > 0) {
      const latest = contactRecords[0];
      return latest.store_name ? `已承接 - ${latest.store_name}` : "待承接";
    }
    return detail?.store_name ? `已承接 - ${detail.store_name}` : "待承接";
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-3">
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
            value={filter.store_id}
            onChange={(e) => setFilter({ ...filter, store_id: e.target.value })}
          >
            <option value="">全部门店</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.agent_count}人)</option>)}
          </select>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
            value={filter.certified}
            onChange={(e) => setFilter({ ...filter, certified: e.target.value })}
          >
            <option value="">全部经纪人</option>
            <option value="1">我爱我家认证</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">经纪人列表 · 共 {total} 人</h3>
            </div>
            {loading ? (
              <div className="text-center py-16 text-gray-400">加载中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {agents.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => loadDetail(a.id)}
                    className={`p-5 cursor-pointer transition-all hover:bg-emerald-50/30 ${selectedId === a.id ? "bg-emerald-50/50 border-l-4 border-emerald-500" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {a.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{a.name}</h4>
                          {isEnabled(a.certified) && (
                            <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3 h-3" /> 我爱我家认证
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {a.store_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{a.store_address}</div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium text-gray-900">{a.rating}</span>
                            <span className="text-xs text-gray-400">/5.0</span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>成交 <b className="text-emerald-600">{a.deal_count}</b> 笔</span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            <span>在管房源</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
            {showContactForm && detail && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-900 text-lg">联系 {detail.name}</h3>
                    <button onClick={() => setShowContactForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">联系方式</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "phone", label: "电话", icon: Phone },
                          { value: "im", label: "IM", icon: MessageSquare },
                          { value: "viewing", label: "带看", icon: Calendar }
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setContactForm({ ...contactForm, contact_type: value })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                              contactForm.contact_type === value
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 hover:border-emerald-200"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">客户需求备注</label>
                      <textarea
                        value={contactForm.content}
                        onChange={(e) => setContactForm({ ...contactForm, content: e.target.value })}
                        placeholder="请输入客户需求、预算、意向房源等信息..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">下次跟进时间</label>
                      <input
                        type="datetime-local"
                        value={contactForm.next_follow_up}
                        onChange={(e) => setContactForm({ ...contactForm, next_follow_up: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-700">客户信息共享至门店</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContactForm({ ...contactForm, enable_sharing: !contactForm.enable_sharing })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${contactForm.enable_sharing ? "bg-emerald-500" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${contactForm.enable_sharing ? "left-7" : "left-1"}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700">带看记录自动归集</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContactForm({ ...contactForm, auto_assign_viewings: !contactForm.auto_assign_viewings })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${contactForm.auto_assign_viewings ? "bg-emerald-500" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${contactForm.auto_assign_viewings ? "left-7" : "left-1"}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => setShowContactForm(false)}
                        className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={submitContactRecord}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? "提交中..." : "保存记录"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detail ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-3xl mx-auto">
                    {detail.name?.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mt-3 flex items-center justify-center gap-2">
                    {detail.name}
                    {isEnabled(detail.certified) && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">{detail.store_name}</div>
                  <div className="text-xs text-gray-400">{detail.store_phone}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                      {getStoreAcceptStatus()}
                    </span>
                  </div>
                </div>

                {exclusiveAssignment && exclusiveAssignment.status === "active" && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-bold text-amber-800">专属承接已激活</span>
                    </div>
                    <div className="text-xs text-amber-700 space-y-1">
                      <div className="flex justify-between">
                        <span>承接门店</span>
                        <span className="font-medium">{exclusiveAssignment.store_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>生效时间</span>
                        <span className="font-medium">{exclusiveAssignment.assigned_at}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>客户共享</span>
                        <span className="text-emerald-600 font-medium">已开启</span>
                      </div>
                      <div className="flex justify-between">
                        <span>带看归集</span>
                        <span className="text-blue-600 font-medium">自动同步</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-500">{detail.rating}</div>
                    <div className="text-[10px] text-gray-500">评分</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="text-lg font-bold text-emerald-600">{detail.deal_count}</div>
                    <div className="text-[10px] text-gray-500">成交笔数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{detail.activeProperties?.length || 0}</div>
                    <div className="text-[10px] text-gray-500">在管房源</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    最近带看
                  </h4>
                  <div className="space-y-3">
                    {detail.recentViewings?.length > 0 ? detail.recentViewings.slice(0, 5).map((v: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{v.property_title}</div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-500">{v.viewer_name} · {v.type === "online" ? "VR带看" : "线下"}</span>
                          <span className="text-red-500 font-medium">{v.price}{v.property_type === "sale" ? "万" : "元/月"}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{v.viewed_at}</div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-gray-400 text-sm">暂无带看记录</div>
                    )}
                  </div>
                </div>

                {contactRecords.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">联系记录</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {contactRecords.map((record) => (
                        <div key={record.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${contactTypeLabels[record.contact_type] ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                              {contactTypeLabels[record.contact_type] || record.contact_type}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[record.status] || "bg-gray-100 text-gray-700"}`}>
                              {statusLabels[record.status] || record.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {isEnabled(record.has_shared) && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <CheckCircle className="w-2.5 h-2.5" /> 已共享
                              </span>
                            )}
                            {isEnabled(record.assigned_viewings_count) && record.assigned_viewings_count > 0 && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" /> 归集 {record.assigned_viewings_count} 条带看
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{record.content}</p>
                          {record.next_follow_up && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>下次跟进：{record.next_follow_up}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">{record.created_at}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowContactForm(true);
                    setContactForm({
                      contact_type: "phone",
                      content: "",
                      next_follow_up: "",
                    });
                  }}
                  className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  联系经纪人
                </button>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>请选择一位经纪人查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
