import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, Award, Shield, QrCode, Download, Share2,
  CheckCircle2, X, Eye, Copy, Calendar, Fingerprint,
  FileText, GraduationCap, User, AlertCircle, Clock, Loader2
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

const categoryTabs = [
  { k: 'all', label: '全部证照', icon: Award },
  { k: 'renshe', label: '人社类', icon: Shield },
  { k: 'zizhi', label: '资质类', icon: GraduationCap },
  { k: 'other', label: '其他', icon: FileText },
];

interface CertificateItem {
  id: number;
  name: string;
  level?: string;
  holder: string;
  idCard: string;
  certNo: string;
  queryNo: string;
  issuedDate: string;
  validFrom: string;
  validTo: string;
  expired?: boolean;
  category: string;
  issuer: string;
  verifyCode: string;
  gradient: string;
  iconColor: string;
  icon: any;
}

const mockCerts: CertificateItem[] = [
  { id: 1, name: '社会保障卡（电子社保卡）', holder: '张晓明', idCard: '110101199001011234', certNo: 'SBK110101199001011234', queryNo: 'SB20240100128756', issuedDate: '2024-01-15', validFrom: '2024-01-15', validTo: '长期有效', category: 'renshe', issuer: '省级人力资源和社会保障厅', verifyCode: 'SBK-VERIFY-8F2A7C', gradient: 'from-gov-500 via-blue-600 to-gov-800', iconColor: 'text-gov-100', icon: Shield },
  { id: 2, name: '中级工程师资格证书', level: '中级', holder: '张晓明', idCard: '110101199001011234', certNo: 'ZC202403100128', queryNo: 'HRRS20240310-8891', issuedDate: '2024-03-20', validFrom: '2024-03-20', validTo: '长期有效', category: 'renshe', issuer: '省级人力资源和社会保障厅', verifyCode: 'ZC-VERIFY-A3D9E1', gradient: 'from-gold-500 via-amber-500 to-orange-600', iconColor: 'text-gold-100', icon: Award },
  { id: 3, name: '高级软件工程师职业技能等级证书', level: '高级（三级）', holder: '张晓明', idCard: '110101199001011234', certNo: 'JN202506100128', queryNo: 'OSTA-2025-6788912', issuedDate: '2025-06-18', validFrom: '2025-06-18', validTo: '长期有效', category: 'renshe', issuer: '省级职业技能鉴定指导中心', verifyCode: 'JN-VERIFY-K7M3P2', gradient: 'from-emerald-500 via-teal-600 to-cyan-700', iconColor: 'text-emerald-100', icon: GraduationCap },
  { id: 4, name: '失业保险待遇领取资格凭证', holder: '张晓明', idCard: '110101199001011234', certNo: 'SYD2026062000128', queryNo: 'RS2026-0620-7712', issuedDate: '2026-06-20', validFrom: '2026-06-20', validTo: '2026-12-20', category: 'renshe', issuer: '省级社会保险基金管理局', verifyCode: 'SYD-VERIFY-202606', gradient: 'from-violet-500 via-purple-600 to-fuchsia-700', iconColor: 'text-violet-100', icon: FileText },
  { id: 5, name: '专业技术人员继续教育合格证明', holder: '张晓明', idCard: '110101199001011234', certNo: 'JX20250890', queryNo: 'JXCX-2025-88291', issuedDate: '2025-08-31', validFrom: '2025-01-01', validTo: '2025-12-31', category: 'renshe', issuer: '省级专业技术人员继续教育中心', verifyCode: 'JX-VERIFY-202588', gradient: 'from-blue-500 via-indigo-600 to-violet-700', iconColor: 'text-blue-100', icon: GraduationCap },
  { id: 6, name: '创业培训合格证书', level: 'SYB/IYB', holder: '张晓明', idCard: '110101199001011234', certNo: 'CY202503100456', queryNo: 'CYJD-2025-03127', issuedDate: '2025-03-30', validFrom: '2025-03-30', validTo: '长期有效', category: 'zizhi', issuer: '省级劳动就业服务局', verifyCode: 'CY-VERIFY-2025PX', gradient: 'from-rose-500 via-pink-600 to-fuchsia-700', iconColor: 'text-rose-100', icon: Award },
  { id: 7, name: '一级建造师注册执业证书', level: '一级', holder: '张晓明', idCard: '110101199001011234', certNo: 'JZS110000202400128', queryNo: 'MOHURD-CX-7788129', issuedDate: '2024-09-10', validFrom: '2024-09-10', validTo: '2027-09-09', expired: false, category: 'zizhi', issuer: '住房和城乡建设部', verifyCode: 'JZS-VERIFY-202709', gradient: 'from-orange-500 via-red-500 to-rose-600', iconColor: 'text-orange-100', icon: Shield },
  { id: 8, name: '普通话水平测试等级证书', level: '一级乙等', holder: '张晓明', idCard: '110101199001011234', certNo: 'PSC20231100128', queryNo: 'CLTT-2023-11-88761', issuedDate: '2023-11-25', validFrom: '2023-11-25', validTo: '长期有效', category: 'other', issuer: '国家语言文字工作委员会', verifyCode: 'PSC-VERIFY-202311', gradient: 'from-teal-500 via-cyan-600 to-sky-700', iconColor: 'text-teal-100', icon: Award },
];

export default function CertificatesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [detailCert, setDetailCert] = useState<CertificateItem | null>(null);
  const [certs, setCerts] = useState<CertificateItem[]>(mockCerts);
  const [sharing, setSharing] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await httpGet(`/user/${user?.id || 1}/certificates`);
        if (resp.code === 0 && resp.data && (resp.data as any[]).length > 0) setCerts(resp.data as CertificateItem[]);
      } catch {}
    };
    load();
  }, []);

  const filtered = activeCategory === 'all' ? certs : certs.filter((c) => c.category === activeCategory);
  const stats = { all: certs.length, renshe: certs.filter((c) => c.category === 'renshe').length, zizhi: certs.filter((c) => c.category === 'zizhi').length, other: certs.filter((c) => c.category === 'other').length };

  const shareCert = async (cert: CertificateItem) => {
    setSharing(cert.id);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast(`核验链接已复制：/verify/${cert.verifyCode}`, 'success');
    } finally { setSharing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/user/certificates')}>个人中心</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">我的证照</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 pb-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center shrink-0 shadow-gov">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gov-700 font-serif">我的电子证照</h1>
              <p className="text-sm text-gray-500 mt-0.5">省级电子证照库权威签发 · 真实有效 · 可亮证可核验</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: '持证总数', value: stats.all, color: 'text-gov-600' },
              { label: '人社类', value: stats.renshe, color: 'text-emerald-600' },
              { label: '资质类', value: stats.zizhi, color: 'text-gold-600' },
            ].map((s, i) => (
              <div key={i} className="text-center px-3">
                <p className={cn('text-2xl font-bold font-serif', s.color)}>{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 px-4 md:px-8">
          <div className="flex gap-1 md:gap-3 overflow-x-auto -mb-px pb-1">
            {categoryTabs.map((t) => {
              const Icon = t.icon;
              const active = activeCategory === t.k;
              const c = stats[t.k as keyof typeof stats];
              return (
                <button key={t.k} onClick={() => setActiveCategory(t.k)} className={cn(
                  'px-4 md:px-6 py-3.5 transition-all whitespace-nowrap border-b-2 inline-flex items-center gap-2 font-medium text-sm',
                  active ? 'text-gov-600 border-gov-500 bg-gov-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'
                )}>
                  <Icon className={cn('w-4 h-4', active && 'text-gov-600')} />{t.label}
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', active ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-500')}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-8">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><Award className="w-10 h-10 text-gray-300" /></div>
              <p className="text-gray-400 font-medium">暂无此类证照</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-6">
              {filtered.map((cert) => {
                const Ic = cert.icon;
                return (
                  <div
                    key={cert.id}
                    onClick={() => setDetailCert(cert)}
                    className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-gov-lg hover:-translate-y-1 transition-all duration-300 aspect-[4/5.2]"
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br', cert.gradient)}>
                      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%,rgba(255,255,255,0.18) 0%,transparent 35%),radial-gradient(circle at 15% 85%,rgba(255,255,255,0.14) 0%,transparent 32%)' }} />
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")` }} />
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-red-600" />
                    </div>
                    <div className="absolute inset-0 p-5 md:p-6 flex flex-col text-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm', cert.iconColor)}><Ic className="w-5 h-5" /></div>
                        {cert.expired && <span className="px-2 py-0.5 rounded-md bg-red-500/90 text-[10px] font-bold backdrop-blur-sm inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />已过期</span>}
                      </div>
                      <div className="mb-3">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm mb-2 border border-white/30">
                          <span className="font-serif font-bold text-sm">国</span>
                        </div>
                      </div>
                      <h4 className="text-lg md:text-xl font-bold font-serif leading-tight line-clamp-2 mb-1 drop-shadow-sm">{cert.name}</h4>
                      {cert.level && <p className="text-xs text-white/80 mb-3 inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md w-fit"><Award className="w-3 h-3" />{cert.level}</p>}
                      {!cert.level && <div className="mb-3" />}
                      <div className="mt-auto space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between"><span className="text-white/60">持证人</span><span className="font-medium truncate max-w-[55%]">{cert.holder}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">证照编号</span><span className="font-mono text-[10px] opacity-90 truncate max-w-[55%]">{cert.certNo}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">有效期至</span><span className="font-medium truncate max-w-[55%] text-white/95">{cert.validTo}</span></div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between">
                        <QrCode className="w-7 h-7 text-white/80 bg-white p-1 rounded-md text-gray-700" />
                        <button onClick={(e) => { e.stopPropagation(); }} className="px-3 py-1.5 rounded-md bg-white/20 backdrop-blur-sm text-[11px] font-semibold border border-white/30 hover:bg-white/30 transition-all inline-flex items-center gap-1 group-hover:scale-105">
                          <Eye className="w-3.5 h-3.5" />亮证
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detailCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up overflow-y-auto" onClick={() => setDetailCert(null)}>
          <div className="bg-transparent w-full max-w-2xl my-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2 drop-shadow-lg"><Award className="w-5 h-5 text-gold-400" />证照详情 · 亮证模式</h3>
              <button onClick={() => setDetailCert(null)} className="p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors border border-white/20"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] sm:aspect-[16/11] shadow-2xl animate-fade-in-up">
              <div className={cn('absolute inset-0 bg-gradient-to-br', detailCert.gradient)}>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%,rgba(255,255,255,0.2) 0%,transparent 35%),radial-gradient(circle at 15% 85%,rgba(255,255,255,0.16) 0%,transparent 32%)' }} />
                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E")` }} />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-2 rounded-[22px] border border-white/30" />
                  <div className="absolute inset-4 rounded-[18px] border border-white/15" />
                </div>
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600" />
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-8 border-white/10 animate-[spin_16s_linear_infinite]" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full border-4 border-white/8 animate-[spin_12s_linear_infinite_reverse]" />
              </div>
              <div className="absolute inset-0 p-6 md:p-10 text-white flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg text-2xl md:text-3xl font-serif font-bold tracking-wider">国</div>
                    <div>
                      <p className="text-[10px] md:text-xs text-white/70 tracking-[0.15em] uppercase">Electronic License</p>
                      <p className="text-lg md:text-2xl font-serif font-bold tracking-wider">电子证照</p>
                    </div>
                  </div>
                  <div className={cn('w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg', detailCert.iconColor)}>
                    {(() => { const I = detailCert.icon; return <I className="w-5 h-5 md:w-6 md:h-6" />; })()}
                  </div>
                </div>
                <div className="text-center my-4 md:my-5">
                  <h2 className="text-2xl md:text-4xl font-bold font-serif drop-shadow-lg mb-1.5">{detailCert.name}</h2>
                  <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/70 to-transparent mb-2" />
                  {detailCert.level && <p className="text-sm md:text-base inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 font-semibold"><Award className="w-4 h-4 text-gold-300" />{detailCert.level}</p>}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-start">
                  <div className="md:col-span-3 space-y-2.5 text-sm md:text-base">
                    <div className="grid grid-cols-3 gap-2 p-3 md:p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <div><p className="text-[10px] md:text-xs text-white/60 mb-0.5">持证人</p><p className="font-semibold truncate">{detailCert.holder}</p></div>
                      <div><p className="text-[10px] md:text-xs text-white/60 mb-0.5">身份证号</p><p className="font-mono text-xs md:text-sm truncate">{detailCert.idCard.slice(0,6)}****{detailCert.idCard.slice(-4)}</p></div>
                      <div><p className="text-[10px] md:text-xs text-white/60 mb-0.5">证件编号</p><p className="font-mono text-[10px] md:text-xs truncate">{detailCert.certNo}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3 md:p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs md:text-sm">
                      <div><p className="text-white/60 mb-0.5 text-[10px] md:text-xs">签发机构</p><p className="font-medium line-clamp-2">{detailCert.issuer}</p></div>
                      <div><p className="text-white/60 mb-0.5 text-[10px] md:text-xs">查询编号</p><p className="font-mono text-[10px] md:text-xs">{detailCert.queryNo}</p></div>
                      <div><p className="text-white/60 mb-0.5 text-[10px] md:text-xs">签发日期</p><p className="font-medium">{detailCert.issuedDate}</p></div>
                      <div><p className="text-white/60 mb-0.5 text-[10px] md:text-xs">有效期</p><p className={cn('font-medium', detailCert.expired && 'text-red-200')}>{detailCert.validFrom} 至 {detailCert.validTo}</p></div>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex flex-col items-center gap-3">
                    <div className="p-3 md:p-4 bg-white rounded-2xl shadow-lg">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-gray-100 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                        <div className="grid grid-cols-6 grid-rows-7 gap-px p-2 w-full h-full">
                          {Array.from({ length: 42 }).map((_, i) => <div key={i} className={cn('rounded-[1px]', (i * 31 + 7) % 5 === 0 ? 'bg-gray-800' : 'bg-transparent')} />)}
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-white/85 backdrop-blur-sm py-0.5 text-[8px] text-center text-gray-600 font-mono">SCAN TO VERIFY</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-xs text-white/70 mb-0.5 flex items-center justify-center gap-1"><Fingerprint className="w-3 h-3 md:w-3.5 md:h-3.5" />防伪核验码</p>
                      <p className="font-mono text-xs md:text-sm bg-black/25 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">{detailCert.verifyCode}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-6 pt-4 border-t border-white/25 flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-end gap-3">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                      <div className="absolute inset-0 rounded-full border-[3px] border-red-400/60 flex items-center justify-center animate-[spin_8s_linear_infinite]"><span className="text-[8px] md:text-[9px] text-red-400/80 font-serif font-bold leading-tight text-center whitespace-pre-line">电子证照<br />专用章</span></div>
                      <div className="absolute inset-2 rounded-full border border-red-300/40" />
                    </div>
                    <div className="text-[10px] md:text-xs text-white/70 pb-1">
                      <p>签发日期：{detailCert.issuedDate}</p>
                      <p className="mt-0.5">本电子证照与实体证照具有同等法律效力</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] md:text-xs text-white/60 font-mono max-w-[40%]">
                    <p>查验地址：verify.rs.gov.cn</p>
                    <p className="mt-0.5">证照哈希：{detailCert.verifyCode.slice(-14)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button onClick={() => setDetailCert(null)} className="px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white text-sm font-medium border border-white/20 inline-flex items-center justify-center gap-1.5"><X className="w-4 h-4" />关闭</button>
              <button onClick={() => toast('证照下载完成（模拟PDF）', 'success')} className="px-3 py-2.5 rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all text-white text-sm font-medium border border-white/25 inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" />下载PDF</button>
              <button onClick={() => shareCert(detailCert)} disabled={sharing === detailCert.id} className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 transition-all text-white text-sm font-bold shadow-lg shadow-gold-500/30 inline-flex items-center justify-center gap-1.5 disabled:opacity-70">
                {sharing === detailCert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                分享核验
              </button>
              <button onClick={() => shareCert(detailCert)} className="px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 transition-all text-gov-700 text-sm font-bold shadow-lg inline-flex items-center justify-center gap-1.5"><Copy className="w-4 h-4" />复制链接</button>
            </div>
            {detailCert.expired && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/40 backdrop-blur-sm text-white/90 text-xs md:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-300 shrink-0 mt-0.5" />
                <div><p className="font-semibold text-red-200">证照已过期</p><p className="mt-0.5 text-white/75">该证照已于 {detailCert.validTo} 到期，如需继续使用请按规定办理延续或重新申请。</p></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
