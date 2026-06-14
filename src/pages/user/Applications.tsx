import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, FileText, Clock, CheckCircle2, AlertTriangle,
  XCircle, Eye, Star, X, ArrowRight, Calendar, Hash, Search,
  Filter, ChevronDown, ChevronUp, Loader2, MessageSquare, Award,
  Gavel, Briefcase, Shield, User, CreditCard, Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpGet } from '@/api/client';
import { useAuthStore } from '@/store/auth';

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-gov-500' };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

const statusTabs = [
  { k: 'all', label: '全部', icon: FileText, color: 'from-gray-500 to-slate-600' },
  { k: 'processing', label: '办理中', icon: Clock, color: 'from-gov-500 to-blue-600' },
  { k: 'done', label: '已办结', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
  { k: 'supplement', label: '待补件', icon: AlertTriangle, color: 'from-gold-500 to-amber-600' },
  { k: 'rejected', label: '已驳回', icon: XCircle, color: 'from-red-500 to-rose-600' },
];

const statusMap: Record<string, any> = {
  processing: { cls: 'bg-gov-50 text-gov-700 border-gov-200', icon: Clock, label: '办理中' },
  done: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: '已办结' },
  supplement: { cls: 'bg-gold-50 text-gold-700 border-gold-200', icon: AlertTriangle, label: '待补件' },
  rejected: { cls: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: '已驳回' },
};

const categoryIcons: Record<string, any> = {
  就业服务: Briefcase,
  社保服务: Shield,
  人事人才: Award,
  劳动关系: Gavel,
  个人中心: User,
  default: FileText,
};

interface ProgressItem { label: string; done: boolean; current?: boolean; date?: string; }
interface Application {
  id: number;
  applyNo: string;
  serviceName: string;
  category: string;
  status: string;
  applyDate: string;
  progress: number;
  steps: ProgressItem[];
  rating?: number;
  comment?: string;
  canRate?: boolean;
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [detail, setDetail] = useState<Application | null>(null);
  const [rateApp, setRateApp] = useState<Application | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apps, setApps] = useState<Application[]>([
    { id: 1, applyNo: 'SYD2026062000128', serviceName: '失业登记与失业保险金申领', category: '就业服务', status: 'done', applyDate: '2026-06-20 09:12:30', progress: 100, canRate: true,
      steps: [{ label: '提交申请', done: true, date: '06-20 09:12' }, { label: '受理审核', done: true, date: '06-20 14:30' }, { label: '资格认定', done: true, date: '06-21 10:05' }, { label: '待遇发放', done: true, date: '06-25 16:00' }] },
    { id: 2, applyNo: 'CYD2026061800096', serviceName: '创业担保贷款申请', category: '就业服务', status: 'processing', applyDate: '2026-06-18 14:22:10', progress: 60,
      steps: [{ label: '提交申请', done: true, date: '06-18 14:22' }, { label: '预审通过', done: true, date: '06-19 09:00' }, { label: '实地核查', done: false, current: true }, { label: '审批放款', done: false }] },
    { id: 3, applyNo: 'ZC2026061500128', serviceName: '中级工程师职称评审', category: '人事人才', status: 'processing', applyDate: '2026-06-15 10:45:00', progress: 50,
      steps: [{ label: '提交申报', done: true, date: '06-15 10:45' }, { label: '单位初审', done: true, date: '06-17 15:30' }, { label: '专家评审', done: false, current: true }, { label: '结果公示', done: false }, { label: '证书发放', done: false }] },
    { id: 4, applyNo: 'SBZ2026062500077', serviceName: '社保参保证明（区块链）', category: '社保服务', status: 'done', applyDate: '2026-06-25 16:30:22', progress: 100, rating: 5, comment: '办理速度很快，区块链证明很方便！', canRate: false,
      steps: [{ label: '生成证明', done: true, date: '06-25 16:30' }, { label: '上链存证', done: true, date: '06-25 16:30' }, { label: '完成', done: true, date: '06-25 16:31' }] },
    { id: 5, applyNo: 'JZ2026061000034', serviceName: '劳动仲裁申请（拖欠工资）', category: '劳动关系', status: 'supplement', applyDate: '2026-06-10 11:20:00', progress: 35,
      steps: [{ label: '提交申请', done: true, date: '06-10 11:20' }, { label: '材料审核', done: false, current: true }, { label: '开庭通知', done: false }, { label: '仲裁裁决', done: false }] },
    { id: 6, applyNo: 'JN2026060500152', serviceName: '职业技能等级认定（高级）', category: '人事人才', status: 'rejected', applyDate: '2026-06-05 15:40:00', progress: 40,
      steps: [{ label: '提交报名', done: true, date: '06-05 15:40' }, { label: '资格审核', done: true, date: '06-06 09:30' }, { label: '驳回', done: true, date: '06-07 11:00' }] },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await httpGet(`/user/${user?.id || 1}/applications`);
        if (resp.code === 0 && resp.data) setApps(resp.data as Application[]);
      } catch {}
    };
    load();
  }, []);

  const filteredApps = activeTab === 'all' ? apps : apps.filter((a) => a.status === activeTab);
  const counts = { all: apps.length, processing: apps.filter((a) => a.status === 'processing').length, done: apps.filter((a) => a.status === 'done').length, supplement: apps.filter((a) => a.status === 'supplement').length, rejected: apps.filter((a) => a.status === 'rejected').length };

  const submitRate = async () => {
    if (rating === 0) { toast('请选择服务星级', 'error'); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setApps((prev) => prev.map((a) => a.id === rateApp!.id ? { ...a, rating, comment, canRate: false } : a));
      toast('服务评价提交成功，感谢您的反馈！', 'success');
      setRateApp(null); setRating(0); setComment('');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/user/applications')}>个人中心</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">我的办件</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 pb-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-gov">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gov-700 font-serif">我的办件</h1>
              <p className="text-sm text-gray-500 mt-0.5">业务办件全流程跟踪 · 进度透明 · 评价反馈</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="搜索办件编号/服务名称..." className="gov-input pl-10 !py-2 text-sm" />
          </div>
        </div>

        <div className="border-b border-gray-100 px-4 md:px-8">
          <div className="flex gap-1 md:gap-2 overflow-x-auto -mb-px pb-1">
            {statusTabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.k;
              const c = counts[t.k as keyof typeof counts];
              return (
                <button key={t.k} onClick={() => setActiveTab(t.k)} className={cn(
                  'px-4 md:px-5 py-3.5 transition-all whitespace-nowrap border-b-2 inline-flex items-center gap-2 font-medium text-sm relative',
                  active ? 'text-gov-600 border-gov-500 bg-gov-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'
                )}>
                  <span className={cn('w-7 h-7 rounded-lg inline-flex items-center justify-center bg-gradient-to-br transition-all', t.color, active ? 'shadow-sm' : 'opacity-60 scale-95')}><Icon className="w-3.5 h-3.5 text-white" /></span>
                  {t.label}
                  <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center', active ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-500')}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-8">
          {filteredApps.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><FileText className="w-10 h-10 text-gray-300" /></div>
              <p className="text-gray-400 font-medium">暂无「{statusTabs.find((s) => s.k === activeTab)?.label}」办件记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
              {filteredApps.map((app) => {
                const st = statusMap[app.status] || statusMap.processing;
                const StIcon = st.icon;
                const CatIcon = categoryIcons[app.category] || categoryIcons.default;
                return (
                  <div key={app.id} className="gov-card !m-0 p-5 hover:shadow-gov hover:-translate-y-0.5 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none"><CatIcon className="w-full h-full text-gov-500" /></div>
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                            app.category === '就业服务' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                            app.category === '社保服务' ? 'bg-gradient-to-br from-gov-500 to-blue-600' :
                            app.category === '人事人才' ? 'bg-gradient-to-br from-gold-500 to-amber-600' :
                            app.category === '劳动关系' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                            'bg-gradient-to-br from-gray-500 to-slate-600'
                          )}><CatIcon className="w-5 h-5 text-white" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-0.5"><span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium">{app.category}</span><span className="font-mono">No. {app.applyNo}</span></p>
                            <h4 className="font-semibold text-gray-800 group-hover:text-gov-700 transition-colors line-clamp-1">{app.serviceName}</h4>
                          </div>
                        </div>
                        <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 mt-1', st.cls)}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5 text-[11px]">
                          <span className="text-gray-400">办理进度</span>
                          <span className="font-mono font-bold text-gov-600">{app.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-700 relative overflow-hidden',
                            app.status === 'done' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                            app.status === 'supplement' ? 'bg-gradient-to-r from-gold-400 to-amber-500' :
                            app.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                            'bg-gradient-to-r from-gov-400 to-blue-500'
                          )} style={{ width: `${app.progress}%` }}>
                            <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%]" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />申请时间：{app.applyDate.slice(0, 16)}</span>
                        <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" />{app.steps.length}个流程节点</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-50">
                        {app.canRate && (
                          <button onClick={() => setRateApp(app)} className="px-3.5 py-2 rounded-lg text-xs font-medium text-gold-600 bg-gold-50 hover:bg-gold-100 transition-colors inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />评价服务</button>
                        )}
                        <button onClick={() => setDetail(app)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-gov-50 text-gov-600 hover:bg-gov-100 transition-colors inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />查看详情</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up overflow-y-auto" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-gov-lg max-w-2xl w-full my-8 overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gov-50 via-blue-50/50 to-gov-50">
              <div className="flex items-center gap-3 min-w-0"><FileText className="w-5 h-5 text-gov-500 shrink-0" />
                <div className="min-w-0"><h3 className="font-bold text-gray-800 truncate">{detail.serviceName}</h3><p className="text-[11px] text-gray-400 mt-0.5 font-mono">办件编号：{detail.applyNo}</p></div>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-white/80 transition-colors"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="px-6 md:px-8 py-6 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-gray-50/60">
                <div><p className="text-[11px] text-gray-400 mb-0.5">业务类别</p><p className="text-sm font-medium text-gray-700">{detail.category}</p></div>
                <div><p className="text-[11px] text-gray-400 mb-0.5">申请时间</p><p className="text-sm font-medium text-gray-700">{detail.applyDate.slice(0, 19)}</p></div>
                <div><p className="text-[11px] text-gray-400 mb-0.5">当前状态</p><span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', statusMap[detail.status].cls)}>{(() => { const I = statusMap[detail.status].icon; return <I className="w-3 h-3" />; })()}{statusMap[detail.status].label}</span></div>
                <div><p className="text-[11px] text-gray-400 mb-0.5">整体进度</p><p className="text-sm font-bold font-mono text-gov-600">{detail.progress}%</p></div>
              </div>
              <h4 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-gov-500" />办理流程时间线</h4>
              <div className="relative pl-4">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gov-200 via-gray-200 to-gray-100 rounded-full" />
                {detail.steps.map((s, idx) => {
                  const SI = s.done ? CheckCircle2 : s.current ? Clock : Circle;
                  return (
                    <div key={idx} className="relative flex gap-3 py-3">
                      <div className="relative z-10 shrink-0">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
                          s.done ? 'bg-emerald-500 text-white' :
                          s.current ? 'bg-white text-gov-500 border-2 border-gov-300 ring-4 ring-gov-100' :
                          'bg-gray-100 text-gray-300'
                        )}><SI className={cn('w-4 h-4', s.current && 'animate-spin-slow')} /></div>
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className={cn('font-semibold text-sm', s.done || s.current ? 'text-gray-800' : 'text-gray-300')}>{s.label}</p>
                          {s.date && <p className="text-[11px] text-gray-400 font-mono">{s.date}</p>}
                        </div>
                        {s.current && <p className="text-xs text-gov-600 mt-0.5 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />正在处理中，请耐心等待...</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {detail.rating && (
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50/60 border border-gold-100">
                  <p className="text-xs text-gold-700 font-bold mb-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />您的服务评价</p>
                  <div className="flex items-center gap-1 my-1">{[1,2,3,4,5].map((n) => <Star key={n} className={cn('w-4 h-4', n <= (detail.rating||0) ? 'text-gold-500 fill-current' : 'text-gray-200')} />)}</div>
                  {detail.comment && <p className="text-xs text-gray-600 mt-1">「{detail.comment}」</p>}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button onClick={() => setDetail(null)} className="px-5 py-2.5 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 transition-colors">关闭</button>
              {detail.canRate && <button onClick={() => { setDetail(null); setRateApp(detail); }} className="gov-btn !py-2.5 !px-5 inline-flex items-center gap-1.5 text-sm"><Star className="w-4 h-4" />评价服务</button>}
            </div>
          </div>
        </div>
      )}

      {rateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={() => setRateApp(null)}>
          <div className="bg-white rounded-2xl shadow-gov-lg max-w-md w-full overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-br from-gold-50 via-amber-50/50 to-gold-50 border-b border-gold-100">
              <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-sm"><Star className="w-5 h-5 text-white fill-current" /></div><div><h3 className="font-bold text-gray-800 text-lg font-serif">服务评价</h3><p className="text-xs text-gray-500 mt-0.5">{rateApp.serviceName}</p></div></div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">请为本次服务打分 <span className="text-red-500">*</span></p>
                <div className="flex items-center justify-center gap-3">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n}
                      onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)} className="group transition-all hover:scale-125"
                    >
                      <Star className={cn('w-10 h-10 transition-all',
                        (hoverRating || rating) >= n ? 'text-gold-500 fill-current drop-shadow-sm' : 'text-gray-200'
                      )} />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">{['非常不满','不满意','一般','满意','非常满意'][(hoverRating || rating) - 1] || '请点击星星评分'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">评价内容</p>
                <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="请分享您的办理体验，您的建议将帮助我们持续改进服务..." className="gov-input resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2 sm:justify-end sm:gap-3">
              <button onClick={() => setRateApp(null)} className="px-5 py-2.5 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 transition-colors">取消</button>
              <button onClick={submitRate} disabled={submitting || rating === 0} className={cn(
                'inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-white shadow-md',
                rating > 0 && !submitting ? 'bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 hover:-translate-y-0.5 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed'
              )}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-current" />}
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
