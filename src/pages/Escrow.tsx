import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import {
  Wallet, Clock, Shield, CheckCircle, AlertCircle,
  TrendingUp, ArrowRight, ChevronDown, Filter,
  FileCheck, User, Calendar, Info, AlertTriangle,
  ChevronRight, Clock3, Hourglass, Banknote,
} from 'lucide-react';
import type { EscrowRecord } from '@/types';

function EscrowDetailCard({ record }: { record: EscrowRecord }) {
  const [expanded, setExpanded] = useState(false);

  const statusMap = {
    frozen: { label: '资金冻结中', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
    released: { label: '已释放', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
    refunded: { label: '已退款', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
  };

  const status = statusMap[record.status] || statusMap.frozen;
  const StatusIcon = status.icon;

  const flowSteps = [
    { key: 'frozen', label: '资金冻结', time: record.frozenAt, done: true, icon: Banknote },
    { key: 'acceptance', label: '业主验收', time: record.acceptanceAt, done: !!record.acceptanceAt, icon: User },
    { key: 'release', label: '资金释放', time: record.releaseAt, done: record.status === 'released', icon: CheckCircle },
  ];

  const isDisputed = record.status === 'frozen' && record.releaseBasis?.includes('争议');

  return (
    <motion.div
      layout
      className="bg-white border border-slate-200/50 rounded-xl shadow-sm overflow-hidden"
    >
      <div
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.bgColor} ${status.color}`}>
          <StatusIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 truncate">{record.faultTypeName}</p>
            {isDisputed && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                争议中
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {record.homeownerName} → {record.workerName} · {record.orderId}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${status.color}`}>¥{record.amount}</p>
          <p className="text-xs text-slate-400">{status.label}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500">冻结时间</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{record.frozenAt}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500">验收时间</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{record.acceptanceAt || '待验收'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500">释放时间</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {record.releaseAt || (record.expectedReleaseAt ? `预计 ${record.expectedReleaseAt}` : '—')}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  资金流转链路
                </p>
                <div className="relative pl-2">
                  {flowSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isLast = idx === flowSteps.length - 1;
                    return (
                      <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                        {!isLast && (
                          <div className={`absolute left-[13px] top-6 w-0.5 ${
                            step.done ? 'bg-green-300' : 'bg-slate-200'
                          }`} style={{ height: 'calc(100% - 24px)' }} />
                        )}
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          <StepIcon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                              {step.label}
                            </p>
                            {step.time && step.done && (
                              <span className="text-xs text-slate-400">{step.time}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {record.status === 'frozen' && record.expectedReleaseAt && !isDisputed && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Hourglass className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-800">T+1 释放倒计时</p>
                  </div>
                  <p className="text-xs text-blue-700">
                    业主已于 {record.acceptanceAt} 确认验收，资金预计于 {record.expectedReleaseAt} 自动释放至师傅账户。
                  </p>
                </div>
              )}

              {isDisputed && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-lg border border-red-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-800">争议暂缓释放</p>
                  </div>
                  <p className="text-xs text-red-700">
                    {record.releaseBasis}
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    平台质量专员正在核查中，预计 3 个工作日内给出处理结果。
                  </p>
                </div>
              )}

              {record.releaseBasis && record.status === 'released' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">放款依据</p>
                  </div>
                  <p className="text-xs text-green-700">{record.releaseBasis}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EscrowPage() {
  const { escrowRecords, dashboardStats } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'frozen' | 'released' | 'disputed'>('all');

  const filteredRecords = escrowRecords.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'disputed') return r.status === 'frozen' && r.releaseBasis?.includes('争议');
    return r.status === filter;
  });

  const totalFrozen = escrowRecords.filter(r => r.status === 'frozen').reduce((sum, r) => sum + r.amount, 0);
  const totalReleased = escrowRecords.filter(r => r.status === 'released').reduce((sum, r) => sum + r.amount, 0);
  const disputedCount = escrowRecords.filter(r => r.status === 'frozen' && r.releaseBasis?.includes('争议')).length;

  const fundFlowData = {
    dates: ['6/10', '6/11', '6/12', '6/13', '6/14'],
    inflow: [8500, 12000, 9800, 15600, 12580],
    outflow: [6200, 8900, 7500, 11200, 3200],
  };

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      data: ['资金流入', '资金释放'],
      textStyle: { color: '#64748b', fontSize: 12 },
      top: 0,
      right: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 20 },
    xAxis: {
      type: 'category',
      data: fundFlowData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [
      {
        name: '资金流入',
        type: 'bar',
        data: fundFlowData.inflow,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f97316' },
              { offset: 1, color: '#fb923c' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 20,
      },
      {
        name: '资金释放',
        type: 'bar',
        data: fundFlowData.outflow,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#4ade80' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 20,
      },
    ],
  };

  const filters = [
    { key: 'all', label: '全部记录', count: escrowRecords.length, icon: Wallet },
    { key: 'frozen', label: '冻结中', count: escrowRecords.filter(r => r.status === 'frozen').length, icon: Clock },
    { key: 'released', label: '已释放', count: escrowRecords.filter(r => r.status === 'released').length, icon: CheckCircle },
    { key: 'disputed', label: '争议订单', count: disputedCount, icon: AlertTriangle },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">资金担保</h2>
          <p className="text-sm text-slate-500 mt-1">平台担保资金池，T+1 释放机制保障双方权益</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>筛选</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg shadow-orange-500/30"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-100 text-sm">当前担保资金池</p>
              <p className="text-4xl font-bold mt-2">¥ {dashboardStats.escrowAmount.toLocaleString()}</p>
              <p className="text-orange-200 text-sm mt-2">
                共 {escrowRecords.filter(r => r.status === 'frozen').length} 笔冻结中
                {disputedCount > 0 && <span className="ml-2">· {disputedCount} 笔争议</span>}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/20 flex items-center gap-6">
            <div>
              <p className="text-orange-100 text-xs">今日流入</p>
              <p className="text-white font-semibold mt-0.5">+¥{fundFlowData.inflow[4].toLocaleString()}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs">今日释放</p>
              <p className="text-white font-semibold mt-0.5">-¥{fundFlowData.outflow[4].toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">冻结中</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">¥ {totalFrozen.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{escrowRecords.filter(r => r.status === 'frozen').length} 笔订单</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">已释放</span>
          </div>
          <p className="text-2xl font-bold text-green-500">¥ {totalReleased.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{escrowRecords.filter(r => r.status === 'released').length} 笔订单</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">资金状态筛选</h3>
            <div className="space-y-2">
              {filters.map(item => {
                const Icon = item.icon;
                const isActive = filter === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key as typeof filter)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-orange-700' : 'text-slate-700'}`}>
                        {item.label}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">T+1 释放机制</h4>
            </div>
            <ol className="space-y-3">
              {[
                { step: 1, text: '业主付款后资金进入平台担保账户' },
                { step: 2, text: '服务完成且业主确认验收' },
                { step: 3, text: 'T+1 工作日自动释放至师傅账户' },
              ].map(item => (
                <li key={item.step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                    {item.step}
                  </span>
                  <span className="text-sm text-blue-700">{item.text}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 pt-3 border-t border-blue-200/50">
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                遇争议订单，平台介入核查后处理
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-2">近5日资金流水</h3>
            <div className="h-52">
              <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">担保记录</h3>
              <span className="text-xs text-slate-400">共 {filteredRecords.length} 条 · 点击展开详情</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRecords.map((record, idx) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <EscrowDetailCard record={record} />
                </motion.div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="py-12 text-center">
                  <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">暂无相关记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
