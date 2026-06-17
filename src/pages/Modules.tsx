import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { ElementType, ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  Gift,
  HandCoins,
  PackageOpen,
  Receipt,
  ShieldCheck,
  Shield,
  Stamp,
  Store,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  Paperclip,
  History,
  Vote,
  Eye,
  Hash,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores";
import { cn, formatDate, getMotionStatusLabel, getSealStatusLabel, getTicketStatusLabel, formatPercent } from "@/utils";

import FinanceOverview from "@/pages/finance/FinanceOverview";
import InvoiceList from "@/pages/finance/InvoiceList";
import AuditReport from "@/pages/finance/AuditReport";
import SealApplicationList from "@/pages/seal/SealApplicationList";
import NewSealApplication from "@/pages/seal/NewSealApplication";
import SealCabinet from "@/pages/seal/SealCabinet";
import TicketList from "@/pages/property/TicketList";
import TicketDetail from "@/pages/property/TicketDetail";
import SupervisionCenter from "@/pages/property/SupervisionCenter";
import EconomyHome from "@/pages/economy/EconomyHome";
import SwapMarket from "@/pages/economy/SwapMarket";
import CrowdfundingList from "@/pages/economy/CrowdfundingList";
import EnergyExchange from "@/pages/economy/EnergyExchange";
import OwnerList from "@/pages/admin/OwnerList";
import CouncilManagement from "@/pages/admin/CouncilManagement";
import PropertyCompany from "@/pages/admin/PropertyCompany";
import StreetSupervision from "@/pages/admin/StreetSupervision";
import { Modal, Badge, Button, ProgressBar } from "@/components/ui";

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  tone?: "primary" | "emerald" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    primary: "bg-primary-50 text-primary-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-card">
      <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export function FinanceOverviewPage() { return <FinanceOverview />; }
export function InvoicePage() { return <InvoiceList />; }
export function AuditReportPage() { return <AuditReport />; }
export function SealApplicationsPage() { return <SealApplicationList />; }
export function NewSealApplicationPage() { return <NewSealApplication />; }
export function SealCabinetPage() { return <SealCabinet />; }
export function PropertyTicketsPage() { return <TicketList />; }
export function PropertyTicketDetailPage() { return <TicketDetail />; }
export function SupervisionPage() { return <SupervisionCenter />; }
export function EconomyHomePage() { return <EconomyHome />; }
export function SwapPage() { return <SwapMarket />; }
export function CrowdfundingPage() { return <CrowdfundingList />; }
export function ExchangePage() { return <EnergyExchange />; }
export function AdminOwnersPage() { return <OwnerList />; }
export function AdminCouncilPage() { return <CouncilManagement />; }
export function AdminPropertyPage() { return <PropertyCompany />; }
export function AdminStreetPage() { return <StreetSupervision />; }

export function MotionOverviewPage() {
  const { motions } = useAppStore();
  const [motionModal, setMotionModal] = useState<{ type: "attachment" | "chain" | "review" | null; data: any; title: string; }>(null);
  const [copied, setMotionCopied] = useState(false);

  return (
    <PageShell title="民主议事概览" description="议案公示、投票进度和表决结果概览。">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="议案总数" value={motions.length} icon={FileText} tone="primary" />
        <StatCard label="投票中" value={motions.filter((m) => m.status === "voting").length} icon={CheckCircle2} tone="emerald" />
        <StatCard label="公示中" value={motions.filter((m) => m.status === "publicity").length} icon={ClipboardList} tone="amber" />
        <StatCard label="已通过" value={motions.filter((m) => m.status === "passed").length} icon={ShieldCheck} tone="slate" />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-800">最近议案</h2>
          <Link to="/council/motions" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            查看全部 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="px-3 py-3 font-medium">编号</th>
                <th className="px-3 py-3 font-medium">议案</th>
                <th className="px-3 py-3 font-medium">投票类型</th>
                <th className="px-3 py-3 font-medium">附件</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">投票进度</th>
                <th className="px-3 py-3 font-medium">链上存证</th>
                <th className="px-3 py-3 font-medium">表决复查</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {motions.slice(0, 6).map((item, idx) => {
                const status = getMotionStatusLabel(item.status);
                const hasChain = !!item.blockchainHash;
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3">
                      <span className="text-xs font-mono text-slate-500">Y2025-{String(idx + 1).padStart(3, "0")}</span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-slate-800 font-medium max-w-[200px] truncate">{item.title}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={item.voteType === "realname" ? "info" : "secondary"} size="sm">
                        {item.voteType === "realname" ? "实名投票" : "匿名投票"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      {item.attachments.length > 0 ? (
                        <button
                          onClick={() => setMotionModal({ type: "attachment", data: item, title: "附件公示" })}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {item.attachments.length}个
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.bgColor, status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={(item.voteStats.votedCount / item.voteStats.totalVoters) * 100}
                          variant="primary"
                          size="sm"
                          className="w-20"
                        />
                        <span className="text-xs text-slate-600">
                          {item.voteStats.votedCount}/{item.voteStats.totalVoters}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {hasChain ? (
                        <button
                          onClick={() => setMotionModal({ type: "chain", data: item, title: "链上存证" })}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          已存证
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">待上链</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setMotionModal({ type: "review", data: item, title: "表决复查" })}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <History className="w-3.5 h-3.5" />
                        查看
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <Link to={`/council/${item.id}`} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {motionModal && (
          <Modal isOpen={true} onClose={() => { setMotionModal(null); setMotionCopied(false); }} title={`${motionModal.title} · ${motionModal.data.title.slice(0, 20)}`} size="lg">
            {motionModal.type === "attachment" && (
              <div className="space-y-4">
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-sm text-primary-700">
                    本议案共包含 <span className="font-semibold">{motionModal.data.attachments.length}</span> 份附件，已全部完成区块链存证公示
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {motionModal.data.attachments.map((att: any, idx: number) => (
                    <m.div
                      key={att.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border rounded-xl hover:border-primary-300 hover:bg-primary-50/40 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{att.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{att.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Eye className="w-3.5 h-3.5 mr-1" />预览
                        </Button>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            )}

            {motionModal.type === "chain" && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">已完成区块链存证</p>
                      <p className="text-sm text-emerald-600">投票结果已写入 21 个共识节点，不可篡改</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">交易哈希</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-slate-800 font-mono truncate flex-1">
                        {motionModal.data.blockchainHash}
                      </code>
                      <button onClick={() => {
                        navigator.clipboard.writeText(motionModal.data.blockchainHash || "");
                        setMotionCopied(true);
                        setTimeout(() => setMotionCopied(false), 2000);
                      }} className="p-1.5 rounded hover:bg-slate-200">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Hash className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">区块高度</p>
                    <p className="text-lg font-semibold text-slate-800">#18,456,892</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">上链时间</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(motionModal.data.voteEnd, "YYYY-MM-DD HH:mm:ss")}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">共识验证</p>
                    <p className="text-sm font-semibold text-emerald-600">21/21 节点已验证 ✓</p>
                  </div>
                </div>
              </div>
            )}

            {motionModal.type === "review" && (
              <div className="space-y-1">
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 mb-3">
                  <p className="text-sm text-primary-700">本议案表决记录已完成全部复查流程，共 <span className="font-semibold">4</span> 个复查节点</p>
                </div>
                {[
                  { operator: "张明华", action: "发起议案投票", timestamp: motionModal.data.voteStart, remark: "已完成议案起草和公示", status: "完成" },
                  { operator: "系统自动", action: "投票截止统计", timestamp: motionModal.data.voteEnd, remark: `共 ${motionModal.data.voteStats.votedCount} 位业主参与投票，投票率 ${formatPercent((motionModal.data.voteStats.votedCount / motionModal.data.voteStats.totalVoters) * 100)}`, status: "完成" },
                  { operator: "业委会集体", action: "表决结果公示", timestamp: motionModal.data.voteEnd, remark: `赞成 ${motionModal.data.voteStats.agreeCount} / 反对 ${motionModal.data.voteStats.disagreeCount} / 弃权 ${motionModal.data.voteStats.abstainCount}，表决通过`, status: "完成" },
                  { operator: "街道办", action: "复查确认", timestamp: motionModal.data.voteEnd, remark: "符合《物业管理条例》相关规定，结果合法有效，已备案", status: "完成" },
                ].map((record, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative">
                      <div className={cn("w-3 h-3 rounded-full mt-2", idx === 3 ? "bg-emerald-500" : "bg-primary-500")} />
                      {idx < 3 && <div className="absolute top-full left-1/2 w-px h-10 bg-slate-200 -translate-x-1/2" />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{record.action}</span>
                          <Badge variant={record.status === "完成" ? "success" : "warning"} size="sm">{record.status}</Badge>
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(record.timestamp, "YYYY-MM-DD HH:mm")}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">操作人：{record.operator}</p>
                      <p className="text-sm text-slate-600 mt-1 p-2 bg-slate-50 rounded">{record.remark}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
