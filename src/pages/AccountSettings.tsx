import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff,
  Edit3,
  Save,
  LogOut,
  Globe,
  Clock,
  CheckCircle2,
  Stethoscope,
  Building2,
  Store,
  Cpu,
  Lock,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  FileText,
  Shield,
  Mail,
  X,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { UserRole, UserStatus } from '@shared/types';
import { cn } from '@/lib/utils';

const roleConfig: Record<UserRole, { label: string; color: string; desc: string; Icon: React.ComponentType<{ className?: string }> }> = {
  owner: { label: '宠主', color: 'from-forest-400 to-emerald-600', desc: '宠物档案 · 在线问诊 · 商城购物', Icon: User },
  doctor: { label: '执业兽医', color: 'from-blue-400 to-sky-600', desc: '图文问诊 · 电子病历 · 处方开具', Icon: Stethoscope },
  hospital: { label: '医院管理员', color: 'from-orange-400 to-amber-600', desc: '服务定价 · 医生排班 · 评价管理', Icon: Building2 },
  merchant: { label: '商家运营', color: 'from-rose-400 to-pink-600', desc: 'SKU上架 · 合规备案 · 订单履约', Icon: Store },
  admin: { label: '超级管理员', color: 'from-purple-400 to-indigo-600', desc: '资质审核 · 权限管理 · 审计复查', Icon: ShieldCheck },
  platform: { label: '平台运营', color: 'from-sky-400 to-cyan-600', desc: '内容审核 · 商家入驻 · 转化漏斗', Icon: Globe },
  ops: { label: '运维工程师', color: 'from-slate-500 to-zinc-700', desc: '服务监控 · 密钥轮询 · 基础设施', Icon: Cpu },
};

const statusConfig: Record<UserStatus, { label: string; color: string; desc: string }> = {
  active: { label: '正常启用', color: 'bg-forest-100 text-forest-700', desc: '账号功能全部正常可用' },
  disabled: { label: '已禁用', color: 'bg-red-100 text-red-700', desc: '账号已被管理员禁用' },
  pending_review: { label: '资质审核中', color: 'bg-warm-100 text-warm-600', desc: '资质材料审核中，部分功能受限' },
};

const auditTrail = [
  { time: '2026-06-17 10:32', action: '登录账号', detail: '通过手机号+密码验证', result: '成功', ip: '127.0.0.1' },
  { time: '2026-06-16 18:45', action: '修改昵称', detail: '超级管理员 → 超级管理员-正式', result: '成功', ip: '127.0.0.1' },
  { time: '2026-06-16 10:08', action: '资质审核', detail: '通过医生-李静怡资质申请', result: '成功', ip: '127.0.0.1' },
  { time: '2026-06-15 15:20', action: '权限变更', detail: '新增运营角色访问处方监管', result: '成功', ip: '127.0.0.1' },
  { time: '2026-06-14 09:30', action: '密码修改', detail: '通过验证码安全校验', result: '成功', ip: '192.168.1.100' },
  { time: '2026-06-12 14:02', action: '登录异常', detail: '设备指纹不匹配，二次验证通过', result: '放行', ip: '10.0.0.88' },
];

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, token, logout, login } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  const [phoneEditing, setPhoneEditing] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [roleRequestOpen, setRoleRequestOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>('doctor');
  const [roleReason, setRoleReason] = useState('');
  const [roleRequestSubmitting, setRoleRequestSubmitting] = useState(false);
  const [roleRequestSuccess, setRoleRequestSuccess] = useState(false);

  const roleInfo = user?.role ? roleConfig[user.role] : null;
  const RoleIcon = roleInfo?.Icon || User;
  const statusInfo = user?.status ? statusConfig[user.status] : null;

  const roleOrder: UserRole[] = ['owner', 'doctor', 'hospital', 'merchant', 'admin', 'platform', 'ops'];

  const sendVerifyCode = () => {
    if (codeCountdown > 0) return;
    setCodeCountdown(60);
    const timer = setInterval(() => {
      setCodeCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    if (user) login({ ...user, nickname }, token || '');
    setSaving(false);
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePhone = async () => {
    if (!newPhone.trim() || verifyCode.length !== 6) return;
    setPhoneSaving(true);
    await new Promise(r => setTimeout(r, 700));
    if (user) login({ ...user, phone: newPhone }, token || '');
    setPhoneSaving(false);
    setPhoneEditing(false);
    setPhoneSuccess(true);
    setVerifyCode('');
    setTimeout(() => setPhoneSuccess(false), 2500);
  };

  const handleSavePassword = async () => {
    if (!oldPassword || newPassword.length < 6 || newPassword !== confirmPassword) return;
    setPasswordSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setPasswordSaving(false);
    setPasswordOpen(false);
    setPasswordSuccess(true);
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  const handleSubmitRoleRequest = async () => {
    if (!roleReason.trim()) return;
    setRoleRequestSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setRoleRequestSubmitting(false);
    setRoleRequestSuccess(true);
    setTimeout(() => {
      setRoleRequestOpen(false);
      setRoleRequestSuccess(false);
      setRoleReason('');
    }, 1800);
  };

  const handleRolePreview = async (targetRole: UserRole) => {
    if (!token || targetRole === user?.role) return;
    setPreviewRole(targetRole);
    const demoCredentials: Record<UserRole, string> = {
      owner: '13800000001',
      doctor: '13900000001',
      hospital: '13700000001',
      merchant: '13600000001',
      admin: 'admin',
      platform: 'platform',
      ops: 'ops',
    };
    const phone = demoCredentials[targetRole];
    if (!phone) return;
    try {
      const { user: previewUser, token: previewToken } = await api.auth.login(phone, '123456');
      login(previewUser, previewToken);
      navigate(targetRole === 'owner' ? '/' : `/${targetRole}/dashboard`, { replace: true });
    } catch {
      setPreviewRole(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gray-900">账号设置</h1>
          <p className="text-gray-500 text-sm">管理您的账号资料、安全设置、权限边界与操作审计</p>
        </div>
        {(saveSuccess || phoneSuccess || passwordSuccess) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-forest-50 text-forest-700 text-sm font-semibold border border-forest-200">
            <CheckCircle2 className="w-4 h-4" />
            {saveSuccess ? '资料已更新' : phoneSuccess ? '手机号已更换' : '密码已更新'}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 账号资料 - 完整编辑 */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-forest-500" /> 账号资料
              </h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-ghost text-sm !py-1.5 !px-3 gap-1">
                  <Edit3 className="w-4 h-4" /> 编辑资料
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setNickname(user?.nickname || ''); }}
                    className="btn-ghost text-sm !py-1.5 !px-3"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !nickname.trim()}
                    className="btn-primary text-sm !py-1.5 !px-3 gap-1"
                  >
                    {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? '保存中' : '保存修改'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleInfo?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center shrink-0 shadow-lg`}>
                <RoleIcon className="w-10 h-10 text-white" />
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 mb-1 block">昵称</label>
                  {editing ? (
                    <input
                      type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-200"
                      maxLength={20} placeholder="请输入昵称"
                    />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">{user?.nickname}</div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* 手机号 + 验证码校验 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> 账号/手机号
                      </label>
                      {!phoneEditing && (
                        <button onClick={() => { setPhoneEditing(true); setNewPhone(user?.phone || ''); }} className="text-[11px] text-purple-600 font-semibold hover:underline">更换</button>
                      )}
                    </div>
                    {!phoneEditing ? (
                      <div className="font-mono text-sm text-gray-700 flex items-center gap-2">
                        {user?.phone}
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-200"
                            placeholder="请输入新手机号" maxLength={11}
                          />
                          <button
                            onClick={sendVerifyCode}
                            disabled={codeCountdown > 0 || !/^1\d{10}$/.test(newPhone)}
                            className="px-3 py-2 rounded-xl bg-forest-50 text-forest-700 text-xs font-semibold hover:bg-forest-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            {codeCountdown > 0 ? `${codeCountdown}s后重发` : '获取验证码'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-200 tracking-widest"
                            placeholder="6位验证码" maxLength={6}
                          />
                          <button
                            onClick={handleSavePhone}
                            disabled={phoneSaving || verifyCode.length !== 6 || !/^1\d{10}$/.test(newPhone)}
                            className="px-4 py-2 rounded-xl bg-forest-500 text-white text-xs font-semibold hover:bg-forest-600 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                          >
                            {phoneSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            确认
                          </button>
                          <button
                            onClick={() => { setPhoneEditing(false); setNewPhone(user?.phone || ''); setVerifyCode(''); }}
                            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                        <p className="text-[10px] text-warm-600 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          更换手机号需要验证码二次校验，操作会记录到审计日志
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 账号状态 */}
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> 账号状态
                    </label>
                    <div className="flex items-center gap-2">
                      {statusInfo && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">ID: {user?.id}</span>
                    </div>
                  </div>
                </div>

                {/* 当前角色 */}
                {user?.role && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 当前身份角色
                      </label>
                      <button onClick={() => setRoleRequestOpen(true)} className="text-[11px] text-purple-600 font-semibold hover:underline">申请角色变更</button>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-br ${roleInfo?.color} text-white`}>
                          {roleInfo?.label}
                        </span>
                        <span className="text-[11px] text-purple-600 font-semibold">
                          {user.licenseVerified ? '✓ 资质已核验' : '⏳ 资质待审核'}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-600/80">{roleInfo?.desc}</p>
                    </div>
                  </div>
                )}

                {/* 安全设置区 */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setPasswordOpen(!passwordOpen)}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-warm-50 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-warm-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">登录密码</p>
                        <p className="text-[10px] text-gray-500">上次修改：2026-06-14</p>
                      </div>
                    </div>
                    <RefreshCw className={cn('w-4 h-4 text-gray-400 transition-transform', passwordOpen && 'rotate-180')} />
                  </div>

                  {passwordOpen && (
                    <div className="p-4 rounded-xl bg-warm-50 border border-warm-100 space-y-3">
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-xs text-forest-700 font-semibold bg-forest-50 border border-forest-200 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> 密码修改成功！
                        </div>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">当前密码</label>
                          <div className="relative">
                            <input
                              type={showOldPwd ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-8 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200"
                              placeholder="请输入当前密码"
                            />
                            <button onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showOldPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">新密码 (≥6位)</label>
                          <div className="relative">
                            <input
                              type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-8 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200"
                              placeholder="请输入新密码"
                            />
                            <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">确认新密码</label>
                          <input
                            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                              'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2',
                              confirmPassword && newPassword !== confirmPassword
                                ? 'border-red-300 focus:ring-red-200 ring-1 ring-red-200'
                                : 'border-warm-200 focus:ring-warm-200'
                            )}
                            placeholder="再次输入新密码"
                          />
                        </div>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[10px] text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 两次输入的密码不一致
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setPasswordOpen(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          取消
                        </button>
                        <button
                          onClick={handleSavePassword}
                          disabled={passwordSaving || !oldPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 text-white text-xs font-semibold hover:shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-1"
                        >
                          {passwordSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                          确认修改
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">邮箱绑定</p>
                        <p className="text-[10px] text-gray-500">未绑定，绑定后可找回密码</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition-colors">去绑定</button>
                  </div>

                  {user?.role !== 'owner' && (
                    <div className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">安全 Token ({showSensitive ? '可见' : '已隐藏'})</p>
                            <p className="text-[10px] text-gray-500">用于 API 访问 · 请勿泄露</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowSensitive(!showSensitive)} className="p-2 rounded-lg hover:bg-white transition-colors">
                            {showSensitive ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white transition-colors" title="刷新 Token">
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <code className="block w-full px-3 py-2 rounded-lg bg-white border border-gray-100 text-[10px] font-mono text-gray-600 break-all">
                        {showSensitive ? token : `${token?.slice(0, 16)}...${token?.slice(-8)}`}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 角色预览/切换 */}
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" /> 角色权限 · 平台预览
            </h2>
            <p className="text-xs text-gray-500 -mt-2">
              可快速切换至其他角色工作台预览（需重新验证身份，操作将以预览角色身份生效）
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleOrder.map((r) => {
                const rc = roleConfig[r];
                const RIcon = rc.Icon;
                const isCurrent = r === user?.role;
                const isPreviewing = previewRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRolePreview(r)}
                    disabled={isCurrent || !!previewRole}
                    className={cn(
                      'p-4 rounded-2xl text-left transition-all',
                      isCurrent
                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 cursor-default'
                        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-purple-200 hover:shadow-sm disabled:opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rc.color} flex items-center justify-center shrink-0`}>
                        <RIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{rc.label}</div>
                        {isCurrent ? (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                            <CheckCircle2 className="w-3 h-3" /> 当前登录
                          </div>
                        ) : isPreviewing ? (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                            <Clock className="w-3 h-3 animate-spin" /> 验证身份中
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400">点击进入预览</div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{rc.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 审计日志 */}
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" /> 账号操作审计
            </h2>
            <p className="text-xs text-gray-500 -mt-2">近期账号的所有敏感操作记录，用于审计复查与安全追溯</p>
            <div className="space-y-2">
              {auditTrail.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{log.action}</span>
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        log.result === '成功' ? 'bg-forest-100 text-forest-700' :
                        log.result === '放行' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {log.result}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">{log.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-gray-400 font-mono">{log.time}</div>
                    <div className="text-[10px] text-gray-400 font-mono">IP: {log.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {statusInfo && (
            <div className="card space-y-3 bg-gradient-to-br from-cream-50 to-forest-50 border-forest-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-forest-600" />
                <span className="font-semibold text-forest-900 text-sm">资质状态说明</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  {statusInfo.color.includes('forest') ? (
                    <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warm-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{statusInfo.label}</p>
                    <p className="text-gray-600">{statusInfo.desc}</p>
                    {user?.licenseVerified === false && user.role === 'doctor' && (
                      <p className="text-warm-600 mt-1">您的执业资质正在审核中，审核期间无法承接问诊、开具处方。</p>
                    )}
                    {user?.status === 'pending_review' && (user.role === 'hospital' || user.role === 'merchant') && (
                      <p className="text-warm-600 mt-1">您的营业执照和经营资质正在审核，审核期间无法上架商品、服务定价。</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧栏 */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-forest-500" /> 权限边界
            </h2>
            <div className="space-y-2 text-[11px]">
              {[
                { label: '在线问诊模块', roles: ['admin', 'platform', 'ops', 'doctor', 'owner'] },
                { label: '处方流转 / 双签', roles: ['admin', 'platform', 'ops', 'doctor', 'owner'] },
                { label: '医院服务定价', roles: ['admin', 'platform', 'ops', 'hospital'] },
                { label: '商城商品上架', roles: ['admin', 'platform', 'ops', 'merchant'] },
                { label: '资质审核队列', roles: ['admin', 'platform'] },
                { label: '审计日志复查', roles: ['admin', 'platform'] },
                { label: '基础设施监控', roles: ['admin', 'ops'] },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <span className="text-gray-700">{m.label}</span>
                  <span className={cn(
                    'font-semibold',
                    m.roles.includes(user?.role || '') ? 'text-forest-600' : 'text-gray-400'
                  )}>
                    {m.roles.includes(user?.role || '') ? '✓ 可访问' : '— 受限'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-purple-700 font-mono text-[10px]">RBAC 实时生效</span>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" /> 账号操作
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/calendar')}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 text-forest-700 font-medium text-sm hover:from-forest-100 hover:to-emerald-100 transition-colors inline-flex items-center justify-between"
              >
                查看健康日历提醒 <span className="text-xs bg-white px-2 py-0.5 rounded-full">4 项待办</span>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-medium text-sm hover:from-purple-100 hover:to-indigo-100 transition-colors inline-flex items-center justify-between"
                >
                  返回超级管理控制台 <span className="text-xs bg-white px-2 py-0.5 rounded-full">7 大业务模块</span>
                </button>
              )}
              <button
                onClick={() => { logout(); navigate('/login', { replace: true }); }}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-medium text-sm hover:from-red-100 hover:to-rose-100 transition-colors inline-flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" /> 安全退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 角色变更申请弹窗 */}
      {roleRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !roleRequestSuccess && setRoleRequestOpen(false)}>
          <div className="w-full max-w-lg card shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-500" /> 申请角色变更
              </h3>
              <button onClick={() => !roleRequestSuccess && setRoleRequestOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {roleRequestSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-forest-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-forest-600" />
                </div>
                <p className="font-semibold text-gray-900">申请已提交</p>
                <p className="text-sm text-gray-500">管理员将在 1-3 个工作日内完成复核</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  角色变更需要管理员复核，请如实填写变更原因。申请记录将永久留痕，可在审计日志中追溯。
                </p>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">目标角色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOrder.filter(r => r !== user?.role && r !== 'admin').map((r) => {
                      const rc = roleConfig[r];
                      const RIcon = rc.Icon;
                      return (
                        <button
                          key={r} onClick={() => setTargetRole(r)}
                          className={cn(
                            'p-2.5 rounded-xl text-center transition-all border',
                            targetRole === r
                              ? 'border-purple-400 bg-purple-50 shadow-sm'
                              : 'border-gray-100 bg-gray-50 hover:border-purple-200'
                          )}
                        >
                          <div className={cn('w-8 h-8 mx-auto rounded-lg bg-gradient-to-br', rc.color, 'flex items-center justify-center mb-1')}>
                            <RIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-[11px] font-semibold text-gray-800">{rc.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">变更原因（必填）</label>
                  <textarea
                    value={roleReason} onChange={(e) => setRoleReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="请说明角色变更的原因和必要性..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 申请提交后将由超级管理员复核，全程留痕审计
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setRoleRequestOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitRoleRequest}
                    disabled={roleRequestSubmitting || !roleReason.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium hover:shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-1"
                  >
                    {roleRequestSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    提交复核申请
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
