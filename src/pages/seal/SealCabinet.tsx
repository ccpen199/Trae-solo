import { useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  Play,
  Unlock,
  CheckCircle,
  Building2,
  Wallet,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, formatDate, getSealTypeLabel, generateId } from "@/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { SealType, UnlockRecord } from "@/types";

const sealSlots = [
  { type: "official" as const, label: "公章", color: "bg-rose-500", glow: "shadow-rose-500/50", icon: <Building2 className="w-8 h-8" />, custodian: "张明华" },
  { type: "finance" as const, label: "财务专用章", color: "bg-emerald-500", glow: "shadow-emerald-500/50", icon: <Wallet className="w-8 h-8" />, custodian: "李建国" },
  { type: "contract" as const, label: "合同专用章", color: "bg-trust-500", glow: "shadow-trust-500/50", icon: <FileSignature className="w-8 h-8" />, custodian: "王芳" },
];

const mockRecords: (UnlockRecord & { operatorName: string })[] = [
  { id: "1", applicationId: "seal002", sealType: "finance", unlockTime: "2025-06-17 09:55", operator: "u001", operatorName: "张明华", videoUrl: "#" },
  { id: "2", applicationId: "seal003", sealType: "contract", unlockTime: "2025-06-15 14:30", returnTime: "2025-06-15 17:45", operator: "u001", operatorName: "张明华", videoUrl: "#" },
  { id: "3", applicationId: "seal004", sealType: "official", unlockTime: "2025-06-14 10:00", returnTime: "2025-06-14 11:30", operator: "u002", operatorName: "李建国", videoUrl: "#" },
];

export default function SealCabinet() {
  const navigate = useNavigate();
  const { sealApplications, updateSealApplication } = useAppStore();
  const [unlockingSlot, setUnlockingSlot] = useState<SealType | null>(null);
  const [openingSlot, setOpeningSlot] = useState<SealType | null>(null);

  const inUseApps = sealApplications.filter((a) => a.status === "in_use");
  const getStatus = (t: SealType) => (inUseApps.some((a) => a.sealType === t) ? "in_use" : "in_cabinet");
  const getInUse = (t: SealType) => inUseApps.find((a) => a.sealType === t);
  const getTodayCount = (t: SealType) => {
    const today = formatDate(new Date(), "YYYY-MM-DD");
    return sealApplications.filter((a) => a.sealType === t && a.unlockTime && formatDate(a.unlockTime, "YYYY-MM-DD") === today).length;
  };

  const handleUnlock = async (type: SealType) => {
    if (inUseApps.find((a) => a.sealType === type)) return;
    const app = sealApplications.find((a) => a.sealType === type && a.status === "approved");
    if (!app) return;

    setUnlockingSlot(type);
    await new Promise((r) => setTimeout(r, 1000));
    updateSealApplication(app.id, { status: "in_use", unlockTime: new Date().toISOString(), unlockRecordId: generateId() });
    setOpeningSlot(type);
    setUnlockingSlot(null);
    await new Promise((r) => setTimeout(r, 800));
    setOpeningSlot(null);
  };

  const handleReturn = (type: SealType) => {
    const app = getInUse(type);
    if (!app) return;
    updateSealApplication(app.id, { status: "returned", returnTime: new Date().toISOString() });
  };

  const StatusDot = ({ status }: { status: "in_cabinet" | "in_use" }) => (
    <span
      className={cn("w-2.5 h-2.5 rounded-full", status === "in_cabinet" ? "bg-emerald-400 animate-pulse" : "bg-amber-400")}
      style={{ boxShadow: status === "in_cabinet" ? "0 0 8px rgba(52, 211, 153, 0.8)" : "0 0 8px rgba(251, 191, 36, 0.8)" }}
    />
  );

  const SealSlot = ({ slot, index }: { slot: typeof sealSlots[0]; index: number }) => {
    const status = getStatus(slot.type);
    const isUnlocking = unlockingSlot === slot.type;
    const isOpening = openingSlot === slot.type;
    const inUseApp = getInUse(slot.type);
    const hasApproved = sealApplications.some((a) => a.sealType === slot.type && a.status === "approved");

    return (
      <m.div key={slot.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }} className="relative">
        <div className={cn("relative rounded-xl p-4 border-2 transition-all duration-300", status === "in_cabinet" ? "border-white/20 bg-black/30" : cn("border-white/40 bg-black/50", slot.glow, "shadow-lg"))}>
          <AnimatePresence mode="wait">
            {isOpening ? (
              <m.div
                key="opening"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -90 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="bg-gradient-to-b from-slate-600 to-slate-800 rounded-lg p-4 text-center"
                style={{ transformOrigin: "left center" }}
              >
                <div className="text-white/50 text-2xl">🔒</div>
              </m.div>
            ) : (
              <m.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3", slot.color, "text-white shadow-lg", status === "in_cabinet" && "opacity-60")}>
                  {slot.icon}
                </div>
                <div className="text-white font-medium mb-1">{slot.label}</div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <StatusDot status={status} />
                  <span className={cn("text-xs", status === "in_cabinet" ? "text-emerald-400" : "text-amber-400")}>
                    {status === "in_cabinet" ? "在柜" : "借出"}
                  </span>
                </div>
                {isUnlocking ? (
                  <div className="flex items-center justify-center gap-2 text-trust-400 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>开锁中...</span>
                  </div>
                ) : status === "in_use" && inUseApp ? (
                  <Button size="sm" variant="primary" leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => handleReturn(slot.type)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    归还
                  </Button>
                ) : (
                  <Button size="sm" leftIcon={<Unlock className="w-3.5 h-3.5" />} onClick={() => handleUnlock(slot.type)} disabled={!hasApproved} className="w-full">
                    开锁
                  </Button>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    );
  };

  const StatusCard = ({ slot, index }: { slot: typeof sealSlots[0]; index: number }) => {
    const status = getStatus(slot.type);
    const inUseApp = getInUse(slot.type);
    const todayCount = getTodayCount(slot.type);

    return (
      <m.div key={slot.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-xl", slot.color, "text-white")}>{slot.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-800">{slot.label}</h3>
                  <Badge variant={status === "in_cabinet" ? "success" : "warning"} dot size="sm">
                    {status === "in_cabinet" ? "在柜" : "借出"}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500 mb-2">保管人：{slot.custodian}</div>
                <div className="text-sm text-slate-500">
                  今日使用：<span className="font-medium text-slate-700 ml-1">{todayCount} 次</span>
                </div>
                {inUseApp && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">使用人：{inUseApp.applicantName}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </m.div>
    );
  };

  const TimelineItem = ({ record, index }: { record: typeof mockRecords[0]; index: number }) => {
    const slot = sealSlots.find((s) => s.type === record.sealType);
    const typeInfo = getSealTypeLabel(record.sealType);

    return (
      <m.div
        key={record.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
        className="relative pl-10"
      >
        <div
          className={cn("absolute left-2 w-5 h-5 rounded-full border-2 border-white", slot?.color, record.returnTime ? "bg-emerald-500" : "bg-amber-500")}
          style={{ boxShadow: record.returnTime ? "0 0 8px rgba(52, 211, 153, 0.6)" : "0 0 8px rgba(251, 191, 36, 0.6)" }}
        />
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={record.sealType === "official" ? "primary" : record.sealType === "finance" ? "success" : "info"} size="sm">
              {typeInfo.label}
            </Badge>
            <Badge variant={record.returnTime ? "success" : "warning"} dot size="sm">
              {record.returnTime ? "已归还" : "使用中"}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(record.unlockTime, "YYYY-MM-DD HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>{record.operatorName}</span>
            </div>
          </div>
          <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm text-slate-700 transition-colors">
            <Play className="w-3.5 h-3.5" />
            <span>录像回放</span>
          </button>
          {record.returnTime && (
            <div className="mt-2 text-xs text-slate-400 text-center">归还时间：{formatDate(record.returnTime, "YYYY-MM-DD HH:mm")}</div>
          )}
        </div>
      </m.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <button onClick={() => navigate("/seal/applications")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>返回申请列表</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">印章柜监控</h1>
          <p className="text-slate-500">实时监控印章状态，确保安全管控</p>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card>
                <CardContent className="p-8">
                  <div
                    className="relative p-8 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(145deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)",
                      boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                      }}
                    />
                    <h2 className="text-center text-white/90 font-semibold mb-6 text-lg">智能印章柜</h2>
                    <div className="grid grid-cols-3 gap-6 relative z-10">
                      {sealSlots.map((slot, i) => (
                        <SealSlot key={slot.type} slot={slot} index={i} />
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-6">
                      {["in_cabinet", "借出", "异常"].map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                          <span
                            className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-emerald-400 animate-pulse" : i === 1 ? "bg-amber-400" : "bg-rose-400 animate-pulse")}
                          />
                          <span className="text-white/70 text-sm">{label === "in_cabinet" ? "在柜" : label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sealSlots.map((slot, i) => (
                <StatusCard key={slot.type} slot={slot} index={i} />
              ))}
            </div>
          </div>

          <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">开锁记录</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-6">
                    {mockRecords.map((record, i) => (
                      <TimelineItem key={record.id} record={record} index={i} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>
      </div>
    </div>
  );
}
