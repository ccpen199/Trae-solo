import { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Truck,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Phone,
  Navigation,
  Layers,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { TrackingEvent, ExpressOrder } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TrackingListItem {
  trackingNo: string;
  order: ExpressOrder | null;
  events: TrackingEvent[];
  hasException: boolean;
}

const statusColorMap: Record<string, string> = {
  picked: "bg-mint-50 text-mint-600",
  departure: "bg-ink-50 text-ink-600",
  arrival: "bg-ink-50 text-ink-600",
  transit: "bg-ember-50 text-ember-600",
  destination: "bg-ink-50 text-ink-600",
  delivering: "bg-ember-50 text-ember-600",
  delivered: "bg-mint-50 text-mint-600",
};

export default function Tracking() {
  const { orders, getTracking } = useAppStore();
  const [inputValue, setInputValue] = useState("");
  const [trackingList, setTrackingList] = useState<TrackingListItem[]>([]);
  const [activeTrackingNo, setActiveTrackingNo] = useState<string | null>(null);

  const mockExceptionOrders = useMemo(() => {
    return orders.filter((o) => o.status === "exception").slice(0, 8);
  }, [orders]);

  const efficiencyData = useMemo(() => {
    return [
      { company: "顺丰速运", hours: 18.5, code: "SF" },
      { company: "京东物流", hours: 22.3, code: "JD" },
      { company: "中通快递", hours: 36.8, code: "ZTO" },
      { company: "圆通速递", hours: 41.2, code: "YTO" },
      { company: "申通快递", hours: 45.6, code: "STO" },
      { company: "韵达速递", hours: 39.4, code: "YD" },
      { company: "极兔速递", hours: 48.1, code: "JT" },
      { company: "邮政EMS", hours: 52.3, code: "EMS" },
    ];
  }, []);

  const barColors = ["#1A2332", "#FF6B35", "#35C276", "#EF4444", "#47506D", "#FF7B3D", "#22C55E", "#DC2626"];

  const activeItem = trackingList.find((t) => t.trackingNo === activeTrackingNo) || trackingList[0];

  const handleSearch = () => {
    const numbers = inputValue
      .split(/[,，\s\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numbers.length === 0) return;

    const newItems: TrackingListItem[] = numbers.map((no) => {
      const matchedOrder = orders.find((o) => o.trackingNo === no) || null;
      let events = getTracking(no);

      if (no.includes("EX") || no.endsWith("8")) {
        events = events.map((e, i) =>
          i === 3
            ? { ...e, isException: true, description: "包裹破损，待人工处理", status: "异常件" }
            : e
        );
      }

      const hasException = events.some((e) => e.isException);
      return { trackingNo: no, order: matchedOrder, events, hasException };
    });

    setTrackingList(newItems);
    setActiveTrackingNo(newItems[0]?.trackingNo || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleExceptionClick = (trackingNo: string) => {
    setInputValue(trackingNo);
    const matchedOrder = orders.find((o) => o.trackingNo === trackingNo) || null;
    let events = getTracking(trackingNo);
    events = events.map((e, i) =>
      i === 3
        ? { ...e, isException: true, description: "包裹破损，待人工处理", status: "异常件" }
        : e
    );
    const hasException = events.some((e) => e.isException);
    const item: TrackingListItem = { trackingNo, order: matchedOrder, events, hasException };
    setTrackingList([item]);
    setActiveTrackingNo(trackingNo);
  };

  const sortedEvents = activeItem ? [...activeItem.events].reverse() : [];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-800 font-display">物流轨迹聚合</h1>
        <p className="text-sm text-ink-400 mt-1">支持运单轨迹查询、异常预警与各快递公司时效分析</p>
      </div>

      <div className="app-card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              className="input pl-11 py-2.5"
              placeholder="输入运单号，多个单号用逗号或空格分隔（示例：SF123456789, JD987654321）"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="btn-primary px-6 py-2.5" onClick={handleSearch}>
            <Search size={16} />
            批量查询
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-400">
          <span>快速测试单号：</span>
          {["SF12345678", "JD98765432", "ZTO55667788", "EX00011122"].map((n) => (
            <button
              key={n}
              className="px-2 py-0.5 rounded-md border border-ink-200 hover:border-ember-400 hover:text-ember-600 transition-colors"
              onClick={() => setInputValue(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <div className="app-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                <Layers size={16} className="text-ember-500" />
                运单列表
                {trackingList.length > 0 && (
                  <span className="chip bg-ink-50 text-ink-500">{trackingList.length}</span>
                )}
              </h3>
            </div>

            <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
              {trackingList.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-ink-50 text-ink-300 flex items-center justify-center mx-auto mb-3">
                    <Package size={22} />
                  </div>
                  <p className="text-sm text-ink-400">输入运单号后，查询结果将显示在此处</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-50">
                  {trackingList.map((item) => (
                    <button
                      key={item.trackingNo}
                      onClick={() => setActiveTrackingNo(item.trackingNo)}
                      className={cn(
                        "w-full text-left px-5 py-3.5 transition-all flex items-center gap-3",
                        activeTrackingNo === item.trackingNo
                          ? "bg-ember-50/60"
                          : "hover:bg-ink-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.hasException
                            ? "bg-alert-50 text-alert-500"
                            : "bg-ink-50 text-ink-500"
                        )}
                      >
                        {item.hasException ? <AlertTriangle size={18} /> : <Truck size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink-800 font-mono truncate">
                            {item.trackingNo}
                          </span>
                          {item.hasException && (
                            <span className="chip bg-alert-50 text-alert-600 text-[10px]">
                              <AlertTriangle size={10} /> 异常
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-400 mt-0.5 truncate">
                          {item.order
                            ? `${item.order.expressCompany} · ${item.order.sender.name} → ${item.order.receiver.name}`
                            : item.events[item.events.length - 1]?.status || "查询中..."}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-ink-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="app-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-alert-500" />
                异常预警
                <span className="chip bg-alert-50 text-alert-600">{mockExceptionOrders.length}</span>
              </h3>
            </div>

            <div className="max-h-[320px] overflow-y-auto scrollbar-thin divide-y divide-ink-50">
              {mockExceptionOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => handleExceptionClick(o.trackingNo)}
                  className="w-full text-left px-5 py-3 hover:bg-alert-50/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ink-800 font-mono">{o.trackingNo}</span>
                    <span className="chip bg-alert-50 text-alert-600 text-[10px]">
                      <AlertTriangle size={10} /> 异常件
                    </span>
                  </div>
                  <div className="text-xs text-ink-500">
                    {o.expressCompany} · {o.sender.name} → {o.receiver.name}
                  </div>
                  <div className="text-xs text-alert-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    包裹状态异常，请及时处理
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="app-card p-5">
            {!activeItem ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-ink-50 text-ink-300 flex items-center justify-center mx-auto mb-4">
                  <MapPin size={26} />
                </div>
                <p className="text-sm text-ink-400">选择左侧运单查看轨迹详情</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-ink-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-ink-800 font-mono">{activeItem.trackingNo}</h2>
                      {activeItem.hasException ? (
                        <span className="chip bg-alert-50 text-alert-600">
                          <AlertTriangle size={12} /> 异常件
                        </span>
                      ) : (
                        <span className={cn(
                          "chip",
                          statusColorMap[sortedEvents[0]?.statusCode] || "bg-ink-50 text-ink-600"
                        )}>
                          <CheckCircle2 size={12} />
                          {sortedEvents[0]?.status || "运输中"}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-ink-500">
                      {activeItem.order ? (
                        <span className="font-medium text-ink-700">{activeItem.order.expressCompany}</span>
                      ) : (
                        "快递公司信息"
                      )}
                      <span className="mx-2 text-ink-300">|</span>
                      共 {activeItem.events.length} 条轨迹记录
                    </div>
                  </div>

                  {activeItem.order && (
                    <div className="flex gap-6 text-sm">
                      <div>
                        <div className="text-ink-400 text-xs mb-1 flex items-center gap-1">
                          <User size={11} /> 发件人
                        </div>
                        <div className="font-medium text-ink-800">{activeItem.order.sender.name}</div>
                        <div className="text-ink-500 text-xs mt-0.5 max-w-[180px] truncate" title={activeItem.order.sender.address}>
                          {activeItem.order.sender.address}
                        </div>
                      </div>
                      <div className="text-ember-500 pt-4">
                        <ChevronRight size={18} />
                      </div>
                      <div>
                        <div className="text-ink-400 text-xs mb-1 flex items-center gap-1">
                          <Navigation size={11} /> 收件人
                        </div>
                        <div className="font-medium text-ink-800">{activeItem.order.receiver.name}</div>
                        <div className="text-ink-500 text-xs mt-0.5 max-w-[180px] truncate" title={activeItem.order.receiver.address}>
                          {activeItem.order.receiver.address}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-ember-500" />
                    运输轨迹
                  </h3>

                  <div className="relative pl-2">
                    {sortedEvents.map((event, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === sortedEvents.length - 1;
                      return (
                        <div key={event.id} className="relative flex gap-4 pb-6">
                          {!isLast && (
                            <div
                              className={cn(
                                "absolute left-[15px] top-8 w-0.5 h-[calc(100%-24px)]",
                                event.isException ? "bg-alert-200" : "bg-ink-100"
                              )}
                            />
                          )}
                          <div
                            className={cn(
                              "relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                              isFirst && !event.isException
                                ? "bg-ember-500 text-white ring-4 ring-ember-100"
                                : event.isException
                                ? "bg-alert-500 text-white ring-4 ring-alert-100"
                                : "bg-ink-100 text-ink-400"
                            )}
                          >
                            {event.isException ? (
                              <AlertTriangle size={14} />
                            ) : isFirst ? (
                              <Navigation size={14} />
                            ) : (
                              <MapPin size={14} />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex flex-wrap items-baseline gap-3 mb-1">
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  event.isException ? "text-alert-600" : "text-ink-800"
                                )}
                              >
                                {event.status}
                              </span>
                              <span className="text-xs text-ink-400 font-mono">
                                {event.timestamp && format(new Date(event.timestamp), "yyyy-MM-dd HH:mm:ss")}
                              </span>
                              {event.isException && (
                                <span className="chip bg-alert-50 text-alert-600 text-[10px]">
                                  异常
                                </span>
                              )}
                            </div>
                            <div
                              className={cn(
                                "text-sm",
                                event.isException ? "text-alert-600" : "text-ink-600"
                              )}
                            >
                              {event.description}
                            </div>
                            <div className="text-xs text-ink-400 mt-1 flex items-center gap-2">
                              <MapPin size={11} />
                              {event.location}
                              <span className="text-ink-200">|</span>
                              <Phone size={11} />
                              {event.operator}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                <Zap size={16} className="text-ember-500" />
                时效分析
              </h3>
              <span className="text-xs text-ink-400">各快递公司平均配送时效对比（单位：小时）</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {efficiencyData.slice(0, 4).map((item, idx) => (
                <div
                  key={item.code}
                  className="p-4 rounded-xl bg-ink-50/60 border border-ink-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: barColors[idx] }}
                    >
                      {item.code.slice(0, 2)}
                    </div>
                    <span className="text-xs font-medium text-ink-600 truncate">{item.company}</span>
                  </div>
                  <div className="text-2xl font-bold text-ink-800 font-display">
                    {item.hours}
                    <span className="text-xs font-normal text-ink-400 ml-1">小时</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
                  <XAxis
                    dataKey="company"
                    tick={{ fontSize: 11, fill: "#6B7390" }}
                    axisLine={{ stroke: "#E8EAF0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7390" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E8EAF0",
                      boxShadow: "0 4px 16px rgba(15,22,33,0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} 小时`, "平均时效"]}
                    cursor={{ fill: "rgba(255,107,53,0.06)" }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {efficiencyData.map((_, idx) => (
                      <Cell key={idx} fill={barColors[idx]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
