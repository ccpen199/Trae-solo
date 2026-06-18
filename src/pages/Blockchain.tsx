import { useState } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Copy,
  Check,
  ShieldCheck,
  XCircle,
  LinkSimple,
  Cube,
  Fingerprint,
  Signature,
  Clock,
  Hash,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TabKey = "query" | "verify";
type AlgoKey = "RSA-SHA256" | "ECDSA-P256" | "Ed25519";
type VerifyStatus = "idle" | "success" | "fail";

interface ChainRecord {
  blockHeight: number;
  txId: string;
  timestamp: string;
  action: "exchange" | "verify" | "settle" | "ar_mutual_aid";
  participants: string[];
  txHash: string;
  dataHash: string;
}

interface VerifyHistory {
  id: string;
  algo: AlgoKey;
  signer: string;
  result: boolean;
  time: string;
}

const actionConfig: Record<ChainRecord["action"], { label: string; color: string }> = {
  exchange: { label: "权益兑换", color: "bg-gold-400/15 text-gold-300 border-gold-400/30" },
  verify: { label: "存证验证", color: "bg-insurance/15 text-insurance border-insurance/30" },
  settle: { label: "结算确认", color: "bg-bank/15 text-bank border-bank/30" },
  ar_mutual_aid: { label: "AR互助", color: "bg-airline/15 text-airline border-airline/30" },
};

const chainRecords: ChainRecord[] = [
  { blockHeight: 102847, txId: "TX-7F2A-91C4", timestamp: "2026-06-18 14:32:07", action: "exchange", participants: ["平安保险", "招商银行"], txHash: "0x7a3f8b2c9d1e4f6a0b5c7d8e9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0", dataHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" },
  { blockHeight: 102846, txId: "TX-3B8D-44E2", timestamp: "2026-06-18 13:18:42", action: "verify", participants: ["东方航空", "平安保险"], txHash: "0x4b2d7e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8", dataHash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5" },
  { blockHeight: 102845, txId: "TX-A5C1-77F9", timestamp: "2026-06-18 11:05:19", action: "settle", participants: ["招商银行", "中国电信"], txHash: "0x9c8e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a", dataHash: "0x2f1a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b" },
  { blockHeight: 102844, txId: "TX-9E4F-22B6", timestamp: "2026-06-18 09:47:55", action: "ar_mutual_aid", participants: ["东方航空", "平安保险", "招商银行"], txHash: "0x2f1a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c", dataHash: "0xd4e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1" },
  { blockHeight: 102843, txId: "TX-1D6A-55C8", timestamp: "2026-06-17 22:31:08", action: "exchange", participants: ["中国电信", "平安保险"], txHash: "0xd4e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", dataHash: "0x7a3f8b2c9d1e4f6a0b5c7d8e9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" },
  { blockHeight: 102842, txId: "TX-8B3E-66D1", timestamp: "2026-06-17 18:14:33", action: "settle", participants: ["招商银行", "东方航空"], txHash: "0x8b3ea7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9", dataHash: "0x4b2d7e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9" },
];

const recentBlocks = chainRecords.slice(0, 5);

const signAlgos: { key: AlgoKey; label: string }[] = [
  { key: "RSA-SHA256", label: "RSA-SHA256" },
  { key: "ECDSA-P256", label: "ECDSA-P256" },
  { key: "Ed25519", label: "Ed25519" },
];

export default function Blockchain() {
  const [activeTab, setActiveTab] = useState<TabKey>("query");
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState<ChainRecord | null>(null);
  const [copiedField, setCopiedField] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoKey>("RSA-SHA256");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyHistory, setVerifyHistory] = useState<VerifyHistory[]>([
    { id: "1", algo: "RSA-SHA256", signer: "平安保险", result: true, time: "2026-06-18 14:32" },
    { id: "2", algo: "ECDSA-P256", signer: "招商银行", result: true, time: "2026-06-18 11:05" },
    { id: "3", algo: "Ed25519", signer: "东方航空", result: false, time: "2026-06-17 22:31" },
  ]);

  const handleSearch = () => {
    const found = chainRecords.find(
      (r) => r.txId === searchValue || r.txHash.startsWith(searchValue) || searchValue.includes(String(r.blockHeight))
    );
    setSearchResult(found || chainRecords[0]);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleVerify = () => {
    const ok = Math.random() > 0.3;
    setVerifyStatus(ok ? "success" : "fail");
    setVerifyHistory((prev) => [
      { id: String(prev.length + 1), algo: selectedAlgo, signer: "当前用户", result: ok, time: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-") },
      ...prev,
    ]);
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "query", label: "交易哈希查询", icon: MagnifyingGlass },
    { key: "verify", label: "签名验证", icon: Signature },
  ];

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">区块链存证中心</h1>
          <p className="text-gray-400 mt-2 text-sm">Hyperledger Fabric 链上数据查询 · 签名验证 · 存证溯源</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border",
                  activeTab === tab.key
                    ? "bg-gold-400/15 text-gold-200 border-gold-400/30"
                    : "bg-space-800/40 text-gray-400 border-gold-400/5 hover:border-gold-400/20 hover:text-gray-300"
                )}
              >
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "query" && (
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={18} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-gold-100">交易查询</h3>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="输入交易哈希、订单号或区块高度..."
                    className="w-full bg-space-900/80 border border-gold-400/30 rounded-lg px-4 py-3 font-mono text-sm text-green-400 placeholder:text-gray-600 focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono bg-space-800 px-1.5 py-0.5 rounded">FABRIC</span>
                </div>
                <button onClick={handleSearch} className="btn-gold flex items-center gap-2 px-6">
                  <MagnifyingGlass size={16} />查询
                </button>
              </div>
            </motion.div>

            {searchResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cube size={18} className="text-gold-400" />
                  <h3 className="text-sm font-semibold text-gold-100">查询结果</h3>
                  <span className="ml-auto text-xs text-gray-500 font-mono">Hyperledger Fabric v2.5</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-space-800/50 border border-gold-400/5">
                    <div className="text-xs text-gray-500 mb-1">区块高度</div>
                    <div className="text-lg font-bold text-gold-300 font-mono">#{searchResult.blockHeight}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-space-800/50 border border-gold-400/5">
                    <div className="text-xs text-gray-500 mb-1">交易ID</div>
                    <div className="text-lg font-bold text-gold-300 font-mono">{searchResult.txId}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-space-800/50 border border-gold-400/5">
                    <div className="text-xs text-gray-500 mb-1">时间戳</div>
                    <div className="text-sm font-medium text-gray-200 font-mono">{searchResult.timestamp}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">参与方</div>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.participants.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border bg-gold-400/10 text-gold-200 border-gold-400/25">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">交易哈希</span>
                      <button onClick={() => handleCopy(searchResult.txHash, "tx")} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-200 transition-colors">
                        {copiedField === "tx" ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === "tx" ? "已复制" : "复制"}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-space-900/80 border border-gold-400/10 font-mono text-xs text-green-400 break-all">{searchResult.txHash}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">数据载荷哈希</span>
                      <button onClick={() => handleCopy(searchResult.dataHash, "data")} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-200 transition-colors">
                        {copiedField === "data" ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === "data" ? "已复制" : "复制"}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-space-900/80 border border-gold-400/10 font-mono text-xs text-green-400 break-all">{searchResult.dataHash}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-500">操作类型</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${actionConfig[searchResult.action].color}`}>
                    {actionConfig[searchResult.action].label}
                  </span>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <LinkSimple size={18} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-gold-100">最近区块</h3>
              </div>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {recentBlocks.map((block, i) => (
                  <div key={block.blockHeight} className="flex items-center flex-shrink-0">
                    <div className="w-36 p-3 rounded-lg bg-space-800/60 border border-gold-400/15 hover:border-gold-400/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Cube size={12} className="text-gold-400" />
                        <span className="text-xs font-bold text-gold-300 font-mono">#{block.blockHeight}</span>
                      </div>
                      <div className="font-mono text-[10px] text-gray-500 truncate">{block.txHash.slice(0, 18)}...</div>
                      <div className="mt-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${actionConfig[block.action].color}`}>
                          {actionConfig[block.action].label}
                        </span>
                      </div>
                    </div>
                    {i < recentBlocks.length - 1 && (
                      <div className="flex items-center px-1">
                        <div className="w-6 h-px bg-gradient-to-r from-gold-400/40 to-gold-400/10" />
                        <ArrowRight size={12} className="text-gold-400/40 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "verify" && (
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint size={18} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-gold-100">签名验证</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">参与方公钥</label>
                  <textarea rows={3} className="w-full bg-space-900/80 border border-gold-400/15 rounded-lg px-4 py-3 font-mono text-xs text-green-400 placeholder:text-gray-600 focus:outline-none focus:border-gold-400/40 resize-none" placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...&#10;-----END PUBLIC KEY-----" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">签名数据</label>
                  <textarea rows={3} className="w-full bg-space-900/80 border border-gold-400/15 rounded-lg px-4 py-3 font-mono text-xs text-green-400 placeholder:text-gray-600 focus:outline-none focus:border-gold-400/40 resize-none" placeholder="Base64 编码的签名数据..." />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">原始数据</label>
                  <textarea rows={3} className="w-full bg-space-900/80 border border-gold-400/15 rounded-lg px-4 py-3 font-mono text-xs text-green-400 placeholder:text-gray-600 focus:outline-none focus:border-gold-400/40 resize-none" placeholder="原始待验证数据（JSON 或 Hex）..." />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">签名算法</label>
                  <div className="flex gap-2">
                    {signAlgos.map((algo) => (
                      <button
                        key={algo.key}
                        onClick={() => setSelectedAlgo(algo.key)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-mono border transition-all",
                          selectedAlgo === algo.key
                            ? "bg-gold-400/15 text-gold-200 border-gold-400/40"
                            : "bg-space-800/40 text-gray-500 border-gold-400/5 hover:border-gold-400/20 hover:text-gray-300"
                        )}
                      >
                        {algo.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleVerify} className="btn-gold flex items-center gap-2 px-6">
                  <ShieldCheck size={16} />验证签名
                </button>
              </div>

              {verifyStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "mt-4 p-4 rounded-lg border flex items-start gap-3",
                    verifyStatus === "success"
                      ? "bg-insurance/10 border-insurance/30"
                      : "bg-risk/10 border-risk/30"
                  )}
                >
                  {verifyStatus === "success" ? (
                    <CheckCircle size={20} className="text-insurance flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-risk flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={cn("text-sm font-semibold", verifyStatus === "success" ? "text-insurance" : "text-risk")}>
                      {verifyStatus === "success" ? "验证通过" : "验证失败"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {verifyStatus === "success"
                        ? `签名与公钥匹配，数据完整性验证通过。算法: ${selectedAlgo}`
                        : `签名验证不通过，数据可能被篡改或公钥不匹配。算法: ${selectedAlgo}`}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-gold-100">验证历史</h3>
              </div>
              <div className="space-y-2">
                {verifyHistory.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/15 transition-colors">
                    <div className="flex items-center gap-3">
                      {h.result ? (
                        <CheckCircle size={16} className="text-insurance" />
                      ) : (
                        <XCircle size={16} className="text-risk" />
                      )}
                      <div>
                        <div className="text-sm text-gray-200">{h.signer}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{h.algo}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xs px-2 py-0.5 rounded", h.result ? "bg-insurance/15 text-insurance" : "bg-risk/15 text-risk")}>
                        {h.result ? "通过" : "失败"}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{h.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
