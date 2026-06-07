import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import api, { ApiResponse } from '@/utils/api';

interface CommissionRule {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  condition: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  createdAt: string;
}

const normalizeRule = (rule: any): CommissionRule => ({
  id: rule.id,
  name: rule.name || `${rule.city || '默认'}分佣规则`,
  type: rule.type || 'percentage',
  value: rule.value ?? rule.baseRate ?? rule.base_rate ?? 0,
  condition: rule.condition || rule.conditions || 'normal',
  minAmount: rule.minAmount ?? 0,
  maxAmount: rule.maxAmount ?? 0,
  isActive: rule.isActive ?? true,
  createdAt: rule.createdAt || rule.created_at || new Date().toISOString(),
});

const toServerRule = (rule: Partial<CommissionRule>) => ({
  city: rule.name || '默认城市',
  base_rate: Number(rule.value || 0),
  bonus_rate: 0,
  conditions: rule.condition || 'normal',
});

export default function AdminCommission() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    name: '',
    type: 'percentage',
    value: 0,
    condition: 'normal',
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await api.get<ApiResponse<CommissionRule[]>>('/admin/commission/rules');
      if (res.code === 200) {
        setRules((res.data || []).map(normalizeRule));
      }
    } catch (error) {
      console.error('加载分佣规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.name || newRule.value <= 0) {
      alert('请填写完整的规则信息');
      return;
    }
    try {
      const res = await api.post<ApiResponse<CommissionRule>>('/admin/commission/rules', toServerRule(newRule));
      if (res.code === 200) {
        setRules(prev => [...prev, normalizeRule(res.data)]);
        setShowAddModal(false);
        setNewRule({
          name: '',
          type: 'percentage',
          value: 0,
          condition: 'normal',
          minAmount: 0,
          maxAmount: 0,
          isActive: true,
        });
      }
    } catch (error) {
      console.error('添加规则失败:', error);
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      const res = await api.put<ApiResponse<CommissionRule>>(`/admin/commission/rules/${editingRule.id}`, toServerRule(editingRule));
      if (res.code === 200) {
        const updated = normalizeRule(res.data);
        setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
        setEditingRule(null);
      }
    } catch (error) {
      console.error('更新规则失败:', error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('确定要删除这条规则吗？')) return;
    try {
      await api.delete(`/admin/commission/rules/${ruleId}`);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('删除规则失败:', error);
    }
  };

  const handleToggleStatus = async (rule: CommissionRule) => {
    try {
      const res = await api.put<ApiResponse<CommissionRule>>(`/admin/commission/rules/${rule.id}`, toServerRule({ ...rule, isActive: !rule.isActive }));
      if (res.code === 200) {
        const updated = normalizeRule(res.data);
        setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
      }
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const conditionLabels: Record<string, string> = {
    normal: '普通成交',
    high_value: '高价值房源',
    referral: '老客户推荐',
    bulk: '批量购买',
  };

  const commissionStats = [
    { label: '本月应付佣金', value: '¥1,285,600', icon: DollarSign, color: 'from-blue-500 to-blue-600' },
    { label: '活跃经纪人', value: '156', icon: Users, color: 'from-green-500 to-green-600' },
    { label: '平均佣金率', value: '2.5%', icon: Percent, color: 'from-amber-500 to-amber-600' },
    { label: '本月成交', value: '286', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
  ];

  const brokerLeaderboard = [
    { rank: 1, name: '王经理', deals: 32, amount: 25600000, commission: 512000 },
    { rank: 2, name: '李经理', deals: 28, amount: 21800000, commission: 436000 },
    { rank: 3, name: '张经理', deals: 24, amount: 18500000, commission: 370000 },
    { rank: 4, name: '刘经理', deals: 21, amount: 16200000, commission: 324000 },
    { rank: 5, name: '陈经理', deals: 18, amount: 14500000, commission: 290000 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">经纪人分佣管理</h1>
          <p className="text-gray-500 mt-1">配置灵活的分佣规则，激励经纪人积极性</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadRules}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加规则
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {commissionStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">分佣规则配置</h2>
          <p className="text-sm text-gray-500 mt-1">设置不同条件下的佣金计算规则</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">规则名称</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">适用条件</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">佣金类型</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">金额区间</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">创建时间</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    暂无分佣规则，点击上方按钮添加
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="text"
                          value={editingRule.name}
                          onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{rule.name}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingRule?.id === rule.id ? (
                        <select
                          value={editingRule.condition}
                          onChange={(e) => setEditingRule({ ...editingRule, condition: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          {Object.entries(conditionLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                          {conditionLabels[rule.condition]}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingRule?.id === rule.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRule.type}
                            onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as 'percentage' | 'fixed' })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="percentage">百分比</option>
                            <option value="fixed">固定金额</option>
                          </select>
                          <input
                            type="number"
                            value={editingRule.value}
                            onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) })}
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          {editingRule.type === 'percentage' && <span className="text-gray-500">%</span>}
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">
                          {rule.type === 'percentage' ? `${rule.value}%` : `¥${rule.value.toLocaleString()}`}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingRule?.id === rule.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingRule.minAmount}
                            onChange={(e) => setEditingRule({ ...editingRule, minAmount: parseFloat(e.target.value) })}
                            placeholder="最低"
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            value={editingRule.maxAmount}
                            onChange={(e) => setEditingRule({ ...editingRule, maxAmount: parseFloat(e.target.value) })}
                            placeholder="最高"
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-600">
                          {rule.minAmount > 0 || rule.maxAmount > 0
                            ? `¥${rule.minAmount.toLocaleString()} - ¥${rule.maxAmount.toLocaleString()}`
                            : '无限制'
                          }
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(rule)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          rule.isActive ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(rule.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-4 px-6">
                      {editingRule?.id === rule.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUpdateRule}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRule(null)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingRule({ ...rule })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">经纪人业绩排行榜</h2>
          <p className="text-sm text-gray-500 mt-1">本月经纪人佣金排名</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">排名</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">经纪人</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">成交套数</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">成交金额</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">佣金收入</th>
              </tr>
            </thead>
            <tbody>
              {brokerLeaderboard.map((broker) => (
                <tr key={broker.rank} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      broker.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      broker.rank === 2 ? 'bg-gray-200 text-gray-700' :
                      broker.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {broker.rank}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{broker.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">{broker.deals}套</td>
                  <td className="py-4 px-6 font-medium text-gray-900">¥{broker.amount.toLocaleString()}</td>
                  <td className="py-4 px-6 font-medium text-primary-600">¥{broker.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">添加分佣规则</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="例如：普通成交佣金"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">适用条件</label>
                <select
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(conditionLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">佣金类型</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">百分比</option>
                    <option value="fixed">固定金额</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    佣金值 {newRule.type === 'percentage' ? '(%)' : '(元)'}
                  </label>
                  <input
                    type="number"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低金额</label>
                  <input
                    type="number"
                    value={newRule.minAmount}
                    onChange={(e) => setNewRule({ ...newRule, minAmount: parseFloat(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最高金额</label>
                  <input
                    type="number"
                    value={newRule.maxAmount}
                    onChange={(e) => setNewRule({ ...newRule, maxAmount: parseFloat(e.target.value) })}
                    placeholder="0为无限制"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddRule}
                className="flex-1 btn-primary"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
