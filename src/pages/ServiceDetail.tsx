import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Flame, Building2, Clock, Timer, MapPin,
  CheckCircle2, ListChecks, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockServices, cityOptions } from '@/data/mockData';
import ServiceCard from '@/components/ServiceCard';

const cityNameMap: Record<string, string> = {};
cityOptions.forEach((c) => { cityNameMap[c.value] = c.label; });

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const service = useMemo(() => mockServices.find((s) => s.id === id), [id]);

  const relatedServices = useMemo(() => {
    if (!service) return [];
    return mockServices
      .filter((s) => s.category === service.category && s.id !== service.id)
      .slice(0, 3);
  }, [service]);

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">未找到该服务</p>
        <button onClick={() => navigate('/services')} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          返回服务大厅
        </button>
      </div>
    );
  }

  const handleApply = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gov-gradient py-6 px-4">
        <div className="container max-w-3xl">
          <button onClick={() => navigate(-1)} className="btn-secondary mb-4 text-sm bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">{service.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {service.isHot && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-500/20 text-warm-200 text-xs font-medium">
                <Flame className="w-3 h-3" />
                热门服务
              </span>
            )}
            <span className="badge bg-white/15 text-white text-xs">
              <Building2 className="w-3 h-3" />
              {service.bureau}
            </span>
            <span className={cn(
              'badge text-xs',
              service.fee === '免费' ? 'bg-success-500/20 text-success-200' : 'bg-warning-500/20 text-warning-200',
            )}>
              {service.fee}
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl px-4 mt-4 space-y-4">
        <div className="card p-5">
          <h2 className="section-title text-base mb-4">
            <Clock className="w-5 h-5 text-gov-500" />
            基本信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gov-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">承诺办理时长</p>
              <p className="text-lg font-bold text-gov-700">{service.processingTime} <span className="text-sm font-normal">工作日</span></p>
            </div>
            <div className="bg-gov-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">平均办理时长</p>
              <p className="text-lg font-bold text-gov-700">{service.avgDuration}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gov-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-500">支持城市：</span>
              <span className="text-slate-800 font-medium">
                {service.city.map((c) => cityNameMap[c] || c).join('、')}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title text-base mb-4">
            <Timer className="w-5 h-5 text-gov-500" />
            办理流程
          </h2>
          <div className="relative pl-6">
            {service.steps.map((step, i) => (
              <div key={step.stepNumber} className="relative pb-6 last:pb-0">
                {i < service.steps.length - 1 && (
                  <div className="absolute left-[-18px] top-6 bottom-0 w-px bg-gov-200" />
                )}
                <div className="absolute left-[-22px] top-0 w-[18px] h-[18px] rounded-full bg-gov-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{step.stepNumber}</span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">{step.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  <span className="inline-block mt-1 text-xs text-gov-600 bg-gov-50 px-2 py-0.5 rounded">
                    预计 {step.estimatedTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title text-base mb-4">
            <ListChecks className="w-5 h-5 text-gov-500" />
            所需材料
          </h2>
          <ul className="space-y-2.5">
            {service.requiredMaterials.map((mat, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{mat}</span>
              </li>
            ))}
          </ul>
        </div>

        {relatedServices.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title text-base mb-4">关联服务推荐</h2>
            <div className="space-y-3">
              {relatedServices.map((rs) => (
                <Link
                  key={rs.id}
                  to={`/services/${rs.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gov-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-gov-700 truncate">{rs.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{rs.bureau} · {rs.processingTime}工作日</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-gov-500 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50">
        <div className="container max-w-3xl">
          <button
            onClick={handleApply}
            className="btn-primary w-full text-base py-3"
          >
            在线办理
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success-600 text-white shadow-lg text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" />
            模拟提交成功
          </div>
        </div>
      )}
    </div>
  );
}
