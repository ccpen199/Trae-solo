import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Empty } from '@/components/Empty';
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCw, Calendar,
  User, CheckCircle, Clock, AlertCircle, FileText, Settings,
  ChevronDown, MoreHorizontal, Download, Filter, Crown, Shield, Building2,
  PieChart, BarChart3, ArrowUpRight
} from 'lucide-react';
import { allianceAPI } from '@/services/api';
import type { Settlement, SettlementRule, AllianceLevel } from '../../../shared/types';

const AllianceSettlement: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [rules, setRules] = useState<SettlementRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'rules'>('records');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [showEditRule, setShowEditRule] = useState(false);
  const [editingRule, setEditingRule] = useState<{ role: string; percentage: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, [monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settlementResponse, rulesResponse] = await Promise.all([
        allianceAPI.getSettlements(monthFilter),
        allianceAPI.getRules(),
      ]);

      if (settlementResponse.success && settlementResponse.data) {
        setSettlements(settlementResponse.data.settlements);
      }

      if (rulesResponse.success && rulesResponse.data) {
        setRules(rulesResponse.data.rules);
      }
    } catch (error) {
      console.error('获取结算数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 已发放</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> 待发放</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 已驳回</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'branch':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'station':
        return <Building2 className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'leader':
        return '盟主';
      case 'branch':
        return '分盟';
      case 'station':
        return '站点';
      default:
        return role;
    }
  };

  const handleEditRule = (rule: SettlementRule) => {
    setEditingRule({ role: rule.role, percentage: rule.percentage });
    setShowEditRule(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;

    try {
      const response = await allianceAPI.updateRule(editingRule.role, editingRule.percentage);
      if (response.success) {
        setShowEditRule(false);
        setEditingRule(null);
        fetchData();
      }
    } catch (error) {
      console.error('更新分账规则失败:', error);
    }
  };

  const filteredSettlements = statusFilter === 'all'
    ? settlements
    : settlements.filter(s => s.status === statusFilter);

  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const pendingAmount = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
  const paidAmount = settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">结算分账</h1>
            <p className="text-slate-500 mt-1">联盟收益结算与分账管理</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">累计收益</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">¥{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              较上月 +18.6%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">已发放</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">¥{paidAmount.toLocaleString()}</p>
            <p className="text-xs text-slate-400">
              占比 {totalAmount > 0 ? Math.round(paidAmount / totalAmount * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">待发放</p>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">¥{pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-slate-400">
              预计 {new Date().getDate() > 25 ? '下月' : '本月'}25日发放
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">本月收益</p>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">¥{(Math.random() * 50000 + 20000).toFixed(0)}</p>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              日均 ¥{Math.round(Math.random() * 2000 + 500).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-green-500 text-green-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              结算记录
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'rules'
                  ? 'border-green-500 text-green-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              分账规则
            </button>
          </div>

          {activeTab === 'records' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    {[
                      { value: 'all', label: '全部' },
                      { value: 'pending', label: '待发放' },
                      { value: 'paid', label: '已发放' },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === tab.value
                            ? 'bg-green-100 text-green-700'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <Input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                </div>
              ) : filteredSettlements.length === 0 ? (
                <Empty
                  title="暂无结算记录"
                  description="还没有符合条件的结算记录"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">结算周期</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">用户</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">角色</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">金额</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">状态</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">说明</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSettlements.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="text-sm font-medium text-slate-800">{item.period}</div>
                            <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-medium">
                                {item.userName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-800">{item.userName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              {getRoleIcon(item.role)}
                              <span className="text-sm text-slate-600">{getRoleName(item.role)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-semibold text-slate-800">¥{item.amount.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-slate-500 line-clamp-1">{item.description}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <FileText className="w-4 h-4 mr-1" />
                                详情
                              </Button>
                              {item.status === 'pending' && (
                                <Button variant="outline" size="sm" className="h-8 px-2">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  发放
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">联盟分账规则</h3>
                  <p className="text-sm text-slate-500 mt-1">根据角色等级设置不同的收益分成比例</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {rules.map((rule) => (
                  <Card key={rule.id} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
                      rule.role === 'leader' ? 'from-yellow-500 to-orange-500' :
                      rule.role === 'branch' ? 'from-blue-500 to-cyan-500' :
                      'from-green-500 to-emerald-500'
                    }`} />
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                            rule.role === 'leader' ? 'from-yellow-500 to-orange-500' :
                            rule.role === 'branch' ? 'from-blue-500 to-cyan-500' :
                            'from-green-500 to-emerald-500'
                          } flex items-center justify-center text-white`}>
                            {getRoleIcon(rule.role)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{getRoleName(rule.role)}</h4>
                            <p className="text-xs text-slate-500">{rule.description}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-center py-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-1">分成比例</p>
                        <p className="text-4xl font-bold text-slate-800">{rule.percentage}<span className="text-xl">%</span></p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">本月收益</span>
                          <span className="font-semibold text-green-600">¥{(Math.random() * 20000 + 5000).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-slate-500">累计收益</span>
                          <span className="font-semibold text-slate-800">¥{(Math.random() * 100000 + 50000).toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-600" />
                    分账比例说明
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">盟主分成</span>
                            <span className="text-sm font-bold text-yellow-600">5%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: '5%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">分盟分成</span>
                            <span className="text-sm font-bold text-blue-600">10%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '10%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">站点分成</span>
                            <span className="text-sm font-bold text-green-600">85%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 mt-4">
                      * 以上比例基于每笔交易手续费收入进行分配，平台收取2%技术服务费后，剩余部分按照上述比例在联盟内部分配。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showEditRule && editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">修改分账规则</h2>
              <p className="text-sm text-slate-500 mt-1">调整 {getRoleName(editingRule.role)} 的分成比例</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">分成比例 (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingRule.percentage}
                  onChange={(e) => setEditingRule({ ...editingRule, percentage: Number(e.target.value) })}
                />
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-700">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>修改分账规则后，将从下一结算周期开始生效。请确保所有角色比例总和不超过100%。</span>
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowEditRule(false); setEditingRule(null); }}>
                取消
              </Button>
              <Button onClick={handleSaveRule}>
                保存修改
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllianceSettlement;
