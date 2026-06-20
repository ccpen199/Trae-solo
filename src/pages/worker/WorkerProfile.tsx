import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Phone,
  ShieldAlert,
  Award,
  Calendar,
  Building2,
  FileCheck,
  CheckCircle2,
  Loader2,
  User,
  Clock,
  ScanLine,
  CreditCard,
  AlertCircle,
  Settings,
  BadgeCheck,
  Briefcase,
  XCircle,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get, post } from '@/lib/api';
import CreditGauge from '@/components/CreditGauge';
import type { Worker, SkillCert, PerformanceRecord, LeaveType, WorkerStatus } from '@shared/types';

const WORKER_ID = 'w-001';

const workerStatusMap: Record<WorkerStatus, { text: string; color: string; bgLight: string; border: string }> = {
  idle: { text: '待业中', color: 'bg-warning-500', bgLight: 'bg-warning-50', border: 'border-warning-200' },
  interviewing: { text: '面试中', color: 'bg-brand-500', bgLight: 'bg-brand-50', border: 'border-brand-200' },
  onboarding: { text: '入职中', color: 'bg-accent-500', bgLight: 'bg-accent-50', border: 'border-accent-200' },
  employed: { text: '在职中', color: 'bg-success-500', bgLight: 'bg-success-50', border: 'border-success-200' },
  resigned: { text: '已离职', color: 'bg-gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' },
};

const genderMap: Record<string, string> = { male: '男', female: '女' };

const leaveTypeConfig = (type?: LeaveType) => {
  switch (type) {
    case 'normal':
      return { text: '正常离职', color: 'bg-success-50 text-success-600 border-success-200', icon: CheckCircle2 };
    case 'abnormal':
      return { text: '异常离岗', color: 'bg-warning-50 text-warning-600 border-warning-200', icon: AlertCircle };
    case 'fired':
      return { text: '辞退', color: 'bg-danger-50 text-danger-600 border-danger-200', icon: XCircle };
    default:
      return { text: '在职中', color: 'bg-brand-50 text-brand-600 border-brand-200', icon: Briefcase };
  }
};

function maskIdNumber(id: string): string {
  if (id.length <= 10) return id;
  return id.slice(0, 4) + '****' + id.slice(-4);
}

export default function WorkerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  const fetchWorker = async () => {
    setLoading(true);
    try {
      const res = await get<Worker>(`/workers/${WORKER_ID}`);
      if (res.success && res.data) {
        setWorker(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, []);

  const handleOcrVerify = async () => {
    setShowOcrModal(true);
    setOcrSuccess(false);
    setOcrLoading(true);
    const res = await post<Worker>(`/workers/${WORKER_ID}/verify-idcard`);
    if (res.success && res.data) {
      setWorker(res.data);
      setOcrSuccess(true);
    }
    setOcrLoading(false);
  };

  if (loading || !worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  const st = workerStatusMap[worker.status];
  const totalDays = worker.performanceHistory.reduce((s, p) => s + p.daysWorked, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 pt-12 pb-28 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-8 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">个人中心</h1>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
                <Settings size={18} />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-white/30 to-white/10 backdrop-blur border-2 border-white/40 flex items-center justify-center shadow-xl">
                  <User size={44} className="text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-accent-500 flex items-center justify-center border-2 border-white shadow-lg active:scale-95 transition-transform">
                  <Camera size={14} className="text-white" />
                </button>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black truncate">{worker.name}</h2>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm border', st.bgLight, st.border)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', st.color)} />
                    {st.text}
                  </span>
                </div>
                <div className="text-sm text-white/80 flex items-center gap-2 mb-2">
                  <Phone size={13} />
                  <span className="tracking-wide tabular-nums">{worker.phone}</span>
                  <span className="text-white/40">·</span>
                  <span>{worker.age ?? '-'}岁</span>
                  <span className="text-white/40">·</span>
                  <span>{worker.gender ? genderMap[worker.gender] : '-'}</span>
                </div>
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <Calendar size={11} />
                  注册时间：{worker.createdAt.slice(0, 10)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-20 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            {!worker.idCardVerified ? (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning-400 to-warning-500 flex items-center justify-center shadow-md shadow-warning-500/25 flex-shrink-0">
                    <ScanLine size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      身份证 OCR 核验
                      <span className="text-[10px] text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded-full font-bold">必做</span>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">完成实名认证后方可预约面试、领取补贴。</p>
                  </div>
                </div>
                <button onClick={handleOcrVerify} disabled={ocrLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warning-500 via-accent-500 to-orange-400 text-white font-bold shadow-lg shadow-accent-500/30 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {ocrLoading ? <><Loader2 size={18} className="animate-spin" />识别中...</> : <><ScanLine size={18} />一键身份证核验</>}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-md shadow-success-500/25 flex-shrink-0">
                    <BadgeCheck size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                      实名信息
                      <span className="text-[10px] text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-bold border border-success-100">已认证</span>
                    </h3>
                  </div>
                </div>
                {worker.idCardOcrData && (
                  <div className="bg-gradient-to-br from-brand-50 via-white to-success-50 rounded-2xl p-4 border border-brand-100/60">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400 mb-1">姓名</div>
                        <div className="font-bold text-gray-800">{worker.idCardOcrData.name}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-400 mb-1">身份证号</div>
                        <div className="font-bold text-gray-800 tracking-wider tabular-nums">{maskIdNumber(worker.idCardOcrData.idNumber)}</div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-gray-400 mb-1">户籍地址</div>
                        <div className="font-medium text-gray-700 leading-snug">{worker.idCardOcrData.address}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-1 h-5 rounded-full bg-accent-500" />
              信用评分
            </h2>
            <div className="flex justify-center -my-2">
              <CreditGauge score={worker.creditScore} size={220} strokeWidth={20} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: '守约率', val: '96%', color: 'text-success-600' },
                { label: '在职厂', val: `${worker.performanceHistory.length}家`, color: 'text-brand-600' },
                { label: '总天数', val: `${totalDays}天`, color: 'text-accent-600' },
                { label: '技能证', val: `${worker.skills.length}本`, color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="text-center p-2.5 rounded-xl bg-gray-50">
                  <div className={cn('text-lg font-black tabular-nums', s.color)}>{s.val}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-purple-500" />
              技能认证
            </h2>
            {worker.skills.length === 0 ? (
              <div className="py-10 text-center">
                <Award size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无技能认证</p>
              </div>
            ) : (
              <div className="space-y-3">
                {worker.skills.map((skill: SkillCert, i: number) => (
                  <div key={i} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', i % 4 === 0 && 'bg-gradient-to-br from-brand-400 to-brand-600', i % 4 === 1 && 'bg-gradient-to-br from-accent-400 to-accent-600', i % 4 === 2 && 'bg-gradient-to-br from-purple-400 to-purple-600', i % 4 === 3 && 'bg-gradient-to-br from-success-400 to-success-600')}>
                        <Award size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 leading-tight">{skill.name}</h3>
                          <span className="flex-shrink-0 text-[10px] text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-bold border border-success-100 flex items-center gap-0.5">
                            <FileCheck size={9} />已核验
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
                          <Building2 size={11} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{skill.issuer}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Calendar size={10} className="flex-shrink-0" />
                          <span>发证日期：{skill.certifiedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-success-500" />
                历史履约记录
              </h2>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">共 {worker.performanceHistory.length} 条</span>
            </div>
            {worker.performanceHistory.length === 0 ? (
              <div className="py-10 text-center">
                <Briefcase size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无履约记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {worker.performanceHistory.map((p: PerformanceRecord, i: number) => {
                  const lt = leaveTypeConfig(p.endDate ? p.leaveType : undefined);
                  const LtIcon = lt.icon;
                  return (
                    <div key={i} className={cn('rounded-2xl p-4 border border-gray-100', !p.endDate && 'bg-success-50/30 border-success-100')}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-bold text-gray-900">{p.factoryName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Briefcase size={10} />{p.jobTitle}
                          </div>
                        </div>
                        <span className={cn('inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border text-[10px] font-bold flex-shrink-0', lt.color)}>
                          <LtIcon size={9} />{lt.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={10} />{p.startDate.slice(0, 10)} ~ {p.endDate ? p.endDate.slice(0, 10) : '至今'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{p.daysWorked}天</span>
                      </div>
                      {p.leaveReason && (
                        <div className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                          <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />{p.leaveReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-brand-500" />
              当前位置
            </h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-brand-500" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{worker.currentLocation.region}</div>
                <div className="text-xs text-gray-400 mt-0.5 tabular-nums">
                  经度 {worker.currentLocation.lng} · 纬度 {worker.currentLocation.lat}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-6 grid grid-cols-2 gap-3">
          <button className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-all">
            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500"><Briefcase size={20} /></div>
            <span className="text-sm font-bold text-gray-800">退出登录</span>
          </button>
          <button className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500"><Settings size={20} /></div>
            <span className="text-sm font-bold text-gray-800">账号设置</span>
          </button>
        </div>
      </div>

      {showOcrModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6">
            {!ocrSuccess ? (
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                    <ScanLine size={30} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">正在识别身份证...</h3>
                  <p className="text-sm text-gray-500">请将身份证正面放入取景框内</p>
                </div>
                <div className="relative mx-auto w-full max-w-[260px] aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-dashed border-brand-300 overflow-hidden mb-5">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center"><CreditCard size={40} className="mx-auto mb-2 opacity-40" /><div className="text-[10px]">身份证正面</div></div>
                  </div>
                  <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-pulse" style={{ animation: 'scanMove 2s ease-in-out infinite', top: '50%' }} />
                </div>
                <button onClick={() => { setShowOcrModal(false); setOcrSuccess(false); }} disabled={ocrLoading} className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">取消</button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-xl">
                  <BadgeCheck size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">实名认证成功！</h3>
                <p className="text-center text-sm text-gray-500 leading-relaxed mb-5">您的身份信息已通过权威核验<br/>现在可以预约面试、领取稳岗补贴啦！</p>
                <div className="bg-gradient-to-br from-success-50 to-emerald-50 rounded-2xl p-4 mb-5 border border-success-100">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><div className="text-gray-400 mb-0.5">姓名</div><div className="font-bold text-gray-800">{worker.idCardOcrData?.name}</div></div>
                    <div><div className="text-gray-400 mb-0.5">身份证</div><div className="font-bold text-gray-800 tabular-nums">{worker.idCardOcrData ? maskIdNumber(worker.idCardOcrData.idNumber) : '-'}</div></div>
                  </div>
                </div>
                <button onClick={() => setShowOcrModal(false)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-lg active:scale-[0.98] transition-all">知道了</button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes scanMove { 0%, 100% { top: 10%; } 50% { top: 85%; } }`}</style>
    </div>
  );
}
