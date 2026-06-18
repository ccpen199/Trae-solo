import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsClockwise,
  CurrencyDollar,
  ShieldCheck,
  Rocket,
  FileText,
  MapPin,
  Hash,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Plus,
  Trash,
  Code,
  TreeStructure,
} from "@phosphor-icons/react";

type TabKey = "rules" | "evidence";
type RuleKey = "split_combine" | "cash_stack" | "ar_aid";

interface RuleNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  active: boolean;
}

interface EvidenceItem {
  id: string;
  title: string;
  type: string;
  publisher: string;
  geoFence: string;
  status: "pending" | "published" | "rejected";
  hash: string;
  time: string;
}

const rulesList: { key: RuleKey; icon: React.ElementType; label: string; desc: string }[] = [
  { key: "split_combine", icon: ArrowsClockwise, label: "积分拆分", desc: "多权益拆分组合规则" },
  { key: "cash_stack", icon: CurrencyDollar, label: "现金叠加", desc: "多渠道现金权益叠加" },
  { key: "ar_aid", icon: ShieldCheck, label: "互助规则", desc: "AR场景互助触发条件" },
];

const evidenceData: EvidenceItem[] = [
  { id: "1", title: "机场延误互助凭证", type: "航空延误", publisher: "东方航空", geoFence: "浦东机场T2", status: "published", hash: "0x7a3f...e91c", time: "2026-06-15 14:32" },
  { id: "2", title: "暴雨天气出行互助", type: "天气灾害", publisher: "平安保险", geoFence: "上海市浦东新区", status: "pending", hash: "0x4b2d...a74f", time: "2026-06-16 09:15" },
  { id: "3", title: "地铁延误互助存证", type: "交通出行", publisher: "上海地铁", geoFence: "地铁2号线", status: "rejected", hash: "0x9c8e...12ab", time: "2026-06-14 18:47" },
  { id: "4", title: "演唱会现场互助", type: "活动保障", publisher: "大麦网", geoFence: "梅赛德斯奔驰文化中心", status: "published", hash: "0x2f1a...67c5", time: "2026-06-13 20:08" },
  { id: "5", title: "景区人流互助预警", type: "公共安全", publisher: "迪士尼乐园", geoFence: "上海迪士尼度假区", status: "pending", hash: "0xd4e9...3310", time: "2026-06-16 11:22" },
];

const initialNodes: { [key in RuleKey]: RuleNode[] } = {
  split_combine: [
    { id: "in1", type: "input", label: "积分池A", x: 80, y: 80, active: true },
    { id: "in2", type: "input", label: "积分池B", x: 80, y: 200, active: true },
    { id: "op", type: "operator", label: "拆分引擎", x: 280, y: 140, active: true },
    { id: "out1", type: "output", label: "权益X", x: 480, y: 80, active: true },
    { id: "out2", type: "output", label: "权益Y", x: 480, y: 200, active: false },
  ],
  cash_stack: [
    { id: "in1", type: "input", label: "银行补贴", x: 80, y: 60, active: true },
    { id: "in2", type: "input", label: "商家返现", x: 80, y: 160, active: true },
    { id: "in3", type: "input", label: "平台红包", x: 80, y: 260, active: true },
    { id: "op", type: "operator", label: "叠加计算", x: 280, y: 160, active: true },
    { id: "out", type: "output", label: "兑付总额", x: 480, y: 160, active: true },
  ],
  ar_aid: [
    { id: "in1", type: "input", label: "AR触发", x: 80, y: 80, active: true },
    { id: "in2", type: "input", label: "位置校验", x: 80, y: 200, active: true },
    { id: "op", type: "operator", label: "条件判断", x: 280, y: 140, active: true },
    { id: "out", type: "output", label: "互助启动", x: 480, y: 140, active: true },
  ],
};

const statusConfig = {
  pending: { label: "待审核", color: "text-warn", bg: "bg-warn/15", icon: ClockIcon, border: "border-warn/30" },
  published: { label: "已发布", color: "text-insurance", bg: "bg-insurance/15", icon: CheckCircle, border: "border-insurance/30" },
  rejected: { label: "已拒绝", color: "text-risk", bg: "bg-risk/15", icon: XCircle, border: "border-risk/30" },
};

function getNodeColor(type: string, active: boolean) {
  const colors: Record<string, { fill: string; border: string; glow: string }> = {
    input: { fill: "rgba(59,130,246,0.18)", border: active ? "#3B82F6" : "rgba(59,130,246,0.4)", glow: "rgba(59,130,246,0.5)" },
    operator: { fill: "rgba(201,169,98,0.18)", border: active ? "#C9A962" : "rgba(201,169,98,0.4)", glow: "rgba(201,169,98,0.5)" },
    output: { fill: active ? "rgba(16,185,129,0.18)" : "rgba(107,114,128,0.18)", border: active ? "#10B981" : "rgba(107,114,128,0.5)", glow: active ? "rgba(16,185,129,0.5)" : "rgba(107,114,128,0.3)" },
  };
  return colors[type] || colors.input;
}

export default function Contract() {
  const [activeTab, setActiveTab] = useState<TabKey>("rules");
  const [selectedRule, setSelectedRule] = useState<RuleKey>("split_combine");
  const nodes = initialNodes[selectedRule];

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">智能合约中心</h1>
          <p className="text-gray-400 mt-2 text-sm">可视化规则编排 · 链上部署 · AR互助存证管理</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {(["rules", "evidence"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-gold-400/20 to-gold-500/20 text-gold-100 border border-gold-400/40"
                  : "bg-space-800/60 text-gray-400 border border-gold-400/10 hover:text-gray-200 hover:border-gold-400/25"
              }`}
            >
              {tab === "rules" ? "规则引擎" : "AR互助存证"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "rules" ? (
            <motion.div key="rules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="grid grid-cols-12 gap-5">
              <div className="col-span-3">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gold-100">规则列表</h3>
                    <button className="text-gold-400 hover:text-gold-200 transition-colors"><Plus size={18} /></button>
                  </div>
                  <div className="space-y-2">
                    {rulesList.map((rule) => {
                      const Icon = rule.icon;
                      const isActive = selectedRule === rule.key;
                      return (
                        <motion.button
                          key={rule.key}
                          onClick={() => setSelectedRule(rule.key)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-3 rounded-lg text-left transition-all relative overflow-hidden ${
                            isActive ? "bg-gradient-to-r from-gold-400/15 to-gold-500/5 border border-gold-400/40" : "bg-space-800/40 border border-gold-400/10 hover:border-gold-400/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isActive ? "rgba(201,169,98,0.2)" : "rgba(30,58,95,0.6)" }}>
                              <Icon size={18} className={isActive ? "text-gold-300" : "text-gray-400"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${isActive ? "text-gold-100" : "text-gray-200"}`}>{rule.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{rule.desc}</div>
                            </div>
                          </div>
                          {isActive && <motion.div layoutId="ruleIndicator" className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-300 to-gold-500" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card p-4 mt-4">
                  <h3 className="text-sm font-semibold text-gold-100 mb-3">图例说明</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: "rgba(59,130,246,0.4)", border: "1px solid #3B82F6" }} />
                      <span className="text-gray-400">输入节点</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: "rgba(201,169,98,0.4)", border: "1px solid #C9A962" }} />
                      <span className="text-gray-400">处理节点</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: "rgba(16,185,129,0.4)", border: "1px solid #10B981" }} />
                      <span className="text-gray-400">输出节点</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-9">
                <div className="glass-card p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TreeStructure size={18} className="text-gold-400" />
                      <h3 className="text-sm font-semibold text-gold-100">{rulesList.find((r) => r.key === selectedRule)?.label}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs flex items-center gap-1.5 py-1.5"><Trash size={14} />清空</button>
                      <button className="btn-ghost text-xs flex items-center gap-1.5 py-1.5"><Code size={14} />查看代码</button>
                    </div>
                  </div>

                  <div className="flex-1 relative rounded-lg overflow-hidden border border-gold-400/10" style={{ background: "linear-gradient(135deg, rgba(10,22,40,0.6) 0%, rgba(15,39,68,0.4) 100%)", minHeight: "420px" }}>
                    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(201,169,98,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

                    <svg className="absolute inset-0 w-full h-full">
                      {nodes.map((node, i) => {
                        const nextNodes = nodes.filter((n) => n.id !== node.id);
                        if (!nextNodes.length) return null;
                        const target = nextNodes[Math.min(i, nextNodes.length - 1)];
                        const x1 = node.x + 140;
                        const y1 = node.y + 30;
                        const x2 = target.x;
                        const y2 = target.y + 30;
                        const midX = (x1 + x2) / 2;
                        const isActive = node.active && target.active;
                        const pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                        return (
                          <g key={`line-${node.id}-${target.id}`}>
                            <path d={pathD} fill="none" stroke={isActive ? "#C9A962" : "rgba(107,114,128,0.4)"} strokeWidth="2" strokeDasharray={isActive ? "0" : "6 4"} opacity={isActive ? 1 : 0.5} />
                            {isActive && (
                              <motion.circle r="4" fill="#F4E8C8" style={{ filter: "drop-shadow(0 0 6px rgba(201,169,98,0.8))" }}>
                                <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
                              </motion.circle>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {nodes.map((node) => {
                      const colors = getNodeColor(node.type, node.active);
                      return (
                        <motion.div key={node.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute" style={{ left: node.x, top: node.y }}>
                          <div className="relative" style={{ width: "140px", padding: "12px 14px", borderRadius: "10px", background: colors.fill, border: `1px solid ${colors.border}`, backdropFilter: "blur(10px)", boxShadow: node.active ? `0 0 24px -4px ${colors.glow}` : "none" }}>
                            {node.active && (
                              <motion.div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${colors.glow}, transparent 70%)`, opacity: 0.35 }} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                            )}
                            <div className="text-xs font-mono opacity-70 mb-1" style={{ color: node.active ? "#C9A962" : "#6B7280" }}>{node.type.toUpperCase()}</div>
                            <div className="font-medium text-sm" style={{ color: node.active ? "#E5E7EB" : "#6B7280" }}>{node.label}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center pt-4 mt-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold flex items-center gap-2 text-sm">
                      <Rocket size={16} />部署到链上
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="evidence" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceData.map((item, index) => {
                  const sc = statusConfig[item.status];
                  const StatusIcon = sc.icon;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }} className="glass-card glass-card-hover p-5 cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gold-400/15 flex items-center justify-center flex-shrink-0"><FileText size={20} className="text-gold-300" /></div>
                          <div>
                            <h4 className="font-semibold text-gray-100">{item.title}</h4>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs bg-gold-400/10 text-gold-300 border border-gold-400/20">{item.type}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color} border ${sc.border}`}>
                          <StatusIcon size={12} />{sc.label}
                        </span>
                      </div>
                      <div className="divider-line my-3" />
                      <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-400"><User size={14} /><span>{item.publisher}</span></div>
                        <div className="flex items-center gap-2 text-gray-400"><MapPin size={14} /><span>{item.geoFence}</span></div>
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-xs"><Hash size={14} /><span className="text-gold-300">{item.hash}</span></div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs"><Clock size={14} /><span>{item.time}</span></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
