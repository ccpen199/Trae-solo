import { useState } from 'react';
import { mockLogs, mockTeams } from '../../data/mockData';
import {
  FileText,
  Sparkles,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  Eye,
  Plus,
  BookOpen,
} from 'lucide-react';

const PracticeLogs = () => {
  const [selectedLog, setSelectedLog] = useState<string | null>(
    mockLogs[0]?.id || null
  );
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter((log) => {
    const matchesTeam =
      selectedTeam === 'all' || log.teamId === selectedTeam;
    const matchesSearch =
      log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  const activeLog = mockLogs.find((log) => log.id === selectedLog);

  const totalHours = mockLogs.reduce((sum, log) => sum + log.serviceHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索日志内容、团队、作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <Plus className="w-4 h-4" />
          撰写日志
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{mockLogs.length}</p>
              <p className="text-xs text-gray-500">日志总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHours}h</p>
              <p className="text-xs text-gray-500">累计服务时长</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockLogs.filter((l) => l.summary).length}
              </p>
              <p className="text-xs text-gray-500">AI摘要生成</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">32</p>
              <p className="text-xs text-gray-500">关键词提取</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">日志列表</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedLog === log.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {log.teamName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {log.content.slice(0, 50)}...
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{log.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{log.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {log.summary && (
                  <div className="mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">已生成AI摘要</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeLog ? (
            <div className="h-[600px] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {activeLog.teamName}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.serviceHours}小时服务
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Eye className="w-4 h-4" />
                    查看全文
                  </button>
                </div>
              </div>

              {activeLog.summary && (
                <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      AI智能摘要
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeLog.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activeLog.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-white text-yellow-700 rounded-full border border-yellow-200"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">日志正文</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {activeLog.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">请选择一篇日志查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeLogs;
