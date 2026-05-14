import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { User, Mail, FileText, Save } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuthStore();
  const toast = useToastStore();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [authUser, navigate]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getCurrentUser();
      if (res?.success) {
        const data = res.data;
        setNickname(data.nickname || '');
        setEmail(data.email || '');
        setBio(data.bio || '');
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
      });
      if (res?.success) {
        setUser(res.data);
        toast.success('资料已更新');
      }
    } catch (err) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!authUser) return null;
  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">账号设置</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            <Avatar src={authUser.avatar} alt={authUser.nickname} size="xl" />
            <div>
              <h3 className="font-medium text-gray-900">
                {authUser.nickname || authUser.username}
              </h3>
              <p className="text-sm text-gray-500">@{authUser.username}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                authUser.role === 'admin' ? 'bg-red-50 text-red-600' :
                authUser.role === 'moderator' ? 'bg-purple-50 text-purple-600' :
                authUser.role === 'editor' ? 'bg-green-50 text-green-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                {authUser.role === 'admin' ? '管理员' :
                 authUser.role === 'moderator' ? '审核人员' :
                 authUser.role === 'editor' ? '编辑人员' : '普通用户'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} className="inline mr-1" />
                邮箱
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">邮箱不可修改</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                个人简介
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="介绍一下你自己..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
