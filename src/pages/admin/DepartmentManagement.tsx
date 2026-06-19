import { useState } from 'react';
import { mockDepartments } from '../../data/mockData';
import {
  Building2,
  Users,
  Clock,
  Award,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const DepartmentManagement = () => {
  const departments = mockDepartments;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = departments.reduce((sum, d) => sum + d.studentCount, 0);
  const totalHours = departments.reduce((sum, d) => sum + d.totalHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索院系名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          添加院系
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {departments.length}
              </p>
              <p className="text-xs text-gray-500">院系总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {totalStudents.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">学生总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {(totalHours / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500">总服务时长</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {(
                  departments.reduce((sum, d) => sum + d.avgCredits, 0) /
                  departments.length
                ).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">平均学分</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">院系列表</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                院系名称
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                学生人数
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                参与率
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                总服务时长
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                平均学分
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDepartments.map((dept, index) => (
              <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                        index % 3 === 0
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : index % 3 === 1
                          ? 'bg-gradient-to-br from-green-400 to-green-600'
                          : 'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`}
                    >
                      {dept.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {dept.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {dept.studentCount}人
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dept.participationRate >= 90
                            ? 'bg-green-500'
                            : dept.participationRate >= 80
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${dept.participationRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {dept.participationRate}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {dept.totalHours.toLocaleString()}小时
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-green-600">
                    {dept.avgCredits}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentManagement;
