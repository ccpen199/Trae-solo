import React, { useState, useEffect } from 'react';
import { Users, Database, FileText, ShieldAlert, TrendingUp, Activity, Clock, RefreshCw } from 'lucide-react';
import { dashboardApi, authApi } from '../services/api';
import { formatDateTime, formatCurrency } from '../utils/format';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'logs'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else {
      loadLogs();
    }
  }, [activeTab, page]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await dashboardApi.getAdminStats();
      setStats(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getAllUsers();
      setUsers(response.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await dashboardApi.getOperationLogs({ page, pageSize: 20 });
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationColor = (operation: string) => {
    if (operation.includes('create') || operation.includes('add')) return 'text-emerald-600 bg-emerald-50';
    if (operation.includes('update') || operation.includes('edit')) return 'text-amber-600 bg-amber-50';
    if (operation.includes('delete') || operation.includes('remove')) return 'text-rose-600 bg-rose-50';
    if (operation.includes('login')) return 'text-blue-600 bg-blue-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">运营管理</h1>
          <p className="text-slate-500 text-sm mt-1">系统统计、用户管理和操作日志</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'stats') loadStats();
            else if (activeTab === 'users') loadUsers();
            else loadLogs();
          }}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex border-b border-slate-100">
          {[
            { key: 'stats', label: '系统统计', icon: Activity },
            { key: 'users', label: '用户管理', icon: Users },
            { key: 'logs', label: '操作日志', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-primary-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">加载中...</div>
          ) : activeTab === 'stats' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">总用户数</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats?.totalUsers || 0}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">总账户数</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats?.totalAccounts || 0}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">总交易数</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats?.totalTransactions || 0}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">今日活跃</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats?.todayActiveUsers || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-4">系统信息</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">数据库</span>
                      <span className="text-slate-700 font-medium">SQLite</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">数据库文件</span>
                      <span className="text-slate-700 font-medium">data/app.sqlite</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">运行环境</span>
                      <span className="text-slate-700 font-medium">Node.js {process.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">平台</span>
                      <span className="text-slate-700 font-medium">{process.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">服务端口</span>
                      <span className="text-slate-700 font-medium">{import.meta.env.VITE_API_BASE_URL || '53490'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-4">财务总览</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">系统总资产</span>
                      <span className="text-emerald-600 font-semibold">{formatCurrency(stats?.systemTotalAssets || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">系统总负债</span>
                      <span className="text-rose-600 font-semibold">{formatCurrency(stats?.systemTotalLiabilities || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">系统净资产</span>
                      <span className="text-primary-600 font-semibold">{formatCurrency(stats?.systemNetWorth || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">本月总收入</span>
                      <span className="text-emerald-600 font-semibold">{formatCurrency(stats?.systemMonthlyIncome || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">本月总支出</span>
                      <span className="text-rose-600 font-semibold">{formatCurrency(stats?.systemMonthlyExpense || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      账户数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      最后登录
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        #{user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.accountCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : '未登录'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        操作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        模块
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        资源ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        IP地址
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {log.username || '系统'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getOperationColor(
                              log.operation
                            )}`}
                          >
                            {log.operation}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {log.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {log.resourceId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 20 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-slate-500">
                    第 {page} 页 / 共 {Math.ceil(total / 20)} 页
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * 20 >= total}
                    className="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
