import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function AdminDashboard() {
  const { officer, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appeals' | 'declarations' | 'policy' | 'logs'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [policyAnalysis, setPolicyAnalysis] = useState<any>(null);
  const [selectedDeductionType, setSelectedDeductionType] = useState('children_education');

  useEffect(() => {
    if (!token || !officer) {
      navigate('/officer-login');
      return;
    }
    loadData();
  }, [token, officer, navigate, activeTab, selectedDeductionType]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const result = await api.admin.dashboard();
        if (result.success) {
          setDashboard(result.data);
        }
      } else if (activeTab === 'appeals') {
        const result = await api.admin.appeals();
        if (result.success) {
          setAppeals(result.data || []);
        }
      } else if (activeTab === 'declarations') {
        const result = await api.admin.declarations();
        if (result.success) {
          setDeclarations(result.data || []);
        }
      } else if (activeTab === 'logs') {
        const result = await api.admin.logs();
        if (result.success) {
          setLogs(result.data || []);
        }
      } else if (activeTab === 'policy') {
        const result = await api.admin.policyImpact(selectedDeductionType);
        if (result.success) {
          setPolicyAnalysis(result.data);
        }
      }
    } catch (e) {
      console.error('Load data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/officer-login');
  };

  const processAppeal = async (appealId: number, status: string) => {
    try {
      const result = await api.admin.processAppeal(appealId, { status, processorNote: '已处理' });
      if (result.success) {
        alert('处理成功');
        loadData();
      } else {
        alert(result.error || '处理失败');
      }
    } catch (e) {
      alert('处理失败');
    }
  };

  const approveDeclaration = async (id: number) => {
    if (!confirm('确认审核通过该申报？')) return;
    try {
      const result = await api.admin.approveDeclaration(id);
      if (result.success) {
        alert('审核通过');
        loadData();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (e) {
      alert('操作失败');
    }
  };

  const tabs = [
    { key: 'dashboard', name: '工作台' },
    { key: 'appeals', name: '申诉管理' },
    { key: 'declarations', name: '申报审核' },
    { key: 'policy', name: '政策分析' },
    { key: 'logs', name: '操作日志' },
  ];

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">税务专员工作台</h1>
              <p className="text-xs text-slate-400">金税四期征管系统</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">欢迎，{officer?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-300 hover:text-white transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex space-x-1 p-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-slate-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && dashboard && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm">注册用户</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{dashboard.stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm">申报总数</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboard.stats?.totalDeclarations || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm">待处理申诉</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">{dashboard.stats?.pendingAppeals || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm">预计退税总额</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">¥{(dashboard.stats?.totalRefund || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">申报状态分布</h3>
                <div className="space-y-3">
                  {dashboard.declarationByStatus?.map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {item.status === 'draft' ? '草稿' :
                         item.status === 'submitted' ? '已提交' :
                         item.status === 'approved' ? '已审核' : item.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(item.count / dashboard.stats.totalDeclarations) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">最近申报</h3>
                <div className="space-y-3">
                  {dashboard.recentDeclarations?.slice(0, 5).map((dec: any) => (
                    <div key={dec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{dec.user_name}</p>
                        <p className="text-xs text-gray-500">{dec.tax_year}年度汇算</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dec.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                        dec.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {dec.status === 'draft' ? '草稿' :
                         dec.status === 'submitted' ? '待审核' :
                         dec.status === 'approved' ? '已通过' : dec.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">异议申诉管理</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申诉人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申诉原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appeals.map((appeal: any) => (
                    <tr key={appeal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{appeal.user_name}</p>
                        <p className="text-xs text-gray-500">{appeal.id_card}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{appeal.appeal_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{appeal.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          appeal.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          appeal.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {appeal.status === 'pending' ? '待处理' :
                           appeal.status === 'processing' ? '处理中' :
                           appeal.status === 'approved' ? '已通过' : '已驳回'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{appeal.created_at}</td>
                      <td className="px-6 py-4">
                        {appeal.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => processAppeal(appeal.id, 'approved')}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => processAppeal(appeal.id, 'rejected')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              驳回
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'declarations' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">申报审核管理</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">纳税人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年度</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">收入额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">应退/补税</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {declarations.map((dec: any) => (
                    <tr key={dec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{dec.user_name}</p>
                        <p className="text-xs text-gray-500">{dec.id_card}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dec.tax_year}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">¥{(dec.total_income || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={dec.tax_refund > 0 ? 'text-green-600' : dec.tax_supplement > 0 ? 'text-red-600' : 'text-gray-600'}>
                          {dec.tax_refund > 0 ? `退税 ¥${dec.tax_refund}` :
                           dec.tax_supplement > 0 ? `补税 ¥${dec.tax_supplement}` : '¥0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          dec.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          dec.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                          dec.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {dec.status === 'draft' ? '草稿' :
                           dec.status === 'submitted' ? '待审核' :
                           dec.status === 'approved' ? '已通过' : '已驳回'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dec.status === 'submitted' && (
                          <button
                            onClick={() => approveDeclaration(dec.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            审核通过
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'policy' && policyAnalysis && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">政策变动影响面预测</h3>
              <div className="flex items-center space-x-4 mb-6">
                <label className="text-sm text-gray-600">选择扣除项目：</label>
                <select
                  value={selectedDeductionType}
                  onChange={(e) => setSelectedDeductionType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="children_education">子女教育</option>
                  <option value="continuing_education">继续教育</option>
                  <option value="housing_loan">住房贷款利息</option>
                  <option value="housing_rent">住房租金</option>
                  <option value="elderly_support">赡养老人</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">受影响用户数</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{policyAnalysis.affectedUsers || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">当前扣除总额</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">¥{(policyAnalysis.currentTotalDeduction || 0).toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600">预测新增扣除</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">¥{(policyAnalysis.newTotalDeduction || 0).toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600">税收影响</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">¥{((policyAnalysis.taxImpact || 0) * 10000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">操作日志审计</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{log.created_at}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.operation}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.user_name || log.officer_name || '系统'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
