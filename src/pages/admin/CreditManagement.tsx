import { useState } from 'react';
import { mockStudents } from '../../data/mockData';
import {
  Award,
  RefreshCw,
  Upload,
  Download,
  CheckCircle,
  Clock,
  Search,
  Filter,
  User,
} from 'lucide-react';

const CreditManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const creditRecords = [
    { id: '1', student: mockStudents[0], course: '暑期三下乡社会实践', hours: 128, credits: 6.5, status: 'approved', applyDate: '2024-08-20', approver: '王老师' },
    { id: '2', student: mockStudents[1], course: '社区志愿服务', hours: 96, credits: 4.8, status: 'pending', applyDate: '2024-08-22', approver: '-' },
    { id: '3', student: mockStudents[2], course: '企业实习实践', hours: 156, credits: 7.8, status: 'approved', applyDate: '2024-08-15', approver: '李老师' },
    { id: '4', student: mockStudents[3], course: '农业技术推广', hours: 210, credits: 10.5, status: 'approved', applyDate: '2024-08-18', approver: '张老师' },
  ];

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待认定', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: '已认定', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: Clock },
  };

  const filteredRecords = creditRecords.filter((record) => {
    const matchesSearch =
      record.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student.studentId.includes(searchTerm) ||
      record.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCredits = mockStudents.reduce((sum, s) => sum + s.credits, 0);
  const totalHours = mockStudents.reduce((sum, s) => sum + s.practiceHours, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">教育部实践学分对接标准</h2>
            <p className="text-blue-100 text-sm mt-1">
              依据《普通高等学校学生管理规定》，学生在校期间需完成不少于100小时社会实践，
              认定学分为第二课堂成绩单重要组成部分
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors">
              <RefreshCw className="w-4 h-4" />
              同步数据
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
              <Upload className="w-4 h-4" />
              上报教育部
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockStudents.length}
              </p>
              <p className="text-xs text-gray-500">本学期申请人数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {totalCredits.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">认定总学分</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHours}</p>
              <p className="text-xs text-gray-500">总服务时长</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {((creditRecords.filter((r) => r.status === 'approved').length /
                  creditRecords.length) *
                  100).toFixed(1)}
                %
              </p>
              <p className="text-xs text-gray-500">认定通过率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索学生姓名、学号、实践项目..."
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
              <option value="pending">待认定</option>
              <option value="approved">已认定</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4" />
            批量导入
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                学生信息
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                实践项目
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                服务时长
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                认定学分
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                申请日期
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                状态
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                审核人
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {record.student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {record.student.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.student.studentId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{record.course}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-700">
                    {record.hours}小时
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-green-600">
                    {record.credits}学分
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {record.applyDate}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      statusMap[record.status].color
                    }`}
                  >
                    {(() => {
                      const IconComponent = statusMap[record.status].icon;
                      return IconComponent ? (
                        <IconComponent className="w-3 h-3" />
                      ) : null;
                    })()}
                    {statusMap[record.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {record.approver}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditManagement;
