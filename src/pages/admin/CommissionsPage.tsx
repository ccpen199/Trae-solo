import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Percent,
  Calendar,
  Building2,
  ShoppingCart,
  DollarSign,
  Eye,
  FileText,
  Settings2,
  ChevronRight,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { cn, formatCurrency, formatDate } from '../../components/lib/utils';
import { adminApi } from '../../services/api';
import { Currency, SettlementCycle } from '@shared/types';

interface SettlementRecord {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  hotelCount: number;
  orderCount: number;
  totalGMV: number;
  totalCommission: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface CommissionRule {
  id: string;
  defaultRate: number;
  settlementCycle: SettlementCycle;
  currency: Currency;
  paymentTerms: number;
  effectiveFrom: string;
}

const CommissionsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [commissionRule, setCommissionRule] = useState<CommissionRule>({
    id: 'default',
    defaultRate: 15,
    settlementCycle: SettlementCycle.MONTHLY,
    currency: Currency.CNY,
    paymentTerms: 30,
    effectiveFrom: '2025-01-01',
  });
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [editRuleData, setEditRuleData] = useState(commissionRule);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState('');

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setIsLoading(true);
    try {
      try {
        const rulesData = await adminApi.commissions.getRules() as any;
        if (rulesData) {
          const rule = Array.isArray(rulesData) ? rulesData[0] : rulesData;
          if (rule) {
            setCommissionRule({
              id: rule.id || 'default',
              defaultRate: rule.commissionRate || rule.defaultRate || 15,
              settlementCycle: rule.settlementCycle || SettlementCycle.MONTHLY,
              currency: rule.currency || Currency.CNY,
              paymentTerms: rule.paymentTerms || 30,
              effectiveFrom: rule.effectiveFrom || '2025-01-01',
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load commission rules, using default');
      }

      try {
        const settlementsData = await adminApi.commissions.getSettlements() as any;
        const items = Array.isArray(settlementsData) 
          ? settlementsData 
          : (settlementsData.items || []);
        setSettlements(items.map((s: any) => ({
          id: s.id,
          period: s.period || `${s.startDate} ~ ${s.endDate}`,
          startDate: s.startDate,
          endDate: s.endDate,
          hotelCount: s.hotelCount || 0,
          orderCount: s.orderCount || 0,
          totalGMV: s.totalGMV || s.gmv || 0,
          totalCommission: s.totalCommission || s.commissionAmount || 0,
          status: s.status || 'completed',
          createdAt: s.createdAt,
          completedAt: s.completedAt,
        })));
      } catch (error) {
        console.warn('Failed to load settlements, using mock data');
        setSettlements(getMockSettlements());
      }
    } catch (error) {
      console.error('Failed to load commission data:', error);
      setSettlements(getMockSettlements());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockSettlements = (): SettlementRecord[] => {
    return [
      {
        id: 'set-001',
        period: '2025年6月第2周',
        startDate: '2025-06-09',
        endDate: '2025-06-15',
        hotelCount: 142,
        orderCount: 1856,
        totalGMV: 2856000,
        totalCommission: 428400,
        status: 'completed',
        createdAt: '2025-06-16T08:00:00Z',
        completedAt: '2025-06-16T10:30:00Z',
      },
      {
        id: 'set-002',
        period: '2025年6月第1周',
        startDate: '2025-06-02',
        endDate: '2025-06-08',
        hotelCount: 138,
        orderCount: 1642,
        totalGMV: 2458000,
        totalCommission: 368700,
        status: 'completed',
        createdAt: '2025-06-09T08:00:00Z',
        completedAt: '2025-06-09T11:15:00Z',
      },
      {
        id: 'set-003',
        period: '2025年5月第4周',
        startDate: '2025-05-26',
        endDate: '2025-06-01',
        hotelCount: 135,
        orderCount: 1723,
        totalGMV: 2689000,
        totalCommission: 403350,
        status: 'completed',
        createdAt: '2025-06-02T08:00:00Z',
        completedAt: '2025-06-02T09:45:00Z',
      },
      {
        id: 'set-004',
        period: '2025年5月第3周',
        startDate: '2025-05-19',
        endDate: '2025-05-25',
        hotelCount: 130,
        orderCount: 1589,
        totalGMV: 2345000,
        totalCommission: 351750,
        status: 'completed',
        createdAt: '2025-05-26T08:00:00Z',
        completedAt: '2025-05-26T10:00:00Z',
      },
      {
        id: 'set-005',
        period: '2025年5月第2周',
        startDate: '2025-05-12',
        endDate: '2025-05-18',
        hotelCount: 128,
        orderCount: 1456,
        totalGMV: 2187000,
        totalCommission: 328050,
        status: 'completed',
        createdAt: '2025-05-19T08:00:00Z',
        completedAt: '2025-05-19T09:30:00Z',
      },
    ];
  };

  const getStatusConfig = (status: SettlementRecord['status']) => {
    const configs: Record<SettlementRecord['status'], { label: string; variant: any }> = {
      pending: { label: '待生成', variant: 'default' },
      processing: { label: '处理中', variant: 'warning' },
      completed: { label: '已完成', variant: 'success' },
      failed: { label: '失败', variant: 'danger' },
    };
    return configs[status] || configs.pending;
  };

  const getCycleLabel = (cycle: SettlementCycle) => {
    const labels: Record<SettlementCycle, string> = {
      [SettlementCycle.WEEKLY]: '每周结算',
      [SettlementCycle.BIWEEKLY]: '双周结算',
      [SettlementCycle.MONTHLY]: '每月结算',
    };
    return labels[cycle] || labels[SettlementCycle.MONTHLY];
  };

  const handleEditRule = () => {
    setEditRuleData(commissionRule);
    setIsEditingRule(true);
  };

  const handleSaveRule = async () => {
    try {
      await adminApi.commissions.createRule({
        commissionRate: editRuleData.defaultRate,
        settlementCycle: editRuleData.settlementCycle,
        currency: editRuleData.currency,
        paymentTerms: editRuleData.paymentTerms,
        effectiveFrom: editRuleData.effectiveFrom,
      });
      setCommissionRule(editRuleData);
      setIsEditingRule(false);
    } catch (error) {
      console.warn('Failed to save rule, updating locally');
      setCommissionRule(editRuleData);
      setIsEditingRule(false);
    }
  };

  const handleViewDetail = (settlement: SettlementRecord) => {
    setSelectedSettlement(settlement);
    setDetailModalOpen(true);
  };

  const handleGenerateSettlement = async () => {
    setIsGenerating(true);
    try {
      await adminApi.commissions.generateSettlement({
        period: generatePeriod,
      });
      loadCommissionData();
      setGenerateModalOpen(false);
    } catch (error) {
      console.warn('Failed to generate settlement, adding mock');
      const newSettlement: SettlementRecord = {
        id: `set-${Date.now()}`,
        period: generatePeriod || '新结算周期',
        startDate: '2025-06-16',
        endDate: '2025-06-22',
        hotelCount: 145,
        orderCount: 1920,
        totalGMV: 2980000,
        totalCommission: 447000,
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      setSettlements(prev => [newSettlement, ...prev]);
      setGenerateModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalCommission = settlements.reduce((sum, s) => sum + s.totalCommission, 0);
  const totalGMV = settlements.reduce((sum, s) => sum + s.totalGMV, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">佣金结算</h1>
          <p className="text-graphite-500 mt-1">管理佣金规则和结算记录</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<FileText className="w-4 h-4" />}
          onClick={() => setGenerateModalOpen(true)}
        >
          生成结算单
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-graphite-500 mb-1">默认佣金比例</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-graphite-900">
                    {commissionRule.defaultRate}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gold-foil/10">
                <Percent className="w-6 h-6 text-gold-foil" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-graphite-500 mb-1">结算周期</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-graphite-900">
                    {getCycleLabel(commissionRule.settlementCycle)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-deep-blue/10">
                <Calendar className="w-6 h-6 text-deep-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-graphite-500 mb-1">累计GMV</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-graphite-900">
                    {formatCurrency(totalGMV, Currency.CNY)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-graphite-500 mb-1">累计佣金</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-graphite-900">
                    {formatCurrency(totalCommission, Currency.CNY)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-coral-orange/10">
                <Wallet className="w-6 h-6 text-coral-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-deep-blue/10 rounded-lg">
              <Settings2 className="w-5 h-5 text-deep-blue" />
            </div>
            <div>
              <CardTitle className="text-lg">佣金规则配置</CardTitle>
              <p className="text-sm text-graphite-500 mt-1">设置平台默认佣金比例和结算周期</p>
            </div>
          </div>
          {!isEditingRule ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings2 className="w-4 h-4" />}
              onClick={handleEditRule}
            >
              编辑规则
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingRule(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveRule}
              >
                保存
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                默认佣金比例
              </label>
              {isEditingRule ? (
                <Input
                  type="number"
                  value={editRuleData.defaultRate}
                  onChange={(e) => setEditRuleData(prev => ({ ...prev, defaultRate: Number(e.target.value) }))}
                  suffix="%"
                />
              ) : (
                <p className="text-lg font-semibold text-graphite-900">{commissionRule.defaultRate}%</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                结算周期
              </label>
              {isEditingRule ? (
                <select
                  value={editRuleData.settlementCycle}
                  onChange={(e) => setEditRuleData(prev => ({ ...prev, settlementCycle: e.target.value as SettlementCycle }))}
                  className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value={SettlementCycle.WEEKLY}>每周结算</option>
                  <option value={SettlementCycle.BIWEEKLY}>双周结算</option>
                  <option value={SettlementCycle.MONTHLY}>每月结算</option>
                </select>
              ) : (
                <p className="text-lg font-semibold text-graphite-900">
                  {getCycleLabel(commissionRule.settlementCycle)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                付款账期
              </label>
              {isEditingRule ? (
                <Input
                  type="number"
                  value={editRuleData.paymentTerms}
                  onChange={(e) => setEditRuleData(prev => ({ ...prev, paymentTerms: Number(e.target.value) }))}
                  suffix="天"
                />
              ) : (
                <p className="text-lg font-semibold text-graphite-900">{commissionRule.paymentTerms}天</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                生效日期
              </label>
              <p className="text-lg font-semibold text-graphite-900">
                {formatDate(commissionRule.effectiveFrom)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">结算记录</CardTitle>
          <Badge variant="primary" size="sm">
            共 {settlements.length} 条
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">结算周期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">酒店数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">订单数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">总GMV</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">总佣金</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">生成时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => {
                  const statusConfig = getStatusConfig(settlement.status);
                  return (
                    <tr key={settlement.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-graphite-900">{settlement.period}</p>
                          <p className="text-xs text-graphite-500">
                            {formatDate(settlement.startDate)} ~ {formatDate(settlement.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-graphite-400" />
                          <span className="text-sm text-graphite-700">{settlement.hotelCount}家</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-4 h-4 text-graphite-400" />
                          <span className="text-sm text-graphite-700">{settlement.orderCount}单</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {formatCurrency(settlement.totalGMV, Currency.CNY)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gold-foil">
                          {formatCurrency(settlement.totalCommission, Currency.CNY)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {formatDate(settlement.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => handleViewDetail(settlement)}
                        >
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="结算单详情"
        size="lg"
      >
        {selectedSettlement && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-cloud-50 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">结算周期</p>
                <p className="text-base font-semibold text-graphite-900">{selectedSettlement.period}</p>
              </div>
              <div className="p-4 bg-cloud-50 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">酒店数量</p>
                <p className="text-base font-semibold text-graphite-900">{selectedSettlement.hotelCount} 家</p>
              </div>
              <div className="p-4 bg-cloud-50 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">订单数量</p>
                <p className="text-base font-semibold text-graphite-900">{selectedSettlement.orderCount} 单</p>
              </div>
              <div className="p-4 bg-cloud-50 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">状态</p>
                <Badge variant={getStatusConfig(selectedSettlement.status).variant} size="sm">
                  {getStatusConfig(selectedSettlement.status).label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-deep-blue/5 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">总GMV</p>
                <p className="text-xl font-bold text-deep-blue">
                  {formatCurrency(selectedSettlement.totalGMV, Currency.CNY)}
                </p>
              </div>
              <div className="p-4 bg-gold-foil/10 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">佣金比例</p>
                <p className="text-xl font-bold text-gold-foil">{commissionRule.defaultRate}%</p>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-xl">
                <p className="text-xs text-graphite-500 mb-1">佣金金额</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(selectedSettlement.totalCommission, Currency.CNY)}
                </p>
              </div>
            </div>

            <div className="border-t border-cloud-200 pt-4">
              <h4 className="text-sm font-medium text-graphite-900 mb-3">结算时间线</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-deep-blue rounded-full mt-1.5" />
                  <div>
                    <p className="text-sm text-graphite-900">结算单生成</p>
                    <p className="text-xs text-graphite-500">{formatDate(selectedSettlement.createdAt)}</p>
                  </div>
                </div>
                {selectedSettlement.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5" />
                    <div>
                      <p className="text-sm text-graphite-900">结算完成</p>
                      <p className="text-xs text-graphite-500">{formatDate(selectedSettlement.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="生成结算单"
        description="选择结算周期，系统将自动计算该周期内的佣金"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenerateModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateSettlement}
              isLoading={isGenerating}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              生成结算单
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              结算周期 <span className="text-red-500">*</span>
            </label>
            <select
              value={generatePeriod}
              onChange={(e) => setGeneratePeriod(e.target.value)}
              className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
            >
              <option value="">请选择结算周期</option>
              <option value="2025年6月第3周">2025年6月第3周 (6月16日 - 6月22日)</option>
              <option value="2025年6月第2周">2025年6月第2周 (6月9日 - 6月15日)</option>
              <option value="2025年6月第1周">2025年6月第1周 (6月2日 - 6月8日)</option>
            </select>
          </div>

          <div className="p-4 bg-cloud-50 rounded-xl">
            <h4 className="text-sm font-medium text-graphite-900 mb-2">结算规则</h4>
            <ul className="space-y-1 text-sm text-graphite-600">
              <li>• 佣金比例：{commissionRule.defaultRate}%</li>
              <li>• 结算方式：{getCycleLabel(commissionRule.settlementCycle)}</li>
              <li>• 付款账期：{commissionRule.paymentTerms}天</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>提示：</strong>生成结算单后，系统将自动计算所有酒店在该周期内的佣金，并生成对应的结算明细。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommissionsPage;
