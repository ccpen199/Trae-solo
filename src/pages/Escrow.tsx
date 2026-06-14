import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import {
  Wallet, Clock, Shield, CheckCircle, AlertCircle,
  TrendingUp, ArrowRight, ChevronDown, Filter,
} from 'lucide-react';

export default function EscrowPage() {
  const { escrowRecords, dashboardStats } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'frozen' | 'released'>('all');

  const filteredRecords = escrowRecords.filter(r =>
    filter === 'all' ? true : r.status === filter
  );

  const totalFrozen = escrowRecords.filter(r => r.status === 'frozen').reduce((sum, r) => sum + r.amount, 0);
  const totalReleased = escrowRecords.filter(r => r.status === 'released').reduce((sum, r) => sum + r.amount, 0);

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
              <p className="text-orange-200 text-sm mt-2">共 {escrowRecords.filter(r => r.status === 'frozen').length} 笔冻结中</p>
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
              {[
                { key: 'all', label: '全部记录', count: escrowRecords.length, icon: Wallet },
                { key: 'frozen', label: '冻结中', count: escrowRecords.filter(r => r.status === 'frozen').length, icon: Clock },
                { key: 'released', label: '已释放', count: escrowRecords.filter(r => r.status === 'released').length, icon: CheckCircle },
              ].map(item => {
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
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">T+1 释放机制</h4>
            </div>
            <ol className="text-sm text-blue-700 space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>业主付款后资金进入平台担保账户</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>服务完成且业主确认验收</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>T+1 工作日自动释放至师傅账户</span>
              </li>
            </ol>
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
              <span className="text-xs text-slate-400">共 {filteredRecords.length} 条</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRecords.map(record => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.status === 'frozen' ? 'bg-orange-100 text-orange-500' : 'bg-green-100 text-green-500'
                      }`}>
                        {record.status === 'frozen' ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{record.faultTypeName}</p>
                        <p className="text-xs text-slate-400">
                          {record.homeownerName} → {record.workerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        record.status === 'frozen' ? 'text-orange-500' : 'text-green-500'
                      }`}>
                        ¥{record.amount}
                      </p>
                      <p className="text-xs text-slate-400">{record.orderId}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      record.status === 'frozen'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {record.status === 'frozen' ? '资金冻结中' : '已释放'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {record.status === 'frozen'
                        ? `冻结于 ${record.frozenAt}`
                        : `释放于 ${record.releaseAt}`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
