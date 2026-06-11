import { useState, useEffect } from "react";
import {
  Plane,
  TrainFront,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  AlertOctagon,
  Eye,
  XCircle,
  RotateCcw,
  MessageCircle,
  Calendar,
  Info,
  FileText,
  Stethoscope,
  Scale,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { VipLoungeBooking } from "@/types";

interface VipLounge {
  id: string;
  name: string;
  airport: string;
  location: string;
  openTime: string;
  amenities: string[];
  maxDaily: number;
  bookedToday: number;
}

interface BookingRecord {
  id: string;
  type: string;
  memberId: string;
  memberName: string;
  resourceId: string;
  resourceName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  appliedAt: string;
  processedAt: string | null;
  remarks: string;
  expectedWaitTime?: string;
}

interface TrainBooking {
  id: string;
  trainInfo: string;
  travelDate: string;
  status: string;
  createdAt: string;
}

interface TrackStage {
  stage: string;
  status: string;
  time: string | null;
  operator: string;
  remark: string;
}

interface ExceptionItem {
  id: string;
  title: string;
  type: "timeout" | "change" | "payment";
  occurredAt: string;
  currentStatus: string;
  description: string;
  expectedHours?: number;
}

type TabType = "vip" | "train" | "records";

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  vip_lounge: { label: "VIP厅", icon: Plane, color: "text-blue-600 bg-blue-50" },
  train_ticket: { label: "火车票", icon: TrainFront, color: "text-union-red bg-union-red/10" },
  health_checkup: { label: "体检", icon: Stethoscope, color: "text-green-600 bg-green-50" },
  legal_consult: { label: "法律咨询", icon: Scale, color: "text-purple-600 bg-purple-50" },
};

const exceptionTypeLabels: Record<string, { label: string; color: string }> = {
  timeout: { label: "预约超时", color: "bg-orange-100 text-orange-700 border-orange-200" },
  change: { label: "服务变更", color: "bg-red-100 text-red-700 border-red-200" },
  payment: { label: "支付异常", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function Travel() {
  const [activeTab, setActiveTab] = useState<TabType>("vip");
  const [vipLounges, setVipLounges] = useState<VipLounge[]>([]);
  const [vipBookings, setVipBookings] = useState<VipLoungeBooking[]>([]);
  const [trainRequests, setTrainRequests] = useState<TrainBooking[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLounge, setSelectedLounge] = useState("");
  const [loungeDate, setLoungeDate] = useState("");
  const [loungeTime, setLoungeTime] = useState("10:00");
  const [bookingMsg, setBookingMsg] = useState("");

  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [trainMsg, setTrainMsg] = useState("");
  const [showTrainTimeline, setShowTrainTimeline] = useState(false);

  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [trackData, setTrackData] = useState<TrackStage[]>([]);
  const [trackBookingName, setTrackBookingName] = useState("");

  const [exceptionSearch, setExceptionSearch] = useState("");
  const [exceptionFilter, setExceptionFilter] = useState<string>("all");
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const memberId = "mem-1";
  const isAdmin = true;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const fetchVipLounges = async () => {
    try {
      const res = await fetch("/api/services/vip-lounges");
      const json = await res.json();
      if (json.success) setVipLounges(json.data);
    } catch {}
  };

  const fetchVipBookings = async () => {
    try {
      const res = await fetch("/api/services/bookings");
      const json = await res.json();
      if (json.success) {
        const loungeBookings = json.data
          .filter((b: any) => b.type === "vip_lounge")
          .map((b: any) => ({
            id: b.id,
            memberId: b.memberId,
            loungeId: b.resourceId,
            loungeName: b.resourceName,
            bookingDate: b.bookingDate,
            bookingTime: b.bookingTime,
            status: b.status,
          } as VipLoungeBooking));
        setVipBookings(loungeBookings);
      }
    } catch {}
  };

  const fetchTrainRequests = async () => {
    try {
      const res = await fetch(`/api/services/train/requests?memberId=${memberId}`);
      const json = await res.json();
      if (json.success) setTrainRequests(json.data);
    } catch {}
  };

  const fetchAllBookings = async () => {
    try {
      const res = await fetch(`/api/services/bookings?memberId=${memberId}`);
      const json = await res.json();
      if (json.success) setAllBookings(json.data);
    } catch {}
  };

  const loadExceptions = () => {
    const mockExceptions: ExceptionItem[] = [
      {
        id: "ex-1",
        title: "火车票购票申请超时",
        type: "timeout",
        occurredAt: "2025-06-08 10:30:00",
        currentStatus: "待处理",
        description: "G101 南京→上海 的购票申请已提交超过48小时未处理",
        expectedHours: 24,
      },
      {
        id: "ex-2",
        title: "贵宾厅临时关闭通知",
        type: "change",
        occurredAt: "2025-06-09 14:20:00",
        currentStatus: "处理中",
        description: "T2航站楼贵宾厅A区因设备维护将于6月15日临时关闭，已为您调整至T1航站楼贵宾厅B区",
      },
      {
        id: "ex-3",
        title: "体检套餐支付异常",
        type: "payment",
        occurredAt: "2025-06-09 09:15:00",
        currentStatus: "待处理",
        description: "女性关爱体检套餐支付未完成，请重新支付或联系客服",
      },
    ];
    setExceptions(mockExceptions);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchVipLounges(),
        fetchVipBookings(),
        fetchTrainRequests(),
        fetchAllBookings(),
      ]);
      loadExceptions();
      setLoading(false);
    };
    init();
  }, []);

  const openTrackDialog = async (bookingId: string, bookingName: string) => {
    try {
      const res = await fetch(`/api/services/bookings/${bookingId}/track`);
      const json = await res.json();
      if (json.success) {
        setTrackData(json.data);
        setTrackBookingName(bookingName);
        setTrackDialogOpen(true);
      }
    } catch {}
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/services/bookings/${bookingId}/cancel`, {
        method: "PUT",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        await Promise.all([fetchVipBookings(), fetchTrainRequests(), fetchAllBookings()]);
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("操作失败", "error");
    }
  };

  const handleVipBooking = async () => {
    if (!selectedLounge || !loungeDate) return;
    try {
      const lounge = vipLounges.find((l) => l.id === selectedLounge);
      const newBooking: VipLoungeBooking = {
        id: `bk-temp-${Date.now()}`,
        memberId,
        loungeId: selectedLounge,
        loungeName: lounge?.name || "",
        bookingDate: loungeDate,
        bookingTime: loungeTime,
        status: "confirmed",
      };
      setVipBookings((prev) => [newBooking, ...prev]);
      setAllBookings((prev) => [
        {
          id: newBooking.id,
          type: "vip_lounge",
        memberId,
        memberName: "张三",
        resourceId: selectedLounge,
        resourceName: lounge?.name || "",
        bookingDate: loungeDate,
        bookingTime: loungeTime,
        status: "confirmed",
        appliedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        remarks: "",
        },
        ...prev,
      ]);
      const res = await fetch("/api/services/vip-lounges/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, loungeId: selectedLounge, bookingDate: loungeDate, bookingTime: loungeTime }),
      });
      const json = await res.json();
      if (json.success) {
        setBookingMsg(json.message || "预约成功");
        setSelectedLounge("");
        setLoungeDate("");
        setLoungeTime("10:00");
        fetchVipBookings();
        fetchAllBookings();
      } else {
        setBookingMsg(json.message || "预约失败");
        setVipBookings((prev) => prev.filter((b) => b.id !== newBooking.id));
        setAllBookings((prev) => prev.filter((b) => b.id !== newBooking.id));
      }
    } catch {
      setBookingMsg("网络错误");
      setVipBookings((prev) => prev.filter((b) => b.id !== newBooking.id));
      setAllBookings((prev) => prev.filter((b) => b.id !== newBooking.id));
    }
    setTimeout(() => setBookingMsg(""), 3000);
  };

  const handleTrainRequest = async () => {
    if (!fromStation || !toStation || !travelDate) return;
    try {
      const res = await fetch("/api/services/train/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, fromStation, toStation, travelDate }),
      });
      const json = await res.json();
      if (json.success) {
        setTrainMsg(json.message || "申请已提交");
        setFromStation("");
        setToStation("");
        setTravelDate("");
        setShowTrainTimeline(true);
        fetchTrainRequests();
        fetchAllBookings();
      } else {
        setTrainMsg(json.message || "申请失败");
      }
    } catch {
      setTrainMsg("网络错误");
    }
    setTimeout(() => setTrainMsg(""), 5000);
  };

  const handleApproveTrain = async (id: string) => {
    try {
      const res = await fetch(`/api/services/train/${id}/approve`, { method: "PUT" });
      const json = await res.json();
      if (json.success) {
        showToast("审批通过");
        fetchTrainRequests();
        fetchAllBookings();
      }
    } catch {}
  };

  const filteredExceptions = exceptions.filter((e) => {
    const matchesSearch = e.title.includes(exceptionSearch) || e.description.includes(exceptionSearch);
    if (exceptionFilter === "all") return matchesSearch;
    if (exceptionFilter === "pending") return matchesSearch && e.currentStatus === "待处理";
    if (exceptionFilter === "processing") return matchesSearch && e.currentStatus === "处理中";
    if (exceptionFilter === "resolved") return matchesSearch && e.currentStatus === "已解决";
    return matchesSearch;
  });

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "vip", label: "贵宾厅预约", icon: Plane },
    { key: "train", label: "火车票优先购票", icon: TrainFront },
    { key: "records", label: "预约记录 & 异常追踪", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-union-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium",
            toastType === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {toastType === "success" ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
          {toastMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-union-red text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "vip" && (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Plane size={22} className="text-union-red" />
              <h2 className="text-xl font-bold">机场贵宾厅预约</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {vipLounges.map((lounge) => (
                <div key={lounge.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-gray-900">{lounge.name}</h4>
                    <span className="shrink-0 px-2 py-0.5 bg-union-red/10 text-union-red text-xs rounded-full font-medium">
                      {lounge.airport}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{lounge.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" />
                      <span>{lounge.openTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {lounge.amenities.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>今日预约</span>
                      <span>{lounge.bookedToday}/{lounge.maxDaily}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          lounge.bookedToday >= lounge.maxDaily ? "bg-red-500" : "bg-union-red"
                        )}
                        style={{ width: `${Math.min((lounge.bookedToday / lounge.maxDaily) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLounge(lounge.id)}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-medium transition-all",
                      selectedLounge === lounge.id
                        ? "bg-union-red text-white"
                        : "btn-outline text-sm py-2"
                    )}
                  >
                    {selectedLounge === lounge.id ? "已选择" : "选择预约"}
                  </button>
                </div>
              ))}
            </div>

            {selectedLounge && (
              <div className="card mb-6">
                <h4 className="font-bold mb-4">预约信息</h4>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">预约日期</label>
                    <input type="date" value={loungeDate} onChange={(e) => setLoungeDate(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">预约时间</label>
                    <input type="time" value={loungeTime} onChange={(e) => setLoungeTime(e.target.value)} className="input-field" />
                  </div>
                  <button onClick={handleVipBooking} className="btn-primary flex items-center gap-2">
                    <Send size={16} />
                    提交预约
                  </button>
                </div>
                {bookingMsg && (
                  <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {bookingMsg}
                  </p>
                )}
              </div>
            )}

            {vipBookings.length > 0 && (
              <div className="card">
                <h4 className="font-bold mb-4">我的贵宾厅预约</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">类型</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">贵宾厅名称</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">预约日期/时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vipBookings.map((b) => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-blue-600 bg-blue-50">
                              <Plane size={12} />
                              VIP厅
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{b.loungeName}</td>
                          <td className="py-3 px-4 text-gray-600">{b.bookingDate} {b.bookingTime}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={b.status as any} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openTrackDialog(b.id, b.loungeName)}
                                className="text-union-red text-xs font-medium hover:underline flex items-center gap-1"
                              >
                                <Eye size={12} />
                                查看追踪
                              </button>
                              {b.status === "confirmed" && (
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="text-gray-500 text-xs font-medium hover:text-red-600 flex items-center gap-1"
                                >
                                  <XCircle size={12} />
                                  取消预约
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "train" && (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-5">
              <TrainFront size={22} className="text-union-red" />
              <h2 className="text-xl font-bold">火车票优先购票</h2>
            </div>

            <div className="card mb-6">
              <h4 className="font-bold mb-4">提交购票申请</h4>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">出发站</label>
                  <input
                    type="text"
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                    placeholder="如：南京南"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">到达站</label>
                  <input
                    type="text"
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                    placeholder="如：上海虹桥"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">出行日期</label>
                  <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="input-field" />
                </div>
                <button onClick={handleTrainRequest} className="btn-primary flex items-center gap-2">
                  <Send size={16} />
                  提交申请
                </button>
              </div>
              {trainMsg && (
                <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {trainMsg}
                </p>
              )}
              {showTrainTimeline && (
                <div className="mt-5 p-4 bg-union-red/5 rounded-lg border border-union-red/10">
                  <p className="text-sm font-medium text-union-red mb-3 flex items-center gap-2">
                    <Info size={14} />
                    申请审批流程
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {[
                      { label: "申请已提交", done: true },
                      { label: "等待工会复核", done: true },
                      { label: "优先通道出票", done: false },
                      { label: "出票完成", done: false },
                    ].map((step, idx, arr) => (
                      <div key={step.label} className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium",
                          step.done ? "bg-union-red text-white" : "bg-gray-200 text-gray-500"
                        )}>
                          {step.done ? <CheckCircle2 size={12} /> : idx + 1}
                        </div>
                        <span className={step.done ? "text-gray-900 font-medium" : "text-gray-500"}>{step.label}</span>
                        {idx < arr.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTrainTimeline(false)}
                    className="mt-3 text-xs text-gray-500 hover:text-union-red"
                  >
                    收起
                  </button>
                </div>
              )}
            </div>

            {trainRequests.length > 0 && (
              <div className="card">
                <h4 className="font-bold mb-4">我的购票申请</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">申请时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">路线</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">票类型</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">预计出发时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">审批进度</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainRequests.map((req) => (
                        <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-600">{req.createdAt ? req.createdAt.slice(0, 10) : "-"}</td>
                          <td className="py-3 px-4 font-medium">{req.trainInfo}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">二等座</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{req.travelDate}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    req.status === "confirmed" ? "bg-green-500 w-full" : req.status === "pending" ? "bg-union-red w-1/2" : "bg-gray-300 w-1/4"
                                  )}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {req.status === "confirmed" ? "已完成" : req.status === "pending" ? "50%" : "待提交"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openTrackDialog(req.id, req.trainInfo)}
                                className="text-union-red text-xs font-medium hover:underline flex items-center gap-1"
                              >
                                <Eye size={12} />
                                查看审批追踪
                              </button>
                              {req.status === "pending" && isAdmin && (
                                <button
                                  onClick={() => handleApproveTrain(req.id)}
                                  className="text-union-red text-xs font-medium hover:underline"
                                >
                                  审批通过
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "records" && (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-5">
              <FileText size={22} className="text-union-red" />
              <h2 className="text-xl font-bold">我的预约记录</h2>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">预约类型</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">服务名称</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">预约日期/时间</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          暂无预约记录
                        </td>
                      </tr>
                    ) : (
                      allBookings.map((b) => {
                        const typeCfg = typeLabels[b.type] || { label: b.type, icon: Info, color: "text-gray-600 bg-gray-50" };
                        const TypeIcon = typeCfg.icon;
                        return (
                          <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium", typeCfg.color)}>
                                <TypeIcon size={12} />
                                {typeCfg.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">{b.resourceName}</td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                {b.bookingDate}
                                {b.bookingTime && (
                                  <>
                                    <Clock size={12} className="text-gray-400 ml-1" />
                                    {b.bookingTime}
                                  </>
                                )}
                              </div>
                              {b.expectedWaitTime && (
                                <p className="text-xs text-orange-600 mt-1">预计处理时间：{b.expectedWaitTime}</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={b.status as any} />
                              {b.remarks && (
                                <p className="text-xs text-orange-600 mt-1">{b.remarks}</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 flex-wrap">
                                <button
                                  onClick={() => openTrackDialog(b.id, b.resourceName)}
                                  className="text-union-red text-xs font-medium hover:underline flex items-center gap-1"
                                >
                                  <Eye size={12} />
                                  查看追踪
                                </button>
                                {(b.status === "pending" || b.status === "confirmed") && (
                                  <button
                                    onClick={() => handleCancelBooking(b.id)}
                                    className="text-gray-500 text-xs font-medium hover:text-red-600 flex items-center gap-1"
                                  >
                                    <XCircle size={12} />
                                    取消预约
                                  </button>
                                )}
                                {b.status === "pending" && isAdmin && (
                                  <button
                                    onClick={() => handleApproveTrain(b.id)}
                                    className="text-union-red text-xs font-medium hover:underline flex items-center gap-1"
                                  >
                                    <CheckCircle size={12} />
                                    审批通过
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <AlertOctagon size={22} className="text-union-red" />
                <h2 className="text-xl font-bold">异常追踪中心</h2>
              </div>
              <button
                onClick={loadExceptions}
                className="text-sm text-union-red hover:underline flex items-center gap-1"
              >
                <RotateCcw size={14} />
                刷新
              </button>
            </div>

            <div className="card mb-6">
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={exceptionSearch}
                    onChange={(e) => setExceptionSearch(e.target.value)}
                    placeholder="搜索异常标题或描述..."
                    className="input-field pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "全部" },
                    { key: "pending", label: "待处理" },
                    { key: "processing", label: "处理中" },
                    { key: "resolved", label: "已解决" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setExceptionFilter(f.key)}
                      className={cn(
                        "px-4 py-2 text-sm rounded-lg font-medium transition-all",
                        exceptionFilter === f.key
                          ? "bg-union-red text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredExceptions.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  暂无异常记录
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExceptions.map((e) => {
                    const typeCfg = exceptionTypeLabels[e.type];
                    return (
                      <div
                        key={e.id}
                        className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow bg-gradient-to-r from-white to-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", typeCfg.color)}>
                              {typeCfg.label}
                            </span>
                            <h4 className="font-bold text-gray-900">{e.title}</h4>
                          </div>
                          <StatusBadge
                            status={
                              e.currentStatus === "待处理"
                                ? "pending"
                                : e.currentStatus === "处理中"
                                ? "executing"
                                : "completed"
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{e.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              发生时间：{e.occurredAt}
                            </span>
                            {e.expectedHours && (
                              <span className="text-orange-600 font-medium">
                                预计{e.expectedHours}小时内处理
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                              <RefreshCw size={12} />
                              立即处理
                            </button>
                            <button className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                              <MessageCircle size={12} />
                              联系客服
                            </button>
                            <button className="text-xs py-1.5 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                              忽略
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {trackDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">审批追踪 - {trackBookingName}</h3>
              <button
                onClick={() => setTrackDialogOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              <div className="relative">
                {trackData.map((stage, idx) => (
                <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                  {idx < trackData.length - 1 && (
                    <div className={cn(
                      "absolute left-[11px] top-6 w-0.5 h-full",
                      stage.status === "done" ? "bg-union-red/30" : "bg-gray-200"
                    )} />
                  )}
                  <div className={cn(
                    "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center",
                    stage.status === "done"
                      ? "bg-union-red text-white"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  )}>
                    {stage.status === "done" ? <CheckCircle2 size={14} /> : <Circle size={10} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        stage.status === "done" ? "text-gray-900" : "text-gray-500"
                      )}>
                        {stage.stage}
                      </h4>
                      {stage.time && (
                        <span className="text-xs text-gray-400">{stage.time.slice(0, 16)}</span>
                      )}
                    </div>
                    {stage.operator && (
                      <p className="text-xs text-gray-500 mb-1">操作人：{stage.operator}</p>
                    )}
                    {stage.remark && (
                      <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mt-1">
                        {stage.remark}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setTrackDialogOpen(false)}
                className="btn-primary text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
