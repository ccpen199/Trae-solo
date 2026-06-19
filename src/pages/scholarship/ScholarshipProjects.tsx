import type { Scholarship } from '../../types';
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockScholarships, mockDonors } from '../../data/mockData';
import {
  GraduationCap,
  DollarSign,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  X,
  Building2,
  UserCheck,
  MessageCircle,
} from 'lucide-react';

const mockApplicantCounts: Record<string, number> = {
  '1': 156,
  '2': 89,
  '3': 234,
};

const ScholarshipProjects: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      setShowPublishModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    donorId: '',
    amount: '',
    recipients: '',
    deadline: '',
    description: '',
    requirements: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredScholarships = mockScholarships.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.donorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = mockScholarships.reduce(
    (sum, s) => sum + s.amount * s.recipients,
    0
  );
  const totalRecipients = mockScholarships.reduce(
    (sum, s) => sum + s.recipients,
    0
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入项目名称';
    if (!formData.donorId) newErrors.donorId = '请选择关联捐赠方';
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = '请输入有效的资助金额';
    if (!formData.recipients || Number(formData.recipients) <= 0) newErrors.recipients = '请输入有效的资助名额';
    if (!formData.deadline) newErrors.deadline = '请选择申请截止日期';
    if (!formData.description.trim()) newErrors.description = '请输入项目描述';
    if (!formData.requirements.trim()) newErrors.requirements = '请输入申请条件';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPublishModal(false);
      setShowSuccess(true);
      setFormData({
        name: '',
        donorId: '',
        amount: '',
        recipients: '',
        deadline: '',
        description: '',
        requirements: '',
      });
      setErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const openDetailModal = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setShowDetailModal(true);
  };

  const getDonorInfo = (donorName: string) => {
    return mockDonors.find(d => d.name === donorName);
  };

  const getApplicantCount = (id: string) => {
    return mockApplicantCounts[id] || 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">资助项目管理</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">捐赠方入驻</span>
                <span className="text-purple-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full ring-2 ring-purple-400">2. 发布项目</span>
                <span className="text-purple-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">3. 学生申请</span>
                <span className="text-purple-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">4. 资助发放</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/scholarship/donors')} className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-sm">
              <Building2 className="w-4 h-4" />
              捐赠方入驻
            </button>
            <button onClick={() => navigate('/scholarship/stories')} className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4" />
              励志故事
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
                placeholder="搜索奖学金项目、捐赠方..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="ongoing">进行中</option>
                <option value="closed">已结束</option>
              </select>
            </div>
            <button
              onClick={() => navigate('/scholarship/donors')}
              className="px-4 py-2.5 bg-pink-50 text-pink-700 border border-pink-200 text-sm font-medium rounded-lg hover:bg-pink-100 transition-colors"
            >
              捐赠方入驻
            </button>
            <button
              onClick={() => navigate('/scholarship/stories')}
              className="px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
            >
              励志故事
            </button>
          </div>
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            发布新项目
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockScholarships.length}
              </p>
              <p className="text-xs text-gray-500">奖学金项目</p>
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
                {(totalAmount / 10000).toFixed(1)}万
              </p>
              <p className="text-xs text-gray-500">资助总金额</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalRecipients}</p>
              <p className="text-xs text-gray-500">受助学生数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockScholarships.filter((s) => s.status === 'ongoing').length}
              </p>
              <p className="text-xs text-gray-500">进行中项目</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredScholarships.map((scholarship) => (
          <div
            key={scholarship.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {scholarship.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {scholarship.donorName}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    scholarship.status === 'ongoing'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {scholarship.status === 'ongoing' ? '申请中' : '已结束'}
                </span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {scholarship.description}
              </p>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">资助金额</p>
                  <p className="text-lg font-bold text-blue-600">
                    ¥{scholarship.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">资助名额</p>
                  <p className="text-lg font-bold text-gray-700">
                    {scholarship.recipients}人
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>截止：{scholarship.deadline}</span>
                </div>
                <button
                  onClick={() => openDetailModal(scholarship)}
                  className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  查看详情
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">发布奖学金项目</h2>
              <button
                onClick={() => {
                  setShowPublishModal(false);
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
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  关联捐赠方 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.donorId}
                  onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.donorId ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">请选择捐赠方</option>
                  {mockDonors.map((donor) => (
                    <option key={donor.id} value={donor.id}>
                      {donor.name}
                    </option>
                  ))}
                </select>
                {errors.donorId && <p className="text-xs text-red-500 mt-1">{errors.donorId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    资助金额（元） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="5000"
                    min="1"
                    className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.amount ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    资助名额（人） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                    placeholder="20"
                    min="1"
                    className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.recipients ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.recipients && <p className="text-xs text-red-500 mt-1">{errors.recipients}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  申请截止日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deadline ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  项目描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入项目描述，说明资助目的和范围..."
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  申请条件 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="请输入申请条件，每行一条..."
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.requirements ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.requirements && <p className="text-xs text-red-500 mt-1">{errors.requirements}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishModal(false);
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
                  发布项目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedScholarship && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">项目详情</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedScholarship(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedScholarship.name}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      selectedScholarship.status === 'ongoing'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {selectedScholarship.status === 'ongoing' ? '申请中' : '已结束'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {selectedScholarship.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{selectedScholarship.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">人均资助金额</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedScholarship.recipients}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">资助名额</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {getApplicantCount(selectedScholarship.id)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">已申请人数</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-800">申请条件</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedScholarship.requirements.split('；').map((req, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-600">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-800">捐赠方信息</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {selectedScholarship.donorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getDonorInfo(selectedScholarship.donorName)?.industry || '公益组织'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    {getDonorInfo(selectedScholarship.donorName)?.description || '致力于支持教育事业的社会力量'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>申请截止：{selectedScholarship.deadline}</span>
                </div>
                <button
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={selectedScholarship.status !== 'ongoing'}
                >
                  {selectedScholarship.status === 'ongoing' ? '立即申请' : '申请已结束'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">项目已发布，学生可开始申请</span>
        </div>
      )}
    </div>
  );
};

export default ScholarshipProjects;
