import React, { useState } from 'react';
import {
  KeyRound,
  LogIn,
  LogOut,
  CreditCard,
  Smartphone,
  Camera,
  Search,
  Plus,
  Download,
  Clock,
  User,
} from 'lucide-react';
import type { AccessRecord } from '@/types';

const mockRecords: AccessRecord[] = [
  { id: 1, residentName: '张三', unit: '1-101', gate: '东门', time: '2024-01-15 08:30:15', type: 'entry', method: 'face' },
  { id: 2, residentName: '李四', unit: '1-102', gate: '东门', time: '2024-01-15 08:32:45', type: 'entry', method: 'card' },
  { id: 3, residentName: '王五', unit: '2-503', gate: '南门', time: '2024-01-15 09:15:20', type: 'exit', method: 'app' },
  { id: 4, residentName: '赵六', unit: '3-802', gate: '西门', time: '2024-01-15 10:00:00', type: 'entry', method: 'face' },
  { id: 5, residentName: '孙七', unit: '5-301', gate: '北门', time: '2024-01-15 11:30:45', type: 'exit', method: 'card' },
  { id: 6, residentName: '周八', unit: '2-1204', gate: '东门', time: '2024-01-15 12:05:10', type: 'entry', method: 'app' },
  { id: 7, residentName: '吴九', unit: '6-606', gate: '南门', time: '2024-01-15 14:20:30', type: 'exit', method: 'face' },
  { id: 8, residentName: '郑十', unit: '8-1502', gate: '东门', time: '2024-01-15 17:45:00', type: 'entry', method: 'card' },
];

const methodConfig = {
  card: { label: '门禁卡', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-100' },
  face: { label: '人脸识别', icon: Camera, color: 'text-accent-green-500', bg: 'bg-accent-green-100' },
  app: { label: 'APP开门', icon: Smartphone, color: 'text-primary-500', bg: 'bg-primary-100' },
};

const typeConfig = {
  entry: { label: '进入', icon: LogIn, color: 'text-accent-green-500', bg: 'bg-accent-green-100' },
  exit: { label: '离开', icon: LogOut, color: 'text-accent-yellow-500', bg: 'bg-accent-yellow-100' },
};

const gates = ['全部', '东门', '西门', '南门', '北门'];

const AccessControl: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [gateFilter, setGateFilter] = useState('全部');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'card' | 'face' | 'app'>('all');

  const filteredRecords = mockRecords.filter((record) => {
    const matchSearch = record.residentName.includes(searchText) ||
      record.unit.includes(searchText);
    const matchGate = gateFilter === '全部' || record.gate === gateFilter;
    const matchType = typeFilter === 'all' || record.type === typeFilter;
    const matchMethod = methodFilter === 'all' || record.method === methodFilter;
    return matchSearch && matchGate && matchType && matchMethod;
  });

  const todayStats = {
    total: 256,
    entry: 132,
    exit: 124,
    face: 145,
    card: 78,
    app: 33,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">门禁管理</h1>
          <p className="text-gray-500 mt-1">查看和管理门禁进出记录</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-5 h-5" />
            导出记录
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            添加权限
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card text-center">
          <KeyRound className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.total}</p>
          <p className="text-sm text-gray-500">今日总通行</p>
        </div>
        <div className="card text-center">
          <LogIn className="w-8 h-8 text-accent-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.entry}</p>
          <p className="text-sm text-gray-500">进入</p>
        </div>
        <div className="card text-center">
          <LogOut className="w-8 h-8 text-accent-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.exit}</p>
          <p className="text-sm text-gray-500">离开</p>
        </div>
        <div className="card text-center">
          <Camera className="w-8 h-8 text-accent-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.face}</p>
          <p className="text-sm text-gray-500">人脸识别</p>
        </div>
        <div className="card text-center">
          <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.card}</p>
          <p className="text-sm text-gray-500">门禁卡</p>
        </div>
        <div className="card text-center">
          <Smartphone className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{todayStats.app}</p>
          <p className="text-sm text-gray-500">APP开门</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10"
              placeholder="搜索姓名或房号..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              className="input min-w-[120px]"
            >
              {gates.map((gate) => (
                <option key={gate} value={gate}>{gate}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="input min-w-[120px]"
            >
              <option value="all">全部类型</option>
              <option value="entry">进入</option>
              <option value="exit">离开</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              className="input min-w-[120px]"
            >
              <option value="all">全部方式</option>
              <option value="card">门禁卡</option>
              <option value="face">人脸识别</option>
              <option value="app">APP开门</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">住户信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">出入口</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">识别方式</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const method = methodConfig[record.method];
                const type = typeConfig[record.type];
                return (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.residentName}`}
                          alt={record.residentName}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium text-gray-900">{record.residentName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{record.unit}</td>
                    <td className="py-4 px-4">
                      <span className="badge bg-secondary-100 text-secondary-700">{record.gate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${type.bg} ${type.color} flex items-center gap-1 w-fit`}>
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${method.bg} ${method.color} flex items-center gap-1 w-fit`}>
                        <method.icon className="w-3 h-3" />
                        {method.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {record.time}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无符合条件的记录
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControl;
