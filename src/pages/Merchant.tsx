import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Storefront, CheckCircle, CreditCard, Barcode, QrCode, Wallet,
  X, Bluetooth, WifiHigh, CellSignalX, CaretDown, Plus,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Terminal {
  id: string; terminalNo: string; nfcPairCode: string;
  beaconUUID: string; location: string; lastHeartbeat: string; isOnline: boolean;
}

interface MerchantItem {
  id: string; name: string; type: "offline_pos" | "online_ecom";
  status: "active" | "inactive";
  posCount: number; todayVerified: number; totalRevenue: string;
  settlementCycle: string; terminals: Terminal[];
}

const merchants: MerchantItem[] = [
  { id: "1", name: "万达广场", type: "offline_pos", status: "active", posCount: 12, todayVerified: 347, totalRevenue: "¥2,845,600", settlementCycle: "T+1", terminals: [
    { id: "t1", terminalNo: "POS-WD-001", nfcPairCode: "NFC-A7F2", beaconUUID: "B980-4F2A-C1D3", location: "1F中庭", lastHeartbeat: "2分钟前", isOnline: true },
    { id: "t2", terminalNo: "POS-WD-002", nfcPairCode: "NFC-B3E1", beaconUUID: "B980-4F2A-C1D4", location: "3F餐饮区", lastHeartbeat: "5分钟前", isOnline: true },
    { id: "t3", terminalNo: "POS-WD-003", nfcPairCode: "NFC-C5D9", beaconUUID: "B980-4F2A-C1D5", location: "B1超市", lastHeartbeat: "3小时前", isOnline: false },
  ]},
  { id: "2", name: "盒马鲜生", type: "offline_pos", status: "active", posCount: 8, todayVerified: 521, totalRevenue: "¥1,932,400", settlementCycle: "T+1", terminals: [
    { id: "t4", terminalNo: "POS-HM-001", nfcPairCode: "NFC-D2F4", beaconUUID: "BA12-5E3B-D2C6", location: "收银台A", lastHeartbeat: "1分钟前", isOnline: true },
    { id: "t5", terminalNo: "POS-HM-002", nfcPairCode: "NFC-E8A6", beaconUUID: "BA12-5E3B-D2C7", location: "收银台B", lastHeartbeat: "30秒前", isOnline: true },
  ]},
  { id: "3", name: "京东商城", type: "online_ecom", status: "active", posCount: 0, todayVerified: 1893, totalRevenue: "¥5,124,800", settlementCycle: "T+3", terminals: [] },
  { id: "4", name: "瑞幸咖啡", type: "offline_pos", status: "active", posCount: 24, todayVerified: 862, totalRevenue: "¥967,200", settlementCycle: "T+1", terminals: [
    { id: "t6", terminalNo: "POS-LK-001", nfcPairCode: "NFC-F1B3", beaconUUID: "BC34-6F4C-E3D7", location: "国贸店", lastHeartbeat: "10秒前", isOnline: true },
  ]},
  { id: "5", name: "美团闪购", type: "online_ecom", status: "active", posCount: 0, todayVerified: 2104, totalRevenue: "¥3,456,900", settlementCycle: "T+3", terminals: [] },
  { id: "6", name: "永辉超市", type: "offline_pos", status: "inactive", posCount: 6, todayVerified: 0, totalRevenue: "¥768,300", settlementCycle: "T+1", terminals: [
    { id: "t7", terminalNo: "POS-YH-001", nfcPairCode: "NFC-G4C5", beaconUUID: "BD56-7A5D-F4E8", location: "朝阳店", lastHeartbeat: "2天前", isOnline: false },
  ]},
  { id: "7", name: "拼多多", type: "online_ecom", status: "active", posCount: 0, todayVerified: 4321, totalRevenue: "¥8,921,500", settlementCycle: "T+5", terminals: [] },
  { id: "8", name: "全家便利", type: "offline_pos", status: "inactive", posCount: 3, todayVerified: 0, totalRevenue: "¥234,100", settlementCycle: "T+1", terminals: [] },
];

const typeConfig = {
  offline_pos: { label: "线下POS", color: "bg-bank/15 text-bank border-bank/30" },
  online_ecom: { label: "线上电商", color: "bg-telecom/15 text-telecom border-telecom/30" },
};

const statusConfig = {
  active: { label: "活跃", color: "text-insurance", bg: "bg-insurance/15", border: "border-insurance/30" },
  inactive: { label: "停用", color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30" },
};

const couponTypes = [
  { key: "qrcode", label: "二维码", icon: QrCode },
  { key: "barcode", label: "条码", icon: Barcode },
  { key: "encrypted", label: "加密码", icon: CreditCard },
];

export default function Merchant() {
  const [expandedTerminal, setExpandedTerminal] = useState<string | null>(null);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(100);
  const [couponType, setCouponType] = useState("qrcode");
  const [validDays, setValidDays] = useState(30);
  const [settlementCycle, setSettlementCycle] = useState("T+1");

  const toggleTerminal = (id: string) => setExpandedTerminal(expandedTerminal === id ? null : id);
  const toggleCoupon = (id: string) => setExpandedCoupon(expandedCoupon === id ? null : id);

  const overviewCards = [
    { icon: Storefront, label: "商户总数", value: "86", sub: "较上月 +5", color: "text-gold-300" },
    { icon: CheckCircle, label: "活跃商户", value: "72", sub: "占比 83.7%", color: "text-insurance" },
    { icon: CreditCard, label: "POS终端", value: "53", sub: "在线 47", color: "text-bank" },
    { icon: Barcode, label: "今日核销", value: "10,048", sub: "环比 +12.3%", color: "text-telecom" },
    { icon: QrCode, label: "券码生成", value: "128,500", sub: "本月累计", color: "text-gold-300" },
    { icon: Wallet, label: "结算金额", value: "¥24.3M", sub: "本月合计", color: "text-gold-300" },
  ];

  const cycleSummary: Record<string, { count: number; amount: string }> = {
    "T+1": { count: 5, amount: "¥6,747,600" },
    "T+3": { count: 2, amount: "¥8,581,700" },
    "T+5": { count: 1, amount: "¥8,921,500" },
  };

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">商户管理</h1>
          <p className="text-gray-400 mt-2 text-sm">线下核销POS对接 · 线上券码生成 · 财务结算</p>
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
              <Storefront size={18} className="text-gold-400" />
              <h3 className="text-sm font-semibold text-gold-100">商户列表</h3>
            </div>
            <button className="btn-gold text-xs flex items-center gap-1.5 py-1.5">
              <Plus size={14} />新增商户
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gold-400/10">
                  <th className="text-left py-3 px-3 font-medium">商户名</th>
                  <th className="text-left py-3 px-3 font-medium">类型</th>
                  <th className="text-left py-3 px-3 font-medium">状态</th>
                  <th className="text-left py-3 px-3 font-medium">POS终端</th>
                  <th className="text-left py-3 px-3 font-medium">今日核销</th>
                  <th className="text-left py-3 px-3 font-medium">累计收入</th>
                  <th className="text-left py-3 px-3 font-medium">结算周期</th>
                  <th className="text-left py-3 px-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => {
                  const tc = typeConfig[m.type];
                  const sc = statusConfig[m.status];
                  return (
                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: "rgba(201,169,98,0.04)" }} className="border-b border-gold-400/5">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center">
                            <Storefront size={14} className="text-gold-300" />
                          </div>
                          <span className="font-medium text-gray-100">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${tc.color}`}>{tc.label}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${sc.bg} ${sc.color} ${sc.border}`}>{sc.label}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">{m.posCount}</td>
                      <td className="py-3 px-3 font-mono text-insurance">{m.todayVerified.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-gold-300">{m.totalRevenue}</td>
                      <td className="py-3 px-3 text-gray-400">{m.settlementCycle}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button onClick={() => toggleTerminal(m.id)} className={cn("p-1.5 rounded hover:bg-gold-400/10 transition-colors", expandedTerminal === m.id ? "text-gold-300" : "text-gray-400 hover:text-gold-300")} title="终端">
                            <CreditCard size={14} />
                          </button>
                          <button onClick={() => toggleCoupon(m.id)} className={cn("p-1.5 rounded hover:bg-gold-400/10 transition-colors", expandedCoupon === m.id ? "text-gold-300" : "text-gray-400 hover:text-gold-300")} title="券码">
                            <QrCode size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {expandedTerminal && (() => {
              const m = merchants.find(x => x.id === expandedTerminal);
              if (!m) return null;
              return (
                <motion.div key={`term-${m.id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="divider-line my-4" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-gold-400" />
                      <span className="text-sm font-semibold text-gold-100">{m.name} — POS终端配置</span>
                    </div>
                    <button onClick={() => setExpandedTerminal(null)} className="p-1 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gray-200"><X size={16} /></button>
                  </div>
                  {m.terminals.length === 0 ? (
                    <div className="text-gray-500 text-xs py-4 text-center">该商户无POS终端</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {m.terminals.map(t => (
                        <div key={t.id} className="p-3 rounded-lg bg-space-800/50 border border-gold-400/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-200">{t.terminalNo}</span>
                            <span className={cn("w-2 h-2 rounded-full", t.isOnline ? "bg-insurance shadow-[0_0_6px_rgba(59,130,246,0.6)]" : "bg-gray-500")} />
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <span className="text-gray-500 flex items-center gap-1"><WifiHigh size={10} /> NFC</span>
                            <span className="font-mono text-gray-300">{t.nfcPairCode}</span>
                            <span className="text-gray-500 flex items-center gap-1"><Bluetooth size={10} /> 蓝牙</span>
                            <span className="font-mono text-gray-300">{t.beaconUUID}</span>
                            <span className="text-gray-500 flex items-center gap-1"><CellSignalX size={10} /> 位置</span>
                            <span className="text-gray-300">{t.location}</span>
                            <span className="text-gray-500">心跳</span>
                            <span className={cn(t.isOnline ? "text-insurance" : "text-warn")}>{t.lastHeartbeat}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <AnimatePresence>
            {expandedCoupon && (() => {
              const m = merchants.find(x => x.id === expandedCoupon);
              if (!m) return null;
              return (
                <motion.div key={`coupon-${m.id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="divider-line my-4" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode size={16} className="text-gold-400" />
                      <span className="text-sm font-semibold text-gold-100">{m.name} — 券码生成</span>
                    </div>
                    <button onClick={() => setExpandedCoupon(null)} className="p-1 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gray-200"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-2">批次大小</div>
                      <div className="flex gap-2">
                        {[100, 500, 1000].map(s => (
                          <button key={s} onClick={() => setBatchSize(s)} className={cn("px-3 py-1.5 rounded text-xs font-mono border transition-colors", batchSize === s ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-gold-400/10 text-gray-400 hover:border-gold-400/30")}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-2">券码类型</div>
                      <div className="flex gap-2">
                        {couponTypes.map(ct => {
                          const CtIcon = ct.icon;
                          return (
                            <button key={ct.key} onClick={() => setCouponType(ct.key)} className={cn("flex items-center gap-1 px-3 py-1.5 rounded text-xs border transition-colors", couponType === ct.key ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-gold-400/10 text-gray-400 hover:border-gold-400/30")}>
                              <CtIcon size={12} />{ct.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-2">有效期（天）</div>
                      <input type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))} className="input-field w-full py-1.5 text-xs" min={1} max={365} />
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="btn-gold text-xs mt-4 flex items-center gap-1.5 py-2 px-5">
                    <QrCode size={14} />生成券码
                  </motion.button>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-gold-400" />
              <h3 className="text-sm font-semibold text-gold-100">财务结算</h3>
            </div>
            <div className="relative">
              <select value={settlementCycle} onChange={e => setSettlementCycle(e.target.value)} className="input-field pr-8 py-1.5 text-xs appearance-none cursor-pointer">
                <option value="T+1">T+1</option>
                <option value="T+3">T+3</option>
                <option value="T+5">T+5</option>
              </select>
              <CaretDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            {Object.entries(cycleSummary).map(([cycle, data]) => (
              <div key={cycle} className={cn("p-4 rounded-lg border transition-colors", settlementCycle === cycle ? "bg-gold-400/10 border-gold-400/30" : "bg-space-800/30 border-gold-400/5")}>
                <div className="text-xs text-gray-500 mb-1">结算周期 {cycle}</div>
                <div className="text-xl font-bold text-gold-300 font-mono">{data.amount}</div>
                <div className="text-xs text-gray-400 mt-1">{data.count} 个商户</div>
              </div>
            ))}
          </div>

          <div className="divider-line mb-4" />

          <div className="space-y-2">
            {merchants.filter(m => m.settlementCycle === settlementCycle).map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-gold-400/10 flex items-center justify-center">
                    <Storefront size={12} className="text-gold-300" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-200">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.settlementCycle} · 今日 {m.todayVerified.toLocaleString()} 笔</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-gold-300">{m.totalRevenue}</div>
                  <div className="text-xs text-gray-500">累计收入</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
