import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  Building2,
  FileCheck,
  CheckCircle2,
  Loader2,
  User,
  Clock,
  Star,
  ScanLine,
  CreditCard,
  AlertCircle,
  Sparkles,
  ChevronRight,
  LogOut,
  Settings,
  BadgeCheck,
  Briefcase,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get, post } from '@/lib/api';
import CreditGauge from '@/components/CreditGauge';
import type { Worker, SkillCert, PerformanceRecord, LeaveType } from '@shared/types';

const MOCK_WORKER_ID = 'w-001';

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
      const res = await get<Worker>(`/workers/${MOCK_WORKER_ID}`);
      if (res.success && res.data) {
        setWorker(res.data);
      } else {
        throw new Error('no data');
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

  const handleOcrVerify = () => {
    setShowOcrModal(true);
    setOcrSuccess(false);
    setOcrLoading(true);
    setTimeout(async () => {
      const res = await post<Worker>(`/workers/${MOCK_WORKER_ID}/verify-idcard`, {
        name: '张伟',
        idNumber: '3205021992******12',
        address: '江苏省苏州市姑苏区观前街100号',
      });
      if (res.success && res.data) {
        setWorker(res.data);
        setOcrSuccess(true);
      }
      setOcrLoading(false);
    }, 2000);
  };

  const statusConfig = (status: Worker['status']) => {
    switch (status) {
      case 'employed':
        return { text: '在职中', color: 'bg-success-500', textColor: 'text-success-700', bgLight: 'bg-success-50', border: 'border-success-200' };
      case 'interviewing':
        return { text: '面试中', color: 'bg-brand-500', textColor: 'text-brand-700', bgLight: 'bg-brand-50', border: 'border-brand-200' };
      case 'onboarding':
        return { text: '入职中', color: 'bg-accent-500', textColor: 'text-accent-700', bgLight: 'bg-accent-50', border: 'border-accent-200' };
      case 'idle':
        return { text: '待业中', color: 'bg-warning-500', textColor: 'text-warning-700', bgLight: 'bg-warning-50', border: 'border-warning-200' };
      default:
        return { text: '已离职', color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

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

  if (loading || !worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  const st = statusConfig(worker.status);
  const currentEmployment = worker.performanceHistory.find(p => !p.endDate);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 pt-12 pb-28 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-8 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
              >
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
                  {currentEmployment && (
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm',
                      st.bgLight, st.textColor, 'border', st.border
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', st.color)} />
                      {st.text}
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/80 flex items-center gap-2 mb-2">
                  <Phone size={13} />
                  <span className="tracking-wide tabular-nums">{worker.phone}</span>
                  <span className="text-white/40">·</span>
                  <span>{worker.age}岁</span>
                  <span className="text-white/40">·</span>
                  <span>{worker.gender === 'male' ? '♂' : '♀'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {worker.idCardVerified ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500/90 backdrop-blur text-[11px] font-bold shadow-md">
                      <BadgeCheck size={13} />
                      已实名认证
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-medium border border-white/20">
                      <ShieldAlert size={13} />
                      未实名认证
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px]">
                    <Star size={11} className="text-warning-300 fill-warning-300" />
                    信用优秀
                  </div>
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
                      <span className="text-[10px] text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded-full font-bold">
                        必做
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      完成实名认证后方可预约面试、领取补贴。系统采用银行级加密，保护您的隐私。
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-warning-50 to-accent-50 rounded-2xl p-4 mb-4 border border-warning-100">
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-success-500" />
                      全自动识别，无需手填
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-success-500" />
                      公安部权威数据核验
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-success-500" />
                      全程加密传输
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-success-500" />
                      仅需 10 秒
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleOcrVerify}
                  disabled={ocrLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warning-500 via-accent-500 to-orange-400 text-white font-bold shadow-lg shadow-accent-500/30 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {ocrLoading ? (
                    <><Loader2 size={18} className="animate-spin" />识别中，请将身份证对准框内...</>
                  ) : (
                    <><ScanLine size={18} />📷 一键身份证核验</>
                  )}
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
                      <span className="text-[10px] text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-bold border border-success-100">
                        ✓ 已认证
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                      认证时间：2025-06-19 · 永久有效
                    </p>
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
                        <div className="font-bold text-gray-800 tracking-wider tabular-nums">
                          {worker.idCardOcrData.idNumber}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-gray-400 mb-1">户籍地址</div>
                        <div className="font-medium text-gray-700 leading-snug">
                          {worker.idCardOcrData.address}
                        </div>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-accent-500" />
                💎 信用评分
              </h2>
              <div className="flex items-center gap-1 text-[10px] text-brand-500 bg-brand-50 px-2 py-1 rounded-full font-bold">
                <Sparkles size={11} />
                击败了 82% 的工友
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <CreditGauge score={worker.creditScore} size={220} strokeWidth={20} />
            </div>

            <div className="bg-gradient-to-br from-brand-50 to-cyan-50 rounded-2xl p-4 mt-3 border border-brand-100/50">
              <div className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1">
                <ShieldCheck size={13} className="text-brand-500" />
                信用分说明 & 提升建议
              </div>
              <ul className="space-y-2 text-[11px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-success-100 text-success-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold">✓</span>
                  <span><b>履约记录：</b>在职工厂越稳定、在职天数越长，信用分越高。当前历史在职天数 <b className="text-brand-600">706 天</b>。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-success-100 text-success-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold">✓</span>
                  <span><b>认证完善：</b>完成实名认证 +10 分，持有技能证每证 +3~5 分。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold">!</span>
                  <span><b>异常扣分：</b>面试爽约 -15 分/次，异常离岗 -20 分/次。建议提前与经纪人沟通。</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: '守约率', val: '96%', color: 'text-success-600' },
                { label: '在职厂', val: `${worker.performanceHistory.length}家`, color: 'text-brand-600' },
                { label: '总天数', val: `${worker.performanceHistory.reduce((s, p) => s + p.daysWorked, 0)}天`, color: 'text-accent-600' },
                { label: '技能证', val: `${worker.skills.length}本`, color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="text-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={cn('text-lg font-black tabular-nums', s.color)}>{s.val}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-purple-500" />
                📜 技能认证
              </h2>
              <button className="text-[11px] text-brand-500 font-bold bg-brand-50 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors flex items-center gap-0.5">
                <CreditCard size={11} />
                + 上传新证
              </button>
            </div>

            <div className="space-y-3">
              {worker.skills.map((skill: SkillCert, i: number) => (
                <div
                  key={i}
                  className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                      i % 4 === 0 && 'bg-gradient-to-br from-brand-400 to-brand-600',
                      i % 4 === 1 && 'bg-gradient-to-br from-accent-400 to-accent-600',
                      i % 4 === 2 && 'bg-gradient-to-br from-purple-400 to-purple-600',
                      i % 4 === 3 && 'bg-gradient-to-br from-success-400 to-success-600',
                    )}>
                      <Award size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 leading-tight">{skill.name}</h3>
                        <span className="flex-shrink-0 text-[10px] text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-bold border border-success-100 flex items-center gap-0.5">
                          <FileCheck size={9} />
                          已核验
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
                        <Building2 size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{skill.issuer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Calendar size={10} className="flex-shrink-0" />
                        <span>发证日期：{skill.certifiedAt}</span>
                        <ChevronRight size={12} className="ml-auto text-gray-300 group-hover:text-brand-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-success-500" />
                📊 历史履约记录
              </h2>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                共 {worker.performanceHistory.length} 条
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/70 text-gray-500">
                    <th className="py-3 px-3 text-left font-bold">工厂/岗位</th>
                    <th className="py-3 px-2 text-center font-bold">在职</th>
                    <th className="py-3 px-2 text-center font-bold">离职类型</th>
                  </tr>
                </thead>
                <tbody>
                  {worker.performanceHistory.map((p: PerformanceRecord, i: number) => {
                    const lt = leaveTypeConfig(p.endDate ? p.leaveType : undefined);
                    return (
                      <tr
                        key={i}
                        className={cn(
                          'border-t border-gray-50 transition-colors hover:bg-brand-50/30',
                          !p.endDate && 'bg-success-50/40'
                        )}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-800 truncate max-w-[140px]">{p.factoryName}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Briefcase size={9} />
                            {p.jobTitle}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 tabular-nums">
                            <Calendar size={9} />
                            {p.startDate.slice(2)}
                            {p.endDate ? ` ~ ${p.endDate.slice(2)}` : ' ~ 至今'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-base font-black text-brand-600 tabular-nums">{p.daysWorked}</div>
                          <div className="text-[9px] text-gray-400">天</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border text-[10px] font-bold',
                            lt.color
                          )}>
                            <lt.icon size={9} />
                            {lt.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-r from-brand-50 via-white to-accent-50 rounded-2xl p-4 border border-brand-100/50 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock size={16} className="text-white" />
              </div>
              <div className="flex-1 text-xs text-gray-600 leading-relaxed">
                <div className="font-bold text-gray-800 mb-0.5">累计工作 <span className="text-brand-600">{worker.performanceHistory.reduce((s, p) => s + p.daysWorked, 0)}</span> 天 · 平均每厂 <span className="text-brand-600">{Math.round(worker.performanceHistory.reduce((s, p) => s + p.daysWorked, 0) / worker.performanceHistory.length)}</span> 天</div>
                您的履约记录表现优秀，稳定的在职工厂经历将帮助您获得更高信用分、更多高工资岗位推荐和更高补贴额度。
              </div>
            </div>
          </div>
        </div>

        {currentEmployment && (
          <div className="px-4 mb-5">
            <div className="bg-gradient-to-br from-success-500 via-success-600 to-emerald-600 text-white rounded-3xl p-5 shadow-xl shadow-success-500/25 relative overflow-hidden">
              <div className="absolute -top-10 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={30} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/70 mb-0.5 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur font-bold">当前在职</span>
                    <span>· {currentEmployment.startDate} 入职</span>
                  </div>
                  <div className="font-bold text-lg truncate">{currentEmployment.factoryName}</div>
                  <div className="text-sm text-white/80 mt-0.5">
                    {currentEmployment.jobTitle} · 已在岗 <b className="text-white">{currentEmployment.daysWorked}</b> 天
                  </div>
                </div>
                <ChevronRight size={22} className="text-white/70 flex-shrink-0" />
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mb-6 grid grid-cols-2 gap-3">
          <button className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center gap-2 hover:shadow-card-hover hover:border-brand-200 transition-all active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
              <LogOut size={20} />
            </div>
            <span className="text-sm font-bold text-gray-800">退出登录</span>
          </button>
          <button className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center gap-2 hover:shadow-card-hover hover:border-brand-200 transition-all active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Settings size={20} />
            </div>
            <span className="text-sm font-bold text-gray-800">账号设置</span>
          </button>
        </div>
      </div>

      {showOcrModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
            {!ocrSuccess ? (
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <ScanLine size={30} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">正在识别身份证...</h3>
                  <p className="text-sm text-gray-500">请将身份证正面放入取景框内</p>
                </div>

                <div className="relative mx-auto w-full max-w-[260px] aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-dashed border-brand-300 overflow-hidden mb-5">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <CreditCard size={40} className="mx-auto mb-2 opacity-40" />
                      <div className="text-[10px]">身份证正面</div>
                    </div>
                  </div>
                  <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-pulse" style={{ animation: 'scanMove 2s ease-in-out infinite' }} />
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-brand-500 rounded-tl" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-brand-500 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-brand-500 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-brand-500 rounded-br" />
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-gray-500 mb-5">
                  <div className="flex items-center gap-1.5">
                    {ocrLoading ? <Loader2 size={13} className="animate-spin text-brand-500" /> : <CheckCircle2 size={13} className="text-success-500" />}
                    检测身份证边框
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ocrLoading ? <Loader2 size={13} className="animate-spin text-brand-500" /> : <CheckCircle2 size={13} className="text-success-500" />}
                    OCR 文字识别
                  </div>
                </div>

                <button
                  onClick={() => { setShowOcrModal(false); setOcrSuccess(false); }}
                  disabled={ocrLoading}
                  className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-xl shadow-success-500/30 animate-in zoom-in-95 fade-in duration-500">
                  <BadgeCheck size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">🎉 实名认证成功！</h3>
                <p className="text-center text-sm text-gray-500 leading-relaxed mb-5">
                  您的身份信息已通过公安部权威核验<br/>
                  现在可以预约面试、领取稳岗补贴啦！
                </p>
                <div className="bg-gradient-to-br from-success-50 to-emerald-50 rounded-2xl p-4 mb-5 border border-success-100">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 mb-0.5">姓名</div>
                      <div className="font-bold text-gray-800">{worker.idCardOcrData?.name}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">身份证</div>
                      <div className="font-bold text-gray-800 tabular-nums">{worker.idCardOcrData?.idNumber}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOcrModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all"
                >
                  太棒了，知道了
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanMove {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}
