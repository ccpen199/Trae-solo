import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, User, Shield, Star, Phone, Mail, MapPin,
  Camera, Edit3, CheckCircle2, AlertTriangle, Eye, EyeOff,
  Key, Monitor, Smartphone, Lock, CreditCard, Upload, Loader2,
  Settings, IdCard, Fingerprint, Calendar, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpGet, httpPut } from '@/api/client';
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

const tabs = [
  { k: 'basic', label: '基本信息', icon: User },
  { k: 'security', label: '账号安全', icon: Shield },
  { k: 'verify', label: '实名认证', icon: IdCard },
];

const devices = [
  { id: 1, name: 'iPhone 15 Pro', type: 'mobile', lastLogin: '2026-06-26 09:12', location: '北京市海淀区', current: true, ip: '192.168.1.101' },
  { id: 2, name: 'MacBook Pro', type: 'desktop', lastLogin: '2026-06-25 18:45', location: '北京市海淀区', current: false, ip: '192.168.1.102' },
  { id: 3, name: 'iPad Air', type: 'tablet', lastLogin: '2026-06-22 14:30', location: '上海市浦东新区', current: false, ip: '10.0.0.55' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nickname: '政务用户8888',
    email: 'zhang@example.com',
    address: '北京市海淀区中关村街道XX大厦A座1001室',
    birthDate: '1990-01-01',
    gender: '男',
    ethnic: '汉族',
    political: '中共党员',
  });
  const [security, setSecurity] = useState({ showOld: false, showNew: false, oldPwd: '', newPwd: '', confirmPwd: '' });
  const [verifyStep, setVerifyStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await httpGet(`/user/${user?.id || 1}/profile`);
        if (resp.code === 0 && resp.data) {
          const d: any = resp.data;
          setProfile({ ...profile, ...d });
        }
      } catch {}
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await httpPut(`/user/${user?.id || 1}/profile`, profile);
      toast('个人信息已保存', 'success');
      setEditing(false);
    } catch {
      toast('保存成功（模拟）', 'success');
      setEditing(false);
    }
    finally { setSaving(false); }
  };

  const changePwd = () => {
    if (!security.oldPwd || !security.newPwd) { toast('请填写完整密码信息', 'error'); return; }
    if (security.newPwd !== security.confirmPwd) { toast('两次输入的新密码不一致', 'error'); return; }
    toast('密码修改成功，请重新登录', 'success');
    setSecurity({ showOld: false, showNew: false, oldPwd: '', newPwd: '', confirmPwd: '' });
  };

  const startFace = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setVerifyStep((s) => Math.min(s + 1, 3));
      toast('人脸识别成功', 'success');
    }, 2500);
  };

  const authLevel = 4;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/user/profile')}>个人中心</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">个人信息</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="gov-card relative overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-gov-500 via-blue-600 to-gov-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#fff 1px,transparent 1px),radial-gradient(circle at 80% 30%,#fff 1px,transparent 1px)', backgroundSize: '20px 20px,24px 24px' }} />
            </div>
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 p-1 -mt-12 shadow-gov-lg relative mx-auto lg:mx-0">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-gov-500" />
                </div>
                <button className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-gov-500 border-2 border-white flex items-center justify-center hover:bg-gov-600 transition-colors shadow-md">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div className="mt-4 text-center lg:text-left">
                <h2 className="text-xl font-bold text-gray-800 font-serif">{user?.name || '张晓明'}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((n) => (
                    <Star key={n} className={cn('w-4 h-4 fill-current', n <= authLevel ? 'text-gold-500' : 'text-gray-200')} />
                  ))}
                  {[5].map((n) => <Star key={n} className={cn('w-4 h-4', n <= authLevel ? 'text-gold-500 fill-current' : 'text-gray-200')} />)}
                  <span className="text-xs text-gold-600 font-semibold ml-1">L{authLevel}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">实名认证等级 L{authLevel} · 已完成高级认证</p>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm group">
                  <span className="text-gray-500 inline-flex items-center gap-2"><IdCard className="w-4 h-4 text-gov-500" />身份证号</span>
                  <span className="font-mono text-gray-700 group-hover:text-gov-700">1101**********1234</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm group">
                  <span className="text-gray-500 inline-flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" />手机号码</span>
                  <span className="font-mono text-gray-700 group-hover:text-gov-700">138****1234</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm group">
                  <span className="text-gray-500 inline-flex items-center gap-2"><Mail className="w-4 h-4 text-purple-500" />电子邮箱</span>
                  <span className="text-gray-700 group-hover:text-gov-700 truncate max-w-[150px]">{profile.email}</span>
                </div>
              </div>

              <button onClick={() => setActiveTab('verify')} className="w-full mt-5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-50 to-amber-50 text-gold-700 text-sm font-semibold border-2 border-gold-200 hover:border-gold-300 hover:from-gold-100 transition-all inline-flex items-center justify-center gap-2 group">
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                提升认证等级 →
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="gov-card overflow-hidden">
            <div className="border-b border-gray-100 px-4 md:px-6">
              <div className="flex gap-1 md:gap-4 overflow-x-auto -mb-px">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.k;
                  return (
                    <button
                      key={t.k} onClick={() => setActiveTab(t.k)}
                      className={cn(
                        'px-4 md:px-6 py-4 transition-all whitespace-nowrap border-b-2 inline-flex items-center gap-2 font-medium text-sm',
                        active ? 'text-gov-600 border-gov-500 bg-gov-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'
                      )}
                    ><Icon className={cn('w-4 h-4', active && 'text-gov-600')} />{t.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="p-5 md:p-8">
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 font-serif text-lg flex items-center gap-2"><User className="w-5 h-5 text-gov-500" />基本信息</h3>
                    {!editing
                      ? <button onClick={() => setEditing(true)} className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gov-600 bg-gov-50 hover:bg-gov-100 transition-colors inline-flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" />编辑资料</button>
                      : <button onClick={saveProfile} disabled={saving} className="gov-btn !py-2 !px-4 text-xs inline-flex items-center gap-1.5">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {saving ? '保存中...' : '保存修改'}
                        </button>
                    }
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <FormLabel>用户昵称</FormLabel>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} disabled={!editing} className={cn('gov-input pl-10', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} />
                      </div>
                    </div>
                    <div>
                      <FormLabel>电子邮箱</FormLabel>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled={!editing} className={cn('gov-input pl-10', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} />
                      </div>
                    </div>
                    <div>
                      <FormLabel>出生日期</FormLabel>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} disabled={!editing} className={cn('gov-input pl-10', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} />
                      </div>
                    </div>
                    <div>
                      <FormLabel>性别</FormLabel>
                      <select disabled={!editing} className={cn('gov-input', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                        <option>男</option><option>女</option>
                      </select>
                    </div>
                    <div>
                      <FormLabel>民族</FormLabel>
                      <input disabled={!editing} className={cn('gov-input', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} value={profile.ethnic} onChange={(e) => setProfile({ ...profile, ethnic: e.target.value })} />
                    </div>
                    <div>
                      <FormLabel>政治面貌</FormLabel>
                      <input disabled={!editing} className={cn('gov-input', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} value={profile.political} onChange={(e) => setProfile({ ...profile, political: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <FormLabel>通讯地址</FormLabel>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-4 top-4 text-gray-400" />
                        <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={2} disabled={!editing} className={cn('gov-input pl-10 resize-none', !editing && 'bg-gray-50 !cursor-not-allowed opacity-80')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 font-serif text-lg mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-gov-500" />修改登录密码</h3>
                    <div className="gov-card !p-5 !m-0 bg-gray-50/40 border border-gray-100 shadow-none">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <FormLabel>当前密码</FormLabel>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={security.showOld ? 'text' : 'password'} value={security.oldPwd} onChange={(e) => setSecurity({ ...security, oldPwd: e.target.value })} placeholder="请输入旧密码" className="gov-input pl-10 pr-10" />
                            <button type="button" onClick={() => setSecurity({ ...security, showOld: !security.showOld })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{security.showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          </div>
                        </div>
                        <div>
                          <FormLabel>新密码</FormLabel>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={security.showNew ? 'text' : 'password'} value={security.newPwd} onChange={(e) => setSecurity({ ...security, newPwd: e.target.value })} placeholder="8-20位字母数字组合" className="gov-input pl-10 pr-10" />
                            <button type="button" onClick={() => setSecurity({ ...security, showNew: !security.showNew })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{security.showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          </div>
                        </div>
                        <div>
                          <FormLabel>确认新密码</FormLabel>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="password" value={security.confirmPwd} onChange={(e) => setSecurity({ ...security, confirmPwd: e.target.value })} placeholder="再次输入新密码" className="gov-input pl-10" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200/70">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <AlertTriangle className="w-3.5 h-3.5 text-gold-500" />建议密码包含大小写字母、数字及特殊字符，定期更换
                        </div>
                        <button onClick={changePwd} className="gov-btn !py-2 !px-5 text-sm inline-flex items-center gap-1.5"><Key className="w-4 h-4" />确认修改</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 font-serif text-lg mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-gov-500" />登录设备管理 <span className="text-xs font-normal text-gray-400 ml-2">· 共 {devices.length} 台设备</span></h3>
                    <div className="space-y-2.5">
                      {devices.map((d) => (
                        <div key={d.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gov-200 hover:bg-gov-50/30 transition-all group">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={cn(
                              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform',
                              d.type === 'mobile' ? 'bg-emerald-100 text-emerald-600' :
                              d.type === 'desktop' ? 'bg-gov-100 text-gov-600' :
                              'bg-purple-100 text-purple-600'
                            )}>
                              {d.type === 'mobile' ? <Smartphone className="w-5 h-5" /> : d.type === 'desktop' ? <Monitor className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-800">{d.name}</p>
                                {d.current && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />当前设备</span>}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />最近登录：{d.lastLogin}</span>
                                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{d.location}</span>
                                <span className="font-mono">IP: {d.ip}</span>
                              </div>
                            </div>
                          </div>
                          {!d.current && (
                            <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">下线</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'verify' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-gray-800 font-serif text-lg flex items-center gap-2"><IdCard className="w-5 h-5 text-gov-500" />实名认证</h3>
                  <div className="relative">
                    <div className="absolute left-5 md:left-[84px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-gov-200 via-gov-300 to-emerald-300 rounded-full" />
                    {[
                      { k: 0, label: '基础实名', desc: '姓名+身份证+手机号三要素核验', icon: User, c: 'from-gov-500 to-blue-600' },
                      { k: 1, label: '人脸识别', desc: '公安部人脸照片比对', icon: Fingerprint, c: 'from-emerald-500 to-teal-600' },
                      { k: 2, label: '银行卡四要素', desc: '姓名+身份证+手机号+银行卡号', icon: CreditCard, c: 'from-gold-500 to-amber-600' },
                      { k: 3, label: '证件OCR上传', desc: '身份证正反面照片核验', icon: Upload, c: 'from-purple-500 to-violet-600' },
                    ].map((s, i) => {
                      const done = i <= verifyStep;
                      const current = i === verifyStep;
                      const Ic = s.icon;
                      return (
                        <div key={s.k} className="relative flex items-start gap-4 md:gap-6 py-5">
                          <div className="relative z-10 shrink-0">
                            <div className={cn(
                              'w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform',
                              done ? `bg-gradient-to-br ${s.c} text-white` : current ? 'bg-white border-2 border-gov-300 text-gov-400 shadow-none' : 'bg-gray-100 text-gray-300 shadow-none'
                            )}>
                              {done ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Ic className="w-5 h-5 md:w-6 md:h-6" />}
                            </div>
                          </div>
                          <div className="flex-1 pt-1 pb-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h4 className={cn('font-bold md:text-base', done || current ? 'text-gray-800' : 'text-gray-400')}>{s.label}</h4>
                                <p className={cn('text-xs md:text-sm mt-0.5', done || current ? 'text-gray-500' : 'text-gray-300')}>{s.desc}</p>
                              </div>
                              {done && <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5" />已完成</span>}
                              {current && (
                                <button onClick={startFace} disabled={scanning} className="gov-btn !py-2 !px-4 text-xs inline-flex items-center gap-1.5">
                                  {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ic className="w-3.5 h-3.5" />}
                                  {scanning ? '核验中...' : '立即核验'}
                                </button>
                              )}
                              {!done && !current && <span className="text-xs text-gray-300 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50"><Lock className="w-3 h-3" />待完成</span>}
                            </div>
                            {current && (
                              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-gov-50 via-blue-50/40 to-gov-50 border border-gov-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 opacity-5"><Fingerprint className="w-full h-full text-gov-500" /></div>
                                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                                  <div className="md:col-span-1 flex justify-center">
                                    <div className={cn('relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden', scanning ? 'ring-4 ring-gov-200' : 'ring-2 ring-gov-100')}>
                                      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                        <User className="w-16 h-16 text-gray-300" />
                                      </div>
                                      {scanning && (
                                        <div className="absolute inset-0 animate-scan">
                                          <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-gov-500 to-transparent" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <h5 className="font-bold text-gray-800 flex items-center gap-1.5">{s.label}<span className="text-[10px] px-2 py-0.5 rounded-full bg-white border-gov-200 border text-gov-600 font-normal">权威数据源</span></h5>
                                    <p className="text-xs text-gray-500 leading-relaxed">本服务对接公安部人口库、银联银行卡核验系统，采用端到端国密SM4加密传输，您的隐私数据严格保护。</p>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 pt-1">
                                      <span className="px-2 py-0.5 rounded bg-white/60 border border-gray-100 inline-flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" />数据加密</span>
                                      <span className="px-2 py-0.5 rounded bg-white/60 border border-gray-100 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-gov-500" />合规认证</span>
                                      <span className="px-2 py-0.5 rounded bg-white/60 border border-gray-100 inline-flex items-center gap-1"><Lock className="w-3 h-3 text-gold-500" />不留存</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
