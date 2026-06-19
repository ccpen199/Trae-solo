import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDonors } from '../../data/mockData';
import { Building2, DollarSign, Award, Search, Plus, ExternalLink, X, Upload, ChevronDown, ChevronUp, Users, TrendingUp, GraduationCap, MessageCircle } from 'lucide-react';

const industryOptions = ['互联网', '通信技术', '金融', '教育', '医疗', '制造业', '公益组织', '其他'];

const mockDonorProjects: Record<string, { name: string; amount: number; students: number }[]> = {
  '1': [
    { name: '希望工程励志奖学金', amount: 100000, students: 20 },
    { name: '农村教育支持计划', amount: 150000, students: 50 },
    { name: '贫困生助学金', amount: 250000, students: 100 },
  ],
  '2': [
    { name: '乡村振兴英才奖学金', amount: 120000, students: 15 },
    { name: '电商人才培养计划', amount: 480000, students: 60 },
    { name: '农业技术培训项目', amount: 600000, students: 200 },
  ],
  '3': [
    { name: '科技创新奖学金', amount: 100000, students: 10 },
    { name: '编程竞赛基金', amount: 200000, students: 50 },
    { name: 'AI人才培养计划', amount: 500000, students: 30 },
  ],
  '4': [
    { name: 'ICT技术奖学金', amount: 150000, students: 15 },
    { name: '鸿蒙开发者计划', amount: 300000, students: 40 },
    { name: '5G技术研究基金', amount: 150000, students: 10 },
  ],
};

const mockDonationTrends: Record<string, { month: string; amount: number }[]> = {
  '1': [
    { month: '1月', amount: 50000 },
    { month: '2月', amount: 45000 },
    { month: '3月', amount: 60000 },
    { month: '4月', amount: 55000 },
    { month: '5月', amount: 70000 },
    { month: '6月', amount: 80000 },
  ],
  '2': [
    { month: '1月', amount: 80000 },
    { month: '2月', amount: 120000 },
    { month: '3月', amount: 100000 },
    { month: '4月', amount: 150000 },
    { month: '5月', amount: 130000 },
    { month: '6月', amount: 180000 },
  ],
  '3': [
    { month: '1月', amount: 60000 },
    { month: '2月', amount: 70000 },
    { month: '3月', amount: 80000 },
    { month: '4月', amount: 90000 },
    { month: '5月', amount: 100000 },
    { month: '6月', amount: 110000 },
  ],
  '4': [
    { month: '1月', amount: 40000 },
    { month: '2月', amount: 50000 },
    { month: '3月', amount: 60000 },
    { month: '4月', amount: 70000 },
    { month: '5月', amount: 80000 },
    { month: '6月', amount: 90000 },
  ],
};

const Donors: FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedDonorId, setExpandedDonorId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    qualification: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredDonors = mockDonors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDonations = mockDonors.reduce(
    (sum, d) => sum + d.totalDonations,
    0
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入捐赠方名称';
    if (!formData.industry) newErrors.industry = '请选择行业';
    if (!formData.email.trim()) {
      newErrors.email = '请输入联系邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowInviteModal(false);
      setShowSuccess(true);
      setFormData({
        name: '',
        industry: '',
        email: '',
        phone: '',
        website: '',
        description: '',
        qualification: null,
      });
      setErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, qualification: file });
    }
  };

  const toggleDonorExpand = (donorId: string) => {
    setExpandedDonorId(expandedDonorId === donorId ? null : donorId);
  };

  const getDonorTotalStudents = (donorId: string) => {
    const projects = mockDonorProjects[donorId] || [];
    return projects.reduce((sum, p) => sum + p.students, 0);
  };

  const getTrendMaxAmount = (donorId: string) => {
    const trends = mockDonationTrends[donorId] || [];
    return Math.max(...trends.map(t => t.amount));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-pink-900">捐赠方入驻管理</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">1. 邀请入驻</span>
                <span className="text-pink-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">2. 发布资助项目</span>
                <span className="text-pink-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">3. 学生申请</span>
                <span className="text-pink-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">4. 匿名故事沉淀</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/scholarship/projects')} className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
              <GraduationCap className="w-4 h-4" />
              发布资助项目
            </button>
            <button onClick={() => navigate('/scholarship/stories')} className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4" />
              查看励志故事
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索捐赠方名称、行业..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => navigate('/scholarship/projects')}
              className="px-4 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
            >
              资助项目
            </button>
            <button
              onClick={() => navigate('/scholarship/stories')}
              className="px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
            >
              励志故事
            </button>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            邀请捐赠方
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockDonors.length}
              </p>
              <p className="text-xs text-gray-500">入驻捐赠方</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {(totalDonations / 10000).toFixed(0)}万
              </p>
              <p className="text-xs text-gray-500">累计捐赠金额</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockDonors.reduce((sum, d) => sum + d.projectCount, 0)}
              </p>
              <p className="text-xs text-gray-500">资助项目数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredDonors.map((donor) => (
          <div
            key={donor.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div
              className="p-6 cursor-pointer"
              onClick={() => toggleDonorExpand(donor.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {donor.name}
                      </h3>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                        {donor.industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {expandedDonorId === donor.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {donor.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">累计捐赠</p>
                  <p className="text-lg font-bold text-green-600">
                    ¥{(donor.totalDonations / 10000).toFixed(0)}万
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">资助项目</p>
                  <p className="text-lg font-bold text-blue-600">
                    {donor.projectCount}个
                  </p>
                </div>
              </div>
            </div>

            {expandedDonorId === donor.id && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="pt-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-800">已资助项目列表</h4>
                    </div>
                    <div className="space-y-2">
                      {(mockDonorProjects[donor.id] || []).map((project, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{project.name}</span>
                          <span className="text-sm font-medium text-green-600">
                            ¥{(project.amount / 10000).toFixed(0)}万 / {project.students}人
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-gray-800">累计捐赠金额趋势（近6个月）</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-32 gap-2">
                        {(mockDonationTrends[donor.id] || []).map((trend, index) => {
                          const maxAmount = getTrendMaxAmount(donor.id);
                          const heightPercent = (trend.amount / maxAmount) * 100;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500"
                                style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                              />
                              <span className="text-xs text-gray-500 mt-2">{trend.month}</span>
                              <span className="text-xs text-gray-400">
                                {(trend.amount / 10000).toFixed(0)}万
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-orange-600" />
                      <h4 className="text-sm font-semibold text-gray-800">受助学生数统计</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {getDonorTotalStudents(donor.id)}
                        </p>
                        <p className="text-xs text-gray-500">累计受助学生</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {(mockDonorProjects[donor.id] || []).length}
                        </p>
                        <p className="text-xs text-gray-500">已完成项目</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">邀请捐赠方入驻</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setErrors({});
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  捐赠方名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入捐赠方名称"
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  行业 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.industry ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">请选择行业</option>
                  {industryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    联系邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                    className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入联系电话"
                    className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  官方网站
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  捐赠方简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入捐赠方简介..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  资质证明
                </label>
                <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {formData.qualification ? formData.qualification.name : '点击上传资质证明文件'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setErrors({});
                  }}
                  className="flex-1 h-10 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  发送邀请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">入驻邀请已发送，等待企业确认</span>
        </div>
      )}
    </div>
  );
};

export default Donors;
