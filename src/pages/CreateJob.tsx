import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Calendar, Users, FileText, Send } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function CreateJob() {
  const navigate = useNavigate();
  const userRole = useAuthStore(state => state.user?.role);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'daily' as 'daily' | 'weekly' | 'project' | 'remote',
    salary_type: 'daily' as 'hourly' | 'daily' | 'weekly' | 'fixed',
    salary_amount: '',
    location_address: '',
    required_skills: '',
    start_date: '',
    end_date: '',
    working_hours: '',
    max_applicants: '10'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.salary_amount) {
      alert('请填写必填项');
      return;
    }

    setLoading(true);
    const result = await jobsApi.create({
      ...formData,
      salary_amount: Number(formData.salary_amount),
      max_applicants: Number(formData.max_applicants)
    });
    setLoading(false);

    if (result.success) {
      alert('岗位发布成功！');
      navigate('/employer/jobs');
    } else {
      alert(result.error || '发布失败');
    }
  };

  if (userRole !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">只有雇主可以发布岗位</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-600" />
            发布岗位
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                岗位名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：快递分拣员、餐饮服务员"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  岗位类型
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'daily', label: '日结' },
                    { value: 'weekly', label: '周结' },
                    { value: 'project', label: '项目制' },
                    { value: 'remote', label: '远程' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, job_type: type.value as any })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        formData.job_type === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  薪资类型
                </label>
                <select
                  value={formData.salary_type}
                  onChange={e => setFormData({ ...formData, salary_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">按小时</option>
                  <option value="daily">按天</option>
                  <option value="weekly">按周</option>
                  <option value="fixed">固定金额</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                薪资金额 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.salary_amount}
                  onChange={e => setFormData({ ...formData, salary_amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入薪资金额"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                工作地点
              </label>
              <input
                type="text"
                value={formData.location_address}
                onChange={e => setFormData({ ...formData, location_address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入详细工作地址"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                岗位描述
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="请详细描述工作内容、要求等信息"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                技能要求（用逗号分隔）
              </label>
              <input
                type="text"
                value={formData.required_skills}
                onChange={e => setFormData({ ...formData, required_skills: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：搬运, 分拣, 吃苦耐劳"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                工作时间
              </label>
              <input
                type="text"
                value={formData.working_hours}
                onChange={e => setFormData({ ...formData, working_hours: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：09:00-18:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                最大申请人数
              </label>
              <input
                type="number"
                value={formData.max_applicants}
                onChange={e => setFormData({ ...formData, max_applicants: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? '发布中...' : '发布岗位'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
