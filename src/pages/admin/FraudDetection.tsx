import { useState } from 'react';
import { AlertTriangle, MapPin, DollarSign, Eye, Check, X, Search, Filter } from 'lucide-react';
import { mockFraudAlerts } from '@/mock/data';
import type { FraudAlert, RiskLevel, FraudAlertStatus } from '@/types';

export default function FraudDetection() {
  const [alerts, setAlerts] = useState<FraudAlert[]>(mockFraudAlerts);
  const [selectedId, setSelectedId] = useState<string | null>(mockFraudAlerts[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<FraudAlertStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  const riskLabel: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };

  const riskBadge: Record<RiskLevel, string> = {
    high: 'bg-terracotta-100 text-terracotta-700',
    medium: 'bg-sand-100 text-sand-700',
    low: 'bg-ash-100 text-ash-600',
  };

  const statusLabel: Record<FraudAlertStatus, string> = {
    pending: '待审核',
    reviewed: '已处理',
    dismissed: '已忽略',
  };

  const statusBadge: Record<FraudAlertStatus, string> = {
    pending: 'bg-terracotta-100 text-terracotta-700',
    reviewed: 'bg-spruce-100 text-spruce-700',
    dismissed: 'bg-ash-100 text-ash-600',
  };

  const filtered = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    return matchesStatus && matchesRisk;
  });

  const selected = alerts.find((a) => a.id === selectedId);

  const handleReview = (id: string, action: 'reviewed' | 'dismissed') => {
    setAlerts(alerts.map((a) =>
      a.id === id
        ? { ...a, status: action, reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        : a
    ));
  };

  const stats = [
    { label: '待审核', value: alerts.filter((a) => a.status === 'pending').length, color: 'text-terracotta-600' },
    { label: '高风险', value: alerts.filter((a) => a.riskLevel === 'high').length, color: 'text-terracotta-600' },
    { label: '已处理', value: alerts.filter((a) => a.status === 'reviewed').length, color: 'text-spruce-600' },
    { label: '已忽略', value: alerts.filter((a) => a.status === 'dismissed').length, color: 'text-ash-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-ash-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 font-serif ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
          <input
            type="text"
            placeholder="搜索职位或公司..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FraudAlertStatus | 'all')}
          className="input-field w-36"
        >
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="reviewed">已处理</option>
          <option value="dismissed">已忽略</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
          className="input-field w-36"
        >
          <option value="all">全部风险</option>
          <option value="high">高风险</option>
          <option value="medium">中风险</option>
          <option value="low">低风险</option>
        </select>
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)]">
        <div className="w-1/2 card overflow-y-auto">
          <div className="divide-y divide-ash-100">
            {filtered.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedId(alert.id)}
                className={`p-5 cursor-pointer transition-all hover:bg-ash-50/50 ${
                  selectedId === alert.id ? 'bg-terracotta-50/50 border-l-4 border-terracotta-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-ash-700">{alert.jobTitle}</h4>
                    <span className={`badge ${riskBadge[alert.riskLevel]} flex items-center gap-1`}>
                      <AlertTriangle size={12} />
                      {riskLabel[alert.riskLevel]}
                    </span>
                  </div>
                  <span className={`badge ${statusBadge[alert.status]}`}>
                    {statusLabel[alert.status]}
                  </span>
                </div>
                <p className="text-sm text-ash-500 mb-3">{alert.companyName}</p>
                <div className="flex items-center gap-6 text-xs text-ash-500">
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} className="text-terracotta-500" />
                    薪资偏离度 {alert.salaryDeviation}%
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sand-500" />
                    地址模糊度 {alert.addressFuzzyScore}%
                  </span>
                </div>
                <p className="text-xs text-ash-400 mt-2">检测时间：{alert.createdAt}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/2 card overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ash-700">{selected.jobTitle}</h3>
                  <p className="text-ash-500">{selected.companyName}</p>
                </div>
                <span className={`badge ${riskBadge[selected.riskLevel]} text-sm px-3 py-1`}>
                  {riskLabel[selected.riskLevel]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-terracotta-50 rounded-xl">
                  <p className="text-sm text-terracotta-700 font-medium flex items-center gap-2">
                    <DollarSign size={16} />
                    薪资偏离度
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ash-600">行业均值</span>
                      <span className="text-terracotta-600 font-semibold">{selected.salaryDeviation}%</span>
                    </div>
                    <div className="h-2 bg-terracotta-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-terracotta-500 rounded-full transition-all duration-700"
                        style={{ width: `${selected.salaryDeviation}%` }}
                      />
                    </div>
                    <p className="text-xs text-ash-500 mt-2">
                      薪资{selected.salaryDeviation > 70 ? '远高于' : selected.salaryDeviation > 40 ? '略高于' : '基本符合'}行业正常水平
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-sand-50 rounded-xl">
                  <p className="text-sm text-sand-700 font-medium flex items-center gap-2">
                    <MapPin size={16} />
                    地址模糊度
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ash-600">模糊程度</span>
                      <span className="text-sand-600 font-semibold">{selected.addressFuzzyScore}%</span>
                    </div>
                    <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sand-500 rounded-full transition-all duration-700"
                        style={{ width: `${selected.addressFuzzyScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-ash-500 mt-2">
                      {selected.addressFuzzyScore > 70 ? '地址描述过于模糊，可能为虚假信息' : selected.addressFuzzyScore > 40 ? '地址描述不够详细' : '地址描述清晰'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-ash-50 rounded-xl">
                <h4 className="font-medium text-ash-700 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-terracotta-500" />
                  风险分析
                </h4>
                <div className="space-y-2 text-sm text-ash-600">
                  <p>• 薪资水平偏离行业均值 <span className="text-terracotta-600 font-medium">{selected.salaryDeviation}%</span>，存在高薪诱饵风险</p>
                  <p>• 地址信息模糊度 <span className="text-sand-600 font-medium">{selected.addressFuzzyScore}%</span>，{selected.addressFuzzyScore > 60 ? '无具体门牌号信息' : '需进一步核实'}</p>
                  {selected.riskLevel === 'high' && (
                    <p className="text-terracotta-600 font-medium">⚠️ 综合判定为高风险，建议立即下架并纳入重点监控</p>
                  )}
                </div>
              </div>

              {selected.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReview(selected.id, 'dismissed')}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    忽略此预警
                  </button>
                  <button
                    onClick={() => handleReview(selected.id, 'reviewed')}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    确认风险，下架职位
                  </button>
                </div>
              )}

              {selected.status !== 'pending' && selected.reviewedAt && (
                <div className="p-4 bg-spruce-50 rounded-xl text-center">
                  <Check size={24} className="mx-auto text-spruce-500 mb-2" />
                  <p className="text-spruce-700 font-medium">
                    已于 {selected.reviewedAt} {selected.status === 'reviewed' ? '确认风险并下架' : '标记为忽略'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-ash-400">
              请选择一条预警记录查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
