import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, DollarSign, ShoppingBag, AlertTriangle, Store, Download, CheckCircle, Users, Scissors } from 'lucide-react';
import { api } from '@/lib/api';

type TabType = 'dashboard' | 'verifications' | 'settlements' | 'performance' | 'anomalies';

export default function Merchant() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'dashboard';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [dashboard, setDashboard] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any>({ list: [], totals: {} });
  const [performance, setPerformance] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  function switchTab(tab: TabType) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  async function loadTabData() {
    try {
      setLoading(true);
      setError('');
      switch (activeTab) {
        case 'dashboard':
          const dashRes = await api.merchant.getDashboard();
          setDashboard(dashRes.data);
          break;
        case 'verifications':
          const verRes = await api.merchant.getVerifications();
          setVerifications(verRes.data);
          break;
        case 'settlements':
          const setRes = await api.merchant.getSettlements();
          setSettlements(setRes.data);
          break;
        case 'performance':
          const perfRes = await api.merchant.getStorePerformance();
          setPerformance(perfRes.data);
          break;
        case 'anomalies':
          const anomRes = await api.merchant.getAnomalies();
          setAnomalies(anomRes.data);
          break;
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle() {
    if (!confirm('确定结算所有待结算项吗？')) return;
    try {
      setLoading(true);
      await api.merchant.settle({});
      loadTabData();
    } catch (err: any) {
      setError(err.message || '结算失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/merchant/export/settlements');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlements_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || '导出失败');
    }
  }

  const tabs = [
    { id: 'dashboard', label: '数据概览', icon: BarChart3 },
    { id: 'verifications', label: '核销明细', icon: ShoppingBag },
    { id: 'settlements', label: '结算管理', icon: DollarSign },
    { id: 'performance', label: '门店业绩', icon: Store },
    { id: 'anomalies', label: '异常券', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商家后台</h1>
        <div className="flex gap-2">
          {activeTab === 'settlements' && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                导出对账单
              </button>
              <button
                onClick={handleSettle}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? '处理中...' : '批量结算'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div
                  onClick={() => switchTab('verifications')}
                  className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <p className="text-sm text-blue-600">今日核销</p>
                  <p className="text-3xl font-bold text-blue-700">{dashboard.today_verifications || 0}</p>
                  <p className="text-sm text-blue-500 mt-1">营收 ¥{(dashboard.today_revenue || 0).toFixed(2)}</p>
                </div>
                <div
                  onClick={() => switchTab('settlements')}
                  className="bg-orange-50 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  <p className="text-sm text-orange-600">待结算</p>
                  <p className="text-3xl font-bold text-orange-700">{dashboard.pending_settlements_count || 0}</p>
                  <p className="text-sm text-orange-500 mt-1">金额 ¥{(dashboard.pending_settlements_amount || 0).toFixed(2)}</p>
                </div>
                <div
                  onClick={() => switchTab('verifications')}
                  className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <p className="text-sm text-green-600">总核销数</p>
                  <p className="text-3xl font-bold text-green-700">{dashboard.total_verifications || 0}</p>
                </div>
                <div
                  onClick={() => switchTab('anomalies')}
                  className="bg-red-50 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <p className="text-sm text-red-600">待处理退款</p>
                  <p className="text-3xl font-bold text-red-700">{dashboard.pending_refunds_count || 0}</p>
                  <p className="text-sm text-red-500 mt-1">金额 ¥{(dashboard.pending_refunds_amount || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">券码</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">门店</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">服务项目</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">店员</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">核销时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">结算状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {verifications.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-3 font-mono text-sm">{v.coupon_code}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{v.user_name}</p>
                        <p className="text-xs text-gray-500">{v.user_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{v.store_name}</td>
                      <td className="px-4 py-3">
                        {v.service_name ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Scissors className="w-3.5 h-3.5 text-blue-500" />
                            {v.service_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.staff_name ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {v.staff_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(v.verification_time).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">¥{v.settlement_amount?.toFixed(2) || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          v.settlement_status === 'settled'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {v.settlement_status === 'settled' ? '已结算' : '待结算'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {verifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">暂无核销记录</p>
              )}
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="space-y-4">
              {settlements.totals && (
                <div className="bg-gray-50 rounded-lg p-4 flex gap-8">
                  <div>
                    <p className="text-sm text-gray-500">总金额</p>
                    <p className="text-xl font-bold">¥{settlements.totals.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">佣金</p>
                    <p className="text-xl font-bold text-orange-600">¥{((settlements.totals.total_amount || 0) - (settlements.totals.total_net_amount || 0)).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">净结算</p>
                    <p className="text-xl font-bold text-green-600">¥{settlements.totals.total_net_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">门店</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">券码</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">套餐</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">核销时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">结算日期</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">佣金</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">净结算</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {settlements.list?.map((s: any) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 text-sm">{s.store_name}</td>
                        <td className="px-4 py-3 font-mono text-sm">{s.coupon_code}</td>
                        <td className="px-4 py-3 text-sm">{s.package_name || '-'}</td>
                        <td className="px-4 py-3 text-sm">{new Date(s.verification_time).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{s.settlement_date || '-'}</td>
                        <td className="px-4 py-3 text-sm">¥{(s.amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-orange-600">¥{(s.profit_amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">¥{((s.amount || 0) - (s.profit_amount || 0)).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            s.status === 'settled'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {s.status === 'settled' ? '已结算' : '待结算'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">门店</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">核销次数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">总营收</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">净收入</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {performance.map((p, i) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                            i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                          }`}>
                            {i + 1}
                          </span>
                          {p.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.verification_count}</td>
                      <td className="px-4 py-3 font-medium">¥{p.total_revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-green-600">¥{p.net_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">券码</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">套餐</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">异常类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {anomalies.map((a) => (
                    <tr key={`${a.type}-${a.id}`}>
                      <td className="px-4 py-3 font-mono text-sm">{a.code}</td>
                      <td className="px-4 py-3 text-sm">{a.package_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{a.user_name}</p>
                        <p className="text-xs text-gray-500">{a.user_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {a.status === 'active' ? '正常' : '部分使用'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          a.type === 'expired_soon' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {a.type === 'expired_soon' ? '即将过期' : '已过期'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {anomalies.length === 0 && (
                <p className="text-center py-8 text-gray-500">暂无异常券</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
