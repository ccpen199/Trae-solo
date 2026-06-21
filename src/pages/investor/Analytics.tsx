import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { investorApi } from '@/lib/api.ts';
import { formatMoney, formatVolume, formatDateTime } from '@/utils/format.ts';
import { BarChart3, Activity, Thermometer, Battery, Wifi, AlertCircle, CheckCircle2, FileDown, Gauge, Droplets } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function InvestorAnalytics() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await investorApi.devices();
        setDevices(result);
        if (result.length > 0) {
          setSelectedDevice(result[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;
    (async () => {
      const [trend, diag, rep] = await Promise.all([
        investorApi.deviceTrend(selectedDevice, 7),
        investorApi.diagnosis(selectedDevice),
        investorApi.diagnosisReport(selectedDevice),
      ]);
      setTrendData(trend);
      setDiagnosis(diag[0] || null);
      setReport(rep);
    })();
  }, [selectedDevice]);

  const selectedDeviceInfo = devices.find((d) => d.id === selectedDevice);

  if (loading) {
    return <AppLayout role="investor"><div className="flex items-center justify-center h-64"><div className="animate-pulse text-deep-blue-700">加载中...</div></div></AppLayout>;
  }

  return (
    <AppLayout role="investor">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800">能耗分析与故障诊断</h2>
          <p className="text-sm text-graphite-500 mt-1">监控设备能耗数据，智能分析运行状态与故障</p>
        </div>

        <div className="glass-card p-4">
          <label className="text-sm text-graphite-500 block mb-2">选择设备</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full md:w-96 px-4 py-3 rounded-xl bg-graphite-50 border-2 border-transparent focus:border-aqua-400 focus:bg-white text-graphite-800 focus:outline-none transition-all"
          >
            {devices.map((d) => (<option key={d.id} value={d.id}>{d.name} - {d.location}</option>))}
          </select>
        </div>

        {selectedDeviceInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-graphite-500">今日用水量</span>
                <Droplets size={18} className="text-aqua-600" />
              </div>
              <p className="text-2xl font-display font-bold text-graphite-800">{formatVolume(selectedDeviceInfo.todayWaterUsage)}</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-graphite-500">今日收益</span>
                <BarChart3 size={18} className="text-vibrant-orange-500" />
              </div>
              <p className="text-2xl font-display font-bold text-vibrant-orange-600">{formatMoney(selectedDeviceInfo.todayRevenue)}</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-graphite-500">累计用水量</span>
                <Activity size={18} className="text-deep-blue-600" />
              </div>
              <p className="text-2xl font-display font-bold text-deep-blue-800">{formatVolume(selectedDeviceInfo.totalWaterUsage)}</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-graphite-500">累计收益</span>
                <Gauge size={18} className="text-green-600" />
              </div>
              <p className="text-2xl font-display font-bold text-green-600">{formatMoney(selectedDeviceInfo.totalRevenue)}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2">
              <Droplets size={18} className="text-aqua-600" />近7日用水量趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="volume" name="用水量(L)" fill="#00B4D8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-vibrant-orange-500" />近7日收益趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="revenue" name="收益(元)" stroke="#FF6B35" strokeWidth={3} dot={{ r: 4, fill: '#FF6B35', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {diagnosis && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-graphite-800 flex items-center gap-2">
                <Activity size={18} className="text-deep-blue-600" />最新运行诊断
                <span className={`ml-2 text-xs px-2.5 py-1 rounded-full ${
                  diagnosis.status === 'normal' ? 'bg-green-100 text-green-700'
                    : diagnosis.status === 'warning' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-vibrant-orange-100 text-vibrant-orange-700'
                }`}>
                  {diagnosis.status === 'normal' ? '运行正常' : diagnosis.status === 'warning' ? '警告' : '故障'}
                </span>
              </h3>
              <span className="text-xs text-graphite-400">{formatDateTime(diagnosis.timestamp)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: '水压', value: `${diagnosis.metrics.waterPressure?.toFixed(2) || '--'} MPa`, icon: <Gauge size={20} />, normal: diagnosis.metrics.waterPressure >= 0.2 && diagnosis.metrics.waterPressure <= 0.5 },
                { label: '水温', value: `${diagnosis.metrics.temperature?.toFixed(1) || '--'}°C`, icon: <Thermometer size={20} />, normal: diagnosis.metrics.temperature >= 40 && diagnosis.metrics.temperature <= 65 },
                { label: '电量', value: `${diagnosis.metrics.batteryLevel?.toFixed(0) || '--'}%`, icon: <Battery size={20} />, normal: diagnosis.metrics.batteryLevel >= 30 },
                { label: '信号', value: `${diagnosis.metrics.signalStrength?.toFixed(0) || '--'} dBm`, icon: <Wifi size={20} />, normal: diagnosis.metrics.signalStrength >= -80 },
              ].map((m, i) => (
                <div key={i} className={`p-4 rounded-xl border ${m.normal ? 'bg-green-50 border-green-100' : 'bg-vibrant-orange-50 border-vibrant-orange-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={m.normal ? 'text-green-600' : 'text-vibrant-orange-600'}>{m.icon}</span>
                    <span className="text-sm text-graphite-600">{m.label}</span>
                    {m.normal ? <CheckCircle2 size={14} className="text-green-600 ml-auto" /> : <AlertCircle size={14} className="text-vibrant-orange-600 ml-auto" />}
                  </div>
                  <p className={`text-xl font-bold ${m.normal ? 'text-green-700' : 'text-vibrant-orange-700'}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {diagnosis.issues && diagnosis.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-graphite-700 mb-3 flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-vibrant-orange-500" />检测到 {diagnosis.issues.length} 个问题
                </h4>
                <div className="space-y-2">
                  {diagnosis.issues.map((issue: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-vibrant-orange-50 border border-vibrant-orange-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-vibrant-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{issue.code}</div>
                        <div className="flex-1">
                          <p className="font-medium text-graphite-800">{issue.description}</p>
                          <p className="text-sm text-graphite-600 mt-1">💡 {issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {report && (
          <div className="glass-card p-6 bg-gradient-to-br from-deep-blue-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-graphite-800 flex items-center gap-2">
                <FileDown size={18} className="text-deep-blue-600" />智能诊断报告
              </h3>
              <button className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1.5">
                <FileDown size={14} />下载PDF报告
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white shadow-sm">
                <p className="text-xs text-graphite-500 mb-1">设备名称</p>
                <p className="font-semibold text-graphite-800">{report.deviceName}</p>
              </div>
              <div className="p-4 rounded-xl bg-white shadow-sm">
                <p className="text-xs text-graphite-500 mb-1">生成时间</p>
                <p className="font-semibold text-graphite-800">{formatDateTime(report.generatedAt)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white shadow-sm">
                <p className="text-xs text-graphite-500 mb-1">整体状态</p>
                <p className={`font-semibold ${report.overallStatus === 'normal' ? 'text-green-600' : report.overallStatus === 'warning' ? 'text-yellow-600' : 'text-vibrant-orange-600'}`}>
                  {report.overallStatus === 'normal' ? '✓ 运行良好' : report.overallStatus === 'warning' ? '⚠ 需要关注' : '✗ 存在故障'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white shadow-sm md:col-span-2">
                <p className="text-xs text-graphite-500 mb-2">维护建议</p>
                <ul className="space-y-1.5">
                  {report.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-graphite-700 flex items-start gap-2">
                      <span className="text-aqua-600 mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
