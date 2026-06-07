import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, Activity, Mic, TrendingUp, AlertCircle, 
  Monitor, Play, Shield, ShoppingBag, Clock, Check, X,
  RefreshCw, ChevronRight, Music, Film, Heart
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import * as api from '../api.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [deviceHealth, setDeviceHealth] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingScene, setExecutingScene] = useState(null);
  const [selectedWarning, setSelectedWarning] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [summaryRes, healthRes, scenesRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDeviceHealth(),
        api.getScenes()
      ]);
      
      setSummary(summaryRes.data);
      setDeviceHealth(healthRes.data);
      setScenes(scenesRes.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  }

  async function handleQuickScene(sceneName) {
    const scene = scenes.find(s => s.name === sceneName);
    if (!scene) {
      alert('场景不存在');
      return;
    }
    setExecutingScene(scene.id);
    try {
      await api.executeScene(scene.id);
      await loadData();
    } catch (e) {
      alert('执行场景失败');
    } finally {
      setExecutingScene(null);
    }
  }

  async function handleResolveWarning(deviceId) {
    try {
      await api.controlDevice(deviceId, { power: true });
      await loadData();
      setSelectedWarning(null);
    } catch (e) {
      console.error('Failed to resolve warning:', e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const systemStatusColors = {
    healthy: { bg: 'bg-green-500', text: 'text-green-400', label: '正常' },
    warning: { bg: 'bg-amber-500', text: 'text-amber-400', label: '警告' },
    critical: { bg: 'bg-red-500', text: 'text-red-400', label: '严重' }
  };
  const statusColor = systemStatusColors[summary?.systemStatus] || systemStatusColors.healthy;

  const stats = summary ? [
    { label: '在线设备', value: `${summary.devices.online}/${summary.devices.total}`, icon: Cpu, color: summary.devices.onlineRate >= 80 ? 'blue' : 'red', subtext: `在线率 ${summary.devices.onlineRate}%` },
    { label: '今日能耗', value: `${summary.totalConsumption.toFixed(1)} kWh`, icon: Zap, color: 'amber', subtext: '7日累计' },
    { label: '场景执行', value: summary.executions.today, icon: Activity, color: 'green', subtext: `成功 ${summary.executions.successRate}%` },
    { label: '语音指令', value: summary.voice.commandsToday, icon: Mic, color: 'purple', subtext: `纠错 ${summary.voice.fuzzyCorrected || 0}次` }
  ] : [];

  const quickScenes = [
    { name: '观影模式', desc: '灯光+空调+投影', color: 'purple' },
    { name: '回家模式', desc: '开启客厅设备', color: 'blue' },
    { name: '睡眠模式', desc: '关闭所有灯光', color: 'indigo' },
    { name: '离家模式', desc: '关闭全部设备', color: 'slate' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">家庭智能中枢</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColor.bg}/20 border ${statusColor.bg}/30`}>
              <div className={`w-2 h-2 rounded-full ${statusColor.bg} animate-pulse`} />
              <span className={`text-sm ${statusColor.text}`}>系统{statusColor.label}</span>
            </div>
          </div>
          <p className="text-slate-400 mt-1">实时监控您的智能家居生态</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {summary?.healthWarnings?.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-amber-400" size={20} />
            <span className="text-amber-300 font-medium">健康告警</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.healthWarnings.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const bgColors = {
            blue: 'bg-blue-500/10 text-blue-400',
            amber: 'bg-amber-500/10 text-amber-400',
            green: 'bg-green-500/10 text-green-400',
            purple: 'bg-purple-500/10 text-purple-400',
            red: 'bg-red-500/10 text-red-400'
          };
          
          return (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${bgColors[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">能耗趋势</h3>
              <p className="text-sm text-slate-400">最近7天能耗统计</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-400">{summary?.totalConsumption?.toFixed(1)} <span className="text-sm font-normal text-slate-400">kWh</span></p>
              <p className="text-xs text-slate-500">7日累计</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.energyDailyTrend || []}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [`${value} kWh`, '能耗']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#energyGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-white mb-3">每日能耗明细</h4>
            <div className="grid grid-cols-7 gap-2">
              {summary?.energyDailyTrend?.map((day, i) => (
                <div key={i} className="text-center">
                  <div className="h-20 flex items-end justify-center mb-2">
                    <div 
                      className="w-8 bg-blue-500/30 rounded-t-lg"
                      style={{ height: `${(day.value / 8) * 100}%` }}
                    >
                      <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: '4px' }} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{day.date}</p>
                  <p className="text-sm text-white font-medium">{day.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">房间能耗分布</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.energyByRoom || []}
                  dataKey="value"
                  nameKey="room"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                >
                  {summary?.energyByRoom?.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value) => [`${value} kWh`, '能耗']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {summary?.energyByRoom?.map((room, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300 text-sm">{room.room}</span>
                </div>
                <span className="text-white font-medium">{room.value} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="text-purple-400" size={20} />
            快捷场景
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickScenes.map((scene) => {
              const sceneData = scenes.find(s => s.name === scene.name);
              const isExecuting = executingScene === sceneData?.id;
              return (
                <button 
                  key={scene.name}
                  onClick={() => handleQuickScene(scene.name)}
                  disabled={isExecuting}
                  className={`p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg text-left transition-colors border border-transparent hover:border-slate-600 disabled:opacity-50 ${
                    isExecuting ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-medium">{scene.name}</p>
                    {sceneData && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        执行 {sceneData.execution_count || 0}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{scene.desc}</p>
                  
                  {sceneData && (
                    <>
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">触发条件</p>
                        <code className="text-xs text-blue-300 bg-slate-950 px-2 py-1 rounded block truncate">
                          {sceneData.trigger_expression || '手动触发'}
                        </code>
                      </div>
                      
                      {sceneData.action_queue?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">动作队列 ({sceneData.action_queue.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {sceneData.action_queue.slice(0, 3).map((a, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                                {a.deviceId?.slice(-6) || '设备'}
                              </span>
                            ))}
                            {sceneData.action_queue.length > 3 && (
                              <span className="text-xs text-slate-500">+{sceneData.action_queue.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {sceneData.fallback_plan && Object.keys(sceneData.fallback_plan).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">失败降级预案</p>
                          <p className="text-xs text-amber-300">
                            {sceneData.fallback_plan.description || '已配置'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="mt-3 flex items-center gap-2">
                    <Play size={14} className={isExecuting ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
                    <span className={`text-xs ${isExecuting ? 'text-green-400' : 'text-slate-500'}`}>
                      {isExecuting ? '执行中...' : '点击执行'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">今日执行成功率</span>
              <span className={`text-sm font-medium ${
                summary?.executions.today === 0 ? 'text-slate-500' :
                summary?.executions.successRate >= 80 ? 'text-green-400' :
                summary?.executions.successRate >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {summary?.executions.today === 0 ? '暂无执行' : `${summary?.executions.successRate}%`}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span>成功 {summary?.executions.successful || 0}</span>
              <span>部分 {summary?.executions.partial || 0}</span>
              <span>失败 {summary?.executions.failed || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Heart className="text-red-400" size={20} />
              设备健康状态
            </h3>
            <span className="text-sm text-slate-400">
              平均健康度: {deviceHealth?.summary.avgHealth || 0}%
            </span>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-auto">
            {deviceHealth?.devices?.slice(0, 5).map((device) => (
              <div 
                key={device.id} 
                className={`flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors ${
                  device.warnings?.length > 0 ? 'border border-amber-500/30' : ''
                }`}
                onClick={() => device.warnings?.length > 0 && setSelectedWarning(device)}
              >
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{device.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 flex-shrink-0">
                      {device.protocol.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          device.healthScore >= 80 ? 'bg-green-500' : 
                          device.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${device.healthScore}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400 w-12 text-right flex-shrink-0">{device.healthScore}%</span>
                  </div>
                  {device.warnings?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="text-amber-400 flex-shrink-0" size={12} />
                      <span className="text-xs text-amber-300 truncate">
                        {device.warnings.join('、')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {summary?.healthLogs?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-3">健康事件追踪</p>
              <div className="space-y-2 max-h-[120px] overflow-auto">
                {summary.healthLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {log.status_change?.includes('online') ? (
                        <Check className="text-green-400" size={12} />
                      ) : (
                        <X className="text-red-400" size={12} />
                      )}
                      <span className="text-slate-300">{log.device_name}</span>
                    </div>
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Mic className="text-purple-400" size={24} />
            </div>
            <span className="text-xs text-purple-400">语音控制</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary?.voice.commandsToday || 0}</p>
          <p className="text-sm text-slate-400 mt-1">今日指令</p>
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">模糊纠错</span>
              <span className="text-purple-400">{summary?.voice.fuzzyCorrected || 0}次</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">多轮对话</span>
              <span className="text-purple-400">{summary?.voice.multiTurn || 0}次</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <ShoppingBag className="text-green-400" size={24} />
            </div>
            <span className="text-xs text-green-400">购物账户</span>
          </div>
          <p className="text-2xl font-bold text-white">¥{summary?.shopping.balance?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-slate-400 mt-1">账户余额</p>
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">今日订单</span>
              <span className="text-green-400">{summary?.shopping.ordersToday || 0}单</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">今日消费</span>
              <span className="text-amber-400">¥{summary?.shopping.totalSpent?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Shield className="text-amber-400" size={24} />
            </div>
            <span className="text-xs text-amber-400">儿童模式</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary?.parental?.usagePercent || 0}%</p>
          <p className="text-sm text-slate-400 mt-1">今日使用时长</p>
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  (summary?.parental?.usagePercent || 0) >= 90 ? 'bg-red-500' :
                  (summary?.parental?.usagePercent || 0) >= 70 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${summary?.parental?.usagePercent || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">已用</span>
              <span className="text-amber-400">
                {summary?.parental?.usedTime || 0}/{summary?.parental?.dailyLimit || 0}分钟
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">内容分级</span>
              <span className="text-amber-400">{summary?.parental?.contentRating || '全部'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Film className="text-blue-400" size={24} />
            </div>
            <span className="text-xs text-blue-400">内容服务</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary?.content.total || 0}</p>
          <p className="text-sm text-slate-400 mt-1">可用内容</p>
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">儿童内容</span>
              <span className="text-blue-400">{summary?.content.childrenContent || 0}个</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">版权授权</span>
              <span className="text-green-400">有效</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">CDN分发</span>
              <span className="text-blue-400">正常</span>
            </div>
          </div>
        </div>
      </div>

      {selectedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">健康告警处理</h3>
              <button
                onClick={() => setSelectedWarning(null)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-white font-medium">{selectedWarning.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedWarning.warnings?.map((w, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleResolveWarning(selectedWarning.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Play size={18} />
                  远程唤醒设备
                </button>
                <button
                  onClick={() => setSelectedWarning(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  稍后处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
