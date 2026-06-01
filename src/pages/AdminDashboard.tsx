import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, DollarSign, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const userRole = useAuthStore(state => state.user?.role);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'disputes'>('overview');

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [userRole]);

  const loadData = async () => {
    setLoading(true);
    const [statsResult, usersResult, disputesResult] = await Promise.all([
      adminApi.stats(),
      adminApi.users(),
      adminApi.disputes()
    ]);
    setLoading(false);

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }
    if (usersResult.success && usersResult.data?.users) {
      setUsers(usersResult.data.users);
    }
    if (disputesResult.success && disputesResult.data) {
      setDisputes(disputesResult.data);
    }
  };

  const handleUserStatusUpdate = async (userId: string, status: string) => {
    const result = await adminApi.updateUserStatus(userId, status);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '操作失败');
    }
  };

  const handleDisputeResolve = async (disputeId: string, status: string, resolution: string) => {
    const result = await adminApi.resolveDispute(disputeId, status, resolution);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '操作失败');
    }
  };

  const roleLabels: Record<string, string> = {
    job_seeker: '求职者',
    employer: '雇主',
    admin: '管理员'
  };

  const userStatusLabels: Record<string, { label: string; color: string }> = {
    active: { label: '正常', color: 'bg-green-100 text-green-700' },
    suspended: { label: '已封禁', color: 'bg-red-100 text-red-700' },
    verified: { label: '已认证', color: 'bg-blue-100 text-blue-700' }
  };

  const disputeStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    investigating: { label: '调查中', color: 'bg-blue-100 text-blue-700' },
    resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
    dismissed: { label: '已驳回', color: 'bg-gray-100 text-gray-700' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">管理后台</h1>
          </div>
          <p className="text-gray-400">平台运营管理中心</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'overview', label: '数据概览' },
            { key: 'users', label: '用户管理' },
            { key: 'disputes', label: '纠纷处理' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-500">总用户数</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="text-green-600">{stats.jobSeekers}</span> 求职者 ·
                  <span className="text-purple-600 ml-1">{stats.employers}</span> 雇主
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-500">岗位总数</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalJobs}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-gray-500">交易总额</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">¥{stats.totalAmount?.toLocaleString() || 0}</p>
                <div className="mt-2 text-sm text-gray-500">
                  共 {stats.totalSettlements} 笔结算
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-gray-500">待处理</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.pendingDisputes + stats.pendingSettlements}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="text-red-600">{stats.pendingDisputes}</span> 纠纷 ·
                  <span className="text-yellow-600 ml-1">{stats.pendingSettlements}</span> 结算
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">用户管理</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{user.name || user.email}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{roleLabels[user.role] || user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${userStatusLabels[user.status]?.color || ''}`}>
                          {userStatusLabels[user.status]?.label || user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleUserStatusUpdate(user.id, 'suspended')}
                              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              封禁
                            </button>
                          )}
                          {user.status === 'suspended' && (
                            <button
                              onClick={() => handleUserStatusUpdate(user.id, 'active')}
                              className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              解封
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <p className="text-gray-500">暂无纠纷记录</p>
              </div>
            ) : (
              disputes.map(dispute => (
                <div key={dispute.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{dispute.type}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${disputeStatusLabels[dispute.status]?.color || ''}`}>
                          {disputeStatusLabels[dispute.status]?.label || dispute.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        岗位: {dispute.title} · 纠纷方: {dispute.raised_by === 'job_seeker' ? dispute.job_seeker_name : dispute.employer_name}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(dispute.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{dispute.description}</p>
                  {dispute.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDisputeResolve(dispute.id, 'resolved', '经平台核实，支持申诉方诉求')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        支持申诉
                      </button>
                      <button
                        onClick={() => handleDisputeResolve(dispute.id, 'dismissed', '经平台核实，证据不足，予以驳回')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
                      >
                        驳回申诉
                      </button>
                    </div>
                  )}
                  {dispute.resolution && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-500">处理结果:</p>
                      <p className="text-gray-700">{dispute.resolution}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
