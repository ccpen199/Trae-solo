import { Activity, Database, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const auditRows = [
  { time: '09:20', user: '系统管理员', action: '调整浦东新区基准工时费', status: '已生效' },
  { time: '10:05', user: '质检主管', action: '复盘差评关键词：迟到、加价', status: '待跟进' },
  { time: '11:30', user: '调度员', action: '导出师傅技能图谱', status: '已完成' },
];

export default function AdminSettings() {
  const { dashboardStats, workers, qualityIssues } = useAppStore();
  const certifiedWorkers = workers.filter((worker) => worker.skills.some((skill) => skill.status === 'verified')).length;
  const openIssues = qualityIssues.filter((issue) => issue.status !== 'resolved').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">后台管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            系统设置、运营看板、师傅资质审核与服务质量复盘
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          admin@repair.com
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="h-9 w-9 rounded-lg bg-orange-50 p-2 text-orange-500" />
            <div>
              <p className="text-xs text-slate-500">今日订单</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardStats.todayOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-9 w-9 rounded-lg bg-blue-50 p-2 text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">持证师傅</p>
              <p className="text-2xl font-bold text-slate-900">{certifiedWorkers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 rounded-lg bg-emerald-50 p-2 text-emerald-500" />
            <div>
              <p className="text-xs text-slate-500">完成率</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardStats.completionRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-9 w-9 rounded-lg bg-amber-50 p-2 text-amber-500" />
            <div>
              <p className="text-xs text-slate-500">待复盘问题</p>
              <p className="text-2xl font-bold text-slate-900">{openIssues}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">后台配置中心</h3>
              <p className="text-xs text-slate-500">价格透明、技能审核、担保资金和质量规则</p>
            </div>
            <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white">
              保存设置
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['城市基准工时费', '上海浦东新区 ¥120/小时，支持按品类阶梯定价'],
              ['资质人工复核', '电工证、空调资质、平台培训证书三类审核队列'],
              ['T+1 担保释放', '验收确认后自动释放，争议订单进入平台介入'],
              ['差评关键词抓取', '迟到、临时加价、未拍照等词命中后自动建复盘工单'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="font-medium text-slate-800">{title}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800">管理审计</h3>
          </div>
          <div className="space-y-3">
            {auditRows.map((row) => (
              <div key={`${row.time}-${row.action}`} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{row.time}</span>
                  <span>{row.status}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">{row.action}</p>
                <p className="text-xs text-slate-500">{row.user}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
