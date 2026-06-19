import { useState, useMemo } from 'react';
import type { Team } from '../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockDepartments } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
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
  X,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from 'lucide-react';

const DepartmentManagement = () => {
  const { teams } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const departments = mockDepartments;
  const [searchTerm, setSearchTerm] = useState('');

  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      dept: params.get('dept'),
    };
  }, [location.search]);

  const hasUrlFilter = !!urlParams.dept;

  const expandedDept = useMemo(() => {
    if (!urlParams.dept) return null;
    return departments.find((d) => d.name === urlParams.dept) || null;
  }, [urlParams.dept, departments]);

  const deptTeams = useMemo(() => {
    if (!urlParams.dept) return [] as Team[];
    return teams.filter((t) => t.department === urlParams.dept);
  }, [urlParams.dept, teams]);

  const reviewStats = useMemo(() => {
    if (!urlParams.dept) return null;
    const deptTeamList = teams.filter((t) => t.department === urlParams.dept);
    return {
      total: deptTeamList.length,
      draft: deptTeamList.filter((t) => t.status === 'draft').length,
      pending: deptTeamList.filter((t) => ['pending', 'advisor_reviewing', 'dept_reviewing'].includes(t.status)).length,
      approved: deptTeamList.filter((t) => ['approved', 'ongoing', 'completed', 'certified'].includes(t.status)).length,
      rejected: deptTeamList.filter((t) => ['advisor_rejected', 'dept_rejected'].includes(t.status)).length,
    };
  }, [urlParams.dept, teams]);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = departments.reduce((sum, d) => sum + d.studentCount, 0);
  const totalHours = departments.reduce((sum, d) => sum + d.totalHours, 0);

  return (
    <div className="space-y-6">
      {/* URL参数过滤提示条 */}
      {hasUrlFilter && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>
            当前展示「{urlParams.dept}」的详细信息
            <button
              onClick={() => navigate('/admin/departments')}
              className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
            >
              清除筛选
            </button>
          </span>
          <button
            onClick={() => navigate('/admin/departments')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 展开的院系详情面板 */}
      {expandedDept && reviewStats && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {expandedDept.name} - 详细信息
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {/* 审核进度统计 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">审核进度统计</h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-gray-800">{reviewStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">团队总数</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-gray-600">{reviewStats.draft}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    草稿
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{reviewStats.pending}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center justify-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    审核中
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{reviewStats.approved}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已通过
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-2xl font-bold text-red-600">{reviewStats.rejected}</p>
                  <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" />
                    已驳回
                  </p>
                </div>
              </div>
            </div>

            {/* 团队列表 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">
                该院系所有团队（共 {deptTeams.length} 支）
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        团队名称
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        项目名称
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        队长
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        指导老师
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deptTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">
                            {team.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 truncate block max-w-[200px]">
                            {team.projectName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {team.leaderName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              team.status === 'approved' ||
                              team.status === 'ongoing' ||
                              team.status === 'completed' ||
                              team.status === 'certified'
                                ? 'bg-green-100 text-green-700'
                                : team.status === 'advisor_rejected' ||
                                  team.status === 'dept_rejected'
                                ? 'bg-red-100 text-red-700'
                                : team.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {team.status === 'approved' ||
                            team.status === 'ongoing' ||
                            team.status === 'completed' ||
                            team.status === 'certified'
                              ? '已通过'
                              : team.status === 'advisor_rejected' ||
                                team.status === 'dept_rejected'
                              ? '已驳回'
                              : team.status === 'draft'
                              ? '草稿'
                              : '审核中'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {team.advisorName || '未分配'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {deptTeams.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                          该院系暂无团队
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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
