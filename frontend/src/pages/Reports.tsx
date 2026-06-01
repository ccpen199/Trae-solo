import { useEffect, useState } from 'react';
import {
  Loader2, BarChart3, TrendingUp, Clock, Star, Users, AlertTriangle,
  FileText, MapPin, Plane, Target, Zap, UsersRound, Calendar,
  Phone, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { api, exceptionTypeMap } from '@/lib/api';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate + 'T00:00:00.000Z';
      if (dateRange.endDate) params.endDate = dateRange.endDate + 'T23:59:59.999Z';
      const res = await api.reports(params);
      setData(res.data);
    } catch (e) {
      console.error('Load reports failed:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setDateRange({ startDate: '', endDate: '' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  function formatDuration(seconds: number) {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}小时${mins % 60}分`;
    return `${mins}分钟`;
  }

  const statCards = [
    { label: '工单总数', value: data.totalTickets, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: '已完成', value: data.completedTickets, icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: '完成率', value: `${data.completionRate}%`, icon: BarChart3, color: 'from-emerald-500 to-emerald-600' },
    { label: '异常单', value: data.exceptionTickets, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
    { label: 'SLA达标率', value: `${data.slaComplianceRate}%`, icon: Target, color: 'from-indigo-500 to-indigo-600' },
    { label: '超时工单', value: data.slaOverdueCount, icon: Zap, color: 'from-orange-500 to-orange-600' },
    { label: '升级工单', value: data.escalatedCount, icon: TrendingUp, color: 'from-rose-500 to-rose-600' },
    { label: '回访次数', value: data.totalFeedbackCalls, icon: Phone, color: 'from-cyan-500 to-cyan-600' },
    { label: '需跟进', value: data.followUpNeededCount, icon: Calendar, color: 'from-amber-500 to-amber-600' },
    { label: '平均满意度', value: data.avgSatisfaction, icon: Star, color: 'from-yellow-500 to-yellow-600' },
    { label: '平均响应', value: formatDuration(data.avgResponseSeconds), icon: Clock, color: 'from-purple-500 to-purple-600' },
    { label: '平均解决', value: formatDuration(data.avgResolutionSeconds), icon: Users, color: 'from-teal-500 to-teal-600' },
  ];

  const shiftLabels: Record<string, string> = {
    '早班': '早班 (06-14)',
    '中班': '中班 (14-22)',
    '晚班': '晚班 (22-06)',
    '白班': '白班',
    '未分配': '未分配',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">运营报表</h2>
          <p className="text-sm text-slate-500 mt-1">工单运营数据统计分析，支持机场运营复盘</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">开始日期</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">结束日期</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              统计口径说明
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              异常单数量与运营概览、异常队列保持一致，均来自异常队列表中"待处理/处理中"状态的工单；
              重置日期范围后将显示全部数据。SLA响应时限为15分钟。
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">异常单：<span className="font-bold">{data.exceptionTickets}</span> 条</p>
            <p className="text-xs text-blue-500">已解决：{data.exceptionResolvedTickets} 条</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {statCards.slice(0, 6).map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-md`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.slice(6).map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-md`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600" />
            SLA 响应时长分布
          </h3>
          <div className="space-y-3">
            {data.responseTimeDistribution?.map((item: any, idx: number) => {
              const total = data.responseTimeDistribution?.reduce((s: number, i: any) => s + i.count, 0) || 0;
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              const colors = [
                'from-green-400 to-green-500',
                'from-blue-400 to-blue-500',
                'from-orange-400 to-orange-500',
                'from-red-400 to-red-500',
              ];
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-medium text-slate-600">{item.count} ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[idx]} rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-2xl font-bold">{data.slaComplianceRate}%</span>
              </div>
              <p className="text-xs text-slate-500">达标率</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-2xl font-bold">{data.slaOverdueCount}</span>
              </div>
              <p className="text-xs text-slate-500">超时工单数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-purple-600" />
            服务队列分布
          </h3>
          <div className="space-y-3">
            {data.byQueue?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            ) : (
              data.byQueue?.map((item: any, idx: number) => {
                const max = Math.max(...data.byQueue?.map((a: any) => a.count));
                const percent = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700 truncate">{item.queueName}</span>
                        <span className="text-sm font-medium text-slate-600">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            idx < 3 ? 'bg-gradient-to-r from-purple-400 to-purple-600' : 'bg-gradient-to-r from-slate-400 to-slate-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600" />
            人员班次分布
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.byShift?.map((item: any, idx: number) => {
              const total = data.byShift?.reduce((s: number, i: any) => s + i.count, 0) || 0;
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              const colors = [
                'from-yellow-400 to-orange-500',
                'from-blue-400 to-indigo-500',
                'from-indigo-500 to-purple-600',
                'from-slate-400 to-slate-500',
              ];
              return (
                <div key={idx} className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center mb-2 shadow-md`}>
                    <span className="text-white font-bold text-lg">{item.count}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{shiftLabels[item.shift] || item.shift}</p>
                  <p className="text-xs text-slate-500">{percent.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            服务类型分布
          </h3>
          <div className="space-y-3">
            {data.byServiceType.map((item: any) => {
              const percent = data.totalTickets > 0 ? (item.count / data.totalTickets) * 100 : 0;
              return (
                <div key={item.serviceType}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{item.serviceType}</span>
                    <span className="text-sm font-medium text-slate-600">{item.count} ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            异常类型分布
          </h3>
          <div className="space-y-3">
            {data.byExceptionType?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无异常数据</p>
            ) : (
              data.byExceptionType?.map((item: any, idx: number) => {
                const total = data.byExceptionType?.reduce((s: number, i: any) => s + i.count, 0) || 0;
                const percent = total > 0 ? (item.count / total) * 100 : 0;
                const colors: Record<string, string> = {
                  baggage_delay: 'from-orange-400 to-orange-500',
                  special_assistance: 'from-pink-400 to-pink-500',
                  facility_fault: 'from-amber-400 to-amber-500',
                  complaint_escalation: 'from-red-400 to-red-500',
                  mis_assignment: 'from-purple-400 to-purple-500',
                  other: 'from-slate-400 to-slate-500',
                };
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{exceptionTypeMap[item.type] || item.type}</span>
                      <span className="text-sm font-medium text-slate-600">{item.count} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[item.type] || 'from-slate-400 to-slate-500'} rounded-full transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-600" />
            满意度分布
          </h3>
          <div className="space-y-3">
            {data.satisfactionDistribution?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无评分数据</p>
            ) : (
              data.satisfactionDistribution?.map((item: any) => {
                const total = data.satisfactionDistribution?.reduce((s: number, i: any) => s + i.count, 0) || 0;
                const percent = total > 0 ? (item.count / total) * 100 : 0;
                const colors = [
                  'from-red-400 to-red-500',
                  'from-orange-400 to-orange-500',
                  'from-yellow-400 to-yellow-500',
                  'from-lime-400 to-lime-500',
                  'from-green-400 to-green-500',
                ];
                return (
                  <div key={item.score} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium text-slate-700">{item.score}分</span>
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors[item.score - 1]} rounded-full transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-16 text-right">
                      {item.count} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {data.feedbackAvgSatisfaction || data.avgSatisfaction}
                </span>
              </div>
              <p className="text-xs text-slate-500">平均满意度</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Phone className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{data.totalFeedbackCalls}</span>
              </div>
              <p className="text-xs text-slate-500">回访次数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            热点区域 TOP 10
          </h3>
          <div className="space-y-3">
            {data.byArea.map((item: any, idx: number) => {
              const max = Math.max(...data.byArea.map((a: any) => a.count));
              const percent = max > 0 ? (item.count / max) * 100 : 0;
              return (
                <div key={item.area} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{item.area}</span>
                      <span className="text-sm font-medium text-slate-600">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          idx < 3 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plane className="w-4 h-4 text-indigo-600" />
            航班关联问题
          </h3>
          <div className="space-y-3">
            {data.flightIssues.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            ) : (
              data.flightIssues.map((item: any, idx: number) => {
                const max = Math.max(...data.flightIssues.map((a: any) => a.ticketCount));
                const percent = max > 0 ? (item.ticketCount / max) * 100 : 0;
                return (
                  <div key={item.flightNo} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 font-bold text-xs">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{item.flightNo}</span>
                          <span className="text-xs text-slate-500 ml-2">{item.airline}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.ticketCount} 单</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            人员绩效排行 TOP 10
          </h3>
          <div className="space-y-3">
            {data.staffPerformance?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            ) : (
              data.staffPerformance?.map((item: any, idx: number) => {
                const roleLabels: Record<string, string> = {
                  staff: '地服',
                  cs: '客服',
                  operation: '运营',
                };
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{item.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {roleLabels[item.role] || item.role}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.ticketCount} 单</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>平均解决：{formatDuration(item.avgResolutionSeconds)}</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                          {item.avgSatisfaction ? item.avgSatisfaction.toFixed(1) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-1">
          <h3 className="font-semibold text-slate-700 mb-4">状态分布</h3>
          <div className="space-y-3">
            {data.byStatus.map((item: any) => {
              const statusLabel: Record<string, string> = {
                pending: '待派单', assigned: '已派单', processing: '处理中',
                transferred: '已转交', exception: '异常', completed: '已完成',
                closed: '已结案', cancelled: '已取消',
              };
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{statusLabel[item.status] || item.status}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-1">
          <h3 className="font-semibold text-slate-700 mb-4">优先级分布</h3>
          <div className="space-y-3">
            {data.byPriority.map((item: any) => {
              const priorityLabel: Record<string, string> = { low: '低', normal: '普通', urgent: '紧急', critical: '特急' };
              const colors: Record<string, string> = {
                low: 'bg-slate-500', normal: 'bg-blue-500', urgent: 'bg-orange-500', critical: 'bg-red-500',
              };
              return (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[item.priority]}`} />
                    <span className="text-sm text-slate-600">{priorityLabel[item.priority]}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-1">
          <h3 className="font-semibold text-slate-700 mb-4">航站楼分布</h3>
          <div className="grid grid-cols-3 gap-4">
            {data.byTerminal.map((item: any) => {
              const percent = data.totalTickets > 0 ? (item.count / data.totalTickets) * 100 : 0;
              return (
                <div key={item.terminal} className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-3xl font-bold text-slate-800">{item.terminal}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{item.count}</p>
                  <p className="text-xs text-slate-500 mt-1">{percent.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
