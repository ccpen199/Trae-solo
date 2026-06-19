import { useState } from 'react';
import { mockCheckIns, mockTeams } from '../../data/mockData';
import { MapPin, Clock, Camera, Calendar, Search, Filter } from 'lucide-react';

const CheckIn = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCheckIns = mockCheckIns.filter((checkIn) => {
    const matchesTeam =
      selectedTeam === 'all' || checkIn.teamId === selectedTeam;
    const matchesSearch =
      checkIn.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkIn.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索打卡地点、团队..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部团队</option>
              {mockTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <MapPin className="w-4 h-4" />
          记录打卡
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockCheckIns.length}
              </p>
              <p className="text-xs text-gray-500">今日打卡</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">156</p>
              <p className="text-xs text-gray-500">累计打卡</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">23</p>
              <p className="text-xs text-gray-500">活跃团队</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">6.8h</p>
              <p className="text-xs text-gray-500">人均日均</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">打卡轨迹</h3>
          </div>
          <div className="h-96 bg-gray-50 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">地图组件区域</p>
                <p className="text-gray-300 text-xs mt-1">
                  集成LBS定位服务后将显示实际地图
                </p>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
              <p className="text-xs text-gray-500 mb-1">今日打卡点</p>
              <p className="text-lg font-bold text-blue-600">
                {mockCheckIns.length} 个
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">最新打卡</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {checkIn.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {checkIn.teamName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {checkIn.timestamp}
                      </span>
                    </div>
                    {checkIn.photoUrl && (
                      <div className="mt-2 w-full h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={checkIn.photoUrl}
                          alt="打卡照片"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">打卡记录详情</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                团队名称
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                打卡地点
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                时间
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                描述
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                照片
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCheckIns.map((checkIn) => (
              <tr key={checkIn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {checkIn.teamName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">
                      {checkIn.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {checkIn.timestamp}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm text-gray-600 truncate">
                    {checkIn.description}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {checkIn.photoUrl ? (
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={checkIn.photoUrl}
                        alt="打卡"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">无照片</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckIn;
