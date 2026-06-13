import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Phone,
  QrCode,
  X,
  FileText,
  TrendingUp,
  Package,
  Calendar,
  AlertTriangle,
  Star,
  Handshake,
  Clock,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";

type TabKey = "all" | "protocol" | "high_freq" | "churn_warning";

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "all", label: "全部客户", icon: Users },
  { key: "protocol", label: "协议客户", icon: Handshake },
  { key: "high_freq", label: "高频客户", icon: Star },
  { key: "churn_warning", label: "流失预警", icon: AlertTriangle },
];

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400_000);
}

export default function Customers() {
  const customers = useAppStore((s) => s.customers);
  const orders = useAppStore((s) => s.orders);
  const bindCustomer = useAppStore((s) => s.bindCustomer);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [bindPhone, setBindPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (activeTab === "protocol") {
      list = list.filter((c) => c.isProtocol);
    } else if (activeTab === "high_freq") {
      list = list.filter((c) => c.repurchaseRate >= 0.5 || c.totalOrders >= 30);
    } else if (activeTab === "churn_warning") {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((c) => daysBetween(c.lastOrderDate, today) >= 7);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(kw) || c.phone.includes(kw)
      );
    }
    return list;
  }, [customers, activeTab, searchKeyword]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders
      .filter((o) => o.customerId === selectedCustomer.id || o.sender.phone === selectedCustomer.phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [selectedCustomer, orders]);

  const trendOption = useMemo(() => {
    const days = 14;
    const dates: string[] = [];
    const counts: number[] = [];
    const amounts: number[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
      if (selectedCustomer) {
        const dayOrders = orders.filter(
          (o) =>
            (o.customerId === selectedCustomer.id || o.sender.phone === selectedCustomer.phone) &&
            o.createdAt.slice(0, 10) === dateStr
        );
        counts.push(dayOrders.length);
        amounts.push(+dayOrders.reduce((s, o) => s + o.price, 0).toFixed(2));
      } else {
        counts.push(0);
        amounts.push(0);
      }
    }
    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1A2332",
        borderColor: "#252C45",
        textStyle: { color: "#E8EAF0", fontSize: 12 },
      },
      legend: {
        data: ["订单数", "订单金额"],
        textStyle: { color: "#6B7390", fontSize: 12 },
        top: 0,
        right: 0,
      },
      grid: { left: 40, right: 20, top: 40, bottom: 24 },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: "#C8CCDB" } },
        axisLabel: { color: "#6B7390", fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "订单",
          axisLine: { show: false },
          axisLabel: { color: "#6B7390", fontSize: 11 },
          splitLine: { lineStyle: { color: "#E8EAF0", type: "dashed" } },
        },
        {
          type: "value",
          name: "金额",
          axisLine: { show: false },
          axisLabel: { color: "#6B7390", fontSize: 11, formatter: "¥{value}" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "订单数",
          type: "line",
          data: counts,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#FF6B35", width: 2 },
          itemStyle: { color: "#FF6B35" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255,107,53,0.25)" },
                { offset: 1, color: "rgba(255,107,53,0)" },
              ],
            },
          },
        },
        {
          name: "订单金额",
          type: "line",
          yAxisIndex: 1,
          data: amounts,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#22C55E", width: 2 },
          itemStyle: { color: "#22C55E" },
        },
      ],
    };
  }, [selectedCustomer, orders]);

  function handleBind() {
    if (!/^1\d{10}$/.test(bindPhone)) return;
    bindCustomer(bindPhone);
    setBindPhone("");
  }

  function getProtocolDaysLeft(c: Customer) {
    if (!c.protocolInfo) return null;
    return daysBetween(new Date().toISOString().slice(0, 10), c.protocolInfo.expireDate);
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl2 bg-gradient-to-br from-ember-500 to-ember-600 flex items-center justify-center shadow-glow">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">客户关系管理</h1>
            <p className="text-sm text-ink-400">客户档案、协议管理与复购分析</p>
          </div>
        </div>
      </div>

      <div className="app-card p-2">
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-ember-500 to-ember-400 text-white shadow-sm"
                    : "text-ink-500 hover:text-ink-700 hover:bg-ink-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-xs",
                  active ? "bg-white/20" : "bg-ink-100 text-ink-500"
                )}>
                  {t.key === "all" && customers.length}
                  {t.key === "protocol" && customers.filter((c) => c.isProtocol).length}
                  {t.key === "high_freq" && customers.filter((c) => c.repurchaseRate >= 0.5 || c.totalOrders >= 30).length}
                  {t.key === "churn_warning" && customers.filter((c) => daysBetween(c.lastOrderDate, new Date().toISOString().slice(0, 10)) >= 7).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="app-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索客户姓名或手机号"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Phone className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="输入手机号绑定新客户"
                value={bindPhone}
                onChange={(e) => setBindPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="input w-56 pl-9 pr-24"
              />
              <button
                onClick={handleBind}
                disabled={!/^1\d{10}$/.test(bindPhone)}
                className={cn(
                  "absolute right-1 top-1 bottom-1 px-3 rounded-md text-xs font-medium transition-all",
                  /^1\d{10}$/.test(bindPhone)
                    ? "bg-ember-500 text-white hover:bg-ember-600"
                    : "bg-ink-100 text-ink-400 cursor-not-allowed"
                )}
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                绑定
              </button>
            </div>
            <button className="btn-outline">
              <QrCode className="w-4 h-4" />
              扫码绑定
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-4 gap-3">
          {filteredCustomers.map((c) => {
            const daysLeft = getProtocolDaysLeft(c);
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30;
            const churnDays = daysBetween(c.lastOrderDate, new Date().toISOString().slice(0, 10));
            const isChurnRisk = churnDays >= 7;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="app-card app-card-hover p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ink-800 to-ink-600 flex items-center justify-center text-white font-bold text-lg">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-800">{c.name}</h3>
                      <p className="text-xs text-ink-400 font-mono">{c.phone}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300" />
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      复购率
                    </span>
                    <span className="text-xs font-semibold text-ember-600">
                      {(c.repurchaseRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ember-400 to-ember-500 rounded-full"
                      style={{ width: `${Math.min(c.repurchaseRate * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {c.isProtocol && (
                    <span className="chip bg-ember-50 text-ember-600">
                      <Handshake className="w-3 h-3" />
                      协议客户
                    </span>
                  )}
                  {c.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="chip bg-ink-100 text-ink-600">
                      {tag}
                    </span>
                  ))}
                  {isExpiringSoon && (
                    <span className="chip bg-alert-50 text-alert-600">
                      <AlertTriangle className="w-3 h-3" />
                      {daysLeft}天后到期
                    </span>
                  )}
                  {isChurnRisk && (
                    <span className="chip bg-ink-800 text-white">
                      <Clock className="w-3 h-3" />
                      {churnDays}天未下单
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ink-100">
                  <div>
                    <div className="text-xs text-ink-400 mb-0.5">累计订单</div>
                    <div className="text-lg font-bold font-display text-ink-800">
                      {c.totalOrders}
                      <span className="text-xs font-normal text-ink-400 ml-0.5">单</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400 mb-0.5">累计金额</div>
                    <div className="text-lg font-bold font-display text-ink-800">
                      ¥{c.totalAmount.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="col-span-4 text-center py-16 text-ink-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无符合条件的客户</p>
            </div>
          )}
        </div>
      </div>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" />
          <div
            className="relative ml-auto w-[520px] h-full bg-white shadow-xl flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-ink-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ember-500 to-ember-600 flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink-900">{selectedCustomer.name}</h2>
                  <p className="text-sm text-ink-400 font-mono">{selectedCustomer.phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCustomer.isProtocol && (
                      <span className="chip bg-ember-50 text-ember-600 text-xs">
                        <Handshake className="w-3 h-3" />
                        协议客户
                      </span>
                    )}
                    {selectedCustomer.tags.map((t) => (
                      <span key={t} className="chip bg-ink-100 text-ink-600 text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-400 hover:text-ink-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
              {selectedCustomer.protocolInfo && (
                <div className="app-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-ember-500" />
                    <h3 className="section-title !mb-0">协议档案</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-ink-400 mb-1">合同编号</div>
                      <div className="font-mono text-ink-700">{selectedCustomer.protocolInfo.contractNo}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-400 mb-1">结算周期</div>
                      <div className="text-ink-700">
                        {selectedCustomer.protocolInfo.settlementCycle === "daily" && "日结"}
                        {selectedCustomer.protocolInfo.settlementCycle === "weekly" && "周结"}
                        {selectedCustomer.protocolInfo.settlementCycle === "monthly" && "月结"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-ink-400 mb-1">服务范围</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomer.protocolInfo.serviceScope.map((s) => (
                          <span key={s} className="chip bg-ink-50 text-ink-600">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-ink-400 mb-1">协议价格</div>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(selectedCustomer.protocolInfo.priceAgreement).map(([k, v]) => (
                          <div key={k} className="text-center p-2 bg-ink-50 rounded-lg">
                            <div className="text-xs text-ink-400">{k}</div>
                            <div className="font-semibold text-ember-600">¥{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-ink-400 mb-1">到期日期</div>
                      <div className={cn(
                        "flex items-center gap-2",
                        getProtocolDaysLeft(selectedCustomer)! <= 30 ? "text-alert-600" : "text-ink-700"
                      )}>
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedCustomer.protocolInfo.expireDate)}
                        {getProtocolDaysLeft(selectedCustomer)! <= 30 && (
                          <span className="chip bg-alert-50 text-alert-600">
                            <AlertTriangle className="w-3 h-3" />
                            {getProtocolDaysLeft(selectedCustomer)}天后到期
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="app-card p-4">
                  <div className="text-xs text-ink-400 mb-1">累计订单</div>
                  <div className="text-2xl font-bold font-display text-ink-800">
                    {selectedCustomer.totalOrders}
                    <span className="text-xs font-normal text-ink-400 ml-1">单</span>
                  </div>
                </div>
                <div className="app-card p-4">
                  <div className="text-xs text-ink-400 mb-1">累计金额</div>
                  <div className="text-2xl font-bold font-display text-ember-600">
                    ¥{selectedCustomer.totalAmount.toFixed(0)}
                  </div>
                </div>
                <div className="app-card p-4">
                  <div className="text-xs text-ink-400 mb-1">复购率</div>
                  <div className="text-2xl font-bold font-display text-mint-600">
                    {(selectedCustomer.repurchaseRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="app-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-ember-500" />
                  <h3 className="section-title !mb-0">复购趋势（近14天）</h3>
                </div>
                <ReactECharts
                  option={trendOption}
                  style={{ height: 220 }}
                  opts={{ renderer: "canvas" }}
                />
              </div>

              <div className="app-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-ember-500" />
                  <h3 className="section-title !mb-0">
                    最近订单
                    <span className="text-xs text-ink-400 font-normal ml-2">
                      共 {customerOrders.length} 条
                    </span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {customerOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-xl border border-ink-100 hover:bg-ink-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs text-ink-600">{o.orderNo}</span>
                        <span className="chip bg-ink-100 text-ink-600 text-xs">
                          {o.expressCompany}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-ink-700">{o.receiver.name}</span>
                          <span className="text-ink-400 mx-1.5">→</span>
                          <span className="text-ink-500 text-xs">
                            {o.receiver.city}{o.receiver.district}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-ember-600 text-sm">¥{o.price}</div>
                          <div className="text-xs text-ink-400">{formatTime(o.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {customerOrders.length === 0 && (
                    <div className="text-center py-8 text-ink-400 text-sm">
                      暂无订单记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
