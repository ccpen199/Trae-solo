import { useState } from 'react';
import { mockTeams } from '../../data/mockData';
import { Plus, Search, Filter, Eye, Edit, Trash2, Users } from 'lucide-react';

const TeamList = () => {
  const teams = mockTeams;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    ongoing: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leaderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索团队名称、项目、负责人..."
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
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="ongoing">进行中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          新建团队
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusMap).map(([key, val]) => {
          const count = teams.filter((t) => t.status === key).length;
          return (
            <div
              key={key}
              className={`p-4 rounded-xl border ${
                statusFilter === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-white'
              } cursor-pointer transition-colors`}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${val.color}`}>
                  {val.label}
                </span>
                <span className="text-2xl font-bold text-gray-800">{count}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">个团队</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                团队信息
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                负责人
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                实践地点
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                时间
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                状态
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                打卡/日志
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTeams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {team.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {team.projectName}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {team.members.length}人
                      </span>
                      <span className="text-xs text-gray-300 mx-1">|</span>
                      <span className="text-xs text-gray-400">
                        {team.department}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {team.leaderName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{team.leaderName}</p>
                      <p className="text-xs text-gray-400">队长</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{team.location}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-600">{team.startDate}</p>
                    <p className="text-gray-400 text-xs">至 {team.endDate}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      statusMap[team.status].color
                    }`}
                  >
                    {statusMap[team.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {team.checkInCount}
                      </p>
                      <p className="text-xs text-gray-400">打卡</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {team.logCount}
                      </p>
                      <p className="text-xs text-gray-400">日志</p>
                    </div>
                  </div>
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

export default TeamList;
