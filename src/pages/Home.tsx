import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, HeartPulse, Building2, GraduationCap,
  Bus, ShieldAlert, HandHeart, Receipt,
  Bell, ArrowRight, Clock, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { mockServices, mockServiceRecords } from '@/data/mockData';
import CitySwitcher from '@/components/CitySwitcher';
import ServiceCard from '@/components/ServiceCard';
import type { Category } from '@/types';

const QUICK_SERVICES: { name: string; category: Category; icon: typeof ShieldCheck; color: string }[] = [
  { name: '社保', category: '人社', icon: ShieldCheck, color: 'bg-blue-50 text-blue-600' },
  { name: '医保', category: '医疗保障', icon: HeartPulse, color: 'bg-rose-50 text-rose-600' },
  { name: '公积金', category: '公积金', icon: Building2, color: 'bg-amber-50 text-amber-600' },
  { name: '教育', category: '教育', icon: GraduationCap, color: 'bg-violet-50 text-violet-600' },
  { name: '交通', category: '交通', icon: Bus, color: 'bg-cyan-50 text-cyan-600' },
  { name: '公安', category: '公安', icon: ShieldAlert, color: 'bg-indigo-50 text-indigo-600' },
  { name: '民政', category: '民政', icon: HandHeart, color: 'bg-pink-50 text-pink-600' },
  { name: '税务', category: '税务', icon: Receipt, color: 'bg-emerald-50 text-emerald-600' },
];

const NOTICES = [
  { id: '1', title: '关于2026年度社保缴费基数调整的公告', date: '2026-06-10' },
  { id: '2', title: '成德眉资四城通办服务事项新增50项', date: '2026-06-08' },
  { id: '3', title: '住房公积金提取业务流程优化通知', date: '2026-06-05' },
];

const CITY_NAMES: Record<string, string> = {
  chengdu: '成都市', deyang: '德阳市', meishan: '眉山市', ziyang: '资阳市',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: '待受理', cls: 'badge-warning' },
  processing: { label: '办理中', cls: 'badge-gov' },
  completed: { label: '已完成', cls: 'badge-success' },
  rejected: { label: '已驳回', cls: 'badge-danger' },
  overdue: { label: '已逾期', cls: 'badge-danger' },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export default function Home() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const hotServices = useMemo(
    () => mockServices.filter((s) => s.isHot).slice(0, 6),
    [],
  );

  const recentRecords = useMemo(
    () => mockServiceRecords
      .filter((r) => r.userId === user?.id)
      .sort((a, b) => b.submitTime.localeCompare(a.submitTime))
      .slice(0, 5),
    [user?.id],
  );

  const cityName = CITY_NAMES[user?.city ?? 'chengdu'] ?? '成都市';

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* 欢迎横幅区 */}
      <section className="bg-gov-gradient text-white animate-fade-in">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}，{user?.name ?? '市民'}
              </h1>
              <p className="mt-1 text-white/80 text-sm">
                当前城市：{cityName} · {user?.district ?? ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/services" className="btn-secondary text-sm">
                全部服务
              </Link>
              <Link to="/profile" className="btn-secondary text-sm">
                个人中心
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-6 space-y-6">
        {/* 城市切换区 */}
        <section className="animate-slide-up">
          <h2 className="section-title mb-3">
            <Building2 className="w-5 h-5 text-gov-600" />
            城市切换
          </h2>
          <CitySwitcher />
        </section>

        {/* 快捷服务入口 */}
        <section className="animate-slide-up">
          <h2 className="section-title mb-3">
            <ShieldCheck className="w-5 h-5 text-gov-600" />
            快捷服务
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {QUICK_SERVICES.map(({ name, category, icon: Icon, color }) => (
              <button
                key={category}
                onClick={() => navigate(`/services?category=${encodeURIComponent(category)}`)}
                className="card-hoverable flex flex-col items-center gap-2 py-4 px-2"
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-700">{name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 热门服务推荐 */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">
              <HeartPulse className="w-5 h-5 text-warm-500" />
              热门服务
            </h2>
            <Link to="/services" className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1">
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {hotServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => navigate(`/services/${service.id}`)}
              />
            ))}
          </div>
        </section>

        {/* 最近办件 */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">
              <FileText className="w-5 h-5 text-gov-600" />
              最近办件
            </h2>
            <Link to="/profile" className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1">
              全部记录 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentRecords.length > 0 ? (
            <div className="card divide-y divide-slate-100">
              {recentRecords.map((record) => {
                const statusInfo = STATUS_MAP[record.status] ?? { label: record.status, cls: 'badge' };
                return (
                  <div key={record.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {record.serviceName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{record.submitTime}</span>
                      </div>
                    </div>
                    <span className={cn(statusInfo.cls, 'shrink-0 ml-3')}>{statusInfo.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-400 text-sm">暂无办件记录</div>
          )}
        </section>

        {/* 通知公告区 */}
        <section className="animate-slide-up">
          <h2 className="section-title mb-3">
            <Bell className="w-5 h-5 text-gov-600" />
            通知公告
          </h2>
          <div className="card divide-y divide-slate-100">
            {NOTICES.map((n) => (
              <div key={n.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <p className="text-sm text-slate-700 truncate flex-1">{n.title}</p>
                <span className="text-xs text-slate-400 shrink-0 ml-3">{n.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
