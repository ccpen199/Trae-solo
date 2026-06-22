import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { USER_ROLE_LABELS, getInitials, formatDate, DECORATION_STYLES, COMMON_MATERIALS } from '../utils/constants';
import type { Diary } from '../types';
import { diaryApi } from '../services/api';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, setUser, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [myDiaries, setMyDiaries] = useState<Diary[]>([]);

  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    styleTags: user?.preferences?.styleTags || [],
    materials: user?.preferences?.materials || []
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    if (!token) { navigate('/auth/login'); return; }
    const fetch = async () => {
      try {
        const res: any = await diaryApi.getMine();
        if (res?.success) setMyDiaries(res.data || []);
      } catch (_) { /* ignore */ }
    };
    fetch();
  }, [token]);

  const toggleArr = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const onAvatarSelect = (f: File | null) => {
    setAvatarFile(f);
    if (f) { const r = new FileReader(); r.onload = () => setAvatarPreview(r.result as string); r.readAsDataURL(f); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res: any = await authApi.updateProfile({
        nickname: form.nickname,
        bio: form.bio,
        preferences: {
          ...user?.preferences,
          styleTags: form.styleTags,
          materials: form.materials
        }
      }, avatarFile || undefined);
      if (res?.success) {
        setUser(res.data);
        alert('保存成功');
        setAvatarFile(null);
        setAvatarPreview('');
      }
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const changePwd = async () => {
    if (newPwd !== confirmPwd) { alert('两次密码不一致'); return; }
    try {
      const res: any = await authApi.changePassword({ oldPassword: oldPwd, newPassword: newPwd });
      if (res?.success) {
        alert('密码修改成功');
        setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      }
    } catch (e: any) { alert(e.message); }
  };

  if (!user) return null;

  const tabs = [
    { key: 'info', label: '基本信息', icon: '👤' },
    { key: 'preferences', label: '风格偏好', icon: '🎨' },
    { key: 'diaries', label: `我的日记 (${myDiaries.length})`, icon: '📝' },
    { key: 'security', label: '账号安全', icon: '🔐' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="shrink-0 text-center">
            <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gray-100 mx-auto mb-3">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> :
                user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> :
                <div className="w-full h-full bg-gradient-to-br from-primary-300 to-primary-600 text-white flex items-center justify-center text-4xl font-bold">{getInitials(user.nickname || user.username)}</div>}
            </div>
            <label className="inline-block btn-outline !py-1 text-xs cursor-pointer">更换头像<input type="file" accept="image/*" className="hidden" onChange={e => onAvatarSelect(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl font-bold text-gray-900">{user.nickname || user.username}</h1>
              <span className={`badge ${user.role === 'designer' ? 'bg-purple-100 text-purple-700' : user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {USER_ROLE_LABELS[user.role]}
              </span>
              {user.designerStatus && (
                <span className={`badge ${user.designerStatus === 'approved' ? 'bg-accent-100 text-accent-700' : user.designerStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  设计师{user.designerStatus === 'approved' ? '已认证' : user.designerStatus === 'pending' ? '审核中' : user.designerStatus === 'rejected' ? '未通过' : '已暂停'}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">
              <span>📧 {user.email}</span>
              <span>📞 {user.phone}</span>
              <span>注册于 {formatDate(user.createdAt, 'YYYY-MM-DD')}</span>
            </div>
            {user.bio && <p className="mt-3 text-gray-600">{user.bio}</p>}
            {user.role === 'designer' && user.serviceAreas && user.serviceAreas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center md:justify-start">
                {(user.serviceAreas || []).map(a => <span key={a} className="badge bg-gray-100 text-gray-600">📍 {a}</span>)}
              </div>
            )}
            {user.role === 'designer' && user.statistics && (
              <div className="mt-4 grid grid-cols-3 gap-3 max-w-sm mx-auto md:mx-0">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-gray-900">{user.statistics.completedProjects}</p>
                  <p className="text-xs text-gray-500">完成项目</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-amber-600">★ {user.statistics.rating}</p>
                  <p className="text-xs text-gray-500">平均评分</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-purple-700">{user.statistics.reviewCount}</p>
                  <p className="text-xs text-gray-500">业主评价</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <span className="mr-1">{tab.icon}</span>{tab.label}
          </button>
        ))}
        {user.role !== 'designer' && <Link to="/designers/apply" className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 whitespace-nowrap">🎨 申请成为设计师</Link>}
        {user.role === 'designer' && <Link to="/designers/apply" className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 whitespace-nowrap">✏️ 编辑设计师资料</Link>}
        {user.role === 'admin' && <Link to="/moderation" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 whitespace-nowrap">🛡️ 内容审核后台</Link>}
      </div>

      {activeTab === 'info' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-bold">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">昵称</label>
              <input value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <input value={user.username} className="input bg-gray-50" disabled />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">个人简介</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="input min-h-[100px]" maxLength={500} />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-between">
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600 hover:underline">退出登录</button>
            <button onClick={saveProfile} disabled={saving} className="btn-primary px-8">{saving ? '保存中...' : '保存修改'}</button>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold">我的装修偏好</h2>
          <p className="text-sm text-gray-500">设置您的偏好，系统会更精准地为您匹配设计师和灵感</p>
          <div>
            <h3 className="font-medium mb-3">🎨 喜欢的风格</h3>
            <div className="flex flex-wrap gap-2">
              {DECORATION_STYLES.map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, styleTags: toggleArr(p.styleTags, s) }))} className={`px-4 py-2 rounded-xl text-sm transition-all border-2 ${form.styleTags.includes(s) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {form.styleTags.includes(s) && '✓ '}{s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">🧱 偏好材质</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_MATERIALS.map(m => (
                <button key={m} onClick={() => setForm(p => ({ ...p, materials: toggleArr(p.materials, m) }))} className={`px-3 py-1.5 rounded-full text-sm transition-all ${form.materials.includes(m) ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button onClick={saveProfile} disabled={saving} className="btn-primary px-8">{saving ? '保存中...' : '保存偏好'}</button>
          </div>
        </div>
      )}

      {activeTab === 'diaries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">我的装修日记</h2>
            <Link to="/diaries/create" className="btn-accent">+ 发布日记</Link>
          </div>
          {myDiaries.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-5xl mb-3">📝</p>
              <p className="text-gray-500 mb-4">还没有发布过装修日记</p>
              <Link to="/diaries/create" className="btn-primary">发布第一篇</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDiaries.map(d => (
                <Link key={d._id} to={`/diaries/${d._id}`} className="card p-4 hover:shadow-lg transition-all flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {d.coverImage ? <img src={d.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center text-3xl">🏠</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{d.title}</h3>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 flex-wrap">
                      <span className="badge bg-primary-50 text-primary-700">{d.houseArea}㎡</span>
                      {d.styleTags?.slice(0, 2).map(s => <span key={s} className="badge bg-gray-100 text-gray-600">{s}</span>)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>👁 {d.views} ❤ {d.likes?.length || 0}</span>
                      <span>{formatDate(d.createdAt, 'MM-DD')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-bold">修改密码</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">原密码</label>
              <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">新密码</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">确认新密码</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="input" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button onClick={changePwd} className="btn-primary px-8">修改密码</button>
          </div>
        </div>
      )}
    </div>
  );
}
