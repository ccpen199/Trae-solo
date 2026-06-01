import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const TABS = [
  { key: 'swap-frequency', label: '换电频次' },
  { key: 'battery-turnover', label: '电池周转' },
  { key: 'station-load', label: '站点负载' },
  { key: 'fault-rate', label: '故障率' },
  { key: 'revenue', label: '收入分布' },
];

const ALERT_TYPE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];
const SEVERITY_COLORS = { low: '#9ca3af', medium: '#eab308', high: '#f97316', critical: '#ef4444' };

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

function buildParams(extra = {}) {
  const range = defaultDateRange();
  const params = new URLSearchParams();
  if (extra.start_date || range.start_date) params.set('start_date', extra.start_date || range.start_date);
  if (extra.end_date || range.end_date) params.set('end_date', extra.end_date || range.end_date);
  if (extra.group_by) params.set('group_by', extra.group_by);
  return params.toString();
}

function SwapFrequencyTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(defaultDateRange().start_date);
  const [endDate, setEndDate] = useState(defaultDateRange().end_date);
  const [groupBy, setGroupBy] = useState('day');

  const fetch = useCallback(() => {
    setLoading(true);
    api.getSwapFrequency(buildParams({ start_date: startDate, end_date: endDate, group_by: groupBy }))
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate, groupBy]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">分组</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </div>
        <button onClick={fetch}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">查询</button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">加载中...</p> : (
        <>
          <div className="bg-white rounded-xl shadow p-4" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="换电次数" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr><th className="px-4 py-2 text-left">时间段</th><th className="px-4 py-2 text-right">换电次数</th><th className="px-4 py-2 text-right">平均费用</th></tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2 text-right">{r.count}</td>
                    <td className="px-4 py-2 text-right">{r.avg_fee}</td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-400">暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function BatteryTurnoverTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getBatteryTurnover(buildParams())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? <p className="text-gray-400 text-sm">加载中...</p> : (
        <>
          <div className="bg-white rounded-xl shadow p-4" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="battery_code" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="swap_count" fill="#8b5cf6" name="换电次数" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">电池编号</th>
                  <th className="px-4 py-2 text-right">换电次数</th>
                  <th className="px-4 py-2 text-right">利用率</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{r.battery_code}</td>
                    <td className="px-4 py-2 text-right">{r.swap_count}</td>
                    <td className="px-4 py-2 text-right">{r.utilization_rate}%</td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-400">暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StationLoadTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getStationLoad(buildParams())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">加载中...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(s => (
        <div key={s.station_id} className="bg-white rounded-xl shadow p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">{s.station_name}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">总换电</div>
              <div className="text-xl font-bold text-gray-800">{s.total_swaps}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">高峰时段</div>
              <div className="text-xl font-bold text-gray-800">{s.peak_hour != null ? `${s.peak_hour}:00` : '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">平均等待</div>
              <div className="text-xl font-bold text-gray-800">{s.avg_wait_minutes}<span className="text-sm font-normal ml-1">分钟</span></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">负载率</div>
              <div className="text-xl font-bold text-gray-800">{s.load_rate}%</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>负载</span><span>{s.load_rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="h-2.5 rounded-full" style={{
                width: `${Math.min(s.load_rate, 100)}%`,
                backgroundColor: s.load_rate > 80 ? '#ef4444' : s.load_rate > 50 ? '#f97316' : '#22c55e',
              }} />
            </div>
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-12">暂无数据</p>}
    </div>
  );
}

function FaultRateTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getFaultRate(buildParams())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">加载中...</p>;
  if (!data) return <p className="text-gray-400 text-sm">暂无数据</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="text-gray-500 text-sm">总换电次数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.total_swaps}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="text-gray-500 text-sm">失败次数</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{data.failed_swaps}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="text-gray-500 text-sm">故障率</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{data.failure_rate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">告警类型分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.alerts_by_type} dataKey="count" nameKey="alert_type" cx="50%" cy="50%" outerRadius={90} label>
                {data.alerts_by_type.map((_, i) => (
                  <Cell key={i} fill={ALERT_TYPE_COLORS[i % ALERT_TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">告警严重度分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.alerts_by_severity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} label>
                {data.alerts_by_severity.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.severity] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RevenueTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getRevenue(buildParams())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? <p className="text-gray-400 text-sm">加载中...</p> : (
        <>
          <div className="bg-white rounded-xl shadow p-4" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_fee" stroke="#3b82f6" name="总费用" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actual_fee" stroke="#22c55e" name="实收费用" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">时间段</th>
                  <th className="px-4 py-2 text-right">总费用</th>
                  <th className="px-4 py-2 text-right">实收费用</th>
                  <th className="px-4 py-2 text-right">优惠金额</th>
                  <th className="px-4 py-2 text-right">会员节省</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2 text-right">{r.total_fee}</td>
                    <td className="px-4 py-2 text-right">{r.actual_fee}</td>
                    <td className="px-4 py-2 text-right">{r.discount_amount}</td>
                    <td className="px-4 py-2 text-right">{r.member_savings}</td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-gray-400">暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const TAB_COMPONENTS = {
  'swap-frequency': SwapFrequencyTab,
  'battery-turnover': BatteryTurnoverTab,
  'station-load': StationLoadTab,
  'fault-rate': FaultRateTab,
  'revenue': RevenueTab,
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">运营报表</h2>

      <div className="flex gap-1 border-b">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabComponent key={activeTab} />
    </div>
  );
}
