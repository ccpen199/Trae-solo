import { useState } from 'react';
import { mockScholarships } from '../../data/mockData';
import {
  GraduationCap,
  DollarSign,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
} from 'lucide-react';

const ScholarshipProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          发布新项目
        </button>
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
                <button className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  查看详情
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipProjects;
