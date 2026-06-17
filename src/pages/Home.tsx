import { Link } from "react-router-dom";
import {
  Activity,
  Building2,
  FileCheck,
  Gavel,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Stamp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Dashboard from "@/pages/dashboard";

const primaryNav = [
  { label: "工作台", to: "/dashboard", icon: LayoutDashboard, tone: "bg-primary-600 text-white hover:bg-primary-700" },
  { label: "民主议事", to: "/council/motions", icon: Gavel, tone: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  { label: "财务透明", to: "/finance/overview", icon: Wallet, tone: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  { label: "后台管理", to: "/admin/owners", icon: ShieldCheck, tone: "bg-primary-50 text-primary-700 hover:bg-primary-100" },
];

const adminShortcuts = [
  { label: "业主管理", to: "/admin/owners", icon: Users },
  { label: "业委会管理", to: "/admin/council", icon: Building2 },
  { label: "票据管理", to: "/finance/invoices", icon: Receipt },
  { label: "审计报告", to: "/finance/audit", icon: FileCheck },
  { label: "用章申请", to: "/seal/applications", icon: Stamp },
  { label: "报修工单", to: "/property/tickets", icon: Wrench },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-primary-800">业委会数字治理平台</h1>
            <p className="text-sm text-slate-500">业主认证、民主议事、财务透明、物业协同和街道督办一体化工作台</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${item.tone}`} to={item.to}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <a className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700" href="/api/health">
              <Activity className="h-4 w-4" />
              服务健康
            </a>
          </nav>
        </div>
      </header>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          {adminShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-primary-700">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>
      <Dashboard />
    </div>
  );
}
