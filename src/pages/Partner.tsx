import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle as XCircleIcon,
  Coins,
  Wallet,
  Building,
  Tag,
  Shield,
  Key,
  ChartBar,
  X,
  Copy,
  ArrowsClockwise,
  ClockCounterClockwise,
  Eye,
  EyeSlash,
  Calendar,
  ArrowUpRight,
  Check,
  WarningCircle,
  CaretDown,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Partner {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  status: "active" | "pending" | "paused";
  appId: string;
  profitShare: string;
  settled: string;
  unsettled: string;
  joinedAt: string;
}

interface ReportRow {
  month: string;
  transactions: number;
  amount: string;
  profit: string;
  status: "已结算" | "待结算";
}

interface KeyVersion {
  version: string;
  createdAt: string;
  fingerprint: string;
}

const partners: Partner[] = [
  { id: "1", name: "平安保险", category: "保险", categoryColor: "bg-insurance/15 text-insurance border-insurance/30", status: "active", appId: "APP-7F2A-91C4", profitShare: "15%", settled: "¥128,450", unsettled: "¥23,680", joinedAt: "2025-11-12" },
  { id: "2", name: "招商银行", category: "银行", categoryColor: "bg-bank/15 text-bank border-bank/30", status: "active", appId: "APP-3B8D-44E2", profitShare: "12%", settled: "¥256,900", unsettled: "¥45,200", joinedAt: "2025-09-08" },
  { id: "3", name: "中国东方航空", category: "航空", categoryColor: "bg-airline/15 text-airline border-airline/30", status: "pending", appId: "APP-A5C1-77F9", profitShare: "18%", settled: "¥0", unsettled: "¥12,300", joinedAt: "2026-06-01" },
  { id: "4", name: "中国电信", category: "通信", categoryColor: "bg-telecom/15 text-telecom border-telecom/30", status: "active", appId: "APP-9E4F-22B6", profitShare: "10%", settled: "¥89,720", unsettled: "¥8,940", joinedAt: "2025-10-20" },
  { id: "5", name: "星巴克咖啡", category: "零售", categoryColor: "bg-gold-400/15 text-gold-300 border-gold-400/30", status: "paused", appId: "APP-1D6A-55C8", profitShare: "8%", settled: "¥45,200", unsettled: "¥3,100", joinedAt: "2025-12-15" },
  { id: "6", name: "支付宝", category: "支付", categoryColor: "bg-insurance/15 text-insurance border-insurance/30", status: "active", appId: "APP-8B3E-66D1", profitShare: "5%", settled: "¥512,800", unsettled: "¥78,450", joinedAt: "2025-08-01" },
];

const reportData: ReportRow[] = [
  { month: "2026-01", transactions: 12450, amount: "¥284,500", profit: "¥42,675", status: "已结算" },
  { month: "2026-02", transactions: 9820, amount: "¥215,300", profit: "¥32,295", status: "已结算" },
  { month: "2026-03", transactions: 15670, amount: "¥368,900", profit: "¥55,335", status: "已结算" },
  { month: "2026-04", transactions: 18230, amount: "¥425,600", profit: "¥63,840", status: "已结算" },
  { month: "2026-05", transactions: 21450, amount: "¥512,300", profit: "¥76,845", status: "已结算" },
  { month: "2026-06", transactions: 14380, amount: "¥338,200", profit: "¥50,730", status: "待结算" },
];

const chartData = reportData.map((r) => ({
  name: r.month.slice(5),
  分润: parseInt(r.profit.replace(/[^\d]/g, "")),
}));

const keyVersions: KeyVersion[] = [
  { version: "v3.0", createdAt: "2026-06-10 14:32", fingerprint: "SHA256:7f2a...91c4" },
  { version: "v2.1", createdAt: "2026-03-15 09:18", fingerprint: "SHA256:3b8d...44e2" },
  { version: "v2.0", createdAt: "2026-01-08 16:45", fingerprint: "SHA256:a5c1...77f9" },
];

const statusConfig = {
  active: { label: "活跃", color: "text-insurance", bg: "bg-insurance/15", icon: CheckCircle, border: "border-insurance/30" },
  pending: { label: "待审核", color: "text-warn", bg: "bg-warn/15", icon: Clock, border: "border-warn/30" },
  paused: { label: "已暂停", color: "text-gray-400", bg: "bg-gray-500/15", icon: XCircleIcon, border: "border-gray-500/30" },
};

export default function Partner() {
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportMonth, setReportMonth] = useState("2026-06");

  const openKeyDrawer = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowKeyDrawer(true);
    setShowPrivateKey(false);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const overviewCards = [
    { icon: Users, label: "合作方总数", value: "128", sub: "较上月 +12", color: "text-gold-300" },
    { icon: CheckCircle, label: "活跃", value: "94", sub: "占比 73.4%", color: "text-insurance" },
    { icon: Clock, label: "待审核", value: "18", sub: "需尽快处理", color: "text-warn" },
    { icon: XCircleIcon, label: "已暂停", value: "16", sub: "较上月 -2", color: "text-gray-400" },
    { icon: Coins, label: "本月分润", value: "¥321,680", sub: "环比 +18.5%", color: "text-gold-300" },
    { icon: Wallet, label: "待结算", value: "¥171,670", sub: "6 个结算单", color: "text-bank" },
  ];

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">合作方管理</h1>
          <p className="text-gray-400 mt-2 text-sm">全生命周期合作方管理 · 密钥安全 · 分润结算</p>
        </motion.div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {overviewCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-space-700/50 flex items-center justify-center">
                    <Icon size={18} className={card.color} />
                  </div>
                  <span className="text-xs text-gray-500">{card.sub}</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-100 font-mono">{card.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-gold-400" />
              <h3 className="text-sm font-semibold text-gold-100">合作方列表</h3>
            </div>
            <button className="btn-gold text-xs flex items-center gap-1.5 py-1.5">
              <Users size={14} />新增合作方
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gold-400/10">
                  <th className="text-left py-3 px-3 font-medium">名称</th>
                  <th className="text-left py-3 px-3 font-medium">类别</th>
                  <th className="text-left py-3 px-3 font-medium">状态</th>
                  <th className="text-left py-3 px-3 font-medium">AppID</th>
                  <th className="text-left py-3 px-3 font-medium">分润比例</th>
                  <th className="text-left py-3 px-3 font-medium">已结算</th>
                  <th className="text-left py-3 px-3 font-medium">待结算</th>
                  <th className="text-left py-3 px-3 font-medium">接入时间</th>
                  <th className="text-left py-3 px-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => {
                  const sc = statusConfig[p.status];
                  const StatusIcon = sc.icon;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: "rgba(201,169,98,0.04)" }} className="border-b border-gold-400/5">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center">
                            <Building size={14} className="text-gold-300" />
                          </div>
                          <span className="font-medium text-gray-100">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${p.categoryColor}`}>
                          <Tag size={10} />{p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <StatusIcon size={11} />{sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-gray-300">{p.appId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-gold-300">{p.profitShare}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-insurance">{p.settled}</td>
                      <td className="py-3 px-3 font-mono text-warn">{p.unsettled}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{p.joinedAt}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gold-300 transition-colors" title="配置API">
                            <Shield size={14} />
                          </button>
                          <button onClick={() => openKeyDrawer(p)} className="p-1.5 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gold-300 transition-colors" title="密钥管理">
                            <Key size={14} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gold-300 transition-colors" title="查看报表">
                            <ChartBar size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ChartBar size={18} className="text-gold-400" />
              <h3 className="text-sm font-semibold text-gold-100">分润结算报表</h3>
            </div>
            <div className="relative">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="input-field pr-8 py-1.5 text-xs appearance-none cursor-pointer"
              >
                {reportData.map((r) => (
                  <option key={r.month} value={r.month}>{r.month}</option>
                ))}
              </select>
              <CaretDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-5">
            <div className="col-span-3">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A962" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#C9A962" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,98,0.08)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(201,169,98,0.3)", borderRadius: "8px", color: "#E5E7EB", fontSize: "12px" }}
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, "分润"]}
                      labelStyle={{ color: "#C9A962" }}
                    />
                    <Bar dataKey="分润" fill="url(#goldGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-xs text-gray-400 mb-2">月度明细</div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {reportData.slice().reverse().map((r) => (
                  <div key={r.month} className="flex items-center justify-between p-2 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gold-400" />
                      <span className="text-xs text-gray-300">{r.month}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{r.transactions.toLocaleString()}笔</span>
                      <span className="font-mono text-gold-300">{r.profit}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.status === "已结算" ? "bg-insurance/15 text-insurance" : "bg-warn/15 text-warn"}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="divider-line my-5" />

          <div className="grid grid-cols-5 gap-4">
            {reportData.map((r) => (
              <div key={r.month} className="p-3 rounded-lg bg-space-800/30 border border-gold-400/5">
                <div className="text-xs text-gray-500 mb-1">{r.month}</div>
                <div className="text-lg font-bold text-gold-300 font-mono">{r.profit}</div>
                <div className="text-[10px] text-gray-500 mt-1">{r.transactions.toLocaleString()} 笔交易</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showKeyDrawer && selectedPartner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[480px] bg-gradient-to-b from-space-800 to-space-900 border-l border-gold-400/20 z-50 overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold gold-gradient-text">密钥管理</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedPartner.name}</p>
                  </div>
                  <button onClick={() => setShowKeyDrawer(false)} className="p-1.5 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gray-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-insurance" />
                        <span className="text-sm font-medium text-gray-200">RSA 公钥</span>
                      </div>
                      <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-200 transition-colors">
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? "已复制" : "复制"}
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-space-900/80 border border-gold-400/10 font-mono text-xs text-gold-200 break-all leading-relaxed">
                      -----BEGIN PUBLIC KEY-----<br />
                      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7f2a9c{selectedPartner.appId}...<br />
                      -----END PUBLIC KEY-----
                    </div>
                  </div>

                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-warn" />
                        <span className="text-sm font-medium text-gray-200">RSA 私钥</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                          {showPrivateKey ? <EyeSlash size={12} /> : <Eye size={12} />}
                          {showPrivateKey ? "隐藏" : "显示"}
                        </button>
                        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-200 transition-colors">
                          <Copy size={12} />复制
                        </button>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-space-900/80 border border-warn/20 font-mono text-xs text-warn break-all leading-relaxed">
                      {showPrivateKey ? (
                        <>
                          -----BEGIN PRIVATE KEY-----<br />
                          MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD{selectedPartner.appId}...<br />
                          -----END PRIVATE KEY-----
                        </>
                      ) : (
                        <span className="tracking-widest">•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••</span>
                      )}
                    </div>
                  </div>

                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full btn-gold flex items-center justify-center gap-2">
                    <ArrowsClockwise size={15} />密钥轮换
                  </motion.button>

                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ClockCounterClockwise size={16} className="text-gold-400" />
                      <span className="text-sm font-medium text-gold-100">历史版本</span>
                    </div>
                    <div className="space-y-2">
                      {keyVersions.map((v, i) => (
                        <motion.div key={v.version} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-2.5 rounded-lg bg-space-800/50 border border-gold-400/5">
                          <div>
                            <div className="text-sm font-mono text-gray-200">{v.version}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{v.createdAt}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-gold-300">{v.fingerprint}</div>
                            {i === 0 && (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] bg-insurance/15 text-insurance">
                                <Check size={9} />当前版本
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-warn/10 border border-warn/20 flex items-start gap-2">
                    <WarningCircle size={16} className="text-warn flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-warn/90 leading-relaxed">
                      密钥轮换后旧密钥将在24小时后失效，请及时更新合作方系统配置。
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
