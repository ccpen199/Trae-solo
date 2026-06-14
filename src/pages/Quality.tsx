import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle, Search, TrendingDown, ChevronRight,
  Clock, User, MessageSquare, XCircle, CheckCircle,
  Filter, ChevronDown, Star, FileText, AlertCircle,
  Shield, ClipboardList, RotateCcw, Eye, Phone, MapPin,
  Video, ThumbsUp, ThumbsDown, UserCheck, Target,
} from 'lucide-react';
import type { QualityIssue } from '@/types';

export default function QualityPage() {
  const { qualityIssues, badKeywords, ratingTrendData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keywords' | 'issues' | 'trend'>('issues');
  const [issueFilter, setIssueFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all');
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(qualityIssues[0] || null);

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

  const highlightKeywords = (text: string, keywords: string[]) => {
    let result = text;
    keywords.forEach(kw => {
      result = result.replace(new RegExp(kw, 'g'), `<mark class="bg-red-100 text-red-700 px-0.5 rounded font-medium">${kw}</mark>`);
    });
    return result;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-slate-100 text-slate-600';
      case 'investigating': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return '待处理';
      case 'investigating': return '调查中';
      case 'resolved': return '已解决';
      default: return status;
    }
  };

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-amber-100 text-amber-600';
      case 'low': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-100';
    }
  };

  const getSeverityLabel = (s: string) => {
    switch (s) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return s;
    }
  };

  const getRecheckTypeIcon = (t: string) => {
    switch (t) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'onsite': return <MapPin className="w-4 h-4" />;
      case 'remote': return <Video className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getRecheckTypeLabel = (t: string) => {
    switch (t) {
      case 'phone': return '电话回访';
      case 'onsite': return '上门复查';
      case 'remote': return '远程视频';
      default: return t;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">质量回溯</h2>
          <p className="text-sm text-slate-500 mt-1">差评关键词自动抓取 → 复盘工单生成 → 责任人调查 → 根因分析 → 纠正措施 → 复查闭环</p>
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
            {(ratingTrendData.avgRating.reduce((a, b) => a + b, 0) / ratingTrendData.avgRating.length).toFixed(2)}
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
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <span className="text-sm">本月复盘工单</span>
          </div>
          <p className="text-3xl font-bold text-blue-500">{qualityIssues.length}</p>
          <p className="text-xs text-slate-400 mt-1">已解决 {qualityIssues.filter(i => i.status === 'resolved').length} 单</p>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'keywords', label: '差评关键词' },
          { key: 'issues', label: '复盘工单闭环' },
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
            <p className="text-sm text-slate-500 mb-6">自动抓取差评评论中的高频关键词，按出现频次可视化展示</p>

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

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-slate-800 text-sm">关键词抓取规则</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>系统自动扫描3星以下差评评论</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>内置200+维修行业负面词库</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>同评论命中2个以上高风险词自动升优先级</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>关键词趋势突增30%触发预警通知</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">关键词排行 TOP 10</h3>
              <div className="space-y-3">
                {badKeywords.slice(0, 10).map((kw, idx) => (
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
                「迟到」关键词本周出现 <span className="font-bold">12</span> 次，较上周上升 <span className="font-bold">42%</span>，连续3天呈上升趋势。
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-red-600">
                  <span>涉及师傅</span>
                  <span className="font-medium">5人</span>
                </div>
                <div className="flex items-center justify-between text-xs text-red-600">
                  <span>关联工单</span>
                  <span className="font-medium">8单</span>
                </div>
                <div className="flex items-center justify-between text-xs text-red-600">
                  <span>建议措施</span>
                  <span className="font-medium">加强出勤管理</span>
                </div>
              </div>
              <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-4">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                工单状态筛选
              </h3>
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

            <div className="space-y-2">
              <p className="text-xs text-slate-500 px-1 font-medium">工单列表（点击查看详情）</p>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {filteredIssues.map(issue => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <motion.div
                        key={issue.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => setSelectedIssue(issue)}
                        className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-400 ring-2 ring-orange-100 shadow-md'
                            : 'border-slate-200/50 hover:border-slate-300 hover:shadow'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-slate-800 text-sm">{issue.id}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getSeverityStyle(issue.severity)}`}>
                              {getSeverityLabel(issue.severity)}
                            </span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusStyle(issue.status)}`}>
                            {getStatusLabel(issue.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                          <span>{issue.orderId}</span>
                          <span>·</span>
                          <span>{issue.workerName}</span>
                        </div>

                        <div className="flex gap-0.5 mb-2">
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

                        <div className="flex flex-wrap gap-1 mb-2">
                          {issue.keywords.slice(0, 3).map(kw => (
                            <span
                              key={kw}
                              className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {issue.createdAt.split(' ')[0]}
                          </span>
                          {issue.assignee ? (
                            <span className="flex items-center gap-1 text-slate-500">
                              <UserCheck className="w-3 h-3" />
                              {issue.assignee}
                            </span>
                          ) : (
                            <span className="text-amber-500">待分配</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="col-span-9">
            <AnimatePresence mode="wait">
              {selectedIssue ? (
                <motion.div
                  key={selectedIssue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-slate-800">质量复盘工单 · {selectedIssue.id}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityStyle(selectedIssue.severity)}`}>
                            {getSeverityLabel(selectedIssue.severity)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(selectedIssue.status)}`}>
                            {getStatusLabel(selectedIssue.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          关联订单：{selectedIssue.orderId} · 师傅：{selectedIssue.workerName} · 创建时间：{selectedIssue.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedIssue.status === 'open' && (
                          <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
                            分配处理人
                          </button>
                        )}
                        {selectedIssue.status === 'investigating' && (
                          <button className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
                            标记已解决
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">处理责任人</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {selectedIssue.assignee ? selectedIssue.assignee[0] : '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {selectedIssue.assignee || '待分配'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {selectedIssue.assignee ? '质量专员' : '请尽快指派'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">差评星级</p>
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < selectedIssue.reviewRating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-slate-800 text-sm ml-1">{selectedIssue.reviewRating}.0</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">命中关键词</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedIssue.keywords.map(kw => (
                            <span key={kw} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200/50 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">调查进度</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                selectedIssue.status === 'resolved' ? 'bg-green-500' :
                                selectedIssue.status === 'investigating' ? 'bg-blue-500' :
                                'bg-slate-300'
                              }`}
                              style={{
                                width: selectedIssue.status === 'resolved' ? '100%' :
                                       selectedIssue.status === 'investigating' ? `${Math.min(80, (selectedIssue.investigation?.length || 0) * 25)}%` :
                                       '0%'
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {selectedIssue.status === 'resolved' ? '100%' :
                             selectedIssue.status === 'investigating' ? `${Math.min(80, (selectedIssue.investigation?.length || 0) * 25)}%` :
                             '0%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        业主差评原文（关键词自动高亮）
                      </h4>
                      <div className="p-4 bg-gradient-to-br from-red-50/50 to-orange-50/50 rounded-xl border border-red-100">
                        <p
                          className="text-sm text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: highlightKeywords(selectedIssue.reviewComment, selectedIssue.keywords) }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/50">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4" />
                          根因分析
                        </h4>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {selectedIssue.rootCause || '暂未完成根因分析，请在调查后填写。'}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-xl border border-green-200/50">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2 text-sm">
                          <RotateCcw className="w-4 h-4" />
                          纠正措施
                        </h4>
                        <p className="text-sm text-green-800 leading-relaxed">
                          {selectedIssue.correctiveAction || '暂未制定纠正措施，调查完成后填写。'}
                        </p>
                        {selectedIssue.closedAt && (
                          <p className="text-xs text-green-600 mt-2 font-medium">
                            关闭时间：{selectedIssue.closedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
                    <h4 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      调查过程时间线
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        共 {selectedIssue.investigation?.length || 0} 条调查记录
                      </span>
                    </h4>

                    {selectedIssue.investigation && selectedIssue.investigation.length > 0 ? (
                      <div className="relative pl-8">
                        <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-gradient-to-b from-blue-400 via-blue-200 to-slate-200" />

                        {selectedIssue.investigation.map((record, idx) => (
                          <div key={idx} className="relative mb-6 last:mb-0">
                            <div className={`absolute -left-5 top-0 w-4 h-4 rounded-full border-2 ${
                              idx === 0 ? 'bg-red-500 border-red-300' :
                              record.operator === '系统' ? 'bg-slate-400 border-slate-200' :
                              'bg-blue-500 border-blue-300'
                            } shadow-sm`} />

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                    idx === 0 ? 'bg-red-100 text-red-700' :
                                    record.operator === '系统' ? 'bg-slate-200 text-slate-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {record.action}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {record.timestamp}
                                </span>
                              </div>

                              <p className="text-sm text-slate-700 mb-3 leading-relaxed">{record.remark}</p>

                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-slate-500" />
                                  </div>
                                  <span className="font-medium text-slate-700">{record.operator}</span>
                                  <span className="text-slate-400">· {record.operatorRole}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">暂无调查记录，请分配责任人后启动调查</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
                    <h4 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      复查记录（质量闭环验证）
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        共 {selectedIssue.recheckRecords?.length || 0} 条复查
                      </span>
                    </h4>

                    {selectedIssue.recheckRecords && selectedIssue.recheckRecords.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {selectedIssue.recheckRecords.map((rec, idx) => (
                          <div
                            key={idx}
                            className={`p-5 rounded-xl border ${
                              rec.recheckResult === 'pass' ? 'bg-green-50/50 border-green-200' :
                              rec.recheckResult === 'fail' ? 'bg-red-50/50 border-red-200' :
                              'bg-amber-50/50 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  rec.recheckResult === 'pass' ? 'bg-green-500 text-white' :
                                  rec.recheckResult === 'fail' ? 'bg-red-500 text-white' :
                                  'bg-amber-500 text-white'
                                }`}>
                                  {rec.recheckResult === 'pass' ? <ThumbsUp className="w-5 h-5" /> :
                                   rec.recheckResult === 'fail' ? <ThumbsDown className="w-5 h-5" /> :
                                   <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h5 className="font-semibold text-slate-800">
                                      {getRecheckTypeLabel(rec.recheckType)}
                                    </h5>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      rec.recheckResult === 'pass' ? 'bg-green-100 text-green-700' :
                                      rec.recheckResult === 'fail' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {rec.recheckResult === 'pass' ? '复查通过' :
                                       rec.recheckResult === 'fail' ? '复查不通过' : '待复查'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {getRecheckTypeIcon(rec.recheckType)} 由 {rec.operator} 于 {rec.timestamp} 执行
                                  </p>
                                </div>
                              </div>
                            </div>

                            {rec.homeownerFeedback && (
                              <div className="mb-3 p-3 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1 font-medium">业主反馈</p>
                                <p className="text-sm text-slate-700 leading-relaxed">「{rec.homeownerFeedback}」</p>
                              </div>
                            )}

                            <div className="p-3 bg-white rounded-lg border border-slate-100">
                              <p className="text-xs text-slate-500 mb-1 font-medium">复查备注</p>
                              <p className="text-sm text-slate-700">{rec.remark}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 mb-3">暂无复查记录</p>
                        <button className="px-4 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          发起电话回访
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-20 text-center">
                  <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">请在左侧选择一个复盘工单查看详情</p>
                </div>
              )}
            </AnimatePresence>
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
                  { name: '陈师傅', rating: 4.2, trend: -0.3, issueCount: 2 },
                  { name: '周师傅', rating: 4.4, trend: -0.1, issueCount: 1 },
                  { name: '王师傅', rating: 4.5, trend: -0.2, issueCount: 1 },
                ].map((w, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {w.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">{w.name}</p>
                        {w.issueCount > 0 && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {w.issueCount}单预警
                          </span>
                        )}
                      </div>
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
