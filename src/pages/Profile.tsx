import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Clock, Star, CreditCard, Award, Edit2, Save, X } from 'lucide-react';
import { authApi, skillsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const skills = useAuthStore(state => state.skills);
  const setProfile = useAuthStore(state => state.setProfile);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);

    const [profileResult, skillsResult] = await Promise.all([
      authApi.getProfile(),
      skillsApi.list()
    ]);

    setLoading(false);

    if (profileResult.success && profileResult.data) {
      setProfile(profileResult.data.profile, profileResult.data.skills, profileResult.data.certificates);
      setFormData(profileResult.data.profile || {});
    }

    if (skillsResult.success && skillsResult.data) {
      setAllSkills(skillsResult.data);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await authApi.updateProfile({
      name: user?.name,
      ...formData
    });
    setSaving(false);

    if (result.success) {
      setEditing(false);
      loadData();
    } else {
      alert(result.error || '保存失败');
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) return;

    const result = await skillsApi.add(selectedSkill);
    if (result.success) {
      setSelectedSkill('');
      loadData();
    } else {
      alert(result.error || '添加失败');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const result = await skillsApi.remove(skillId);
    if (result.success) {
      loadData();
    }
  };

  const roleLabels: Record<string, string> = {
    job_seeker: '求职者',
    employer: '雇主',
    admin: '管理员'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.name || user?.email}</h1>
                <p className="text-blue-100">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
              <button
                onClick={() => editing ? setEditing(false) : setEditing(true)}
                className="ml-auto bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {editing ? '取消' : '编辑'}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {user?.role === 'job_seeker' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">信用分</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{profile?.credit_score || 100}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">上岗时效</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{profile?.onboarding_effectiveness_hours || 24}小时</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">平均评分</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{profile?.average_rating || 5.0}</p>
                  </div>
                </>
              )}

              {user?.role === 'employer' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">认证状态</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                      {profile?.verified ? '已认证' : '未认证'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">平均评分</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{profile?.average_rating || 5.0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-sm">发布岗位</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{profile?.total_posted_jobs || 0}</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">基本信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>

                {user?.role === 'job_seeker' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
                      {editing ? (
                        <select
                          value={formData.gender || ''}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">请选择</option>
                          <option value="male">男</option>
                          <option value="female">女</option>
                          <option value="other">其他</option>
                        </select>
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : profile?.gender === 'other' ? '其他' : '未设置'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">出生日期</label>
                      {editing ? (
                        <input
                          type="date"
                          value={formData.birth_date || ''}
                          onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.birth_date || '未设置'}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">所在地区</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.location_address || ''}
                          onChange={e => setFormData({ ...formData, location_address: e.target.value })}
                          placeholder="请输入详细地址"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {profile?.location_address || '未设置'}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                      {editing ? (
                        <textarea
                          value={formData.bio || ''}
                          onChange={e => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="介绍一下自己..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px]">
                          {profile?.bio || '暂无简介'}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {user?.role === 'employer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司名称</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.company_name || ''}
                          onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="请输入公司名称"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.company_name || '未设置'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司类型</label>
                      {editing ? (
                        <select
                          value={formData.company_type || ''}
                          onChange={e => setFormData({ ...formData, company_type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">请选择</option>
                          <option value="enterprise">企业</option>
                          <option value="individual">个体商户</option>
                          <option value="project_team">项目制团队</option>
                        </select>
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.company_type === 'enterprise' ? '企业' :
                           profile?.company_type === 'individual' ? '个体商户' :
                           profile?.company_type === 'project_team' ? '项目制团队' : '未设置'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">联系人</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.contact_name || ''}
                          onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                          placeholder="请输入联系人姓名"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.contact_name || '未设置'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData.contact_phone || ''}
                          onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                          placeholder="请输入联系电话"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {profile?.contact_phone || '未设置'}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {user?.role === 'job_seeker' && (
                <div className="pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">技能标签</h2>
                    {editing && (
                      <div className="flex gap-2">
                        <select
                          value={selectedSkill}
                          onChange={e => setSelectedSkill(e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">选择技能</option>
                          {allSkills
                            .filter(s => !skills.some(us => us.id === s.id))
                            .map(skill => (
                              <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                        </select>
                        <button
                          onClick={handleAddSkill}
                          disabled={!selectedSkill}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition"
                        >
                          添加
                        </button>
                      </div>
                    )}
                  </div>

                  {skills.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无技能标签</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {skill.name}
                          {skill.verified && <span className="text-green-600">✓</span>}
                          {editing && (
                            <button
                              onClick={() => handleRemoveSkill(skill.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editing && (
                <div className="pt-6 border-t flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
