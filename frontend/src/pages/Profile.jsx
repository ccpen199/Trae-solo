import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, Award, BookOpen, MessageSquare } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import useAuthStore from '../store/authStore';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nickname: '',
    bio: ''
  });
  const [stats, setStats] = useState({
    courses: 0,
    assessments: 0,
    posts: 0,
    activeScore: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProfile({
          nickname: data.data.nickname || '',
          bio: data.data.bio || ''
        });
        setStats(prev => ({ ...prev, activeScore: data.data.active_score || 0 }));
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) return;

    try {
      const [coursesRes, assessmentsRes, postsRes] = await Promise.all([
        fetch('/api/courses/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/assessments/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/community/posts/my', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const coursesData = await coursesRes.json();
      const assessmentsData = await assessmentsRes.json();
      const postsData = await postsRes.json();

      setStats({
        courses: coursesData.data?.pagination?.total || 0,
        assessments: assessmentsData.data?.pagination?.total || 0,
        posts: postsData.data?.pagination?.total || 0,
        activeScore: stats.activeScore
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await response.json();
      if (data.success) {
        showToast('保存成功', 'success');
        if (user) {
          updateUser({ ...user, nickname: profile.nickname, bio: profile.bio });
        }
      } else {
        showToast(data.message || '保存失败', 'error');
      }
    } catch (error) {
      showToast('保存失败，请稍后重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.username || '用户'}</h2>
            <p className="text-gray-500">{user?.email || ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.courses}</p>
            <p className="text-sm text-gray-500">学习课程</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.assessments}</p>
            <p className="text-sm text-gray-500">完成测评</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.posts}</p>
            <p className="text-sm text-gray-500">发布帖子</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.activeScore}</p>
            <p className="text-sm text-gray-500">活跃值</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              昵称
            </label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入昵称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              个人简介
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="介绍一下自己..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">账号信息</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">用户名</span>
            </div>
            <span className="text-gray-800 font-medium">{user?.username || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">邮箱</span>
            </div>
            <span className="text-gray-800 font-medium">{user?.email || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">注册时间</span>
            </div>
            <span className="text-gray-800 font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
