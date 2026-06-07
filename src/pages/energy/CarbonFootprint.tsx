import { useEffect, useState } from 'react';
import { Leaf, Calculator, Factory, Home, Building2, Trees, Target, TrendingDown, FileText, X, CheckCircle, Clock, ChevronRight, Zap, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface CarbonResult {
  id: string;
  total: number;
  breakdown: { name: string; value: number; color: string }[];
  offset: number;
  tips: { id: string; title: string; saving: number; status: 'pending' | 'in_progress' | 'completed' }[];
  category: 'individual' | 'enterprise';
  calculatedAt: string;
  targetReduction?: number;
  actualReduction?: number;
}

interface HistoryRecord {
  id: string;
  period: string;
  total: number;
  target: number;
  offset: number;
}

const CARBON_FACTORS = {
  electricity: 0.5839,
  gas: 2.1622,
  car: 0.23,
  airTravel: 0.25,
  publicTransit: 0.05,
  waste: 0.5,
};

const generateHistory = (): HistoryRecord[] => {
  const data: HistoryRecord[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month');
    data.push({
      id: 'h' + i,
      period: date.format('YYYY年MM月'),
      total: 8 + Math.random() * 6,
      target: 12,
      offset: 2 + Math.random() * 2,
    });
  }
  return data;
};

const mockHistory: HistoryRecord[] = generateHistory();

export default function CarbonFootprint() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState<'individual' | 'enterprise'>('individual');
  const [electricity, setElectricity] = useState('');
  const [gas, setGas] = useState('');
  const [carMileage, setCarMileage] = useState('');
  const [airTravel, setAirTravel] = useState('');
  const [employees, setEmployees] = useState('');
  const [operatingDays, setOperatingDays] = useState('');
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>(mockHistory);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculate' | 'history' | 'target'>('calculate');
  const [showResultDetail, setShowResultDetail] = useState<CarbonResult | null>(null);
  const [carbonTarget, setCarbonTarget] = useState('10');
  const [savedRecords, setSavedRecords] = useState<CarbonResult[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<CarbonResult[]>('/energy/carbon/history');
        if (res.length > 0) setSavedRecords(res);
      } catch {
        // use empty
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<CarbonResult>('/energy/carbon/calculate', {
        category,
        electricity: parseFloat(electricity),
        gas: parseFloat(gas),
        carMileage: parseFloat(carMileage),
        airTravel: parseFloat(airTravel),
        employees: employees ? parseInt(employees) : undefined,
        operatingDays: operatingDays ? parseInt(operatingDays) : undefined,
      });
      setResult({ ...res, category, calculatedAt: dayjs().format('YYYY-MM-DD') });
    } catch {
      const elec = parseFloat(electricity) || 0;
      const g = parseFloat(gas) || 0;
      const car = parseFloat(carMileage) || 0;
      const air = parseFloat(airTravel) || 0;
      const emp = parseInt(employees) || 0;
      const days = parseInt(operatingDays) || 250;

      const elecCarbon = elec * CARBON_FACTORS.electricity / 1000;
      const gasCarbon = g * CARBON_FACTORS.gas / 1000;
      const carCarbon = car * CARBON_FACTORS.car / 1000;
      const airCarbon = air * CARBON_FACTORS.airTravel / 1000;
      const officeCarbon = category === 'enterprise' ? emp * days * 0.005 : 0;
      const total = elecCarbon + gasCarbon + carCarbon + airCarbon + officeCarbon;

      const newResult: CarbonResult = {
        id: 'c' + Date.now(),
        total,
        breakdown: [
          { name: '用电', value: elecCarbon, color: '#1a3a5c' },
          { name: '燃气', value: gasCarbon, color: '#f59e0b' },
          { name: '汽车', value: carCarbon, color: '#ef4444' },
          { name: '航空', value: airCarbon, color: '#3b82f6' },
          ...(category === 'enterprise' ? [{ name: '办公', value: officeCarbon, color: '#8b5cf6' }] : []),
        ].filter((b) => b.value > 0),
        offset: total * 0.3,
        tips: [
          { id: '1', title: '使用绿色电力', saving: total * 0.4, status: 'pending' },
          { id: '2', title: '优化空调使用', saving: total * 0.15, status: 'pending' },
          { id: '3', title: '推广绿色出行', saving: total * 0.1, status: 'pending' },
          { id: '4', title: '无纸化办公', saving: total * 0.05, status: 'pending' },
          { id: '5', title: '安装光伏系统', saving: total * 0.25, status: 'pending' },
        ],
        category,
        calculatedAt: dayjs().format('YYYY-MM-DD'),
        targetReduction: parseFloat(carbonTarget),
      };
      setResult(newResult);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = () => {
    if (!result) return;
    setSavedRecords((prev) => [result, ...prev]);
    setActiveTab('history');
  };

  const updateTipStatus = (tipId: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!result) return;
    const updatedTips = result.tips.map((t) => (t.id === tipId ? { ...t, status } : t));
    setResult({ ...result, tips: updatedTips });
  };

  const getTipStatusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green';
    if (s === 'in_progress') return 'badge-amber';
    return 'badge-gray';
  };
  const getTipStatusLabel = (s: string) => {
    if (s === 'completed') return '已实施';
    if (s === 'in_progress') return '进行中';
    return '待实施';
  };

  const totalPotentialSaving = result?.tips.reduce((sum, t) => sum + t.saving, 0) || 0;
  const completedSaving = result?.tips.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.saving, 0) || 0;
  const achievementRate = totalPotentialSaving > 0 ? Math.round((completedSaving / totalPotentialSaving) * 100) : 0;

  if (loading && !result) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Leaf size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">碳足迹</h1>
            <p className="page-desc">计算碳排放，设定减排目标，追踪碳中和进度</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setCategory('individual'); setResult(null); }}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 ${category === 'individual' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
        >
          <Home size={16} /> 个人/家庭
        </button>
        <button
          onClick={() => { setCategory('enterprise'); setResult(null); }}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 ${category === 'enterprise' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
        >
          <Building2 size={16} /> 企业/园区
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('calculate')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'calculate' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Calculator size={16} className="inline mr-1.5" /> 碳足迹计算
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'history' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <TrendingDown size={16} className="inline mr-1.5" /> 历史趋势
        </button>
        <button
          onClick={() => setActiveTab('target')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'target' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Target size={16} className="inline mr-1.5" /> 减排目标
        </button>
      </div>

      {activeTab === 'calculate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Calculator size={20} className="text-csg-green" />
              碳排放计算器
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  月均用电量 (kWh)
                </label>
                <input
                  type="number"
                  value={electricity}
                  onChange={(e) => setElectricity(e.target.value)}
                  placeholder="请输入月均用电量"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  月均燃气用量 (m³)
                </label>
                <input
                  type="number"
                  value={gas}
                  onChange={(e) => setGas(e.target.value)}
                  placeholder="请输入月均燃气用量"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  月均驾车里程 (km)
                </label>
                <input
                  type="number"
                  value={carMileage}
                  onChange={(e) => setCarMileage(e.target.value)}
                  placeholder="请输入月均驾车里程"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  年均航空里程 (km)
                </label>
                <input
                  type="number"
                  value={airTravel}
                  onChange={(e) => setAirTravel(e.target.value)}
                  placeholder="请输入年均航空里程"
                  className="input-field"
                />
              </div>
              {category === 'enterprise' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      员工人数
                    </label>
                    <input
                      type="number"
                      value={employees}
                      onChange={(e) => setEmployees(e.target.value)}
                      placeholder="请输入员工人数"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      年运营天数
                    </label>
                    <input
                      type="number"
                      value={operatingDays}
                      onChange={(e) => setOperatingDays(e.target.value)}
                      placeholder="250"
                      className="input-field"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  年度减排目标 (吨)
                </label>
                <input
                  type="number"
                  value={carbonTarget}
                  onChange={(e) => setCarbonTarget(e.target.value)}
                  placeholder="10"
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-secondary w-full py-2.5">
                {loading ? '计算中...' : '计算碳足迹'}
              </button>
            </form>

            {result && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button onClick={handleSaveRecord} className="btn-secondary flex-1">
                    保存记录
                  </button>
                  <button onClick={() => setShowResultDetail(result)} className="btn-outline flex-1">
                    查看详情
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">计算结果</h3>
            {result ? (
              <div className="space-y-5">
                <div className="text-center p-5 rounded-lg bg-gradient-to-r from-csg-green/10 to-csg-green/5 dark:from-csg-green/20 dark:to-csg-green/10">
                  <p className="text-sm text-gray-500 dark:text-gray-400">年度碳排放量</p>
                  <p className="text-4xl font-bold text-csg-green mt-1">{result.total.toFixed(1)} <span className="text-lg">吨</span></p>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      目标: <span className="text-csg-green font-medium">{carbonTarget} 吨</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      需种树: <span className="font-medium">{Math.round(result.total / 0.018)} 棵</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">已抵消</p>
                    <p className="text-lg font-bold text-csg-green">{result.offset.toFixed(1)} 吨</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">可减排</p>
                    <p className="text-lg font-bold text-csg-amber">{totalPotentialSaving.toFixed(1)} 吨</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">净排放</p>
                    <p className="text-lg font-bold text-csg-navy dark:text-white">{(result.total - result.offset).toFixed(1)} 吨</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">排放构成</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.breakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(v) => `${Number(v).toFixed(2)} 吨`} />
                        {result.breakdown.map((entry, i) => (
                          <Bar key={i} dataKey="value" fill={entry.color} name={entry.name} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trees size={18} className="text-csg-green" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">减碳建议</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      完成率 {achievementRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-csg-green rounded-full transition-all" style={{ width: `${achievementRate}%` }} />
                  </div>
                  <div className="space-y-2">
                    {result.tips.map((tip) => (
                      <div
                        key={tip.id}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => {
                          const nextStatus = tip.status === 'pending' ? 'in_progress' : tip.status === 'in_progress' ? 'completed' : 'pending';
                          updateTipStatus(tip.id, nextStatus);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {tip.status === 'completed' ? (
                            <CheckCircle size={14} className="text-csg-green" />
                          ) : tip.status === 'in_progress' ? (
                            <Clock size={14} className="text-csg-amber" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                          <span className={`${tip.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {tip.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-csg-green font-medium">-{tip.saving.toFixed(1)} 吨</span>
                          <span className={getTipStatusBadge(tip.status)}>{getTipStatusLabel(tip.status)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} className="text-csg-amber" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">碳中和路径</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400">当前排放</span>
                        <span className="font-medium">{result.total.toFixed(1)} 吨</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-full bg-csg-amber rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <Zap size={16} className="mx-auto text-csg-green mb-0.5" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">减排措施</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400">目标排放</span>
                        <span className="font-medium text-csg-green">{parseFloat(carbonTarget)} 吨</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-full bg-csg-green rounded-full" style={{ width: `${Math.min(100, (parseFloat(carbonTarget) / result.total) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                <Factory size={56} className="mb-4 opacity-30" />
                <p>请输入数据并计算碳足迹</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">碳排放趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)} 吨`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="实际排放" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="target" name="目标值" stroke="#1a3a5c" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="offset" name="碳抵消" stroke="#00a651" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <Leaf size={18} className="text-csg-green mb-1" />
              <span className="stat-label">本月排放</span>
              <span className="stat-value">{history[history.length - 1]?.total.toFixed(1) || 0} 吨</span>
            </div>
            <div className="stat-card">
              <TrendingDown size={18} className="text-csg-green mb-1" />
              <span className="stat-label">环比变化</span>
              <span className="stat-value text-csg-green">
                {history.length >= 2 ? ((history[history.length - 1].total - history[history.length - 2].total) / history[history.length - 2].total * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="stat-card">
              <Trees size={18} className="text-csg-amber mb-1" />
              <span className="stat-label">累计抵消</span>
              <span className="stat-value text-csg-amber">{history.reduce((s, h) => s + h.offset, 0).toFixed(1)} 吨</span>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">历史计算记录</h3>
            {savedRecords.length > 0 ? (
              <div className="space-y-3">
                {savedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowResultDetail(record)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-csg-green/10 flex items-center justify-center">
                          <Calculator size={18} className="text-csg-green" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {record.category === 'enterprise' ? '企业/园区' : '个人/家庭'} · {record.total.toFixed(1)} 吨
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            计算时间: {record.calculatedAt}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>暂无保存的记录，请先计算并保存碳足迹</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'target' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Target size={20} className="text-csg-green" />
                设定减排目标
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    年度减排目标 (吨 CO₂)
                  </label>
                  <input
                    type="number"
                    value={carbonTarget}
                    onChange={(e) => setCarbonTarget(e.target.value)}
                    className="input-field text-2xl font-bold text-center py-4"
                    placeholder="10"
                  />
                </div>
                <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    设定科学合理的减排目标，逐步实现碳中和。建议参考：
                  </p>
                  <ul className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• 个人用户: 每年减少 2-5 吨碳排放</li>
                    <li>• 家庭用户: 每年减少 5-10 吨碳排放</li>
                    <li>• 企业用户: 根据规模设定 50-500 吨目标</li>
                    <li>• 园区用户: 根据能耗设定 500-2000 吨目标</li>
                  </ul>
                </div>
                <button className="btn-secondary w-full py-2.5">
                  保存目标
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-5">目标达成进度</h3>
              <div className="space-y-5">
                <div className="text-center p-5 rounded-lg bg-gradient-to-r from-csg-navy/10 to-csg-green/10 dark:from-csg-navy/20 dark:to-csg-green/20">
                  <p className="text-sm text-gray-500 dark:text-gray-400">当前年度排放</p>
                  <p className="text-4xl font-bold text-csg-navy dark:text-white mt-1">{history[history.length - 1]?.total.toFixed(1) || 0} <span className="text-lg">吨</span></p>
                  <p className="text-sm text-csg-green mt-2">
                    目标: {carbonTarget} 吨 · 差距: {(Math.max(0, (history[history.length - 1]?.total || 0) - parseFloat(carbonTarget))).toFixed(1)} 吨
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">目标完成度</span>
                      <span className="font-medium text-csg-green">
                        {Math.min(100, Math.round((parseFloat(carbonTarget) / (history[history.length - 1]?.total || 1)) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-csg-green to-csg-navy rounded-full transition-all"
                        style={{ width: `${Math.min(100, (parseFloat(carbonTarget) / (history[history.length - 1]?.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">需种植树木</p>
                      <p className="text-xl font-bold text-csg-green">{Math.round((history[history.length - 1]?.total || 0) / 0.018)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">需减少用电</p>
                      <p className="text-xl font-bold text-csg-amber">{Math.round((history[history.length - 1]?.total || 0) / CARBON_FACTORS.electricity * 1000)} kWh</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">碳中和行动清单</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: '更换绿色电力供应商', desc: '选择可再生能源电力，直接减少碳排放', impact: '高', saving: '3-5 吨/年' },
                { title: '安装家用光伏', desc: '自发自用清洁能源，剩余电量上网', impact: '高', saving: '4-8 吨/年' },
                { title: '购买碳汇', desc: '通过碳交易市场购买碳汇额度', impact: '中', saving: '灵活' },
                { title: '参与植树造林', desc: '参与官方植树造林项目获取碳汇', impact: '中', saving: '0.018 吨/棵' },
                { title: '节能改造', desc: '更换节能设备、优化建筑隔热', impact: '高', saving: '2-4 吨/年' },
                { title: '绿色出行', desc: '使用公共交通、电动汽车或骑行', impact: '中', saving: '1-3 吨/年' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-csg-green/10 flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-csg-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs ${item.impact === '高' ? 'text-csg-red' : 'text-csg-amber'}`}>
                          {item.impact}影响
                        </span>
                        <span className="text-xs text-csg-green">{item.saving}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResultDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">碳足迹详情</h3>
              <button onClick={() => setShowResultDetail(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="text-center p-5 rounded-lg bg-gradient-to-r from-csg-green/10 to-csg-green/5 dark:from-csg-green/20 dark:to-csg-green/10">
                <p className="text-sm text-gray-500 dark:text-gray-400">年度碳排放量</p>
                <p className="text-4xl font-bold text-csg-green mt-1">{showResultDetail.total.toFixed(1)} <span className="text-lg">吨</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {showResultDetail.category === 'enterprise' ? '企业/园区' : '个人/家庭'} · 计算于 {showResultDetail.calculatedAt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {showResultDetail.breakdown.map((b, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{b.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{b.value.toFixed(2)} 吨</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(b.value / showResultDetail.total) * 100}%`, backgroundColor: b.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">减碳建议</h4>
                <div className="space-y-2">
                  {showResultDetail.tips.map((tip) => (
                    <div key={tip.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-gray-300">{tip.title}</span>
                      <span className="text-csg-green font-medium">-{tip.saving.toFixed(1)} 吨</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
