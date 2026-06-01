import { useState, useEffect } from 'react';
import {
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  X
} from 'lucide-react';
import { useUnderwritingStore } from '@/store';

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    auto_approve: '自动通过',
    rate: '加费承保',
    exclude: '除外承保',
    postpone: '延期处理',
    reject: '拒保',
    manual_review: '人工复核'
  };
  return labels[type] || type;
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    auto_approve: 'bg-green-100 text-green-700',
    rate: 'bg-purple-100 text-purple-700',
    exclude: 'bg-orange-100 text-orange-700',
    postpone: 'bg-gray-100 text-gray-700',
    reject: 'bg-red-100 text-red-700',
    manual_review: 'bg-blue-100 text-blue-700'
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

const getRiskColor = (level: number) => {
  if (level <= 1) return 'bg-green-500';
  if (level <= 2) return 'bg-yellow-500';
  if (level <= 3) return 'bg-orange-500';
  if (level <= 4) return 'bg-red-400';
  return 'bg-red-600';
};

const conditionTypes = [
  { value: 'all_health_no', label: '健康告知全否', description: '当所有健康告知都选"否"时触发' },
  { value: 'occupation_risk', label: '职业风险等级', description: '当职业风险等级达到指定阈值时触发' },
  { value: 'medical_history_contains', label: '既往病史包含关键词', description: '当既往病史包含指定关键词时触发' },
  { value: 'bmi_range', label: 'BMI范围', description: '当BMI在指定范围内时触发' }
];

export default function Rules() {
  const { rules, fetchRules, loading } = useUnderwritingStore();
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rule_code: '',
    rule_name: '',
    rule_type: 'auto_approve',
    risk_level: 1,
    conditionType: 'all_health_no',
    conditionValue: '',
    actions: '',
    description: ''
  });

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filteredRules = rules.filter((rule: any) => {
    const matchType = !filterType || rule.rule_type === filterType;
    const matchSearch = !searchTerm ||
      rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.rule_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r: any) => r.is_active).length,
    auto: rules.filter((r: any) => r.rule_type === 'auto_approve').length,
    manual: rules.filter((r: any) => r.rule_type === 'manual_review').length,
    avgRisk: rules.length > 0 ? (rules.reduce((sum: number, r: any) => sum + r.risk_level, 0) / rules.length).toFixed(1) : '0'
  };

  const buildConditions = () => {
    const { conditionType, conditionValue } = formData;
    const conditions: any[] = [];

    switch (conditionType) {
      case 'all_health_no':
        conditions.push({ type: 'all_health_no' });
        break;
      case 'occupation_risk':
        conditions.push({ type: 'occupation_risk', value: { min: parseInt(conditionValue) || 4 } });
        break;
      case 'medical_history_contains':
        const keywords = conditionValue.split(/[,，]/).map((k: string) => k.trim()).filter(Boolean);
        conditions.push({ type: 'medical_history_contains', value: { keywords: keywords.length > 0 ? keywords : [''] } });
        break;
      case 'bmi_range':
        const [min, max] = conditionValue.split(/[,-]/).map((v: string) => parseFloat(v.trim()));
        conditions.push({ type: 'bmi_range', value: { min: min || 28, max: max || 32 } });
        break;
    }

    return conditions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const conditions = buildConditions();
      const res = await fetch('/api/underwriting/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_code: formData.rule_code,
          rule_name: formData.rule_name,
          rule_version: '1.0',
          rule_type: formData.rule_type,
          risk_level: formData.risk_level,
          conditions: conditions,
          actions: { action: formData.rule_type, description: formData.actions },
          description: formData.description,
          created_by: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRules();
        setFormData({
          rule_code: '',
          rule_name: '',
          rule_type: 'auto_approve',
          risk_level: 1,
          conditionType: 'all_health_no',
          conditionValue: '',
          actions: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const getConditionDisplay = (conditions: any) => {
    try {
      let conds: any[] = [];
      if (typeof conditions === 'string') {
        conds = JSON.parse(conditions);
      } else if (Array.isArray(conditions)) {
        conds = conditions;
      } else if (conditions && typeof conditions === 'object') {
        conds = [conditions];
      }

      return conds.map((c: any) => {
        switch (c.type) {
          case 'all_health_no': return '健康告知全部选否';
          case 'occupation_risk': return `职业风险等级 ≥ ${c.value?.min || 4}级`;
          case 'medical_history_contains': return `病史包含: ${c.value?.keywords?.join(', ') || ''}`;
          case 'bmi_range': return `BMI在 ${c.value?.min || 28}-${c.value?.max || 32} 之间`;
          default: return JSON.stringify(c);
        }
      }).join('; ');
    } catch {
      return String(conditions);
    }
  };

  const getActionDisplay = (actions: any) => {
    try {
      let acts: any;
      if (typeof actions === 'string') {
        acts = JSON.parse(actions);
      } else {
        acts = actions;
      }
      return acts?.description || JSON.stringify(acts);
    } catch {
      return String(actions);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">核保规则</h1>
          <p className="mt-1 text-sm text-gray-500">管理保险核保规则库</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增规则
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">规则总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已启用</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">自动通过</p>
              <p className="text-2xl font-bold text-purple-600">{stats.auto}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">人工复核</p>
              <p className="text-2xl font-bold text-orange-600">{stats.manual}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均风险等级</p>
              <p className="text-2xl font-bold text-red-600">{stats.avgRisk}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索规则名称或代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">全部类型</option>
            <option value="auto_approve">自动通过</option>
            <option value="rate">加费承保</option>
            <option value="exclude">除外承保</option>
            <option value="postpone">延期处理</option>
            <option value="reject">拒保</option>
            <option value="manual_review">人工复核</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRules.map((rule: any) => {
          const conditions = getConditionDisplay(rule.conditions);
          const actions = getActionDisplay(rule.actions);
          return (
            <div key={rule.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {rule.rule_code}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{rule.rule_name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(rule.rule_type)}`}>
                      {getTypeLabel(rule.rule_type)}
                    </span>
                    <span className={`w-6 h-6 rounded-full ${getRiskColor(rule.risk_level)} flex items-center justify-center text-white text-xs font-bold`}>
                      {rule.risk_level}
                    </span>
                    {rule.is_active ? (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        已启用
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-gray-500">
                        <XCircle className="w-4 h-4 mr-1" />
                        已禁用
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">触发条件</p>
                      <p className="text-sm text-gray-700">{conditions}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-600 mb-2">执行动作</p>
                      <p className="text-sm text-blue-800">{actions}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  编辑
                </button>
                <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  {rule.is_active ? '禁用' : '启用'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredRules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">没有找到匹配的规则</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">新增核保规则</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规则编码</label>
                  <input
                    type="text"
                    value={formData.rule_code}
                    onChange={(e) => setFormData({ ...formData, rule_code: e.target.value })}
                    placeholder="例如：R007"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规则类型</label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="auto_approve">自动通过</option>
                    <option value="rate">加费承保</option>
                    <option value="exclude">除外承保</option>
                    <option value="postpone">延期处理</option>
                    <option value="reject">拒保</option>
                    <option value="manual_review">人工复核</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                <input
                  type="text"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="例如：糖尿病患者核保规则"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风险等级 (1-5)</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, risk_level: level })}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                        formData.risk_level === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">条件类型</label>
                <select
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                >
                  {conditionTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">{conditionTypes.find(t => t.value === formData.conditionType)?.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  条件参数
                  <span className="text-gray-400 ml-1">
                    {formData.conditionType === 'occupation_risk' ? '(填入最小风险等级，如4)' :
                     formData.conditionType === 'medical_history_contains' ? '(多个关键词用逗号分隔，如：糖尿病,高血压)' :
                     formData.conditionType === 'bmi_range' ? '(填入范围，如：28-32)' :
                     '(无需填写)'}
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.conditionValue}
                  onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                  placeholder={formData.conditionType === 'occupation_risk' ? '例如：4' :
                             formData.conditionType === 'medical_history_contains' ? '例如：糖尿病,高血压' :
                             formData.conditionType === 'bmi_range' ? '例如：28-32' : '健康告知全否无需填写参数'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  disabled={formData.conditionType === 'all_health_no'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">执行动作描述</label>
                <textarea
                  value={formData.actions}
                  onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                  placeholder="描述触发规则后执行的动作和说明..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简要描述此规则的用途和适用场景..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建规则
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
