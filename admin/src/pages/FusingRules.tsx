import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Clock, Zap, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, DollarSign, Bell } from 'lucide-react';
import { useAppStore } from '@/store';
import type { FusingRule } from '@/types';

export default function FusingRules() {
  const [rules, setRules] = useState<FusingRule[]>([]);
  const loadFusingRules = useAppStore((state) => state.loadFusingRules);
  const toggleFusingRule = useAppStore((state) => state.toggleFusingRule);

  useEffect(() => {
    const fetchData = async () => {
      const result = await loadFusingRules();
      setRules(result);
    };
    fetchData();
  }, []);

  const getModuleName = (module: string) => {
    const names: Record<string, string> = {
      transport: '交通业务',
      tourism: '文旅业务',
      enterprise: '企业服务',
      commerce: '商业服务',
    };
    return names[module] || module;
  };

  const getRuleTypeName = (type: string) => {
    const names: Record<string, string> = {
      frequency: '高频检测',
      amount: '大额检测',
      duplicate: '重复检测',
      abnormal_pattern: '异常模式',
    };
    return names[type] || type;
  };

  const getActionName = (action: string) => {
    const names: Record<string, string> = {
      block: '直接拦截',
      review: '人工审核',
      alert: '仅告警',
    };
    return names[action] || action;
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      transport: 'bg-blue-100 text-blue-700',
      tourism: 'bg-emerald-100 text-emerald-700',
      enterprise: 'bg-amber-100 text-amber-700',
      commerce: 'bg-purple-100 text-purple-700',
    };
    return colors[module] || 'bg-gray-100 text-gray-700';
  };

  const handleToggle = async (id: string) => {
    await toggleFusingRule(id);
    setRules(useAppStore.getState().fusingRules);
  };

  const stats = [
    { label: '已启用规则', value: rules.filter((r) => r.isActive).length, color: 'text-emerald-600' },
    { label: '拦截规则', value: rules.filter((r) => r.action === 'block').length, color: 'text-red-600' },
    { label: '审核规则', value: rules.filter((r) => r.action === 'review').length, color: 'text-amber-600' },
    { label: '今日拦截', value: '1,258', color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">熔断规则管理</h1>
          <p className="text-gray-500 text-sm mt-1">配置异常充值、重复核销等风控熔断机制</p>
        </div>
        <button className="flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-float">
          <Shield size={18} className="mr-2" />
          新增规则
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start">
          <AlertTriangle size={24} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="ml-4">
            <h4 className="font-semibold text-amber-800">风控熔断机制说明</h4>
            <p className="text-sm text-amber-700 mt-1">
              熔断规则用于检测和拦截异常操作，保护系统安全和用户资金安全。触发规则后将根据配置执行拦截、人工审核或告警操作。
              所有敏感操作均会记录审计日志，确保可追溯。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-white rounded-2xl shadow-card p-6 transition-all ${
              !rule.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    rule.isActive ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gray-200'
                  }`}
                >
                  {rule.ruleType === 'amount' && <DollarSign size={26} className="text-white" />}
                  {rule.ruleType === 'frequency' && <Zap size={26} className="text-white" />}
                  {rule.ruleType === 'duplicate' && <AlertCircle size={26} className="text-white" />}
                  {rule.ruleType === 'abnormal_pattern' && <AlertTriangle size={26} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-800">{rule.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleColor(rule.module)}`}>
                      {getModuleName(rule.module)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {getRuleTypeName(rule.ruleType)}
                    </span>
                    {rule.isActive ? (
                      <span className="flex items-center text-xs text-emerald-600">
                        <CheckCircle size={14} className="mr-1" />
                        运行中
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-gray-500">
                        <AlertCircle size={14} className="mr-1" />
                        已停用
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{rule.description}</p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap size={14} className="mr-2 text-amber-500" />
                      阈值: {rule.threshold.toLocaleString()}
                      {rule.ruleType === 'amount' ? ' 元' : rule.ruleType === 'frequency' ? ' 次' : ''}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={14} className="mr-2 text-blue-500" />
                      时间窗口: {rule.timeWindow >= 3600 ? `${rule.timeWindow / 3600} 小时` : `${rule.timeWindow / 60} 分钟`}
                    </div>
                    <div className="flex items-center text-sm">
                      {rule.action === 'block' && (
                        <span className="flex items-center text-red-600">
                          <Shield size={14} className="mr-1.5" />
                          执行动作: {getActionName(rule.action)}
                        </span>
                      )}
                      {rule.action === 'review' && (
                        <span className="flex items-center text-amber-600">
                          <AlertCircle size={14} className="mr-1.5" />
                          执行动作: {getActionName(rule.action)}
                        </span>
                      )}
                      {rule.action === 'alert' && (
                        <span className="flex items-center text-blue-600">
                          <Bell size={14} className="mr-1.5" />
                          执行动作: {getActionName(rule.action)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  编辑
                </button>
                <button
                  onClick={() => handleToggle(rule.id)}
                  className="p-2 rounded-lg transition-colors"
                >
                  {rule.isActive ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
