import { useEffect, useState } from 'react';
import { reportApi } from '../lib/api';
import type { ReportSummary } from '../../shared/types.js';
import { Download, TrendingUp, Users, Gift, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function ReportPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [prizeData, setPrizeData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, [selectedActivity]);

  const loadData = async () => {
    try {
      setLoading(true);
      const activityId = selectedActivity ? Number(selectedActivity) : undefined;
      const [reportRes, trendRes, prizeRes, channelRes] = await Promise.all([
        reportApi.getSummary(activityId),
        reportApi.getTrend(7, activityId),
        reportApi.getPrizeDistribution(activityId),
        reportApi.getChannelDistribution(activityId),
      ]);

      if (reportRes.data.code === 200) {
        setReports(Array.isArray(reportRes.data.data) ? reportRes.data.data : [reportRes.data.data]);
      }
      if (trendRes.data.code === 200) {
        setTrendData(trendRes.data.data || []);
      }
      if (prizeRes.data.code === 200) {
        setPrizeData(prizeRes.data.data || []);
      }
      if (channelRes.data.code === 200) {
        setChannelData(channelRes.data.data || []);
      }
    } catch (error) {
      console.error('Load reports failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const activityId = selectedActivity ? Number(selectedActivity) : undefined;
      const res = await reportApi.export(activityId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const totalStats = reports.length > 0 ? reports.reduce((acc, r) => ({
    totalParticipants: acc.totalParticipants + r.totalParticipants,
    uniqueUsers: acc.uniqueUsers + r.uniqueUsers,
    totalWinCount: acc.totalWinCount + r.totalWinCount,
    totalCost: acc.totalCost + r.totalCost,
    drawCount: acc.drawCount + r.drawCount,
  }), {
    totalParticipants: 0,
    uniqueUsers: 0,
    totalWinCount: 0,
    totalCost: 0,
    drawCount: 0,
  }) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据报表</h1>
          <p className="text-gray-500 mt-1">活动运营数据复盘分析</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value as number | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部活动</option>
            {reports.map((r) => (
              <option key={r.activityId} value={r.activityId}>
                {r.activityName || `活动 #${r.activityId}`}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            <Download size={18} />
            导出CSV
          </button>
        </div>
      </div>

      {totalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">参与人次</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.totalParticipants.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">独立用户</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.uniqueUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">中奖数量</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.totalWinCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">奖品总成本</p>
                <p className="text-2xl font-bold text-gray-800">¥{totalStats.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            参与趋势
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="participants" stroke="#3B82F6" strokeWidth={2} name="参与人数" />
                <Line type="monotone" dataKey="draws" stroke="#8B5CF6" strokeWidth={2} name="抽奖次数" />
                <Line type="monotone" dataKey="wins" stroke="#10B981" strokeWidth={2} name="中奖次数" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            奖品分布
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={prizeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">渠道分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 p-6 border-b">活动明细报表</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">活动</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">参与人次</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">独立用户</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">抽奖次数</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">中奖数</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">中奖率</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">总成本</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">发放率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => (
              <tr key={report.activityId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">
                  {report.activityName || `活动 #${report.activityId}`}
                </td>
                <td className="px-6 py-4 text-center text-gray-600">{report.totalParticipants.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-gray-600">{report.uniqueUsers.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-gray-600">{report.drawCount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-gray-600">{report.totalWinCount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-medium">{(report.winRate * 100).toFixed(2)}%</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-800 font-medium">¥{report.totalCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-blue-600 font-medium">{(report.distributionRate * 100).toFixed(2)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
