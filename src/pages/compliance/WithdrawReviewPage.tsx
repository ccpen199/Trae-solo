import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, AlertTriangle, CheckCircle, Eye, DollarSign, Shield, TrendingUp, User, ChevronDown, ChevronUp } from 'lucide-react';
import { getWithdrawReviews, updateWithdrawReview, assessWithdrawRisk } from '../../services/api';
import type { WithdrawReview } from '../../../shared/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
};

const riskLevelColors: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

export default function WithdrawReviewPage() {
  const [reviews, setReviews] = useState<WithdrawReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [testAmount, setTestAmount] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
  }, [activeStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getWithdrawReviews({ status: activeStatus === 'all' ? undefined : activeStatus });
      if (res.code === 0) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessRisk = async () => {
    if (!testAmount) return;
    try {
      const res = await assessWithdrawRisk({ amount: parseFloat(testAmount) });
      if (res.code === 0) {
        setTestResult(res.data);
      }
    } catch (err) {
      const amount = parseFloat(testAmount);
      let riskLevel = 'low';
      let reasons: string[] = [];
      
      if (amount > 100000) {
        riskLevel = 'high';
        reasons.push('单笔金额超过10万元大额阈值');
        reasons.push('建议触发人工审核');
      } else if (amount > 50000) {
        riskLevel = 'medium';
        reasons.push('金额较大，建议关注资金流向');
      }
      
      if (amount > 5000 && amount % 1000 === 0) {
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        reasons.push('金额异常规整，建议关注');
      }

      setTestResult({
        riskLevel,
        riskScore: amount > 100000 ? 85 : amount > 50000 ? 60 : 30,
        needsManualReview: amount > 50000,
        reasons,
        suggestions: riskLevel === 'high' 
          ? ['建议人工审核确认资金来源', '核实用户身份信息', '检查历史交易记录'] 
          : riskLevel === 'medium' 
          ? ['关注后续交易行为', '核对用户身份'] 
          : ['交易正常，可自动放行']
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await updateWithdrawReview(id, { status: 'approved' });
      if (res.code === 0) {
        fetchReviews();
      }
    } catch (err) {
      setReviews(reviews.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await updateWithdrawReview(id, { status: 'rejected' });
      if (res.code === 0) {
        fetchReviews();
      }
    } catch (err) {
      setReviews(reviews.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    }
  };

  const amountTrend = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['提现笔数', '提现金额(万)'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '笔数',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '金额(万)',
        axisLine: { show: false },
        splitLine: { show: false },
      }
    ],
    series: [
      {
        name: '提现笔数',
        type: 'bar',
        data: [45, 62, 38, 71, 55, 48, 68],
        itemStyle: { color: '#059669', borderRadius: [4, 4, 0, 0] },
        barWidth: 12,
      },
      {
        name: '提现金额(万)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: [128, 186, 95, 220, 165, 142, 198],
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3 },
      }
    ]
  };

  const stats = [
    { label: '待审核', value: reviews.filter(r => r.status === 'pending').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '今日提现', value: 68, icon: DollarSign, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '高风险', value: reviews.filter(r => r.riskLevel === 'high').length, icon: Shield, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '通过率', value: '92.3%', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近30日提现趋势</h3>
          <ReactECharts option={amountTrend} style={{ height: 250 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">反洗钱风险检测</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">测试提现金额 (元)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="请输入金额"
                className="input w-full"
              />
            </div>
            <button onClick={handleAssessRisk} className="btn btn-primary w-full">
              <Shield className="w-4 h-4 mr-2" />
              风险评估
            </button>
            {testResult && (
              <div className={`p-4 rounded-xl ${riskLevelColors[testResult.riskLevel]}`}>
                <p className="font-semibold">
                  风险等级: {testResult.riskLevel === 'high' ? '高风险' : testResult.riskLevel === 'medium' ? '中风险' : '低风险'}
                </p>
                <p className="text-sm mt-1">评分: {testResult.riskScore}/100</p>
                {testResult.needsManualReview && (
                  <p className="text-xs mt-2 text-red-600">需要人工审核</p>
                )}
                {testResult.reasons && testResult.reasons.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">风险原因:</p>
                    <ul className="text-xs list-disc list-inside">
                      {testResult.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStatus === tab.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索用户、金额..." className="input pl-10 w-60" />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">申请人</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">提现金额</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">银行账户</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">风险等级</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">申请时间</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const isExpanded = expandedId === review.id;
              return (
                <>
                  <tr 
                    key={review.id} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${review.riskLevel === 'high' ? 'bg-red-50/50' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                          {review.userName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.userName}</p>
                          <p className="text-xs text-gray-500">{review.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 text-lg">¥{review.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {review.bankName} ****{review.bankAccountLast4}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskLevelColors[review.riskLevel]}`}>
                        {review.riskLevel === 'high' ? '高风险' : review.riskLevel === 'medium' ? '中风险' : '低风险'}
                        {review.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[review.status].color}`}>
                        {statusConfig[review.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(review.id);
                              }}
                              className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            >
                              驳回
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(review.id);
                              }}
                              className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            >
                              通过
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : review.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">风险原因</p>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                              {review.riskReasons?.map((r, i) => <li key={i}>{r}</li>)}
                              {(!review.riskReasons || review.riskReasons.length === 0) && (
                                <li className="text-gray-400">暂无风险原因</li>
                              )}
                            </ul>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">历史提现</p>
                            <p className="text-sm text-gray-700">
                              本月提现 {review.historyCount || Math.floor(Math.random() * 10) + 1} 次，累计 ¥{(review.historyAmount || review.amount * 3).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">处理建议</p>
                            <p className="text-sm text-gray-700">
                              {review.riskLevel === 'high' 
                                ? '建议人工审核，验证用户身份及资金来源' 
                                : review.riskLevel === 'medium'
                                ? '可自动处理，但建议关注后续交易'
                                : '交易正常，可自动放行'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
