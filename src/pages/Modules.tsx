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
  Stamp,
  Store,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, formatDate, getMotionStatusLabel, getSealStatusLabel, getTicketStatusLabel } from "@/utils";

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

function DataCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-primary-800">{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "primary" | "emerald" | "amber" | "rose" | "slate" }) {
  const cls = {
    primary: "bg-primary-50 text-primary-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", cls)}>{children}</span>;
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
  return (
    <PageShell title="民主议事概览" description="议案公示、投票进度和表决结果概览。">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="议案总数" value={motions.length} icon={FileText} tone="primary" />
        <StatCard label="投票中" value={motions.filter((m) => m.status === "voting").length} icon={CheckCircle2} tone="emerald" />
        <StatCard label="公示中" value={motions.filter((m) => m.status === "publicity").length} icon={ClipboardList} tone="amber" />
        <StatCard label="已通过" value={motions.filter((m) => m.status === "passed").length} icon={ShieldCheck} tone="slate" />
      </div>
      <DataCard title="最近议案">
        <SimpleTable
          headers={["议案", "状态", "投票进度", "操作"]}
          rows={motions.slice(0, 6).map((item) => {
            const status = getMotionStatusLabel(item.status);
            return [
              item.title,
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.bgColor, status.color)}>{status.label}</span>,
              `${item.voteStats.votedCount}/${item.voteStats.totalVoters}`,
              <Link className="text-primary-600 hover:text-primary-800" to={`/council/${item.id}`}>查看详情</Link>,
            ];
          })}
        />
      </DataCard>
    </PageShell>
  );
}
