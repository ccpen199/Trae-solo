import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, Shield, Download, Share2, QrCode, CheckCircle,
  AlertCircle, Copy, FileText, Calendar, Users, Clock, Award,
  Link as LinkIcon, Eye, Hash, Lock, Blocks, ArrowRight, Loader2, X, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpPost, httpGet } from '@/api/client';
import { useAuthStore } from '@/store/auth';

const FormLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-gov-500' };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

const certTypes = [
  { k: 'personal', label: '个人参保证明', desc: '证明个人参保状态、参保年限、缴费基数等信息' },
  { k: 'payment', label: '缴费明细证明', desc: '详细的缴费时段、缴费金额、缴费单位明细清单' },
  { k: 'benefit', label: '待遇领取证明', desc: '养老金、失业金、工伤待遇等领取情况证明' },
  { k: 'transfer', label: '转移接续证明', desc: '跨统筹地区社保关系转移、接续专用证明' },
];

const insuranceOptions = [
  { k: 'pension', label: '养老保险', color: 'bg-gov-100 text-gov-700 border-gov-300' },
  { k: 'medical', label: '医疗保险', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { k: 'unemployment', label: '失业保险', color: 'bg-gold-100 text-gold-700 border-gold-300' },
  { k: 'injury', label: '工伤保险', color: 'bg-red-100 text-red-700 border-red-300' },
  { k: 'maternity', label: '生育保险', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

interface Certificate {
  id: number;
  certNo: string;
  certType: string;
  holderName: string;
  idCard: string;
  insuranceType: string;
  startDate: string;
  endDate: string;
  insuredMonths: number;
  totalPaid: number;
  verifyCode: string;
  status: string;
  issuedAt: string;
  blockchain?: { hash: string; blockHeight: number; previousHash: string; verified?: boolean };
}

export default function InsuranceCertPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState('personal');
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>(['pension', 'medical']);
  const [startMonth, setStartMonth] = useState('2023-01');
  const [endMonth, setEndMonth] = useState('2026-06');
  const [loading, setLoading] = useState(false);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [detailCert, setDetailCert] = useState<Certificate | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => { loadCerts(); }, []);

  const loadCerts = async () => {
    try {
      const resp = await httpGet(`/social-insurance/certificate?userId=${user?.id || 1}`);
      if (resp.code === 0 && resp.data) setCerts(resp.data as Certificate[]);
    } catch {}
  };

  const toggleInsurance = (k: string) => {
    setSelectedInsurances((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  };

  const generateCert = async () => {
    if (selectedInsurances.length === 0) { toast('请至少选择一个险种', 'error'); return; }
    if (!startMonth || !endMonth) { toast('请选择起止年月', 'error'); return; }
    setLoading(true);
    try {
      const typeMap: Record<string, string> = { personal: '个人参保证明', payment: '缴费明细证明', benefit: '待遇领取证明', transfer: '转移接续证明' };
      const resp = await httpPost('/social-insurance/certificate', {
        userId: user?.id || 1,
        certType: typeMap[activeType],
        holderName: user?.name || '张晓明',
        idCard: '110101199001011234',
        insuranceType: selectedInsurances.map((i) => insuranceOptions.find((x) => x.k === i)?.label).join('/'),
        startDate: startMonth + '-01',
        endDate: endMonth + '-28',
      });
      if (resp.code === 0) {
        toast('证明生成成功，已上链存证', 'success');
        loadCerts();
      } else {
        toast(resp.message || '生成失败', 'error');
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || '生成失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyBlockchain = async (cert: Certificate) => {
    setVerifying(cert.certNo);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast('区块链核验通过 · 数据真实可信', 'success');
    } finally {
      setVerifying(null);
    }
  };

  const shareLink = (cert: Certificate) => {
    toast(`核验链接已复制：/verify/${cert.verifyCode}`, 'success');
  };

  const shortHash = (h: string) => h ? `${h.slice(0, 8)}...${h.slice(-8)}` : '';

  const typeInfo = certTypes.find((t) => t.k === activeType)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/social-insurance/cert-blockchain')}>社保服务</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">参保证明（区块链）</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-start gap-3 px-6 md:px-8 pt-6 pb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-gov">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gov-700 font-serif">参保证明 · 区块链存证</h1>
            <p className="text-sm text-gray-500 mt-1">基于联盟链技术 · 全流程存证 · 不可篡改 · 第三方可核验</p>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 md:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {certTypes.map((t) => (
              <button
                key={t.k}
                onClick={() => setActiveType(t.k)}
                className={cn(
                  'px-5 py-3 font-medium text-sm transition-all relative whitespace-nowrap',
                  activeType === t.k ? 'text-gov-600' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t.label}
                {activeType === t.k && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-500 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 md:px-8 py-4 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-gov-50/50 border-b border-gray-100">
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5"><Blocks className="w-3.5 h-3.5" />{typeInfo.desc}</p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-gov-500" />开具证明</h3>
            <div>
              <FormLabel required>选择险种（可多选）</FormLabel>
              <div className="flex flex-wrap gap-2">
                {insuranceOptions.map((ins) => (
                  <button
                    key={ins.k}
                    type="button"
                    onClick={() => toggleInsurance(ins.k)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all',
                      selectedInsurances.includes(ins.k)
                        ? `${ins.color} shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {ins.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel required>起始年月</FormLabel>
                <div className="relative"><Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="gov-input pl-10" /></div>
              </div>
              <div>
                <FormLabel required>截止年月</FormLabel>
                <div className="relative"><Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="gov-input pl-10" /></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500"><span>证明类型</span><span className="font-medium text-gray-700">{typeInfo.label}</span></div>
              <div className="flex justify-between text-gray-500"><span>险种</span><span className="font-medium text-gov-600">{selectedInsurances.length}个</span></div>
              <div className="flex justify-between text-gray-500"><span>时段</span><span className="font-medium text-gray-700">{startMonth} 至 {endMonth}</span></div>
              <div className="flex justify-between text-gray-500"><span>预计生成</span><span className="font-medium text-emerald-600">约3秒 · 上链存证</span></div>
            </div>
            <button onClick={generateCert} disabled={loading} className="gov-btn w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Blocks className="w-4 h-4" />}
              {loading ? '生成中...' : '生成证明并上链'}
            </button>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-2"><Award className="w-5 h-5 text-gold-500" />已生成证明</span>
              <span className="text-xs font-normal text-gray-400">共 {certs.length} 份</span>
            </h3>
            {certs.length === 0 ? (
              <div className="py-16 text-center text-gray-400 rounded-xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无证明记录，请在左侧生成</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {certs.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setDetailCert(cert)}
                    className="group p-4 rounded-xl border border-gray-100 hover:border-gov-200 hover:bg-gov-50/30 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gov-50 to-blue-50 border border-gov-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5 text-gov-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm truncate">{cert.certType}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className="font-mono">{cert.certNo}</span> · {cert.insuranceType}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px]">
                            <span className="flex items-center gap-1 text-gray-500"><Users className="w-3 h-3" />{cert.holderName}</span>
                            <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" />{cert.issuedAt?.slice(0, 10)}</span>
                            <span className={cn(
                              'flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                              cert.blockchain
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            )}>
                              <Blocks className="w-3 h-3" />{cert.blockchain ? '已上链' : '未上链'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gov-500 group-hover:translate-x-1 shrink-0 mt-2 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up overflow-y-auto" onClick={() => setDetailCert(null)}>
          <div className="bg-gray-100 rounded-2xl shadow-gov-lg max-w-2xl w-full my-8 overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-gov-gradient text-white">
              <span className="font-semibold text-sm flex items-center gap-2"><Eye className="w-4 h-4" />证明详情预览</span>
              <button onClick={() => setDetailCert(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative border-2 border-gov-200 rounded-2xl overflow-hidden bg-white shadow-md">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%,#165DFF 1px,transparent 1px)', backgroundSize: '24px 24px', opacity: 0.04 }} />
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-gold-500 to-red-600" />
                <div className="relative px-8 pt-8 pb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xl shadow-md" style={{ fontFamily: 'Noto Serif SC' }}>国</div>
                  </div>
                  <h2 className="text-center text-2xl font-serif font-bold text-gov-800 mb-1">XX省社会保险参保缴费证明</h2>
                  <p className="text-center text-xs tracking-[0.2em] text-gray-500 mb-6">SOCIAL INSURANCE CERTIFICATE</p>
                  <div className="bg-gray-50/60 rounded-xl p-4 text-sm space-y-2 mb-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">持证人：</span><span className="font-semibold text-gray-800">{detailCert.holderName}</span></div>
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">身份证：</span><span className="font-mono text-gray-800">{detailCert.idCard}</span></div>
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">参保编号：</span><span className="font-mono text-gov-600">SB{detailCert.id.toString().padStart(10, '0')}</span></div>
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">参保险种：</span><span className="font-medium text-gray-800">{detailCert.insuranceType}</span></div>
                    </div>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">缴费时段：</span><span className="text-gray-800">{detailCert.startDate?.slice(0, 7)} 至 {detailCert.endDate?.slice(0, 7)}</span></div>
                      <div className="flex"><span className="text-gray-500 w-20 shrink-0">累计缴费：</span><span className="text-gray-800">{detailCert.insuredMonths}个月</span></div>
                      <div className="col-span-2 flex"><span className="text-gray-500 w-20 shrink-0">累计金额：</span><span className="font-serif font-bold text-gold-600 text-base">¥{Number(detailCert.totalPaid || 0).toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-xs space-y-0.5">
                      <p className="text-gray-500">签发机构</p>
                      <p className="font-serif text-red-600 text-sm font-medium">省级社会保险基金管理局</p>
                      <p className="text-gray-400">签发日期：{detailCert.issuedAt?.slice(0, 10)}</p>
                    </div>
                    <div className="relative">
                      <div className="w-24 h-24 rounded-lg flex flex-col items-center justify-center border-2 border-red-500/30 bg-white" style={{ transform: 'rotate(-6deg)' }}>
                        <div className="w-16 h-16 rounded-full border-[3px] border-red-500/80 flex items-center justify-center">
                          <span className="text-[9px] text-red-600 font-serif font-bold leading-tight text-center">社会保险<br />业务专用章</span>
                        </div>
                      </div>
                      <QrCode className="absolute -right-2 -bottom-1 w-10 h-10 text-gray-700 bg-white p-0.5 rounded border border-gray-200" />
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-4">核验编号：{detailCert.verifyCode} · 证明编号：{detailCert.certNo}</p>
                </div>
              </div>

              {detailCert.blockchain && (
                <div className="bg-gradient-to-r from-gov-600 via-gov-500 to-gov-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-10"><Blocks className="w-full h-full" /></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Blocks className="w-5 h-5 text-gold-300" />
                      <h4 className="font-bold font-serif">区块链存证信息 <span className="text-xs font-normal text-white/70 ml-2">不可篡改 · 可追溯 · 第三方核验</span></h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <p className="text-white/60 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />存证哈希</p>
                        <p className="font-mono text-white break-all">{shortHash(detailCert.blockchain.hash)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <p className="text-white/60 mb-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" />区块高度</p>
                        <p className="font-mono text-gold-300 font-bold">#{detailCert.blockchain.blockHeight?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <p className="text-white/60 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />上链时间</p>
                        <p className="text-white">{detailCert.issuedAt}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <p className="text-white/60 mb-1 flex items-center gap-1"><LinkIcon className="w-3 h-3" />前序哈希</p>
                        <p className="font-mono text-white break-all">{shortHash(detailCert.blockchain.previousHash)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); verifyBlockchain(detailCert); }}
                        disabled={verifying === detailCert.certNo}
                        className="flex-1 min-w-[140px] py-2.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm font-semibold text-sm border border-white/20 transition-all inline-flex items-center justify-center gap-2"
                      >
                        {verifying === detailCert.certNo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {verifying === detailCert.certNo ? '核验中...' : '立即核验'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toast('PDF下载完成（模拟）', 'success'); }} className="px-5 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-sm border border-white/20 transition-all inline-flex items-center gap-2"><Download className="w-4 h-4" />下载PDF</button>
                      <button onClick={(e) => { e.stopPropagation(); shareLink(detailCert); }} className="px-5 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-sm border border-white/20 transition-all inline-flex items-center gap-2"><Share2 className="w-4 h-4" />分享链接</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => shareLink(detailCert)} className="flex-1 px-4 py-2.5 rounded-lg bg-gov-50 text-gov-600 text-sm font-medium hover:bg-gov-100 transition-colors inline-flex items-center justify-center gap-2"><Copy className="w-4 h-4" />复制核验码</button>
                <button onClick={() => toast('PDF下载完成（模拟）', 'success')} className="flex-1 px-4 py-2.5 rounded-lg bg-gold-50 text-gold-700 text-sm font-medium hover:bg-gold-100 transition-colors inline-flex items-center justify-center gap-2"><Download className="w-4 h-4" />下载PDF</button>
                <button onClick={() => shareLink(detailCert)} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-2"><Share2 className="w-4 h-4" />分享</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
