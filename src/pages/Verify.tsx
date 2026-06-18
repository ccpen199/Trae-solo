import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  CellSignalX,
  Bluetooth,
  CheckCircle,
  XCircle,
  ClockCounterClockwise,
  Copy,
  Check,
  ContactlessPayment,
  CellSignalX as CellSignalFull,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface VerifyRecord {
  id: string;
  orderNo: string;
  couponCode: string;
  mode: "qrcode" | "nfc" | "bluetooth_beacon";
  merchant: string;
  status: "success" | "failed" | "already_used";
  verifiedAt: string;
}

type VerifyMode = "qrcode" | "nfc" | "bluetooth_beacon";

const tabs: { key: VerifyMode; label: string; icon: typeof QrCode }[] = [
  { key: "qrcode", label: "扫码核销", icon: QrCode },
  { key: "nfc", label: "NFC核销", icon: ContactlessPayment },
  { key: "bluetooth_beacon", label: "蓝牙信标", icon: Bluetooth },
];

const COUPON_CODE = "VC-2026-89234-A7F3";

const beacons = [
  { name: "商户A-入口", uuid: "B9407F30-F5F8-466E-AFF9-25556B57FE6D", distance: "2.3m", strength: 92 },
  { name: "商户B-柜台", uuid: "C8108A20-D6E9-477F-BB0A-3AA67C48FD1E", distance: "5.1m", strength: 68 },
  { name: "商户C-出口", uuid: "A7205C10-E4F7-456E-CC1B-2BB58D39GE2F", distance: "12.7m", strength: 31 },
];

const records: VerifyRecord[] = [
  { id: "1", orderNo: "ORD-20260618-001", couponCode: "VC-2026-89234-A7F3", mode: "qrcode", merchant: "平安保险", status: "success", verifiedAt: "2026-06-18 14:32:05" },
  { id: "2", orderNo: "ORD-20260618-002", couponCode: "VC-2026-89234-B8E4", mode: "nfc", merchant: "招商银行", status: "success", verifiedAt: "2026-06-18 13:18:22" },
  { id: "3", orderNo: "ORD-20260618-003", couponCode: "VC-2026-89234-C9D5", mode: "bluetooth_beacon", merchant: "中国东方航空", status: "already_used", verifiedAt: "2026-06-18 11:45:10" },
  { id: "4", orderNo: "ORD-20260618-004", couponCode: "VC-2026-89234-D2F6", mode: "qrcode", merchant: "中国电信", status: "failed", verifiedAt: "2026-06-18 10:22:37" },
  { id: "5", orderNo: "ORD-20260617-005", couponCode: "VC-2026-89234-E3A7", mode: "nfc", merchant: "星巴克咖啡", status: "success", verifiedAt: "2026-06-17 18:55:43" },
  { id: "6", orderNo: "ORD-20260617-006", couponCode: "VC-2026-89234-F4B8", mode: "bluetooth_beacon", merchant: "支付宝", status: "success", verifiedAt: "2026-06-17 16:30:19" },
  { id: "7", orderNo: "ORD-20260617-007", couponCode: "VC-2026-89234-G5C9", mode: "qrcode", merchant: "平安保险", status: "success", verifiedAt: "2026-06-17 09:12:58" },
];

const modeIcon = { qrcode: QrCode, nfc: ContactlessPayment, bluetooth_beacon: Bluetooth };
const statusConfig = {
  success: { label: "成功", color: "text-insurance", bg: "bg-insurance/15" },
  failed: { label: "失败", color: "text-risk", bg: "bg-risk/15" },
  already_used: { label: "已使用", color: "text-warn", bg: "bg-warn/15" },
};

export default function Verify() {
  const [activeTab, setActiveTab] = useState<VerifyMode>("qrcode");
  const [manualCode, setManualCode] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [nfcTriggered, setContactlessPaymentTriggered] = useState<"idle" | "success" | "failed">("idle");
  const [copied, setCopied] = useState(false);

  const handleVerify = () => {
    setVerifySuccess(true);
    setTimeout(() => setVerifySuccess(false), 2500);
  };

  const handleContactlessPaymentTrigger = () => {
    setContactlessPaymentTriggered("success");
    setTimeout(() => setContactlessPaymentTriggered("idle"), 3000);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">核销中心</h1>
          <p className="text-gray-400 mt-2 text-sm">多模态权益核销 · 扫码 / NFC / 蓝牙信标</p>
        </motion.div>

        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="flex gap-2 mb-5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setVerifySuccess(false); setContactlessPaymentTriggered("idle"); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === tab.key
                          ? "bg-gold-400/15 text-gold-300 border border-gold-400/30"
                          : "text-gray-400 border border-transparent hover:text-gray-200 hover:bg-space-700/40"
                      )}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "qrcode" && (
                  <motion.div key="qr" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col items-center">
                    <div className="relative p-4 bg-white rounded-xl">
                      <QRCodeSVG value={COUPON_CODE} size={200} bgColor="#ffffff" fgColor="#0A1628" level="H" />
                      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-insurance to-transparent animate-scan opacity-80" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="font-mono text-lg text-gold-300 tracking-wider">{COUPON_CODE}</span>
                      <button onClick={handleCopy} className="p-1 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gold-300 transition-colors">
                        {copied ? <Check size={14} className="text-insurance" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="w-full max-w-sm mt-5">
                      <input
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="手动输入券码..."
                        className="input-field w-full text-sm font-mono text-center"
                      />
                    </div>
                    <div className="relative mt-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVerify} className="btn-gold px-8 py-2.5 text-sm">
                        确认核销
                      </motion.button>
                      {verifySuccess && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0.8 }}
                          animate={{ scale: 4, opacity: 0 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute inset-0 m-auto w-10 h-10 rounded-full border-2 border-insurance"
                        />
                      )}
                      {verifySuccess && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-insurance text-sm font-medium">
                          <CheckCircle size={16} weight="fill" /> 核销成功
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "nfc" && (
                  <motion.div key="nfc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col items-center py-6">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full border-2 border-gold-400/40"
                        />
                      ))}
                      <div className="relative w-16 h-16 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center">
                        <ContactlessPayment size={28} className="text-gold-300" />
                      </div>
                    </div>
                    <p className={cn("mt-4 text-sm", nfcTriggered === "success" ? "text-insurance" : nfcTriggered === "failed" ? "text-risk" : "text-gray-400")}>
                      {nfcTriggered === "success" ? "NFC核销成功！" : nfcTriggered === "failed" ? "NFC核销失败" : "等待NFC近场触发..."}
                    </p>
                    <div className="mt-3 px-4 py-2 rounded-lg bg-space-800/60 border border-gold-400/10 font-mono text-sm text-gold-200">
                      配对码: NFC-7F2A-91C4
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleContactlessPaymentTrigger} className="btn-ghost mt-5 px-6 py-2 text-sm flex items-center gap-2">
                      <CellSignalX size={15} /> 模拟NFC触发
                    </motion.button>
                    {nfcTriggered === "success" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-insurance/15 border border-insurance/30 text-insurance text-sm">
                        <CheckCircle size={16} weight="fill" /> 权益已核销
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === "bluetooth_beacon" && (
                  <motion.div key="bt" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <div className="flex items-center justify-center gap-3 mb-4 py-3">
                      {[0.6, 0.8, 1].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ scaleY: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          style={{ transformOrigin: "bottom" }}
                          className="w-3 bg-telecom/60 rounded-full"
                          children={<div className={cn("rounded-full", i === 0 ? "h-4" : i === 1 ? "h-7" : "h-10")} />}
                        />
                      ))}
                      <span className="ml-2 text-telecom text-sm font-medium">信号搜索中</span>
                    </div>
                    <div className="mb-3 px-3 py-2 rounded-lg bg-space-800/50 border border-gold-400/10 font-mono text-xs text-gray-300">
                      信标UUID: B9407F30-F5F8-466E-AFF9-25556B57FE6D
                    </div>
                    <div className="text-xs text-gray-400 mb-2">附近信标</div>
                    <div className="space-y-2">
                      {beacons.map((b) => (
                        <div key={b.uuid} className="flex items-center justify-between p-3 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-telecom/15 flex items-center justify-center">
                              <Bluetooth size={14} className="text-telecom" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-200">{b.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{b.uuid.slice(0, 18)}...</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono text-gold-300">{b.distance}</div>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <CellSignalFull size={10} className={b.strength > 70 ? "text-insurance" : b.strength > 40 ? "text-warn" : "text-risk"} />
                              <span className="text-[10px] text-gray-500">{b.strength}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClockCounterClockwise size={18} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-gold-100">核销记录</h3>
              </div>
              <div className="space-y-2">
                {records.map((r, i) => {
                  const sc = statusConfig[r.status];
                  const ModeIcon = modeIcon[r.mode];
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-space-800/30 border border-gold-400/5 hover:border-gold-400/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-space-700/50 flex items-center justify-center">
                          <ModeIcon size={14} className="text-gold-400" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-200">{r.merchant}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{r.couponCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]", sc.bg, sc.color)}>
                          {r.status === "success" ? <CheckCircle size={9} weight="fill" /> : r.status === "failed" ? <XCircle size={9} weight="fill" /> : <ClockCounterClockwise size={9} />}
                          {sc.label}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-1">{r.verifiedAt.slice(5)}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
