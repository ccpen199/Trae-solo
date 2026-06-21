import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, Hash, Clock, CheckCircle, AlertCircle, X, ChevronRight, Calculator, User } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatCurrency, getStatusColor, getStatusText, getEvidenceTypeIcon, getEvidenceTypeText, truncateHash } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { DisputeCase } from '@/types';

type TabType = 'all' | 'pending' | 'processing' | 'resolved';

const ruleInputMap: Record<string, { key: string; label: string; placeholder: string }[]> = {
  rule001: [{ key: 'contractTotal', label: '合同总价', placeholder: '请输入合同总价' }, { key: 'delayDays', label: '延误天数', placeholder: '请输入延误天数' }],
  rule002: [{ key: 'reworkCost', label: '返工费用', placeholder: '请输入返工费用' }, { key: 'materialCost', label: '材料费用', placeholder: '请输入材料费用' }, { key: 'actualLoss', label: '实际损失', placeholder: '请输入实际损失' }],
  rule003: [{ key: 'materialPrice', label: '材料价格', placeholder: '请输入材料价格' }],
  rule004: [{ key: 'additionalCost', label: '变更增加费用', placeholder: '请输入增加费用' }],
};

export default function Dispute() {
  const { disputes, compensationRules, calculateCompensation, setSelectedDispute, selectedDispute } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedRule, setSelectedRule] = useState('');
  const [ruleParams, setRuleParams] = useState<Record<string, number>>({});
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  const stats = useMemo(() => {
    const pending = disputes.filter(d => ['submitted', 'evidence-collecting'].includes(d.status)).length;
    const processing = disputes.filter(d => ['evaluating', 'mediating'].includes(d.status)).length;
    const resolved = disputes.filter(d => ['resolved', 'closed'].includes(d.status)).length;
    const avgDuration = resolved > 0 ? 15 : 0;
    return { pending, processing, resolved, avgDuration };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    const statusMap: Record<TabType, string[]> = {
      all: [], pending: ['submitted', 'evidence-collecting'], processing: ['evaluating', 'mediating'], resolved: ['resolved', 'closed']
    };
    return activeTab === 'all' ? disputes : disputes.filter(d => statusMap[activeTab].includes(d.status));
  }, [disputes, activeTab]);

  const tabs = [
    { key: 'all' as const, label: '全部', count: disputes.length },
    { key: 'pending' as const, label: '待处理', count: stats.pending },
    { key: 'processing' as const, label: '处理中', count: stats.processing },
    { key: 'resolved' as const, label: '已解决', count: stats.resolved },
  ];

  const getTimelineItems = (d: DisputeCase) => [
    { id: '1', name: '纠纷提交', status: 'completed', date: d.createdAt },
    { id: '2', name: '证据收集', status: d.status !== 'submitted' ? 'completed' : 'in-progress', date: d.createdAt },
    { id: '3', name: '第三方评估', status: ['evaluating', 'mediating', 'resolved', 'closed'].includes(d.status) ? 'completed' : 'pending', date: d.createdAt },
    { id: '4', name: '调解中', status: ['mediating', 'resolved', 'closed'].includes(d.status) ? 'completed' : 'pending', date: d.createdAt },
    { id: '5', name: '已解决', status: ['resolved', 'closed'].includes(d.status) ? 'completed' : 'pending', date: d.createdAt },
  ];

  const handleCalculate = () => selectedRule && setCalculatedAmount(calculateCompensation(selectedRule, ruleParams));
  const handleRuleChange = (ruleId: string) => { setSelectedRule(ruleId); setRuleParams({}); setCalculatedAmount(null); };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-900 font-display">纠纷调解中心</h1>
        <p className="text-gray-500 mt-1">证据链自动归集·第三方评估·智能赔付</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="待处理纠纷" value={stats.pending} icon={AlertCircle} color="danger" delay={0.1} />
        <StatCard title="处理中纠纷" value={stats.processing} icon={Clock} color="info" delay={0.2} />
        <StatCard title="已解决纠纷" value={stats.resolved} icon={CheckCircle} color="success" delay={0.3} />
        <StatCard title="平均解决时长" value={`${stats.avgDuration}天`} icon={Scale} color="gold" delay={0.4} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="card p-6">
        <div className="flex gap-2 mb-6 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab.key ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100">{tab.count}</span>
              {activeTab === tab.key && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredDisputes.map((dispute, index) => (
            <motion.div
              key={dispute.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              className="p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-gray-400">{dispute.id.toUpperCase()}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(dispute.status))}>
                      {getStatusText(dispute.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-600">{dispute.type}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{dispute.projectName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />原告：{dispute.plaintiffName}</span>
                    <span className="text-gray-300">vs</span>
                    <span>被告：{dispute.defendantName}</span>
                    <span className="ml-auto">{formatDate(dispute.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  查看详情 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDispute(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDispute.projectName}</h2>
                  <p className="text-sm text-gray-500 mt-1">案件编号：{selectedDispute.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedDispute(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="card p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-600" />案件基本信息
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">纠纷类型</span><span className="text-gray-900">{selectedDispute.type}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">原告</span><span className="text-gray-900">{selectedDispute.plaintiffName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">被告</span><span className="text-gray-900">{selectedDispute.defendantName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">申请时间</span><span className="text-gray-900">{formatDate(selectedDispute.createdAt)}</span></div>
                        {selectedDispute.thirdPartyEvaluator && (
                          <div className="flex justify-between"><span className="text-gray-500">第三方评估</span><span className="text-gray-900">{selectedDispute.thirdPartyEvaluator}</span></div>
                        )}
                        {selectedDispute.compensationAmount && (
                          <div className="flex justify-between"><span className="text-gray-500">赔付金额</span><span className="text-danger-600 font-semibold">{formatCurrency(selectedDispute.compensationAmount)}</span></div>
                        )}
                      </div>
                    </div>

                    <div className="card p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">纠纷描述</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedDispute.description}</p>
                      {selectedDispute.ruling && (
                        <div className="mt-4 p-3 bg-success-50 rounded-lg">
                          <p className="text-sm text-success-700 font-medium">裁定结果</p>
                          <p className="text-sm text-success-600 mt-1">{selectedDispute.ruling}</p>
                        </div>
                      )}
                    </div>

                    <div className="card p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary-600" />证据链文件
                      </h3>
                      <div className="space-y-2">
                        {selectedDispute.evidenceChain.map((ev) => (
                          <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-xl">{getEvidenceTypeIcon(ev.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">{getEvidenceTypeText(ev.type)}</span>
                                <span className="flex items-center gap-1 font-mono">
                                  <Hash className="w-3 h-3" />{truncateHash(ev.hash)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="card p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">状态时间线</h3>
                      <div className="relative pl-6">
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                        {getTimelineItems(selectedDispute).map((item) => (
                          <div key={item.id} className="relative pb-6 last:pb-0">
                            <div className={cn(
                              'absolute -left-4 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center',
                              item.status === 'completed' ? 'bg-success-500' : item.status === 'in-progress' ? 'bg-info-500 animate-pulse' : 'bg-gray-300'
                            )} />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-primary-600" />赔付规则引擎
                      </h3>
                      <div className="space-y-3">
                        <select
                          value={selectedRule}
                          onChange={(e) => handleRuleChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                        >
                          <option value="">选择赔付规则</option>
                          {compensationRules.map((rule) => (
                            <option key={rule.id} value={rule.id}>{rule.name}</option>
                          ))}
                        </select>

                        {selectedRule && (
                          <>
                            {ruleInputMap[selectedRule]?.map((input) => (
                              <div key={input.key}>
                                <label className="block text-sm text-gray-600 mb-1">{input.label}</label>
                                <input
                                  type="number"
                                  placeholder={input.placeholder}
                                  value={ruleParams[input.key] || ''}
                                  onChange={(e) => setRuleParams({ ...ruleParams, [input.key]: Number(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                                />
                              </div>
                            ))}
                            <button
                              onClick={handleCalculate}
                              className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                              计算赔付金额
                            </button>
                            {calculatedAmount !== null && (
                              <div className="p-4 bg-gold-50 rounded-lg text-center">
                                <p className="text-sm text-gray-600">预估赔付金额</p>
                                <p className="text-2xl font-bold text-gold-600 mt-1">{formatCurrency(calculatedAmount)}</p>
                                <p className="text-xs text-gray-500 mt-1">最高赔付上限：{formatCurrency(compensationRules.find(r => r.id === selectedRule)?.maxAmount || 0)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
