import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle, Search, TrendingDown, ChevronRight,
  Clock, User, MessageSquare, XCircle, CheckCircle,
  Filter, ChevronDown, Star, FileText, AlertCircle,
} from 'lucide-react';

export default function QualityPage() {
  const { qualityIssues, badKeywords, ratingTrendData, orders } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keywords' | 'issues' | 'trend'>('keywords');
  const [issueFilter, setIssueFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all');

  const filteredIssues = qualityIssues.filter(i =>
    issueFilter === 'all' ? true : i.status === issueFilter
  );

  const maxCount = Math.max(...badKeywords.map(k => k.count));

  const ratingOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { left: 50, right: 50, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ratingTrendData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        min: 4,
        max: 5,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
    ],
    series: [
      {
        name: '平均评分',
        type: 'line',
        smooth: true,
        data: ratingTrendData.avgRating,
        lineStyle: { color: '#f97316', width: 2 },
        itemStyle: { color: '#f97316' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249,115,22,0.25)' },
              { offset: 1, color: 'rgba(249,115,22,0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [{ yAxis: 4.5, label: { formatter: '预警线', color: '#ef4444', fontSize: 10 } }],
        },
      },
      {
        name: '差评数',
        type: 'bar',
        yAxisIndex: 1,
        data: ratingTrendData.badReviews,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ef4444' },
              { offset: 1, color: '#fca5a5' },
            ],
          },
          borderRadius: [3, 3, 0, 0],
        },
        barWidth: 12,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">质量回溯</h2>
          <p className="text-sm text-slate-500 mt-1">差评关键词监控、服务复盘工单、评分趋势分析</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单号、师傅..."
              className="w-56 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm">待处理质量问题</span>
          </div>
          <p className="text-3xl font-bold text-amber-500">
            {qualityIssues.filter(i => i.status !== 'resolved').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">较昨日 +1</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Star className="w-4 h-4 text-orange-500" />
            <span className="text-sm">7日平均评分</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {ratingTrendData.avgRating.reduce((a, b) => a + b, 0 / ratingTrendData.avgRating.length).toFixed(1)}
          </p>
          <p className="text-xs text-green-500 mt-1">↑ 较上周 +0.1</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="text-sm">差评率</span>
          </div>
          <p className="text-3xl font-bold text-red-500">3.2%</p>
          <p className="text-xs text-red-400 mt-1">↑ 较上周 +0.5%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm">本月复盘工单</span>
          </div>
          <p className="text-3xl font-bold text-blue-500">{qualityIssues.length}</p>
          <p className="text-xs text-slate-400 mt-1">已解决 {qualityIssues.filter(i => i.status === 'resolved').length} 单</p>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'keywords', label: '差评关键词' },
          { key: 'issues', label: '复盘工单' },
          { key: 'trend', label: '评分趋势' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'keywords' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-1">差评关键词云</h3>
            <p className="text-sm text-slate-500 mb-6">自动抓取差评关键词，按出现频次展示</p>

            <div className="flex flex-wrap gap-3 items-center justify-center py-8">
              {badKeywords.map((kw, idx) => {
                const size = 12 + (kw.count / maxCount) * 24;
                const opacity = 0.5 + (kw.count / maxCount) * 0.5;
                const colors = [
                  'text-red-500', 'text-orange-500', 'text-amber-500',
                  'text-rose-500', 'text-red-600', 'text-orange-600',
                ];
                const color = colors[idx % colors.length];
                return (
                  <motion.span
                    key={kw.word}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`font-bold ${color} cursor-pointer hover:scale-110 transition-transform`}
                    style={{ fontSize: `${size}px` }}
                  >
                    {kw.word}
                    <span className="text-xs ml-1 opacity-60">({kw.count})</span>
                  </motion.span>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">关键词排行</h3>
              <div className="space-y-3">
                {badKeywords.slice(0, 6).map((kw, idx) => (
                  <div key={kw.word} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 flex-1">{kw.word}</span>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                        style={{ width: `${(kw.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-6 text-right">{kw.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-200/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-900">高频风险预警</h4>
              </div>
              <p className="text-sm text-red-700 mb-3">
                「迟到」关键词本周出现 12 次，较上周上升 <span className="font-bold">42%</span>，建议加强师傅出勤管理。
              </p>
              <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-4">
              <h3 className="font-semibold text-slate-800 mb-3">工单状态</h3>
              <div className="space-y-1">
                {[
                  { key: 'all', label: '全部工单', count: qualityIssues.length },
                  { key: 'open', label: '待处理', count: qualityIssues.filter(i => i.status === 'open').length },
                  { key: 'investigating', label: '调查中', count: qualityIssues.filter(i => i.status === 'investigating').length },
                  { key: 'resolved', label: '已解决', count: qualityIssues.filter(i => i.status === 'resolved').length },
                ].map(item => {
                  const isActive = issueFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setIssueFilter(item.key as typeof issueFilter)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-orange-50 text-orange-700'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      <span className={`text-sm font-bold ${
                        isActive ? 'text-orange-600' : 'text-slate-400'
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="space-y-3">
              {filteredIssues.map(issue => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-500' :
                        issue.severity === 'medium' ? 'bg-amber-100 text-amber-500' :
                        'bg-blue-100 text-blue-500'
                      }`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{issue.id}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-600' :
                            issue.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {issue.severity === 'high' ? '高风险' : issue.severity === 'medium' ? '中风险' : '低风险'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            issue.status === 'open' ? 'bg-slate-100 text-slate-600' :
                            issue.status === 'investigating' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {issue.status === 'open' ? '待处理' : issue.status === 'investigating' ? '调查中' : '已解决'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          关联订单 {issue.orderId} · {issue.workerName}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{issue.createdAt.split(' ')[0]}</span>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg mb-3">
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < issue.reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 flex-1">"{issue.reviewComment}"</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {issue.keywords.map(kw => (
                        <span
                          key={kw}
                          className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200/50"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {issue.assignee ? (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {issue.assignee}
                        </span>
                      ) : (
                        <span className="text-amber-500">待分配</span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-1">评分趋势</h3>
            <p className="text-sm text-slate-500 mb-4">近7日平均评分与差评数量对比</p>
            <div className="h-72">
              <ReactECharts option={ratingOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-3">评分分布</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const counts = [45, 28, 12, 8, 5];
                  const total = counts.reduce((a, b) => a + b, 0);
                  const count = counts[5 - star];
                  const percent = (count / total) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm text-slate-600">{star}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-3">低分师傅预警</h3>
              <div className="space-y-3">
                {[
                  { name: '陈师傅', rating: 4.2, trend: -0.3 },
                  { name: '周师傅', rating: 4.4, trend: -0.1 },
                  { name: '王师傅', rating: 4.5, trend: -0.2 },
                ].map((w, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {w.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{w.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-slate-500">{w.rating}</span>
                      </div>
                    </div>
                    <span className="text-xs text-red-500 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {w.trend.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
