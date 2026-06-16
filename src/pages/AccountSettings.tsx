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
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { UserRole, UserStatus } from '@shared/types';

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

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, token, logout, login } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  const roleInfo = user?.role ? roleConfig[user.role] : null;
  const RoleIcon = roleInfo?.Icon || User;
  const statusInfo = user?.status ? statusConfig[user.status] : null;

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (user) {
      login({ ...user, nickname }, token || '');
    }
    setSaving(false);
    setEditing(false);
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

  const roleOrder: UserRole[] = ['owner', 'doctor', 'hospital', 'merchant', 'admin', 'platform', 'ops'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">账号设置</h1>
          <p className="text-gray-500 text-sm">管理您的账号资料、身份角色与安全设置</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-forest-500" /> 账号资料
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-ghost text-sm !py-1.5 !px-3 gap-1"
                >
                  <Edit3 className="w-4 h-4" /> 编辑
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
                    {saving ? '保存中' : '保存'}
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
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-200"
                      maxLength={20}
                    />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">{user?.nickname}</div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 账号/手机号
                    </label>
                    <div className="font-mono text-sm text-gray-700">{user?.phone}</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> 账号状态
                    </label>
                    {statusInfo && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {user?.role && (
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 当前身份角色
                    </label>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
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

                {user?.role !== 'owner' && (
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block flex items-center gap-1">
                      <Globe className="w-3 h-3" /> 安全 Token（{showSensitive ? '可见' : '已隐藏'}）
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-mono text-gray-600 truncate">
                        {showSensitive ? token : `${token?.slice(0, 16)}...${token?.slice(-8)}`}
                      </code>
                      <button
                        onClick={() => setShowSensitive(!showSensitive)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        {showSensitive ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                    className={`p-4 rounded-2xl text-left transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300'
                        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-purple-200 hover:shadow-sm'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rc.color} flex items-center justify-center shrink-0`}>
                        <RIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{rc.label}</div>
                        {isCurrent && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                            <CheckCircle2 className="w-3 h-3" /> 当前登录
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{rc.desc}</p>
                    {isPreviewing && (
                      <div className="mt-2 text-[10px] text-purple-600 font-semibold">验证身份中...</div>
                    )}
                  </button>
                );
              })}
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

        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-forest-500" /> 权限边界
            </h2>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">在线问诊模块</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform', 'ops', 'doctor', 'owner'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">处方流转 / 双签</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform', 'ops', 'doctor', 'owner'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">医院服务定价</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform', 'ops', 'hospital'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">商城商品上架</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform', 'ops', 'merchant'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">资质审核队列</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">审计日志复查</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'platform'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700">基础设施监控</span>
                <span className="text-forest-600 font-semibold">
                  {['admin', 'ops'].includes(user?.role || '') ? '可访问' : '不可访问'}
                </span>
              </div>
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
                查看健康日历提醒 <span className="text-xs bg-white px-2 py-0.5 rounded-full">3 项待办</span>
              </button>
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
    </div>
  );
}
