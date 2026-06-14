import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Database, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { adminApi } from "@/api";

type AdminOverview = Awaited<ReturnType<typeof adminApi.getOverview>>;

const statusLabel: Record<string, string> = {
  online: "在线",
  cached: "缓存",
  offline: "离线",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getOverview()
      .then(setOverview)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout showBottomNav={false}>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            管理后台
          </div>
        </div>

        <section className="rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-sm text-slate-300">青岛市民通运营中心</p>
          <h1 className="mt-2 text-2xl font-bold">政务民生服务后台管理</h1>
          <p className="mt-2 text-sm text-slate-300">
            统一查看服务在线状态、接口成功率、待处理工单和离线缓存。
          </p>
        </section>

        {loading || !overview ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500">正在加载后台数据...</div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard icon={Users} label="在线用户" value={overview.metrics.usersOnline.toLocaleString()} />
              <MetricCard icon={Activity} label="接口成功率" value={`${overview.metrics.apiSuccessRate}%`} />
              <MetricCard icon={AlertTriangle} label="待处理工单" value={String(overview.metrics.pendingTickets)} />
              <MetricCard icon={Database} label="缓存政策" value={String(overview.metrics.cachedPolicies)} />
            </div>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">服务状态</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                {overview.serviceStatus.map((item) => (
                  <div key={item.name} className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="text-sm text-slate-500">{item.requestsToday} 次</span>
                    <span className="text-sm text-slate-500">{item.successRate}%</span>
                    <span className="justify-self-end rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">待办提醒</h2>
              <div className="mt-3 space-y-2">
                {overview.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="font-medium text-slate-800">{alert.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{alert.owner}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
