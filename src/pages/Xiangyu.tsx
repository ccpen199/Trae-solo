import { useEffect, useState } from "react";
import { apiFetch } from "@/store";
import { KeyRound, Lock, Unlock, BatteryLow, BatteryMedium, BatteryFull, Calendar, Wrench, Plus, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface Apartment {
  id: number;
  contract_no: string;
  property_title: string;
  community_name: string;
  rooms: number;
  area: number;
  rent_price: number;
  lock_id: string;
  lock_status: string;
  lock_battery: number;
  tenant_name: string;
  tenant_phone: string;
  lease_start: string;
  lease_end: string;
  status: string;
}

interface Repair {
  id: number;
  title: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  property_title: string;
}

export default function Xiangyu() {
  const [activeTab, setActiveTab] = useState<"apartments" | "cleanings" | "repairs">("apartments");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [showCleaningForm, setShowCleaningForm] = useState(false);
  const [repairForm, setRepairForm] = useState({ title: "", description: "", category: "other", urgency: "normal" });
  const [cleaningForm, setCleaningForm] = useState({ appointment_date: "", time_slot: "09:00-12:00", notes: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, rRes] = await Promise.all([
        apiFetch("/api/xiangyu/apartments?pageSize=50"),
        apiFetch("/api/xiangyu/repairs?pageSize=50"),
      ]);
      if (aRes.success && rRes.success) {
        setApartments(aRes.data.list);
        setRepairs(rRes.data.list);
      } else {
        setError(aRes.message || rRes.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (apt: Apartment) => {
    const newStatus = apt.lock_status === "locked" ? "unlocked" : "locked";
    try {
      await apiFetch(`/api/xiangyu/apartments/${apt.id}/lock`, {
        method: "PUT",
        body: JSON.stringify({ lock_status: newStatus }),
      });
      setApartments(list => list.map(a => a.id === apt.id ? { ...a, lock_status: newStatus } : a));
    } catch (e: any) {
      console.error("切换锁状态失败:", e);
    }
  };

  const submitCleaning = async () => {
    if (!selectedApt || !cleaningForm.appointment_date) return;
    try {
      await apiFetch("/api/xiangyu/cleanings", {
        method: "POST",
        body: JSON.stringify({ ...cleaningForm, apartment_id: selectedApt.id }),
      });
      setShowCleaningForm(false);
      setCleaningForm({ appointment_date: "", time_slot: "09:00-12:00", notes: "" });
    } catch (e: any) {
      console.error("提交保洁预约失败:", e);
    }
  };

  const submitRepair = async () => {
    if (!selectedApt || !repairForm.title) return;
    try {
      await apiFetch("/api/xiangyu/repairs", {
        method: "POST",
        body: JSON.stringify({ ...repairForm, apartment_id: selectedApt.id }),
      });
      setShowRepairForm(false);
      setRepairForm({ title: "", description: "", category: "other", urgency: "normal" });
      await loadData();
    } catch (e: any) {
      console.error("提交报修失败:", e);
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level < 30) return <BatteryLow className="w-5 h-5 text-red-500" />;
    if (level < 60) return <BatteryMedium className="w-5 h-5 text-amber-500" />;
    return <BatteryFull className="w-5 h-5 text-emerald-500" />;
  };

  const getBatteryColor = (level: number) => {
    if (level < 30) return "bg-red-500";
    if (level < 60) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getUrgencyColor = (u: string) => {
    const map: any = { low: "bg-gray-100 text-gray-600", normal: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", emergency: "bg-red-100 text-red-600" };
    return map[u] || map.normal;
  };

  const getRepairStatusColor = (s: string) => {
    const map: any = { pending: "bg-amber-100 text-amber-700", assigned: "bg-blue-100 text-blue-700", in_progress: "bg-purple-100 text-purple-700", completed: "bg-emerald-100 text-emerald-700", closed: "bg-gray-100 text-gray-600" };
    return map[s] || map.pending;
  };

  const getRepairStatusLabel = (s: string) => {
    const map: any = { pending: "待处理", assigned: "已派单", in_progress: "处理中", completed: "已完成", closed: "已关闭" };
    return map[s] || s;
  };

  const batteryLowCount = apartments.filter(a => a.lock_battery < 30).length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">相寓管家</h2>
          <p className="text-sm text-gray-500 mt-1">标准化合同管理 · 智能门锁 · 保洁预约 · 报修工单自动派单</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">在管公寓</div>
              <div className="text-2xl font-bold text-gray-900">{apartments.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">低电量预警</div>
              <div className="text-2xl font-bold text-red-600">{batteryLowCount}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">待处理报修</div>
              <div className="text-2xl font-bold text-blue-600">{repairs.filter(r => ["pending", "assigned", "in_progress"].includes(r.status)).length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">保洁预约</div>
              <div className="text-2xl font-bold text-amber-600">5</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "apartments", label: "公寓管理 · 智能门锁" },
          { key: "cleanings", label: "保洁预约" },
          { key: "repairs", label: "报修工单" },
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

      {activeTab === "apartments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">公寓列表 · 智能门锁状态</h3>
              </div>
              {loading ? (
                <div className="text-center py-16 text-gray-400">加载中...</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {apartments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApt(apt)}
                      className={`p-5 cursor-pointer transition-all ${selectedApt?.id === apt.id ? "bg-emerald-50/50 border-l-4 border-emerald-500" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${apt.lock_status === "locked" ? "bg-emerald-50" : "bg-amber-50"}`}>
                            {apt.lock_status === "locked" ? (
                              <Lock className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <Unlock className="w-6 h-6 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">{apt.property_title}</h4>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{apt.contract_no}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{apt.community_name} · {apt.rooms}室 · {apt.area}㎡</div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-gray-600">租客：{apt.tenant_name || "-"}</span>
                              <span className="text-gray-600">租金：{apt.rent_price}元/月</span>
                              {apt.lock_battery < 30 && (
                                <span className="text-red-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> 电量低
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              {getBatteryIcon(apt.lock_battery)}
                              <span className="text-sm font-medium text-gray-900">{apt.lock_battery}%</span>
                            </div>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                              <div className={`h-full ${getBatteryColor(apt.lock_battery)} rounded-full transition-all`} style={{ width: `${apt.lock_battery}%` }} />
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLock(apt); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${apt.lock_status === "locked" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                          >
                            {apt.lock_status === "locked" ? "开锁" : "锁定"}
                          </button>
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
              {selectedApt ? (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedApt.property_title}</h4>
                    <div className="text-sm text-gray-500 mt-1">{selectedApt.community_name} · {selectedApt.contract_no}</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">租金</span><span className="font-medium">{selectedApt.rent_price} 元/月</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">户型</span><span className="font-medium">{selectedApt.rooms}室 · {selectedApt.area}㎡</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">租期</span><span className="font-medium">{selectedApt.lease_start} 至 {selectedApt.lease_end}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">租客</span><span className="font-medium">{selectedApt.tenant_name} · {selectedApt.tenant_phone}</span></div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <KeyRound className="w-5 h-5 text-blue-500" />
                        智能门锁
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${selectedApt.lock_status === "locked" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {selectedApt.lock_status === "locked" ? "已锁定" : "已解锁"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">设备编号</span>
                      <span className="font-mono text-gray-900">{selectedApt.lock_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">当前电量</span>
                      <div className="flex items-center gap-2">
                        {getBatteryIcon(selectedApt.lock_battery)}
                        <span className="font-medium">{selectedApt.lock_battery}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowCleaningForm(true)}
                      className="py-3 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                    >
                      <Calendar className="w-5 h-5 text-blue-500" />
                      预约保洁
                    </button>
                    <button
                      onClick={() => setShowRepairForm(true)}
                      className="py-3 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                    >
                      <Wrench className="w-5 h-5 text-amber-500" />
                      提交报修
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <KeyRound className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>请选择一套公寓查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "repairs" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">报修工单 · 自动派单</h3>
            <button onClick={() => setShowRepairForm(true)} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> 新建工单
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {repairs.map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.urgency === "emergency" ? "bg-red-50" : r.urgency === "high" ? "bg-amber-50" : "bg-blue-50"}`}>
                      <Wrench className={`w-5 h-5 ${r.urgency === "emergency" ? "text-red-500" : r.urgency === "high" ? "text-amber-500" : "text-blue-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{r.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(r.urgency)}`}>
                          {r.urgency === "emergency" ? "紧急" : r.urgency === "high" ? "高优" : r.urgency === "low" ? "低" : "普通"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRepairStatusColor(r.status)}`}>
                          {getRepairStatusLabel(r.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        关联房源：{r.property_title} · {r.category === "plumbing" ? "水电" : r.category === "electrical" ? "电器" : r.category === "door_window" ? "门窗" : r.category === "appliance" ? "家电" : r.category === "furniture" ? "家具" : "其他"}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">{r.created_at}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.status === "completed" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {r.status === "pending" && (
                      <button className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600">自动派单</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "cleanings" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <Calendar className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500">保洁预约功能可在「公寓管理」中操作</p>
          <p className="text-sm text-gray-400 mt-2">选择公寓 → 点击「预约保洁」</p>
        </div>
      )}

      {showCleaningForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              预约保洁 · {selectedApt?.property_title}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">预约日期</label>
                <input type="date" value={cleaningForm.appointment_date} onChange={(e) => setCleaningForm({ ...cleaningForm, appointment_date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">时段</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={cleaningForm.time_slot} onChange={(e) => setCleaningForm({ ...cleaningForm, time_slot: e.target.value })}>
                  <option value="09:00-12:00">上午 09:00-12:00</option>
                  <option value="14:00-17:00">下午 14:00-17:00</option>
                  <option value="17:00-20:00">傍晚 17:00-20:00</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">备注</label>
                <textarea rows={3} value={cleaningForm.notes} onChange={(e) => setCleaningForm({ ...cleaningForm, notes: e.target.value })} placeholder="特殊要求..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCleaningForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={submitCleaning} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">提交预约</button>
            </div>
          </div>
        </div>
      )}

      {showRepairForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              提交报修 · {selectedApt?.property_title}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">问题标题 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="简述问题" value={repairForm.title} onChange={(e) => setRepairForm({ ...repairForm, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">类别</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={repairForm.category} onChange={(e) => setRepairForm({ ...repairForm, category: e.target.value })}>
                    <option value="plumbing">水电</option>
                    <option value="electrical">电器</option>
                    <option value="door_window">门窗</option>
                    <option value="appliance">家电</option>
                    <option value="furniture">家具</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">紧急程度</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={repairForm.urgency} onChange={(e) => setRepairForm({ ...repairForm, urgency: e.target.value })}>
                    <option value="low">低</option>
                    <option value="normal">普通</option>
                    <option value="high">高优</option>
                    <option value="emergency">紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">问题描述</label>
                <textarea rows={3} value={repairForm.description} onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })} placeholder="详细描述问题..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowRepairForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={submitRepair} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">提交工单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
