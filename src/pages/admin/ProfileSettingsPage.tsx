import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../../shared/types';

type TabKey = 'profile' | 'password' | 'logs' | 'permissions';
type FeedbackType = 'success' | 'error' | 'info' | null;

const roleLabelMap: Record<string, { label: string; color: string; desc: string }> = {
  super_admin: { label: '超级管理员', color: 'bg-red-100 text-red-700 border-red-200', desc: '拥有中台全部权限' },
  government: { label: '文旅主管部门', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: '监管、审核、数据看板、招商申报' },
  scenic_admin: { label: '景区运营方', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: '景区客流、内容发布、活动申报' },
  enterprise: { label: '文旅企业', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: '招商对接、导游认证、消费券核销' },
  editor: { label: '专业编辑', color: 'bg-purple-100 text-purple-700 border-purple-200', desc: '内容生产、审核协助、版权水印' },
  professional: { label: '专业读者', color: 'bg-slate-100 text-slate-700 border-slate-200', desc: '内容订阅、数据查看、投稿' },
  tourist: { label: '游客用户', color: 'bg-sky-100 text-sky-700 border-sky-200', desc: 'H5端浏览与互动' },
};

const permissionGroupLabels: Record<string, string> = {
  content: '内容管理',
  audit: '审核流程',
  data: '数据看板',
  service: '产业服务',
  analytics: '传播舆情',
  system: '系统管理',
  openapi: 'API开放',
};

const classifyPermission = (p: string): string => {
  if (p === '*') return 'system';
  const key = p.toLowerCase();
  for (const group of Object.keys(permissionGroupLabels)) {
    if (key.startsWith(group) || key.includes(group)) return group;
  }
  if (key.includes('dashboard') || key.includes('stats') || key.includes('view')) return 'data';
  if (key.includes('write') || key.includes('publish') || key.includes('create')) return 'content';
  return 'system';
};

const ProfileSettingsPage: React.FC = () => {
  const location = useLocation();
  const { user, updateProfile, changePassword, operationLogs, lastLoginAt } = useAuthStore();

  const tabFromPath: Record<string, TabKey> = {
    '/admin/settings/profile': 'profile',
    '/admin/settings/password': 'password',
    '/admin/settings/permissions': 'permissions',
    '/admin/settings/logs': 'logs',
  };
  const initialTab = (tabFromPath[location.pathname] || 'profile') as TabKey;

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);

  useEffect(() => {
    const mapped = tabFromPath[location.pathname];
    if (mapped) setTab(mapped);
  }, [location.pathname]);

  const [profileForm, setProfileForm] = useState({
    realName: user?.realName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    avatar: user?.avatar || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

  const role = (user?.role || '') as UserRole;
  const roleInfo = roleLabelMap[role] || { label: '用户', color: 'bg-gray-100 text-gray-700 border-gray-200', desc: '-' };

  const permissionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const perms = user?.permissions || [];
    for (const p of perms) {
      const g = classifyPermission(p);
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return groups;
  }, [user?.permissions]);

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message });
    if (type !== 'error') setTimeout(() => setFeedback(null), 3200);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.realName.trim()) {
      showFeedback('error', '请填写真实姓名');
      return;
    }
    if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      showFeedback('error', '邮箱格式不正确');
      return;
    }
    if (profileForm.phone && !/^1[3-9]\d{9}$/.test(profileForm.phone)) {
      showFeedback('error', '手机号格式不正确');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await updateProfile({
        realName: profileForm.realName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        organization: profileForm.organization.trim(),
        avatar: profileForm.avatar.trim(),
      });
      if (res.success) {
        showFeedback('success', res.message || '资料更新成功');
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const pwdStrength = useMemo(() => {
    const s = pwdForm.newPassword;
    if (!s) return { level: 0, label: '请输入新密码', color: 'text-ink-400' };
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    if (score <= 1) return { level: 1, label: '弱', color: 'text-red-600' };
    if (score === 2) return { level: 2, label: '中', color: 'text-amber-600' };
    if (score === 3) return { level: 3, label: '强', color: 'text-blue-600' };
    return { level: 4, label: '非常强', color: 'text-green-600' };
  }, [pwdForm.newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      showFeedback('error', '请完整填写密码表单');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      showFeedback('error', '新密码长度不能少于6位');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showFeedback('error', '两次输入的新密码不一致');
      return;
    }
    if (pwdForm.newPassword === pwdForm.oldPassword) {
      showFeedback('error', '新密码不能与原密码相同');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await changePassword(pwdForm);
      if (res.success) {
        showFeedback('success', res.message);
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setPwdSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'profile', label: '基本资料', icon: '👤' },
    { key: 'password', label: '修改密码', icon: '🔐' },
    { key: 'permissions', label: '角色权限', icon: '🛡️' },
    { key: 'logs', label: '操作留痕', icon: '📜' },
  ];

  return (
    <div className="space-y-6 relative">
      {feedback && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg shadow-lg border max-w-sm ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
          feedback.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">
              {feedback.type === 'success' ? '✅' : feedback.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="text-sm font-medium flex-1">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-ink-400 hover:text-ink-600 ml-2">×</button>
          </div>
        </div>
      )}

      <div className="card chinese-border bg-gradient-to-r from-primary-50/50 via-white to-landscape-50/50">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.realName?.charAt(0) || user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-ink-900">{user?.realName || user?.username}</h1>
              <span className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-xs">@{user?.username}</span>
              {user?.status === 'active' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  账号正常
                </span>
              )}
            </div>
            <p className="text-ink-500 text-sm mt-1">{roleInfo.desc}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink-500">
              <span>🏢 {user?.organization || '-'}</span>
              <span>📧 {user?.email || '-'}</span>
              <span>📱 {user?.phone || '-'}</span>
              {lastLoginAt && <span>🕐 上次登录 {new Date(lastLoginAt).toLocaleString('zh-CN')}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-ink-100 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              tab === t.key
                ? 'border-primary-500 text-primary-700 bg-primary-50/30'
                : 'border-transparent text-ink-500 hover:text-ink-800 hover:bg-ink-50'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
            {t.key === 'logs' && operationLogs.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs">{operationLogs.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card chinese-border max-w-3xl space-y-5">
          <h3 className="text-lg font-semibold text-ink-800">基本资料</h3>
          <p className="text-sm text-ink-500 -mt-3">维护您的个人信息与联系方式，确保业务联络畅通</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">用户名（只读）</label>
              <input type="text" value={user?.username || ''} disabled className="input bg-ink-50 text-ink-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">角色（只读）</label>
              <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${roleInfo.color}`}>
                {roleInfo.label}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">真实姓名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={profileForm.realName}
                onChange={(e) => setProfileForm({ ...profileForm, realName: e.target.value })}
                className="input"
                placeholder="请输入真实姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">所属机构</label>
              <input
                type="text"
                value={profileForm.organization}
                onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                className="input"
                placeholder="如：文化和旅游部信息中心"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">📧 邮箱</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="input"
                placeholder="name@example.gov.cn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">📱 手机号</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                className="input"
                placeholder="11位手机号"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">头像URL（可选）</label>
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                className="input"
                placeholder="https://... 头像图片链接，留空使用默认头像"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
            <button
              type="button"
              onClick={() => {
                setProfileForm({
                  realName: user?.realName || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  organization: user?.organization || '',
                  avatar: user?.avatar || '',
                });
              }}
              className="btn-secondary"
            >
              恢复默认
            </button>
            <button type="submit" disabled={profileSaving} className="btn-primary min-w-[140px] disabled:opacity-60">
              {profileSaving ? '保存中...' : '💾 保存资料'}
            </button>
          </div>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="card chinese-border max-w-2xl space-y-5">
          <h3 className="text-lg font-semibold text-ink-800">修改登录密码</h3>
          <p className="text-sm text-ink-500 -mt-3">定期更换复杂密码可有效保护账号安全</p>

          <div className="space-y-4">
            {(['old', 'new', 'confirm'] as const).map((k) => {
              const labelMap = { old: '原密码', new: '新密码', confirm: '确认新密码' };
              const phMap = { old: '请输入当前使用的密码', new: '至少6位，建议包含字母+数字+符号', confirm: '请再次输入新密码' };
              const val = pwdForm[k === 'old' ? 'oldPassword' : k === 'new' ? 'newPassword' : 'confirmPassword'];
              const set = (v: string) => {
                const fk = k === 'old' ? 'oldPassword' : k === 'new' ? 'newPassword' : 'confirmPassword';
                setPwdForm({ ...pwdForm, [fk]: v });
              };
              return (
                <div key={k}>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">{labelMap[k]}</label>
                  <div className="relative">
                    <input
                      type={showPwd[k] ? 'text' : 'password'}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="input pr-12"
                      placeholder={phMap[k]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd({ ...showPwd, [k]: !showPwd[k] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 text-sm"
                    >
                      {showPwd[k] ? '🙈 隐藏' : '👁 显示'}
                    </button>
                  </div>
                  {k === 'new' && pwdForm.newPassword && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            pwdStrength.level >= 3 ? 'bg-green-500' :
                            pwdStrength.level === 2 ? 'bg-amber-500' :
                            pwdStrength.level === 1 ? 'bg-red-500' : 'bg-ink-200'
                          }`}
                          style={{ width: `${pwdStrength.level * 25}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${pwdStrength.color}`}>
                        密码强度：{pwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
            <button
              type="button"
              onClick={() => setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })}
              className="btn-secondary"
            >
              清空表单
            </button>
            <button type="submit" disabled={pwdSaving} className="btn-primary min-w-[140px] disabled:opacity-60">
              {pwdSaving ? '提交中...' : '🔐 确认修改密码'}
            </button>
          </div>
        </form>
      )}

      {tab === 'permissions' && (
        <div className="card chinese-border space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold text-ink-800">角色与权限</h3>
              <p className="text-sm text-ink-500 mt-1">当前账号所拥有的角色类型及权限明细</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${roleInfo.color}`}>
              <div className="text-sm font-bold">{roleInfo.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{roleInfo.desc}</div>
            </div>
          </div>

          {user?.permissions?.includes('*') ? (
            <div className="p-6 bg-gradient-to-r from-red-50 via-amber-50 to-green-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-3xl">👑</span>
                <div>
                  <div className="text-lg font-bold text-ink-800">超级管理员权限（全权限）</div>
                  <p className="text-sm text-ink-600 mt-1">您拥有本文旅中台的全部操作权限，可访问所有业务模块。</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(permissionGroupLabels).map((g) => {
                const list = permissionGroups[g] || [];
                if (list.length === 0) return null;
                return (
                  <div key={g} className="p-4 bg-ink-50 rounded-xl border border-ink-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-ink-800">{permissionGroupLabels[g]}</h4>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-bold">{list.length}项</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((p, i) => (
                        <code key={i} className="px-2 py-0.5 bg-white rounded text-xs text-ink-600 border border-ink-200">
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="card chinese-border p-0 overflow-hidden">
          <div className="p-4 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-ink-800">操作留痕</h3>
              <p className="text-sm text-ink-500 mt-0.5">最近50条关键操作记录（账号、资料、密码等）</p>
            </div>
            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
              共 {operationLogs.length} 条
            </span>
          </div>
          {operationLogs.length === 0 ? (
            <div className="py-16 text-center text-ink-400">
              <span className="text-5xl block mb-3">📜</span>
              <p>暂无操作记录</p>
              <p className="text-xs mt-1">登录、修改资料、修改密码等操作将在此展示</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ink-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase">时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase">操作行为</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase">执行结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {operationLogs.map((log, i) => {
                    const ok = !log.result.includes('失败') && !log.result.includes('错误');
                    return (
                      <tr key={i} className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-600 whitespace-nowrap">{log.time}</td>
                        <td className="px-4 py-3 text-sm text-ink-800 font-medium">{log.action}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {ok ? '✅' : '❌'} {log.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsPage;
